# Item Normalization

**This is the moat.** Anyone can render a procurement dashboard. Very few people can say with a straight
face that 214 packages across 180 agencies bought *the same thing*. Everything in Direction A rests on
this one problem, and if it is done badly every price flag downstream is noise.

`status: partial` — **Stage 2 (deterministic rules) is implemented and tested; Stages 1, 3, 4 and 5 are not,
and the grouping key is not yet KBKI.** This document is the spec the implementation must grow into.

> [!IMPORTANT]
> What exists today, in `packages/pipeline/src/pipeline/normalize.py`: a 17-entry canonical unit vocabulary,
> an ordered category-rule vocabulary producing `canonical_category`, entity-name normalisation, brand
> extraction, price derivation, and `reject_reason` / `split_usable`. 51 tests.
>
> What does not exist: the canonical dictionary and exact-match stage, fuzzy matching, embeddings, the human
> review queue, confidence tiers, the gold eval set — and **KBKI mapping**. Grouping is by rule-based
> category, which is a stopgap with a known ceiling: see
> [ADR-0011](../adr/0011-category-vocabulary-before-kbki.md).
>
> Do not cite KBKI-level precision for anything the current pipeline produces.

---

## The problem

Procurement item text is written by thousands of people with no shared convention. The same product
arrives as:

```
Laptop Lenovo ThinkPad T14 Gen 3 i7 16GB 512GB SSD
LAPTOP LENOVO THINKPAD T-14 GEN3 (i7/16/512)
Notebook Lenovo Thinkpad T14 G3 Core i7 RAM 16 GB
Komputer Portable merk Lenovo tipe ThinkPad T14 Gen 3
Pengadaan 1 (satu) unit laptop untuk keperluan Bagian Umum
```

The last one is the real problem: it is not a product name at all. Units are equally inconsistent — `bh`,
`buah`, `unit`, `pcs`, `set`, `paket`, `lusin` — and the quantity is sometimes embedded in the description
text rather than the quantity column.

Success is a `canonical_id` per line item, at **KBKI 2015 level 7 or deeper**, with a confidence score —
because [`peer-group.md`](peer-group.md) excludes low-confidence rows rather than guessing.

---

## Why KBKI is the backbone

**KBKI 2015** is mandatory in SiRUP, SPSE and e-Katalog under **SE Kepala LKPP No. 2 Tahun 2023**. It is
hierarchical (1–10 digits) and maps to CPC and HS.

We classify *into KBKI* rather than inventing a taxonomy for three reasons: some records already carry it,
so there is ground truth to train and evaluate against; it is externally defined, so our groupings are
auditable by someone who does not trust us; and it maps to international classifications, making the work
comparable to EU CPV-based benchmarking. Rationale: [ADR-0004](../adr/0004-kbki-as-classification-backbone.md).

The KBKI code in a source record is treated as **a strong hint, not ground truth.** It is entered by hand
and is often wrong or truncated to a shallow level. Where a record's stated KBKI conflicts with a
high-confidence text match, the conflict is recorded, not silently resolved.

---

## The cascade

Four stages, cheapest first. Each stage only sees what the previous one could not resolve. Every stage
emits a confidence and a reason — a row's classification is always explainable.

### Stage 1 — exact match

Normalise text (casefold, collapse whitespace, strip punctuation) and look up an exact hit in the
canonical dictionary, seeded from e-Katalog product names and confirmed manual mappings.

Cheap, and it handles the long tail of repeated identical entries better than anything else. Confidence:
`exact`.

### Stage 2 — deterministic rules

**Implemented.** Ordered, individually testable rules. **This is where most of the real value is**, and where
the work should stay as long as possible.

Live example of why ordering is a rule in its own right: `aksesori_it` is matched *before* `laptop`, because
`"Tas Laptop 14 inch"` at Rp150.000 would otherwise land in the laptop group and drag its median down. The
cost is that `"laptop lengkap dengan tas"` gets filed as an accessory — a visible mistake, which is strictly
preferable to a quietly poisoned median.

- Indonesian unit expansion: `bh`/`buah`, `unit`, `pcs`/`pieces`, `set`, `paket`, `lusin`, `rim`, `kg`,
  `ltr`. Normalise to a canonical UoM enum; refuse rather than guess on ambiguity.
- Product-word synonyms: `laptop` / `notebook` / `komputer portable`; `AC` / `pendingin ruangan` /
  `air conditioner`.
- Brand and model extraction against a known-brand list, with model-number pattern matching
  (`T14 Gen 3` ≡ `T-14 GEN3` ≡ `T14 G3`).
- Specification extraction into structured fields: CPU tier, RAM GB, storage GB, capacity PK, dosage mg.
- Procurement boilerplate stripping: `pengadaan`, `belanja`, `untuk keperluan`, `tahun anggaran`,
  bracketed quantity restatements.
- Unit price derivation: `total / qty`, then rejection of rows with `qty <= 0` or non-positive price.

