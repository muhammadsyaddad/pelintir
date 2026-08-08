#!/usr/bin/env python
"""Does an opentender.net OCDS dump carry unit prices?

This answers the single most valuable open question in the project (see
docs/data/sources.md, "The central problem"): the registry reports ~1.09M award
*items*, but does each item populate ``unit.value.amount`` (a unit price) and
``quantity``? If it does, Pelintir gets unit prices under ODbL without ever
touching the e-Katalog storefront (ADR-0006). If it does not, that becomes a
verified fact in sources.md instead of a guess.

The proxy in this environment blocks opentender.net, so download the dump out of
band and run this against the local files. Nothing here is committed — the dump
lives under gitignored ``data/``.

    uv run python scripts/check_ocds_fields.py <path-to-dump-dir-or-file>
    uv run python scripts/check_ocds_fields.py data/raw-dumps/opentender --samples 10

It reports, over every award line item found:
  * how many items exist at all
  * how many carry a non-null unit.value.amount, and how many are > 0
  * how many carry a quantity
  * the currencies seen
  * a handful of concrete sample values, so the shape is legible, not just counted

Read-only. It parses; it writes nothing.
"""

import argparse
import sys
from collections import Counter
from pathlib import Path

# Import the exact same OCDS walkers the adapter uses, so "an award line item"
# means the same thing here and in ingestion.
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from pipeline.sources.opentender_ocds import iter_award_items, iter_releases  # noqa: E402


def _amount(item: dict):
    unit = item.get("unit") if isinstance(item.get("unit"), dict) else {}
    value = unit.get("value") if isinstance(unit.get("value"), dict) else {}
    return value.get("amount"), value.get("currency")


def check(root: Path, sample_size: int) -> dict:
    releases = 0
    awards = 0
    items = 0
    with_amount = 0
    positive_amount = 0
    with_quantity = 0
    currencies: Counter[str] = Counter()
    samples: list[dict] = []

    for release in iter_releases(root):
        releases += 1
        seen_award_ids: set[int] = set()
        for award, item, line_no in iter_award_items(release):
            award_key = id(award)
            if award_key not in seen_award_ids:
                seen_award_ids.add(award_key)
                awards += 1
            items += 1

            amount, currency = _amount(item)
            quantity = item.get("quantity")

            if amount is not None:
                with_amount += 1
                try:
                    if float(amount) > 0:
                        positive_amount += 1
                except (TypeError, ValueError):
                    pass
            if currency:
                currencies[currency] += 1
            if quantity is not None:
                with_quantity += 1

            if len(samples) < sample_size and amount is not None:
                samples.append(
                    {
                        "ocid": release.get("ocid"),
                        "line_no": line_no,
                        "description": item.get("description"),
                        "quantity": quantity,
                        "unit_amount": amount,
                        "currency": currency,
                    }
                )

    return {
        "releases": releases,
        "awards": awards,
        "items": items,
        "with_amount": with_amount,
        "positive_amount": positive_amount,
        "with_quantity": with_quantity,
        "currencies": currencies,
        "samples": samples,
    }


def _pct(part: int, whole: int) -> str:
    return f"{(100 * part / whole):.1f}%" if whole else "n/a"


def main() -> int:
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument("path", type=Path, help="OCDS dump directory or single file")
    parser.add_argument(
        "--samples", type=int, default=5, help="how many populated line items to print"
    )
    args = parser.parse_args()

    if not args.path.exists():
        parser.error(f"no such path: {args.path}")

    r = check(args.path, args.samples)

    items = r["items"]

    def line(label: str, count: int) -> str:
        return f"  {label:<26}{count:,}  ({_pct(count, items)} of items)"

    print(f"path              {args.path}")
    print(f"releases          {r['releases']:,}")
    print(f"awards            {r['awards']:,}")
    print(f"award line items  {items:,}")
    print()
    print("The question — do items carry a unit price?")
    print(line("unit.value.amount present", r["with_amount"]))
    print(line("...and > 0", r["positive_amount"]))
    print(line("quantity present", r["with_quantity"]))
    print(f"  currencies                  {dict(r['currencies']) or '(none)'}")

    if items == 0:
        print("\nNo award line items found. Is this an OCDS dump with an awards stage?")
    elif r["with_amount"] == 0:
        print(
            "\nVerdict: items exist but carry NO unit price."
            " The dump does not unblock the unit-price path."
        )
    else:
        print(
            "\nVerdict: unit prices ARE present."
            " Record this in docs/data/sources.md and wire the adapter in."
        )

    if r["samples"]:
        print("\nsamples (populated items):")
        for s in r["samples"]:
            print(f"  {s}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
