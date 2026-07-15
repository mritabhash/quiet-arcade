# Quiet Arcade — Supabase backend setup

Optional accounts + daily leaderboards. Anonymous play never touches this —
the app works fully offline with localStorage exactly as before; Supabase only
activates when the env vars below are present.

## Security model (what the schema guarantees)

- **RLS enabled AND forced** on `profiles`, `scores`, `user_stats`,
  `daily_completions`. Every policy is scoped `auth.uid() = user_id`
  (`USING` + `WITH CHECK`), so no user can read or write another user's rows —
  enforced in the database, not app code.
- **`user_id` is never trusted from the client**: columns default to
  `auth.uid()`, `WITH CHECK` rejects mismatches, and the scores trigger
  re-verifies ownership.
- **Scores are immutable**: no UPDATE/DELETE policies and privileges revoked;
  rows only disappear via the `auth.users` `ON DELETE CASCADE`.
- **Leaderboards leak nothing**: precomputed tables hold only opted-in
  profiles (`show_on_leaderboard = true` and a handle set), and column-level
  grants hide `user_id` — API roles can select only
  `{handle, score, rank, updated_at}`. `select *` fails on purpose; the
  client names its columns.
- **Server-side anti-cheat (casual)**: a trigger clamps `score ≤ max ≤`
  per-game cap (`game_catalog`), rejects stale `date_key`s, allows one daily
  score per game per day, and stamps `seed_sig = HMAC(dateKey:gameId)` with a
  server-only secret.
- **Account deletion**: `delete_account()` RPC deletes the `auth.users` row;
  every user table cascades from it.
- The **`service_role` key is never used by the app** — the browser gets only
  the anon key. Keep `service_role` for the dashboard/cron only.

## One-time setup (human steps)

1. **Create a project** at https://supabase.com/dashboard (any region).

2. **Apply the schema**: open SQL Editor → paste all of
   `supabase/migrations/0001_accounts_and_leaderboards.sql` → Run.
   (If it warns that `pg_cron` is unavailable, enable the extension under
   Database → Extensions and re-run just the final `do $$ ... $$;` block.)

3. **Provision the daily-seed secret** (SQL Editor):

   ```sql
   insert into private.secrets (name, value)
   values ('daily_seed_secret', encode(extensions.gen_random_bytes(32), 'hex'))
   on conflict (name) do nothing;
   ```

4. **Auth providers** (Authentication → Sign In / Up):
   - Enable **Anonymous sign-ins**.
   - Enable **Email** (email + password).
   - Enable **Google**: create an OAuth client in Google Cloud Console, set
     the authorized redirect URI to
     `https://YOUR-PROJECT.supabase.co/auth/v1/callback`, paste the client
     ID/secret into Supabase. Add your site origin(s) to Authentication →
     URL Configuration → Redirect URLs (e.g.
     `https://your-site.example/quiet-arcade/account` and
     `http://localhost:5173/quiet-arcade/account` for dev).

5. **Client env vars**: copy `.env.example` to `.env.local` in the project
   root and fill in (Settings → API):

   ```
   VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR-ANON-PUBLIC-KEY
   ```

   `.env.local` is gitignored. Never put the `service_role` key here or
   anywhere in the repo.

6. **Run the isolation tests**: paste `supabase/tests/isolation_tests.sql`
   into the SQL Editor and run. Expect `PASS: ...` notices ending in
   `ALL ISOLATION TESTS PASSED` (everything rolls back — no residue).

7. **First leaderboard fill** (optional — cron does it nightly at 00:10 UTC):

   ```sql
   select public.refresh_leaderboards();
   ```

## Design notes

- **Anonymous sessions**: the app signs in anonymously (when online) so play
  data syncs even before signup; signing up **upgrades** the same identity, so
  nothing is lost. Offline or unconfigured, the app is a pure local guest.
- **Leaderboard points start at account creation**: local history is merged
  into stats/completions, but individual historical rounds can't be replayed
  into `scores` (the trigger rejects stale dates — that's the anti-cheat
  trade-off).
- **`user_stats` stores jsonb** (`kind` = `game` / `flagship` / `overall`)
  rather than one column per stat: the client's TypeScript types remain the
  source of truth, merges stay trivial, and isolation is unaffected — RLS is
  row-scoped and leaderboards read only `scores`.
- **Avatars are preset emoji** stored on the profile row — no Storage bucket,
  so there's no per-user storage policy surface at all.
- **Score caps** in `game_catalog` are deliberately generous; tighten them in
  the dashboard if cheating ever becomes a nuisance.

- Run `migrations/0002_versus.sql`, then `supabase/tests/versus_isolation_tests.sql` to confirm Versus RLS (expects `ALL VERSUS TESTS PASSED`).
