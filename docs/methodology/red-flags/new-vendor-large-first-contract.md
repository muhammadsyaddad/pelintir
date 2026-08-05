---
id: new-vendor-large-first-contract
status: planned
severity: medium
direction: B
inputs:
  - vendor.vendor_id
  - vendor.registration_date
  - tender.award_value
  - tender.award_date
  - tender.winner_vendor_id
  - package.agency_id
min_peer_n: 20
thresholds:
  days_since_registration_max: 180
  value_percentile_min: 0.9
question_id: >-
  Penyedia terdaftar {days} hari sebelum memenangkan kontrak pertamanya, bernilai
  di atas persentil {percentile} dari {n} paket sejenis — perlu diperiksa.
question_en: >-
  Supplier was registered {days} days before winning its first contract, valued
  above the {percentile}th percentile of {n} comparable packages — worth checking.
ocp_reference: OCP-RF-INTEG-02
last_reviewed: 2026-07-28
---

# New vendor, large first contract

**Stub.** Frontmatter, question and non-claims are settled; formula, threshold justification and false
positives are completed by the PR that implements this flag — see [`README.md`](README.md).

## The question

> Penyedia terdaftar 43 hari sebelum memenangkan kontrak pertamanya, bernilai di atas persentil 90 dari 214
> paket sejenis — perlu diperiksa.
>
> *Supplier was registered 43 days before winning its first contract, valued above the 90th percentile of
> 214 comparable packages — worth checking.*

## What this does not claim

It does not claim that the supplier is a shell company, that it lacks capacity, or that it was created for
this contract. It claims that a company's first recorded win came shortly after its registration date and
was large relative to comparable packages.

New businesses exist. Restructurings, spin-offs and rebrandings all produce recently registered entities
with experienced management and genuine capacity. **Structure is not intent** — this is among the most
suggestive and most easily over-read indicators in the catalog, and it must never be published without the
caveats in [`../limitations.md`](../limitations.md).

This flag is also the most exposed to data quality: registration dates are inconsistently populated, and
"first contract" means *first contract we have a record of*, which is not the same thing. A supplier absent
from our corpus is not a new supplier.

## To be completed on implementation

Formula, source and reliability assessment for `registration_date`, definition of "first contract" given
partial coverage, threshold justification, and the false-positive section — which must at minimum cover
legitimate new entrants, corporate restructuring, missing or defaulted registration dates, incomplete
historical coverage, and unresolved aliases making an established vendor look new.

**Personal-data note:** company directors and sole-proprietor NPWP are personal data under UU PDP. This
flag must not surface person-level fields before `../../data/pdp.md` exists.
