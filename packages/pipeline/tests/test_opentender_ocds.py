"""The opentender OCDS adapter: awards[].items[] -> one raw record per line item.

No real data — an inline OCDS release package exercises the mapping, so a clean
clone runs green. Real dumps are checked by scripts/check_ocds_fields.py.
"""

import gzip
import json
from pathlib import Path

import polars as pl
import pytest

from pipeline.sources import OpentenderOcdsSource
from pipeline.sources.base import RAW_SCHEMA, to_frame

RELEASE_PACKAGE = {
    "releases": [
        {
            "ocid": "ocds-abc-0001",
            "date": "2023-05-01T00:00:00+07:00",
            "buyer": {"name": "Dinas Pendidikan Kota Bandung"},
            "tender": {"title": "Pengadaan Laptop Guru"},
            "awards": [
                {
                    "id": "award-1",
                    "date": "2023-06-10T00:00:00+07:00",
                    "suppliers": [{"name": "PT Anu Jaya"}],
                    "items": [
                        {
                            "id": "item-1",
                            "description": "Laptop Lenovo ThinkPad E14 i5 8GB",
                            "quantity": 10,
                            "unit": {
                                "name": "unit",
                                "value": {"amount": 12500000, "currency": "IDR"},
                            },
                            "classification": {"scheme": "KBKI", "id": "45231"},
                        },
                        {
                            "id": "item-2",
                            "description": "Tas Jinjing 14 inch",
                            "quantity": 10,
                            "unit": {
                                "name": "buah",
                                "value": {"amount": 150000, "currency": "IDR"},
                            },
                        },
                    ],
                }
            ],
        },
        {
            "ocid": "ocds-abc-0002",
            "buyer": {"name": "Sekretariat Daerah Kabupaten Bogor"},
            "tender": {"title": "Belanja Modal Peralatan Kantor"},
            "awards": [
                {
                    "id": "award-2",
                    "date": "2022-11-01T00:00:00+07:00",  # different year
                    "suppliers": [{"name": "CV Sinar Terang"}],
                    "items": [
                        {
                            "id": "item-3",
                            "description": "Laptop Acer Aspire 5 Ryzen 5",
                            "quantity": 5,
                            "unit": {
                                "name": "unit",
                                "value": {"amount": 9200000, "currency": "IDR"},
                            },
                        }
                    ],
                }
            ],
        },
    ]
}


@pytest.fixture
def dump_dir(tmp_path: Path) -> Path:
    (tmp_path / "release-package.json").write_text(json.dumps(RELEASE_PACKAGE), encoding="utf-8")
    return tmp_path


@pytest.fixture
def rows(dump_dir: Path) -> list[dict]:
    return list(OpentenderOcdsSource(dump_dir).fetch(2023))


class TestMapping:
    def test_one_record_per_award_line_item(self, rows):
        # Two 2023 items; the 2022 award is filtered out by the year argument.
        assert len(rows) == 2
        assert {r["item_description"] for r in rows} == {
            "Laptop Lenovo ThinkPad E14 i5 8GB",
            "Tas Jinjing 14 inch",
        }

    def test_unit_price_comes_from_unit_value_amount(self, rows):
        laptop = next(r for r in rows if "Lenovo" in r["item_description"])
        assert laptop["unit_price"] == 12500000
        assert laptop["quantity"] == 10
        assert laptop["unit"] == "unit"

    def test_total_price_is_never_synthesised(self, rows):
        # OCDS has no per-line total; the adapter must not derive quantity*price.
        assert all(r["total_price"] is None for r in rows)

    def test_line_numbers_are_one_based_within_an_award(self, rows):
        assert sorted(r["line_no"] for r in rows) == [1, 2]

    def test_agency_and_vendor_are_mapped(self, rows):
        laptop = next(r for r in rows if "Lenovo" in r["item_description"])
        assert laptop["agency_name"] == "Dinas Pendidikan Kota Bandung"
        assert laptop["vendor_name"] == "PT Anu Jaya"
        assert laptop["package_title"] == "Pengadaan Laptop Guru"

    def test_extras_are_preserved(self, rows):
        laptop = next(r for r in rows if "Lenovo" in r["item_description"])
        assert laptop["ocid"] == "ocds-abc-0001"
        assert laptop["currency"] == "IDR"
        assert laptop["item_classification"] == "45231"

    def test_category_filter_narrows_to_matching_descriptions(self, dump_dir):
        laptops = list(OpentenderOcdsSource(dump_dir).fetch(2023, category="laptop"))
        assert len(laptops) == 1
        assert "Lenovo" in laptops[0]["item_description"]


class TestRawSchema:
    def test_to_frame_yields_the_stable_raw_shape(self, rows):
        frame = to_frame(iter(rows))
        assert set(RAW_SCHEMA).issubset(frame.columns)
        assert frame["fiscal_year"].unique().to_list() == [2023]
        # unit_price is typed as Float64 by the raw schema.
        assert frame["unit_price"].dtype == pl.Float64


class TestDumpShapes:
    def test_record_package_is_understood(self, tmp_path):
        record_package = {
            "records": [{"ocid": "ocds-x", "compiledRelease": RELEASE_PACKAGE["releases"][0]}]
        }
        (tmp_path / "record-package.json").write_text(json.dumps(record_package), encoding="utf-8")
        rows = list(OpentenderOcdsSource(tmp_path).fetch(2023))
        assert len(rows) == 2

    def test_ndjson_is_streamed_line_by_line(self, tmp_path):
        path = tmp_path / "releases.jsonl"
        lines = [json.dumps({"releases": [rel]}) for rel in RELEASE_PACKAGE["releases"]]
        path.write_text("\n".join(lines) + "\n", encoding="utf-8")
        rows = list(OpentenderOcdsSource(tmp_path).fetch(2023))
        assert len(rows) == 2

    def test_gzipped_dump_is_decompressed(self, tmp_path):
        path = tmp_path / "release-package.json.gz"
        with gzip.open(path, "wt", encoding="utf-8") as handle:
            json.dump(RELEASE_PACKAGE, handle)
        rows = list(OpentenderOcdsSource(tmp_path).fetch(2023))
        assert len(rows) == 2
