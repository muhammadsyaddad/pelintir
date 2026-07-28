# .claude/

Agent tooling. **No documentation content lives here** — if a skill needs a fact, it reads `docs/`. Two copies
of a fact means one is wrong.

| Path | What it is |
|---|---|
| `settings.json` | Committed permissions. Personal overrides go in `settings.local.json` (gitignored). |
| `skills/` | Multi-step procedures with checks that no single command captures. |
| `commands/` | Thin macros that invoke a skill and hold no procedure of their own. |
| `agents/` | Read-only reviewers with restricted tools and an adversarial brief. |

Canonical agent instructions are [`../AGENTS.md`](../AGENTS.md); `../CLAUDE.md` is a pointer to it.

## About the deny rules in `settings.json`

The `inaproc` deny entries are **a speed bump and a signal, not a security boundary.** A determined agent can
construct a URL differently, use a different tool, or reach the same host by another name. Nothing in a
permission list can prevent that.

The real controls are:

- [ADR-0006](../docs/adr/0006-scrape-ekatalog-storefront.md), which states plainly that collection is not
  permitted and why;
- `CODEOWNERS` on `docs/data/`, so a legal-register row cannot change without owner review;
- the `data-legal-reviewer` agent, run at PR time on any diff touching ingestion.

This is written down so nobody mistakes the allowlist for compliance. A permission file that is treated as a
guarantee is more dangerous than one that is treated as a reminder.

## Why these four skills and not more

A skill earns its place when it encodes a **multi-step procedure with checks**. Build, test, lint and dev are
commands — wrapping them in a skill adds indirection and nothing else.

`new-red-flag` is deliberately marked as pending: a procedure skill written before its first real instance is
guesswork. It gets written after the first flag is built by hand.
