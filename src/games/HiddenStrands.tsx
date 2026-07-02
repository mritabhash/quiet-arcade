import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { GameApi } from "../types";
import { mulberry32, pickIndex, shuffled, type Rng } from "../lib/random";
import { STRAND_THEMES } from "../data/strands";
import { Button } from "../components/ui";

const ROWS = 7;
const COLS = 8;
const DIRS: [number, number][] = [
  [0, 1],
  [1, 0],
  [1, 1],
  [-1, 1],
];

interface Placement {
  word: string;
  cells: number[];
}

function buildGrid(words: string[], rng: Rng): { letters: string[]; placements: Placement[] } {
  for (let attempt = 0; attempt < 40; attempt++) {
    const grid: string[] = Array(ROWS * COLS).fill("");
    const placements: Placement[] = [];
    let ok = true;
    for (const word of [...words].sort((a, b) => b.length - a.length)) {
      let placed = false;
      for (let t = 0; t < 300 && !placed; t++) {
        const [dr, dc] = DIRS[Math.floor(rng() * DIRS.length)];
        const len = word.length;
        const rMin = dr === -1 ? len - 1 : 0;
        const rMax = dr === 1 ? ROWS - len : ROWS - 1;
        const cMax = dc === 1 ? COLS - len : COLS - 1;
        if (rMax < rMin || cMax < 0) continue;
        const r0 = rMin + Math.floor(rng() * (rMax - rMin + 1));
        const c0 = Math.floor(rng() * (cMax + 1));
        const cells: number[] = [];
        let fits = true;
        for (let i = 0; i < len; i++) {
          const r = r0 + dr * i;
          const c = c0 + dc * i;
          const idx = r * COLS + c;
          if (grid[idx] !== "" && grid[idx] !== word[i]) {
            fits = false;
            break;
          }
          cells.push(idx);
        }
        if (!fits) continue;
        cells.forEach((idx, i) => (grid[idx] = word[i]));
        placements.push({ word, cells });
        placed = true;
      }
      if (!placed) {
        ok = false;
        break;
      }
    }
    if (ok) {
      const bag = words.join("");
      const letters = grid.map((ch) => (ch === "" ? bag[Math.floor(rng() * bag.length)] : ch));
      return { letters, placements };
    }
  }
  // With a 7x8 grid and 6 short words this is effectively unreachable,
  // but fall back to a deterministic layout just in case.
  const grid: string[] = Array(ROWS * COLS).fill("");
  const placements: Placement[] = [];
  words.forEach((word, i) => {
    const cells = Array.from({ length: word.length }, (_, j) => i * COLS + j);
    cells.forEach((idx, j) => (grid[idx] = word[j]));
    placements.push({ word, cells });
  });
  const bag = words.join("");
  return {
    letters: grid.map((ch) => (ch === "" ? bag[Math.floor(rng() * bag.length)] : ch)),
    placements,
  };
}

const FOUND_COLORS = [
  "bg-teal-500 text-sand-50",
  "bg-clay-500 text-sand-50",
  "bg-sage-600 text-sand-50",
  "bg-gold-500 text-sand-50",
  "bg-teal-700 text-sand-50",
  "bg-clay-700 text-sand-50",
];

function lineBetween(a: number, b: number): number[] | null {
  const r1 = Math.floor(a / COLS), c1 = a % COLS;
  const r2 = Math.floor(b / COLS), c2 = b % COLS;
  const dr = Math.sign(r2 - r1), dc = Math.sign(c2 - c1);
  if (dr === 0 && dc === 0) return [a];
  if (dr !== 0 && dc !== 0 && Math.abs(r2 - r1) !== Math.abs(c2 - c1)) return null;
  const steps = Math.max(Math.abs(r2 - r1), Math.abs(c2 - c1));
  const cells: number[] = [];
  for (let i = 0; i <= steps; i++) cells.push((r1 + dr * i) * COLS + (c1 + dc * i));
  return cells;
}

