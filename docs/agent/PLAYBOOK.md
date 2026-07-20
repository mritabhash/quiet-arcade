# Agent Playbook

Operating notes the loop maintains about Quiet Arcade. The Strategist reads
this before proposing and appends learnings after each cycle; `/promote`
appends shipped outcomes. Newest entries at the top of each section.

## Product state (seed, 2026-07-20)
- Live at https://quiet-arcade.club (Firebase Hosting, project quiet-arcade-b3b22).
- Games: Map Drop, Trivia (major overhaul in progress: 9 topics, modes,
  lifelines), TimeLens, Higher/Lower, Shapes.
- Supabase: accounts + leaderboards (RLS schema, repo facade layer).
- PostHog analytics wired in.
- Branch `versus-1v1`: online 1v1 for Map Drop/Trivia; pillar 1 (async Map
  Drop) built, migration not yet applied. Do not duplicate this work.

## Owner preferences (seed)
- Cost-sensitive: keep idle agent cycles near-zero; prefer inline work over
  agent fleets.
- Preview-first: nothing reaches production without an owner glance.
- Approvals batched once daily in chat.

## Shipped outcomes
(none yet)

## Rejected proposals and why
(none yet)

## Conventions that work
- Checks that gate every change: npm run lint, npm test, npm run build.
