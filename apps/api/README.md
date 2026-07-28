# apps/api

FastAPI, Python 3.12, port 8000. Serves both frontends; computes nothing.

```sh
uv sync
uv run uvicorn app.main:app --reload --port 8000   # or `bun run dev:api` from the repo root
uv run pytest
uv run python migrations/apply.py --status
```

Needs Postgres and Meilisearch running — `bun run services:up` from the repo root. Config comes from `.env`
(see `../../.env.example`) via `pydantic-settings` in `app/settings.py`.

| | |
|---|---|
| `app/main.py` | app, CORS, lifespan pool, `GET /health` |
| `app/settings.py` | `pydantic-settings` configuration |
| `app/db.py` | `psycopg` pool + `ping()` |
| `app/search.py` | Meilisearch client + `ping()` |
| `migrations/` | numbered plain SQL + idempotent `apply.py` ([ADR-0008](../../docs/adr/0008-plain-sql-migrations-over-alembic.md)) |

API reference is the generated OpenAPI document at <http://localhost:8000/docs>. There is no hand-written one.

Conventions and prohibitions: [`AGENTS.md`](AGENTS.md).
