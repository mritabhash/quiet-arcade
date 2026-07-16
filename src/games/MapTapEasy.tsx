import { useMemo, useRef, useState } from "react";
import type { GameApi } from "../types";
import { rngFor } from "../lib/random";
import { MAP_DROP_PUZZLES } from "../data/mapDropPuzzles";
import { distanceKm } from "../data/cities";
import { LazyGlobeCanvas as GlobeCanvas } from "../components/LazyGlobeCanvas";
import type { LatLon } from "../components/GlobeCanvas";
import { Button } from "../components/ui";

/**
 * Map Drop — Easy mode, rebuilt to MapTap's mechanics (maptap.gg): five rounds,
 * one tap each on a rotatable 3D globe. Per-round score is 0..80 by proximity
 * with right-country / right-continent floors (approximated by distance bands,
 * since we have no boundary polygons), and later rounds carry a growing
 * multiplier — exactly MapTap's cap 80, floors 25 / 10, and ×1 ×1 ×2 ×3 ×3.
 */

const ROUNDS = 5;
const MULT = [1, 1, 2, 3, 3] as const; // MapTap getRoundScoreMultiplier
const CAP = 80; // MapTap scoreCap
const COUNTRY_FLOOR = 25; // MapTap countryFloor
const CONTINENT_FLOOR = 10; // MapTap continentFloor
const COUNTRY_KM = 800; // distance band standing in for "right country"
const CONTINENT_KM = 2500; // distance band standing in for "right continent"
const DECAY_KM = 700; // proximity falloff for the base curve
const MAX_TOTAL = CAP * MULT.reduce((a, b) => a + b, 0); // 800

type Target = { name: string; country: string; lat: number; lon: number };
type RoundResult = { dist: number; base: number; mult: number; points: number };

/** MapTap-style base score for a guess distance: 0..80 with country/continent floors. */
function scoreForDistance(dist: number): number {
  let base = CAP * Math.exp(-dist / DECAY_KM);
  if (dist <= COUNTRY_KM) base = Math.max(base, COUNTRY_FLOOR);
  else if (dist <= CONTINENT_KM) base = Math.max(base, CONTINENT_FLOOR);
  return Math.min(CAP, Math.round(base));
}

function snark(dist: number): string {
  if (dist <= 25) return "Bullseye. The council is stunned.";
  if (dist <= 200) return "Pinpoint — practically on it.";
  if (dist <= COUNTRY_KM) return "Right country-ish. Nicely read.";
  if (dist <= CONTINENT_KM) return "Right neighbourhood of the world.";
  if (dist <= 6000) return "Wrong continent, bestie.";
  return "That pin went on a journey.";
}

function emoji(frac: number): string {
  if (frac >= 0.95) return "🎯";
  if (frac >= 0.7) return "🌟";
  if (frac >= 0.45) return "🙂";
  if (frac >= 0.2) return "😬";
  return "🧭";
}

export function MapTapEasy({
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
  const targets = useMemo<Target[]>(() => {
    const rng = rngFor([api.seed, "maptap"]);
    const idx = MAP_DROP_PUZZLES.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    return idx.slice(0, ROUNDS).map((i) => {
      const p = MAP_DROP_PUZZLES[i];
      return { name: p.name, country: p.country, lat: p.lat, lon: p.lon };
    });
  }, [api.seed]);

  const [round, setRound] = useState(0);
  const [total, setTotal] = useState(0);
  const [guess, setGuess] = useState<LatLon | null>(null);
  const [result, setResult] = useState<RoundResult | null>(null);
  const resultsRef = useRef<RoundResult[]>([]);

  const target = targets[round];
  const mult = MULT[round];

  const handleTap = (lat: number, lon: number) => {
    if (result) return; // this round is already resolved
    const dist = Math.round(distanceKm(lat, lon, target.lat, target.lon));
    const base = scoreForDistance(dist);
    const r: RoundResult = { dist, base, mult, points: base * mult };
    resultsRef.current[round] = r;
    setGuess({ lat, lon });
    setResult(r);
    setTotal((t) => t + r.points);
  };

  const next = () => {
    if (round + 1 >= ROUNDS) {
      const within = resultsRef.current.filter((r) => r.dist <= COUNTRY_KM).length;
      api.finish({
        score: total,
        max: MAX_TOTAL,
        perfect: total === MAX_TOTAL,
        label: `MapTap globe — ${within}/${ROUNDS} within ${COUNTRY_KM} km, ${total}/${MAX_TOTAL} pts.`,
      });
      return;
    }
    setRound((n) => n + 1);
    setGuess(null);
    setResult(null);
  };

  const scoreStr = total.toString().padStart(3, "0");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
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
        <div className="text-right">
          <p className="font-display text-3xl font-semibold tabular-nums tracking-wider">{scoreStr}</p>
          <p className="text-xs qa-muted">
            Round {round + 1} of {ROUNDS} · ×{mult}
          </p>
        </div>
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-widest qa-muted">
          {result ? "The answer" : "Tap where this is"}
        </p>
        <h2 className="mt-1 font-display text-2xl font-semibold" aria-live="polite">
          {target.name}
          <span className="qa-muted">, {target.country}</span>
        </h2>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-[var(--line)] bg-[#0b2731]">
        <GlobeCanvas
          className="h-[380px] w-full sm:h-[440px]"
          interactive={!result}
          ariaLabel={`Interactive globe. Find ${target.name}, ${target.country}. Drag or use arrow keys to aim the centre reticle, then tap or press Enter to drop your guess. Scroll, pinch, or the plus and minus keys zoom.`}
          onTap={handleTap}
          guess={guess}
          answer={result ? { lat: target.lat, lon: target.lon } : null}
          showArc={!!result}
        />
        {!result && (
          <p className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-4 py-3 text-center text-sm font-medium text-sand-50">
            Drag or arrow-key to spin · scroll or pinch to zoom · tap or Enter to drop
          </p>
        )}
      </div>

      {result && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Distance" value={`${result.dist.toLocaleString()} km`} />
            <Stat label="Round score" value={result.mult === 1 ? `${result.base}` : `${result.base} ×${result.mult}`} />
            <Stat label="Banked" value={`+${result.points}`} />
          </div>
          <p className="text-sm qa-muted" aria-live="polite">
            {emoji(result.base / CAP)} {snark(result.dist)}
          </p>
          <div className="flex items-center gap-3">
            <Button onClick={next}>{round + 1 >= ROUNDS ? "Finish · bank the score" : "Next round"}</Button>
            <p className="text-xs qa-muted">
              {total.toLocaleString()} / {MAX_TOTAL} points
            </p>
          </div>
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
