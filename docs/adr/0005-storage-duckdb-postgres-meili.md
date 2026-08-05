# ADR-0005: Three storage engines for three roles

- **Status:** Accepted
- **Date:** 2026-07-28 (retroactive — dependencies already reflect this)

## Context

The workload has three genuinely different read patterns:

1. **Analytical.** Aggregate over millions of procurement line items to compute per-group medians and MAD.
   Full-corpus, column-oriented, batch, read-only.
2. **Transactional.** Resolved entities, alias merges, normalisation decisions, flags, users, reports.
   Small rows, concurrent writes from the dashboard, needs constraints and transactions.
3. **Search.** Users type agency, vendor and package names that are inconsistently spelled in the source
   data and will be misspelled again by the user.

## Decision

| Engine | Role |
|---|---|
| **Parquet + DuckDB** | Analytical layer. Raw ingested data as Parquet; benchmark computation via DuckDB reading Parquet directly. |
| **Postgres** | Application state. |
| **Meilisearch** | Search index, fed from Postgres. |

DuckDB reads Parquet in place (`read_parquet`). There is no separate load step and no analytical server to
operate.

## Consequences

- Benchmark SQL runs over the whole corpus without loading it into a database first, and the raw layer stays
  file-based and append-only — which is what makes a published flag traceable to the snapshot it was computed
  from.
- Typo-tolerant search comes free rather than being built on Postgres full-text, which handles Indonesian
  name variation poorly.
- **Three engines to run, back up, and reason about.** For a very small team this is the main cost.
  Mitigated by DuckDB being a library rather than a service — in practice there are two servers, not three.
- Data exists in more than one place, so there is a sync path (Postgres → Meilisearch) that can drift. Needs
  a reindex procedure, which belongs in `runbooks/` once it exists.
- Reversal cost: moderate. Dropping Meilisearch for Postgres full-text is a week's degradation. Moving
  analytics into Postgres would be a rewrite of the benchmark layer.

## Alternatives considered

**Postgres for everything** (with `pg_trgm` for search and materialised views for benchmarks). Genuinely
close, and the right answer at smaller scale — one engine, one backup, one mental model. Rejected because
full-corpus aggregation over millions of line items is exactly what a row store is bad at, and the benchmark
job is the core of the product rather than a side feature.

**DuckDB for everything.** Rejected: no concurrent writers, so the dashboard review queue could not work.

**A cloud warehouse (BigQuery, Snowflake).** Rejected: cost and vendor dependency for a civic project, and
DuckDB handles this data volume on a single machine.

**pgvector for embedding search.** Deferred, not rejected. Only relevant if embeddings become part of
normalisation — see [`../methodology/item-normalization.md`](../methodology/item-normalization.md). Choosing
it now would be committing to a fallback path that may never be needed.
