# ADR-0009: Generic source adapter protocol

- **Status:** Accepted
- **Date:** 2026-07-28

## Context

The primary data source is **not decided**, and the most valuable one is legally blocked
([ADR-0006](0006-scrape-ekatalog-storefront.md)). Candidates differ in every dimension:

| Candidate | Access | Shape |
|---|---|---|
| INAPROC API Gateway | credentials, cursor-paginated JSON | requires an agreement |
| opentender.net OCDS bulk | file download | OCDS documents |
| e-Katalog storefront | HTML | blocked |
| Manually downloaded CSV | local file | whatever the export gives |
| BPS Web API | free key, JSON | reference data |

Their licences also differ, and that difference has structural consequences
([ADR-0002](0002-data-licence-lineage.md)).

Building the pipeline against any one of these would couple normalisation and benchmarking to a source that
may never become available.

## Decision

Downstream code depends on a protocol, never on a source.

```python
class Source(Protocol):
    def fetch(self, year: int, category: str) -> Iterator[dict]: ...
```

One implementation per source in `packages/pipeline/src/pipeline/sources/`. First concrete implementation is
`local_csv.py`, reading files downloaded by hand — because it needs no access decision and unblocks
normalisation work immediately.

**Implemented.** `sources/base.py` holds the protocol plus a 13-column typed `RAW_SCHEMA` and `to_frame()`,
which fills missing columns with nulls so the raw layer has one stable shape regardless of adapter. Columns a
source provides beyond the schema are **preserved**, not dropped — the raw layer is an audit trail, and
discarding a field because today's normaliser ignores it would destroy information we cannot get back.

Rules that make the pattern hold:

- **Network lives only in adapters.** Normalisation and benchmarking are offline and pure, so a run is
  reproducible from the raw layer alone. Stated in `packages/pipeline/AGENTS.md`.
- Adapters write to the raw layer **exactly as received** — no cleaning, no renaming, no type coercion.
  Interpretation happens downstream, where it is tested.
- Every adapter declares which [`../data/legal-register.md`](../data/legal-register.md) row it implements, and
  its docstring names that row id. The licence status determines which raw-layer zone it writes to.
- HTTP adapters use `httpx` with `tenacity` retry and honour 429.

## Consequences

- Normalisation and benchmark work can start **today**, against manually downloaded files, with no access
  decision resolved. This is the main point of the decision.
- Resolving ADR-0006 in any direction costs one new adapter, not a rewrite.
- The protocol is deliberately minimal, which means it will be too narrow for something — incremental
  fetching, resumable pagination, or per-source rate limiting will eventually need to live somewhere. Widening
  a protocol that four adapters implement is a real cost, paid later.
- A uniform interface over genuinely different sources hides differences that sometimes matter. Adapters must
  not paper over a source's gaps by synthesising fields; a missing field stays missing.
- Reversal cost: low. It is an interface, not a schema.

## Alternatives considered

**Build directly against the INAPROC API Gateway.** The eventual primary source, probably. Rejected: it
requires an agreement we do not have, so it would mean waiting to start.

**Build directly against opentender.net OCDS bulk.** Available now and ODbL-licensed, so genuinely
attractive — and it remains the likely first *real* adapter. Rejected as the sole target because coupling to
OCDS document shape would make a non-OCDS source expensive to add, and because its long-term availability is
outside our control.

**Normalise every source into OCDS at ingestion.** Rejected for the raw layer specifically: converting on
ingest loses the original record, and the original is what a published flag must be traceable to. OCDS mapping
belongs downstream — see `../data/ocds-mapping.md` when it exists.
