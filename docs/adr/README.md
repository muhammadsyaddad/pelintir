# Architecture Decision Records

An ADR records a decision that is expensive to reverse, and the reasoning available at the time it was made.
Its purpose is to stop the same argument being had twice, and to make it obvious what a future reversal
would cost.

---

## When an ADR is required

- Storage engines, or how data is partitioned
- The item classification backbone
- Whether and how to collect from a source
- Data licensing, and what may be published
- Scope decisions that determine what gets built first
- Hosting and deployment shape
- Anything that would publish personal data
- Where thresholds and user-facing copy are authoritative

**Not required for:** dependency bumps, formatting, adding a flag that follows the existing spec contract, or
anything a reviewer can undo in one commit.

If you are unsure, the test is: *would reversing this mean reprocessing data or rewriting a subsystem?*

---

## Rules

**One page, hard cap.** An ADR that needs more than a page is describing two decisions. Start from
[`0000-template.md`](0000-template.md).

**Immutable once Accepted.** Do not edit an accepted ADR to reflect a changed mind. Write a new one and mark
the old `Superseded by ADR-NNNN`. The record of what we believed and why is the point; editing it away
destroys the only thing an ADR is good for.

Typo and link fixes are fine.

**Statuses**

| Status | Meaning |
|---|---|
| `Proposed` | Under discussion. **Blocks any code that depends on it.** |
| `Accepted` | In force. |
| `Superseded by ADR-NNNN` | Replaced. Kept for the record. |
| `Rejected` | Considered and declined. Kept so it is not re-proposed. |

**Numbering** is sequential and never reused, including for rejected records. Filename:
`NNNN-kebab-case-title.md`.

`.claude/skills/write-adr/SKILL.md` handles numbering and the template.

---

## Index

| # | Title | Status |
|---|---|---|
| [0001](0001-monorepo-bun-turbo-uv.md) | Monorepo with bun + turbo for TypeScript, uv for Python | Accepted |
| [0002](0002-data-licence-lineage.md) | Only ODbL-lineage data reaches published artifacts | **Accepted** |
| [0003](0003-v1-scope-price-benchmark.md) | Direction A (price benchmark) is v1; Direction B is v2 | Accepted |
| [0004](0004-kbki-as-classification-backbone.md) | KBKI 2015 as the item classification backbone | Accepted |
| [0005](0005-storage-duckdb-postgres-meili.md) | Three storage engines for three roles | Accepted |
| [0006](0006-scrape-ekatalog-storefront.md) | Whether to collect e-Katalog listed prices | **Proposed — blocks scraper code** |
| [0007](0007-flag-specs-as-single-source.md) | Flag spec frontmatter is authoritative for thresholds and copy | Accepted |
| [0008](0008-plain-sql-migrations-over-alembic.md) | Numbered plain SQL migrations rather than Alembic | Accepted |
| [0009](0009-generic-source-adapter-pattern.md) | Generic source adapter protocol | Accepted |
| [0010](0010-single-vps-cron-r2.md) | Single VPS, cron scheduling, R2 for raw storage | Accepted |
| [0011](0011-category-vocabulary-before-kbki.md) | Rule-based category vocabulary as v0 grouping key; KBKI deferred | Accepted |

0001, 0004, 0005, 0008, 0009 and 0010 were written retroactively, after the choices had already been made in
the scaffold and the infrastructure pass. Recording them while the reasoning was still fresh was cheaper than
reconstructing it later.

0011 records a **live divergence** between the docs and the code: the pipeline groups items by a rule-based
category vocabulary, not by KBKI as 0004 and the methodology specs describe. Read it before trusting any
claim about KBKI precision.

**0002 and 0006 are the two that constrain everything else.** 0002 shapes the pipeline; 0006 determines
whether Direction A is buildable at all.
