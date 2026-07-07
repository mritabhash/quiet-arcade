import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GameApi } from "../types";
import { mulberry32, shuffled } from "../lib/random";
import { TRIVIA_QUESTIONS, TRIVIA_COUNT, type TriviaQuestion } from "../data/trivia";
import { EASE } from "../components/motion";

const ROUNDS = 10;
/** at most this many questions per topic per round */
const TOPIC_CAP = 2;
/** at most this many two-answer questions per round */
const PAIR_CAP = 4;

function drawRound(seed: number): TriviaQuestion[] {
  const rng = mulberry32(seed);
  const order = shuffled(rng, TRIVIA_QUESTIONS.map((_, i) => i));
  const picked: TriviaQuestion[] = [];
  const perTopic: Record<string, number> = {};
  let pairs = 0;
  for (const idx of order) {
    const q = TRIVIA_QUESTIONS[idx];
    if ((perTopic[q.topic] ?? 0) >= TOPIC_CAP) continue;
    if (q.choices.length === 2 && pairs >= PAIR_CAP) continue;
    picked.push(q);
    perTopic[q.topic] = (perTopic[q.topic] ?? 0) + 1;
    if (q.choices.length === 2) pairs++;
    if (picked.length === ROUNDS) break;
  }
  return picked;
}

export function TriviaGame({ api }: { api: GameApi }) {
  const rounds = useMemo(() => drawRound(api.seed), [api.seed]);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);

  const current = rounds[round];
  const answered = choice !== null;
  const correctPick = answered && choice === current.answer;

  const next = () => {
    if (round + 1 >= ROUNDS) {
      api.finish({
        score,
        max: ROUNDS,
        perfect: score === ROUNDS,
        label:
          score === ROUNDS
            ? "A flawless sweep of the vault."
            : `${score} of ${ROUNDS}, from a vault of ${TRIVIA_COUNT.toLocaleString()} questions.`,
      });
    } else {
      setChoice(null);
      setRound(round + 1);
    }
  };

  const pick = (i: number) => {
    if (answered) return;
    setChoice(i);
    if (i === current.answer) setScore((s) => s + 1);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-widest qa-muted">
          Question {round + 1} of {ROUNDS} · {score} correct
        </p>
        <span className="rounded-full bg-[var(--card-2)] px-3 py-1 text-[10px] font-bold uppercase tracking-widest qa-muted">
          {current.topic}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={round}
          initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="flex flex-col gap-4"
        >
          <div className="qa-card grain rounded-2xl p-5">
            <p className="font-display text-lg font-semibold leading-relaxed sm:text-xl">{current.q}</p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2" role="group" aria-label="Answers">
            {current.choices.map((option, i) => {
              const isCorrect = answered && i === current.answer;
              const isWrongPick = answered && choice === i && i !== current.answer;
              return (
                <motion.button
                  key={option}
                  whileTap={answered ? undefined : { scale: 0.97 }}
                  onClick={() => pick(i)}
                  disabled={answered}
                  className={`rounded-xl border px-4 py-3 text-left font-semibold transition-colors ${
                    isCorrect
                      ? "border-sage-600 bg-sage-500 text-sand-50"
                      : isWrongPick
                        ? "border-clay-600 bg-clay-500 text-sand-50"
                        : "qa-card hover:bg-[var(--card-2)] disabled:opacity-60"
                  }`}
                >
                  {option}
                </motion.button>
              );
            })}
          </div>

          {answered && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="flex flex-wrap items-center justify-between gap-3"
            >
              <p className="text-sm qa-muted" aria-live="polite">
                {correctPick ? "Correct." : `The answer was “${current.choices[current.answer]}”.`}
                {api.showExplanations && current.note ? ` ${current.note}` : ""}
              </p>
              <button
                onClick={next}
                className="rounded-xl bg-teal-600 px-5 py-2.5 font-semibold text-sand-50 transition-colors hover:bg-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              >
                {round + 1 >= ROUNDS ? "Finish round" : "Next question"}
              </button>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      <p className="text-xs qa-muted">
        Drawn from a vault of {TRIVIA_COUNT.toLocaleString()} questions across nine topics.
      </p>
    </div>
  );
}
