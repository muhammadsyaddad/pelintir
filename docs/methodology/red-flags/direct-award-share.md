---
id: direct-award-share
status: planned
severity: low
direction: A
inputs:
  - package.method
  - package.contract_value
  - package.agency_id
  - package.fiscal_year
min_peer_n: 20
thresholds:
  share_by_value_warn: 0.3
question_id: >-
  {share}% dari nilai pengadaan instansi ini pada {year} melalui penunjukan
  langsung, dibanding {baseline}% rata-rata {n} instansi sejenis — perlu diperiksa.
question_en: >-
  {share}% of this agency's procurement value in {year} used direct award,
  against a {baseline}% average across {n} comparable agencies — worth checking.
ocp_reference: OCP-RF-COMP-04
last_reviewed: 2026-07-28
---

# Direct award share

**Stub.** Frontmatter, question and non-claims are settled; formula, threshold justification and false
positives are completed by the PR that implements this flag — see [`README.md`](README.md).

## The question

> 52% dari nilai pengadaan instansi ini pada 2024 melalui penunjukan langsung, dibanding 21% rata-rata 412
> instansi sejenis — perlu diperiksa.
>
> *52% of this agency's procurement value in 2024 used direct award, against a 21% average across 412
> comparable agencies — worth checking.*

## What this does not claim

It does not claim that any individual direct award was improper. *Penunjukan langsung* is a lawful method
with defined conditions. The flag claims that the share of value awarded without competition is high
relative to comparable agencies.

Like [`year-end-spike`](year-end-spike.md), this is an **agency-level** indicator computed against a peer
group of agencies, and it never attaches to an individual package.

**Do not confuse this with [`single-bidder`](single-bidder.md).** That flag applies only to competitive
methods, where one bid is an anomaly. Direct awards are one-supplier procedures by design; flagging them
individually as uncompetitive would be a category error. The question here is about *how much* of an
agency's spending bypasses competition, not whether any given award did.

Distinguishing *penunjukan langsung* from *pengadaan langsung* and from e-purchasing matters: all three
avoid a tender, and conflating them produces a meaningless denominator. See
[`../../glossary.md`](../../glossary.md).

## To be completed on implementation

Formula, the exact set of method codes counted as non-competitive and the justification for each, the
comparable-agency class, a baseline computed from real data, threshold justification, and the
false-positive section — which must at minimum cover lawful sole-source conditions, emergency procurement,
e-catalogue purchasing (which is non-competitive by design and arguably should be excluded entirely rather
than counted), small-value thresholds, and agency mandate differences.
