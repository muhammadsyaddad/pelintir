"""Walk the whole week-one path on the sample CSV: source -> raw -> normalize -> benchmark."""

from pathlib import Path

import polars as pl
import pytest

from pipeline import benchmark, normalize, raw
from pipeline.sources import LocalCsvSource
from pipeline.sources.base import RAW_SCHEMA, to_frame

FIXTURE = Path(__file__).parent / "fixtures" / "sample_items.csv"


@pytest.fixture
def source() -> LocalCsvSource:
    return LocalCsvSource(FIXTURE)


@pytest.fixture
def raw_frame(source: LocalCsvSource) -> pl.DataFrame:
    return to_frame(source.fetch(2023))


class TestLocalCsvSource:
    def test_indonesian_column_names_are_mapped(self, raw_frame):
        assert set(RAW_SCHEMA).issubset(raw_frame.columns)
        assert raw_frame["vendor_name"][0] == "PT. Anu Jaya"

    def test_only_the_requested_fiscal_year_is_returned(self, raw_frame):
        assert raw_frame["fiscal_year"].unique().to_list() == [2023]

    def test_category_filter_narrows_the_result(self, source):
        laptops = to_frame(source.fetch(2023, category="laptop"))
        assert len(laptops) > 0
        assert all("laptop" in d.lower() for d in laptops["item_description"] if d)

    def test_missing_columns_are_filled_with_nulls(self, raw_frame):
        # The fixture has no source_url column.
        assert raw_frame["source_url"].null_count() == len(raw_frame)


class TestRawRoundTrip:
    def test_written_parquet_reads_back_identical(self, raw_frame, tmp_path, monkeypatch):
        monkeypatch.setenv("PELINTIR_DATA_DIR", str(tmp_path))
        raw.write_raw(raw_frame, "local_csv", 2023)
        assert raw.read_raw("local_csv", 2023).equals(raw_frame)

    def test_reading_a_missing_slice_is_an_explicit_error(self, tmp_path, monkeypatch):
        monkeypatch.setenv("PELINTIR_DATA_DIR", str(tmp_path))
        with pytest.raises(FileNotFoundError):
            raw.read_raw("local_csv", 1999)


class TestBenchmark:
    @pytest.fixture
    def usable(self, raw_frame) -> pl.DataFrame:
        return normalize.split_usable(normalize.normalize(raw_frame))[0]

    def test_small_groups_are_not_published(self, usable):
        result = benchmark.run(usable, min_group_size=5)
        assert result["n"].min() >= 5

    def test_laptop_median_is_in_a_believable_range(self, usable):
        result = benchmark.run(usable, min_group_size=5)
        laptop = result.filter(pl.col("canonical_category") == "laptop").row(0, named=True)

        # Government laptops in the fixture sit between roughly 7M and 22M rupiah,
        # so a median outside 5M..30M means normalization mixed in something else.
        assert 5_000_000 < laptop["median_price"] < 30_000_000
        assert laptop["p25"] <= laptop["median_price"] <= laptop["p75"]

    def test_the_planted_overpriced_row_is_flagged(self, usable):
        result = benchmark.run(usable, min_group_size=5)
        flagged = benchmark.outliers(usable, result, threshold=3.0)

        descriptions = flagged["item_description"].to_list()
        assert any("Spesifikasi Khusus Auditor" in d for d in descriptions)

    def test_an_ordinary_row_is_not_flagged(self, usable):
        result = benchmark.run(usable, min_group_size=5)
        flagged = benchmark.outliers(usable, result, threshold=3.0)

        descriptions = flagged["item_description"].to_list()
        assert not any("Lenovo IdeaPad" in d for d in descriptions)
