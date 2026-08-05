"""Run the DuckDB benchmark SQL over normalized items.

The SQL lives in ``sql/`` and is versioned in git rather than embedded in Python:
the queries are the analytical claim this project makes, and they should be
reviewable on their own.
"""

from pathlib import Path

import duckdb
import polars as pl

from pipeline.settings import PACKAGE_ROOT

SQL_DIR = PACKAGE_ROOT / "sql"

DEFAULT_MIN_GROUP_SIZE = 5


def load_sql(name: str) -> str:
    return (SQL_DIR / f"{name}.sql").read_text(encoding="utf-8")


def run(
    items: pl.DataFrame,
    min_group_size: int = DEFAULT_MIN_GROUP_SIZE,
    sql_name: str = "benchmark",
) -> pl.DataFrame:
    """Compute benchmarks for an in-memory frame of normalized items."""
    connection = duckdb.connect()
    try:
        connection.register("normalized_items", items)
        result = connection.execute(load_sql(sql_name), {"min_group_size": min_group_size}).pl()
    finally:
        connection.close()
    return result


def outliers(items: pl.DataFrame, benchmarks: pl.DataFrame, threshold: float = 3.0) -> pl.DataFrame:
    """Items priced more than `threshold` scaled MADs above their group median.

    Only the upper tail: this project is looking for overpricing, and a suspiciously
    cheap line item is usually a data problem rather than a finding.
    """
    joined = items.join(
        benchmarks,
        on=["canonical_category", "canonical_unit", "fiscal_year"],
        how="inner",
    )
    return (
        joined.with_columns(
            (
                (pl.col("unit_price") - pl.col("median_price"))
                / pl.when(pl.col("mad_scaled") > 0).then(pl.col("mad_scaled"))
            ).alias("mad_score"),
            (pl.col("unit_price") / pl.col("median_price")).alias("price_ratio"),
        )
        .filter(pl.col("mad_score") >= threshold)
        .sort("mad_score", descending=True)
    )


def write_benchmarks(benchmarks: pl.DataFrame, destination: Path) -> Path:
    destination.parent.mkdir(parents=True, exist_ok=True)
    benchmarks.write_parquet(destination, compression="zstd")
    return destination
