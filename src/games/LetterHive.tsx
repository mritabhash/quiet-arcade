import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GameApi } from "../types";
import { mulberry32, pickIndex, shuffled } from "../lib/random";
import { HIVES, HIVE_RANKS } from "../data/hives";
import { loadGameSave, storeGameSave } from "../lib/storage";
import { Button } from "../components/ui";
import { Progress } from "../components/motion";

function wordPoints(word: string, allLetters: string[]): number {
  const base = word.length === 4 ? 1 : word.length;
  const isPangram = allLetters.every((l) => word.includes(l));
  return base + (isPangram ? 7 : 0);
}

interface HiveSave {
  found: string[];
}

export function LetterHiveGame({ api }: { api: GameApi }) {
  const hive = useMemo(() => {
    const rng = mulberry32(api.seed);
    return HIVES[pickIndex(rng, HIVES.length)];
  }, [api.seed]);

  const allLetters = useMemo(() => [hive.center, ...hive.outer], [hive]);
  const totalPoints = useMemo(
    () => hive.words.reduce((sum, w) => sum + wordPoints(w, allLetters), 0),
    [hive, allLetters],
  );

  const [found, setFound] = useState<string[]>(() => {
    if (api.mode === "daily") {
      const save = loadGameSave<HiveSave>("letter-hive", api.dateKey);
      if (save?.found.every((w) => hive.words.includes(w))) return save.found;
    }
    return [];
  });
  const [entry, setEntry] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [shake, setShake] = useState(0);
  const [outerOrder, setOuterOrder] = useState<string[]>(hive.outer);
  const [done, setDone] = useState(false);

  const points = found.reduce((s, w) => s + wordPoints(w, allLetters), 0);
  const frac = totalPoints ? points / totalPoints : 0;
  const rank = [...HIVE_RANKS].reverse().find((r) => frac >= r.frac) ?? HIVE_RANKS[0];

  const submit = useCallback(() => {
    const word = entry.toUpperCase();
    setEntry("");
    if (word.length < 4) return flag("Four letters or more");
    if (!word.includes(hive.center)) return flag("Must use the glowing core letter");
    if (![...word].every((ch) => allLetters.includes(ch))) return flag("Unknown letters in there");
    if (found.includes(word)) return flag("Already found");
    if (!hive.words.includes(word)) return flag("Not in this hive's list");
    const nextFound = [...found, word];
    setFound(nextFound);
    const pts = wordPoints(word, allLetters);
    const isPangram = allLetters.every((l) => word.includes(l));
    setNote(isPangram ? `PANGRAM! +${pts}` : `+${pts}`);
    if (api.mode === "daily") storeGameSave<HiveSave>("letter-hive", api.dateKey, { found: nextFound });

    function flag(msg: string) {
      setNote(msg);
      setShake((s) => s + 1);
    }
  }, [entry, hive, allLetters, found, api.mode, api.dateKey]);

  const type = useCallback(
    (ch: string) => {
      setNote(null);
      if (ch === "ENTER") submit();
      else if (ch === "BACKSPACE") setEntry((e) => e.slice(0, -1));
      else if (/^[A-Z]$/.test(ch) && entry.length < 16) setEntry((e) => e + ch);
    },
    [submit, entry.length],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      type(e.key.toUpperCase());
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [type]);

  const finishDay = () => {
    if (done) return;
    setDone(true);
    api.finish({
      score: points,
      max: totalPoints,
      perfect: frac >= 0.6,
      label: `Rank reached: ${rank.name} — ${found.length} words.`,
    });
  };

  const HEX = "polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)";
  const positions = [
    { x: 0, y: -88 },
    { x: 78, y: -44 },
    { x: 78, y: 44 },
    { x: 0, y: 88 },
    { x: -78, y: 44 },
    { x: -78, y: -44 },
  ];

  return (
    <div className="grid items-start gap-8 md:grid-cols-2">
      <div className="flex flex-col items-center gap-6">
        <motion.p
          key={shake}
          animate={shake ? { x: [0, -7, 7, -5, 5, 0] } : undefined}
          transition={{ duration: 0.35 }}
          aria-live="polite"
          className="flex h-12 min-w-[12rem] items-center justify-center rounded-xl qa-card px-4 font-display text-2xl font-bold tracking-[0.2em]"
        >
          {entry || <span className="text-base font-normal tracking-normal qa-muted">type or tap…</span>}
        </motion.p>

        <div className="relative h-[240px] w-[220px]" role="group" aria-label="Hive letters">
          <button
            onClick={() => type(hive.center)}
            aria-label={`Core letter ${hive.center}`}
            className="absolute left-1/2 top-1/2 flex h-[76px] w-[76px] -translate-x-1/2 -translate-y-1/2 items-center justify-center bg-gold-400 font-display text-2xl font-bold text-pine-900 transition-transform hover:scale-105 active:scale-95"
            style={{ clipPath: HEX }}
          >
            {hive.center}
          </button>
          {outerOrder.map((ch, i) => (
            <button
              key={ch}
              onClick={() => type(ch)}
              aria-label={`Letter ${ch}`}
              className="absolute left-1/2 top-1/2 flex h-[76px] w-[76px] items-center justify-center bg-[var(--card-2)] font-display text-2xl font-bold transition-transform hover:scale-105 active:scale-95"
              style={{
                clipPath: HEX,
                transform: `translate(calc(-50% + ${positions[i].x}px), calc(-50% + ${positions[i].y}px))`,
              }}
            >
              {ch}
            </button>
          ))}
        </div>

        <p aria-live="polite" className="h-5 text-sm font-bold text-teal-700 dark:text-teal-300">
          {note}
        </p>

        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => type("BACKSPACE")}>Delete</Button>
          <Button
            variant="secondary"
            onClick={() => setOuterOrder((o) => shuffled(mulberry32(Date.now() % 100000), o))}
          >
            Shuffle
          </Button>
          <Button onClick={submit}>Enter</Button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="qa-card rounded-2xl p-5">
          <div className="flex items-baseline justify-between">
            <p className="font-display text-lg font-semibold">{rank.name}</p>
            <p className="text-sm qa-muted">
              <span className="font-bold text-[var(--ink)]">{points}</span> / {totalPoints} pts
            </p>
          </div>
          <div className="mt-3">
            <Progress value={points} max={totalPoints} accentClass="bg-gold-400" label="Hive rank progress" />
          </div>
          <div className="mt-2 flex justify-between text-[10px] uppercase tracking-wide qa-muted">
            {HIVE_RANKS.map((r) => (
              <span key={r.name} className={frac >= r.frac ? "font-bold text-gold-600 dark:text-gold-300" : ""}>
                {r.name.split(" ")[0]}
              </span>
            ))}
          </div>
        </div>

        <div className="qa-card min-h-28 rounded-2xl p-5">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest qa-muted">
            Found ({found.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            <AnimatePresence>
              {[...found].sort().map((w) => (
                <motion.span
                  key={w}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    allLetters.every((l) => w.includes(l))
                      ? "bg-gold-400 text-pine-900"
                      : "bg-[var(--card-2)]"
                  }`}
                >
                  {w.toLowerCase()}
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <Button onClick={finishDay} disabled={found.length === 0 || done}>
          Finish {api.mode === "daily" ? "day" : "round"} & bank {points} pts
        </Button>
      </div>
    </div>
  );
}
