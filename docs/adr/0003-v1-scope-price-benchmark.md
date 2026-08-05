# ADR-0003: Direction A (price benchmark) is v1; Direction B (vendor network) is v2

- **Status:** Accepted
- **Date:** 2026-07-28

## Context

Two candidate focuses, both more valuable than another anomaly feed:

**Direction A — price benchmark.** "This agency paid 4× what 200 other agencies paid for the same item."
Requires normalising item names across millions of rows.

**Direction B — vendor network.** Vendor-level profiles: repeat winners, companies registered shortly before
their first large win, shared addresses and directors.

A dashboard that shows a government body bought an absurdly expensive gate is a viral moment, not a product,
and that space is already occupied domestically. Going one layer deeper is the point of the project.

## Decision

**Build Direction A first.** Direction B is documented in full now
([`../methodology/vendor-network.md`](../methodology/vendor-network.md)) and built in v2.

Concretely, v1 means: item normalisation to KBKI level 7+, peer-group construction, and the
`unit-price-vs-peer-median` flag, end to end on at least one product category.

Two v1 obligations exist purely to make v2 cheap: the first migration ships `vendor` and `vendor_alias`
tables even though alias resolution starts as a no-op, and the full nine-flag catalog is documented rather
than trimmed to A.

## Consequences

- Item normalisation defines the architecture, which is correct — it is the hardest constraint and the
  distinctive claim.
- Price comparison is the strongest single signal available and the hardest to argue with, so the first
  public output is the most defensible one.
- **Direction A is currently blocked on data access** ([ADR-0006](0006-scrape-ekatalog-storefront.md)), while
  most of Direction B's inputs are already obtainable from SPSE. This is an uncomfortable consequence and is
  stated plainly rather than smoothed over.
- Six of the nine flags need no unit prices, so useful work exists regardless of how ADR-0006 resolves.
- If ADR-0006 resolves unfavourably, **promoting Direction B to v1 is the correct response.** Because B is
  already documented and its tables already exist, that pivot should cost a sprint, not a rewrite. This ADR
  would then be superseded.

## Alternatives considered

**Direction B first.** Cheaper, less blocked, and arguably closer to where corruption actually lives. Genuinely
close, and the strongest case against this decision. Rejected because normalisation is the technical moat, and
building B first would let the schema settle around vendor-shaped queries and make the normalisation work
harder later.

**Both simultaneously.** Rejected for a two-person team; it would produce two half-built layers and no
credible first output.

**Neither — ship a general anomaly feed first for attention.** Rejected explicitly. It is the failure mode
this project is defined against.
