# Vendor Network Analysis (Direction B)

`status: planned` — scheduled for v2. Documented now because the decision to build it has been made, and
because it changes the data model that v1 lays down.

---

## Why this direction exists

Existing Indonesian procurement analysis is package-centric: it asks whether a *package* looks strange.
Nobody systematically analyses *vendors* — who wins repeatedly from the same agency, which companies were
registered weeks before their first large win, which suppliers share an address or a director.

That asymmetry matters because **corruption lives in relationships, not in item names.** An absurdly priced
gate is a viral screenshot. A company that has won 81% of one agency's contracts for four years is a
pattern, and patterns are what investigations are built from.

Reference for the shape of this work: **QuiénEsQuién.wiki** (Mexico), which links companies, owners and
contracts as a graph rather than a table.

---

## Why it is v2, not v1

Direction A (price benchmarking) defines the harder engineering problem — item normalisation — and
therefore the architecture. Building A first means the data model is shaped by the harder constraint.
See [ADR-0003](../adr/0003-v1-scope-price-benchmark.md).

There is an uncomfortable irony worth stating: **most of Direction B's inputs are already obtainable, while
Direction A is blocked on data access** ([ADR-0006](../adr/0006-scrape-ekatalog-storefront.md)). SPSE
publishes participants, winners and contract values; none of the vendor indicators need unit prices. If the
e-Katalog access question resolves unfavourably, promoting Direction B to v1 is the obvious response, and
this document exists so that pivot costs a sprint rather than a rewrite.

---

## Indicators

Four of the nine catalogued flags are vendor-shaped. Their specs live in
[`red-flags/`](red-flags/); this section covers what they share.

| Flag | Question it raises |
|---|---|
| [`vendor-concentration`](red-flags/vendor-concentration.md) | Does one supplier win a disproportionate share of one agency's packages? |
| [`new-vendor-large-first-contract`](red-flags/new-vendor-large-first-contract.md) | Did a newly registered company win a large contract as its first? |
| [`single-bidder`](red-flags/single-bidder.md) | Was there effectively no competition? |
| [`short-tender-window`](red-flags/short-tender-window.md) | Was the window too short for a new entrant to respond? |

Additional network signals, not yet specified as flags because they require entity resolution first:
shared registered addresses between competing bidders; shared directors; bidders that consistently appear
together and consistently lose to the same winner; suppliers whose entire contract history is with a single
agency.

---

## The hard part: entity resolution

Vendor analysis is only as good as the answer to *"are these two rows the same company?"* Indonesian
supplier names arrive as `PT. Anu Jaya`, `PT ANU JAYA`, `PT Anu Jaya (Persero)`, `CV Anu Jaya`, and
`PT Anu Jaya Abadi` — where the last one is a genuinely different company.

Design consequence for the v1 data model:

- A `vendor` table holding resolved identities.
- A `vendor_alias` table mapping every observed name variant to a resolved identity, with `source`
  recording whether the mapping was automatic or human-confirmed.
- **Merges are human-confirmed.** Automatic name similarity proposes; a reviewer in `apps/dashboard`
  decides. Merging two distinct companies is a factual error about identity that we would then publish
  under a company's name — the most damaging class of error this project can make.
- Merges are reversible, and reversing one must retract every flag that depended on it.

Where a national registry identifier (NPWP, NIB) is available it takes precedence over name matching. Note
that sole-proprietor NPWP is personal data under UU PDP — see `../data/pdp.md`, which must exist before any
such field is handled.

---

## What these indicators cannot show

Beyond the general caveats in [`limitations.md`](limitations.md):

- **Concentration is often legitimate.** Specialised markets have few qualified suppliers. Medical
  equipment, aircraft parts and proprietary software have exactly one authorised distributor in many
  regions, and that supplier will win every time, lawfully.
- **A new company is not a shell company.** New businesses exist. Restructurings and spin-offs produce
  recently registered entities with experienced management and real capacity.
- **A shared address is not a conspiracy.** Office buildings, business incubators, and virtual-office
  services host hundreds of registered companies. This is a signal only in combination with others.
- **Structure is not intent**, and a network diagram is unusually persuasive relative to its evidentiary
  weight. Graph visualisations invite readers to infer collusion from adjacency; any such view needs
  heavier caveating than a table, not lighter.
- **Registration dates are unreliable** where the source is inconsistently populated.

---

## Design constraints for v1

Two things v1 must do so v2 is cheap:

1. **Ship `vendor` and `vendor_alias` in the first migration**, even if alias resolution is initially a
   no-op. Retrofitting entity resolution onto a schema that stored raw name strings means reprocessing
   everything.
2. **Preserve the raw name exactly as published, always.** The alias table maps to a canonical identity;
   it never overwrites the observed string. Displayed names come from the source record, per
   [`../editorial-policy.md`](../editorial-policy.md).

---

## Related

- [`README.md`](README.md) — the two directions and why A leads
- [`limitations.md`](limitations.md) — required caveats
- [`red-flags/`](red-flags/) — the four vendor indicator specs
- [ADR-0003](../adr/0003-v1-scope-price-benchmark.md) — the scope decision
