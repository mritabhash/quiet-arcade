import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GameApi } from "../types";
import { mulberry32, pickIndex, shuffled } from "../lib/random";
import { PATTERN_PUZZLES } from "../data/patternGroups";
import { MOMO_LINES, momoLine } from "../data/maMomoLines";
import { MaMomo, type MomoMood } from "../components/MaMomo";
import { Button } from "../components/ui";
import { EASE } from "../components/motion";

const GROUP_COLORS = [
  "bg-sage-300 text-pine-900 dark:bg-sage-700 dark:text-sand-50",
  "bg-gold-300 text-pine-900 dark:bg-gold-600 dark:text-sand-50",
  "bg-teal-300 text-pine-900 dark:bg-teal-700 dark:text-sand-50",
  "bg-clay-300 text-pine-900 dark:bg-clay-700 dark:text-sand-50",
];

export function PatternGroupsGame({ api }: { api: GameApi }) {
  const puzzle = useMemo(() => {
    const rng = mulberry32(api.seed);
    return PATTERN_PUZZLES[pickIndex(rng, PATTERN_PUZZLES.length)];
  }, [api.seed]);

  const [tiles, setTiles] = useState<string[]>(() =>
    shuffled(
      mulberry32(api.seed + 7),
      puzzle.groups.flatMap((g) => g.words),
    ),
  );
  const [selected, setSelected] = useState<string[]>([]);
  const [solvedGroups, setSolvedGroups] = useState<number[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [note, setNote] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const [done, setDone] = useState(false);
  const [momo, setMomo] = useState<{ mood: MomoMood; line: string }>(() => ({
    mood: "watch",
    line: momoLine(MOMO_LINES.greetings),
  }));
  const pokesRef = useRef(0);

  const wordGroup = useMemo(() => {
    const map: Record<string, number> = {};
    puzzle.groups.forEach((g, i) => g.words.forEach((w) => (map[w] = i)));
    return map;
  }, [puzzle]);

  // Ma Momo notices when you drift off mid-lesson.
  useEffect(() => {
    if (done) return;
    const t = setTimeout(() => {
      setMomo({ mood: "watch", line: momoLine(MOMO_LINES.idle) });
    }, 45000);
    return () => clearTimeout(t);
  }, [selected, solvedGroups, mistakes, done]);

  const pokeMomo = () => {
    const n = ++pokesRef.current;
    const pool =
      n <= 2 ? MOMO_LINES.poke1 : n <= 4 ? MOMO_LINES.poke2 : n <= 7 ? MOMO_LINES.poke3 : MOMO_LINES.poke4;
    const mood: MomoMood = n <= 4 ? "annoyed" : n <= 7 ? "scold" : "stern";
    setMomo({ mood, line: momoLine(pool) });
  };

  const finishGame = (solvedCount: number, cleanly: boolean) => {
    if (done) return;
    setDone(true);
    setTimeout(() => {
      api.finish({
        score: solvedCount,
        max: 4,
        perfect: solvedCount === 4 && cleanly,
        label:
          solvedCount === 4
            ? cleanly
              ? "All four groups, not a single slip."
              : "All four groups found."
            : `${solvedCount} of 4 groups found.`,
      });
    }, 1400);
  };

  const toggle = (word: string) => {
    if (done) return;
    setNote(null);
    setSelected((sel) =>
      sel.includes(word) ? sel.filter((w) => w !== word) : sel.length < 4 ? [...sel, word] : sel,
    );
  };

  const submit = () => {
    if (selected.length !== 4 || done) return;
    const groupsHit = new Set(selected.map((w) => wordGroup[w]));
    if (groupsHit.size === 1) {
      const g = [...groupsHit][0];
      const nextSolved = [...solvedGroups, g];
      setSolvedGroups(nextSolved);
      setTiles((t) => t.filter((w) => wordGroup[w] !== g));
      setSelected([]);
      setNote(null);
      if (nextSolved.length === 4) {
        setMomo({
          mood: "celebrate",
          line: momoLine(mistakes === 0 ? MOMO_LINES.winPerfect : MOMO_LINES.win),
        });
        finishGame(4, mistakes === 0);
      } else {
        setMomo({
          mood: "happy",
          line: momoLine(nextSolved.length === 1 ? MOMO_LINES.solveFirst : MOMO_LINES.solve),
        });
      }
    } else {
      const counts = [0, 0, 0, 0];
      selected.forEach((w) => counts[wordGroup[w]]++);
      const oneAway = counts.some((c) => c === 3);
      const nextMistakes = mistakes + 1;
      setMistakes(nextMistakes);
      setNote(oneAway ? "So close — one tile is astray." : "Not a group. Breathe, look again.");
      setShakeKey((k) => k + 1);
      if (nextMistakes >= 4) setMomo({ mood: "sad", line: momoLine(MOMO_LINES.loss) });
      else if (nextMistakes === 3) setMomo({ mood: "stern", line: momoLine(MOMO_LINES.lastChance) });
      else if (nextMistakes === 2) setMomo({ mood: "scold", line: momoLine(MOMO_LINES.scold) });
      else setMomo({ mood: "gasp", line: momoLine(oneAway ? MOMO_LINES.oneAway : MOMO_LINES.gasp) });
      if (nextMistakes >= 4) {
        // reveal everything gently
        setSolvedGroups([0, 1, 2, 3]);
        setTiles([]);
        setSelected([]);
        finishGame(solvedGroups.length, false);
      }
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="space-y-2" aria-live="polite">
        <AnimatePresence>
          {solvedGroups.map((g) => (
            <motion.div
              key={g}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, ease: EASE }}
              className={`rounded-xl px-4 py-3 text-center ${GROUP_COLORS[g]}`}
            >
              <p className="text-xs font-bold uppercase tracking-widest opacity-80">
                {puzzle.groups[g].title}
              </p>
              <p className="font-semibold">{puzzle.groups[g].words.join(" · ")}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <motion.div
        key={shakeKey}
        animate={shakeKey ? { x: [0, -7, 7, -5, 5, 0] } : undefined}
        transition={{ duration: 0.4 }}
        className="grid grid-cols-4 gap-2"
        role="group"
        aria-label="Pattern tiles"
      >
        <AnimatePresence>
          {tiles.map((word) => {
            const isSel = selected.includes(word);
            return (
              <motion.button
                key={word}
                layout
                exit={{ opacity: 0, scale: 0.8 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => toggle(word)}
                aria-pressed={isSel}
                className={`flex min-h-[3.6rem] items-center justify-center rounded-xl border px-1 py-2 text-[11px] font-bold uppercase tracking-wide transition-colors sm:text-sm ${
                  isSel
                    ? "border-pine-700 bg-pine-700 text-sand-50 dark:border-sand-200 dark:bg-sand-200 dark:text-pine-900"
                    : "qa-card hover:bg-[var(--card-2)]"
                }`}
              >
                {word}
              </motion.button>
            );
          })}
        </AnimatePresence>
      </motion.div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2" aria-label={`${4 - mistakes} tries remaining`}>
          <span className="text-sm qa-muted">Mistakes</span>
          {[0, 1, 2, 3].map((i) => (
            <motion.span
              key={i}
              animate={{ scale: i < mistakes ? 0.6 : 1, opacity: i < mistakes ? 0.35 : 1 }}
              className="h-3 w-3 rounded-full bg-clay-500"
            />
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => setSelected([])} disabled={!selected.length || done}>
            Clear
          </Button>
          <Button onClick={submit} disabled={selected.length !== 4 || done}>
            Submit
          </Button>
        </div>
      </div>

      <p aria-live="polite" className="min-h-5 text-center text-sm font-semibold text-clay-600 dark:text-clay-300">
        {note}
      </p>

      <MaMomo mood={momo.mood} line={momo.line} onPoke={pokeMomo} />
    </div>
  );
}
