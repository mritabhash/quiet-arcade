# Agent Loop Policy

Every agent run (Strategist, Worker, promotion) operates under these rules.

## Allowed autonomously (disclose in the next daily ask)
- Installing free npm packages.
- Using services already configured in this repo, within their free tiers
  (Supabase, Firebase Hosting, PostHog).

## Owner-only — file a resource request in the daily ask and WAIT
- Anything costing money.
- Creating accounts of any kind.
- Obtaining, storing, or entering credentials, API keys, or secrets.
- Changing DNS, billing, or Firebase/Supabase project settings.

## Hard rules
- The Worker never commits to `main` except ledger updates under
  `docs/agent/`. The Strategist may commit to `main` only under
  `docs/agent/`.
- Production deploys happen only from the owner's machine via `/promote`.
- Supabase migrations are never applied by cloud agents: include SQL in the
  PR under `supabase/`, set `migration: true` on the goal.
- A goal that fails 3 consecutive Worker cycles becomes `blocked`.
- At most 3 goals in `approved`/`in_progress` combined.
- Every daily ask reports totals: shipped, in progress, blocked, proposed.
- If `docs/agent/goals.yaml` fails validation, STOP and report — never guess.