export function HiddenStrandsGame({ api }: { api: GameApi }) {
  const { theme, letters, placements } = useMemo(() => {
    const rng = mulberry32(api.seed);
    const t = STRAND_THEMES[pickIndex(rng, STRAND_THEMES.length)];
    const built = buildGrid(shuffled(rng, t.words), rng);
    return { theme: t.theme, ...built };
  }, [api.seed]);

  const [found, setFound] = useState<Placement[]>([]);
  const [anchor, setAnchor] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [hints, setHints] = useState(0);
  const [hintCell, setHintCell] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const dragging = useRef(false);

  const foundCellColor = useMemo(() => {
    const map: Record<number, string> = {};
    found.forEach((p, i) => p.cells.forEach((c) => (map[c] = FOUND_COLORS[i % FOUND_COLORS.length])));
    return map;
  }, [found]);

  const preview = useMemo(() => {
    if (anchor === null || hover === null) return new Set<number>();
    return new Set(lineBetween(anchor, hover) ?? []);
  }, [anchor, hover]);

  const finish = (foundCount: number, usedHints: number, gaveUp: boolean) => {
    if (done) return;
    setDone(true);
    setTimeout(() => {
      api.finish({
        score: foundCount,
        max: 6,
        perfect: foundCount === 6 && usedHints === 0,
        label: gaveUp
          ? `${foundCount} of 6 strands found.`
          : usedHints === 0
            ? "Every strand, unaided."
            : `All strands found with ${usedHints} hint${usedHints === 1 ? "" : "s"}.`,
      });
    }, 1200);
  };

  const trySelect = (a: number, b: number) => {
    const cells = lineBetween(a, b);
    if (!cells) return;
    const text = cells.map((i) => letters[i]).join("");
    const reversed = [...text].reverse().join("");
    const hit = placements.find(
      (p) => !found.some((f) => f.word === p.word) && (p.word === text || p.word === reversed),
    );
    if (hit) {
      const nextFound = [...found, hit];
      setFound(nextFound);
      setHintCell(null);
      if (nextFound.length === 6) finish(6, hints, false);
    }
  };

  const onCellDown = (idx: number) => {
    if (done) return;
    dragging.current = true;
    setAnchor(idx);
    setHover(idx);
  };
  const onCellEnter = (idx: number) => {
    if (dragging.current) setHover(idx);
  };
  const onUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    if (anchor !== null && hover !== null && anchor !== hover) {
      trySelect(anchor, hover);
      setAnchor(null);
      setHover(null);
    }
    // if anchor === hover, keep it as a tap-anchor for two-tap selection
  };
  const onCellTap = (idx: number) => {
    if (done) return;
    if (anchor !== null && anchor !== idx) {
      trySelect(anchor, idx);
      setAnchor(null);
      setHover(null);
    }
  };

  const giveHint = () => {
    const remaining = placements.filter((p) => !found.some((f) => f.word === p.word));
    if (!remaining.length) return;
    setHints((h) => h + 1);
    setHintCell(remaining[0].cells[0]);
  };

  return (
    <div className="flex flex-col items-center gap-5" onPointerUp={onUp} onPointerLeave={onUp}>
      <p className="rounded-full bg-teal-100 px-4 py-1.5 text-sm font-bold uppercase tracking-widest text-teal-800 dark:bg-teal-900 dark:text-teal-100">
        Theme: {theme}
      </p>

      <div
        className="grid touch-none select-none gap-1"
        style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
        role="group"
        aria-label="Letter field"
      >
        {letters.map((ch, idx) => {
          const foundCls = foundCellColor[idx];
          const inPreview = preview.has(idx) || anchor === idx;
          return (
            <motion.button
              key={idx}
              onPointerDown={(e) => {
                e.preventDefault();
                onCellDown(idx);
              }}
              onPointerEnter={() => onCellEnter(idx)}
              onClick={() => onCellTap(idx)}
              animate={hintCell === idx ? { scale: [1, 1.2, 1] } : {}}
              transition={hintCell === idx ? { repeat: Infinity, duration: 1.2 } : {}}
              aria-label={`Letter ${ch}`}
              className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold transition-colors sm:h-11 sm:w-11 sm:text-base ${
                foundCls ??
                (inPreview
                  ? "bg-gold-300 text-pine-900"
                  : hintCell === idx
                    ? "bg-gold-200 text-pine-900 ring-2 ring-gold-500"
                    : "qa-card hover:bg-[var(--card-2)]")
              }`}
            >
              {ch}
            </motion.button>
          );
        })}
      </div>

      <div className="flex flex-wrap justify-center gap-2" aria-live="polite">
        {placements.map((p, i) => {
          const isFound = found.some((f) => f.word === p.word);
          return (
            <span
              key={p.word}
              className={`rounded-full px-3 py-1 text-xs font-bold tracking-wide transition-all ${
                isFound
                  ? FOUND_COLORS[found.findIndex((f) => f.word === p.word) % FOUND_COLORS.length]
                  : "qa-card qa-muted"
              }`}
            >
              {isFound ? p.word : "•".repeat(Math.min(p.word.length, 9)) + ` ${i + 1}`}
            </span>
          );
        })}
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" onClick={giveHint} disabled={done}>
          Hint ({hints})
        </Button>
        <Button
          variant="ghost"
          disabled={done}
          onClick={() => {
            setFound(placements);
            finish(found.length, hints, true);
          }}
        >
          Reveal all
        </Button>
      </div>
    </div>
  );
}
