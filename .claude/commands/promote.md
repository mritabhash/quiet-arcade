---
description: Merge a previewed agent goal and deploy it to production
argument-hint: <goal-id, e.g. qa-001>
---

Promote goal $ARGUMENTS to production. Steps, in order; stop and report on
any failure:

1. Read docs/agent/goals.yaml on main (git checkout main && git pull).
   Confirm goal $ARGUMENTS has status: preview and a pr link. If not, stop
   and tell the owner its actual status.
2. If the goal has migration: true, print the SQL files it added under
   supabase/ and ASK THE OWNER to confirm before applying via the repo's
   established local Supabase workflow. Do not proceed without confirmation.
3. Merge the PR: gh pr merge <pr-number> --squash --delete-branch
4. git pull, then npm install && npm run lint && npm test && npm run build
   (use the VITE_* env values from .github/workflows/deploy.yml).
5. Deploy production: firebase deploy --only hosting
6. Verify https://quiet-arcade.club loads and shows the change.
7. In docs/agent/goals.yaml set the goal status: live and write a one-line
   outcome. Append a line to docs/agent/PLAYBOOK.md under "Shipped outcomes"
   (date, id, title, one-line result). Run node scripts/validateGoals.mjs.
8. Commit docs/agent/* to main, message "agent(promote): <id> live", and push.
