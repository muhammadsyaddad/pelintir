---
id: short-tender-window
status: planned
severity: low
direction: B-adjacent
inputs:
  - tender.announcement_date
  - tender.bid_deadline
  - tender.method
  - tender.award_value
  - package.agency_id
  - package.fiscal_year
min_peer_n: 20
thresholds:
  window_days_warn: 5
  percentile_min: 0.1
question_id: >-
  Masa penawaran hanya {days} hari kerja, terpendek {percentile}% dari {n} tender
  sejenis — perlu diperiksa.
question_en: >-
  The bidding window was {days} working days, among the shortest {percentile}%
  of {n} comparable tenders — worth checking.
ocp_reference: OCP-RF-COMP-02
last_reviewed: 2026-07-28
---

# Short tender window

**Stub.** Frontmatter, question and non-claims are settled; formula, threshold justification and false
positives are completed by the PR that implements this flag — see [`README.md`](README.md).

## The question

> Masa penawaran hanya 3 hari kerja, terpendek 10% dari 118 tender sejenis — perlu diperiksa.
>
> *The bidding window was 3 working days, among the shortest 10% of 118 comparable tenders — worth
> checking.*

## What this does not claim

It does not claim that the window was shortened to exclude bidders, or that a favoured supplier had advance
notice. It claims that the interval between announcement and bid deadline was short relative to comparable
tenders.

A short window limits who can realistically respond, which is why it is a standard OCP competition
indicator — but urgency is frequently genuine, and this indicator is weak on its own. Its value is almost
entirely in co-occurrence, particularly with [`single-bidder`](single-bidder.md). Severity is `low`
accordingly.

The comparison must be relative rather than absolute: statutory minimum periods differ by procurement
method and contract value, so a fixed day count would flag lawful fast-track procedures and miss slow ones
that were nonetheless unusually rushed for their class.

## To be completed on implementation

Formula (working days, with Indonesian public holidays), the correct comparison class given
method-and-value-dependent statutory minimums, whether a schedule amendment resets the window, threshold
justification, and the false-positive section — which must at minimum cover genuine urgency, emergency
procurement, re-tenders, statutory fast-track procedures, fiscal-year-end deadlines, and missing or
malformed schedule data.
