import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GameApi } from "../types";
import { mulberry32, shuffled } from "../lib/random";
import { EASE } from "../components/motion";
import { useSettings } from "../context/SettingsContext";
import { sampleDistinctTiles, TileArt, type TileSpec } from "../components/tiles";

const PAIRS = 6;
const MAX_SCORE = 10;
/** the fewest conceivable moves is 6; nine or fewer keeps the full score */
const PAR = 9;

const COMPLIMENTS = [
  "You have the patience of a cat in a sunbeam.",
  "Sharp eyes — the dunes noticed.",
  "A reunion worthy of a quiet purr.",
  "The whole hall hums its approval.",
  "Somewhere, the old mage nods approvingly.",
  "All matched under the desert moon. Well done.",
];

function PawPrint() {
  return (
    <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden>
      <g fill="var(--muted)" opacity={0.55}>
        <ellipse cx={16} cy={20} rx={4.6} ry={3.8} />
        <ellipse cx={9.5} cy={14} rx={2} ry={2.5} transform="rotate(-18 9.5 14)" />
        <ellipse cx={14} cy={11.5} rx={2} ry={2.6} />
        <ellipse cx={18} cy={11.5} rx={2} ry={2.6} />
        <ellipse cx={22.5} cy={14} rx={2} ry={2.5} transform="rotate(18 22.5 14)" />
      </g>
    </svg>
  );
}

export function CatPairsGame({ api }: { api: GameApi }) {
  const { motionOK } = useSettings();
  const deck = useMemo(() => {
    const rng = mulberry32(api.seed);
    const tiles = sampleDistinctTiles(rng, PAIRS);
    return shuffled(rng, tiles.flatMap((t): TileSpec[] => [t, t]));
  }, [api.seed]);

  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [note, setNote] = useState<string | null>(null);

  const flip = (i: number) => {
    if (open.length === 2 || open.includes(i) || matched.includes(deck[i].index)) return;
    const next = [...open, i];
    setOpen(next);
    if (next.length < 2) return;

    const m = moves + 1;
    setMoves(m);
    const [a, b] = next;
    if (deck[a].index === deck[b].index) {
      const tileId = deck[a].index;
      const pairNo = matched.length; // 0-based index of this match
      setTimeout(() => {
        setMatched((prev) => (prev.includes(tileId) ? prev : [...prev, tileId]));
        setOpen([]);
        setNote(COMPLIMENTS[pairNo % COMPLIMENTS.length]);
      }, 450);
      if (pairNo + 1 === PAIRS) {
        const score = Math.max(1, Math.min(MAX_SCORE, MAX_SCORE - Math.max(0, m - PAR)));
        setTimeout(() => {
          api.finish({
            score,
            max: MAX_SCORE,
            perfect: m <= PAR,
            label: `All six pairs reunited in ${m} moves.`,
          });
        }, 1400);
      }
    } else {
      setTimeout(() => setOpen([]), 1000);
    }
  };

  return (
    <div className="flex flex-col items-center gap-5">
      <p className="max-w-md text-center text-sm qa-muted">
        Flip two cards at a time and find all six matching pairs. Every match comes with one
        small compliment, free of charge.
      </p>

      <div className="flex gap-6 font-semibold">
        <span>Moves: {moves}</span>
        <span>Pairs: {matched.length}/{PAIRS}</span>
      </div>

      <div aria-live="polite" className="min-h-6 text-center text-sm italic qa-muted">
        <AnimatePresence mode="wait">
          {note && (
            <motion.p
              key={note}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: EASE }}
            >
              “{note}”
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className="grid w-full max-w-xl grid-cols-3 gap-3 sm:grid-cols-4" role="group" aria-label="Card grid">
        {deck.map((tile, i) => {
          const isMatched = matched.includes(tile.index);
          const faceUp = isMatched || open.includes(i);
          return (
            <button
              key={i}
              onClick={() => flip(i)}
              disabled={faceUp}
              aria-label={faceUp ? `Card ${i + 1}: ${tile.name}` : `Card ${i + 1}, face down`}
              className="group relative aspect-[3/4] w-full [perspective:600px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
            >
              <motion.div
                className="relative h-full w-full [transform-style:preserve-3d]"
                animate={{ rotateY: faceUp ? 180 : 0 }}
                transition={{ duration: motionOK ? 0.5 : 0, ease: EASE }}
              >
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--card)] shadow-sm transition-colors [backface-visibility:hidden] group-hover:bg-[var(--card-2)]">
                  <PawPrint />
                </div>
                <div
                  className={`absolute inset-0 flex items-center justify-center rounded-2xl border p-2 [backface-visibility:hidden] [transform:rotateY(180deg)] ${
                    isMatched
                      ? "border-sage-600 bg-[var(--card-2)]"
                      : "border-[var(--line)] bg-[var(--card-2)]"
                  }`}
                >
                  <TileArt tile={tile} />
                </div>
              </motion.div>
            </button>
          );
        })}
      </div>

      <p className="text-xs qa-muted">
        Ten thousand tiles sleep beneath the sand. Six of them surface tonight.
      </p>
    </div>
  );
}
