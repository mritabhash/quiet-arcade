import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GameApi } from "../types";
import { mulberry32, shuffled } from "../lib/random";
import { COUNTRY_SHAPES } from "../data/shapes";
import { EASE } from "../components/motion";
import { useSettings } from "../context/SettingsContext";

const ROUNDS = 8;

export function CountryShapeGame({ api }: { api: GameApi }) {
  const { motionOK } = useSettings();
  const rounds = useMemo(() => {
    const rng = mulberry32(api.seed);
    const order = shuffled(rng, COUNTRY_SHAPES).slice(0, ROUNDS);
    return order.map((shape) => {
      const others = shuffled(rng, COUNTRY_SHAPES.filter((s) => s.name !== shape.name)).slice(0, 3);
      return { shape, options: shuffled(rng, [shape, ...others].map((s) => s.name)) };
    });
  }, [api.seed]);

  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [choice, setChoice] = useState<string | null>(null);

  const current = rounds[round];

  const pickOption = (name: string) => {
    if (choice) return;
    setChoice(name);
    const correct = name === current.shape.name;
    const nextScore = score + (correct ? 1 : 0);
    setScore(nextScore);
    setTimeout(() => {
      if (round + 1 >= ROUNDS) {
        api.finish({
          score: nextScore,
          max: ROUNDS,
          perfect: nextScore === ROUNDS,
          label: nextScore === ROUNDS ? "Every silhouette, first look." : undefined,
        });
      } else {
        setChoice(null);
        setRound(round + 1);
      }
    }, 1050);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-xs font-bold uppercase tracking-widest qa-muted">
        Shape {round + 1} of {ROUNDS} · {score} correct
      </p>

      <AnimatePresence mode="wait">
        <motion.div
          key={round}
          initial={{ opacity: 0, scale: 0.92, filter: "blur(8px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.45, ease: EASE }}
          className="qa-card grain relative flex h-56 w-56 items-center justify-center rounded-3xl sm:h-64 sm:w-64"
        >
          <motion.svg
            viewBox="0 0 100 100"
            className="h-44 w-44 sm:h-52 sm:w-52"
            animate={motionOK ? { y: [0, -4, 0] } : undefined}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            aria-label="Mystery country silhouette"
            role="img"
          >
            {current.shape.paths.map((d, i) => (
              <path
                key={i}
                d={d}
                fillRule="evenodd"
                className="fill-clay-400 stroke-clay-700 dark:fill-clay-600 dark:stroke-clay-300"
                strokeWidth={1}
                strokeLinejoin="round"
              />
            ))}
          </motion.svg>
        </motion.div>
      </AnimatePresence>

      <div className="grid w-full max-w-md grid-cols-1 gap-2 sm:grid-cols-2" role="group" aria-label="Country options">
        {current.options.map((name) => {
          const isCorrect = choice && name === current.shape.name;
          const isWrongPick = choice === name && name !== current.shape.name;
          return (
            <motion.button
              key={name}
              whileTap={{ scale: 0.97 }}
              onClick={() => pickOption(name)}
              disabled={!!choice}
              className={`rounded-xl border px-4 py-3 font-semibold transition-colors ${
                isCorrect
                  ? "border-sage-600 bg-sage-500 text-sand-50"
                  : isWrongPick
                    ? "border-clay-600 bg-clay-500 text-sand-50"
                    : "qa-card hover:bg-[var(--card-2)] disabled:opacity-60"
              }`}
            >
              {name}
            </motion.button>
          );
        })}
      </div>

      <p className="text-xs qa-muted">Real map outlines, gently simplified. North is always up.</p>
    </div>
  );
}
