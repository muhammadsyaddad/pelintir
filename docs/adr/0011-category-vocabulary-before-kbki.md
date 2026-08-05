# ADR-0011: Rule-based category vocabulary as the v0 grouping key; KBKI deferred

- **Status:** Accepted
- **Date:** 2026-07-28

## Context

[ADR-0004](0004-kbki-as-classification-backbone.md) makes KBKI 2015 the classification backbone, and
[`../methodology/peer-group.md`](../methodology/peer-group.md) defines a peer group as items sharing a
canonical id at KBKI level 7 or deeper.

The implemented pipeline does not do that. `packages/pipeline/src/pipeline/normalize.py` groups by
`canonical_category` — an ordered vocabulary of rules (`laptop`, `printer`, `proyektor`, `ups`,
`aksesori_it`, …) matched against item description text — and benchmarks by
(`canonical_category` × `canonical_unit` × `fiscal_year`).

That divergence is deliberate, and leaving the docs contradicting the code without saying so would be worse
than either choice.

Two facts made it the right first step. **No real data has been ingested yet**, so there is nothing to
evaluate a KBKI classifier against — the labelled KBKI codes that make ADR-0004 viable are in source records
we do not yet have. And the immediate goal is not coverage, it is answering one question: *is a median over a
single product category believable?* A dozen hand-written category rules answer that in an afternoon.

## Decision

Ship the rule-based category vocabulary as the v0 grouping key. Treat KBKI mapping as the next
normalisation milestone, not as a deferred nicety.

The vocabulary is explicitly a **stopgap with a known ceiling**: it covers a handful of IT-adjacent
categories, it is hand-maintained, and it cannot scale to the full procurement corpus. It is not a rival
taxonomy to KBKI — ADR-0004 stands.

`canonical_category` becomes the fallback tier once KBKI mapping exists, not a parallel system.

## Consequences

- The proof notebook can run **now**, against manually downloaded CSVs, with no access decision resolved.
  That was the point.
- Category rules are readable and individually tested, so a wrong grouping is traceable to one named rule.
  The `aksesori_it`-before-`laptop` ordering is a good example: a Rp150.000 laptop bag would otherwise drag
  the laptop median down, and the rule's comment says so.
- **Every claim in the docs about KBKI level 7 is currently aspirational.** Recorded in
  [`../status.md`](../status.md) so no reader assumes otherwise, and no price flag may ship citing KBKI
  precision the pipeline does not have.
- Coverage is a few categories, not the corpus. Any benchmark produced now is a proof of method, not a
  finding, and must not be published as one.
- Reversal cost: low. The grouping key is one column produced by one function.

## Alternatives considered

**Implement KBKI mapping first.** The documented target, and eventually required. Rejected for now: without
real records carrying KBKI codes there is nothing to train or evaluate against, so it would be built blind
and its accuracy would be unmeasurable — exactly the failure
[`../methodology/item-normalization.md`](../methodology/item-normalization.md) warns about.

**Skip categorisation, benchmark on exact description matches only.** Simplest possible v0, and genuinely
defensible — identical strings are certainly comparable. Rejected because the resulting groups are almost all
below `min_group_size = 5`, so nothing would be publishable and the proof notebook would prove nothing.

**Embeddings for grouping from the start.** Rejected on the reasoning in ADR-0004 and the normalisation spec:
unstable, unnameable clusters cannot be explained to a journalist or disputed by a supplier.
