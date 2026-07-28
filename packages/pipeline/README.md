# packages/pipeline

Ingest, normalise, benchmark. Batch, not a service.

```sh
uv sync

# manually downloaded CSV → raw Parquet
uv run pipeline ingest --from ./downloads --year 2023 --category laptop

# normalise → benchmark
uv run pipeline benchmark --source local_csv --year 2023

uv run pytest
```

Tests and the proof notebook fall back to the fixture in `tests/fixtures/`, so a clean clone runs green with no
real data.

## Data layout

```
data/raw/<source>/<year>/*.parquet          as received, append-only, audit trail
data/normalized/<source>/<year>/*.parquet   comparable items
data/benchmarks/<source>-<year>.parquet     n / p25 / median / p75 / MAD
```

Root is `PELINTIR_DATA_DIR` (default `./data`). All gitignored — never commit data.

## Modules

| | |
|---|---|
| `sources/base.py` | `Source` protocol, typed `RAW_SCHEMA`, `to_frame()` |
| `sources/local_csv.py` | the one concrete adapter |
| `raw.py` | `ingest`, `read_raw`, `write_normalized` |
| `normalize.py` | unit vocabulary, category rules, entity names, price derivation, `reject_reason` |
| `benchmark.py` + `sql/benchmark.sql` | DuckDB over Parquet; median and MAD; drops groups below 5 |
| `cli.py` | `pipeline ingest`, `pipeline benchmark` |
| `notebooks/01_proof_laptop.ipynb` | the current milestone: is one category's median believable? |

**polars, not pandas. Median and MAD, not mean and stddev.** Procurement prices are heavily skewed and a single
100× outlier would inflate a stddev enough to hide every other outlier behind it.

Grouping is by `canonical_category`, **not KBKI** — [ADR-0011](../../docs/adr/0011-category-vocabulary-before-kbki.md).

Rules for working here: [`AGENTS.md`](AGENTS.md). Methodology:
[`../../docs/methodology/`](../../docs/methodology/).
