import { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GameApi } from "../types";
import { mulberry32, sample } from "../lib/random";
import { CITIES, CONTINENTS, distanceKm, type City } from "../data/cities";
import { Button } from "../components/ui";
import { Counter } from "../components/motion";

const toXY = (lon: number, lat: number) => ({ x: lon + 180, y: 90 - lat });

function pointsFor(dist: number): number {
  if (dist <= 40) return 100;
  return Math.max(0, Math.round(100 - dist / 60));
}

interface RoundResult {
  city: City;
  guess: { x: number; y: number };
  dist: number;
  points: number;
}

export function MapDropGame({ api }: { api: GameApi }) {
  const cities = useMemo(() => sample(mulberry32(api.seed), CITIES, 5), [api.seed]);
  const [round, setRound] = useState(0);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [cursor, setCursor] = useState({ x: 180, y: 90 });
  const [pending, setPending] = useState<RoundResult | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const total = results.reduce((s, r) => s + r.points, 0);
  const city = cities[round];

  const drop = (x: number, y: number) => {
    if (pending || round >= 5) return;
    const guessLat = 90 - y;
    const guessLon = x - 180;
    const dist = Math.round(distanceKm(guessLat, guessLon, city.lat, city.lon));
    const res: RoundResult = { city, guess: { x, y }, dist, points: pointsFor(dist) };
    setPending(res);
  };

  const nextRound = () => {
    if (!pending) return;
    const nextResults = [...results, pending];
    setResults(nextResults);
    setPending(null);
    if (round + 1 >= 5) {
      const score = nextResults.reduce((s, r) => s + r.points, 0);
      setTimeout(() => {
        api.finish({
          score,
          max: 500,
          perfect: score >= 450,
          label: `Average miss: ${Math.round(nextResults.reduce((s, r) => s + r.dist, 0) / 5).toLocaleString()} km.`,
        });
      }, 500);
    } else {
      setRound(round + 1);
    }
  };

  const onMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const p = pt.matrixTransform(ctm.inverse());
    drop(Math.max(0, Math.min(360, p.x)), Math.max(0, Math.min(180, p.y)));
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 10 : 3;
    if (e.key === "ArrowLeft") setCursor((c) => ({ ...c, x: Math.max(0, c.x - step) }));
    else if (e.key === "ArrowRight") setCursor((c) => ({ ...c, x: Math.min(360, c.x + step) }));
    else if (e.key === "ArrowUp") setCursor((c) => ({ ...c, y: Math.max(0, c.y - step) }));
    else if (e.key === "ArrowDown") setCursor((c) => ({ ...c, y: Math.min(180, c.y + step) }));
    else if (e.key === "Enter" || e.key === " ") drop(cursor.x, cursor.y);
    else return;
    e.preventDefault();
  };

  const actual = toXY(city?.lon ?? 0, city?.lat ?? 0);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest qa-muted">
            City {Math.min(round + 1, 5)} of 5
          </p>
          <p className="font-display text-2xl font-semibold" aria-live="polite">
            {city ? `${city.name}` : "Done"}
            {city && <span className="ml-2 text-base font-normal qa-muted">{city.country}</span>}
          </p>
        </div>
        <p className="font-display text-xl font-semibold">
          <Counter value={total} /> <span className="text-sm qa-muted">pts</span>
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--line)]">
        <svg
          ref={svgRef}
          viewBox="0 0 360 180"
          className="block w-full cursor-crosshair bg-teal-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-500 dark:bg-teal-900"
          onClick={onMapClick}
          onKeyDown={onKeyDown}
          tabIndex={0}
          role="application"
          aria-label={`World map. Use arrow keys to move the crosshair, Enter to drop the pin for ${city?.name ?? "the city"}.`}
        >
          {CONTINENTS.map((ring, i) => (
            <polygon
              key={i}
              points={ring.map(([lon, lat]) => {
                const { x, y } = toXY(lon, lat);
                return `${x},${y}`;
              }).join(" ")}
              className="fill-sand-300 stroke-sand-600 dark:fill-pine-700 dark:stroke-pine-500"
              strokeWidth={0.4}
            />
          ))}

          {/* keyboard crosshair */}
          {!pending && (
            <g className="pointer-events-none opacity-60">
              <circle cx={cursor.x} cy={cursor.y} r={2.4} fill="none" stroke="#7d3a27" strokeWidth={0.8} />
              <path
                d={`M${cursor.x - 5} ${cursor.y} H${cursor.x + 5} M${cursor.x} ${cursor.y - 5} V${cursor.y + 5}`}
                stroke="#7d3a27"
                strokeWidth={0.6}
              />
            </g>
          )}

          <AnimatePresence>
            {pending && (
              <g className="pointer-events-none">
                <motion.line
                  x1={pending.guess.x}
                  y1={pending.guess.y}
                  x2={actual.x}
                  y2={actual.y}
                  stroke="#7d3a27"
                  strokeWidth={0.8}
                  strokeDasharray="2 2"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.7, delay: 0.35 }}
                />
                <motion.circle
                  cx={actual.x}
                  cy={actual.y}
                  r={2.6}
                  fill="#37837b"
                  stroke="#faf6ec"
                  strokeWidth={0.8}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 15 }}
                />
                <motion.g
                  initial={{ y: -18, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 18 }}
                >
                  <circle cx={pending.guess.x} cy={pending.guess.y} r={2.6} fill="#bc6140" stroke="#faf6ec" strokeWidth={0.8} />
                </motion.g>
              </g>
            )}
          </AnimatePresence>
        </svg>
      </div>

      <div className="flex min-h-16 items-center justify-between gap-4" aria-live="polite">
        {pending ? (
          <>
            <p className="text-sm">
              <span className="font-display text-lg font-bold">{pending.dist.toLocaleString()} km</span>{" "}
              <span className="qa-muted">from {pending.city.name}</span>
              <span className="ml-3 rounded-full bg-gold-200 px-2.5 py-1 text-xs font-bold text-gold-800 dark:bg-gold-700 dark:text-gold-100">
                +{pending.points} pts
              </span>
            </p>
            <Button onClick={nextRound}>{round + 1 >= 5 ? "See final score" : "Next city"}</Button>
          </>
        ) : (
          <p className="text-sm qa-muted">
            Click the map — or focus it and steer with the arrow keys, then press Enter.
          </p>
        )}
      </div>

      <div className="flex gap-1.5" aria-label="Round progress">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${
              i < results.length ? "bg-teal-500" : i === round && !pending ? "bg-gold-400" : "bg-[var(--card-2)]"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
