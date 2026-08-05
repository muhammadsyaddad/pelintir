# Contributing

Read [`docs/status.md`](docs/status.md) first — it is the only accurate account of what works. The rest of
`docs/` describes intent, and the gap between the two is deliberate and documented.

If you are touching anything a user will see, [`docs/editorial-policy.md`](docs/editorial-policy.md) is
mandatory, not background reading.

---

## Setup

Requires **bun 1.3.14+**, **uv**, **Python 3.12**, and **Docker**.

```sh
cp .env.example .env
bun run services:up                    # Postgres + Meilisearch
bun install
uv sync --project apps/api
uv sync --project packages/pipeline
bun run migrate
bun run dev
```

Verify: `curl localhost:8000/health` → `{"status":"ok","postgres":true,"meilisearch":true}`.

## Before you push

```sh
bun run lint
bun run check-types
bun run test
```

CI runs the same three plus `build`, and separately proves the migrations are idempotent by applying them
against a real Postgres and re-running.

## Toolchain rules

**bun** for TypeScript, **uv** for the two Python workspaces. Three lockfiles, all committed.

- Never `npm` / `pnpm` / `yarn` — they corrupt `bun.lock`.
- Never `bun install` inside a Python workspace.
- Never bare `python`; use `uv run`.
- Never hand-edit a lockfile.

Rationale: [ADR-0001](docs/adr/0001-monorepo-bun-turbo-uv.md).

---

## How to propose a red flag

1. Read [`docs/methodology/red-flags/README.md`](docs/methodology/red-flags/README.md) for the frontmatter
   contract and the seven required prose sections.
2. Write the spec first. **The phrasing is part of the design, not a finishing touch** — if you cannot state
   the finding as a question a supplier could dispute, the flag is not ready.
3. The **known false positives** section must be non-empty. A flag with no documented false positives has not
   been thought about, and yours will be reviewed on that section more than on the formula.
4. Implement it in `packages/pipeline`, reading thresholds from the spec rather than declaring them
   ([ADR-0007](docs/adr/0007-flag-specs-as-single-source.md)).
5. Set `status: implemented` in the same PR.

Seven of the nine catalogued flags are stubs, completed one per implementation PR. Adding a tenth indicator is
welcome, but say why it is not covered by the OCP set — inventing indicators is allowed, inventing them
silently is not.

## How to propose a data source

1. Add a row to [`docs/data/legal-register.md`](docs/data/legal-register.md) **before** writing any fetch code.
   This is a merge gate. `unknown` status is a valid starting state and blocks ingestion.
2. Check the source's terms of service **and** `robots.txt`, and quote the operative sentence. Do not summarise
   it.
3. Note whether it carries personal data (UU PDP).
4. Note the licence, and specifically whether it is non-commercial — that determines whether the data may ever
   be published ([ADR-0002](docs/adr/0002-data-licence-lineage.md)).
5. Implement it as a `Source` adapter; the adapter's docstring names its register row id.

**No scraper or automated request against `katalog.inaproc.id` or `data.inaproc.id`** while
[ADR-0006](docs/adr/0006-scrape-ekatalog-storefront.md) is `Proposed`. This blocks the project's most valuable
data source, on purpose. If that frustrates you, the productive response is helping file the access requests in
[`docs/data/access-requests.md`](docs/data/access-requests.md).

## When to write an ADR

When the choice is expensive to reverse: storage, classification, whether to collect from a source, licensing,
scope, hosting, or anything that would publish personal data. One page. Not required for dependency bumps,
formatting, or a flag that follows the existing contract. [`docs/adr/README.md`](docs/adr/README.md).

---

## Pull requests

The checklist in the PR template is not ceremony — each line corresponds to a way this project can do real
harm. Leave a box unchecked and say why rather than ticking it untruthfully.

Commits: imperative mood, present tense. Reference an ADR or a spec when the change follows one.

`docs/data/`, `docs/methodology/`, `docs/adr/` and `docs/editorial-policy.md` require owner review — they carry
legal and reputational weight.

## Documentation

Docs are English; Indonesian procurement terms stay verbatim and get a [`docs/glossary.md`](docs/glossary.md)
entry. User-facing copy is Indonesian and Indonesian is authoritative.

Two rules that matter more than they sound:

- **One home per fact.** If you find the same fact in two files, one is already wrong — delete it and link.
  The map is in [`docs/README.md`](docs/README.md).
- **Specs before code, descriptions after code.** Write methodology and policy up front; write architecture
  walkthroughs and runbooks in the PR that makes them true. Documenting code that does not exist produces
  fiction that other contributors and agents then act on.

If your change makes `docs/status.md` wrong, fix `status.md` in the same PR.

## Reporting problems

Security issues, and corrections to a flag on a real vendor or agency: [`SECURITY.md`](SECURITY.md). Do not
open a public issue containing personal data.
