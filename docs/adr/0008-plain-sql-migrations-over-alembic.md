# ADR-0008: Numbered plain SQL migrations rather than Alembic

- **Status:** Accepted
- **Date:** 2026-07-28

## Context

The Postgres schema needs versioned migrations. The default choice in a Python project is Alembic, usually
paired with SQLAlchemy models.

Two facts about this project's situation matter. The schema is going to change a lot — entity resolution,
normalisation storage and flag persistence are all unbuilt and their shapes are not yet known. And the team is
very small, so every additional abstraction has to earn its keep against one person's attention.

`apps/api` uses `psycopg` directly. There is no ORM, so Alembic's main advantage — autogenerating migrations
by diffing model definitions — has nothing to diff against.

## Decision

Numbered plain SQL files in `apps/api/migrations/`, applied by a small `apply.py` script.

```
apps/api/migrations/0001_init.sql
apps/api/migrations/0002_....sql
apps/api/migrations/apply.py
```

`apply.py` tracks applied versions in `schema_migrations` and is **idempotent** — running it twice is safe.
Each file runs once, inside a transaction. Editing an already-applied migration is **rejected**; the fix is a
new file.

`0001_init.sql` creates: `agency`, `vendor`, `vendor_alias`, `item_normalization`, `package`, `line_item`,
`app_user`, `report`.

CI proves the guarantee rather than asserting it: the `migrations` job in `.github/workflows/ci.yml` applies
against a real Postgres service and then re-runs `--status`.

`vendor` and `vendor_alias` ship in `0001` even though alias resolution starts as a no-op, per
[ADR-0003](0003-v1-scope-price-benchmark.md) — retrofitting entity resolution onto stored raw name strings
would mean reprocessing everything.

## Consequences

- Migrations are readable SQL. Anyone can see exactly what will run, which matters while the schema is
  changing weekly.
- No ORM metadata to keep in sync with the database.
- **No autogeneration**, so migrations are written by hand. Fine at this schema size, tedious later.
- **No downgrade path.** Rolling back means writing a forward migration that undoes the change. Acceptable
  pre-production; a real constraint once there is data worth preserving.
- `apply.py` is code we own and must test, including the idempotency guarantee.
- Reversal cost: low. Adopting Alembic later means one baseline migration stamped as the starting revision.
  **This is the single point in the plan that changes if the owner prefers Alembic.**

## Alternatives considered

**Alembic.** The conventional answer, and the right one for a larger team or a stable schema. Rejected for now
because its main benefit is autogeneration from ORM models we do not have, and it adds revision-graph concepts
before there is any complexity to manage.

**SQLAlchemy + Alembic together.** Rejected: adopting an ORM to justify a migration tool is the wrong direction,
and the analytical work is DuckDB SQL regardless.

**No migrations, rebuild the schema from a single `schema.sql`.** Tempting while there is no production data,
and genuinely simpler. Rejected because the dashboard will hold human normalisation and alias decisions
([ADR-0003](0003-v1-scope-price-benchmark.md)) — irreplaceable human work — from the first week it exists.
Dropping and recreating would destroy it.
