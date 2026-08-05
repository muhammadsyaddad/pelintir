"""Turn free-text procurement line items into comparable, categorized rows.

Everything here is a polars expression over a frame — no per-row Python — so the
same code runs on ten rows in a test and on millions in the pipeline.

Each rule is a small named function with its own test. That matters more than it
looks: a benchmark is only trustworthy if you can point at the exact rule that
put two items in the same bucket.
"""

import polars as pl

# --- unit vocabulary -------------------------------------------------------
# Indonesian procurement files write the same unit a dozen ways. Left side is
# canonical, right side is every spelling seen in the wild.
UNIT_ALIASES: dict[str, tuple[str, ...]] = {
    "unit": ("unit", "unt", "un"),
    "buah": ("buah", "bh", "biji", "bj", "pcs", "pc", "pieces", "piece"),
    "set": ("set", "st", "setel"),
    "paket": ("paket", "pkt", "pket", "ls", "lumpsum", "lump sum"),
    "lembar": ("lembar", "lbr", "sheet"),
    "batang": ("batang", "btg"),
    "kotak": ("kotak", "ktk", "box", "dus", "dos"),
    "rim": ("rim",),
    "roll": ("roll", "rol", "gulung"),
    "meter": ("meter", "mtr", "m"),
    "meter_persegi": ("m2", "m²", "meter persegi"),
    "kilogram": ("kilogram", "kg"),
    "liter": ("liter", "ltr", "lt"),
    "orang": ("orang", "org", "personil"),
    "bulan": ("bulan", "bln"),
    "hari": ("hari", "hr"),
    "tahun": ("tahun", "thn"),
}

UNIT_LOOKUP: dict[str, str] = {
    alias: canonical for canonical, aliases in UNIT_ALIASES.items() for alias in aliases
}

# --- category vocabulary ---------------------------------------------------
# Ordered: the first pattern that matches wins, so put the specific ones first.
# "laptop" must beat "komputer" because a laptop description often says both.
CATEGORY_RULES: tuple[tuple[str, str], ...] = (
    # Accessories first, and this rule earns its place: "Tas Laptop 14 inch" at
    # Rp150.000 otherwise lands in the laptop bucket and drags the median down.
    # The cost is that "laptop lengkap dengan tas" is filed as an accessory —
    # a visible mistake, unlike a quietly poisoned median.
    (
        "aksesori_it",
        r"\b(tas|ransel|casing|cover|charger|adaptor|adapter|kabel|mouse|keyboard|"
        r"headset|webcam|stand|dudukan|flashdisk|hardisk eksternal)\b",
    ),
    ("laptop", r"\b(laptop|notebook|ultrabook|macbook)\b"),
    ("tablet", r"\b(tablet|ipad)\b"),
    ("printer", r"\b(printer|pencetak)\b"),
    ("scanner", r"\b(scanner|pemindai)\b"),
    ("proyektor", r"\b(proyektor|projector|infocus|in focus)\b"),
    ("monitor", r"\b(monitor|layar)\b"),
    ("server", r"\bserver\b"),
    ("ups", r"\b(ups|uninterruptible)\b"),
    ("komputer_desktop", r"\b(komputer|pc|personal computer|desktop|all in one)\b"),
    ("kursi_kerja", r"\bkursi\b"),
    ("meja_kerja", r"\bmeja\b"),
    ("lemari_arsip", r"\b(lemari|filing cabinet|rak arsip)\b"),
    ("pendingin_ruangan", r"\b(air conditioner|pendingin ruangan|ac split)\b"),
    ("kendaraan", r"\b(mobil|motor|kendaraan|minibus|pick up)\b"),
    ("alat_tulis", r"\b(kertas|pulpen|pensil|map|tinta|toner)\b"),
)

# Whole-word match only. "hp" is deliberately here even though it also abbreviates
# "handphone" — inside an IT line item it is nearly always the brand, and a wrong
# brand is visible in the data while a missing one is not.
BRANDS: tuple[str, ...] = (
    "acer",
    "advan",
    "apple",
    "asus",
    "axioo",
    "brother",
    "canon",
    "dell",
    "epson",
    "fujitsu",
    "hp",
    "huawei",
    "infinix",
    "lenovo",
    "logitech",
    "msi",
    "samsung",
    "toshiba",
    "xiaomi",
    "zyrex",
)

# Legal forms stripped when comparing company names, so "PT. Anu Jaya",
# "PT ANU JAYA" and "pt anu jaya" collapse to one key.
ENTITY_FORMS: tuple[str, ...] = ("pt", "cv", "ud", "pd", "koperasi", "perum", "persero", "tbk")

