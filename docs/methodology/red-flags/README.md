# Red Flag Specifications

One file per indicator. Each file is the **single source of truth** for that indicator's thresholds and
its user-facing copy: the pipeline and the UI read the frontmatter rather than hardcoding numbers or
strings. See [`../../adr/0007-flag-specs-as-single-source.md`](../../adr/0007-flag-specs-as-single-source.md).

Read [`../README.md`](../README.md) for the doctrine behind these indicators, and
[`../../editorial-policy.md`](../../editorial-policy.md) before writing any `question_*` field.

---

## The catalog

All nine indicators are derivable from SiRUP / SPSE / e-Katalog data and map to standard Open
Contracting Partnership red-flag indicators.

| Flag | Direction | Status | Needs unit prices? |
|---|---|---|---|
| [unit-price-vs-peer-median](unit-price-vs-peer-median.md) | A | planned | **Yes** |
| [single-bidder](single-bidder.md) | B-adjacent | planned | No |
| [award-vs-hps](award-vs-hps.md) | A | planned | No |
| [vendor-concentration](vendor-concentration.md) | B | planned | No |
| [new-vendor-large-first-contract](new-vendor-large-first-contract.md) | B | planned | No |
| [short-tender-window](short-tender-window.md) | B-adjacent | planned | No |
| [year-end-spike](year-end-spike.md) | A | planned | No |
| [direct-award-share](direct-award-share.md) | A | planned | No |
| [vague-package-title](vague-package-title.md) | A | planned | No |

`unit-price-vs-peer-median` is the strongest single signal and the v1 target
([ADR-0003](../../adr/0003-v1-scope-price-benchmark.md)) — and the only one blocked on data access
([ADR-0006](../../adr/0006-scrape-ekatalog-storefront.md)). Every other flag in this table can be built
from data we can already obtain, which is why the catalog is documented in full rather than narrowed to
Direction A.

**Two specs are complete** (`unit-price-vs-peer-median`, `single-bidder`) and serve as the reference
form. **Seven are stubs**: frontmatter, the question, and the non-claims are written, because those are
decided. Formula and threshold justification are filled in by the PR that implements the flag — writing
them now would be fiction.

---

## Frontmatter contract

Every spec file opens with YAML frontmatter. `docs:lint` fails the build if any required key is missing
or malformed.

```yaml
---
id: unit-price-vs-peer-median      # required. kebab-case, must equal the filename stem
status: planned                    # required. planned | implemented | retired
severity: high                     # required. low | medium | high
direction: A                       # required. A (price) | B (vendor) | B-adjacent
inputs:                            # required, non-empty. table.column references
  - line_item.unit_price
  - line_item.qty
  - item_normalization.canonical_id
min_peer_n: 5                      # required for any flag with a peer group; else null
thresholds:                        # required, non-empty. named, never inline in code
  ratio_warn: 2.0
  ratio_high: 4.0
question_id: >-                    # required. Indonesian, authoritative. {placeholders} allowed.
  Harga satuan {ratio}× di atas median {n} paket sejenis — perlu diperiksa.
question_en: >-                    # required. English gloss, non-authoritative.
  Unit price is {ratio}× the median of {n} comparable packages — worth checking.
ocp_reference: OCP-RF-PRICE-01     # required. OCP indicator lineage, or "none" with justification
last_reviewed: 2026-07-28          # required. ISO date. Quarterly review at 180 days.
---
```

### Field rules

- **`id`** must equal the filename without `.md`. The doc-code contract test asserts every
  `status: implemented` flag has a matching implementation and vice versa.
- **`thresholds`** are named and consumed by code. A magic number in a pipeline module is a bug.
- **`min_peer_n`** is `null` only for flags with no peer comparison. When set, the pipeline must not
  emit the flag below it — this is enforced, not advisory. See [`../peer-group.md`](../peer-group.md).
- **`question_id`** placeholders must be a subset of what the implementation actually supplies.
  Unfilled placeholders reaching a user are a hard failure.
- **`question_id`** is checked against the banned-word list in
  [`../../editorial-policy.md`](../../editorial-policy.md).
- **`ocp_reference`** — if an indicator has no OCP equivalent, write `none` and justify it in the
  lineage section. Inventing indicators is allowed; inventing them silently is not.

---

## Required prose sections

In this order, all mandatory:

1. **The question** — the `question_id` string rendered with example values, plus the English gloss.
2. **What this does not claim** — explicit. The section a lawyer reads first.
3. **Formula** — precise enough to reimplement. Name every input field.
4. **Peer group** — link to [`../peer-group.md`](../peer-group.md) and state any flag-specific narrowing.
5. **Threshold justification** — why these numbers. "It looked right" is an acceptable answer *if
   stated*; an unstated threshold is not.
6. **Known false positives** — **must be non-empty.** A flag with no documented false positives has not
   been thought about. `docs:lint` fails on an empty section.
7. **Lineage** — the OCP indicator, and any academic or ProZorro precedent.

---

## Adding a flag

1. Read [`../../editorial-policy.md`](../../editorial-policy.md).
2. Copy the frontmatter block above; write the seven sections.
3. Implement it in `packages/pipeline`, reading thresholds from the spec — never re-declaring them.
4. Set `status: implemented` in the same PR.
5. Tick the flag box in [`.github/pull_request_template.md`](../../../.github/pull_request_template.md).

Once the first flag has been built by hand, this procedure becomes
`.claude/skills/new-red-flag/SKILL.md` — see [`../../../AGENTS.md`](../../../AGENTS.md).
