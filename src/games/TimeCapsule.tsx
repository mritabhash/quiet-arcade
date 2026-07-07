import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { GameApi } from "../types";
import { rngFor, pickIndex } from "../lib/random";
import { distanceKm } from "../data/cities";
import { TIME_CAPSULE_PUZZLES } from "../data/timeCapsulePuzzles";
import { pickFreshIndex, recordFlagshipRound } from "../lib/flagship";
import { WorldMap, toXY } from "../components/WorldMap";
import { Button, Chip } from "../components/ui";
import { Counter, EASE } from "../components/motion";

/**
 * Time Capsule: study an archive card, then guess both where and when
 * the scene belongs. Location is a pin on the world map; time is a
 * decade pick. Extra clues cost part of the sleuth bonus.
 */

const MAX_SCORE = 1000;
/** location: up to 450 by proximity + 50 region bonus */
const LOC_POINTS = 450;
const REGION_BONUS = 50;
const LOC_BULLSEYE_KM = 150;
const LOC_FADE_KM = 4000;
/** time: 350 for the exact decade, minus 70 per decade off */
const TIME_POINTS = 350;
const TIME_LOSS_PER_DECADE = 70;
/** sleuth bonus: 150, minus 50 per extra clue revealed */
const HINT_BONUS = 150;
const HINT_COST = 50;
const BASE_CLUES = 3;

const DECADES = (() => {
  const out: number[] = [];
  for (let d = 1850; d <= 2020; d += 10) out.push(d);
  return out;
})();

const ERA_LABELS: [number, string][] = [
  [-10000, "Ancient"],
  [500, "Medieval"],
  [1500, "Early modern"],
  [1800, "19th century"],
  [1900, "20th century"],
  [2000, "21st century"],
];

function eraOf(year: number): string {
  let label = ERA_LABELS[0][1];
  for (const [from, name] of ERA_LABELS) if (year >= from) label = name;
  return label;
}

interface Outcome {
  dist: number;
  decadesOff: number;
  locPts: number;
  timePts: number;
  bonusPts: number;
  score: number;
}

