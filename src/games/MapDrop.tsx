import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { GameApi } from "../types";
import { rngFor, pickIndex } from "../lib/random";
import { CITIES, distanceKm } from "../data/cities";
import { MAP_DROP_PUZZLES } from "../data/mapDropPuzzles";
import { pickFreshIndex, recordFlagshipRound } from "../lib/flagship";
import { WorldMap, toXY } from "../components/WorldMap";
import { Button, Chip } from "../components/ui";
import { Counter, EASE } from "../components/motion";
import { RabbitGuide, type RabbitMood } from "../components/RabbitGuide";
import { easyHintsFor, easyFreeHintsFor } from "../lib/easyMode";
import { read, write } from "../lib/storage";

/** Hard mode: hints come one at a time — ceiling by hints revealed, index is (revealed - 1). */
const HINT_POINTS = [5000, 4300, 3600, 2900, 2200, 1500, 800] as const;
const MAX_SCORE = 5000;
/** Moderate mode: the three country hints are free; three closer looks cost a flat fee each. */
const MODERATE_MAX_SCORE = 4000;
const MODERATE_HINT_COST = 600;
const MODERATE_TOTAL_HINTS = 6;
const MODERATE_LABELS = ["Flag colours", "In the local tongue", "Country fact"] as const;
/** Easy mode: three famous facts are free; three closer looks cost a flat fee each. */
const EASY_MAX_SCORE = 3000;
const EASY_HINT_COST = 200;
const EASY_TOTAL_HINTS = 6;
/** Novice mode: the answer's name is free; one pricey reveal says where it sits. */
const NOVICE_MAX_SCORE = 5000;
const NOVICE_HINT_COST = 2000;
const NOVICE_TOTAL_HINTS = 2;
const DIFFICULTY_KEY = "quietArcade.mapDropDifficulty";
const DIFFICULTIES = ["novice", "easy", "moderate", "hard"] as const;
type Difficulty = (typeof DIFFICULTIES)[number];
/** stored prefs from the two-mode era: "standard" was the 7-hint flow */
function readDifficulty(): Difficulty {
  const raw = read<string>(DIFFICULTY_KEY, "easy");
  if (raw === "standard") return "hard";
  return (DIFFICULTIES as readonly string[]).includes(raw) ? (raw as Difficulty) : "easy";
}
/** Full points inside the bullseye; fades with distance, but any pin
 *  inside FADE_KM banks at least MIN_FACTOR of the ceiling. */
const BULLSEYE_KM = 25;
const FADE_KM = 1500;
const MIN_FACTOR = 0.1;


const LINES = {
  start: ["Read the hints. Drop wisely.", "Trust the weather.", "Food clues matter."],
  reveal: ["Careful, hints cost points.", "Okay… that one cost us.", "The picture sharpens."],
  lastHint: ["That's all I've got. Drop it."],
  tempted: ["One more hint?", "Do you really need it?"],
  pinMoved: ["That pin feels brave.", "Bold drop.", "Watching. Closely."],
  sleepy: ["Tick tock, detective.", "The map isn't going anywhere…"],
  celebrate: ["The rabbit council approves.", "That was suspiciously good."],
  happy: ["Solid drop. Claps.", "Nicely read."],
  squint: ["You're close.", "So close I can taste it."],
  shocked: ["Wrong continent, bestie.", "That pin went on a journey."],
};

const randomOf = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

/** Label the player's pin by the closest charted place, e.g. "near Dhaka". */
function nearestLabel(lat: number, lon: number): string {
  let best = { name: "", country: "", d: Infinity };
  for (const p of [...MAP_DROP_PUZZLES, ...CITIES]) {
    const d = distanceKm(lat, lon, p.lat, p.lon);
    if (d < best.d) best = { name: p.name, country: p.country, d };
  }
  return best.d > 1200 ? "somewhere far off the charts" : `near ${best.name}, ${best.country}`;
}

interface Outcome {
  pin: { x: number; y: number };
  pinLabel: string;
  dist: number;
  base: number;
  score: number;
}

