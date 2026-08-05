---
id: award-vs-hps
status: planned
severity: medium
direction: A
inputs:
  - tender.hps_value
  - tender.award_value
  - tender.bidder_count
  - package.agency_id
  - package.fiscal_year
min_peer_n: 20
thresholds:
  ratio_warn: 0.95
  ratio_high: 0.99
question_id: >-
  Nilai kontrak {share}% dari HPS. {context}% dari {n} tender di instansi ini
  pada {year} juga di atas {threshold}% — perlu diperiksa.
question_en: >-
  Award value is {share}% of the HPS. {context}% of {n} tenders at this agency
  in {year} were also above {threshold}% — worth checking.
ocp_reference: OCP-RF-PRICE-02
last_reviewed: 2026-07-28
---

# Award value vs HPS

**Stub.** Frontmatter, question and non-claims are settled; formula, threshold justification and false
positives are completed by the PR that implements this flag — see [`README.md`](README.md).

## The question

> Nilai kontrak 99,4% dari HPS. 61% dari 118 tender di instansi ini pada 2024 juga di atas 95% — perlu
> diperiksa.
>
> *Award value is 99.4% of the HPS. 61% of 118 tenders at this agency in 2024 were also above 95% — worth
> checking.*

## What this does not claim

It does not claim that the HPS leaked, that the price was known in advance, or that the bid was
coordinated. It claims that the winning value sat very close to the ceiling estimate, and states how common
that is at the same agency in the same year.

A competently estimated HPS *should* be close to the market price, so bids near it are expected. The signal
is not one award near the ceiling — it is a pattern of them, which is why the frequency context is
mandatory rather than decorative. `min_peer_n` is raised to 20 for that reason.

Note the inverted polarity relative to other price flags: here a **high** ratio is the signal, and the
useful range is narrow (0.95–1.00), which makes threshold choice unusually consequential.

## To be completed on implementation

Formula (including handling of awards *above* HPS, which should be impossible and therefore indicates a
data defect), peer-group definition, threshold justification, and the false-positive section — which must
at minimum cover accurate HPS estimation, single-bidder overlap, catalogue-priced items where the HPS is
derived from the same listed price the winner bids, and re-tendered procedures.
