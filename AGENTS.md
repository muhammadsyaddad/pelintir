# Pelintir — agent instructions

Indonesian public procurement price benchmarking. v1 goal: *did this agency pay several times what comparable
agencies paid for the same item?* Not a generic anomaly dashboard — the machine triages, humans investigate.

Infrastructure works (lint, test, migrations, pipeline on fixtures). **No flag is implemented, no real data is
ingested.** [`docs/status.md`](docs/status.md) is authoritative — read it before assuming anything works.

---

## The editorial rule

**A flag is a question, never an accusation.** This is a legal requirement, not a style preference.

- Correct: `Harga satuan 7,4× di atas median 214 paket sejenis — perlu diperiksa.`
- Banned: `Korupsi terdeteksi.` — and `Anomaly score: 0.87`, which is unfalsifiable and therefore useless.

Never in user-facing copy: `korupsi`, `korup`, `penggelapan`, `suap`, `kolusi`, `mark-up`, `terbukti`,
`pelanggaran`, `pidana`, `fraud`, `corrupt`, `rigged`, `proven`, `guilty`, `illegal`. Full list and the
approved phrasing patterns: [`docs/editorial-policy.md`](docs/editorial-policy.md).

User-facing copy is **Indonesian and Indonesian is authoritative**. Engineering docs are English.

---

## Never do

1. **No scraper or automated request against `katalog.inaproc.id` or `data.inaproc.id`** until
   [ADR-0006](docs/adr/0006-scrape-ekatalog-storefront.md) is Accepted. Its terms permit only Google/Bing/Baidu
   crawlers. This blocks the project's most valuable data source and is not a detail to work around.
2. **No data source without a row in [`docs/data/legal-register.md`](docs/data/legal-register.md).** It is a
   merge gate. `unknown` status counts as prohibited.
3. **Never mix CC BY-NC-SA source data into anything published** — [ADR-0002](docs/adr/0002-data-licence-lineage.md).
4. **Never publish a benchmark below `min_peer_n`** (currently 5). A median over three rows is an anecdote.
5. **Never commit** data files, `*.parquet`, `*.duckdb`, CSVs, `.env`, or personal data.
6. **Never claim KBKI precision.** The pipeline groups by a rule-based category vocabulary, not KBKI —
   [ADR-0011](docs/adr/0011-category-vocabulary-before-kbki.md).

---

## Commands

Run from the repo root unless stated.

| | |
|---|---|
| `bun install` | JS dependencies |
| `uv sync --project apps/api`, `uv sync --project packages/pipeline` | Python dependencies |
| `bun run services:up` / `services:down` | Postgres + Meilisearch via docker compose |
| `bun run migrate` | apply pending SQL migrations (idempotent) |
| `bun run dev` / `dev:web` / `dev:api` / `dev:dashboard` | web :3000, dashboard :3001, api :8000 |
| `bun run lint` | eslint + `ruff check` + `ruff format --check` |
| `bun run test` | pytest across both Python workspaces |
| `bun run check-types` | tsc |
| `bun run build` | — |
| `uv run pipeline ingest --from <dir> --year <y> [--category <s>]` | in `packages/pipeline` |
| `uv run pipeline benchmark --source local_csv --year <y>` | in `packages/pipeline` |

## Toolchain

**bun** for the TypeScript workspaces, **uv** for `apps/api` and `packages/pipeline`. Three committed
lockfiles: `bun.lock` and one `uv.lock` per Python workspace.

Never run `npm`, `pnpm` or `yarn` — they corrupt `bun.lock`. Never run `bun install` inside a Python
workspace. Never run bare `python`; use `uv run`. Never hand-edit a lockfile.
[ADR-0001](docs/adr/0001-monorepo-bun-turbo-uv.md).

## Workspaces

| Path | Put here |
|---|---|
| `apps/web` (:3000) | Public site. Every user-visible string is Indonesian and bound by the editorial policy |
| `apps/dashboard` (:3001) | Internal admin: normalisation corrections, vendor alias merges, report triage |
| `apps/api` (:8000) | FastAPI. See `apps/api/AGENTS.md` |
| `packages/pipeline` | Ingest, normalise, benchmark. See `packages/pipeline/AGENTS.md` |
| `packages/ui` | Components shared by both Next apps |

---

## Read this when

| Task | Read |
|---|---|
| Anything user-visible | [`docs/editorial-policy.md`](docs/editorial-policy.md) |
| Adding or changing a flag | [`docs/methodology/red-flags/README.md`](docs/methodology/red-flags/README.md) |
| Touching prices, medians, comparisons | [`docs/methodology/peer-group.md`](docs/methodology/peer-group.md) |
| Matching or grouping item names | [`docs/methodology/item-normalization.md`](docs/methodology/item-normalization.md) |
| Adding or fetching a data source | [`docs/data/legal-register.md`](docs/data/legal-register.md), then [`docs/data/sources.md`](docs/data/sources.md) |
| An Indonesian term you don't know | [`docs/glossary.md`](docs/glossary.md) |
| Assessing whether a claim is supportable | [`docs/methodology/limitations.md`](docs/methodology/limitations.md) |
| A choice that is expensive to reverse | [`docs/adr/README.md`](docs/adr/README.md) |
| Checking what actually works | [`docs/status.md`](docs/status.md) |

Full index: [`docs/README.md`](docs/README.md).

---

## Conventions

Flag thresholds and user-facing strings belong in red-flag spec frontmatter, and code reads them from there
([ADR-0007](docs/adr/0007-flag-specs-as-single-source.md)). A magic number in a pipeline module is a bug.

Style is enforced by eslint, prettier and ruff — run them rather than reasoning about formatting.

*If a fact in this file can become false without breaking a build, it should have been a link.* Add facts here
sparingly; put explanations in `docs/`.
