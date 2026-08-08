"""Read procurement line items from an opentender.net OCDS bulk dump.

Legal-register row: ``opentender-ocds`` (ODbL, attribution required, commercial
use permitted). See ``docs/data/legal-register.md`` — the merge gate — and
``docs/data/sources.md`` for what the dump does and does not contain.

**This is a file adapter, not an HTTP adapter.** ICW publishes opentender data
as downloadable OCDS bulk files, not a paginated API, and a national dump is
gigabytes. You download it out of band (it never streams through the pipeline,
and it is never committed — ``data/`` is gitignored) and point this adapter at
the directory. That is the same posture as ``local_csv``: the network step
happens by hand, the adapter only parses.

The open question this adapter exists to answer is whether the award ``items``
actually carry a **unit price** (``items[].unit.value.amount``) and a
``quantity``. If they do, Pelintir gets unit prices under ODbL without touching
the e-Katalog storefront at all (ADR-0006). If they do not, that is a verified
fact, not a guess. Run ``scripts/check_ocds_fields.py`` against a real dump to
find out — see that script's header.

OCDS shape handled (release, record, and package forms, plain or gzipped,
whole-file JSON or newline-delimited):

    package  -> {"releases": [release, ...]}  or  {"records": [record, ...]}
    record   -> {"compiledRelease": release}  or  {"releases": [release, ...]}
    release  -> {"ocid": ..., "tender": {...}, "awards": [{"items": [...]}, ...]}

One record is yielded per award *line item*, per the Source protocol. Values are
written exactly as received: nothing is cleaned, renamed, or synthesised, and a
field the dump does not carry stays null (ADR-0009). In particular OCDS has no
per-line total, so ``total_price`` is left null rather than derived from
``quantity * unit_price`` — that inference belongs downstream, where it is tested.
"""

import gzip
import json
from collections.abc import Iterator
from pathlib import Path
from typing import Any

_JSON_SUFFIXES = (".json", ".jsonl", ".ndjson")


def _open_text(path: Path):
    """Open a dump file, transparently decompressing a ``.gz`` layer."""
    if path.suffix == ".gz":
        return gzip.open(path, "rt", encoding="utf-8")
    return path.open("rt", encoding="utf-8")


def _is_ndjson(path: Path) -> bool:
    stem_suffix = path.suffixes[-2] if path.suffix == ".gz" else path.suffix
    return stem_suffix in (".jsonl", ".ndjson")


def _releases_from_object(obj: Any) -> Iterator[dict]:
    """Yield OCDS releases from any of the shapes a dump line/file can take."""
    if not isinstance(obj, dict):
        return
    if "releases" in obj and isinstance(obj["releases"], list):
        # Release package, or a record whose releases are inline.
        for release in obj["releases"]:
            if isinstance(release, dict):
                yield release
    elif "records" in obj and isinstance(obj["records"], list):
        # Record package: each record may carry a compiledRelease or releases.
        for record in obj["records"]:
            if isinstance(record, dict):
                yield from _releases_from_object(record)
    elif "compiledRelease" in obj and isinstance(obj["compiledRelease"], dict):
        yield obj["compiledRelease"]
    elif "ocid" in obj or "awards" in obj or "tender" in obj:
        # A bare release.
        yield obj


def iter_releases(root: Path, pattern: str = "*") -> Iterator[dict]:
    """Yield every OCDS release under ``root``.

    ``root`` may be a single file or a directory of dumps. Newline-delimited
    files (``.jsonl`` / ``.ndjson``, optionally gzipped) are streamed a line at a
    time so a multi-gigabyte dump never has to fit in memory; whole-file JSON is
    parsed in one read.
    """
    root = Path(root)
    if root.is_file():
        paths = [root]
    else:
        paths = sorted(
            p
            for p in root.glob(pattern)
            if p.is_file()
            and (p.suffix in _JSON_SUFFIXES or p.suffixes[-2:-1] == [".json"] or p.suffix == ".gz")
        )

    for path in paths:
        with _open_text(path) as handle:
            if _is_ndjson(path):
                for line in handle:
                    line = line.strip()
                    if not line:
                        continue
                    yield from _releases_from_object(json.loads(line))
            else:
                yield from _releases_from_object(json.load(handle))


