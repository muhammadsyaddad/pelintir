# ADR-0010: Single VPS, cron scheduling, R2 for raw storage

- **Status:** Accepted
- **Date:** 2026-07-28

## Context

The runtime workload is modest and well understood: one stateless API, one Postgres, one Meilisearch, and one
batch job that runs on a schedule. There is no request-volume problem, no low-latency requirement, and no
need to scale any component independently of the others.

The team is very small. Every additional moving part is something that must be monitored, upgraded, and
debugged at 2am by the same person.

## Decision

**One VPS.** No Kubernetes, no container orchestration beyond `docker compose` for stateful dependencies.
This workload fits on one medium machine for years.

**Cron for scheduling.** Move to an orchestrator only when there are real inter-job dependencies to express.
Prefect is the candidate if that happens; Airflow is not under consideration.

**Cloudflare R2 for raw object storage**, when the raw layer moves off local disk. The pipeline is already
shaped for it: `packages/pipeline/src/pipeline/settings.py` resolves the data root from
`PELINTIR_DATA_DIR`, so the change is a prefix plus polars `storage_options`, not a restructure.

Deliberately not used: Spark, Kafka, Kubernetes, Elasticsearch, GraphQL, Redis, microservices.

## Consequences

- One machine to secure, back up, and reason about. Restoring the whole system is restoring one host plus two
  volumes.
- **Single point of failure.** Accepted: this is a public-interest data project, not a payments system. An
  hour of downtime costs nothing irreversible.
- Vertical scaling only. Fine at this data volume; DuckDB does full-corpus aggregation on a single machine.
- Cron gives no retry semantics, no dependency graph, and no run history beyond logs. When a job silently
  fails to run, we find out late. That is the concrete cost, and it is the signal to reconsider.
- **R2 rather than S3 is a mission decision, not only a cost one.** This project exists to spread data
  around; per-GB egress billing works directly against publishing bulk downloads. R2's zero egress makes the
  intended behaviour free instead of penalised.
- Reversal cost: low for scheduling, moderate for hosting, low for storage (a path prefix).

## Alternatives considered

**Managed Postgres and a PaaS.** Less operational work, and a reasonable choice. Rejected on recurring cost
for a project with no revenue, and because a single VPS is genuinely simple rather than merely cheap.

**Kubernetes.** Rejected outright. There is nothing here to orchestrate, and the operational surface exceeds
the entire application.

**S3.** Better ecosystem support and more mature tooling. Rejected on egress cost, per the reasoning above.

**Airflow.** Rejected: heavier than the problem by an order of magnitude.
