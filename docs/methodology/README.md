# Methodology

## Doctrine

> **The machine performs triage. Humans perform investigation.**

This is copied deliberately from **DoZorro** (Ukraine), the closest thing to a proven version of what
Pelintir is trying to be. Ukraine built ProZorro as the state e-procurement system with a fully open API;
civil society, led by Transparency International Ukraine, built DoZorro on top to watch it. ProZorro
transacts, DoZorro observes.

DoZorro has used machine learning since 2018 to surface risky tenders and route them to human reviewers.
The community uncovered violations in over 30,000 tenders worth roughly US$4 billion, with problems
corrected in 14% of cases. Any citizen, business, or NGO can file feedback on a tender and report a
violation to the State Audit Service through an integrated channel.

The lesson worth stealing is not the model. **The flags were never the product — the loop was.** The
machine narrows millions of rows to a reviewable set; humans investigate that set; there is a formal
channel to report what they find. Most transparency dashboards implement step one, go viral for a week,
and die. `05` in the file tree exists because of this.

Three consequences that constrain every design decision downstream:

1. **The system is assumed to be frequently wrong.** Precision matters more than recall, and every flag
   carries a documented false-positive section. See [`red-flags/README.md`](red-flags/README.md).
2. **Every flag must be explainable in one sentence a non-specialist can dispute.** "7,4× above the
   median of 214 comparable packages" is actionable. "Anomaly score 0.87" is not — nobody can act on it
   and nobody can rebut it.
3. **Output is phrased as a question, always.** This is a legal requirement, not a stylistic one. See
   [`../editorial-policy.md`](../editorial-policy.md).

---

## Indicator lineage

Pelintir does not invent its own risk taxonomy. The indicator set derives from the **Open Contracting
Data Standard (OCDS)** and the **Open Contracting Partnership** red-flag indicators — the same
methodology the UK's national procurement dashboard is being built around. Reusing an established,
externally documented indicator set means the methodology is defensible by citation rather than by
argument, and comparable across jurisdictions.

Every spec in [`red-flags/`](red-flags/) carries an `ocp_reference` field. Where an indicator has no OCP
equivalent, the field says `none` and the spec justifies its existence.

Additional precedent recorded in [`../data/sources.md`](../data/sources.md): ProZorro's OCDS-native
storage, the Kyiv School of Economics savings analysis across 40 product groups, and ICW's Potential
Fraud Analysis on Indonesian data since 2010.

---

## Structure of this directory

| File | What it settles |
|---|---|
| [`peer-group.md`](peer-group.md) | What "comparable" means. The denominator behind every ratio. Read this before any price work. |
| [`item-normalization.md`](item-normalization.md) | How millions of free-text item names become comparable groups. The project's technical moat. |
| [`red-flags/`](red-flags/) | One spec per indicator. Thresholds and user-facing copy live here, authoritatively. |
| [`vendor-network.md`](vendor-network.md) | Direction B — vendor-level analysis. Documented, scheduled for v2. |
| [`limitations.md`](limitations.md) | What this data cannot tell you. Linked from every flag spec. Required reading. |

---

## Two directions

**Direction A — price benchmark.** The strongest available signal is not "this item looks strange", it is
"this agency paid 4× what 200 other agencies paid for the same item". It is computable, comparative, and
hard to argue with. It requires normalising item names across millions of rows, which is the actual hard
engineering and therefore the moat. **This is v1** ([ADR-0003](../adr/0003-v1-scope-price-benchmark.md)).

**Direction B — vendor network.** Existing Indonesian tools analyse *packages*. Nobody systematically
analyses *vendors*: who wins repeatedly from the same agency, which companies were registered weeks
before their first win, which suppliers share addresses or directors. This is where corruption actually
lives — not in absurd item names. **Documented now, built in v2** — see [`vendor-network.md`](vendor-network.md).

The sequencing is not a judgement that A matters more. It is that A is the harder engineering problem and
the more distinctive claim, so it defines the architecture. Ironically, A is also the one blocked on data
access while most of B's inputs are already obtainable
([ADR-0006](../adr/0006-scrape-ekatalog-storefront.md)) — which is why the flag catalog is documented in
full rather than trimmed to A.

---

## Thresholds are documentation, not code

Every threshold, every `min_peer_n`, and every user-facing string lives in a flag spec's YAML
frontmatter, and the pipeline reads it from there. A magic number in a pipeline module is a bug, not a
style preference. Rationale: [ADR-0007](../adr/0007-flag-specs-as-single-source.md).

This also means the public methodology page is generated from the same source the code uses, so it cannot
drift from what the system actually computes.

---

## Language

Methodology prose is English, and may use precise analytical vocabulary — including terms like
*collusion* and *mark-up* — because it describes what an indicator is derived from.

User-facing copy is Indonesian, authoritative, and bound by the banned-word list. The distinction is
deliberate and is spelled out in [`../editorial-policy.md`](../editorial-policy.md).