_BRAND_PATTERN = r"\b(" + "|".join(BRANDS) + r")\b"
_ENTITY_PREFIX = r"^(?:" + "|".join(ENTITY_FORMS) + r")\s+"
_ENTITY_SUFFIX = r"\s+(?:" + "|".join(ENTITY_FORMS) + r")$"


def clean_text(expr: pl.Expr) -> pl.Expr:
    """Lowercase, drop punctuation, collapse whitespace.

    Punctuation becomes a space rather than nothing: "PT.Anu" must not turn into
    "ptanu".
    """
    return (
        expr.cast(pl.String)
        .str.to_lowercase()
        .str.replace_all(r"[^a-z0-9²]+", " ")
        .str.replace_all(r"\s+", " ")
        .str.strip_chars()
    )


def canonical_unit(expr: pl.Expr) -> pl.Expr:
    """Map a written unit onto the canonical vocabulary; unknown units pass through."""
    return clean_text(expr).replace(UNIT_LOOKUP)


def normalize_entity_name(expr: pl.Expr) -> pl.Expr:
    """Comparison key for a vendor or agency name, legal form removed.

    Only the key is stripped — the original spelling stays in the raw column, and
    the site still displays whatever the source published.
    """
    cleaned = clean_text(expr)
    return (
        cleaned.str.replace_all(_ENTITY_PREFIX, "")
        .str.replace_all(_ENTITY_SUFFIX, "")
        .str.strip_chars()
    )


def extract_brand(expr: pl.Expr) -> pl.Expr:
    return clean_text(expr).str.extract(_BRAND_PATTERN, 1)


def classify_category(expr: pl.Expr) -> pl.Expr:
    """First matching rule wins; anything unmatched becomes 'lain_lain'.

    Unmatched rows are kept, not dropped. The share of 'lain_lain' is the honest
    measure of how far the rule set actually reaches.
    """
    cleaned = clean_text(expr)
    chain = pl.when(pl.lit(False)).then(pl.lit(None, dtype=pl.String))
    for category, pattern in CATEGORY_RULES:
        chain = chain.when(cleaned.str.contains(pattern)).then(pl.lit(category))
    return chain.otherwise(pl.lit("lain_lain"))


def derive_prices() -> list[pl.Expr]:
    """Fill in whichever of unit price / total the source left out.

    Sources are inconsistent: some publish only a total, some only a unit price.
    Quantity is required for either direction, which is why rows without it are
    rejected below.
    """
    quantity = pl.col("quantity").cast(pl.Float64, strict=False)
    unit_price = pl.col("unit_price").cast(pl.Float64, strict=False)
    total_price = pl.col("total_price").cast(pl.Float64, strict=False)

    return [
        quantity.alias("quantity"),
        pl.coalesce(
            unit_price,
            pl.when(quantity > 0).then(total_price / quantity),
        ).alias("unit_price"),
        pl.coalesce(total_price, unit_price * quantity).alias("total_price"),
    ]


def reject_reason() -> pl.Expr:
    """Why a row cannot be benchmarked, or null if it can.

    Rows are labelled rather than deleted so the notebook can show what fell out.
    A normalization step that quietly drops 40% of the data looks identical to
    one that drops nothing until you count.
    """
    return (
        pl.when(pl.col("item_description").is_null() | (pl.col("item_description") == ""))
        .then(pl.lit("deskripsi kosong"))
        .when(pl.col("quantity").is_null() | (pl.col("quantity") <= 0))
        .then(pl.lit("kuantitas tidak valid"))
        .when(pl.col("unit_price").is_null())
        .then(pl.lit("harga satuan tidak bisa dihitung"))
        .when(pl.col("unit_price") <= 0)
        .then(pl.lit("harga satuan nol atau negatif"))
        .otherwise(pl.lit(None, dtype=pl.String))
        .alias("reject_reason")
    )


def normalize(frame: pl.DataFrame) -> pl.DataFrame:
    """Add normalized columns to a raw frame. No rows are added or removed."""
    return frame.with_columns(derive_prices()).with_columns(
        clean_text(pl.col("item_description")).alias("normalized_text"),
        classify_category(pl.col("item_description")).alias("canonical_category"),
        extract_brand(pl.col("item_description")).alias("brand"),
        canonical_unit(pl.col("unit")).alias("canonical_unit"),
        normalize_entity_name(pl.col("vendor_name")).alias("vendor_key"),
        normalize_entity_name(pl.col("agency_name")).alias("agency_key"),
        reject_reason(),
    )


def split_usable(frame: pl.DataFrame) -> tuple[pl.DataFrame, pl.DataFrame]:
    """Return (benchmarkable rows, rejected rows) from a normalized frame."""
    return (
        frame.filter(pl.col("reject_reason").is_null()),
        frame.filter(pl.col("reject_reason").is_not_null()),
    )
