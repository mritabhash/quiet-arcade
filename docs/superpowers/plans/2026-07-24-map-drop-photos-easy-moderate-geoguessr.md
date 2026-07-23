# Map Drop — Photos→Easy & Moderate GeoGuessr Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move Map Drop's Wikimedia photo round from the Moderate tab to the Easy tab (retiring the globe-tap Easy), and build a new 5-round Mapillary GeoGuessr street-view game in the Moderate tab.

**Architecture:** `MapDrop.tsx` keeps owning Novice (text hints), Easy (photo clues — rebound from the old Moderate machinery), and Hard (7 hints); it delegates Moderate to a new self-contained `MapDropStreetView` component, exactly as it used to delegate Easy to `MapTapEasy`. Street imagery comes from a token-gated `mapillary.ts` helper feeding a `mapillary-js` viewer wrapper. No token ⇒ Moderate is cleanly disabled, never faked.

**Tech Stack:** React 19, TypeScript, Vite 8, framer-motion, existing `GlobeCanvas`/`LazyGlobeCanvas`, new runtime dep `mapillary-js`, Mapillary Graph API. Tests: `node --test` on `.ts` (native type-stripping), matching `tests/placeImages.test.ts`.

## Global Constraints

- Env var name is exactly `VITE_MAPILLARY_TOKEN`, read via `import.meta.env.VITE_MAPILLARY_TOKEN as string | undefined` (same cast style as `src/lib/supabaseClient.ts`). Empty/absent ⇒ feature disabled.
- Never render placeholder/stock imagery when a token or coverage is missing — show a disabled card with a Retry and keep the difficulty tabs usable.
- Daily/Versus must stay deterministic: the round set is a seeded shuffle (`rngFor([api.seed, "streetview"])`) and the chosen image is the one nearest the fixed place coordinate.
- Distance-score curve is shared and unchanged: full inside `BULLSEYE_KM = 25`, fading to `MIN_FACTOR = 0.1` at `FADE_KM = 1500`, `0` beyond.
- Moderate scoring: 5 rounds × `ROUND_CEILING = 1000` = `MODERATE_MAX_SCORE = 5000`.
- Easy (photo) values unchanged from the old Moderate: `EASY_PHOTO_MAX_SCORE = 4000`, `EASY_PHOTO_IMG_COST = 150`, `EASY_PHOTO_MAX_IMAGES = 5`, `EASY_PHOTO_MIN_IMAGES = 5`.
- `mapillary-js` version: pin `^4.1.2`.
- Verify each code task with `npx tsc -b` and `npm run lint` run from inside `quiet-arcade/` (pre-existing oxlint warnings excepted).
- Retired files stay on disk unreferenced: `src/games/MapTapEasy.tsx`, `src/lib/easyMode.ts`, and the flag/language/facts data files. Do NOT delete them.

---

### Task 1: Mapillary helper library (`mapillary.ts`)

**Files:**
- Create: `src/lib/mapillary.ts`
- Test: `tests/mapillary.test.ts`
- Modify: `package.json:13` (add the test file to the `test` script)

