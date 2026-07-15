# Versus Pillar 3 — Realtime Live Progress — Implementation Plan

> **For agentic workers:** execute inline (user prefers inline over subagent fleets — memory `execution-cost-preference`). Verify: `cd quiet-arcade && npx tsc -b` + `npm run lint` (0 new oxlint warnings), two-session browser E2E. Steps use `- [ ]`.

**Goal:** Turn a Versus match into a live head-to-head: both players see each other's presence and running progress in real time, and the result reveals the moment both finish — replacing Pillar 1's manual "Check for opponent" poll.

**Architecture:** A Supabase **Realtime** channel `versus:<code>` per match carries presence (who's connected) and broadcast events (`start`, `progress`, `submitted`). It is **purely additive** on top of the durable match rows from Pillars 1–2 — if realtime drops, async still works. The `VersusProgress` type and `api.versus.onProgress` hook already exist (added in Pillar 1) as no-ops; this pillar wires them up.

**Prereq:** Pillars 1–2. Existing: `versus_matches`, `useVersusMatch`, `VersusShell`, `api.versus` (`config`, `role`, `onProgress`, and — added in Pillar 2 — `matchId`), `VersusProgress { role, score, step?, lockedIn? }`.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-15-versus-1v1-design.md` (Real-time = **live progress**, decided with the user).
- Supabase Realtime must be enabled for the project (broadcast + presence; no table replication needed — we use broadcast, not postgres_changes, to avoid exposing rows). Human setup: enable Realtime, add a note to `supabase/README.md`.
- Additive only: single-player and async flows must not regress. Channel failures degrade to the Pillar 1 poll (keep a "Check for opponent" fallback button).
- Presence key = the player's `auth.uid()`. Never broadcast the correct answer or anything not already visible to the opponent (scores are fair to show live; Trivia question *content* is identical for both, so a step index is fine).
- `erasableSyntaxOnly`; GateGuard first-write gate applies.

---

### Task 1: `realtime.ts` — channel helper

**Files:** Create `quiet-arcade/src/lib/versus/realtime.ts`

**Interfaces produced:**
```ts
import type { VersusProgress } from "./types";

export interface VersusChannel {
  broadcastStart(): void;
  broadcastProgress(p: VersusProgress): void;
  broadcastSubmitted(): void;
  leave(): void;
}
export interface VersusChannelHandlers {
  onPresence?: (peers: string[]) => void;   // uids currently in the room
  onStart?: () => void;
  onProgress?: (p: VersusProgress) => void;
  onSubmitted?: () => void;
}
export function openVersusChannel(code: string, selfId: string, handlers: VersusChannelHandlers): VersusChannel;
```

**Implementation:** `supabase.channel('versus:' + code, { config: { presence: { key: selfId } } })`. On `'presence'` sync, collect keys → `onPresence`. Register `broadcast` listeners for events `start`/`progress`/`submitted` → handlers. `channel.subscribe(status => { if (status==='SUBSCRIBED') channel.track({ at: Date.now() }); })`. `broadcastX` = `channel.send({ type:'broadcast', event, payload })`. `leave()` = `supabase.removeChannel(channel)`. Guard `supabase === null` (return a no-op channel).

- [ ] Write helper → `tsc -b` + lint → commit `feat(versus): realtime channel helper`.

---

### Task 2: `useVersusMatch` — subscribe for presence + auto-refresh

**Files:** Modify `quiet-arcade/src/lib/versus/useVersusMatch.ts`

**Change:** after the match loads, `openVersusChannel(code, selfUid, { onPresence, onSubmitted: refresh })`. Expose new state: `peers: string[]` (for "opponent online") and keep `refresh`. On `onSubmitted`, call `refresh()` so the opponent's score appears instantly (no manual poll). Clean up the channel on unmount. `selfUid` from `supabase.auth.getUser()` (cache once) or derive from `view.you_are` + host/guest id.

**Interfaces produced:** `useVersusMatch(code)` now returns `{ view, loading, error, refresh, peers, channel }` (channel exposed so `VersusShell` can broadcast progress/start).

- [ ] Modify hook → `tsc -b` + lint → commit `feat(versus): presence + auto-refresh on opponent submit`.

---

### Task 3: `VersusShell` — live strip, progress broadcast, ready/start handshake

**Files:** Modify `quiet-arcade/src/components/VersusShell.tsx`; Modify `quiet-arcade/src/pages/VersusRoomPage.tsx` (pass `channel` + `peers` down)

**Changes:**
- Accept `channel: VersusChannel` and `peers: string[]` props.
- Build `api.versus.onProgress = (p) => channel.broadcastProgress(p)` (replaces the no-op).
- Track opponent's latest `VersusProgress` in state via the channel's `onProgress` handler (wired in `VersusRoomPage` → `useVersusMatch`, surfaced to the shell). Render a live strip: "Opponent — 600 pts · Q4" / "Opponent is placing their pin…".
- Presence: show "Opponent online / offline / left" from `peers`.
- On local `finish`, also `channel.broadcastSubmitted()` so the opponent refreshes.
- **Ready/start handshake (the "simultaneous" feel):** when `view.live` (realtime rooms + matchmaking) and both peers present, show a "Both here — Start" gate; the host `broadcastStart()`, both begin on `onStart`. Async (code-shared, `!view.live` or opponent absent) skips the gate and starts immediately. Keep the Pillar 1 "Check for opponent" button as a fallback.

- [ ] Modify shell + room page → `tsc -b` + lint → commit `feat(versus): live opponent strip + start handshake`.

---

### Task 4: Emit progress from the games

**Files:** Modify `quiet-arcade/src/games/MapDrop.tsx`; Modify `quiet-arcade/src/games/Trivia.tsx`

- **MapDrop:** call `api.versus?.onProgress({ role, score: 0, lockedIn: false })` on pin placed, and `{ ..., lockedIn: true }` on confirm/finish. (Single guess, so "progress" is mostly presence + locked-in.)
- **Trivia:** call `api.versus?.onProgress({ role, score: points, step: index })` after each answered question (both easy-local and server paths — for the server path use the score returned by `answerTrivia`). Role from `api.versus.role`.
- All guarded by `api.versus?.` so single-player is unaffected.

- [ ] Modify both games → `tsc -b` + lint → commit `feat(versus): games broadcast live progress`.

---

### Task 5: End-to-end verification

- [ ] Two anon sessions in one match: confirm presence ("opponent online"), the live progress strip updates as the opponent answers/places, the start handshake works for a `live` match, and the result reveals immediately when both submit (no manual poll).
- [ ] Kill one tab: the other shows "opponent left" and can still finish; result resolves on reconnect/submit or expiry.
- [ ] `tsc -b` + lint clean → commit `test(versus): pillar 3 realtime e2e verified`.

## Self-Review
- Spec's "live progress" realtime requirement covered; additive over async (fallback preserved). ✓
- No secret data broadcast (scores/steps only). ✓
- Ready/start handshake gives the simultaneous feel for `live` matches without breaking async. ✓

## Notes for Pillar 4
- Matchmaking pairs create `live` matches → this pillar's handshake + live strip apply directly. The pairing notification can reuse `openVersusChannel` on a `matchmaking:<uid>` channel.
