import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GameApi } from "../types";
import { mulberry32, sample } from "../lib/random";
import { COUNTRIES } from "../data/countries";
import { Button } from "../components/ui";
import { EASE } from "../components/motion";

const ROUNDS = 3;
const MAX_CLUES = 5;

function normalize(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

export function GlobeHuntGame({ api }: { api: GameApi }) {
  const targets = useMemo(() => sample(mulberry32(api.seed), COUNTRIES, ROUNDS), [api.seed]);
  const [round, setRound] = useState(0);
  const [cluesShown, setCluesShown] = useState(1);
  const [guess, setGuess] = useState("");
  const [wrong, setWrong] = useState<string[]>([]);
  const [roundScores, setRoundScores] = useState<number[]>([]);
  const [solvedName, setSolvedName] = useState<string | null>(null);

  const country = targets[round];
  const done = round >= ROUNDS;

  const advance = (score: number) => {
    const next = [...roundScores, score];
    setRoundScores(next);
    setSolvedName(null);
    setCluesShown(1);
    setWrong([]);
    setGuess("");
    if (next.length >= ROUNDS) {
      const total = next.reduce((a, b) => a + b, 0);
      setTimeout(() => {
        api.finish({
          score: total,
          max: ROUNDS * MAX_CLUES,
          perfect: total >= 12,
          label: `Rounds: ${next.join(" + ")} points.`,
        });
      }, 400);
    } else {
      setRound(round + 1);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guess.trim() || solvedName) return;
    if (normalize(guess) === normalize(country.name)) {
      const score = MAX_CLUES + 1 - cluesShown;
      setSolvedName(country.name);
      setTimeout(() => advance(score), 1600);
    } else {
      setWrong((w) => [...w, guess.trim()]);
      setGuess("");
      if (cluesShown < MAX_CLUES) {
        setCluesShown(cluesShown + 1);
      } else if (wrong.length + 1 >= MAX_CLUES + 2) {
        setSolvedName(country.name);
        setTimeout(() => advance(0), 1900);
      }
    }
  };

  if (done) return null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest qa-muted">
          Country {round + 1} of {ROUNDS}
        </p>
        <p className="text-sm qa-muted">
          Worth <span className="font-bold text-[var(--ink)]">{MAX_CLUES + 1 - cluesShown}</span> pts now
        </p>
      </div>

      <div className="space-y-2.5" aria-live="polite">
        <AnimatePresence initial={false}>
          {country.clues.slice(0, cluesShown).map((clue, i) => (
            <motion.div
              key={`${round}-${i}`}
              initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.5, ease: EASE }}
              className="qa-card flex gap-3 rounded-xl px-4 py-3"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sage-500 text-xs font-bold text-sand-50">
                {i + 1}
              </span>
              <p className="text-sm">{clue}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait">
        {solvedName ? (
          <motion.p
            key="solved"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-xl bg-sage-100 px-4 py-3 text-center font-display text-xl font-semibold text-sage-800 dark:bg-sage-900 dark:text-sage-100"
            aria-live="assertive"
          >
            {country.name}
          </motion.p>
        ) : (
          <motion.form key="form" onSubmit={submit} className="flex gap-2" exit={{ opacity: 0 }}>
            <input
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              list="qa-countries"
              placeholder="Name the country…"
              aria-label="Your country guess"
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--card)] px-4 py-2.5 font-medium outline-none transition-colors focus:border-teal-500"
            />
            <datalist id="qa-countries">
              {COUNTRIES.map((c) => (
                <option key={c.name} value={c.name} />
              ))}
            </datalist>
            <Button type="submit" disabled={!guess.trim()}>Guess</Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setSolvedName(country.name);
                setTimeout(() => advance(0), 1600);
              }}
            >
              Skip
            </Button>
          </motion.form>
        )}
      </AnimatePresence>

      {wrong.length > 0 && !solvedName && (
        <p className="text-sm qa-muted" aria-live="polite">
          Not {wrong.map((w, i) => (
            <span key={i} className="font-semibold line-through">{w}{i < wrong.length - 1 ? ", " : ""}</span>
          ))}
          {" "}— another clue surfaces.
        </p>
      )}

      <div className="flex gap-1.5" aria-label="Round progress">
        {Array.from({ length: ROUNDS }, (_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${
              i < roundScores.length ? "bg-sage-500" : i === round ? "bg-gold-400" : "bg-[var(--card-2)]"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