**Interfaces:**
- Consumes: nothing (self-contained; local haversine so the node test needn't import gazetteer data — mirrors `placeImages.ts`).
- Produces:
  - `interface StreetImage { id: string; lat: number; lon: number }`
  - `interface StreetPlaceLike { name: string; lat: number; lon: number }`
  - `function isMapillaryConfigured(): boolean`
  - `function bboxAround(lat: number, lon: number, halfDeg?: number): [number, number, number, number]` → `[minLon, minLat, maxLon, maxLat]`
  - `function nearestImage(place: { lat: number; lon: number }, images: StreetImage[], maxKm?: number): StreetImage | null`
  - `async function findStreetImage(place: StreetPlaceLike, signal?: AbortSignal): Promise<StreetImage | null>`

- [ ] **Step 1: Write the failing test**

Create `tests/mapillary.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";

import { bboxAround, nearestImage, type StreetImage } from "../src/lib/mapillary.ts";

test("bboxAround returns [minLon, minLat, maxLon, maxLat] in order", () => {
  const [minLon, minLat, maxLon, maxLat] = bboxAround(48.0, 2.0, 0.004);
  assert.ok(minLon < maxLon && minLat < maxLat);
  assert.equal(Math.round(minLon * 1000) / 1000, 1.996);
  assert.equal(Math.round(maxLon * 1000) / 1000, 2.004);
  assert.equal(Math.round(minLat * 1000) / 1000, 47.996);
  assert.equal(Math.round(maxLat * 1000) / 1000, 48.004);
});

test("nearestImage picks the closest image within the radius", () => {
  const place = { lat: 48.8584, lon: 2.2945 }; // Eiffel Tower
  const imgs: StreetImage[] = [
    { id: "far", lat: 48.87, lon: 2.31 },
    { id: "near", lat: 48.8585, lon: 2.2946 },
  ];
  assert.equal(nearestImage(place, imgs)?.id, "near");
});

test("nearestImage returns null when nothing is within maxKm", () => {
  const place = { lat: 0, lon: 0 };
  const imgs: StreetImage[] = [{ id: "a", lat: 10, lon: 10 }];
  assert.equal(nearestImage(place, imgs, 0.4), null);
});

test("nearestImage returns null for an empty list", () => {
  assert.equal(nearestImage({ lat: 1, lon: 1 }, []), null);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd quiet-arcade && node --test tests/mapillary.test.ts`
Expected: FAIL — cannot resolve `../src/lib/mapillary.ts`.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/mapillary.ts`:

```ts
/**
 * Mapillary street-level imagery for Map Drop → Moderate (GeoGuessr).
 *
 * Token-gated: reads a public client token from VITE_MAPILLARY_TOKEN. With no
 * token the feature reports itself unconfigured and the Moderate game shows a
 * disabled card instead of any imagery. Uses the anonymous Graph API; a local
 * haversine keeps this module import-light for the node test runner.
 */

const GRAPH = "https://graph.mapillary.com/images";
/** ~0.004° ≈ 400 m half-box around the place coordinate. */
const DEFAULT_HALF_DEG = 0.004;
/** An image counts as "at" the place only within this radius. */
const MAX_MATCH_KM = 0.4;
const RESULT_LIMIT = 50;

export interface StreetImage {
  id: string;
  lat: number;
  lon: number;
}

export interface StreetPlaceLike {
  name: string;
  lat: number;
  lon: number;
}

function token(): string {
  return (import.meta.env.VITE_MAPILLARY_TOKEN as string | undefined)?.trim() ?? "";
}

export function isMapillaryConfigured(): boolean {
  return token().length > 0;
}

export function bboxAround(
  lat: number,
  lon: number,
  halfDeg: number = DEFAULT_HALF_DEG,
): [number, number, number, number] {
  return [lon - halfDeg, lat - halfDeg, lon + halfDeg, lat + halfDeg];
}

function haversineKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const rad = Math.PI / 180;
  const dLat = (bLat - aLat) * rad;
  const dLon = (bLon - aLon) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(aLat * rad) * Math.cos(bLat * rad) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function nearestImage(
  place: { lat: number; lon: number },
  images: StreetImage[],
  maxKm: number = MAX_MATCH_KM,
): StreetImage | null {
  let best: StreetImage | null = null;
  let bestKm = Infinity;
  for (const img of images) {
    const d = haversineKm(place.lat, place.lon, img.lat, img.lon);
    if (d < bestKm) {
      bestKm = d;
      best = img;
    }
  }
  return best && bestKm <= maxKm ? best : null;
}

/**
 * The Mapillary image nearest the place, or null when the token is missing,
 * the request fails, or no imagery lies within MAX_MATCH_KM (no coverage).
 */
export async function findStreetImage(
  place: StreetPlaceLike,
  signal?: AbortSignal,
): Promise<StreetImage | null> {
  const key = token();
  if (!key) return null;
  const [minLon, minLat, maxLon, maxLat] = bboxAround(place.lat, place.lon);
  const url = new URL(GRAPH);
  url.search = new URLSearchParams({
    access_token: key,
    fields: "id,computed_geometry",
    bbox: `${minLon},${minLat},${maxLon},${maxLat}`,
    limit: String(RESULT_LIMIT),
  }).toString();
  try {
    const res = await fetch(url.toString(), { signal });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      data?: { id: string; computed_geometry?: { coordinates?: [number, number] } }[];
    };
    const images: StreetImage[] = (json.data ?? [])
      .map((d) => {
        const c = d.computed_geometry?.coordinates;
        return c ? { id: d.id, lat: c[1], lon: c[0] } : null;
      })
      .filter((v): v is StreetImage => v !== null);
    return nearestImage(place, images);
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Add the test to the npm test script**

In `package.json`, append the new file to the existing `test` script (line 13):

```json
    "test": "node --test tests/placeImages.test.ts tests/globeTextureQuality.test.ts tests/cave/quality.test.ts tests/cave/fallback.test.ts tests/cave/rigMath.test.ts tests/cave/audioGate.test.ts tests/cave/assetManifest.test.ts tests/cave/rigMath.test.ts tests/mapillary.test.ts",
```

(Keep the pre-existing entries exactly as they are; only add `tests/mapillary.test.ts` at the end. Do not duplicate entries already present.)

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd quiet-arcade && node --test tests/mapillary.test.ts`
Expected: PASS (4 tests). Then `npx tsc -b` and `npm run lint` — clean.

Note: `import.meta.env` under `node --test` is undefined, but the tests exercise only `bboxAround`/`nearestImage`, which never touch it. Do not add a token-reading test to the node suite.

- [ ] **Step 6: Commit**

```bash
git add src/lib/mapillary.ts tests/mapillary.test.ts package.json
git commit -m "feat(map-drop): add token-gated Mapillary image helper"
```

---

### Task 2: Mapillary viewer wrapper component

**Files:**
- Create: `src/components/MapillaryViewer.tsx`
- Modify: `package.json:16-30` (add `"mapillary-js": "^4.1.2"` to dependencies)

**Interfaces:**
- Consumes: `mapillary-js` `Viewer`; `VITE_MAPILLARY_TOKEN` via a passed `accessToken` prop.
- Produces: `function MapillaryViewer(props: { imageId: string; accessToken: string; className?: string }): JSX.Element`

- [ ] **Step 1: Install the dependency**

Run: `cd quiet-arcade && npm install mapillary-js@^4.1.2`
Expected: `package.json` dependencies now include `mapillary-js`, lockfile updated.

- [ ] **Step 2: Write the component**

Create `src/components/MapillaryViewer.tsx`:

```tsx
import { useEffect, useRef } from "react";
import { Viewer } from "mapillary-js";
import "mapillary-js/dist/mapillary.css";

/**
 * Owns a single mapillary-js Viewer instance. Drag to look around; the viewer's
 * built-in arrows step to adjacent street images. Rebuilds when the image id or
 * token changes and disposes on unmount to avoid leaking WebGL contexts.
 */
export function MapillaryViewer({
  imageId,
  accessToken,
  className,
}: {
  imageId: string;
  accessToken: string;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<Viewer | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const viewer = new Viewer({
      accessToken,
      container: containerRef.current,
      imageId,
      component: { cover: false },
    });
    viewerRef.current = viewer;
    return () => {
      viewer.remove();
      viewerRef.current = null;
    };
  }, [accessToken]);

  useEffect(() => {
    viewerRef.current?.moveTo(imageId).catch(() => {
      /* image unavailable; the game resolves a different round */
    });
  }, [imageId]);

  return <div ref={containerRef} className={className} />;
}
```

- [ ] **Step 3: Verify it type-checks and builds**

Run: `cd quiet-arcade && npx tsc -b && npm run lint`
Expected: clean. (No unit test — this is a thin lifecycle wrapper verified by type-check/build and the live browser check in Task 5.)

- [ ] **Step 4: Commit**

```bash
git add src/components/MapillaryViewer.tsx package.json package-lock.json
git commit -m "feat(map-drop): add mapillary-js viewer wrapper"
```

---

### Task 3: Moderate GeoGuessr game component (`MapDropStreetView.tsx`)

**Files:**
- Create: `src/games/MapDropStreetView.tsx`

**Interfaces:**
- Consumes: `GameApi` (`../types`), `rngFor` (`../lib/random`), `distanceKm` (`../data/cities`), `MAP_DROP_PHOTO_PUZZLES`/`MAP_DROP_VERIFIED_PHOTO_PUZZLES` (`../data/mapDropPuzzles`), `LazyGlobeCanvas` (`../components/LazyGlobeCanvas`), `MapillaryViewer` (Task 2), `isMapillaryConfigured`/`findStreetImage`/`StreetImage` (Task 1), `recordFlagshipRound` (`../lib/repo`), `Button` (`../components/ui`).
- Produces: `function MapDropStreetView(props: { api: GameApi; difficulties: readonly string[]; difficulty: string; onPick: (d: string) => void }): JSX.Element`

- [ ] **Step 1: Write the component**

Create `src/games/MapDropStreetView.tsx`:

```tsx
import { useEffect, useMemo, useRef, useState } from "react";
import type { GameApi } from "../types";
import { rngFor } from "../lib/random";
import { distanceKm } from "../data/cities";
import {
  MAP_DROP_PHOTO_PUZZLES,
  MAP_DROP_VERIFIED_PHOTO_PUZZLES,
  type MapDropPuzzle,
} from "../data/mapDropPuzzles";
import { LazyGlobeCanvas as GlobeCanvas } from "../components/LazyGlobeCanvas";
import type { LatLon } from "../components/GlobeCanvas";
import { MapillaryViewer } from "../components/MapillaryViewer";
import {
  findStreetImage,
  isMapillaryConfigured,
  type StreetImage,
} from "../lib/mapillary";
import { recordFlagshipRound } from "../lib/repo";
import { Button } from "../components/ui";

/**
 * Map Drop — Moderate: a GeoGuessr-style street-view round on Mapillary.
 * Five places, one pannable panorama each, drop a pin per round. Distance is
 * scored on Map Drop's shared curve against a 1,000-pt-per-round ceiling
 * (5,000 max). No token or no coverage → a disabled card, never faked imagery.
 */

const ROUNDS = 5;
const ROUND_CEILING = 1000;
const MODERATE_MAX_SCORE = ROUND_CEILING * ROUNDS; // 5000
const BULLSEYE_KM = 25;
const FADE_KM = 1500;
const MIN_FACTOR = 0.1;
const MATCH_KM = 800; // "right neighbourhood" band for the win tally

const ACCESS_TOKEN = (import.meta.env.VITE_MAPILLARY_TOKEN as string | undefined)?.trim() ?? "";

type Resolved = { place: MapDropPuzzle; image: StreetImage };
type RoundResult = { dist: number; points: number };
type Phase = "loading" | "playing" | "result" | "unavailable" | "exhausted";

function scoreForDistance(dist: number): number {
  const factor =
    dist <= BULLSEYE_KM ? 1 : dist < FADE_KM ? Math.max(MIN_FACTOR, 1 - dist / FADE_KM) : 0;
  return Math.round(ROUND_CEILING * factor);
}

function snark(dist: number): string {
  if (dist <= 25) return "Dead on. The council gasps.";
  if (dist <= 200) return "Practically standing there.";
  if (dist <= MATCH_KM) return "Right region. Sharp reading.";
  if (dist <= 2500) return "Right corner of the world.";
  if (dist <= 6000) return "Wrong continent, bestie.";
  return "That pin went sightseeing.";
}

export function MapDropStreetView({
  api,
  difficulties,
  difficulty,
  onPick,
}: {
  api: GameApi;
  difficulties: readonly string[];
  difficulty: string;
  onPick: (d: string) => void;
}) {
  const pool = useMemo<MapDropPuzzle[]>(() => {
    const base = api.versus ? MAP_DROP_VERIFIED_PHOTO_PUZZLES : MAP_DROP_PHOTO_PUZZLES;
    const rng = rngFor([api.seed, "streetview"]);
    const idx = base.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    return idx.map((i) => base[i]);
  }, [api.seed, api.versus]);

  const cursor = useRef(0);
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState<Phase>(
    isMapillaryConfigured() ? "loading" : "unavailable",
  );
  const [current, setCurrent] = useState<Resolved | null>(null);
  const [guess, setGuess] = useState<LatLon | null>(null);
  const [result, setResult] = useState<RoundResult | null>(null);
  const [total, setTotal] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const resultsRef = useRef<RoundResult[]>([]);

  // Resolve the next covered place for this round, skipping places Mapillary
  // has no imagery for. Runs on round change and on manual Retry.
  useEffect(() => {
    if (!isMapillaryConfigured()) return;
    let cancelled = false;
    const ctrl = new AbortController();
    setPhase("loading");
    setCurrent(null);
    setGuess(null);
    setResult(null);
    (async () => {
      while (cursor.current < pool.length) {
        const place = pool[cursor.current];
        cursor.current += 1;
        try {
          const image = await findStreetImage(place, ctrl.signal);
          if (cancelled) return;
          if (image) {
            setCurrent({ place, image });
            setPhase("playing");
            return;
          }
        } catch {
          if (cancelled) return;
        }
      }
      if (!cancelled) setPhase(round === 0 ? "unavailable" : "exhausted");
    })();
    return () => {
      cancelled = true;
      ctrl.abort();
    };
  }, [round, attempt, pool]);

  const handleTap = (lat: number, lon: number) => {
    if (phase !== "playing" || !current) return;
    const dist = Math.round(distanceKm(lat, lon, current.place.lat, current.place.lon));
    const r: RoundResult = { dist, points: scoreForDistance(dist) };
    resultsRef.current[round] = r;
    setGuess({ lat, lon });
    setResult(r);
    setPhase("result");
    setTotal((t) => t + r.points);
    api.versus?.onProgress({ role: api.versus.role, score: total + r.points, step: round });
  };

  const finish = (score: number) => {
    const within = resultsRef.current.filter((r) => r && r.dist <= MATCH_KM).length;
    if (!api.versus) {
      recordFlagshipRound("map-drop", api.mode, {
        score,
        max: MODERATE_MAX_SCORE,
        won: score >= 3000,
        perfect: score === MODERATE_MAX_SCORE,
        hintsUsed: 0,
        puzzleId: current?.place.id ?? "street-view",
      });
    }
    api.finish({
      score,
      max: MODERATE_MAX_SCORE,
      perfect: score === MODERATE_MAX_SCORE,
      label: `Street view — ${within}/${ROUNDS} within ${MATCH_KM} km, ${score}/${MODERATE_MAX_SCORE} pts.`,
      share: [
        "Quiet Arcade: Map Drop",
        `Score: ${score.toLocaleString()}/${MODERATE_MAX_SCORE.toLocaleString()}`,
        "Difficulty: Moderate (Street View)",
        `Rounds nailed: ${within}/${ROUNDS}`,
        `Mode: ${api.mode === "daily" ? "Daily" : "Free Play"}`,
      ],
    });
  };

  const next = () => {
    if (round + 1 >= ROUNDS) {
      finish(total);
      return;
    }
    setRound((n) => n + 1);
  };

  const Tabs = api.versus ? (
    <div />
  ) : (
    <div
      className="flex rounded-xl border border-[var(--line)] bg-[var(--card)] p-1"
      role="tablist"
      aria-label="Map Drop mode"
    >
      {difficulties.map((d) => (
        <button
          key={d}
          role="tab"
          aria-selected={difficulty === d}
          onClick={() => onPick(d)}
          className={`rounded-lg px-3 py-1 text-xs font-semibold capitalize transition-colors ${
            difficulty === d
              ? "bg-[var(--card-2)] text-[var(--ink)]"
              : "qa-muted hover:text-[var(--ink)]"
          }`}
        >
          {d}
        </button>
      ))}
    </div>
  );

  if (phase === "unavailable" || phase === "exhausted") {
    const noToken = !isMapillaryConfigured();
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {Tabs}
          <p className="text-xs qa-muted">Moderate · Street View</p>
        </div>
        <div className="qa-card flex flex-col items-start gap-3 rounded-2xl px-4 py-4" role="alert">
          <p className="text-sm font-semibold">
            {noToken ? "Street view needs a Mapillary token" : "No street coverage nearby"}
          </p>
          <p className="text-xs leading-snug qa-muted">
            {noToken
              ? "Add a free Mapillary client token as VITE_MAPILLARY_TOKEN in .env.local (see README), then reload to play Moderate. Or switch to another difficulty above."
              : "Mapillary had no imagery for the remaining places this round. Retry, or switch difficulty."}
          </p>
          {!noToken && (
            <Button
              variant="secondary"
              className="px-4 py-1.5 text-sm"
              onClick={() => {
                if (phase === "exhausted") finish(total);
                else setAttempt((a) => a + 1);
              }}
            >
              {phase === "exhausted" ? "Bank the score" : "Retry"}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {Tabs}
        <div className="text-right">
          <p className="font-display text-3xl font-semibold tabular-nums tracking-wider">
            {total.toString().padStart(4, "0")}
          </p>
          <p className="text-xs qa-muted">
            Round {round + 1} of {ROUNDS} · Moderate
          </p>
        </div>
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-widest qa-muted">
          {phase === "result" ? "The answer" : "Where is this street?"}
        </p>
        <h2 className="mt-1 font-display text-2xl font-semibold" aria-live="polite">
          {phase === "result" && current
            ? `${current.place.name}, ${current.place.country}`
            : "Look around, then drop your pin"}
        </h2>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-[var(--line)] bg-[#0b2731]">
        {phase === "loading" || !current ? (
          <div className="flex h-[380px] w-full items-center justify-center sm:h-[440px]">
            <p className="animate-pulse text-sm qa-muted">Finding a street with coverage…</p>
          </div>
        ) : (
          <MapillaryViewer
            imageId={current.image.id}
            accessToken={ACCESS_TOKEN}
            className="h-[380px] w-full sm:h-[440px]"
          />
        )}
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-[var(--line)] bg-[#0b2731]">
        <GlobeCanvas
          className="h-[300px] w-full sm:h-[340px]"
          interactive={phase === "playing"}
          ariaLabel="Interactive globe. Drag or use arrow keys to aim the centre reticle, then tap or press Enter to drop your guess for where this street is."
          onTap={handleTap}
          guess={guess}
          answer={phase === "result" && current ? { lat: current.place.lat, lon: current.place.lon } : null}
          showArc={phase === "result"}
        />
        {phase === "playing" && (
          <p className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-4 py-3 text-center text-sm font-medium text-sand-50">
            Drag or arrow-key to spin · scroll or pinch to zoom · tap or Enter to drop
          </p>
        )}
      </div>

      {phase === "result" && result && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Distance" value={`${result.dist.toLocaleString()} km`} />
            <Stat label="Round score" value={`+${result.points}`} />
            <Stat label="Total" value={`${total.toLocaleString()} / ${MODERATE_MAX_SCORE}`} />
          </div>
          <p className="text-sm qa-muted" aria-live="polite">
            {snark(result.dist)}
          </p>
          <Button onClick={next}>
            {round + 1 >= ROUNDS ? "Finish · bank the score" : "Next round"}
          </Button>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="qa-card rounded-2xl px-3 py-2.5">
      <p className="text-[10px] font-bold uppercase tracking-widest qa-muted">{label}</p>
      <p className="mt-0.5 font-display text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}
```

- [ ] **Step 2: Confirm the imported names exist**

Verify these are real exports before relying on them:
- `MAP_DROP_VERIFIED_PHOTO_PUZZLES` and `MapDropPuzzle` from `src/data/mapDropPuzzles.ts`.
- `LatLon` from `src/components/GlobeCanvas.tsx` (used by `MapTapEasy.tsx` — same import).
- `recordFlagshipRound` signature in `src/lib/repo.ts` matches `{ score, max, won, perfect, hintsUsed, puzzleId }` (as called in `MapDrop.tsx:277-284`).
- `Button` accepts `variant="secondary"` and `className` (as used in `MapDrop.tsx`).

Run: `cd quiet-arcade && npx tsc -b`
Expected: clean. Fix any import-name mismatch by matching the real export.

- [ ] **Step 3: Lint**

Run: `cd quiet-arcade && npm run lint`
Expected: clean (pre-existing warnings excepted).

- [ ] **Step 4: Commit**

```bash
git add src/games/MapDropStreetView.tsx
git commit -m "feat(map-drop): add 5-round Mapillary street-view Moderate game"
```

---

### Task 4: Rewire `MapDrop.tsx` — photos become Easy, Moderate delegates to street view

**Files:**
- Modify: `src/games/MapDrop.tsx`

**Interfaces:**
- Consumes: `MapDropStreetView` (Task 3).
- Produces: no new exports; behaviour change only.

All edits are in `src/games/MapDrop.tsx`. Apply them in order.

- [ ] **Step 1: Swap imports**

Remove:
```tsx
import { easyFreeHintsFor } from "../lib/easyMode";
import { MapTapEasy } from "./MapTapEasy";
```
Add (near the other `./` game/component imports):
```tsx
import { MapDropStreetView } from "./MapDropStreetView";
```

- [ ] **Step 2: Rename the photo constants and drop the text-easy constants**

Replace the Moderate + Easy constant block (currently lines 26-41) with:
```tsx
/** Easy mode: a photo round. One geotagged picture opens at the ceiling;
 *  each extra photo (up to five) costs a flat fee. */
const EASY_PHOTO_MAX_SCORE = 4000;
const EASY_PHOTO_IMG_COST = 150;
const EASY_PHOTO_MAX_IMAGES = 5;
// Easy promises five separate photo clues; an incomplete/diversity-thin
// result blocks the round and offers a retry instead of counting repeats.
const EASY_PHOTO_MIN_IMAGES = EASY_PHOTO_MAX_IMAGES;
/** Novice mode: the answer's name is free; one pricey reveal says where it sits. */
const NOVICE_MAX_SCORE = 5000;
const NOVICE_HINT_COST = 2000;
const NOVICE_TOTAL_HINTS = 2;
```
(This deletes `MODERATE_*`, `EASY_MAX_SCORE`, `EASY_HINT_COST`, `EASY_TOTAL_HINTS`. `HINT_POINTS`/`MAX_SCORE` above and `DIFFICULTY_KEY`/`DIFFICULTIES` below are unchanged.)

- [ ] **Step 3: Rebind the puzzle pool from Moderate to Easy**

Replace the `puzzlePool` assignment (currently lines 104-109):
```tsx
  const puzzlePool =
    api.versus && initialDifficulty === "easy"
      ? MAP_DROP_VERIFIED_PHOTO_PUZZLES
      : api.mode === "daily" || initialDifficulty === "easy"
      ? MAP_DROP_PHOTO_PUZZLES
      : MAP_DROP_PUZZLES;
```

- [ ] **Step 4: Remove the text-easy hint resolver and rename photo state to `easyPhoto*`**

Delete this line (currently 122):
```tsx
  const easyFree = useMemo(() => easyFreeHintsFor(place, api.seed), [place, api.seed]);
```
Replace the derived photo-readiness block (currently lines 131-137) with:
```tsx
  const eff: Difficulty = difficulty; // no more easy→hard fallback; photos/street are their own paths
  const photoReady =
    difficulty === "easy" && images?.length === EASY_PHOTO_MAX_IMAGES;
  const photoLoading = difficulty === "easy" && !imagesFailed && images === null;
  const photoUnavailable = difficulty === "easy" && imagesFailed;
  const roundReady = difficulty !== "easy" || photoReady;
```

- [ ] **Step 5: Rebind the photo-fetch effect to Easy**

In the fetch effect (currently lines 165-184): change the guard `if (difficulty !== "moderate") return;` to `if (difficulty !== "easy") return;`, and swap `MODERATE_MAX_IMAGES`→`EASY_PHOTO_MAX_IMAGES` and `MODERATE_MIN_IMAGES`→`EASY_PHOTO_MIN_IMAGES`.

- [ ] **Step 6: Rewrite the derived hint/ceiling/max values**

Replace the `totalHints`/`hints`/`ceiling`/`maxScore` block (currently lines 187-215) with:
```tsx
  const totalHints =
    difficulty === "hard"
      ? 7
      : difficulty === "novice"
        ? NOVICE_TOTAL_HINTS
        : imageCount; // easy reveals the geotagged photos one by one
  const hints =
    difficulty === "novice"
      ? [
          place.kind === "mountains"
            ? `The mountains are called ${place.name}.`
            : `The ${place.kind}'s name is ${place.name}.`,
          `You'll find it in ${place.country}.`,
        ]
      : place.hints; // hard
  const ceiling =
    difficulty === "novice"
      ? NOVICE_MAX_SCORE - (revealed - 1) * NOVICE_HINT_COST
      : difficulty === "easy"
        ? EASY_PHOTO_MAX_SCORE - (revealed - 1) * EASY_PHOTO_IMG_COST
        : HINT_POINTS[revealed - 1];
  const maxScore = difficulty === "easy" ? EASY_PHOTO_MAX_SCORE : MAX_SCORE;
```
(`imageCount` on line 186 stays. `eff` is now defined in Step 4; keep any remaining `eff === "novice"` reads working — they still resolve correctly since `eff === difficulty`.)

- [ ] **Step 7: Replace the Easy delegation with a Moderate delegation**

Replace the block (currently lines 302-312):
```tsx
  // Moderate mode is the GeoGuessr street-view game: five rounds, Mapillary.
  if (difficulty === "moderate") {
    return (
      <MapDropStreetView
        api={api}
        difficulties={DIFFICULTIES}
        difficulty={difficulty}
        onPick={(d) => switchDifficulty(d as Difficulty)}
      />
    );
  }
```

- [ ] **Step 8: Rename `moderate*` UI reads to `photo*`**

In the play/JSX below, update the remaining references from the old Moderate names to the Step-4 names, keeping all surrounding markup:
- `moderateLoading` → `photoLoading`
- `moderateUnavailable` → `photoUnavailable`
- `moderateReady` → `photoReady`
- In the reveal-cost copy (currently lines 549-555), delete the `eff === "novice"`/`eff === "easy"` text-hint branches and keep three cases: `eff === "hard"` (HINT_POINTS), `eff === "novice"` (NOVICE), and the `else` photo case using `EASY_PHOTO_IMG_COST` and `EASY_PHOTO_MAX_SCORE`:
```tsx
                  {eff === "hard"
                    ? `Lowers your ceiling to ${HINT_POINTS[revealed].toLocaleString()} pts`
                    : eff === "novice"
                      ? `Costs ${NOVICE_HINT_COST.toLocaleString()} points — ceiling drops to ${(NOVICE_MAX_SCORE - revealed * NOVICE_HINT_COST).toLocaleString()} pts`
                      : `Costs ${EASY_PHOTO_IMG_COST} points — ceiling drops to ${(EASY_PHOTO_MAX_SCORE - revealed * EASY_PHOTO_IMG_COST).toLocaleString()} pts`}
```
- In the hint-card label block (currently lines 516-527), delete the `eff === "easy"` branch (the `easyFree![i].label` / "Closer look" path); keep `eff === "novice"` and the `else → \`Hint ${i + 1}\`` for hard. The photo path renders the image cards, not this block, so no easy case is needed here.
- Remove the now-unused `delay` easy special-case if present (currently line 512 `i < (eff === "easy" ? 3 : 1)` → `i < 1`).

- [ ] **Step 9: Type-check and lint**

Run: `cd quiet-arcade && npx tsc -b && npm run lint`
Expected: clean. tsc will flag any missed `moderate*`/`easyFree`/`EASY_MAX_SCORE` reference — fix each by the mapping above until green.

- [ ] **Step 10: Commit**

```bash
git add src/games/MapDrop.tsx
git commit -m "refactor(map-drop): move photo round to Easy, delegate Moderate to street view"
```

---

### Task 5: Config, docs, and live verification

**Files:**
- Modify: `.env.example`
- Modify: `README.md` (the repo's setup/env section)

- [ ] **Step 1: Document the env var**

Append to `.env.example`:
```
# Optional: Mapillary street-level imagery for Map Drop → Moderate (GeoGuessr).
# Free client token from https://www.mapillary.com/dashboard/developers
# (register an app → Client Token). Leave blank to disable Moderate street view.
VITE_MAPILLARY_TOKEN=
```

- [ ] **Step 2: Add README setup notes**

Find the env/setup section of `README.md` (search for `VITE_SUPABASE` or "Environment"). Add a short subsection:
```markdown
### Map Drop street view (optional)

Map Drop's **Moderate** difficulty is a GeoGuessr-style round using
[Mapillary](https://www.mapillary.com/) street imagery. To enable it:

1. Create a free Mapillary account and register an app at
   <https://www.mapillary.com/dashboard/developers>.
2. Copy the app's **Client Token**.
3. Put it in `.env.local` as `VITE_MAPILLARY_TOKEN=...` and restart `npm run dev`.

Without a token, Moderate shows a disabled card and the other difficulties work
normally.
```
(If `README.md` does not exist, create it with just this section under an `## Environment` heading.)

- [ ] **Step 3: Run the full test + build gate**

Run: `cd quiet-arcade && npm test && npx tsc -b && npm run lint`
Expected: all pass (pre-existing oxlint warnings excepted).

- [ ] **Step 4: Live browser verification**

Start the dev server (via the preview tooling, not a raw shell) and check:
- **Easy tab**: five distinct photos load; header shows "4,000 pts possible" then drops by 150 per revealed photo; dropping a pin scores by distance; result stats/share read "Easy"; the old globe-tap Easy is gone.
- **Moderate tab, no token** (`.env.local` without `VITE_MAPILLARY_TOKEN`): the "needs a Mapillary token" card shows and the difficulty tabs still switch.
- **Moderate tab, with a token** (if available): a panorama loads and pans; dropping a pin reveals the answer arc and scores by distance; five rounds accumulate toward 5,000. (If no token is available this session, note it and rely on the code path + the no-token check.)
- **Novice / Hard**: unchanged.

- [ ] **Step 5: Commit**

```bash
git add .env.example README.md
git commit -m "docs(map-drop): document VITE_MAPILLARY_TOKEN setup"
```

---

## Self-Review

**Spec coverage:**
- Spec §1 (photos→Easy, retire globe-tap, rename constants, delete text-easy code, delegate Moderate) → Task 4 (all steps) + Task 3 (the delegate target). ✓
- Spec §2 (`mapillary.ts`, `MapillaryViewer.tsx`, `MapDropStreetView.tsx`, 5 rounds, seeded pool, lazy resolve, 1000/round → 5000, own finish/recordFlagshipRound) → Tasks 1, 2, 3. ✓
- Spec §3 (no-token card, skip-no-coverage, exhausted→finish early, Retry) → Task 3 (`unavailable`/`exhausted` phases, resolve loop, Retry) + Task 1 (`findStreetImage` returns null). ✓
- Spec §4 (`.env.example`, README) → Task 5. ✓
- Spec §5 (out of scope: keep retired files, no street-verified pool, no mock layer) → honored; Global Constraints restate "do not delete retired files". ✓
- Spec §6 (tsc/lint, live checks) → each code task ends with tsc/lint; Task 5 Step 4 is the live sweep. ✓

**Placeholder scan:** No TBD/TODO; all code blocks complete; live-token check explicitly allows "note it and rely on the code path" when no token exists. ✓

**Type consistency:** `StreetImage`/`StreetPlaceLike`/`findStreetImage`/`nearestImage`/`bboxAround`/`isMapillaryConfigured` names match across Tasks 1↔3. `MapillaryViewer({ imageId, accessToken, className })` matches Task 2↔3. `MapDropStreetView({ api, difficulties, difficulty, onPick })` matches Task 3↔4. `recordFlagshipRound` fields match the existing `MapDrop.tsx` call. ✓
```