**Each rule is one small function with its own test.** This is the difference between a normaliser you can
debug and one you can only re-run and hope. Non-negotiable, and stated in
[`../../packages/pipeline/AGENTS.md`](../../packages/pipeline/AGENTS.md).

Confidence: `rules`.

### Stage 3 — fuzzy match

TF-IDF character n-gram similarity against the canonical dictionary, re-ranked by normalised longest
common subsequence (nLCS). Above a tuned similarity floor → accept as `fuzzy`; below → Stage 4.

nLCS re-ranking exists because TF-IDF alone confuses model numbers that share substrings; the technique is
established in the product-name-matching literature.

### Stage 4 — embeddings

**Only if Stages 1–3 provably fall short of the accuracy target.** `sentence-transformers` is already a
dependency of `packages/pipeline` in anticipation, but it is a fallback, not the default. The rules-first
position is recorded in [`../../packages/pipeline/AGENTS.md`](../../packages/pipeline/AGENTS.md); adopting
a model, and pinning which one, requires its own ADR.

Reasoning: rules are debuggable, testable, deterministic across runs, and cheap. Embeddings are none of
those, and a wrong embedding match is invisible where a wrong rule is a failing test. Reaching for a model
first is the standard way this problem gets built and then abandoned.

If used:

- The model is **pinned by exact version** — a silent model upgrade retroactively changes every published
  benchmark. Candidate: a multilingual sentence encoder that handles Indonesian; the specific choice
  belongs in an ADR when it is made.
- Embedding is a **candidate generator only**. Nearest neighbours are accepted only when they also clear a
  deterministic check (same KBKI parent, compatible UoM, compatible extracted specs).
- Confidence: `embedding` — the lowest accepted tier.

### Stage 5 — human review

Anything unresolved lands in a review queue in `apps/dashboard`. A reviewer's decision writes back to the
canonical dictionary with `source: manual`, which makes it a Stage 1 exact hit forever after.

This is the DoZorro loop applied to data cleaning rather than to findings: the machine narrows, humans
decide, and the decision is captured so the same work is never repeated. The queue is prioritised by
spend, because correcting the normalisation of a Rp40 billion line matters more than a Rp400,000 one.

---

## Confidence tiers

| Tier | Source | Used in peer groups? | Flaggable? |
|---|---|---|---|
| `exact` | Stage 1, or `manual` | Yes | Yes |
| `rules` | Stage 2 | Yes | Yes |
| `fuzzy` | Stage 3 | Yes | Yes |
| `embedding` | Stage 4 | Yes, contributes to median | **No** — never the subject of a flag |
| `review` | queued | No | No |
| `rejected` | unresolvable | No | No |

The asymmetry in the `embedding` row is deliberate: a weakly matched row may inform a median, where its
influence is diluted across the group, but must never itself be the row we publish an accusation-shaped
claim about. Being wrong about one row's identity while naming an agency is the exact failure mode the
editorial policy exists to prevent.

---

## Evaluation

**Without an eval set this document is unfalsifiable, and so is the moat.**

- **Gold set:** ≥1,000 line items, hand-labelled to KBKI level 7+, stratified across categories and
  spanning easy and adversarial cases. Versioned in the repo (labels, not raw source data).
- **Held-out split** never used for rule tuning.
- **Metrics:** precision and recall of canonical assignment per tier; coverage (share of rows reaching an
  accepted tier); and **group purity** — for each peer group, the share of members that genuinely are the
  same product. Purity is the metric that actually protects the benchmark.
- **Targets for v1:** ≥95% precision on `exact`+`rules`+`fuzzy` combined, ≥60% coverage. Precision is
  prioritised over coverage; a smaller trustworthy set of comparisons beats a large unreliable one.
- **Regression gate:** the eval runs in CI once implemented. A change that lowers precision fails, even if
  it raises coverage.

Any published accuracy claim cites this eval. Claims not backed by it do not go in the product.

---

## Failure modes

- **Grouping too shallow** — the median becomes meaningless. Mitigated by the level-7 floor in
  [`peer-group.md`](peer-group.md).
- **Grouping too deep** — every item is unique, `n` collapses below `min_peer_n`, nothing is publishable.
- **Boilerplate-only descriptions** — `"Pengadaan peralatan kantor"` is not classifiable at level 7 and
  must be rejected, not guessed at. Related: the `vague-package-title` flag treats this as a signal in its
  own right.
- **Silent drift** — an unpinned model or an untested rule change alters historical benchmarks. Mitigated
  by version pinning and the CI regression gate.
- **Unit confusion** — `1 paket` of 50 chairs versus `50 buah`. When quantity semantics are ambiguous, the
  row is rejected. Deriving a per-unit price from an ambiguous unit is how a fake 50× outlier gets
  published.

---

## Related

- [`peer-group.md`](peer-group.md) — how `canonical_id` becomes a comparison
- [`limitations.md`](limitations.md) — the honest boundaries
- [`../data/sources.md`](../data/sources.md) — KBKI vs KBLI, and where classification codes come from
- [ADR-0004](../adr/0004-kbki-as-classification-backbone.md) — why KBKI
