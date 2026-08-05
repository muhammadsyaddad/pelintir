# Limitations

What this data cannot tell you. Linked from every flag spec, and required reading before citing anything
Pelintir produces.

This document exists for two reasons. Journalists and activists need it to avoid writing a story the data
does not support. And we need it, because a project that has not written down what it cannot prove will
eventually claim more than it can.

---

## The one that matters most

**A flag is not evidence of wrongdoing.** It is a statement that a record differs measurably from
comparable records. Unusual is not illegal.

Every indicator in the catalog has legitimate causes. A single bidder can mean a rigged tender or a
genuinely specialised market. An award at 99% of HPS can mean the price leaked or that the HPS was
competently estimated. A price 5× the median can mean a mark-up or that the specification is different in
a way the data does not capture.

What a flag supports is a **question worth asking**. What it never supports is a conclusion. This is why
the copy is phrased as it is — see [`../editorial-policy.md`](../editorial-policy.md).

---

## Data limitations

### Unit prices are largely absent from public data

Not a gap to be engineered around — a structural feature of how Indonesian procurement is published.
SiRUP publishes *pagu* (a ceiling set before procurement). SPSE publishes contract values. The public
e-purchasing API publishes order totals. Line-level transaction data (who bought what, how many, at what
unit price) is restricted to auditors and APIP.

Consequence: for most of the corpus, "the price" means a package total, not a unit price. Any per-unit
figure derived from `total / total_qty` on a multi-product order is arithmetic, not information. See
[`../data/sources.md`](../data/sources.md).

### Listed price is not transacted price

Where unit prices *are* visible — the e-Katalog storefront — they are prices suppliers advertise, not
prices agencies paid. Dispersion between listed prices is real and measurable, but a high listed price is
not overpayment by anyone. Any flag computed on listed prices must say so.

### Publication completeness varies enormously

Some agencies publish thoroughly; some publish the minimum. An agency that discloses more appears more
flagged, purely because there is more of it to analyse. **Flag counts therefore measure disclosure as much
as they measure risk**, which is why they are never ranked and never aggregated into a per-agency score.

### Records are dirty

Misplaced decimals, quantities of zero, prices of one rupiah, quantities embedded in description text,
truncated or simply wrong KBKI codes, the same vendor spelled six ways. Filtering removes the obvious
cases; it cannot remove the plausible-looking ones.

### Coverage is not the whole of procurement

Direct awards below thresholds, some emergency procurement, and *swakelola* (self-managed) work appear
inconsistently or not at all. A clean record is not proof of a clean agency; it may mean the spending went
somewhere the data does not follow.

### Time and revision

Records are amended after publication. A snapshot taken today can disagree with one taken last month, and
a flag computed on a pre-amendment record may be corrected by an amendment we have not ingested. Every
published flag is a statement about a specific snapshot, and should carry its date.

---

## Methodological limitations

### Normalisation is imperfect by construction

Grouping free-text item descriptions into comparable products cannot be fully solved. Set the grouping too
shallow and the median is meaningless; too deep and no group is large enough to publish. We choose KBKI
level 7 as a defensible compromise, accept an explicit accuracy target below 100%, and exclude
low-confidence rows — but some mismatched items reach a peer group.
See [`item-normalization.md`](item-normalization.md).

### Regional adjustment is a proxy

Prices are adjusted by the BPS **IKK**, a construction cost index used as a stand-in for general regional
price level. It is better than ignoring geography and worse than a real goods deflator. Remote regions with
genuinely higher logistics costs may still appear over-priced after adjustment.

### Small samples

Every flag has a `min_peer_n` floor, but a group of 5 is a weak benchmark even when it is a permitted one.
Sample size is always disclosed for exactly this reason. See [`peer-group.md`](peer-group.md).

### Thresholds are judgement calls

`2×` warn and `4×` high are not derived from a loss function; they are chosen to be legible and
conservative. They are documented in flag frontmatter so they can be argued with, which is the most that
can honestly be claimed for them.

### Specification is invisible

Two items can be the same product at KBKI level 7 and legitimately differ several-fold in price:
warranty terms, service level, delivery to a remote district, certification requirements, bundled
installation. The data rarely records any of that. **This is the single most common legitimate explanation
for a price flag** and it is why the ratio is presented as a question.

### Correlation, timing, and structure are not intent

The vendor-network indicators are the most suggestive and the most easily over-read. A company registered
shortly before winning a large first contract fits a shell-company pattern — and also fits a legitimate
new business, a corporate restructuring, or a spin-off. Structure is not intent.
See [`vendor-network.md`](vendor-network.md).

---

## What we do not attempt

- **No composite risk score** per agency or vendor. A single number invites exactly the reading the data
  cannot support.
- **No prediction.** Pelintir describes what was published; it does not forecast who will misbehave.
- **No inference about individuals.** Indicators are computed on organisations and records, not people.
  See `../data/pdp.md` and UU PDP.
- **No network inference from name similarity alone.** Two companies with similar names are not evidence
  of a relationship. Alias merging requires human confirmation and is recorded as such.
- **No claim that an absence of flags means anything.** Not flagged is not clean; it is frequently just
  not disclosed.

---

## How to cite Pelintir responsibly

If you are writing about something you found here:

1. Follow the link to the official source record and confirm the underlying figures yourself. We publish
   that link for exactly this purpose, and we do not publish flags without it.
2. Report the comparison and the sample size, not just the ratio. "7,4× the median of 214 comparable
   packages" is a claim; "7,4× the normal price" is not one we made.
3. State which price basis was used — listed or transacted.
4. Ask the agency and the supplier before publishing. They frequently have the explanation this data
   cannot contain, and our own right-of-reply policy assumes you will.
5. If we are wrong, tell us — the correction process is in
   [`../editorial-policy.md`](../editorial-policy.md), and corrections are published.

---

## Related

- [`../editorial-policy.md`](../editorial-policy.md) — how findings must be phrased
- [`peer-group.md`](peer-group.md) — comparability and `min_peer_n`
- [`item-normalization.md`](item-normalization.md) — accuracy targets and confidence tiers
- [`../data/sources.md`](../data/sources.md) — what each source does and does not contain
