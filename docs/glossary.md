# Glossary

Indonesian public-procurement terminology. Engineering docs are written in English, but these terms are
kept **verbatim** rather than translated — they are legal categories with no clean English equivalent, and
translating them produces false precision.

This file also settles naming in code: pick the term here once and use it consistently as an identifier.
`pagu` is `pagu`, not `budget`, not `ceiling`, not `plafon`.

Every Indonesian term used anywhere in `docs/` must have an entry here. `docs:lint` does not check this
mechanically; reviewers do.

---

## Institutions

| Term | Gloss | Why it matters to us | Source |
|---|---|---|---|
| **LKPP** | *Lembaga Kebijakan Pengadaan Barang/Jasa Pemerintah* — the national public procurement policy agency | Operates every system we source from, and the counterparty for every data-access request | `lkpp.go.id` |
| **LPSE** | *Layanan Pengadaan Secara Elektronik* — an electronic procurement service unit | Hundreds of instances, each hosting its own SPSE. Explains why scraping is a many-endpoint problem | `inaproc.id/satudata` |
| **KLPD** | *Kementerian / Lembaga / Pemerintah Daerah* — ministry, agency, or regional government | The `kode_klpd` parameter on nearly every INAPROC endpoint; the unit an agency profile page represents | INAPROC API |
| **instansi** | An institution or agency, used generically | The everyday word for the entity a profile page is about; used in UI copy where `KLPD` would be jargon | — |
| **satuan kerja / satker** | Work unit — a budget-holding subdivision of an instansi | The actual buyer on most records. An instansi's flags aggregate over its satker | SiRUP, INAPROC |
| **APIP** | *Aparat Pengawasan Intern Pemerintah* — internal government audit apparatus | Holds access to line-level e-purchasing data that is not public. The audience for the restricted comparison tools | — |
| **PPID** | *Pejabat Pengelola Informasi dan Dokumentasi* — public information officer | The office through which a UU KIP request is filed | UU KIP 14/2008 |
| **BPS** | *Badan Pusat Statistik* — the central statistics agency | Publishes KBKI and the IKK regional cost index | `bps.go.id` |
| **BPK** | *Badan Pemeriksa Keuangan* — the supreme audit board | Publishes IHPS audit findings, as narrative PDFs | `bpk.go.id` |
| **ICW** | Indonesia Corruption Watch | Operates opentender.net, the closest domestic precedent to this project | `antikorupsi.org` |

## Systems

| Term | Gloss | Why it matters to us | Source |
|---|---|---|---|
| **INAPROC** | The national procurement portal and, now, the API gateway | Primary structured data source; requires credentials | `data.inaproc.id` |
| **SiRUP** | *Sistem Informasi Rencana Umum Pengadaan* — procurement plan information system | Publishes *pagu* and KBKI per planned package. Plans, not transactions | `sirup.lkpp.go.id` |
| **SPSE** | *Sistem Pengadaan Secara Elektronik* — the e-procurement system | Tender announcements, HPS, bidders, winners, contract values. Source for four of the nine flags | `spse.inaproc.id` |
| **e-Katalog** | Electronic catalogue of pre-negotiated products | The only public source of unit prices — and legally blocked | `katalog.inaproc.id` |
| **e-purchasing** | Buying directly from the e-Katalog without a tender | Non-competitive by design. Must not be flagged as uncompetitive | — |
| **SIKaP** | *Sistem Informasi Kinerja Penyedia* — supplier performance system | Supplier track record, behind login. Out of scope | `sikap.lkpp.go.id` |
| **SIPD** | *Sistem Informasi Pemerintahan Daerah* | Regional budget execution. Not open data | `sipd.kemendagri.go.id` |
| **Daftar Hitam** | Blacklist of debarred suppliers | Useful supplier filter and cross-check | `inaproc.id/daftarhitam` |
| **ISB** | *Interoperabilitas Sistem dan Basis Data* — the legacy LKPP data API | Being decommissioned from 31 January 2026. Do not build against it | `isb.lkpp.go.id` |

## Money and documents

| Term | Gloss | Why it matters to us | Source |
|---|---|---|---|
| **pagu** | Budget ceiling allocated to a planned package | What SiRUP publishes. **Not a price** — it is a limit set before procurement. Using it as a price is the most common analytical error with this data | SiRUP |
| **HPS** | *Harga Perkiraan Sendiri* — the procuring entity's own price estimate | The ceiling bids are measured against. Subject of the [`award-vs-hps`](methodology/red-flags/award-vs-hps.md) flag | SPSE |
| **APBN / APBD** | State budget / regional budget | Denominator context for the year-end-spike indicator | `djpk.kemenkeu.go.id` |
| **DIPA** | *Daftar Isian Pelaksanaan Anggaran* — budget implementation document | Revisions to it explain much legitimate year-end contracting | — |
| **MAK** | *Mata Anggaran Kegiatan* — budget line code | Appears in e-purchasing records; links spending to a budget line | INAPROC API |
| **SP2D** | *Surat Perintah Pencairan Dana* — disbursement order | Actual payment records. Generally not published | — |
| **SPPBJ** | *Surat Penunjukan Penyedia Barang/Jasa* — supplier appointment letter | Part of the consolidated e-contract endpoint | INAPROC API |
| **SPMK** | *Surat Perintah Mulai Kerja* — work commencement order | Same | INAPROC API |
| **BAST** | *Berita Acara Serah Terima* — handover record | Same. Evidence a contract was actually delivered | INAPROC API |
| **NPWP** | *Nomor Pokok Wajib Pajak* — taxpayer identification number | Strong entity-resolution key — but **personal data under UU PDP** for sole proprietors | — |
| **NIB** | *Nomor Induk Berusaha* — business identification number | Preferred non-personal entity-resolution key | — |
| **TKDN** | *Tingkat Komponen Dalam Negeri* — domestic content level | Published on catalogue products; a legitimate cause of price variation | e-Katalog |

