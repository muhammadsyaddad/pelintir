---
description: Evaluate a data source's licence, ToS, and personal-data exposure before any fetch code
---

Run the `data-source-intake` skill for: $ARGUMENTS

If no source is named, list the rows in `docs/data/legal-register.md` whose status is `unknown` or whose
`last_reviewed` is more than 180 days old, and ask which to assess.
