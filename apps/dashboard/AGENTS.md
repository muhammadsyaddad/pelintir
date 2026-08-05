# apps/dashboard

Internal admin. Same stack as `apps/web`, port 3001. Read [`../../AGENTS.md`](../../AGENTS.md) first.

Purpose: normalisation corrections, vendor alias merges, report triage — the human half of the triage loop
([`../../docs/methodology/README.md`](../../docs/methodology/README.md)).

Not public, but **assume screenshots leak**: the editorial policy applies here too, and personal data stays out
of the UI regardless of audience.

Two operations here are destructive and need care: a **vendor alias merge** asserts that two companies are the
same entity, and reversing it must retract every flag that depended on it
([`../../docs/methodology/vendor-network.md`](../../docs/methodology/vendor-network.md)). Merges are
human-confirmed, never automatic.

Still a `create-turbo` starter page. Shared frontend conventions go in `docs/frontend-conventions.md`, not here.
