"""Read procurement line items from CSV files you downloaded by hand.

This is the adapter to use while the upstream source is undecided: dump whatever
you can get into CSV, prove the median, and only then write a scraper.

Column names are matched case-insensitively against a small alias table, so a
file using "nama penyedia" or "vendor" both land on ``vendor_name``.
"""

from collections.abc import Iterator
from pathlib import Path

import polars as pl

COLUMN_ALIASES: dict[str, tuple[str, ...]] = {
    "source_id": ("source_id", "id_paket", "kode_paket", "package_id"),
    "fiscal_year": ("fiscal_year", "tahun", "tahun_anggaran"),
    "agency_name": ("agency_name", "instansi", "satker", "nama_satker", "kldi"),
    "vendor_name": ("vendor_name", "vendor", "penyedia", "nama_penyedia", "pemenang"),
    "package_title": ("package_title", "nama_paket", "paket", "judul"),
    "line_no": ("line_no", "no", "nomor", "baris"),
    "item_description": ("item_description", "uraian", "nama_barang", "item", "deskripsi"),
    "unit": ("unit", "satuan"),
    "quantity": ("quantity", "qty", "volume", "jumlah", "kuantitas"),
    "unit_price": ("unit_price", "harga_satuan", "harga"),
    "total_price": ("total_price", "total", "nilai", "jumlah_harga", "nilai_kontrak"),
    "source_url": ("source_url", "url", "tautan"),
}


def _slug(name: str) -> str:
    return name.strip().lower().replace(" ", "_").replace("-", "_")


def _rename_map(columns: list[str]) -> dict[str, str]:
    """Map the file's actual columns onto canonical names, first alias wins."""
    by_slug = {_slug(column): column for column in columns}
    mapping: dict[str, str] = {}
    for canonical, aliases in COLUMN_ALIASES.items():
        for alias in aliases:
            if alias in by_slug and by_slug[alias] not in mapping:
                mapping[by_slug[alias]] = canonical
                break
    return mapping


class LocalCsvSource:
    name = "local_csv"

    def __init__(self, root: Path, pattern: str = "*.csv") -> None:
        self.root = Path(root)
        self.pattern = pattern

    def files(self) -> list[Path]:
        if self.root.is_file():
            return [self.root]
        return sorted(self.root.glob(self.pattern))

    def fetch(self, fiscal_year: int, category: str | None = None) -> Iterator[dict]:
        for path in self.files():
            frame = pl.read_csv(path, infer_schema_length=None, try_parse_dates=False)
            frame = frame.rename(_rename_map(frame.columns))

            if "fiscal_year" in frame.columns:
                frame = frame.filter(
                    pl.col("fiscal_year").cast(pl.Int64, strict=False) == fiscal_year
                )
            else:
                # A file with no year column is assumed to be the year asked for.
                frame = frame.with_columns(pl.lit(fiscal_year).alias("fiscal_year"))

            if category and "item_description" in frame.columns:
                frame = frame.filter(
                    pl.col("item_description").str.to_lowercase().str.contains(category.lower())
                )

            frame = frame.with_columns(pl.lit(self.name).alias("source"))
            yield from frame.iter_rows(named=True)
