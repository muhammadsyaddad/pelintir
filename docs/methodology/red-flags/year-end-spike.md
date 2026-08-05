---
id: year-end-spike
status: planned
severity: low
direction: A
inputs:
  - package.award_date
  - package.contract_value
  - package.agency_id
  - package.fiscal_year
  - agency.total_procurement_value
min_peer_n: 20
thresholds:
  window_months: 1
  share_warn: 0.35
question_id: >-
  {share}% dari nilai pengadaan instansi ini pada {year} dikontrakkan pada
  Desember, dibanding {baseline}% rata-rata {n} instansi sejenis — perlu diperiksa.
question_en: >-
  {share}% of this agency's procurement value in {year} was contracted in
  December, against a {baseline}% average across {n} comparable agencies —
  worth checking.
ocp_reference: OCP-RF-PLAN-02
last_reviewed: 2026-07-28
---

# Year-end spending spike

**Stub.** Frontmatter, question and non-claims are settled; formula, threshold justification and false
positives are completed by the PR that implements this flag — see [`README.md`](README.md).

## The question

> 48% dari nilai pengadaan instansi ini pada 2024 dikontrakkan pada Desember, dibanding 19% rata-rata 412
> instansi sejenis — perlu diperiksa.
>
> *48% of this agency's procurement value in 2024 was contracted in December, against a 19% average across
> 412 comparable agencies — worth checking.*

## What this does not claim

It does not claim budget-burning, waste, or that scrutiny was deliberately avoided. It claims that a
disproportionate share of the agency's annual procurement value was contracted in the final month of the
fiscal year, relative to comparable agencies in the same year.

This is an **agency-level** indicator, not a package-level one — it appears on an agency profile, never as a
flag on an individual package, because no single package can be responsible for a distribution. That
distinction is why the peer group here is *other agencies* rather than other packages.

Year-end concentration is endemic in Indonesian public spending for structural reasons — budget disbursement
timing, DIPA revisions, and procedural lead times — so the useful measure is deviation from the norm, not
the raw share. A flag that fires on nearly every agency conveys nothing.

## To be completed on implementation

Formula, definition of the comparable-agency class (level of government, size band, sector), the December
share baseline computed from actual data rather than assumed, threshold justification, and the
false-positive section — which must at minimum cover late budget approval, DIPA revisions, multi-year
project milestones, agency size effects, and seasonal procurement that is genuinely year-end by nature.

Requires budget context data — see [`../../data/legal-register.md`](../../data/legal-register.md), where the
APBD/APBN portals are recorded at `unknown` status pending per-dataset review.
