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

const ACCESS_TOKEN =
  (import.meta.env.VITE_MAPILLARY_TOKEN as string | undefined)?.trim() ?? "";

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
          answer={
            phase === "result" && current
              ? { lat: current.place.lat, lon: current.place.lon }
              : null
          }
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
