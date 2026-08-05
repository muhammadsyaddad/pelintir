# apps/web

Public site. Next.js 16 App Router, React 19, Tailwind v4 + shadcn, port 3000. SSR for SEO.

Read [`../../AGENTS.md`](../../AGENTS.md) first.

**Every string a user sees is Indonesian and must comply with
[`../../docs/editorial-policy.md`](../../docs/editorial-policy.md).** A flag is a question, never an
accusation, and it must show its comparison basis, its sample size, and a link to the official source record.

Four screens: national overview, agency profile, vendor profile, package detail.

Flag copy comes from red-flag spec frontmatter — do not invent a new user-facing string in a component
([ADR-0007](../../docs/adr/0007-flag-specs-as-single-source.md)).

Still a `create-turbo` starter page; leftover CSS modules coexist with Tailwind. Shared conventions will live in
`docs/frontend-conventions.md` once there are real components — put them there, not here, so `dashboard` does
not get a divergent copy.
