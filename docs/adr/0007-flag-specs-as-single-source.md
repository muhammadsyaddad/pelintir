# ADR-0007: Flag spec frontmatter is authoritative for thresholds and copy

- **Status:** Accepted
- **Date:** 2026-07-28

## Context

Every red flag has three things that must agree: a documented definition, a threshold the code compares
against, and a user-facing string. The usual arrangement is prose documentation plus constants in code plus
strings in the UI, with a `# see docs` comment linking them.

That arrangement desynchronises. Someone tunes a threshold in a hotfix, the doc keeps the old number, and the
published methodology page now describes a system that does not exist. For a project whose output names real
organisations, a methodology page that misdescribes the computation is not a documentation bug — it is a
misrepresentation of a claim made about a named company.

There is also an editorial constraint: user-facing copy is bound by
[`../editorial-policy.md`](../editorial-policy.md) and must be machine-checkable against a banned-word list.
Strings scattered across UI components cannot be checked as a set.

## Decision

Each red-flag spec in [`../methodology/red-flags/`](../methodology/red-flags/) opens with YAML frontmatter
holding `id`, `status`, `severity`, `direction`, `inputs`, `min_peer_n`, `thresholds`, `question_id`,
`question_en`, `ocp_reference`, `last_reviewed`.

**The frontmatter is authoritative.** The pipeline and the UI copy layer read it — via a small loader, or a
generated JSON artifact — rather than declaring thresholds or strings of their own. A magic number in a
pipeline module is a bug, not a style preference.

Enforced by tests and `docs:lint`:

1. Every `status: implemented` flag has an implementation, and every implementation has a spec.
2. Every `question_*` field passes the banned-word check.
3. No flag emits below its `min_peer_n`.
4. Placeholders in `question_id` are a subset of what the implementation supplies.

## Consequences

- The public methodology page is **generated from the same source the code executes**, so it cannot drift.
- Changing a threshold is a documentation change, which means it goes through review by the docs CODEOWNER
  rather than slipping in as a constant tweak. Deliberate friction on exactly the change that most needs it.
- **`docs/` becomes a build input to `packages/pipeline`.** That is real coupling in an unusual direction, and
  the main cost of this decision. It means a malformed YAML block can fail a pipeline run.
- A loader must exist before the first flag ships, plus a fixture-based test for the loader itself.
- Reversal cost: low. Thresholds could be moved back into a Python config module in an afternoon.

## Alternatives considered

**Prose docs plus a single `thresholds.py`,** with each spec marked "non-authoritative, see `thresholds.py`."
This is the honest version of the conventional approach — one place for numbers, and docs that admit they are
descriptive. Genuinely close, and simpler. Rejected because it does not solve the copy problem: user-facing
Indonesian strings still end up in UI components where they cannot be checked as a set against the banned-word
list, and that check is the one that carries legal weight.

**Thresholds in a database, editable at runtime.** Rejected. A published flag must be reproducible from a
commit; runtime-mutable thresholds mean nobody can say what computation produced last month's claim.

**Trust review discipline.** Rejected on the reasoning in
[`../README.md`](../README.md): prose that only a reviewer checks eventually stops being checked.
