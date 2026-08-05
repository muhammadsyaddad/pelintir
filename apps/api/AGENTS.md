# apps/api

FastAPI on Python 3.12, port 8000. Read [`../../AGENTS.md`](../../AGENTS.md) first.

## Toolchain

`uv`, not pip. `uv run <cmd>`, never bare `python`. `uv.lock` is committed and never hand-edited. Never run
`bun install` here.

```sh
uv sync
uv run uvicorn app.main:app --reload --port 8000   # or: bun run dev:api from the root
uv run ruff check . && uv run ruff format --check .
uv run pytest
uv run python migrations/apply.py [--status]
```

## Conventions

- **Config is `pydantic-settings`** (`app/settings.py`), reading `.env` then `../../.env`. Do not add
  `python-dotenv`, and do not read `os.environ` directly in request handlers.
- **One pool, lifespan-managed** (`app/db.py`). No per-request connections.
- **`/health` degrades, it does not fail.** It reports Postgres and Meilisearch separately so a dependency
  outage is visible rather than fatal. Keep that shape.
- **Migrations are numbered plain SQL** in `migrations/`, applied by `apply.py`. Editing an applied migration
  is rejected — add a new file. [ADR-0008](../../docs/adr/0008-plain-sql-migrations-over-alembic.md).
- **The OpenAPI document at `/docs` is the API reference.** Do not hand-write one.
- **Never log request or response bodies that carry vendor identity**, and never log connection strings.
  Officials' names and sole-proprietor NPWP are personal data under UU PDP.

## Boundaries

This service serves data; it does not compute flags or normalise items — that is `packages/pipeline`. If you
find yourself writing a threshold or a median here, it belongs there instead.
