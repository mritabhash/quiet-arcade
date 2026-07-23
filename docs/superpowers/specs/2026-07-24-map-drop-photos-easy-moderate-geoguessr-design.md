# Map Drop — Photos→Easy swap & Moderate GeoGuessr (Mapillary) — Design

**Date:** 2026-07-24
**Status:** Approved by user (this session)
**Game:** Map Drop (`src/games/MapDrop.tsx`), Quiet Arcade

## Summary

Two coupled changes to Map Drop's four difficulty tabs:

1. **Easy** becomes the Wikimedia **photo-clue round** that is currently
   **Moderate**. The old globe-tap Easy (`MapTapEasy`) is **retired**.
2. **Moderate** becomes a new **GeoGuessr-style street-view game** built on
   **Mapillary** imagery with a pannable `mapillary-js` viewer — **5 rounds**,
   drop a pin per round, scored by distance.

Novice (name + country) and Hard (7 text hints) are unchanged. The tab row
stays four tabs, same order: **Novice · Easy · Moderate · Hard**.

## 1. Mode restructuring in `MapDrop.tsx`

The photo mechanic currently lives inline in `MapDrop.tsx`, keyed on
`difficulty === "moderate"`. Rebind every piece of it to `"easy"`:

- The `fetchPlaceImages` effect, the `images`/`imagesFailed`/`photoAttempt`
  state, `moderateReady`/`moderateLoading`/`moderateUnavailable`, the photo
  grid + lightbox UI, and the "five distinct photos required" retry card.
- Constant renames for clarity: `MODERATE_MAX_SCORE → EASY_PHOTO_MAX_SCORE`,
  `MODERATE_IMG_COST → EASY_PHOTO_IMG_COST`, `MODERATE_MAX_IMAGES` /
  `MODERATE_MIN_IMAGES → EASY_PHOTO_MAX/MIN_IMAGES`. Values unchanged
  (4000 ceiling, 150/img cost, 5 images).
- Puzzle-pool selection rebinds: the photo pool (`MAP_DROP_PHOTO_PUZZLES`) and
  the versus verified-photo pool (`MAP_DROP_VERIFIED_PHOTO_PUZZLES`) now apply
  when `difficulty === "easy"` (and still for `api.mode === "daily"`).
- `eff` collapses: photos are their own render path, so the `eff` fallback only
  needs to cover novice/hard now. The `ceiling`/`totalHints`/`hints`
  expressions drop their `eff === "easy"`/`eff === "moderate"` branches and the
  reveal-cost copy switches on the photo path directly.

**Retire the globe-tap Easy:**

- Remove the `import { MapTapEasy }` line and the
  `if (difficulty === "easy") return <MapTapEasy … />` delegation.
- Delete the now-unreachable legacy easy-hint code from `MapDrop.tsx`:
  `easyFreeHintsFor`/`easyFree` usage, `EASY_MAX_SCORE`, `EASY_HINT_COST`,
  `EASY_TOTAL_HINTS`, and the flag/language/facts hint branches.
- **Kept on disk, unreferenced** (file deletion is separable cleanup, not in
  this spec): `src/games/MapTapEasy.tsx`, `src/lib/easyMode.ts`, and the
  `flagColours`/`languageSentences`/`countryFacts` data files.

**Delegate Moderate to the new game**, mirroring the old MapTapEasy hand-off:

```tsx
if (difficulty === "moderate") {
  return <MapDropStreetView api={api} difficulties={DIFFICULTIES}
           difficulty={difficulty} onPick={(d) => switchDifficulty(d)} />;
}
```

The difficulty toggle (tablist) and `switchDifficulty` persistence
(`quietArcade.mapDropDifficulty`) are unchanged; `"easy"` and `"moderate"`
simply route to different experiences.

## 2. New Moderate — GeoGuessr street view

Three new files, following existing patterns (`placeImages.ts`,
`MapTapEasy.tsx`, `LazyGlobeCanvas`):

### `src/lib/mapillary.ts`
- Reads `import.meta.env.VITE_MAPILLARY_TOKEN as string | undefined`
  (same cast style as `supabaseClient.ts`). `isMapillaryConfigured()` returns
  whether a non-empty token is present.
- `findStreetImage(place, signal): Promise<StreetImage | null>` queries the
  Mapillary **Graph API** `https://graph.mapillary.com/images` with
  `access_token`, `fields=id,computed_geometry,thumb_1024_url`, and a small
  `bbox` (~±0.004° ≈ 400 m) around `place.lat/lon`. Returns the image whose
  point is **nearest** the place coordinate (deterministic for a fixed place),
  or `null` when nothing lies within the radius (no coverage).
- `StreetImage = { id: string; lat: number; lon: number; thumb: string }`.
- Anonymous CORS; token is a public client token (safe in the bundle), gated by
  env so it is never committed.

