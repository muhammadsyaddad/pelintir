# Access requests

`last_reviewed: 2026-08-08`

Formal attempts to obtain data or permission that the public surfaces do not give us. This log — not
[ADR-0006](../adr/0006-scrape-ekatalog-storefront.md) — is where progress on data access is tracked; the ADR is
updated only when a decision is actually made.

The legal basis for requesting data that is not published is **UU KIP** (UU No. 14/2008 on public information
openness) ([`../glossary.md`](../glossary.md)). Whether a source may be *used* once obtained is a separate
question, decided in [`legal-register.md`](legal-register.md).

## Status vocabulary

`not filed` → drafted but not sent · `sent` → submitted, awaiting reply · `in progress` → dialogue open ·
`granted` / `refused` → resolved.

## The log

| id | to | asking for | basis | status | opened | outcome |
|---|---|---|---|---|---|---|
| `req-1` | LKPP + Pengelola Katalog Elektronik | Formal cooperation to collect listed prices for named KBKI categories at a stated rate, for a stated public-interest purpose, with attribution (Option A of [ADR-0006](../adr/0006-scrape-ekatalog-storefront.md)) | UU KIP; Perpres 17/2023 | `not filed` | — | — |
| `req-2` | LKPP (INAPROC API Gateway) | Credentialed access agreement for the API gateway (`inaproc-api-gateway`) | UU KIP | `not filed` | — | — |
| `req-3` | INAPROC support | Technical clarification: does any documented or undocumented endpoint expose a **per-product unit price**, and under what terms? | — (technical enquiry) | `not filed` | — | — |
| `req-4` | BPS | Confirm terms and rate limits for the Web API IKK series (`bps-webapi`); obtain a registered key | UU KIP | `not filed` | — | — |
| `req-5` | ICW / opentender.net | Confirm the OCDS bulk update cadence and coverage window before treating it as a primary dependency ([ADR-0002](../adr/0002-data-licence-lineage.md) flags this risk) | — (partner enquiry) | `not filed` | — | — |

## Priority

[ADR-0006](../adr/0006-scrape-ekatalog-storefront.md) recommends pursuing cooperation (A) and abstention (C)
in parallel while building the aggregate-only product (B). Against that:

1. **`req-3` is the cheapest and could collapse the whole problem** — a single technical question that might
   reveal a permitted unit-price endpoint. Zero cost.
2. **`req-1` has the longest lead time**, so it should be sent earliest even though it may be refused:
   "filing the A request costs a letter — it should be sent before more engineering is committed either way."
3. **`req-5` is partly answerable without a letter** — `scripts/check_ocds_fields.py` against a downloaded dump
   confirms coverage and field completeness directly, which is the substance of the cadence question.
