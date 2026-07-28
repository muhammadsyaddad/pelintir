---
name: write-adr
description: Create an architecture decision record with correct numbering, template, and status discipline, and update the index. Use when a choice is expensive to reverse — storage, classification, data collection, licensing, scope, hosting, publishing personal data — or on any request to "write an ADR", "record this decision", or "document why we chose".
---

# Write an ADR

## Check it needs one

An ADR is for a choice that is expensive to reverse. The test: *would reversing this mean reprocessing data or
rewriting a subsystem?*

Not required for dependency bumps, formatting, or a flag that follows the existing spec contract. Say so and
stop rather than producing ceremony.

## Steps

1. Read `docs/adr/README.md` for the rules and `docs/adr/0000-template.md` for the shape.
2. `ls docs/adr/` and take the next sequential number. **Numbers are never reused**, including after a
   rejection.
3. Check whether an existing ADR already covers this. If it does and the answer has changed, the new record
   marks the old one `Superseded by ADR-NNNN` — **the old ADR's reasoning is never edited away.** That record
   is the only thing an ADR is good for.
4. Write `docs/adr/NNNN-kebab-case-title.md`: Context, Decision, Consequences, Alternatives considered.
5. Add a row to the index table in `docs/adr/README.md`.
6. If the decision is `Proposed`, state explicitly what it blocks. A `Proposed` ADR is a stop sign, not a
   suggestion.

## Writing it well

**Context** states facts that force a decision — constraints, licence terms, statutes, API limitations — not
preferences. Cite external facts.

**Decision** is one paragraph, imperative.

**Consequences** must include the bad parts. An ADR listing only upsides has not been thought through, and the
future reader needs the costs more than the benefits. Include what reversal would cost.

**Alternatives** each get the reason they lost. Where an alternative is genuinely close, **say so** — that is
what makes a later reversal cheap to argue for, and pretending a close call was obvious is how a project gets
stuck with a decision nobody can revisit.

One page, hard cap. If it needs more, it is two decisions.

## Then

If the decision changes what code may do, reflect it in `AGENTS.md` (as a rule, not an explanation) and in
`.claude/settings.json` if a permission can express it. If it changes what actually runs, update
`docs/status.md`.
