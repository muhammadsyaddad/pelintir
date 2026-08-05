---
id: vendor-concentration
status: planned
severity: medium
direction: B
inputs:
  - tender.winner_vendor_id
  - tender.award_value
  - package.agency_id
  - package.fiscal_year
  - vendor.vendor_id
  - vendor_alias.resolved_vendor_id
min_peer_n: 20
thresholds:
  share_by_count_warn: 0.4
  share_by_value_warn: 0.5
  window_years: 3
question_id: >-
  {vendor} memenangkan {share}% dari {n} paket di instansi ini sejak {year_from}
  — perlu diperiksa.
question_en: >-
  {vendor} won {share}% of {n} packages at this agency since {year_from} —
  worth checking.
ocp_reference: OCP-RF-COMP-03
last_reviewed: 2026-07-28
---

# Vendor concentration

**Stub.** Frontmatter, question and non-claims are settled; formula, threshold justification and false
positives are completed by the PR that implements this flag — see [`README.md`](README.md).

## The question

> PT Anu Jaya memenangkan 81% dari 47 paket di instansi ini sejak 2022 — perlu diperiksa.
>
> *PT Anu Jaya won 81% of 47 packages at this agency since 2022 — worth checking.*

## What this does not claim

It does not claim steering, favouritism, or a relationship between the agency and the supplier. It claims
that one resolved vendor identity accounts for a stated share of an agency's awards over a stated window.

Concentration is frequently lawful: specialised markets, sole authorised distributors, and small regional
supplier pools all produce high shares legitimately. See
[`../vendor-network.md`](../vendor-network.md).

**This flag depends on entity resolution**, and is therefore only as correct as `vendor_alias`. Merging two
distinct companies would produce a false concentration claim published under a named company — the most
damaging error class in the project. Merges are human-confirmed, and this flag must not be computed on
automatically-proposed, unconfirmed aliases.

## To be completed on implementation

Formula for share by count and by value (both, since a supplier winning few large packages differs from one
winning many small ones), treatment of the alias-confidence dependency, threshold justification, and the
false-positive section — which must at minimum cover sole-source markets, framework agreements, small
supplier pools, agency size, and unresolved or wrongly merged aliases.
