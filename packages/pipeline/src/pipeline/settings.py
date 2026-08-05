import os
from pathlib import Path

PACKAGE_ROOT = Path(__file__).resolve().parent.parent.parent


def data_dir() -> Path:
    """Root of the local data lake.

    Local paths for now. Moving raw storage to Cloudflare R2 means pointing this
    at ``s3://<bucket>`` and handing polars ``storage_options`` — the directory
    layout below does not change.
    """
    return Path(os.environ.get("PELINTIR_DATA_DIR", PACKAGE_ROOT / "data"))


def raw_path(source: str, fiscal_year: int) -> Path:
    return data_dir() / "raw" / source / str(fiscal_year)


def normalized_path(source: str, fiscal_year: int) -> Path:
    return data_dir() / "normalized" / source / str(fiscal_year)