export function TimeCapsuleGame({ api }: { api: GameApi }) {
  const puzzle = useMemo(() => {
    const rng = rngFor([api.seed]);
    if (api.mode === "daily") {
      return TIME_CAPSULE_PUZZLES[pickIndex(rng, TIME_CAPSULE_PUZZLES.length)];
    }
    const ids = TIME_CAPSULE_PUZZLES.map((p) => p.id);
    return TIME_CAPSULE_PUZZLES[pickFreshIndex("time-capsule", ids, rng)];
  }, [api.seed, api.mode]);

  const [revealed, setRevealed] = useState(BASE_CLUES);
  const [pin, setPin] = useState<{ x: number; y: number } | null>(null);
  const [decade, setDecade] = useState<number | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  const ancient = puzzle.year < 1850;
  const extraClues = Math.max(0, revealed - BASE_CLUES);
  const bonusLeft = Math.max(0, HINT_BONUS - extraClues * HINT_COST);
  const shownClues = puzzle.clues.slice(0, revealed);
  // scenes older than the picker's range collapse into the "≤1850s" bucket
  const trueDecade = Math.max(1850, Math.floor(puzzle.year / 10) * 10);

  const confirm = () => {
    if (!pin || decade === null || outcome) return;
    const guessLat = 90 - pin.y;
    const guessLon = pin.x - 180;
    const dist = Math.round(distanceKm(guessLat, guessLon, puzzle.lat, puzzle.lon));
    const prox = dist <= LOC_BULLSEYE_KM ? 1 : Math.max(0, 1 - dist / LOC_FADE_KM);
    const regionMatch = dist <= 1500;
    const locPts = Math.round(LOC_POINTS * prox) + (regionMatch ? REGION_BONUS : 0);
    const decadesOff = Math.abs(decade - trueDecade) / 10;
    const timePts = Math.max(0, TIME_POINTS - decadesOff * TIME_LOSS_PER_DECADE);
    const score = locPts + timePts + bonusLeft;
    setOutcome({ dist, decadesOff, locPts, timePts, bonusPts: bonusLeft, score });
  };

  const finishRound = () => {
    if (!outcome) return;
    const perfect = outcome.score === MAX_SCORE;
    recordFlagshipRound("time-capsule", api.mode, {
      score: outcome.score,
      max: MAX_SCORE,
      won: outcome.dist <= 1500 && outcome.decadesOff <= 1,
      perfect,
      hintsUsed: revealed,
      puzzleId: puzzle.id,
    });
    api.finish({
      score: outcome.score,
      max: MAX_SCORE,
      perfect,
      label: `${puzzle.place}, ${puzzle.year} — ${outcome.dist.toLocaleString()} km and ${outcome.decadesOff} decade(s) off.`,
      share: [
        "Quiet Arcade: Time Capsule",
        `Score: ${outcome.score.toLocaleString()}/${MAX_SCORE.toLocaleString()}`,
        `Location: ${outcome.dist <= 500 ? "very close" : outcome.dist <= 1500 ? "close" : "far"}`,
        `Time: ${outcome.decadesOff === 0 ? "correct decade" : `${outcome.decadesOff} decade(s) off`}`,
        `Hints used: ${revealed}`,
        `Mode: ${api.mode === "daily" ? "Daily" : "Free Play"}`,
      ],
    });
  };

  /* ------------------------------------------------ post-guess */
  if (outcome) {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest qa-muted">
              The capsule opens
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold" aria-live="polite">
              {puzzle.place}, {puzzle.country} — {puzzle.year < 0 ? `${-puzzle.year} BC` : puzzle.year}
            </h2>
          </div>
          <p className="font-display text-3xl font-semibold">
            <Counter value={outcome.score} />
            <span className="text-base font-normal qa-muted"> / {MAX_SCORE.toLocaleString()}</span>
          </p>
        </div>

        <WorldMap
          pin={pin}
          actual={toXY(puzzle.lon, puzzle.lat)}
          ariaLabel={`Result map. Your pin landed ${outcome.dist.toLocaleString()} kilometres from ${puzzle.place}.`}
        />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <ResultStat label="Distance" value={`${outcome.dist.toLocaleString()} km`} />
          <ResultStat
            label="Time"
            value={outcome.decadesOff === 0 ? "Exact decade!" : `${outcome.decadesOff} decade(s) off`}
          />
          <ResultStat label="Location pts" value={`${outcome.locPts}`} />
          <ResultStat label="Time + bonus" value={`${outcome.timePts + outcome.bonusPts}`} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5, ease: EASE }}
          className="qa-card rounded-2xl p-5"
        >
          <p className="text-xs font-bold uppercase tracking-widest qa-muted">The record shows</p>
          <p className="mt-2 text-sm leading-snug">{puzzle.explanation}</p>
        </motion.div>

        <div className="flex justify-end">
          <Button onClick={finishRound}>Seal the capsule</Button>
        </div>
      </div>
    );
  }

  /* ----------------------------------------------------- play */
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest qa-muted">Archive card</p>
          <h2 className="mt-1 font-display text-2xl font-semibold">Guess where — and when.</h2>
        </div>
        <div className="text-right">
          <p className="font-display text-2xl font-semibold">
            {bonusLeft}
            <span className="text-sm font-normal qa-muted"> bonus pts left</span>
          </p>
          <p className="text-xs qa-muted">{revealed} / {puzzle.clues.length} clues</p>
        </div>
      </div>

      {/* the archive card */}
      <motion.div
        initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.5, ease: EASE }}
        className="grain relative overflow-hidden rounded-2xl border border-gold-700/40 bg-gradient-to-br from-sand-100 to-sand-200 p-5 dark:border-gold-500/25 dark:from-pine-800 dark:to-pine-900"
      >
        <p className="qa-fleuron text-[10px] font-bold uppercase tracking-[0.3em] text-gold-600 dark:text-gold-300">
          recovered scene · {puzzle.difficulty.toLowerCase()} · era unknown
        </p>
        <p className="mt-3 font-display text-lg leading-relaxed">{puzzle.scene}</p>
        <span
          aria-hidden
          className="absolute -right-3 -top-3 rotate-12 rounded-full border-2 border-clay-500/40 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-clay-500/50"
        >
          Quiet Archive
        </span>
      </motion.div>

      <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.9fr)]">
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-col gap-2.5" aria-live="polite">
            {shownClues.map((clue, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -18, filter: "blur(6px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.5, ease: EASE, delay: i < BASE_CLUES ? i * 0.15 : 0 }}
                className="qa-card rounded-2xl px-4 py-3"
              >
                <p className="text-[10px] font-bold uppercase tracking-widest qa-muted">
                  Clue {i + 1}
                </p>
                <p className="mt-0.5 text-sm font-medium leading-snug">{clue}</p>
              </motion.div>
            ))}
          </div>

          {revealed < puzzle.clues.length ? (
            <button
              onClick={() => setRevealed((r) => r + 1)}
              className="rounded-2xl border border-dashed border-[var(--line)] px-4 py-3 text-left transition-colors hover:bg-[var(--card-2)] focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              <p className="text-sm font-semibold">Reveal clue {revealed + 1}</p>
              <p className="text-xs qa-muted">Costs {HINT_COST} bonus points</p>
            </button>
          ) : (
            <Chip className="self-start">Every clue is on the table</Chip>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <WorldMap
            pin={pin}
            actual={null}
            onPin={(x, y) => setPin({ x, y })}
            ariaLabel="World map. Click or drag to place your location guess. With the keyboard, use arrow keys to aim, plus and minus to zoom, and Enter to drop."
          />

          {/* decade picker */}
          <div className="qa-card rounded-2xl p-3">
            <p className="px-1 text-[10px] font-bold uppercase tracking-widest qa-muted">
              When does this belong? {decade !== null && (
                <span className="text-gold-600 dark:text-gold-300">{ancient && decade === 1850 ? "Before 1850s" : `${decade}s · ${eraOf(decade)}`}</span>
              )}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {DECADES.map((d) => (
                <button
                  key={d}
                  onClick={() => setDecade(d)}
                  aria-pressed={decade === d}
                  className={`rounded-lg px-2 py-1 text-xs font-semibold transition-colors ${
                    decade === d
                      ? "bg-teal-600 text-sand-50"
                      : "bg-[var(--card-2)] qa-muted hover:text-[var(--ink)]"
                  }`}
                >
                  {d === 1850 ? "≤1850s" : `${d}s`}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={confirm} disabled={!pin || decade === null}>
              Open the capsule
            </Button>
            <p className="text-xs leading-snug qa-muted">
              {!pin
                ? "Drop a pin where the scene belongs. Scroll or pinch to zoom."
                : decade === null
                  ? "Now pick a decade."
                  : "Confirm when you're sure."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="qa-card rounded-2xl px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-widest qa-muted">{label}</p>
      <p className="mt-0.5 truncate text-sm font-semibold" title={value}>
        {value}
      </p>
    </div>
  );
}
