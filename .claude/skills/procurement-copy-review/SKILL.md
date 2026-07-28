---
name: procurement-copy-review
description: Audit Indonesian user-facing copy against the editorial policy. Use whenever a diff adds or changes any string a user will see — flag text, page copy, chart labels, alerts, exports, error messages. Trigger on "review copy", "check phrasing", "is this wording ok", or before merging any UI or flag-spec change.
---

# Procurement copy review

The highest-value check in this repository. Pelintir publishes statistical claims about named agencies and
named companies; the phrasing is what separates a defensible finding from a defamation claim.

## Before reviewing

Read, every time — do not work from memory:

1. `docs/editorial-policy.md` — the rule, the banned-word list, the approved phrasing patterns
2. `docs/glossary.md` — terminology, and the "terms we avoid" table
3. `docs/methodology/limitations.md` — what the underlying claim can actually support

## Scope

Every string a user could see: flag copy in red-flag spec `question_id` / `question_en` frontmatter, page and
component text, chart and axis labels, table headers, tooltips, empty states, error messages, export headers,
and email or notification text.

Not in scope: methodology prose in `docs/`, code comments, log messages, variable names. Those may use precise
analytical vocabulary such as *collusion* or *mark-up*.

## Checks

For each changed string, in order:

1. **Banned words.** Any term from the `docs/editorial-policy.md` list. This is a hard fail, no exceptions,
   including in a string that is "obviously" internal — internal strings leak into screenshots.
2. **Question, not accusation.** Does it invite verification, or assert a conclusion? An accusatory string with
   a question mark bolted on still fails.
3. **Comparison stated.** Does it say what the record was compared against? A bare number is not a claim
   someone can dispute, and a claim nobody can dispute is not publishable.
4. **Sample size present.** Is `n` in the string, not hidden behind a tooltip? Below `min_peer_n` it must not
   be published at all.
5. **Price basis.** If the claim involves price, does it distinguish listed from transacted? These are not
   interchangeable — `docs/data/sources.md`.
6. **Placeholders.** Is every `{placeholder}` actually supplied by the implementation? An unfilled placeholder
   reaching a user is a hard fail.
7. **Pattern match.** Does it instantiate one of the approved patterns in the policy, or invent a new shape?
   New shapes need a policy change, not a one-off.
8. **Indonesian correctness.** Grammatical, formal register, no slang, no sarcasm, no exclamation marks.
   Numbers use comma decimal and period thousands (`7,4×`, `Rp1.259.200.000`).
9. **Entity names.** Are agency and company names reproduced exactly as published, not silently "corrected"?
   A normalised display name is a claim about identity.
10. **No composite scores, no flag-count rankings.** Both read as verdicts. Policy forbids them.

## The test to apply

*If this string appeared in a newspaper next to a company's name, and that company's lawyer read it, what
exactly would we be claiming?*

Anything other than "this record differs measurably from comparable records" is a fail.

## Output

One line per finding: `path:line: <severity>: <problem>. <suggested replacement>.` Severity `blocker` for
banned words, accusatory framing, missing sample size, or unfilled placeholders; `warn` for register, number
formatting, or pattern drift.

Propose a concrete replacement string in Indonesian. "Reword this" is not a review.

If nothing fails, say so in one line. Do not pad with praise, and do not comment on code outside the copy.
