---
description: Check the working diff against the documentation and legal obligations
---

Walk the PR checklist in `.github/pull_request_template.md` against the working diff and report each line as
pass, fail, or not applicable — with the evidence for each.

Specifically:

1. **Ingestion touched?** Does every source involved have a row in `docs/data/legal-register.md`, with a status
   that permits what the code does?
2. **Flag added or changed?** Does the spec frontmatter validate against the contract in
   `docs/methodology/red-flags/README.md`? Is `question_id` a question? Is the known-false-positives section
   non-empty?
3. **New user-facing Indonesian copy?** Run the `procurement-copy-review` skill on it.
4. **Commands or env vars changed?** Are `README.md` and `.env.example` consistent with the code?
5. **Decision made?** Does it need an ADR (`docs/adr/README.md`)?
6. **Personal data?** Does `docs/data/pdp.md` exist, and does the change respect it?
7. **Does the diff make `docs/status.md` wrong?** This is the one most often missed — check what runs against
   what that file claims.

Report only failures and near-misses. Do not restate the checklist back when everything passes; say it passes.
