# Status

`last_updated: 2026-08-08`

**This is the single source of truth for what actually runs.** Every other document describes intent,
methodology, or plans. This one describes reality. When code changes, change this file — do not adjust the
other docs to hide a gap.

---

## Summary

**Infrastructure works end to end. No real data, no product UI.**

`bun run lint`, `bun run test` (139 tests), `bun run check-types` and `bun run build` all pass. The API serves
`/health` against live Postgres and Meilisearch. The pipeline ingests CSV to Parquet, normalises with polars,
and computes DuckDB benchmarks — on fixtures.

The next milestone is deliberately not frontend work: it is proving that a median over one real product
category is believable, in `packages/pipeline/notebooks/01_proof_laptop.ipynb`. That notebook has now been
executed **against the fixture**, and its outputs are committed: 28 raw rows, 2 rejected with named reasons,
`lain_lain` at 0%, a laptop group of n=13 with a median of Rp 12.500.000, and 3 upper-tail outliers that are
genuinely odd rather than normalisation artefacts. All four of the notebook's pass criteria hold.

**That is a working pipeline, not a proven median.** A median over 13 hand-written fixture rows is a fixture.
The milestone is not met until the same notebook runs over one real product category.

The critical path beyond that is blocked on **data access**, not engineering —
[ADR-0006](adr/0006-scrape-ekatalog-storefront.md).

The data docs referenced across the repo now exist: [`data/legal-register.md`](data/legal-register.md) (the
merge gate), [`data/sources.md`](data/sources.md), and [`data/access-requests.md`](data/access-requests.md).
The `opentender-ocds` source is `attribution-required` (ODbL) in the register, so its adapter may run — but
the highest-value unknown, whether opentender's OCDS award items carry unit prices, is **still unverified**:
the environment blocks `opentender.net`, so no dump has been fetched. `scripts/check_ocds_fields.py` answers
it in one run against a hand-downloaded dump.

---

## Commands

| Command | State |
|---|---|
| `bun install` | works |
| `bun run services:up` / `services:down` | works — Postgres 16 + Meilisearch v1.13, bound to 127.0.0.1 |
| `bun run migrate` | works — idempotent, tracked in `schema_migrations` |
| `bun run dev` | works — web :3000, dashboard :3001, api :8000 |
| `bun run lint` | passes — eslint on JS workspaces, `ruff check` + `ruff format --check` on Python |
| `bun run test` | passes — 102 pipeline tests, 2 api tests, 35 `packages/ui` vitest cases |
| `bun run check-types` | passes |
| `bun run build` | passes |
| `bun run format` | works (prettier; no `.prettierrc`, so defaults apply) |
| `uv run pipeline ingest --from ./downloads --year 2023 --category laptop` | works |
| `uv run pipeline benchmark --source local_csv --year 2023` | works |

The documentation contract is enforced by `packages/pipeline/tests/test_docs_contract.py`, which runs as part
of `bun run test`: flag frontmatter validity, banned words in `question_*` fields, non-claims sections,
implemented-flag/implementation correspondence, internal link resolution, and orphaned pages. The two
flag-implementation checks are dormant by construction — no spec is `implemented` and
`src/pipeline/flags/` does not exist yet, so both return early. They start asserting with the first flag
that ships. External links
are checked weekly by `.github/workflows/links.yml`, never on a pull request.

Setup order matters: `cp .env.example .env` → `bun run services:up` → `bun install` →
`uv sync --project apps/api` → `uv sync --project packages/pipeline` → `bun run migrate` → `bun run dev`.
The [root README](../README.md) is authoritative for this.

---

## What exists

### `apps/api` — works

FastAPI app with a real `app` object, lifespan-managed `psycopg` pool, CORS from settings, and
`GET /health` returning `{status, postgres, meilisearch}`. Config via `pydantic-settings`
(`app/settings.py`), reading `.env` then `../../.env`. `app/db.py`, `app/search.py`. 2 tests.

No domain endpoints yet — nothing that serves procurement data.

### `apps/api/migrations` — works

Numbered plain SQL, applied by `migrations/apply.py`. Idempotent; each file runs once inside a transaction;
editing an already-applied migration is rejected. `0001_init.sql` exists.
See [ADR-0008](adr/0008-plain-sql-migrations-over-alembic.md).

### `packages/pipeline` — works on fixtures

| Module | State |
|---|---|
| `sources/base.py` | `Source` protocol + `RAW_SCHEMA` (13 typed columns) + `to_frame()` |
| `sources/local_csv.py` | hand-downloaded CSV adapter |
| `sources/opentender_ocds.py` | opentender.net OCDS bulk adapter. File-based (parses a downloaded dump; the network step is manual, like `local_csv`). Maps `awards[].items[]` to one raw record each; whether those items carry a `unit_price` is **unverified** — see [`data/sources.md`](data/sources.md) |
| `scripts/check_ocds_fields.py` | investigation tool: reports how often a real OCDS dump populates `unit.value.amount` and `quantity`. Answers the unit-price question; not part of the shipped pipeline |
| `raw.py` | `ingest`, `read_raw`, `write_normalized` — Parquet, append-only |
| `normalize.py` | unit vocabulary (17 canonical units), ordered category rules, entity-name normalisation, brand extraction, price derivation, `reject_reason`, `split_usable` |
| `benchmark.py` | runs `sql/benchmark.sql` over Parquet; `DEFAULT_MIN_GROUP_SIZE = 5` |
| `sql/benchmark.sql` | per (`canonical_category` × `canonical_unit` × `fiscal_year`): `n`, `min`, `p25`, `median`, `p75`, `max`, MAD, scaled MAD. Rejects groups below `$min_group_size` |
| `cli.py` | `pipeline ingest`, `pipeline benchmark` |
| `tests/` | 91 tests + a CSV fixture, so a clean clone runs green with no real data |
| `notebooks/01_proof_laptop.ipynb` | executed against the fixture, outputs committed. Reads `PELINTIR_SOURCE_DIR` to point at real CSVs |