### `src/components/MapillaryViewer.tsx`
- Thin wrapper owning the `mapillary-js` `Viewer` lifecycle: construct on
  `{ imageId, accessToken }`, `moveTo` on id change, `remove()` on unmount.
- New runtime dependency **`mapillary-js`** added to `package.json`; its CSS is
  imported here.
- Props: `imageId`, plus a container that fills the panel (drag to look, use
  the viewer's built-in arrows to step to adjacent images — all free).

### `src/games/MapDropStreetView.tsx`
Self-contained 5-round game, structured like `MapTapEasy` (owns its own
`api.finish` + `recordFlagshipRound`, renders the same difficulty tablist via
`difficulties`/`difficulty`/`onPick` props).

- **Round set:** a seeded shuffle (`rngFor([api.seed, "streetview"])`) of the
  street-capable pool — `MAP_DROP_PHOTO_PUZZLES` in solo/daily,
  `MAP_DROP_VERIFIED_PHOTO_PUZZLES` under versus. Rounds resolve **lazily**:
  for each round, walk the seeded order and call `findStreetImage` on the next
  candidate, **skipping** candidates with no coverage, until one resolves.
  Because the order is seed-deterministic, Daily and Versus stay consistent
  across players/dates (given Mapillary coverage, which is treated as stable).
- **Per round:** show the pannable panorama (no place name), player drops a pin
  on `GlobeCanvas`, confirms. Reveal the answer arc, then advance.
- **Scoring:** 5 rounds, per-round ceiling **`ROUND_CEILING = 1000`**. Distance
  factor reuses Map Drop's existing curve — full inside `BULLSEYE_KM` (25 km),
  fading to `MIN_FACTOR` (0.1) at `FADE_KM` (1500 km), 0 beyond. Round score =
  `round(1000 × factor)`. **Total max = 5000** (`MODERATE_MAX_SCORE`), the
  hardest ceiling in the game since it offers imagery only, no hints.
- **Finish:** `api.finish({ score, max: 5000, perfect: score === 5000, label,
  share })` and, when not versus, `recordFlagshipRound("map-drop", api.mode,
  { score, max: 5000, won: total ≥ 3000, perfect, hintsUsed: 0, puzzleId })`.
  (`won` threshold and share lines mirror the other modes' spirit; `puzzleId`
  is the final round's place.)

## 3. Coverage & no-token fallbacks (never fabricate imagery)

- **No token** (`VITE_MAPILLARY_TOKEN` empty): the Moderate game renders a clear
  card — "Street view needs a Mapillary access token — see README" — with the
  difficulty tabs still available so the player can switch away. The round does
  not start. No placeholder/stock imagery is shown.
- **Token, but a candidate has no imagery nearby:** that candidate is skipped
  during lazy resolution (§2). If the seeded pool is exhausted before 5 rounds
  fill (rare), the game finishes early with the rounds it did complete and a
  short note, rather than repeating or inventing locations.
- **Transient API failure:** a Retry affordance re-attempts the current round's
  resolution (same pattern as the photo mode's "Retry photos").

## 4. Configuration & docs

- `.env.example` gains:
  ```
  # Optional: Mapillary street-level imagery for Map Drop → Moderate (GeoGuessr).
  # Free client token from https://www.mapillary.com/dashboard/developers
  # (register an app → Client Token). Leave blank to disable Moderate street view.
  VITE_MAPILLARY_TOKEN=
  ```
- README setup section documents registering a free Mapillary app and pasting
  the client token into `.env.local`. The account/app registration is a manual
  human step — it cannot be automated here.

## 5. Out of scope

- No changes to Novice or Hard, the shared `Mode`/`GameApi` types, `GameShell`,
  or other games.
- No deletion of the retired `MapTapEasy.tsx` / `easyMode.ts` / easy-hint data
  files (kept unreferenced; a follow-up can remove them).
- No curated "street-verified" puzzle pool yet — the existing photo-capable
  pools are reused; a verified street pool is a possible later refinement.
- No offline/mock Mapillary layer — without a token, Moderate is disabled, not
  faked.

## 6. Verification

- `npx tsc -b` and `npm run lint` pass from inside `quiet-arcade`
  (pre-existing oxlint warnings excepted).
- Live browser (dev server):
  - **Easy** now shows the photo round: five distinct photos fetch, ceiling
    drops 4000 → 3850 → … per revealed photo, drop scores by distance, result
    stats and share text read "Easy".
  - **Moderate** with no token shows the "needs a token" card and the tabs still
    switch. With a token supplied, a panorama loads and pans, dropping a pin
    scores by distance, and five rounds accumulate toward a 5000 max.
  - The old globe-tap Easy no longer appears.
```
