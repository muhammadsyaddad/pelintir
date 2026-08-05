# Peer Group

Every price claim Pelintir makes has the form *"X× above the median of N comparable packages"*. This
document defines **comparable** and **N**. It is the denominator behind every ratio in the product, and
the single most attackable part of the methodology — if the peer group is wrong, the flag is wrong, no
matter how good the arithmetic is.

Read this before touching any price-related flag.

> [!IMPORTANT]
> **This is the target definition, not what the pipeline currently computes.** The implemented peer group is
> (`canonical_category` × `canonical_unit` × `fiscal_year`) with `min_group_size = 5` — no KBKI, no quantity
> bands, no IKK adjustment, no confidence tiers. See
> [ADR-0011](../adr/0011-category-vocabulary-before-kbki.md) and [`../status.md`](../status.md) for the exact
> gap. The `min_peer_n` floor below is the one part already enforced in code.

---

## Definition

Two line items are peers when **all** of the following hold.

### 1. Same canonical item

Both resolve to the same `item_normalization.canonical_id` at **KBKI 2015 level 7 or deeper**, and to the
same normalised unit of measure.

KBKI is hierarchical from 1 to 10 digits. Grouping too shallow is the classic failure: at 5 digits,
"computers" puts a Rp4 million netbook in the same group as a Rp90 million workstation, and the resulting
median is meaningless. Level 7 is the default floor; individual flags may require deeper.

Normalisation quality gates the whole thing — see [`item-normalization.md`](item-normalization.md). Items
whose normalisation confidence falls below the `review` tier are **excluded from peer groups entirely**,
in both directions: they neither contribute to a median nor get flagged against one.

### 2. Same fiscal year

Peers come from the same `fiscal_year`. Prices move; a 2021 price is not evidence about a 2024 purchase.

Where a year has too few peers, the fallback is to widen to an adjacent year **and say so in the
disclosure** — never silently. A cross-year comparison must be labelled as one.

### 3. Comparable quantity band

Peers fall in the same quantity band, in log buckets: `1`, `2–5`, `6–20`, `21–100`, `101–1000`, `>1000`.

Buying one unit legitimately costs more per unit than buying five hundred. Comparing across bands
manufactures flags out of ordinary volume pricing, and it is the false positive a supplier will
correctly point to first.

### 4. Region handled by adjustment, not exclusion

Region does **not** restrict the peer group. Instead, unit prices are normalised by the **BPS Indeks
Kemahalan Konstruksi (IKK)** for the buying entity's regency before comparison, and the flag disclosure
states that the adjustment was applied.

Reasoning: restricting peers by region collapses group sizes in exactly the places where oversight is
weakest — small regencies with few comparable purchases. Adjusting instead preserves `n`. But the
adjustment is imperfect: IKK is a construction cost index, so it is a proxy for general regional price
level, not a precise deflator for goods. That imperfection is a documented false positive in every price
flag, and where IKK is unavailable for a regency the item is excluded rather than compared unadjusted.

Source and licence: [`../data/legal-register.md#bps-webapi`](../data/legal-register.md#bps-webapi).

### 5. Same price basis

Listed prices are compared only with listed prices; transacted prices only with transacted prices. See
[`../data/sources.md`](../data/sources.md) for why the two are not interchangeable. Mixing them is a
category error that would produce a stream of unfalsifiable flags.

---

## Minimum n

```yaml
min_peer_n: 5     # absolute floor, no exceptions
```

**No flag is published on a peer group smaller than its `min_peer_n`.** This is enforced in the pipeline,
not left to judgement — a median of two rows is not a benchmark, and publishing one against a named
company is indefensible.

Per-flag specs may raise the floor; none may lower it. `5` is a floor for the pipeline to be *permitted*
to compute, not a level at which a result is *strong*.

Group sizes and how to treat them:

| n | Treatment |
|---|---|
| `< 5` | Not computed. Not shown. Not counted as "no flag" either — shown as insufficient data. |
| `5–19` | Computed, displayed with the sample size prominent, and never used in any aggregate or ranking. |
| `≥ 20` | Computed and eligible for aggregation. |

Small groups are exactly where the median is most sensitive to a single bad normalisation, so the
threshold tiers exist to prevent the weakest evidence from being laundered into a leaderboard.

---

## Statistics

**Median, not mean.** Procurement data is heavy-tailed and contains data-entry errors of several orders of
magnitude. A single row with a misplaced decimal moves a mean and leaves a median untouched.

**MAD, not standard deviation,** for dispersion:

```
MAD    = median(|xᵢ − median(x)|)
ratio  = xᵢ / median(x)
```

MAD is robust for the same reason. Standard deviation on a distribution with a Rp1 fat-finger and a
Rp90 billion outlier produces a threshold no real row can cross.

**The reported number is the ratio to the median**, not a z-score or a percentile rank. `7,4×` is a
quantity a reader understands and a supplier can dispute; `p99.2` is not. This follows directly from the
editorial policy's requirement that a claim be disputable.

**Excluded before computing the median:** rows with `qty <= 0`, rows with `unit_price <= 0`, rows whose
normalisation confidence is below the `review` tier, and rows where the unit of measure could not be
normalised. Exclusion counts are recorded per group — a group where 40% of rows were dropped is a
normalisation bug report, not a benchmark.

---

## What this design gets wrong

Documented here so it is not rediscovered as a surprise:

- **KBKI level 7 is still coarse for some categories.** Pharmaceuticals and IT hardware have real
  price-relevant variation below any KBKI level. Specification-aware sub-grouping is future work.
- **The IKK adjustment is a proxy.** It is a construction cost index doing duty as a general regional
  price level. Good enough to be better than nothing, not good enough to be invisible in the disclosure.
- **Quantity bands are arbitrary.** Log buckets are a reasonable default, not a derived optimum. Their
  boundaries are thresholds like any other and belong in flag frontmatter.
- **Listed-price dispersion is weaker evidence than transacted-price dispersion.** If catalog listed
  prices are all we can lawfully obtain, the honest claim is about advertised price variation between
  suppliers, not about what any agency overpaid. The copy must reflect which basis was used.
- **Peer groups inherit every bias in publication completeness.** Agencies that publish more fully appear
  more flagged. This is why flag counts are never ranked — see
  [`../editorial-policy.md`](../editorial-policy.md).

---

## Related

- [`item-normalization.md`](item-normalization.md) — how `canonical_id` is produced
- [`limitations.md`](limitations.md) — the broader set of things the data cannot support
- [`red-flags/unit-price-vs-peer-median.md`](red-flags/unit-price-vs-peer-median.md) — the primary consumer
- [`../data/sources.md`](../data/sources.md) — listed vs transacted price
