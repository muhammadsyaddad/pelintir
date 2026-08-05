# ADR-0002: Only ODbL-lineage data reaches published artifacts

- **Status:** Accepted
- **Date:** 2026-07-28

## Context

Indonesian procurement data is available under incompatible licences.

- **Satu Data eProc** (`inaproc.id/satudata`) is **CC BY-NC-SA 4.0** — non-commercial and share-alike.
- **opentender.net's OCDS bulk data** (ICW) is **ODbL** — commercial use permitted with attribution, with
  share-alike on derived databases.
- Several sources have no stated licence at all.

`NC` is not a formality. Any published dataset, export, or page containing CC BY-NC-SA material becomes
non-commercial and share-alike **permanently**, and that constraint travels to everyone who reuses it. It
would survive any later change of mind about funding, and it cannot be cleaned out of an artifact that has
already been distributed.

The project's own code is MIT, which does nothing to help here — code licence and data licence are separate,
and the data licence is the binding one.

Full per-source detail: [`../data/legal-register.md`](../data/legal-register.md).

## Decision

**Non-commercially licensed source data is quarantined.** It may be used for internal analysis and
cross-checking. It must never flow into a published artifact — no public page, no export, no API response, no
dataset drop.

This is enforced structurally, not by convention:

1. Licence status is a property of a **raw-layer partition**, recorded at ingestion time and derived from the
   source's row in the legal register.
2. Quarantined partitions live in a separate path prefix and are excluded from the queries that feed
   published outputs.
3. No ingestion code merges without a legal-register row. The register's `status` column is the gate.
4. Where the same fact is available from both an NC source and an ODbL source, **it is sourced from the ODbL
   one**, even when the NC source is more convenient.

`unknown` licence status is treated as `prohibited` until resolved.

## Consequences

- The pipeline carries a licence dimension it would not otherwise need. Every query that produces public
  output must be licence-aware, which is real added complexity.
- Some analysis will be internally visible and not publishable. That will be frustrating and is the correct
  outcome.
- ODbL's own share-alike applies to derived databases, so a public data drop still carries an obligation —
  attribution and licence lineage must ship with it. That is what `DATA-LICENSE.md` is for.
- Preferring ODbL sources means depending on opentender.net, a civil-society platform whose sustainability we
  do not control. Mitigation: verify its update cadence before treating it as a primary dependency
  ([`../data/access-requests.md`](../data/access-requests.md)).
- **Reversal cost: effectively infinite for anything already published.** This is why it is decided now, at
  zero cost, rather than after the first data drop.

## Alternatives considered

**Mix sources freely and accept NC terms on outputs.** Simplest to build. Rejected: it forecloses commercial
sustainability permanently and imposes share-alike on every downstream user, which is a decision we would be
making on their behalf without their knowledge.

**Use only ODbL sources, drop NC entirely.** Cleaner still — no licence dimension in the pipeline at all.
Rejected because NC sources contain genuinely useful cross-check material (the Daftar Hitam blacklist among
it), and internal verification against them makes the published work more accurate. Quarantine keeps that
value without the contamination.

**Decide later, when publishing.** Rejected. By then the architecture would assume mixing, and the cost of
separating the zones would be a reprocessing job rather than a path prefix.
