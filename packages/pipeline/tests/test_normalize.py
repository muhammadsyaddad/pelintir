import polars as pl
import pytest

from pipeline import normalize


def series(values: list[str | None]) -> pl.DataFrame:
    return pl.DataFrame({"value": values}, schema={"value": pl.String})


def apply(expr_fn, values: list[str | None]) -> list[str | None]:
    # Alias explicitly: a when/then chain does not inherit the input column name.
    return series(values).select(expr_fn(pl.col("value")).alias("value"))["value"].to_list()


class TestCleanText:
    def test_lowercases_and_collapses_whitespace(self):
        assert apply(normalize.clean_text, ["  Laptop   LENOVO  "]) == ["laptop lenovo"]

    def test_punctuation_becomes_a_space_not_nothing(self):
        # "PT.Anu" must not collapse into "ptanu".
        assert apply(normalize.clean_text, ["PT.Anu Jaya"]) == ["pt anu jaya"]

    def test_keeps_digits(self):
        assert apply(normalize.clean_text, ["Kertas HVS A4 80 gram"]) == ["kertas hvs a4 80 gram"]

    def test_null_stays_null(self):
        assert apply(normalize.clean_text, [None]) == [None]


class TestCanonicalUnit:
    @pytest.mark.parametrize(
        ("written", "expected"),
        [
            ("Unit", "unit"),
            ("unt", "unit"),
            ("bh", "buah"),
            ("PCS", "buah"),
            ("Buah", "buah"),
            ("rim", "rim"),
            ("Dus", "kotak"),
            ("Lbr", "lembar"),
        ],
    )
    def test_maps_known_spellings(self, written, expected):
        assert apply(normalize.canonical_unit, [written]) == [expected]

    def test_unknown_unit_passes_through_cleaned(self):
        assert apply(normalize.canonical_unit, ["Tabung Gas"]) == ["tabung gas"]


class TestNormalizeEntityName:
    @pytest.mark.parametrize(
        "written",
        ["PT. Anu Jaya", "PT ANU JAYA", "pt anu jaya", "  PT.  Anu   Jaya  "],
    )
    def test_legal_form_variants_collapse_to_one_key(self, written):
        assert apply(normalize.normalize_entity_name, [written]) == ["anu jaya"]

    def test_different_company_keeps_a_different_key(self):
        # "CV Anu Jaya Abadi" is a different company from "PT Anu Jaya".
        assert apply(normalize.normalize_entity_name, ["CV Anu Jaya Abadi"]) == ["anu jaya abadi"]

    def test_trailing_legal_form_is_stripped(self):
        assert apply(normalize.normalize_entity_name, ["Sinar Terang Tbk"]) == ["sinar terang"]


class TestExtractBrand:
    @pytest.mark.parametrize(
        ("description", "expected"),
        [
            ("Laptop Lenovo ThinkPad E14", "lenovo"),
            ("LAPTOP HP PROBOOK 440 G9", "hp"),
            ("Laptop Apple MacBook Air M2", "apple"),
            ("Printer Epson L3210", "epson"),
        ],
    )
    def test_finds_known_brands(self, description, expected):
        assert apply(normalize.extract_brand, [description]) == [expected]

    def test_no_brand_yields_null(self):
        assert apply(normalize.extract_brand, ["Kursi Kerja Staff Standar"]) == [None]

    def test_brand_must_be_a_whole_word(self):
        # "shp" contains "hp" but is not the brand.
        assert apply(normalize.extract_brand, ["Kabel shp konektor"]) == [None]


