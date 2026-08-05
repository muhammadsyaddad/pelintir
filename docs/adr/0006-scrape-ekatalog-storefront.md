# ADR-0006: Whether to collect e-Katalog listed prices

- **Status:** **Proposed — blocks all scraper code against LKPP surfaces**
- **Date:** 2026-07-28

## Context

**This is the project's central open question.** Direction A ([ADR-0003](0003-v1-scope-price-benchmark.md))
requires unit prices. The public data landscape:

- **SiRUP** publishes *pagu* — a budget ceiling, not a price.
- **SPSE** publishes contract values — package-level, not per unit.
- **`/v1/ekatalog/paket-e-purchasing`** returns order aggregates only: `total`, `total_qty`,
  `count_product`. No unit price, no product name, no KBKI code. `total / total_qty` is not a unit price when
  `count_product > 1`.
- **Line-level e-purchasing transactions** — the data that would actually detect mark-up — are restricted to
  auditors and APIP. Not public at any access tier.
- **The e-Katalog storefront** (`katalog.inaproc.id`) shows unit prices per product per supplier, without
  login. It is the only public source of unit prices in the entire ecosystem.

And the constraint: the storefront's Terms of Service permit automated indexing by **Google, Bing and Baidu
only**. Any other crawler requires a cooperation arrangement with the Pengelola Katalog Elektronik — LKPP
together with PT Telkom, under Perpres 17/2023. UU ITE 11/2008 is the statute that would apply.

So the single most valuable source is the one we may not touch.

## Decision — pending

**Until this ADR is Accepted, no scraper or automated request runs against `katalog.inaproc.id` or
`data.inaproc.id`.** This is stated in `AGENTS.md`, reflected in `.claude/settings.json` deny rules, and
recorded as `prohibited` in [`../data/legal-register.md`](../data/legal-register.md).

Three options, to be decided by the repo owner:

**Option A — formal cooperation.** Request permission from LKPP and the Pengelola Katalog for a defined,
narrow collection: listed prices for named KBKI categories, at a stated request rate, for a stated
public-interest purpose, with attribution. Precedent is strong: ICW operates opentender.net with LKPP support
under an equivalent posture. Slow, and it may be refused.

**Option B — aggregate-only, no collection.** Build every flag that does not need unit prices — six of the
nine — and present the price benchmark as explicitly unavailable, documenting why. Ships immediately, fully
defensible, and materially weaker as a product.

**Option C — abstain and wait.** LKPP is reportedly developing a public reference-price (*best price*) view
for e-Katalog V6. If it ships, it may satisfy the requirement with no agreement needed. Costs nothing but
time and depends on something outside our control.

**Recommended: pursue A and C in parallel while building B.** They are not mutually exclusive. B is the only
one that produces working software this quarter, A is the only one that unblocks the actual goal, and C might
make A unnecessary. Filing the A request costs a letter — it should be sent before more engineering is
committed either way.

Not an option: collecting first and asking later. It would breach the ToS of the body we depend on for every
other data source, and a transparency project caught breaching terms has no credibility left to spend.

## Consequences

- While `Proposed`, the highest-value flag in the catalog cannot be implemented. Six others can.
- If the answer is B, [ADR-0003](0003-v1-scope-price-benchmark.md) should be superseded and Direction B
  (vendor network) promoted to v1 — most of its inputs are already obtainable.
- Whichever way this resolves, the honest framing is that **Pelintir describes procurement disclosure as much
  as procurement itself.** The docs say so rather than implying the data is richer than it is.
- Reversal cost of choosing wrongly toward collection: potentially terminal. Toward abstention: a delay.
  That asymmetry is why the default is abstention.

## Alternatives considered

**Manual collection at small scale**, for a research sample only. Not automated, so arguably outside the
crawler clause. Not resolved here; if pursued it needs its own explicit decision, because "a person clicking
slowly" and "a script" are not obviously different to a terms-of-service argument.

**Third-party mirrors of catalogue prices.** Rejected without investigation — a mirror does not launder the
original terms, and its own provenance would be unverifiable.

## Next step

File requests 1–3 in [`../data/access-requests.md`](../data/access-requests.md). That log, not this ADR, is
where progress is tracked; this ADR is updated only when the decision is actually made.
