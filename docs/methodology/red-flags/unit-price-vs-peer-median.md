---
id: unit-price-vs-peer-median
status: planned
severity: high
direction: A
inputs:
  - line_item.unit_price
  - line_item.qty
  - line_item.uom_normalized
  - line_item.price_basis
  - item_normalization.canonical_id
  - item_normalization.confidence
  - package.fiscal_year
  - package.agency_id
  - agency.regency_code
min_peer_n: 5
thresholds:
  ratio_warn: 2.0
  ratio_high: 4.0
question_id: >-
  Harga satuan {ratio}× di atas median {n} paket sejenis — perlu diperiksa.
question_en: >-
  Unit price is {ratio}× the median of {n} comparable packages — worth checking.
ocp_reference: OCP-RF-PRICE-01
last_reviewed: 2026-07-28
---

# Unit price vs peer median

The strongest single signal available, and the reason Direction A defines the architecture. Blocked on
data access — see [ADR-0006](../../adr/0006-scrape-ekatalog-storefront.md).

## The question

> Harga satuan 7,4× di atas median 214 paket sejenis — perlu diperiksa.
>
> *Unit price is 7.4× the median of 214 comparable packages — worth checking.*

## What this does not claim

It does not claim overpayment, mark-up, loss to the state, or wrongdoing by anyone. It claims that this
line item's unit price, after regional adjustment, is a stated multiple of the median unit price of items
this system classified as the same product in the same fiscal year and quantity band.

It says nothing about specification differences the data does not record — warranty, service level,
delivery to a remote district, certification, bundled installation — which are the most common legitimate
explanation for a high ratio. See [`../limitations.md`](../limitations.md).

Where `price_basis` is `listed`, the claim is narrower still: it concerns advertised prices between
suppliers, not what any agency paid.

## Formula

```
peers   = peer_group(canonical_id, fiscal_year, qty_band, price_basis)   # see ../peer-group.md
n       = |peers|
adj(x)  = x.unit_price / ikk(x.regency_code, x.fiscal_year)
m       = median(adj(p) for p in peers)
ratio   = adj(item) / m
```

Emit when `n >= min_peer_n` **and** `ratio >= thresholds.ratio_warn`.
Severity is `high` when `ratio >= thresholds.ratio_high`, otherwise `medium`.

Rows excluded before computing `m`: `qty <= 0`, `unit_price <= 0`, normalisation confidence below the
`review` tier, unnormalisable UoM, missing IKK for the regency. Exclusion counts are recorded per group;
a group that lost more than 25% of its rows is reported as a normalisation defect rather than published.

The item itself is excluded from its own median.

## Peer group

Per [`../peer-group.md`](../peer-group.md), with no additional narrowing: same `canonical_id` at KBKI 2015
level ≥7, same fiscal year, same log quantity band, same price basis, IKK-adjusted rather than
region-restricted.

`min_peer_n: 5` is the absolute floor. Groups of 5–19 are displayed with the sample size prominent and
excluded from every aggregate.

## Threshold justification

`2.0` and `4.0` are chosen for legibility and conservatism, not derived from a loss function. Two
considerations set them:

- Ordinary procurement variation from specification, warranty and logistics can plausibly reach 2× within a
  single KBKI level-7 group, so `2.0` is where a ratio stops being unremarkable — not where it becomes
  interesting on its own.
- The documented Indonesian precedent sits far above this range: the 2014 DKI Jakarta UPS case involved a
  300% mark-up over ordinary retail, i.e. roughly `4×`. `4.0` is set at the level where a real,
  prosecuted case would have surfaced.

These are arguable numbers and are stored in frontmatter so they can be argued with. They should be revised
once real distributions are observed — the first honest calibration is only possible after the eval set in
[`../item-normalization.md`](../item-normalization.md) exists.

## Known false positives

- **Unrecorded specification differences.** The dominant cause. Same KBKI code, materially different
  product.
- **Bundled scope.** A line item that silently includes installation, training, or a multi-year service
  contract.
- **Remote-district logistics** beyond what IKK captures. IKK is a construction cost index used as a
  regional price proxy; it under-adjusts for genuinely remote procurement.
- **Normalisation error.** A wrongly grouped item produces a spurious ratio in both directions. Confidence
  tiering reduces but does not eliminate this.
- **Quantity semantics.** `1 paket` containing 50 units versus `50 buah`. Ambiguous rows are rejected, but
  not all ambiguity is detectable.
- **Data entry.** A misplaced decimal in either the item or its peers.
- **Urgent or emergency procurement**, where speed lawfully costs money.
- **Thin peer groups.** At `n = 5` a single unusual peer moves the median substantially.
- **Listed-vs-transacted confusion** if the price basis is ever mixed — prevented by construction, but the
  failure would be silent.

## Lineage

OCP red-flag indicator family for price anomalies (`OCP-RF-PRICE-01`). Precedent: ProZorro's savings
analysis across 40 product groups (Kyiv School of Economics, *The Prozorro Impact*, 30 December 2022);
EU benchmarking via CPV codes; ICW's Potential Fraud Analysis on Indonesian data since 2010. Domestic
evidence that the dispersion being measured is large: Kemenkes reported potential savings above
Rp1,8 trillion (~38,70% of initial spend) from consolidating hospital drug and BMHP procurement.

## Related

- [`../peer-group.md`](../peer-group.md) — the denominator
- [`../item-normalization.md`](../item-normalization.md) — how `canonical_id` is produced
- [`../limitations.md`](../limitations.md) — required caveats
- [`../../data/sources.md`](../../data/sources.md) — listed vs transacted price
