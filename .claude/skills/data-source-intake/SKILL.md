---
name: data-source-intake
description: Evaluate a new or changed procurement data source before any fetch code is written — licence, terms of service, robots.txt, personal-data exposure, legal-register row, ADR trigger. Use when adding a source or adapter, when an endpoint changes shape, or on any request to "scrape", "fetch", "ingest", or "pull data from" a site.
---

# Data source intake

**Run this before writing any fetch code.** `docs/data/legal-register.md` is a merge gate: no ingestion merges
without a row, and a missing row is not a paperwork gap — it is the reason this project can be sued.

## Read first

1. `docs/data/legal-register.md` — the status vocabulary, and whether the source already has a row
2. `docs/data/sources.md` — whether the data is actually available and at what granularity
3. `docs/adr/0002-data-licence-lineage.md` — the quarantine rule
4. `docs/adr/0006-scrape-ekatalog-storefront.md` — currently blocks LKPP collection entirely

## Hard stop

If the request concerns `katalog.inaproc.id`, `data.inaproc.id`, or `e-katalog.lkpp.go.id`: **stop.** ADR-0006
is `Proposed`. Do not write the code, do not write a "prototype", do not write it behind a feature flag.

Say so plainly, explain that the storefront ToS permits only Google/Bing/Baidu crawlers, and point at
`docs/data/access-requests.md` — helping file the access request is the productive path.

## Assess

Work through all of it. Do not skip a step because the source "is obviously public".

1. **Licence.** Find the actual licence text. Record it verbatim. Specifically: is it non-commercial? Is it
   share-alike? No stated licence means status `unknown`, which is treated as `prohibited`.
2. **Terms of service.** Find and **quote the operative sentence** on automated access. Do not summarise — a
   paraphrase of a ToS clause is not evidence.
3. **`robots.txt`.** Fetch and read it. Note any relevant `Disallow` or crawler-specific rule.
4. **Authentication.** Does access need a credential? If so, who may obtain one, and under what agreement?
   Credential-gated data belonging to another party is out of scope.
5. **Personal data.** Does it carry officials' names, company directors, or sole-proprietor NPWP? These are
   personal data under UU PDP. If yes, `docs/data/pdp.md` must exist before ingestion.
6. **Granularity.** What does it actually contain — unit prices, contract values, or budget ceilings? Do not
   assume; check field by field against `docs/data/sources.md`. Deriving a unit price from an order total is
   unreliable when the order has more than one product.
7. **Stability.** Is it versioned? Is a legacy endpoint being decommissioned? Building against a deprecated API
   wastes the work.

## Produce

1. A **legal-register row** in the file's existing format: source, operator, status, licence, ToS constraint
   (quoted), commercial flag, share-alike flag, legal basis, notes, `last_reviewed`.
2. An **ADR** if the answer changes what may be published, or if collection requires a judgement call. Use the
   `write-adr` skill.
3. A one-paragraph **recommendation**: usable now, usable after a formal request, or not usable — and if the
   latter, what the nearest usable alternative is. Where the same fact is available from an ODbL source, say so;
   preferring it is required, not optional.

## Do not

- Write fetch code in the same pass. Intake first, implementation in a later change.
- Set a status more permissive than the evidence supports. `unknown` is an honest answer and blocks nothing
  except ingestion.
- Treat "it is on a government portal" as a licence.
