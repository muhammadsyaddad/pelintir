# Pelintir Documentation

Navigation only. Every fact lives in exactly one file; this page tells you which.

**Start here if you are new:** [`status.md`](status.md) — what actually runs today, and the honest gap between
these specs and the code. Infrastructure works; the flag layer does not exist yet.

---

## I want to…

| Goal | Read |
|---|---|
| Understand what this project is and why | [`methodology/README.md`](methodology/README.md) |
| Know what actually works right now | [`status.md`](status.md) |
| Understand the system shape | [`architecture.md`](architecture.md) |
| Write or review anything a user will see | [`editorial-policy.md`](editorial-policy.md) — **required** |
| Add or change a red flag | [`methodology/red-flags/README.md`](methodology/red-flags/README.md) |
| Work on prices, medians, or comparisons | [`methodology/peer-group.md`](methodology/peer-group.md) |
| Work on item matching | [`methodology/item-normalization.md`](methodology/item-normalization.md) |
| Add a data source | [`data/legal-register.md`](data/legal-register.md) — **a merge gate, not a reference** |
| Find out what a source contains | [`data/sources.md`](data/sources.md) |
| Understand an Indonesian procurement term | [`glossary.md`](glossary.md) |
| Cite Pelintir in a story | [`methodology/limitations.md`](methodology/limitations.md) — **required** |
| Know why a technical choice was made | [`adr/`](adr/) |
| Work on vendor analysis | [`methodology/vendor-network.md`](methodology/vendor-network.md) |
| Check what we have asked LKPP for | [`data/access-requests.md`](data/access-requests.md) |
| Contribute code | [`../CONTRIBUTING.md`](../CONTRIBUTING.md) |
| Report a security issue or a wrong flag | [`../SECURITY.md`](../SECURITY.md) |

Agent instructions are in [`../AGENTS.md`](../AGENTS.md), which routes here rather than repeating any of it.

---

## Map

```
docs/
  status.md              what runs today — the only place this is recorded
  architecture.md        system shape, storage roles, pipeline stages
  editorial-policy.md    how findings must be phrased. The most important file here.
  glossary.md            Indonesian procurement terminology

  data/
    sources.md           what each source contains
    legal-register.md    whether we may use it. No ingestion merges without a row.
    access-requests.md   formal access attempts and their outcomes

  methodology/
    README.md            doctrine and indicator lineage
    peer-group.md        what "comparable" means; min_peer_n
    item-normalization.md  the moat: free text → KBKI canonical items
    vendor-network.md    Direction B, planned for v2
    limitations.md       what the data cannot tell you
    red-flags/           one spec per indicator; thresholds and copy live here

  runbooks/              [not yet written — waiting on real services]
  adr/                   architecture decision records
```

---

## How these docs work

Four rules. They are not style preferences; they are what keeps documentation true as code changes.

**1. Specs before code, descriptions after code.** Methodology, policy, legal analysis and glossary describe
*intent* and are true independently of any implementation, so they are written up front. Architecture
walkthroughs, API references and setup transcripts describe *artifacts* — writing those before the artifact
exists produces confident fiction, which is worse than a gap because people and agents act on it.

Anything aspirational is marked `status: planned`.

**2. One home per fact.** Every fact has exactly one authoritative location, and it is the most
code-adjacent place that can hold it. Everything else links.

| Fact | Lives in |
|---|---|
| What works today | [`status.md`](status.md) |
| Commands | `package.json`, `turbo.json`, `pyproject.toml` — docs cite script *names* |
| Env vars | `.env.example` |
| Database schema | the migration files |
| API surface | the generated OpenAPI at `/docs` |
| Flag thresholds and user-facing copy | red-flag spec frontmatter |
| Source licence and terms | [`data/legal-register.md`](data/legal-register.md) |
| Term definitions | [`glossary.md`](glossary.md) |
| Why a choice was made | [`adr/`](adr/) |

If you find the same fact in two places, one of them is already wrong. Delete it and link.

**3. Machine-check what matters.** The editorial rule and the flag contract are enforced by
`packages/pipeline/tests/test_docs_contract.py`, which runs in `bun run test` and in CI — not by review
discipline alone. It validates flag frontmatter, rejects banned words in `question_*` fields, requires a
non-claims section, holds implemented flags to having an implementation, and fails on a broken internal link or
an orphaned page. External links are checked weekly rather than per-PR, because government hosts flake and a
check that cries wolf gets ignored.

Prose that only a reviewer checks eventually stops being checked.

**4. Two doc families carry `last_reviewed`.** `data/*` and `methodology/red-flags/*`, because only those
decay against external reality — regulations change, endpoints move, terms are revised. Everything else is
reviewed when the code it describes changes. Dating every file would mean nobody reads any of the dates.

---

## Language

Engineering docs are English. Indonesian procurement terms are kept verbatim — they are legal categories,
and translating them invents precision that does not exist. Every such term has a [`glossary.md`](glossary.md)
entry.

**All user-facing copy is Indonesian and Indonesian is authoritative.** English glosses in flag specs exist
for contributors; if the two disagree, the Indonesian string is the real one.

Methodology prose may use precise analytical vocabulary — including *collusion* and *mark-up* — because it
describes what an indicator is derived from. User-facing copy may not. That boundary is defined in
[`editorial-policy.md`](editorial-policy.md).
