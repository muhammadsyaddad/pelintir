"""The raw layer: whatever the source gave us, written down unchanged.

Raw Parquet is the audit trail. Normalization rules will keep changing; being
able to replay them over untouched input is what makes that safe.

Layout: ``<data>/raw/<source>/<year>/part-<n>.parquet``. Moving to R2 later means
handing polars an ``s3://`` path plus ``storage_options`` — the layout is the same.
"""

from pathlib import Path

import polars as pl

from pipeline import settings
from pipeline.sources.base import Source, to_frame


def write_raw(frame: pl.DataFrame, source: str, fiscal_year: int, part: int = 0) -> Path:
    directory = settings.raw_path(source, fiscal_year)
    directory.mkdir(parents=True, exist_ok=True)
    path = directory / f"part-{part:05d}.parquet"
    frame.write_parquet(path, compression="zstd")
    return path


def ingest(source: Source, fiscal_year: int, category: str | None = None) -> Path:
    """Fetch one (source, year) slice and land it as raw Parquet."""
    frame = to_frame(source.fetch(fiscal_year, category))
    return write_raw(frame, source.name, fiscal_year)


def read_raw(source: str, fiscal_year: int) -> pl.DataFrame:
    directory = settings.raw_path(source, fiscal_year)
    files = sorted(directory.glob("*.parquet"))
    if not files:
        raise FileNotFoundError(f"No raw Parquet under {directory}. Run ingest first.")
    return pl.read_parquet(files)


def write_normalized(frame: pl.DataFrame, source: str, fiscal_year: int) -> Path:
    directory = settings.normalized_path(source, fiscal_year)
    directory.mkdir(parents=True, exist_ok=True)
    path = directory / "items.parquet"
    frame.write_parquet(path, compression="zstd")
    return path
