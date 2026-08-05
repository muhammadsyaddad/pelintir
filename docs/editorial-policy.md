# Editorial Policy

**This is the most important document in the repository.** It is the difference between a project that
survives its first false positive and one that gets sued out of existence.

Every other doc may be revised freely. Changes to this one require owner review (see
[`.github/CODEOWNERS`](../.github/CODEOWNERS)).

---

## The rule

> **A flag is a question, never an accusation.**

Pelintir computes statistical indicators over public procurement data. An indicator says that a record
is *unusual relative to comparable records*. It does not say — and cannot say — that anyone did anything
wrong. Unusual is not illegal. There are legitimate reasons for nearly every flag we compute, and
`methodology/limitations.md` enumerates them.

This is not timidity. It is the same doctrine ProZorro/DoZorro operates under: **the machine performs
triage, humans perform investigation.** DoZorro's design assumes the machine is frequently wrong; its
job is to narrow millions of records to a reviewable set, not to render a verdict. A system that claims
verdicts loses all credibility the first time it is wrong about a real company — and it will be wrong,
because the input data is dirty.

### Correct

> Harga satuan 7,4× di atas median 214 paket sejenis — perlu diperiksa.
>
> *(Unit price is 7.4× the median of 214 comparable packages — worth checking.)*

Every element is load-bearing:

| Element | Why it is required |
|---|---|
| The comparison (`7,4× di atas median`) | States the claim in terms a reader can dispute |
| The basis (`214 paket sejenis`) | Discloses the denominator, so the reader can judge the strength |
| The invitation (`perlu diperiksa`) | Frames the output as triage, not conclusion |

### Wrong

> ~~Korupsi terdeteksi pada paket ini.~~
> ~~Anomaly score: 0.87~~

The first is defamatory and unprovable. The second is worse than useless: it is unfalsifiable, so no
reader can act on it and no vendor can rebut it. **An opaque score is not a finding.**

---

## Banned words

These must never appear in any user-facing string, flag copy, page title, chart label, alert, or
generated export. The `docs:lint` task enforces this list mechanically against every `question_*` field
in a flag spec and every UI copy file.

```
korupsi
korup
koruptor
penggelapan
penipuan
suap
kolusi
mark-up
markup
terbukti
pelanggaran
melanggar hukum
kriminal
pidana
fraud
fraudulent
corrupt
corruption
bribery
embezzlement
rigged
proven
guilty
illegal
```

Some of these are legitimate *analytical* terms — `kolusi` (collusion) is the standard name for what a
single-bidder indicator gestures at, and OCP's own literature uses it. That is fine in
`methodology/`, which describes what an indicator is derived from. It is not fine in a string a reader
sees next to a named company. **The ban applies to user-facing copy, not to methodology prose.**

Adding a word to this list is always allowed. Removing one requires an ADR.

---

## Approved phrasing patterns

All user-facing copy is **Indonesian-authoritative**: the Indonesian string is the real one, the English
is a gloss for contributors. If the two disagree, the Indonesian wins.

Every flag string must instantiate one of these patterns.

### 1. Comparative deviation

```
{metric} {ratio}× di atas median {n} {peer_unit} sejenis — perlu diperiksa.
```

Use when there is a peer group and a computable ratio. Requires `n ≥ min_peer_n`.

### 2. Structural observation

```
{observation}. {frequency_context} — perlu diperiksa.
```

Example: `Hanya satu peserta yang memasukkan penawaran. 12% tender di instansi ini pada 2024 juga
demikian — perlu diperiksa.`

Use when the signal is categorical rather than numeric.

### 3. Concentration

```
{entity} memenangkan {share}% dari {n} paket {scope} — perlu diperiksa.
```

### 4. Timing

```
{event} terjadi dalam {duration}, di bawah {reference} — perlu diperiksa.
```

### 5. Missing / insufficient data

```
Data {field} tidak tersedia untuk paket ini.
```

Never imply that missing data is suspicious. Absence of a field is nearly always an artifact of how
LKPP publishes, not a signal. See `methodology/limitations.md`.

---

## Required disclosures

Any screen that displays a flag must also display, without interaction:

1. **The comparison basis** — what the record was compared against, in words.
2. **The sample size `n`** — never hidden behind a tooltip.
3. **A link to the flag's methodology page.**
4. **A link to the official source record** on SiRUP / SPSE / e-Katalog, so any reader can verify
   independently. If we cannot link to a source, we do not publish the flag.

Additionally:

- **Never rank entities by flag count alone.** "Most flagged agency" reads as "most corrupt agency" and
  correlates mainly with agency size and data completeness. If a leaderboard exists at all, it must be
  rate-based, size-normalised, and labelled with its denominator.
- **Never aggregate flags into a single composite score** for a named agency or vendor. Composite scores
  are the "anomaly score: 0.87" failure at institutional scale.
- **Never publish a flag computed on fewer peers than `min_peer_n`.** A median of two rows is not a
  benchmark. See `methodology/peer-group.md`.

---

## Correction policy and right of reply

Published false positives are inevitable and must be cheap to fix. Because Pelintir names real
organisations and real companies, this is not optional courtesy — it is what makes the project
defensible.

1. **Right of reply.** Any agency or vendor may submit a response to a flag on a record concerning them.
   Accepted responses display alongside the flag, at equal prominence, without editorial rebuttal.
2. **Correction turnaround.** A report of factual error gets an acknowledgement within 7 days and a
   resolution or status update within 30.
3. **Corrections are public.** When a flag is withdrawn, the record shows that it was withdrawn and why.
   Silent deletion destroys trust faster than the original error.
4. **Retraction propagates.** Withdrawing a flag must also withdraw it from any aggregate, export, or
   cached page that included it.
5. **Contact:** see [`SECURITY.md`](../SECURITY.md).

Deliberate design consequence: a flag on a record is *state*, not a static render. It can be disputed,
annotated, and withdrawn. Any UI that treats a flag as an immutable fact violates this policy.

---

## Style rules for Indonesian copy

- Formal register, no slang, no sarcasm, no exclamation marks. The tone is a civil servant's memo, not a
  headline.
- Numbers use Indonesian conventions: comma as decimal separator, period as thousands separator
  (`7,4×`, `Rp1.259.200.000`).
- Currency is always written `Rp` with no space before the figure. Never abbreviate to "M"/"B"/"jt"
  without also giving the full figure.
- Company and agency names are reproduced exactly as they appear in the source record, including
  inconsistent spacing and punctuation. Normalisation happens in the data layer for matching purposes
  (see `methodology/item-normalization.md`); it is never applied to displayed names, because a
  "corrected" name is a claim about identity we may not be able to defend.
- Never use the passive voice to smuggle in an accusation ("dana diduga dialihkan"). If a sentence needs
  `diduga` to be defensible, it does not belong in the product.

---

## When in doubt

Ask: *if this string appeared in a newspaper next to a company's name, and the company's lawyer read it,
what exactly would we be claiming?*

If the answer is anything other than "that this record differs measurably from comparable records", the
string is wrong.

---

## Related

- [`methodology/README.md`](methodology/README.md) — indicator lineage and the triage doctrine
- [`methodology/limitations.md`](methodology/limitations.md) — what the data cannot tell you
- [`methodology/peer-group.md`](methodology/peer-group.md) — `min_peer_n` and comparability
- [`adr/0002-data-licence-lineage.md`](adr/0002-data-licence-lineage.md) — publication constraints
- [`glossary.md`](glossary.md) — Indonesian procurement terms