Data layout: `data/raw/<source>/<year>/`, `data/normalized/<source>/<year>/`,
`data/benchmarks/<source>-<year>.parquet`. Root configurable via `PELINTIR_DATA_DIR`. All gitignored.

### Frontends — shell only

`apps/web` (:3000) is still an unmodified `create-turbo` page with Tailwind v4 and shadcn wired up.

`apps/dashboard` (:3001) is no longer a starter page: it mounts the `@repo/ui` sidebar over a placeholder file
tree and renders Indonesian copy (`Pilih item di bilah sisi.`). It fetches nothing and knows nothing about
procurement.

`packages/ui` is the largest workspace in the repo — a generic shadcn/Radix file-explorer tree (sidebar, tree
provider, context menu, search, in-memory adapter) plus the three original starter components. It is
domain-agnostic; nothing in it is specific to procurement.

### CI — works

`.github/workflows/ci.yml`: a JS job (bun, `turbo lint check-types build` filtered to the JS workspaces —
note it does **not** run `test`, so the 35 `packages/ui` vitest cases never run in CI), a
Python matrix job over `apps/api` and `packages/pipeline` (`uv sync --locked`, `ruff check`,
`ruff format --check`, `pytest`), and a migrations job that applies against a real Postgres service and then
re-runs `--status` to prove idempotency.

---

## Documented but not built

This is the honest gap between the specs in `docs/` and the code.

| Documented in | Reality |
|---|---|
| [`methodology/item-normalization.md`](methodology/item-normalization.md) — KBKI 2015 backbone | **Not implemented.** Grouping is by `canonical_category`, a rule-based vocabulary (`laptop`, `printer`, `ups`, `aksesori_it`, …), not by KBKI code. See [ADR-0011](adr/0011-category-vocabulary-before-kbki.md). |
| [`methodology/item-normalization.md`](methodology/item-normalization.md) — fuzzy stage, embeddings, review queue, eval set | Not implemented. Stage 2 (deterministic rules) exists; Stages 1, 3, 4, 5 do not. No gold eval set. |
| [`methodology/peer-group.md`](methodology/peer-group.md) — quantity bands, BPS IKK regional adjustment, confidence tiers | Not implemented. The live peer group is (`canonical_category` × `canonical_unit` × `fiscal_year`). `min_group_size = 5` matches the documented floor. |
| [`methodology/red-flags/`](methodology/red-flags/) — all nine flags | None implemented. No flag is emitted anywhere; the benchmark produces distribution statistics only. Every spec is `status: planned`. |
| [ADR-0007](adr/0007-flag-specs-as-single-source.md) — code reads thresholds from spec frontmatter | No loader exists. `DEFAULT_MIN_GROUP_SIZE` is a Python constant today. |
| [ADR-0002](adr/0002-data-licence-lineage.md) — licence quarantine per raw partition | Not implemented. No licence dimension in the raw layer yet. Currently harmless: the only adapter reads local files. |
| [`editorial-policy.md`](editorial-policy.md) — banned-word enforcement | Not enforced. No `docs:lint`, no copy linter. Currently harmless: no user-facing copy exists. |
| `data/pdp.md`, `data/ocds-mapping.md`, `runbooks/`, `frontend-conventions.md`, `DATA-LICENSE.md` | Not written. Each waits on the code or the event it describes. |
| Seven of nine flag specs, completed | Stubs. Completed one per implementation PR. |

**No real procurement data has been ingested.** Everything green today is green against fixtures.

---

## Known defects

1. No `.prettierrc`, though `bun run format` runs prettier — formatting is whatever the installed default is.
2. Both Next apps still carry starter leftovers: `page.module.css` alongside Tailwind v4, and
   `apps/web/app/layout.tsx` metadata still reads "Create Next App".
3. `apps/web` loads Geist twice — Google Fonts plus two local `.woff` files.
4. `.npmrc` is empty (0 bytes).
5. `starlette.testclient` emits a deprecation warning about `httpx` under the installed FastAPI version.
6. The root README is in Indonesian while `docs/` is in English. Deliberate for the README as a public front
   page; noted so it is not mistaken for drift.

None of these block work.

---

## Related

- [`README.md`](README.md) — docs index
- [`architecture.md`](architecture.md) — intended shape, with its own divergence notes
- [`adr/0006-scrape-ekatalog-storefront.md`](adr/0006-scrape-ekatalog-storefront.md) — the data-access blocker
- [`adr/0011-category-vocabulary-before-kbki.md`](adr/0011-category-vocabulary-before-kbki.md) — why grouping is not KBKI yet
