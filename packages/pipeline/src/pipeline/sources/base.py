"""The contract every data source must satisfy.

The upstream source is not decided yet (LPSE/SPSE per instansi, an opentender
dump, e-Katalog LKPP). Everything downstream — raw Parquet, normalization,
benchmarks — depends only on this protocol, so adding a real source later means
writing one adapter and changing nothing else.
"""

from collections.abc import Iterator
from typing import Protocol, runtime_checkable

import polars as pl

# Every source must produce these columns. Extra columns are kept as-is in the
# raw layer; normalization only reads the ones below.
RAW_SCHEMA: dict[str, pl.DataType] = {
    "source": pl.String,  # adapter name, e.g. "local_csv"
    "source_id": pl.String,  # package id in the origin system
    "fiscal_year": pl.Int16,
    "agency_name": pl.String,
    "vendor_name": pl.String,
    "package_title": pl.String,
    "line_no": pl.Int32,
    "item_description": pl.String,
    "unit": pl.String,
    "quantity": pl.Float64,
    "unit_price": pl.Float64,
    "total_price": pl.Float64,
    "source_url": pl.String,
}


@runtime_checkable
class Source(Protocol):
    """A source yields one record per procurement *line item*, not per package."""

    name: str

    def fetch(self, fiscal_year: int, category: str | None = None) -> Iterator[dict]:
        """Yield raw records. Keys should cover RAW_SCHEMA; extras are preserved.

        Implementations doing HTTP should wrap requests with ``httpx`` plus
        ``tenacity`` retries (exponential backoff, honour 429) and must not
        transform values — cleaning belongs in ``pipeline.normalize``.
        """
        ...


def to_frame(records: Iterator[dict]) -> pl.DataFrame:
    """Materialize records into a frame with RAW_SCHEMA columns present and typed.

    Missing columns are filled with nulls so the raw layer has one stable shape
    no matter which adapter produced it.
    """
    rows = list(records)
    frame = pl.DataFrame(rows, infer_schema_length=None) if rows else pl.DataFrame()

    for column, dtype in RAW_SCHEMA.items():
        if column not in frame.columns:
            frame = frame.with_columns(pl.lit(None, dtype=dtype).alias(column))
        else:
            frame = frame.with_columns(pl.col(column).cast(dtype, strict=False))

    extras = [c for c in frame.columns if c not in RAW_SCHEMA]
    return frame.select([*RAW_SCHEMA.keys(), *extras])