def _award_year(award: dict, release: dict) -> int | None:
    """The fiscal year an award belongs to, from its date, falling back to the
    release date. OCDS dates are ISO 8601, so the year is the leading four digits.
    """
    for date in (award.get("date"), release.get("date")):
        if isinstance(date, str) and len(date) >= 4 and date[:4].isdigit():
            return int(date[:4])
    return None


def _first_supplier(award: dict) -> str | None:
    suppliers = award.get("suppliers")
    if isinstance(suppliers, list) and suppliers:
        name = suppliers[0].get("name") if isinstance(suppliers[0], dict) else None
        return name
    return None


def _buyer_name(release: dict) -> str | None:
    buyer = release.get("buyer")
    if isinstance(buyer, dict) and buyer.get("name"):
        return buyer["name"]
    tender = release.get("tender")
    if isinstance(tender, dict):
        entity = tender.get("procuringEntity")
        if isinstance(entity, dict):
            return entity.get("name")
    return None


def iter_award_items(release: dict) -> Iterator[tuple[dict, dict, int]]:
    """Yield ``(award, item, line_no)`` for each line item in each award.

    ``line_no`` is 1-based within an award. This is the single place that walks
    ``awards[].items[]``, so the adapter and the field-check script agree on what
    a "line item" is.
    """
    awards = release.get("awards")
    if not isinstance(awards, list):
        return
    for award in awards:
        if not isinstance(award, dict):
            continue
        items = award.get("items")
        if not isinstance(items, list):
            continue
        for line_no, item in enumerate(items, start=1):
            if isinstance(item, dict):
                yield award, item, line_no


class OpentenderOcdsSource:
    """Line items from a downloaded opentender.net OCDS dump.

    Implements legal-register row ``opentender-ocds``. Point it at a directory
    (or single file) of OCDS releases/records; it emits one raw record per award
    line item for the requested fiscal year.
    """

    name = "opentender_ocds"

    def __init__(self, root: Path, pattern: str = "*") -> None:
        self.root = Path(root)
        self.pattern = pattern

    def fetch(self, fiscal_year: int, category: str | None = None) -> Iterator[dict]:
        needle = category.lower() if category else None
        for release in iter_releases(self.root, self.pattern):
            ocid = release.get("ocid")
            tender = release.get("tender") if isinstance(release.get("tender"), dict) else {}
            package_title = tender.get("title")
            buyer = _buyer_name(release)

            for award, item, line_no in iter_award_items(release):
                if _award_year(award, release) != fiscal_year:
                    continue

                description = item.get("description")
                if needle is not None and not (description and needle in description.lower()):
                    continue

                unit = item.get("unit") if isinstance(item.get("unit"), dict) else {}
                unit_value = unit.get("value") if isinstance(unit.get("value"), dict) else {}

                # Written exactly as received. OCDS has no per-line total, so
                # total_price stays null — never quantity * unit_price. The
                # currency, ocid and award date are preserved as extra columns.
                yield {
                    "source": self.name,
                    "source_id": award.get("id") or ocid,
                    "fiscal_year": fiscal_year,
                    "agency_name": buyer,
                    "vendor_name": _first_supplier(award),
                    "package_title": package_title,
                    "line_no": line_no,
                    "item_description": description,
                    "unit": unit.get("name"),
                    "quantity": item.get("quantity"),
                    "unit_price": unit_value.get("amount"),
                    "total_price": None,
                    "source_url": release.get("url") or (tender.get("url") if tender else None),
                    # Preserved extras — the raw layer is an audit trail.
                    "ocid": ocid,
                    "award_id": award.get("id"),
                    "award_date": award.get("date"),
                    "currency": unit_value.get("currency"),
                    "item_classification": (
                        item.get("classification", {}).get("id")
                        if isinstance(item.get("classification"), dict)
                        else None
                    ),
                }
