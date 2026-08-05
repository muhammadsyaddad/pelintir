---
id: single-bidder
status: planned
severity: medium
direction: B-adjacent
inputs:
  - tender.tender_id
  - tender.method
  - tender.bidder_count
  - tender.qualified_bidder_count
  - package.agency_id
  - package.fiscal_year
  - package.contract_value
min_peer_n: 20
thresholds:
  bidder_count_max: 1
  context_window_years: 1
question_id: >-
  Hanya {bidders} peserta yang memasukkan penawaran. {share}% dari {n} tender
  di instansi ini pada {year} juga demikian — perlu diperiksa.
question_en: >-
  Only {bidders} bidder submitted an offer. {share}% of {n} tenders at this
  agency in {year} were the same — worth checking.
ocp_reference: OCP-RF-COMP-01
last_reviewed: 2026-07-28
---

# Single bidder

A competitive procedure that attracted one bid. The classic competition indicator, and the highest-value
flag we can build **without unit prices** — its inputs are all published by SPSE today.

## The question

> Hanya 1 peserta yang memasukkan penawaran. 34% dari 118 tender di instansi ini pada 2024 juga demikian —
> perlu diperiksa.
>
> *Only 1 bidder submitted an offer. 34% of 118 tenders at this agency in 2024 were the same — worth
> checking.*

Note the shape: this is the **structural observation** pattern from
[`../../editorial-policy.md`](../../editorial-policy.md), not a ratio. The frequency context is what makes
a single observation meaningful — one uncontested tender is unremarkable; a third of an agency's tenders
being uncontested is a question.

## What this does not claim

It does not claim collusion, bid rigging, steering, or that the specification was written for a
predetermined winner. It claims that a procedure which permitted competition received one bid, and states
how common that is at the same agency in the same year.

It is not applicable to procedures where a single supplier is the lawful expectation — see the method
filter below.

## Formula

```
applicable  = tender.method in COMPETITIVE_METHODS
flag        = applicable and tender.bidder_count <= thresholds.bidder_count_max

peers       = tenders(agency_id, fiscal_year, method in COMPETITIVE_METHODS)
n           = |peers|
share       = |{p in peers : p.bidder_count <= 1}| / n
```

Emit when `flag` is true. Emit the frequency context only when `n >= min_peer_n`; below that, emit the
observation alone with no percentage, because a share computed over a handful of tenders is noise.

`COMPETITIVE_METHODS` covers Tender, Tender Cepat and Seleksi. It explicitly **excludes** *penunjukan
langsung* (direct award) and *pengadaan langsung*, where one supplier is the defined procedure rather than
an anomaly — those are the subject of
[`direct-award-share`](direct-award-share.md) instead. Applying this flag to a direct award would be a
category error and would flood the output with meaningless hits.

Where `qualified_bidder_count` is available it is preferred over `bidder_count`: several bids of which one
is qualified is functionally uncontested, and is the more interesting case.

`min_peer_n: 20` is raised above the global floor of 5 because the denominator here is a percentage shown
next to a named agency.

## Peer group

Not a price peer group. The comparison set is *other competitive tenders at the same agency in the same
fiscal year* — used only to contextualise frequency, never to compute a ratio on the flagged tender itself.

## Threshold justification

`bidder_count_max: 1` is definitional rather than tuned: the indicator is "one bid". A variant at `<= 2`
would capture near-uncontested procedures and is deliberately not included in v1 — two bidders can be
genuine competition, and widening the definition would trade the flag's main asset, which is that it is
unarguable on its face.

The frequency context window is one fiscal year: long enough to accumulate a denominator, short enough that
an agency's procurement practice has not necessarily changed within it.

## Known false positives

- **Genuinely specialised markets.** Medical equipment, aircraft parts, and proprietary software often have
  one authorised distributor in a region. That supplier wins lawfully, every time.
- **Small or remote markets** with few qualified suppliers within practical delivery distance.
- **Low contract value.** Small packages attract little interest simply because bidding costs money.
- **Re-tender after a failed procedure.** The second attempt often draws a single bidder, and the tender
  record may not indicate that it is a re-tender.
- **Incomplete participant data.** Where SPSE publishes the winner but not the participant list,
  `bidder_count` may be missing or defaulted. A missing count must never be read as `1` — such records are
  excluded, not flagged.
- **Withdrawn bids.** Multiple bidders may have submitted and later withdrawn for legitimate reasons.
- **Prequalification.** A procedure that lawfully narrowed the field earlier can appear uncontested at the
  bidding stage.

## Lineage

OCP red-flag indicator family for competition (`OCP-RF-COMP-01`), one of the most widely implemented
indicators internationally. Used by DoZorro as part of its tender risk triage; ICW's Potential Fraud
Analysis includes an equivalent competition measure.

## Related

- [`direct-award-share`](direct-award-share.md) — the correct flag for non-competitive methods
- [`short-tender-window`](short-tender-window.md) — a frequent co-occurrence
- [`vendor-concentration`](vendor-concentration.md) — same records, vendor-side view
- [`../vendor-network.md`](../vendor-network.md) — Direction B context
- [`../limitations.md`](../limitations.md) — required caveats
