---
id: vague-package-title
status: planned
severity: low
direction: A
inputs:
  - package.title
  - package.contract_value
  - package.kbki_code
  - item_normalization.confidence
min_peer_n: null
thresholds:
  min_specificity_score: 0.3
  value_floor_idr: 1000000000
question_id: >-
  Judul paket tidak menyebut barang atau jasa yang spesifik, untuk nilai
  {value} — perlu diperiksa.
question_en: >-
  The package title does not name a specific good or service, for a value of
  {value} — worth checking.
ocp_reference: none
last_reviewed: 2026-07-28
---

# Vague package title

**Stub.** Frontmatter, question and non-claims are settled; formula, threshold justification and false
positives are completed by the PR that implements this flag — see [`README.md`](README.md).

## The question

> Judul paket tidak menyebut barang atau jasa yang spesifik, untuk nilai Rp4.200.000.000 — perlu diperiksa.
>
> *The package title does not name a specific good or service, for a value of Rp4,200,000,000 — worth
> checking.*

## What this does not claim

It does not claim that scope was deliberately hidden. It claims that a high-value package's title does not
identify what was procured, which prevents any price comparison and prevents public scrutiny of the
purchase.

The honest framing is that this is **a transparency indicator, not a risk indicator**. Its real value is
accountability for disclosure quality — and it is a genuine one, because a package nobody can classify is a
package nobody can benchmark.

`min_peer_n` is `null`: there is no peer comparison, and the flag is a property of a single record. Instead
the value floor does the work of keeping the output proportionate — flagging every small vague title would
produce hundreds of thousands of uninteresting hits.

`ocp_reference: none`. There is no direct OCP equivalent; the closest analogues are data-quality measures
rather than red flags. Justification for including it anyway: it is the direct upstream cause of coverage
loss in [`../item-normalization.md`](../item-normalization.md), so it explains *why* a package is missing
from benchmarks, and that explanation is worth surfacing rather than hiding.

Language caution: "vague" is a judgement about a document, not about a person or an institution's intent.
Copy must not drift toward implying concealment. See [`../../editorial-policy.md`](../../editorial-policy.md).

## To be completed on implementation

Definition of the specificity score (candidate approach: presence of a KBKI-resolvable noun phrase after
stripping procurement boilerplate such as `pengadaan`, `belanja`, `untuk keperluan`, `tahun anggaran`),
threshold justification for both the score and the value floor, and the false-positive section — which must
at minimum cover legitimate framework or multi-item packages, construction packages named by project rather
than by item, titles that are specific in ways our parser does not recognise, and abbreviations or local
terminology.
