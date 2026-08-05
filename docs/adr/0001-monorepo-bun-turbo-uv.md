# ADR-0001: Monorepo with bun + turbo for TypeScript, uv for Python

- **Status:** Accepted
- **Date:** 2026-07-28 (retroactive — the scaffold already reflects this)

## Context

The project needs two Next.js frontends, an HTTP API, and a heavy batch data pipeline. The pipeline needs
polars, DuckDB and possibly sentence-transformers; there is no credible way to do that work in TypeScript.
So the repository is unavoidably bilingual.

The frontends and the API share types and contracts, and the pipeline shares methodology constants with both.
Splitting into separate repositories would mean versioning those across repo boundaries for a project with a
very small team.

## Decision

One monorepo. **Turborepo** orchestrates tasks; **bun** is the package manager for the TypeScript
workspaces; **uv** manages the two Python workspaces, each with its own `pyproject.toml` and committed
`uv.lock`.

Python workspaces carry a thin `package.json` whose scripts shell out to `uv run`, so turbo can see them and
run `lint` / `test` / `dev` uniformly.

## Consequences

- One `bun run dev` starts everything; one CI config covers everything.
- **Two lockfile worlds.** `bun.lock` and two `uv.lock` files. Running `bun install` inside a Python
  workspace, or `pip install` anywhere, corrupts state. This is the most common way an agent or a new
  contributor breaks the repo, so it is stated in `AGENTS.md` and blocked in `.claude/settings.json`.
- CI needs two toolchains. Acceptable; both install fast and cache well.
- A Python workspace missing its bridge `package.json` becomes invisible to turbo — silently. That has
  already happened to `packages/pipeline` (see [`../status.md`](../status.md)), which is the concrete cost of
  this design.
- Reversal cost: low for splitting apart, high for merging back.

## Alternatives considered

**Separate repos per language.** Cleaner toolchain boundaries, but cross-repo type and constant sharing for a
one-to-two person team is worse than two lockfiles.

**All-TypeScript, with the pipeline in Node.** Would remove the bilingual problem entirely. Rejected because
polars/DuckDB/embedding tooling in the Python ecosystem is substantially better for this workload, and the
pipeline is the hard part of the project.

**pnpm instead of bun.** Genuinely close. bun was already chosen in the scaffold and is faster; pnpm has
better-established workspace tooling. Not worth re-litigating unless bun causes a concrete problem.
