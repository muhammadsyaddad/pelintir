## What and why

<!-- One paragraph. Link the ADR or spec this follows, if any. -->

## Checklist

Each line corresponds to a way this project can do real harm. If a box does not apply, say so — do not tick it
untruthfully, and do not delete it.

- [ ] **Data ingestion touched** → the source has a row in `docs/data/legal-register.md` whose status permits
      what this code does; licence and ToS verified and quoted
- [ ] **Flag added or changed** → spec frontmatter updated; the phrasing is a question, not an accusation; the
      known-false-positives section is non-empty
- [ ] **New user-facing Indonesian copy** → checked against `docs/editorial-policy.md`; comparison basis and
      sample size are both shown
- [ ] **Commands or env vars changed** → `README.md` and `.env.example` updated
- [ ] **An expensive-to-reverse decision was made** → ADR written and linked (`docs/adr/README.md`)
- [ ] **Ships personal data** → `docs/data/pdp.md` exists and this change respects it
- [ ] **`docs/status.md` is still true** after this change

## Verified

- [ ] `bun run lint`
- [ ] `bun run check-types`
- [ ] `bun run test`

<!--
No scraper or automated request against katalog.inaproc.id or data.inaproc.id while ADR-0006 is Proposed.
Never commit data files, *.parquet, *.duckdb, CSVs outside tests/fixtures/, .env, or personal data.
-->
