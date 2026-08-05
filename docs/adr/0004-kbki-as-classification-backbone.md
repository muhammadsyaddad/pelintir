# ADR-0004: KBKI 2015 as the item classification backbone

- **Status:** Accepted
- **Date:** 2026-07-28

## Context

Price benchmarking requires deciding which items are comparable. That means classifying free-text
Indonesian procurement descriptions into groups. The options are to invent a taxonomy, or to adopt an
existing one.

**KBKI 2015** (*Klasifikasi Baku Komoditas Indonesia*) is hierarchical from 1 to 10 digits, maps to CPC and
HS, and — decisively — has been **mandatory in SiRUP, SPSE and e-Katalog since SE Kepala LKPP No. 2 Tahun
2023**. Many source records therefore already carry a KBKI code.

## Decision

Classify all items into **KBKI 2015**, at level 7 or deeper for peer-group purposes.

A KBKI code present in a source record is treated as **a strong hint, not ground truth** — it is hand-entered,
frequently truncated to a shallow level, and sometimes simply wrong. Where a record's stated code conflicts
with a high-confidence text match, the conflict is recorded rather than silently resolved.

**KBLI is not used for item grouping.** It classifies business activity, not products; it appears in supplier
records and belongs to vendor analysis.

## Consequences

- Existing KBKI codes give us **ground truth to train and evaluate against**, which is what makes the
  normalisation accuracy target in [`../methodology/item-normalization.md`](../methodology/item-normalization.md)
  measurable at all. A bespoke taxonomy would have no labelled data.
- Groupings are **auditable by someone who does not trust us**, because the classification is externally
  defined and published by BPS. For a project whose output names real organisations, this matters more than
  any technical advantage.
- CPC and HS mapping makes the work comparable to EU CPV-based benchmarking, so international methodology
  transfers.
- **KBKI level 7 is still too coarse for some categories** — pharmaceuticals and IT hardware have real
  price-relevant variation below any KBKI level. Specification-aware sub-grouping is future work, and this is
  a documented limitation of every price flag.
- We inherit KBKI's structure, including where it is a poor fit. We cannot fix it, only sub-divide beneath it.
- Reversal cost: high. Changing the backbone means reclassifying everything and invalidating published
  benchmarks.

## Alternatives considered

**A bespoke product taxonomy tuned to Indonesian procurement.** Would fit the data better. Rejected: no
labelled data to bootstrap from, no external auditability, and it would make our groupings unfalsifiable —
"trust our categories" is not a position this project can occupy.

**Cluster items without any taxonomy, using embeddings alone.** Rejected. Clusters are unstable across runs,
unnameable, and impossible to explain to a journalist or a supplier. Every claim would be
"our model thinks these are similar", which fails the disputability requirement in
[`../editorial-policy.md`](../editorial-policy.md).

**HS codes.** Designed for customs, not domestic procurement, and absent from these records.
