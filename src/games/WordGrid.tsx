import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { GameApi } from "../types";
import { mulberry32, pick } from "../lib/random";
import { ANSWERS, VALID_GUESSES } from "../data/words";
import { loadGameSave, storeGameSave } from "../lib/storage";
import { Button } from "../components/ui";

type LetterState = "correct" | "present" | "absent";

function scoreGuess(guess: string, answer: string): LetterState[] {
  const result: LetterState[] = Array(5).fill("absent");
  const remaining: Record<string, number> = {};
  for (let i = 0; i < 5; i++) {
    if (guess[i] === answer[i]) result[i] = "correct";
    else remaining[answer[i]] = (remaining[answer[i]] ?? 0) + 1;
  }
  for (let i = 0; i < 5; i++) {
    if (result[i] === "correct") continue;
    if (remaining[guess[i]]) {
      result[i] = "present";
      remaining[guess[i]] -= 1;
    }
  }
  return result;
}

const TILE_CLASSES: Record<LetterState, string> = {
  correct: "bg-clay-500 border-clay-500 text-sand-50",
  present: "bg-gold-400 border-gold-400 text-pine-900",
  absent: "bg-[var(--card-2)] border-[var(--line)] text-[var(--muted)] opacity-70",
};

const KEY_ROWS = ["QWERTYUIOP", "ASDFGHJKL", "⏎ZXCVBNM⌫"];

interface WordGridSave {
  guesses: string[];
}

export function WordGridGame({ api }: { api: GameApi }) {
  const answer = useMemo(() => pick(mulberry32(api.seed), ANSWERS), [api.seed]);
  const [guesses, setGuesses] = useState<string[]>(() => {
    if (api.mode === "daily") {
      const save = loadGameSave<WordGridSave>("word-grid", api.dateKey);
      if (save?.guesses.every((g) => VALID_GUESSES.has(g))) return save.guesses;
    }
    return [];
  });
  const [current, setCurrent] = useState("");
  const [shake, setShake] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);

  const solved = guesses.includes(answer);
  const over = solved || guesses.length >= 6;

  const keyState = useMemo(() => {
    const map: Record<string, LetterState> = {};
    const rank = { absent: 0, present: 1, correct: 2 };
    for (const g of guesses) {
      const states = scoreGuess(g, answer);
      for (let i = 0; i < 5; i++) {
        const prev = map[g[i]];
        if (!prev || rank[states[i]] > rank[prev]) map[g[i]] = states[i];
      }
    }
    return map;
  }, [guesses, answer]);

  const submit = useCallback(() => {
    if (over) return;
    if (current.length < 5) {
      setMessage("Five letters needed");
      setShake((s) => s + 1);
      return;
    }
    if (!VALID_GUESSES.has(current)) {
      setMessage("Not in the word list");
      setShake((s) => s + 1);
      return;
    }
    const next = [...guesses, current];
    setGuesses(next);
    setCurrent("");
    setMessage(null);
    if (api.mode === "daily") storeGameSave<WordGridSave>("word-grid", api.dateKey, { guesses: next });
  }, [current, guesses, over, api.mode, api.dateKey]);

  const type = useCallback(
    (key: string) => {
      if (over) return;
      setMessage(null);
      if (key === "⏎" || key === "ENTER") submit();
      else if (key === "⌫" || key === "BACKSPACE") setCurrent((c) => c.slice(0, -1));
      else if (/^[A-Z]$/.test(key)) setCurrent((c) => (c.length < 5 ? c + key : c));
    },
    [over, submit],
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

  useEffect(() => {
    if (over && !finished) {
      const t = setTimeout(() => {
        setFinished(true);
        const tries = guesses.length;
        api.finish({
          score: solved ? 7 - tries : 0,
          max: 6,
          perfect: solved && tries <= 2,
          label: solved
            ? `Solved in ${tries} ${tries === 1 ? "try" : "tries"}.`
            : `The word was ${answer}.`,
        });
      }, 1900);
      return () => clearTimeout(t);
    }
  }, [over, finished, solved, guesses.length, answer, api]);

  return (
    <div className="flex flex-col items-center gap-6">
      <div aria-live="polite" className="h-6 text-sm font-semibold text-clay-600 dark:text-clay-300">
        {message}
      </div>

      <div className="grid grid-rows-6 gap-1.5" role="group" aria-label="Word grid guesses">
        {Array.from({ length: 6 }, (_, row) => {
          const guess = guesses[row];
          const isCurrent = row === guesses.length && !over;
          const states = guess ? scoreGuess(guess, answer) : null;
          return (
            <motion.div
              key={row}
              className="grid grid-cols-5 gap-1.5"
              animate={isCurrent && shake ? { x: [0, -8, 8, -6, 6, 0] } : { x: 0 }}
              transition={{ duration: 0.4 }}
              // re-trigger shake
              custom={shake}
            >
              {Array.from({ length: 5 }, (_, col) => {
                const letter = guess ? guess[col] : isCurrent ? current[col] : undefined;
                const state = states?.[col];
                return (
                  <motion.div
                    key={col}
                    initial={false}
                    animate={
                      state
                        ? { rotateX: [90, 0], transition: { delay: col * 0.22, duration: 0.35 } }
                        : {}
                    }
                    className={`flex h-12 w-12 items-center justify-center rounded-lg border-2 font-display text-xl font-bold uppercase sm:h-14 sm:w-14 ${
                      state
                        ? TILE_CLASSES[state]
                        : letter
                          ? "border-sand-500 bg-[var(--card)] tile-pop"
                          : "border-[var(--line)] bg-[var(--card)]"
                    }`}
                  >
                    {letter}
                  </motion.div>
                );
              })}
            </motion.div>
          );
        })}
      </div>

      <div className="flex w-full max-w-lg flex-col gap-1.5" role="group" aria-label="On-screen keyboard">
        {KEY_ROWS.map((row) => (
          <div key={row} className="flex justify-center gap-1.5">
            {row.split("").map((key) => {
              const st = keyState[key];
              const wide = key === "⏎" || key === "⌫";
              return (
                <button
                  key={key}
                  onClick={() => type(key)}
                  aria-label={key === "⏎" ? "Enter" : key === "⌫" ? "Backspace" : key}
                  className={`flex h-11 items-center justify-center rounded-lg text-sm font-bold transition-all active:translate-y-[2px] ${
                    wide ? "px-4" : "w-8 sm:w-9"
                  } ${
                    st === "correct"
                      ? "bg-clay-500 text-sand-50"
                      : st === "present"
                        ? "bg-gold-400 text-pine-900"
                        : st === "absent"
                          ? "bg-[var(--card-2)] text-[var(--muted)] opacity-60"
                          : "qa-card hover:bg-[var(--card-2)]"
                  }`}
                >
                  {key}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {over && !finished && (
        <p className="text-sm qa-muted" aria-live="polite">
          {solved ? "Lovely." : `It was ${answer}.`}
        </p>
      )}
      {!over && (
        <Button variant="secondary" onClick={submit}>
          Submit guess
        </Button>
      )}
    </div>
  );
}
