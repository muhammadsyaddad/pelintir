# Security and Corrections

Two separate channels. Both matter, and the second one is unusual enough to be easy to overlook.

> **Contact:** `SECURITY_CONTACT_PLACEHOLDER` — replace with a real address before this repository is made
> public. A security policy nobody can reach is worse than none, because it implies a channel that does not
> exist.

---

## Reporting a security vulnerability

Report privately to the address above. Do not open a public issue.

Include what you did, what happened, and what you expected. A proof of concept helps; a working exploit against
production does not — please do not test against live infrastructure beyond what is needed to demonstrate the
issue.

**What to expect:** acknowledgement within 7 days, an assessment within 30, and coordinated disclosure. We will
credit you unless you prefer otherwise. We will not pursue legal action against good-faith research that
respects the boundaries above — this project exists because people look at things they were not handed.

**In scope:** this codebase, and any Pelintir-operated deployment.

**Out of scope:** the LKPP systems Pelintir reads from (`inaproc.id`, `sirup.lkpp.go.id`, `katalog.inaproc.id`,
SPSE instances). They are not ours. Report vulnerabilities in those to LKPP directly, and do not test them on
our behalf or in our name.

---

## Reporting a wrong flag

**This is the channel most transparency projects lack, and it is the one that keeps this one honest.**

Pelintir publishes statistical indicators about named agencies and named companies. Some will be wrong — the
input data is dirty, item matching is imperfect, and unusual is not illegal. If we have flagged something
incorrectly, tell us.

Who this is for: an agency or supplier that a flag concerns, a journalist who checked a figure and found it
does not hold, or anyone who spots an error.

Please include the package or record identifier, the flag in question, and what is actually the case. A link to
the official source record is the most useful thing you can send.

**What to expect:** acknowledgement within 7 days, and a resolution or status update within 30. Then:

- **Right of reply.** Any agency or supplier may submit a response to a flag concerning them. Accepted
  responses display alongside the flag, at equal prominence, without editorial rebuttal.
- **Corrections are public.** When a flag is withdrawn, the record shows that it was withdrawn and why. Silent
  deletion destroys trust faster than the original error did.
- **Retractions propagate.** A withdrawn flag is removed from every aggregate, export and cached page that
  included it.

Full policy: [`docs/editorial-policy.md`](docs/editorial-policy.md). What our indicators cannot show:
[`docs/methodology/limitations.md`](docs/methodology/limitations.md).

---

## Personal data

**Do not include personal data in a public issue or pull request** — names of procurement officials, company
directors, or sole-proprietor NPWP. These are personal data under **UU PDP**. If your report requires them, use
the private contact above.

The same applies to contributions: do not commit real procurement data, credentials, or `.env` files. `data/`,
`*.parquet`, `*.duckdb` and `.env` are gitignored for this reason.

## Data handling in this repository

No real procurement data is committed. Tests run against a small synthetic fixture. Raw data lives outside git
under `PELINTIR_DATA_DIR`.

Source data licences differ, and some prohibit commercial use — mixing them incorrectly is a legal risk rather
than a security one, but it is tracked with equal seriousness in
[`docs/data/legal-register.md`](docs/data/legal-register.md) and
[ADR-0002](docs/adr/0002-data-licence-lineage.md).
