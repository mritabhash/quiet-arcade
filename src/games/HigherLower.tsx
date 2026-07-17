import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence, animate } from "framer-motion";
import type { GameApi } from "../types";
import { mulberry32, type Rng } from "../lib/random";
import { COMPARISON_CATEGORIES, type ComparisonCategory, type ComparisonItem } from "../data/comparisons";
import { HIGHER_LOWER_GAMES } from "../data/higherLowerGames";
import { EASE } from "../components/motion";
import { useSettings } from "../context/SettingsContext";

const ROUNDS = 10;

interface Segment {
  category: ComparisonCategory;
  chain: ComparisonItem[]; // 6 items -> 5 comparisons
}

/**
 * Draw one of the ten thousand pre-generated games and resolve it into two
 * 6-item chains from two different categories (5 + 5 = 10 links).
 * Each game tuple is [catA, a0..a5, catB, b0..b5] — see data/higherLowerGames.
 */
function buildSegments(rng: Rng): Segment[] {
  const game = HIGHER_LOWER_GAMES[Math.floor(rng() * HIGHER_LOWER_GAMES.length)];
  const toSegment = (catIdx: number, itemIdx: readonly number[]): Segment => {
    const category = COMPARISON_CATEGORIES[catIdx];
    const chain: ComparisonItem[] = itemIdx.map((i) => category.items[i]);
    return { category, chain };
  };
  return [toSegment(game[0], game.slice(1, 7)), toSegment(game[7], game.slice(8, 14))];
}

function formatValue(v: number, unit: string): string {
  const num = v.toLocaleString(undefined, { maximumFractionDigits: 1 });
  return unit ? `${num} ${unit}` : num;
}

function RollingNumber({ value, play }: { value: number; play: boolean }) {
  const { motionOK } = useSettings();
  const [display, setDisplay] = useState(play && motionOK ? 0 : value);
  useEffect(() => {
    if (!play || !motionOK) {
      setDisplay(value);
      return;
    }
    const controls = animate(0, value, {
      duration: 0.9,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v * 10) / 10),
    });
    return () => controls.stop();
  }, [value, play, motionOK]);
  return <>{display.toLocaleString(undefined, { maximumFractionDigits: 1 })}</>;
}

type Phase = "guessing" | "revealed";

