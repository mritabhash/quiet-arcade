import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GameApi } from "../types";
import { mulberry32, pickIndex } from "../lib/random";
import { EASE } from "../components/motion";
import { mutateTile, randomTileSpec, TileArt, type TileSpec } from "../components/tiles";

const ROUNDS = 8;
const CELLS = 9;

interface Round {
  base: TileSpec;
  odd: TileSpec;
  oddPos: number;
}

export function OddOneOutGame({ api }: { api: GameApi }) {
  const rounds = useMemo(() => {
    const rng = mulberry32(api.seed);
    return Array.from({ length: ROUNDS }, (): Round => {
      const base = randomTileSpec(rng);
      return { base, odd: mutateTile(rng, base), oddPos: pickIndex(rng, CELLS) };
    });
  }, [api.seed]);

  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);

  const cur = rounds[round];

  const pickCell = (i: number) => {
    if (choice !== null) return;
    setChoice(i);
    const correct = i === cur.oddPos;
    const next = score + (correct ? 1 : 0);
    setScore(next);
    setTimeout(() => {
      if (round + 1 >= ROUNDS) {
        api.finish({
          score: next,
          max: ROUNDS,
          perfect: next === ROUNDS,
          label: next === ROUNDS ? "Nothing escapes your quiet eye." : undefined,
        });
      } else {
        setChoice(null);
        setRound(round + 1);
      }
    }, 1200);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-xs font-bold uppercase tracking-widest qa-muted">
        Tile set {round + 1} of {ROUNDS} · {score} spotted
      </p>

      <p className="max-w-md text-center text-sm qa-muted">
        Eight tiles agree. One is quietly wrong — a charm, a hue, a pattern, an aura.
      </p>

      <AnimatePresence mode="wait">
        <motion.div
          key={round}
          initial={{ opacity: 0, scale: 0.94, filter: "blur(8px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.45, ease: EASE }}
          className="grid w-full max-w-md grid-cols-3 gap-3"
          role="group"
          aria-label="Tile set"
        >
          {Array.from({ length: CELLS }, (_, i) => {
            const tile = i === cur.oddPos ? cur.odd : cur.base;
            const revealed = choice !== null;
            const isOdd = i === cur.oddPos;
            const isWrongPick = revealed && choice === i && !isOdd;
            return (
              <button
                key={i}
                onClick={() => pickCell(i)}
                disabled={revealed}
                aria-label={revealed ? `Tile ${i + 1}: ${tile.name}` : `Tile ${i + 1}`}
                className={`qa-card aspect-square rounded-2xl p-1.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 ${
                  revealed && isOdd
                    ? "border-sage-600 ring-2 ring-sage-600"
                    : isWrongPick
                      ? "border-clay-600 ring-2 ring-clay-600 opacity-80"
                      : revealed
                        ? "opacity-60"
                        : "hover:bg-[var(--card-2)]"
                }`}
              >
                <TileArt tile={tile} />
              </button>
            );
          })}
        </motion.div>
      </AnimatePresence>

      <div className="min-h-5 text-sm qa-muted" aria-live="polite">
        {choice !== null &&
          (choice === cur.oddPos
            ? "Found it. The impostor bows."
            : `It was hiding elsewhere — the odd tile is ${cur.odd.name}.`)}
      </div>

      <p className="text-xs qa-muted">
        Drawn from the arcade's library of ten thousand tiles.
      </p>
    </div>
  );
}
