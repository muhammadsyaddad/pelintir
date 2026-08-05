# packages/pipeline

Ingest, normalise, benchmark. Batch, not a service. Read [`../../AGENTS.md`](../../AGENTS.md) first.

## Toolchain

`uv`, not pip. `uv run <cmd>`, never bare `python`. `uv.lock` is committed and never hand-edited. Never run
`bun install` here.

```sh
uv sync
uv run pipeline ingest --from ./downloads --year 2023 --category laptop
uv run pipeline benchmark --source local_csv --year 2023
uv run ruff check . && uv run ruff format --check .
uv run pytest
```

## Rules

- **polars, not pandas.** Expressions over frames, no per-row Python — the same code must run on ten rows in a
  test and millions in production.
- **Network only in `sources/`.** Normalisation and benchmarking are offline and pure, so a run is reproducible
  from the raw layer alone. HTTP adapters use `httpx` + `tenacity` with backoff and honour 429.
- **Adapters do not transform.** Write what the source gave you. Preserve extra columns; do not drop a field
  because today's normaliser ignores it. Cleaning belongs in `normalize.py`, where it is tested.
- **The raw layer is append-only.** `data/raw/<source>/<year>/` is an audit trail. Never edit it in place — a
  published flag is a claim about a specific snapshot, and rewriting the snapshot destroys the explanation.
- **One rule, one small named function, one test.** This is the whole reason the benchmark is trustworthy: you
  must be able to point at the exact rule that put two items in the same bucket. 51 tests exist; keep the
  ratio.
- **Rules before models.** `sentence-transformers` is a dependency for a fallback that is not in use. Do not
  reach for embeddings before the rule layer is measurably insufficient, and pin any model by exact version —
  a silent model upgrade retroactively changes every published benchmark.
  [`../../docs/methodology/item-normalization.md`](../../docs/methodology/item-normalization.md).
- **Reject loudly, never silently.** Unusable rows carry a `reject_reason` and are split out by
  `split_usable()`. A row that vanishes without a reason is a bug.
- **No group below `min_group_size`** (5). A median over three rows is an anecdote, not a benchmark.
  [`../../docs/methodology/peer-group.md`](../../docs/methodology/peer-group.md).
- **Thresholds do not live in Python.** They belong in red-flag spec frontmatter
  ([ADR-0007](../../docs/adr/0007-flag-specs-as-single-source.md)). `DEFAULT_MIN_GROUP_SIZE` is a known
  exception on the list in [`../../docs/status.md`](../../docs/status.md); do not add more.
- **Notebooks explore, `src/` ships.** Nothing in `notebooks/` is imported by production code.
- **Never commit data.** `data/`, `*.parquet`, `*.duckdb` are gitignored. Tests use the fixture in
  `tests/fixtures/` so a clean clone runs green.

## Current state

Grouping is by `canonical_category`, a rule-based vocabulary — **not KBKI**, despite what the methodology spec
describes as the target. [ADR-0011](../../docs/adr/0011-category-vocabulary-before-kbki.md). Do not write code
or copy that claims KBKI-level precision.
