# Legal register — the merge gate

`last_reviewed: 2026-08-08`

**No ingestion code merges without a row here.** This is a gate, not a reference. The `status` column decides
whether an adapter may run at all and, if it may, which raw-layer zone it writes to
([ADR-0002](../adr/0002-data-licence-lineage.md)). A source with no row, or `status: unknown`, is treated as
**prohibited** until a row is added and reviewed.

This register records *whether we may use a source*. What each source *contains* is
[`sources.md`](sources.md); formal attempts to obtain access are [`access-requests.md`](access-requests.md).

## Status vocabulary

| `status` | May an adapter run? | May its data reach a published artifact? |
|---|---|---|
| `permitted` | yes | yes |
| `attribution-required` | yes | yes, if attribution and licence lineage ship with the output |
| `requires-agreement` | no, until the agreement exists | governed by the agreement |
| `non-commercial-only` | yes, into the **quarantine** zone | **never** — internal analysis only ([ADR-0002](../adr/0002-data-licence-lineage.md)) |
| `prohibited` | no | no |
| `unknown` | no — treated as `prohibited` | no |

## The register

| id | source | host | licence | status | notes |
|---|---|---|---|---|---|
| <a id="opentender-ocds"></a>`opentender-ocds` | opentender.net OCDS bulk (ICW) | `opentender.net` | ODbL | `attribution-required` | Commercial use permitted with attribution; share-alike on derived databases ([ADR-0002](../adr/0002-data-licence-lineage.md)). Bulk file download, no agreement needed. **The one legal path to bulk data today.** Whether its award items carry unit prices is unverified — see [`sources.md`](sources.md) and `scripts/check_ocds_fields.py`. |
| <a id="bps-webapi"></a>`bps-webapi` | BPS Web API — IKK regional cost index | `webapi.bps.go.id` | BPS open data, free API key | `attribution-required` | Reference data only (IKK, KBKI), no procurement prices. Requires a free registered key. Used for the regional price adjustment in [`../methodology/peer-group.md`](../methodology/peer-group.md). |
| <a id="ekatalog-storefront"></a>`ekatalog-storefront` | e-Katalog storefront | `katalog.inaproc.id` | ToS: indexing by Google/Bing/Baidu only | `prohibited` | The **only** public source of unit prices, and the one we may not touch. Blocked until [ADR-0006](../adr/0006-scrape-ekatalog-storefront.md) is Accepted. No scraper or automated request runs against this host. |
| <a id="inaproc-api-gateway"></a>`inaproc-api-gateway` | INAPROC API Gateway | `data.inaproc.id` | requires credentialed agreement | `requires-agreement` | Structured procurement data behind an agreement we do not have. `/v1/ekatalog/paket-e-purchasing` returns order aggregates only, not unit prices ([ADR-0006](../adr/0006-scrape-ekatalog-storefront.md)). No scraper runs against this host either. |
| <a id="satudata-eproc"></a>`satudata-eproc` | Satu Data eProc | `inaproc.id/satudata` | CC BY-NC-SA 4.0 | `non-commercial-only` | Non-commercial and share-alike — **permanent** contamination of any output it touches ([ADR-0002](../adr/0002-data-licence-lineage.md)). Quarantine zone only; internal cross-check, never published. |
| <a id="daftar-hitam"></a>`daftar-hitam` | Daftar Hitam (supplier blacklist) | `inaproc.id/daftarhitam` | unstated | `unknown` | Useful supplier cross-check ([ADR-0002](../adr/0002-data-licence-lineage.md) names it), but no stated licence, so prohibited until one is confirmed. |
| <a id="sirup"></a>`sirup` | SiRUP procurement plans | `sirup.lkpp.go.id` | unstated | `unknown` | Publishes *pagu* (a ceiling, not a price) and KBKI per planned package ([`../glossary.md`](../glossary.md)). Licence unstated → prohibited until resolved. |
| <a id="spse"></a>`spse` | SPSE e-procurement | `spse.inaproc.id` | unstated | `unknown` | Tender announcements, HPS, bidders, winners, contract values — package-level, not per unit. Source for four planned flags. Many instances, one per LPSE. Licence unstated → prohibited until resolved. |
| <a id="sikap"></a>`sikap` | SIKaP supplier performance | `sikap.lkpp.go.id` | login-gated | `prohibited` | Behind login, out of v1 scope ([`../glossary.md`](../glossary.md)). |

## Verification basis

Every row above is anchored to a claim already committed in an accepted ADR or the
[glossary](../glossary.md): opentender = ODbL and Satu Data = CC BY-NC-SA are stated in
[ADR-0002](../adr/0002-data-licence-lineage.md); the e-Katalog crawler clause and the INAPROC aggregate-only
finding are in [ADR-0006](../adr/0006-scrape-ekatalog-storefront.md). Rows are **not** derived from a live
fetch of each site's terms — re-checking terms of service and `robots.txt` against the live sites is tracked
in [`access-requests.md`](access-requests.md) and is due before any `unknown` row is promoted. Two families of
doc carry `last_reviewed` for exactly this reason: terms are revised and endpoints move
([`../README.md`](../README.md)).