export function MapDropGame({ api }: { api: GameApi }) {
  const place = useMemo(() => {
    const rng = rngFor([api.seed]);
    // daily stays purely date-deterministic; free play skips recent rounds
    if (api.mode === "daily") {
      return MAP_DROP_PUZZLES[pickIndex(rng, MAP_DROP_PUZZLES.length)];
    }
    const ids = MAP_DROP_PUZZLES.map((p) => p.id);
    return MAP_DROP_PUZZLES[pickFreshIndex("map-drop", ids, rng)];
  }, [api.seed, api.mode]);

  const countryHints = useMemo(() => easyHintsFor(place, api.seed), [place, api.seed]);
  const easyFree = useMemo(() => easyFreeHintsFor(place, api.seed), [place, api.seed]);
  const [difficulty, setDifficulty] = useState<Difficulty>(readDifficulty);
  // easy/moderate need country data; unmapped country → hard's 7-hint flow for the round
  const eff: Difficulty =
    (difficulty === "moderate" && countryHints === null) ||
    (difficulty === "easy" && easyFree === null)
      ? "hard"
      : difficulty;

  // easy and moderate open with their three free hints; novice opens with the
  // name alone; hard reveals one by one
  const [revealed, setRevealed] = useState(eff === "easy" || eff === "moderate" ? 3 : 1);
  const [pin, setPin] = useState<{ x: number; y: number } | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [rabbit, setRabbit] = useState<{ mood: RabbitMood; line: string }>(() => ({
    mood: "curious",
    line: randomOf(LINES.start),
  }));
  const beforeTempt = useRef<{ mood: RabbitMood; line: string } | null>(null);
  const [poke, setPoke] = useState(0);

  const say = (mood: RabbitMood, lines: string[]) =>
    setRabbit({ mood, line: randomOf(lines) });
  const bump = () => setPoke((p) => p + 1);

  // If the player stalls, the rabbit checks its tiny watch.
  useEffect(() => {
    if (outcome) return;
    const t = setTimeout(
      () => setRabbit({ mood: "sleepy", line: randomOf(LINES.sleepy) }),
      45000,
    );
    return () => clearTimeout(t);
  }, [poke, outcome]);

  useEffect(() => {
    if (difficulty === "moderate" && !countryHints && import.meta.env.DEV) {
      console.warn(
        `Map Drop moderate mode: no country data for ${place.name} (${place.country}); hard hints used.`,
      );
    }
  }, [difficulty, countryHints, place]);

  const totalHints =
    eff === "hard"
      ? 7
      : eff === "novice"
        ? NOVICE_TOTAL_HINTS
        : eff === "easy"
          ? EASY_TOTAL_HINTS
          : MODERATE_TOTAL_HINTS;
  const hints =
    eff === "novice"
      ? [
          place.kind === "mountains"
            ? `The mountains are called ${place.name}.`
            : `The ${place.kind}'s name is ${place.name}.`,
          `You'll find it in ${place.country}.`,
        ]
      : eff === "easy"
        ? [...easyFree!.map((h) => h.text), ...place.hints.slice(0, 3)]
        : eff === "moderate"
          ? [...countryHints!, ...place.hints.slice(0, 3)]
          : place.hints;
  const ceiling =
    eff === "novice"
      ? NOVICE_MAX_SCORE - (revealed - 1) * NOVICE_HINT_COST
      : eff === "easy"
        ? EASY_MAX_SCORE - (revealed - 3) * EASY_HINT_COST
        : eff === "moderate"
          ? MODERATE_MAX_SCORE - (revealed - 3) * MODERATE_HINT_COST
          : HINT_POINTS[revealed - 1];
  const maxScore =
    eff === "easy" ? EASY_MAX_SCORE : eff === "moderate" ? MODERATE_MAX_SCORE : MAX_SCORE;
  const modeLabel = difficulty[0].toUpperCase() + difficulty.slice(1);

  const switchDifficulty = (d: Difficulty) => {
    if (d === difficulty || outcome) return;
    setDifficulty(d);
    write(DIFFICULTY_KEY, d);
    const nextEff =
      (d === "easy" && !easyFree) || (d === "moderate" && !countryHints) ? "hard" : d;
    setRevealed(nextEff === "easy" || nextEff === "moderate" ? 3 : 1);
    bump();
  };

  const revealHint = () => {
    if (revealed >= totalHints || outcome) return;
    const n = revealed + 1;
    setRevealed(n);
    beforeTempt.current = null;
    say("investigating", n === totalHints ? LINES.lastHint : LINES.reveal);
    bump();
  };

  const onTemptEnter = () => {
    if (outcome) return;
    beforeTempt.current = rabbit;
    say("tempted", LINES.tempted);
  };
  const onTemptLeave = () => {
    if (outcome || !beforeTempt.current) return;
    setRabbit(beforeTempt.current);
    beforeTempt.current = null;
  };

  const onPinPlaced = () => {
    if (outcome) return;
    if (rabbit.mood !== "pointing") say("pointing", LINES.pinMoved);
    bump();
  };

  const confirmDrop = () => {
    if (!pin || outcome) return;
    const dist = Math.round(distanceKm(90 - pin.y, pin.x - 180, place.lat, place.lon));
    const factor =
      dist <= BULLSEYE_KM ? 1 : dist < FADE_KM ? Math.max(MIN_FACTOR, 1 - dist / FADE_KM) : 0;
    const score = Math.round(ceiling * factor);
    setOutcome({
      pin,
      pinLabel: nearestLabel(90 - pin.y, pin.x - 180),
      dist,
      base: ceiling,
      score,
    });
    if (score === maxScore || dist <= 100) say("celebrate", LINES.celebrate);
    else if (dist <= 600) say("happy", LINES.happy);
    else if (dist <= 2500) say("squint", LINES.squint);
    else say("shocked", LINES.shocked);
  };

  const finishRound = () => {
    if (!outcome) return;
    recordFlagshipRound("map-drop", api.mode, {
      score: outcome.score,
      max: maxScore,
      won: outcome.dist <= 600,
      perfect: outcome.score === maxScore,
      hintsUsed: revealed,
      puzzleId: place.id,
    });
    api.finish({
      score: outcome.score,
      max: maxScore,
      perfect: outcome.score === maxScore,
      label: `${place.name}, ${place.country} — ${modeLabel}, ${revealed}/${totalHints} hints, ${outcome.dist.toLocaleString()} km off.`,
      share: [
        "Quiet Arcade: Map Drop",
        `Score: ${outcome.score.toLocaleString()}/${maxScore.toLocaleString()}`,
        `Difficulty: ${modeLabel}`,
        `Distance: ${outcome.dist.toLocaleString()} km`,
        `Hints used: ${revealed}/${totalHints}`,
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
              {outcome.dist <= 600 ? `The ${place.kind}, pinned` : `The ${place.kind} got away`}
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold" aria-live="polite">
              {place.name}, {place.country}
            </h2>
          </div>
          <p className="font-display text-3xl font-semibold">
            <Counter value={outcome.score} />
            <span className="text-base font-normal qa-muted"> / {maxScore.toLocaleString()}</span>
          </p>
        </div>

        <WorldMap
          pin={outcome.pin}
          actual={toXY(place.lon, place.lat)}
          ariaLabel={`Result map. Your pin landed ${outcome.dist.toLocaleString()} kilometres from ${place.name}.`}
        />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Your pin" value={outcome.pinLabel} />
          <Stat label="Distance" value={`${outcome.dist.toLocaleString()} km`} />
          <Stat label="Hints used" value={`${revealed} / ${totalHints}`} />
          <Stat label="Ceiling" value={`${outcome.base.toLocaleString()} pts`} />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={finishRound}>Bank the score</Button>
          {api.mode === "practice" && api.playAgain && (
            <Button
              variant="secondary"
              onClick={() => {
                finishRound();
                api.playAgain?.();
              }}
            >
              Play again
            </Button>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5, ease: EASE }}
          className="qa-card rounded-2xl p-5"
        >
          <p className="text-xs font-bold uppercase tracking-widest qa-muted">Why</p>
          <p className="mt-2 text-sm leading-snug">{place.why}</p>
        </motion.div>

        <RabbitGuide mood={rabbit.mood} line={rabbit.line} />
      </div>
    );
  }

  /* ----------------------------------------------------- play */
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest qa-muted">
            Hidden {place.kind}
          </p>
          <h2 className="mt-1 font-display text-2xl font-semibold">
            Find the {place.kind}. Drop your pin.
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="flex rounded-xl border border-[var(--line)] bg-[var(--card)] p-1"
            role="tablist"
            aria-label="Hint difficulty"
          >
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                role="tab"
                aria-selected={difficulty === d}
                onClick={() => switchDifficulty(d)}
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
            <p className="font-display text-2xl font-semibold">
              {ceiling.toLocaleString()}
              <span className="text-sm font-normal qa-muted"> pts possible</span>
            </p>
            <p className="text-xs qa-muted">
              {revealed} / {totalHints} hints
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.9fr)]">
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-col gap-2.5" aria-live="polite">
            {hints.slice(0, revealed).map((hint, i) => (
              <motion.div
                key={`${difficulty}-${i}`}
                initial={{ opacity: 0, x: -18, filter: "blur(6px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.5, ease: EASE, delay: i < (eff === "easy" || eff === "moderate" ? 3 : 1) ? i * 0.15 : 0 }}
                className="qa-card rounded-2xl px-4 py-3"
              >
                <p className="text-[10px] font-bold uppercase tracking-widest qa-muted">
                  {eff === "novice"
                    ? i === 0
                      ? "The name"
                      : place.kind === "country"
                        ? "Continent"
                        : "Country"
                    : eff === "easy"
                      ? i < 3
                        ? easyFree![i].label
                        : `Closer look ${i - 2}`
                      : eff === "moderate"
                        ? (MODERATE_LABELS[i] ?? `Closer look ${i - 2}`)
                        : `Hint ${i + 1}`}
                </p>
                <p className="mt-0.5 text-sm font-medium leading-snug">{hint}</p>
              </motion.div>
            ))}
          </div>

          {revealed < totalHints ? (
            <button
              onClick={revealHint}
              onMouseEnter={onTemptEnter}
              onMouseLeave={onTemptLeave}
              onFocus={onTemptEnter}
              onBlur={onTemptLeave}
              className="rounded-2xl border border-dashed border-[var(--line)] px-4 py-3 text-left transition-colors hover:bg-[var(--card-2)] focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              <p className="text-sm font-semibold">Reveal hint {revealed + 1}</p>
              <p className="text-xs qa-muted">
                {eff === "hard"
                  ? `Lowers your ceiling to ${HINT_POINTS[revealed].toLocaleString()} pts`
                  : eff === "novice"
                    ? `Costs ${NOVICE_HINT_COST.toLocaleString()} points — ceiling drops to ${(NOVICE_MAX_SCORE - revealed * NOVICE_HINT_COST).toLocaleString()} pts`
                    : eff === "easy"
                      ? `Costs ${EASY_HINT_COST} points — ceiling drops to ${(EASY_MAX_SCORE - (revealed - 2) * EASY_HINT_COST).toLocaleString()} pts`
                      : `Costs ${MODERATE_HINT_COST} points — ceiling drops to ${(MODERATE_MAX_SCORE - (revealed - 2) * MODERATE_HINT_COST).toLocaleString()} pts`}
              </p>
            </button>
          ) : (
            <Chip className="self-start">
              {totalHints === 2
                ? "Both hints are out"
                : `All ${totalHints === 7 ? "seven" : totalHints === 6 ? "six" : "three"} hints are out`}
            </Chip>
          )}

          <div className="mt-auto pt-3">
            <RabbitGuide mood={rabbit.mood} line={rabbit.line} />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <WorldMap
            pin={pin}
            actual={null}
            onPin={(x, y) => setPin({ x, y })}
            onDropEnd={onPinPlaced}
            ariaLabel="World map. Click or drag to place your pin. With the keyboard, use arrow keys to aim, plus and minus to zoom, and Enter to drop."
          />

          <div className="flex items-center gap-3">
            <Button onClick={confirmDrop} disabled={!pin}>
              Confirm drop
            </Button>
            <p className="text-xs leading-snug qa-muted">
              {pin
                ? "Drag the pin to adjust, then confirm. Closer keeps more points."
                : "Click the map to drop your pin. Scroll or pinch to zoom in."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="qa-card rounded-2xl px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-widest qa-muted">{label}</p>
      <p className="mt-0.5 truncate text-sm font-semibold" title={value}>
        {value}
      </p>
    </div>
  );
}

