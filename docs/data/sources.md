# Data sources — what each one contains

`last_reviewed: 2026-08-08`

Whether we *may* use a source is [`legal-register.md`](legal-register.md) — the merge gate. This page is the
other half: what a source actually *contains*, and where its shape helps or hurts the v1 goal (a per-unit price
benchmark). Read the register first; a rich source we may not touch is not a source.

## The central problem

The v1 goal needs a **unit price** — what one laptop cost — for enough comparable packages to form a median
([`../methodology/peer-group.md`](../methodology/peer-group.md)). The public data landscape does not hand that
over ([ADR-0006](../adr/0006-scrape-ekatalog-storefront.md)):

- **SiRUP** publishes *pagu*, a budget ceiling set before procurement — [not a price](../glossary.md).
- **SPSE** publishes contract values at the **package** level — not per unit.
- **INAPROC's** `paket-e-purchasing` endpoint returns order aggregates (`total`, `total_qty`,
  `count_product`); `total / total_qty` is not a unit price once `count_product > 1`.
- **e-Katalog storefront** shows real per-product unit prices — and its terms forbid us from collecting them
  (`ekatalog-storefront` is `prohibited`).

That leaves **opentender-ocds** as the one legal, bulk, agreement-free source (`attribution-required`, ODbL).
The open question is whether it carries unit prices at all:

> OCDS models a line item as `awards[].items[]`, and each `Item` *can* hold `quantity` and
> `unit.value.amount` — a unit price. The opentender registry reports ~1.09M award items, but reporting that
> the `items` array is populated is not the same as reporting that `unit.value.amount` is. It is most likely
> empty, because publishers rarely fill it — but "most likely" is not a fact.

This is answerable in one afternoon and is not yet answered. `scripts/check_ocds_fields.py` walks a downloaded
dump and reports, per award item, how often `unit.value.amount` and `quantity` are actually populated. If they
are, Pelintir gets unit prices under ODbL with the e-Katalog question left entirely aside. If they are not,
that becomes a recorded fact here rather than a standing assumption. Until it is run against a real dump, treat
the unit-price column of `opentender-ocds` as **unverified**.

## Listed price vs transacted price

Two different numbers, not interchangeable — the distinction [`../methodology/peer-group.md`](../methodology/peer-group.md)
and [`../methodology/red-flags/unit-price-vs-peer-median.md`](../methodology/red-flags/unit-price-vs-peer-median.md)
both depend on:

- A **listed price** is a catalogue offer (what e-Katalog shows). It is what a supplier says an item costs.
- A **transacted price** is what an agency actually paid on a specific order or contract.

A benchmark built from listed prices answers "was this catalogue expensive?"; one built from transacted prices
answers "did this agency overpay?" — the actual v1 question. Mixing the two in one peer group silently compares
offers against payments. Any benchmark must state which basis it used, and never pool both.

## Classification: KBKI vs KBLI

- **KBKI** (*Klasifikasi Baku Komoditas Indonesia*, 2015) classifies **commodities** — the thing bought. It is
  the intended normalisation backbone and is mandatory in SiRUP/SPSE/e-Katalog under SE Kepala LKPP 2/2023
  ([`../methodology/item-normalization.md`](../methodology/item-normalization.md)).
- **KBLI** classifies **business activities** — what a company does. It describes vendors, not items.

They are easy to confuse and answer different questions. Pelintir groups items, so KBKI is the relevant axis —
though today grouping is by a rule-based category vocabulary, **not** KBKI
([ADR-0011](../adr/0011-category-vocabulary-before-kbki.md)).

## Per-source content

| Source | Contains | Unit price? | Granularity |
|---|---|---|---|
| [`opentender-ocds`](legal-register.md#opentender-ocds) | Tenders and awards in OCDS, national coverage, monthly bulk | **Unverified** — `items[].unit.value.amount` may be empty | award line item (if `items` populated) |
| [`bps-webapi`](legal-register.md#bps-webapi) | IKK regional cost index; KBKI reference | No — reference data | region / classification code |
| [`ekatalog-storefront`](legal-register.md#ekatalog-storefront) | Listed prices per product per supplier | Yes (listed) — but `prohibited` | product × supplier |
| [`inaproc-api-gateway`](legal-register.md#inaproc-api-gateway) | Structured procurement records; e-purchasing aggregates | No (aggregate only) | package / order aggregate |
| [`satudata-eproc`](legal-register.md#satudata-eproc) | eProc datasets incl. Daftar Hitam | No | varies; quarantined |
| [`sirup`](legal-register.md#sirup) | Procurement plans: *pagu*, KBKI | No — *pagu* is a ceiling | planned package |
| [`spse`](legal-register.md#spse) | Tenders, HPS, bidders, winners, contract values | No — package-level value | package |

## External precedent

OCDS is not exotic. **ProZorro** (Ukraine) is OCDS-native end to end and is the standard reference for an
open-contracting analytics platform; **opentender.net** itself is ICW's OCDS deployment over Indonesian data,
and the closest domestic precedent to this project ([`../methodology/README.md`](../methodology/README.md)).
Building on OCDS means our external lineage is a published standard, not a bespoke scrape.