## Procurement methods

Distinguishing these correctly is essential: several avoid a tender for different reasons, and conflating
them produces meaningless denominators. See [`direct-award-share`](methodology/red-flags/direct-award-share.md).

| Term | Gloss | Competitive? |
|---|---|---|
| **tender** | Open competitive tender for goods/works | Yes |
| **tender cepat** | Fast-track tender using a prequalified supplier pool | Yes |
| **seleksi** | Competitive selection, used for consultancy services | Yes |
| **penunjukan langsung** | Direct appointment of a single supplier under defined conditions | No — by design |
| **pengadaan langsung** | Direct purchase, for low-value procurement | No — by design |
| **e-purchasing** | Purchase from the e-Katalog | No — by design |
| **swakelola** | Self-managed work, performed by the agency or a community group rather than procured | N/A — no supplier |
| **penyedia** | Supplier / vendor | — |
| **peserta** | Tender participant, i.e. a bidder | — |
| **pemenang** | Winner | — |

## Classification

| Term | Gloss | Why it matters to us | Source |
|---|---|---|---|
| **KBKI** | *Klasifikasi Baku Komoditas Indonesia* — Indonesian standard commodity classification, 2015 edition | The backbone of item normalisation. Mandatory in SiRUP/SPSE/e-Katalog since SE Kepala LKPP 2/2023. Hierarchical 1–10 digits, maps to CPC and HS | `bps.go.id/klasifikasi/app/kbki` |
| **KBLI** | *Klasifikasi Baku Lapangan Usaha Indonesia* — classification of business activity | Classifies **companies, not products**. Do not use it to group items | BPS |
| **OCDS** | Open Contracting Data Standard | The interoperability format opentender.net publishes in; our external lineage | `standard.open-contracting.org` |
| **CPV** | Common Procurement Vocabulary (EU) | The structural analogue of KBKI in EU benchmarking | — |
| **IKK** | *Indeks Kemahalan Konstruksi* — construction cost index by region | Our regional price adjustment factor. A proxy, not a true goods deflator | BPS Web API |
| **SHSR** | *Standar Harga Satuan Regional* — regional unit cost standard | Ceiling reference for operational costs, not commodity prices | Perpres 72/2025 |
| **SBM** | *Standar Biaya Masukan* — input cost standard | Annual PMK; budget-planning cost standards | `jdih.kemenkeu.go.id` |
| **AHSP** | *Analisa Harga Satuan Pekerjaan* — construction work unit-cost analysis | Construction cost references | Permen PUPR 1/2022 |
| **BMHP** | *Bahan Medis Habis Pakai* — medical consumables | The category in the Kemenkes consolidation savings finding | — |

## Legal instruments

| Term | Gloss | Why it matters to us |
|---|---|---|
| **UU KIP** | UU No. 14/2008 on public information openness | The basis for formally requesting data that is not published. See [`data/access-requests.md`](data/access-requests.md) |
| **UU PDP** | Personal data protection law | Governs officials' names, directors, and sole-proprietor NPWP. See `data/pdp.md` |
| **UU ITE** | UU No. 11/2008 on electronic information and transactions | The statute relevant to unauthorised system access — i.e. to scraping questions |
| **Perpres** | *Peraturan Presiden* — presidential regulation | Perpres 16/2018 (as amended) governs procurement; Perpres 17/2023 covers catalogue management |
| **PMK** | *Peraturan Menteri Keuangan* — minister of finance regulation | Issues the annual SBM |
| **Permen PUPR** | Regulation of the minister of public works and housing | Issues AHSP |
| **SE** | *Surat Edaran* — circular letter | SE Kepala LKPP 2/2023 made KBKI mandatory |
| **JDIH** | *Jaringan Dokumentasi dan Informasi Hukum* — legal documentation network | Where the above are published |

---

## Terms we avoid

Not because they are wrong, but because using them in user-facing copy would make a claim we cannot
support. See [`editorial-policy.md`](editorial-policy.md) for the enforced list.

| Term | Why avoided |
|---|---|
| **korupsi**, **suap**, **penggelapan** | Criminal allegations. Never in user-facing copy |
| **kolusi** | Legitimate in methodology prose; never next to a named company |
| **mark-up** | Presumes intent. Say "di atas median" instead |
| **anomali** | Vague, and reads as accusatory without stating a comparison |
| **fiktif** | An allegation of fraud |
