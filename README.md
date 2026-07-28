# Pelintir

Price benchmarks for Indonesian government procurement.

Procurement data is public but effectively incomparable: vendor names are
written dozens of ways, the same item is described a hundred ways, and nobody
knows what one laptop is actually supposed to cost in an APBD. Pelintir
normalizes that data, computes a median per category, and flags what stands out.

## Status

Infrastructure stage is done. The next stage is **proving the median in a
notebook** before a single line of frontend exists. See
`packages/pipeline/notebooks/01_proof_laptop.ipynb`.

Not built yet: R2, pgvector, embeddings, Meilisearch indexes, public pages,
finding reports. All of it waits until the median is shown to be sensible.

A full account of what actually runs today — including the gap between the specs
in `docs/` and the code — is in [`docs/status.md`](docs/status.md).

## The rule everything else hangs on

> **A finding is a question, not an accusation.**

Right: `Harga satuan 7,4× di atas median 214 paket sejenis — perlu diperiksa.`

Not: ~~`Korupsi terdeteksi.`~~ ~~`Anomaly score: 0.87`~~

Unusual does not mean unlawful. Every indicator has a legitimate explanation, and
[`docs/methodology/limitations.md`](docs/methodology/limitations.md) lists them.
This is a legal requirement, not a matter of tone — the full policy, including
the banned-word list and the correction procedure, is in
[`docs/editorial-policy.md`](docs/editorial-policy.md).

## Documentation

Technical docs are written in English; Indonesian procurement terms are kept
verbatim and have glossary entries. All user-facing text is Indonesian, and the
Indonesian version is the authoritative one.

| What you want | Read |
|---|---|
| What actually works | [`docs/status.md`](docs/status.md) |
| Why the project is built this way | [`docs/methodology/README.md`](docs/methodology/README.md) |
| Writing anything a user will see | [`docs/editorial-policy.md`](docs/editorial-policy.md) |
| Adding or changing an indicator | [`docs/methodology/red-flags/README.md`](docs/methodology/red-flags/README.md) |
| Prices, medians, peer groups | [`docs/methodology/peer-group.md`](docs/methodology/peer-group.md) |
| Item normalization | [`docs/methodology/item-normalization.md`](docs/methodology/item-normalization.md) |
| **Adding a data source** | [`docs/data/legal-register.md`](docs/data/legal-register.md) — this is a merge gate, not a reference |
| What is in each data source | [`docs/data/sources.md`](docs/data/sources.md) |
| Procurement terminology | [`docs/glossary.md`](docs/glossary.md) |
| Why a technical decision was made | [`docs/adr/`](docs/adr/) |
| Citing Pelintir in your writing | [`docs/methodology/limitations.md`](docs/methodology/limitations.md) |
| Everything | [`docs/README.md`](docs/README.md) |

Instructions for coding agents: [`AGENTS.md`](AGENTS.md).

## Data and legal constraints

Two constraints shape the entire project:

- The e-Katalog storefront is the **only public source of unit prices**, and its
  ToS permits only the Google, Bing and Baidu crawlers. Undecided:
  [ADR-0006](docs/adr/0006-scrape-ekatalog-storefront.md). Until that is settled,
  do not write any scraper against `katalog.inaproc.id` or `data.inaproc.id`.
- Licences differ per source and some are **non-commercial**. Non-commercial data
  is quarantined and never reaches a public artifact:
  [ADR-0002](docs/adr/0002-data-licence-lineage.md).

The code is [MIT](LICENSE) licensed. **Data licensing is separate and stricter.**
Contributing: [`CONTRIBUTING.md`](CONTRIBUTING.md). Report a security issue or an
incorrect finding: [`SECURITY.md`](SECURITY.md).

## Repo layout

| Path | Contents |
|---|---|
| `apps/web` | Public site. Next.js App Router, port 3000. SSR for SEO. |
| `apps/dashboard` | Internal admin: normalization corrections, vendor alias merging, report triage. Port 3001. |
| `apps/api` | FastAPI + Pydantic v2, port 8000. Postgres via a `psycopg` pool, Meilisearch client. |
| `packages/pipeline` | Ingestion, normalization (polars), benchmarks (DuckDB), the proof notebook. |
| `packages/ui` | Shared React components. |
| `packages/eslint-config`, `packages/typescript-config` | Shared configuration. |

## Running it

Requires: [bun](https://bun.sh) 1.3+, [uv](https://docs.astral.sh/uv/), Docker.

```sh
# 1. Configuration
cp .env.example .env

# 2. Postgres + Meilisearch
bun run services:up

# 3. Dependencies
bun install
uv sync --project apps/api
uv sync --project packages/pipeline

# 4. Database schema
bun run migrate

# 5. All apps
bun run dev
```

Check the API is alive:

```sh
curl localhost:8000/health
# {"status":"ok","postgres":true,"meilisearch":true}
```

Stop the services: `bun run services:down`.

## Pipeline

```sh
cd packages/pipeline

# CSVs you downloaded by hand -> raw Parquet
uv run pipeline ingest --from ./downloads --year 2023 --category laptop

# Normalize + benchmark
uv run pipeline benchmark --year 2023
```

Without real data, the notebook and the tests fall back to a small fixture in
`packages/pipeline/tests/fixtures/`, so both run from a clean clone.

The proof notebook:

```sh
cd packages/pipeline && uv run jupyter lab notebooks/01_proof_laptop.ipynb
```

### Data flow

```
source (adapter)  ->  data/raw/<source>/<year>/*.parquet   (as-is, never edited)
                  ->  polars normalization                  (src/pipeline/normalize.py)
                  ->  data/normalized/...                    (comparable items)
                  ->  DuckDB benchmarks                      (sql/benchmark.sql)
                  ->  data/benchmarks/*.parquet              (p25 / median / p75 / MAD)
```

The raw layer is the audit trail. Normalization rules will keep changing; being
able to replay new rules over untouched input is what makes changing them safe.

The data source is not decided yet (LPSE/SPSE, opentender, e-Katalog LKPP).
Everything downstream depends only on the `Source` protocol in
`packages/pipeline/src/pipeline/sources/base.py`, so adding a real source means
writing one adapter and changing nothing else.

## Tests and linting

```sh
bun run lint          # eslint + ruff, every workspace
bun run check-types   # tsc
bun run test          # pytest, every Python workspace
```

## Database migrations

Numbered plain SQL in `apps/api/migrations/`, not Alembic. Each file runs once,
inside a transaction, and is recorded in the `schema_migrations` table. Editing a
migration that has already been applied is rejected — add a new file instead.

```sh
bun run migrate                                   # apply pending
uv run --project apps/api python apps/api/migrations/apply.py --status
```

## Decisions

**One VPS, not Kubernetes.** The workload is one stateless API, one Postgres, one
Meilisearch, one daily batch. That fits on a single mid-sized machine for years.

**Meilisearch, not Postgres full-text.** Typo tolerance for Indonesian vendor
names is one afternoon of work, one binary, small memory footprint.

**Cron first, Prefect if needed.** Move only once there are real dependencies
between jobs. Airflow is not on the list.

**R2, not S3**, when raw storage moves to the cloud. The point of this project is
to spread the data around; billing ourselves per GB of egress works against that.

Deliberately not used: Spark, Kafka, Kubernetes, Elasticsearch, GraphQL, Redis,
microservices. Every component is a component to monitor, upgrade and debug at
2am. For a small team, the number of moving parts is a tighter budget than money.