export function HigherLowerGame({ api }: { api: GameApi }) {
  const segments = useMemo(() => buildSegments(mulberry32(api.seed)), [api.seed]);
  const [link, setLink] = useState(0); // 0..9
  const [phase, setPhase] = useState<Phase>("guessing");
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [history, setHistory] = useState<boolean[]>([]);

  const segIndex = link < 5 ? 0 : 1;
  const seg = segments[segIndex];
  const posInSeg = link - segIndex * 5;
  const anchor = seg.chain[posInSeg];
  const challenger = seg.chain[posInSeg + 1];

  const guess = (dir: "higher" | "lower") => {
    if (phase !== "guessing") return;
    const isHigher = challenger.value > anchor.value;
    const correct = (dir === "higher") === isHigher;
    setLastCorrect(correct);
    setScore((s) => s + (correct ? 1 : 0));
    setHistory((h) => [...h, correct]);
    setPhase("revealed");
  };

  const next = () => {
    if (phase !== "revealed") return;
    if (link + 1 >= ROUNDS) {
      const final = score;
      api.finish({
        score: final,
        max: ROUNDS,
        perfect: final === ROUNDS,
        label:
          final === ROUNDS
            ? "Ten for ten. Impeccable instincts."
            : final >= 7
              ? "A steady hand on the scales."
              : "The numbers keep their secrets some days.",
      });
      return;
    }
    setLink(link + 1);
    setPhase("guessing");
    setLastCorrect(null);
  };

  // auto-advance shortly after reveal so the chain keeps flowing
  useEffect(() => {
    if (phase !== "revealed") return;
    const t = setTimeout(next, 1900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, link]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest qa-muted">{seg.category.label}</p>
          <p className="font-display text-lg font-semibold">{seg.category.question}</p>
        </div>
        <p className="font-display text-xl font-semibold" aria-live="polite">
          {score} <span className="text-sm qa-muted">/ {ROUNDS}</span>
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch">
        {/* anchor card */}
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={`anchor-${segIndex}-${anchor.name}`}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.45, ease: EASE }}
            className="qa-card grain flex flex-col justify-between rounded-2xl p-6"
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-widest qa-muted">Anchor</p>
              <p className="mt-1 font-display text-xl font-semibold">{anchor.name}</p>
              <p className="text-sm qa-muted">{anchor.detail}</p>
            </div>
            <p className="mt-5 font-display text-3xl font-bold text-teal-700 dark:text-teal-300">
              {formatValue(anchor.value, seg.category.unit)}
            </p>
          </motion.div>
        </AnimatePresence>

        <div className="hidden items-center sm:flex" aria-hidden>
          <span className="font-display text-2xl qa-muted">vs</span>
        </div>

        {/* challenger card */}
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={`challenger-${segIndex}-${challenger.name}`}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, ease: EASE, delay: 0.1 }}
            className={`relative flex flex-col justify-between overflow-hidden rounded-2xl border-2 p-6 transition-colors duration-500 ${
              phase === "revealed"
                ? lastCorrect
                  ? "border-sage-500 bg-sage-100 dark:bg-sage-900"
                  : "border-clay-500 bg-clay-100 dark:bg-clay-900"
                : "border-gold-400 bg-[var(--card)]"
            }`}
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-widest qa-muted">Challenger</p>
              <p className="mt-1 font-display text-xl font-semibold">{challenger.name}</p>
              <p className="text-sm qa-muted">{challenger.detail}</p>
            </div>

            {phase === "guessing" ? (
              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => guess("higher")}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-sage-600 py-2.5 font-bold text-sand-50 shadow-[0_3px_0_0_#36412d] transition-all hover:bg-sage-700 active:translate-y-[2px] active:shadow-none"
                >
                  <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M4 10 L8 5 L12 10" /></svg>
                  Higher
                </button>
                <button
                  onClick={() => guess("lower")}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-clay-500 py-2.5 font-bold text-sand-50 shadow-[0_3px_0_0_#7d3a27] transition-all hover:bg-clay-600 active:translate-y-[2px] active:shadow-none"
                >
                  <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M4 6 L8 11 L12 6" /></svg>
                  Lower
                </button>
              </div>
            ) : (
              <div className="mt-5 flex items-baseline justify-between" aria-live="polite">
                <p className="font-display text-3xl font-bold">
                  <RollingNumber value={challenger.value} play />{" "}
                  <span className="text-base font-medium qa-muted">{seg.category.unit}</span>
                </p>
                <motion.span
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.7, type: "spring", stiffness: 300, damping: 16 }}
                  className={`text-2xl ${lastCorrect ? "text-sage-600" : "text-clay-600"}`}
                >
                  {lastCorrect ? "✓" : "✕"}
                </motion.span>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <p className="min-h-5 text-center text-sm qa-muted" aria-live="polite">
        {phase === "revealed"
          ? lastCorrect
            ? "Right. The challenger becomes the new anchor…"
            : "Missed — but the chain moves on…"
          : `Link ${link + 1} of ${ROUNDS}. ${link === 4 ? "New category after this one." : ""}`}
      </p>

      <div className="flex gap-1.5" aria-label="Chain progress">
        {Array.from({ length: ROUNDS }, (_, i) => (
          <motion.div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${
              i < history.length
                ? history[i]
                  ? "bg-sage-500"
                  : "bg-clay-400"
                : i === link
                  ? "bg-gold-400"
                  : "bg-[var(--card-2)]"
            }`}
            animate={i === link && phase === "guessing" ? { opacity: [1, 0.5, 1] } : {}}
            transition={{ duration: 1.6, repeat: Infinity }}
          />
        ))}
      </div>
    </div>
  );
}