class TestClassifyCategory:
    @pytest.mark.parametrize(
        ("description", "expected"),
        [
            ("Laptop Lenovo ThinkPad E14", "laptop"),
            ("Kursi Kerja Staff Kain Jaring", "kursi_kerja"),
            ("Meja Kerja Staff 120x60", "meja_kerja"),
            ("Printer Epson L3210 All In One", "printer"),
            ("Kertas HVS A4 80 gram", "alat_tulis"),
        ],
    )
    def test_assigns_expected_category(self, description, expected):
        assert apply(normalize.classify_category, [description]) == [expected]

    def test_laptop_beats_komputer_when_both_words_appear(self):
        # Rule order matters: a "laptop untuk lab komputer" is a laptop.
        assert apply(normalize.classify_category, ["Laptop untuk Lab Komputer"]) == ["laptop"]

    def test_a_laptop_bag_is_not_a_laptop(self):
        # Rp150.000 filed as a laptop would pull the whole category's median down.
        assert apply(normalize.classify_category, ["Tas Laptop 14 inch"]) == ["aksesori_it"]

    def test_unmatched_text_is_kept_as_lain_lain(self):
        assert apply(normalize.classify_category, ["Jasa Konsultansi Perencanaan"]) == ["lain_lain"]


class TestDerivePrices:
    def test_unit_price_is_derived_from_total_and_quantity(self):
        frame = pl.DataFrame(
            {"quantity": [4.0], "unit_price": [None], "total_price": [20_000_000.0]},
            schema={"quantity": pl.Float64, "unit_price": pl.Float64, "total_price": pl.Float64},
        ).with_columns(normalize.derive_prices())
        assert frame["unit_price"][0] == 5_000_000.0

    def test_total_is_derived_from_unit_price_and_quantity(self):
        frame = pl.DataFrame(
            {"quantity": [3.0], "unit_price": [1_500_000.0], "total_price": [None]},
            schema={"quantity": pl.Float64, "unit_price": pl.Float64, "total_price": pl.Float64},
        ).with_columns(normalize.derive_prices())
        assert frame["total_price"][0] == 4_500_000.0

    def test_zero_quantity_does_not_divide_by_zero(self):
        frame = pl.DataFrame(
            {"quantity": [0.0], "unit_price": [None], "total_price": [1_000.0]},
            schema={"quantity": pl.Float64, "unit_price": pl.Float64, "total_price": pl.Float64},
        ).with_columns(normalize.derive_prices())
        assert frame["unit_price"][0] is None


class TestNormalizeFrame:
    @pytest.fixture
    def raw_frame(self) -> pl.DataFrame:
        return pl.DataFrame(
            {
                "item_description": [
                    "Laptop Lenovo ThinkPad E14",
                    "Kursi Kerja Staff",
                    "",
                    "Laptop Advan Workpro",
                    "Laptop Axioo Mybook",
                ],
                "unit": ["Unit", "bh", "paket", "unit", "unit"],
                "quantity": [10.0, 40.0, 1.0, 3.0, 0.0],
                "unit_price": [12_500_000.0, 850_000.0, 25_000_000.0, None, 4_200_000.0],
                "total_price": [125_000_000.0, 34_000_000.0, 25_000_000.0, 20_100_000.0, 0.0],
                "vendor_name": [
                    "PT. Anu Jaya",
                    "PT ANU JAYA",
                    "CV Karya",
                    "UD Terang",
                    "UD Terang",
                ],
                "agency_name": ["Dinas A", "Dinas A", "Dinas B", "Dinas B", "Dinas B"],
            }
        )

    def test_row_count_is_preserved(self, raw_frame):
        assert len(normalize.normalize(raw_frame)) == len(raw_frame)

    def test_vendor_spelling_variants_share_one_key(self, raw_frame):
        keys = normalize.normalize(raw_frame)["vendor_key"].to_list()
        assert keys[0] == keys[1] == "anu jaya"

    def test_missing_unit_price_is_backfilled_from_total(self, raw_frame):
        result = normalize.normalize(raw_frame)
        assert result["unit_price"][3] == pytest.approx(6_700_000.0)

    def test_split_usable_rejects_only_unusable_rows(self, raw_frame):
        usable, rejected = normalize.split_usable(normalize.normalize(raw_frame))

        assert len(usable) == 3
        assert sorted(rejected["reject_reason"].to_list()) == [
            "deskripsi kosong",
            "kuantitas tidak valid",
        ]

    def test_rejected_rows_are_labelled_not_dropped(self, raw_frame):
        result = normalize.normalize(raw_frame)
        assert result["reject_reason"].null_count() == 3
