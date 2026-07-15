import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GameApi } from "../types";
import { rngFor, sample } from "../lib/random";
import {
  ROUND_SIZE,
  TRIVIA_TARGET_PER_TOPIC,
  TRIVIA_TOPICS,
  drawRound,
  swapQuestion,
  type TopicChoice,
  type TriviaMode,
  type TriviaQuestion,
} from "../data/trivia";
import { EASE } from "../components/motion";
import { AndrewGlowbug } from "../components/AndrewGlowbug";
import { fetchRound } from "../data/trivia/opentdb";

/** points per question slot, before the mode multiplier */
const LADDER = [100, 100, 100, 150, 150, 150, 200, 200, 200, 250, 250, 300, 300, 350, 400];
const MODE_MULT: Record<TriviaMode, number> = { easy: 1, moderate: 1.5, hard: 2 };
const STREAK_CAP = 150;

const MODES: { id: TriviaMode; name: string; blurb: string }[] = [
  { id: "easy", name: "Easy", blurb: "Gentle questions · pack 1 lifeline" },
  { id: "moderate", name: "Moderate", blurb: "A fair riddle · pack 2 lifelines" },
  { id: "hard", name: "Hard", blurb: "Deep-vault stuff · pack 3 lifelines" },
];
const ALLOWANCE: Record<TriviaMode, number> = { easy: 1, moderate: 2, hard: 3 };

type LifelineId = "fifty" | "plusOne" | "swap" | "hint";
const LIFELINES: { id: LifelineId; name: string; blurb: string }[] = [
  { id: "fifty", name: "50-50", blurb: "Clears two wrong options." },
  { id: "plusOne", name: "Plus One", blurb: "Arm it before answering — a miss earns a second guess." },
  { id: "swap", name: "Topic Swap", blurb: "Trade the question for one from another topic." },
  { id: "hint", name: "Host Hint", blurb: "The host leans in with a clue." },
];

/** +25 per correct answer past the second in a row, capped per question */
function streakBonus(streak: number): number {
  return streak >= 3 ? Math.min(STREAK_CAP, 25 * (streak - 2)) : 0;
}

function maxPoints(mode: TriviaMode): number {
  let total = 0;
  for (let i = 0; i < ROUND_SIZE; i++) total += LADDER[i] * MODE_MULT[mode] + streakBonus(i + 1);
  return total;
}

const RANKS: { at: number; title: string }[] = [
  { at: 1, title: "Walking Encyclopedia" },
  { at: 0.75, title: "Trivia Star" },
  { at: 0.5, title: "Quiz Whiz" },
  { at: 0.25, title: "Curious Mind" },
  { at: 0, title: "Warm-Up Wanderer" },
];

function rankFor(share: number): string {
  return RANKS.find((r) => share >= r.at)?.title ?? RANKS[RANKS.length - 1].title;
}

/** kind words at Q5 / Q10 / Q15 — a cozy game celebrates showing up */
const MILESTONES: Record<number, string> = {
  4: "Five down — the lantern likes your pace.",
  9: "Ten answered. The vault hums approvingly.",
  14: "All fifteen. However the tally reads, well wandered.",
};

interface TriviaSetup {
  topic: TopicChoice;
  mode: TriviaMode;
  lifelines: LifelineId[];
}

const SETUP_KEY = "quietArcade.triviaSetup";
const DEFAULT_SETUP: TriviaSetup = { topic: "misc", mode: "easy", lifelines: ["fifty"] };

function readSetup(): TriviaSetup {
  try {
    const raw = JSON.parse(localStorage.getItem(SETUP_KEY) ?? "") as Partial<TriviaSetup>;
    const topic =
      raw.topic === "misc" || TRIVIA_TOPICS.includes(raw.topic as (typeof TRIVIA_TOPICS)[number])
        ? (raw.topic as TopicChoice)
        : DEFAULT_SETUP.topic;
    const mode = MODES.some((m) => m.id === raw.mode) ? (raw.mode as TriviaMode) : DEFAULT_SETUP.mode;
    const ids = LIFELINES.map((l) => l.id);
    const lifelines = Array.isArray(raw.lifelines)
      ? raw.lifelines.filter((l): l is LifelineId => ids.includes(l as LifelineId)).slice(0, ALLOWANCE[mode])
      : [...DEFAULT_SETUP.lifelines];
    return { topic, mode, lifelines };
  } catch {
    return { ...DEFAULT_SETUP, lifelines: [...DEFAULT_SETUP.lifelines] };
  }
}

const keyOf = (q: TriviaQuestion) => q.q + "::" + q.choices[q.answer];

export function TriviaGame({ api }: { api: GameApi }) {
  const [setup, setSetup] = useState<TriviaSetup>(readSetup);
  const [phase, setPhase] = useState<"setup" | "play">("setup");
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  /** live rounds come from OpenTDB; falls back to the local vault when offline */
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<"live" | "vault" | "fallback" | null>(null);

  const [index, setIndex] = useState(0);
  const [points, setPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [finalPick, setFinalPick] = useState<number | null>(null);
  const [lastGain, setLastGain] = useState(0);
  const [struck, setStruck] = useState<number[]>([]);
  const [armed, setArmed] = useState(false);
  const [secondChance, setSecondChance] = useState(false);
  const [hintOn, setHintOn] = useState(false);
  const [used, setUsed] = useState<LifelineId[]>([]);
  /** every wrong pick (second chances included) — Andrew is counting */
  const [misses, setMisses] = useState(0);

  const mult = MODE_MULT[setup.mode];
  const allowance = ALLOWANCE[setup.mode];

  const setMode = (mode: TriviaMode) =>
    setSetup((s) => ({ ...s, mode, lifelines: s.lifelines.slice(0, ALLOWANCE[mode]) }));

  const toggleLifeline = (id: LifelineId) =>
    setSetup((s) => {
      let next = s.lifelines.includes(id) ? s.lifelines.filter((l) => l !== id) : [...s.lifelines, id];
      if (next.length > ALLOWANCE[s.mode]) next = next.slice(next.length - ALLOWANCE[s.mode]);
      return { ...s, lifelines: next };
    });

  const start = async () => {
    localStorage.setItem(SETUP_KEY, JSON.stringify(setup));
    setQuestions([]);
    setSource(null);
    setIndex(0);
    setPoints(0);
    setStreak(0);
    setCorrect(0);
    setFinalPick(null);
    setStruck([]);
    setArmed(false);
    setSecondChance(false);
    setHintOn(false);
    setUsed([]);
    setMisses(0);
    setPhase("play");
    // Easy stays on the local vault (gentle, deterministic). Moderate and Hard
    // fetch real, difficulty-graded questions from OpenTDB, with the vault as
    // the offline safety net so a dropped connection never blocks a round.
    if (setup.mode === "easy") {
      setQuestions(drawRound(api.seed, setup.topic, setup.mode));
      setSource("vault");
      return;
    }
    setLoading(true);
    try {
      const round = await fetchRound(setup.topic, setup.mode);
      setQuestions(round);
      setSource("live");
    } catch {
      setQuestions(drawRound(api.seed, setup.topic, setup.mode));
      setSource("fallback");
    } finally {
      setLoading(false);
    }
  };

  if (phase === "setup") {
    return (
      <div className="flex flex-col gap-6">
        <AndrewGlowbug playing={false} misses={0} />
        <section className="flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-widest qa-muted">Choose a topic</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5" role="group" aria-label="Topics">
            {(["misc", ...TRIVIA_TOPICS] as TopicChoice[]).map((t) => (
              <button
                key={t}
                onClick={() => setSetup((s) => ({ ...s, topic: t }))}
                aria-pressed={setup.topic === t}
                className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors ${
                  setup.topic === t
                    ? "border-teal-600 bg-teal-600 text-sand-50"
                    : "qa-card hover:bg-[var(--card-2)]"
                }`}
              >
                {t === "misc" ? "Misc (a bit of everything)" : t}
              </button>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-widest qa-muted">Choose a mode</p>
          <div className="grid gap-2 sm:grid-cols-3" role="group" aria-label="Modes">
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                aria-pressed={setup.mode === m.id}
                className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                  setup.mode === m.id
                    ? "border-teal-600 bg-teal-600 text-sand-50"
                    : "qa-card hover:bg-[var(--card-2)]"
                }`}
              >
                <span className="block font-semibold">{m.name}</span>
                <span className={`block text-xs ${setup.mode === m.id ? "text-sand-50/80" : "qa-muted"}`}>
                  {m.blurb}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-widest qa-muted">
            Pack your lifelines · {setup.lifelines.length} of {allowance}
          </p>
          <div className="grid gap-2 sm:grid-cols-2" role="group" aria-label="Lifelines">
            {LIFELINES.map((l) => {
              const picked = setup.lifelines.includes(l.id);
              return (
                <button
                  key={l.id}
                  onClick={() => toggleLifeline(l.id)}
                  aria-pressed={picked}
                  className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                    picked ? "border-gold-600 bg-gold-500 text-ink-900" : "qa-card hover:bg-[var(--card-2)]"
                  }`}
                >
                  <span className="block font-semibold">{l.name}</span>
                  <span className={`block text-xs ${picked ? "text-ink-900/70" : "qa-muted"}`}>{l.blurb}</span>
                </button>
              );
            })}
          </div>
          <p className="text-xs qa-muted">Each lifeline works once per round — picking a new one swaps out the oldest.</p>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs qa-muted">
            Fifteen questions from a vault of {(TRIVIA_TARGET_PER_TOPIC * TRIVIA_TOPICS.length).toLocaleString()}.
            Misses never cost points.
          </p>
          <button
            onClick={start}
            className="rounded-xl bg-teal-600 px-6 py-2.5 font-semibold text-sand-50 transition-colors hover:bg-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          >
            Open the vault
          </button>
        </div>
      </div>
    );
  }

  if (loading || questions.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <AndrewGlowbug playing={false} misses={0} />
        <div className="qa-card grain flex flex-col items-center gap-3 rounded-2xl p-10 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" aria-hidden />
          <p className="text-sm qa-muted" aria-live="polite">
            Summoning fifteen fresh {setup.mode} questions from the Open Trivia DB…
          </p>
        </div>
      </div>
    );
  }

  const q = questions[index];
  const answered = finalPick !== null;
  const correctPick = answered && finalPick === q.answer;
  const worth = LADDER[index] * mult;
  const isLast = index + 1 >= questions.length;

  const lifelineReady = (id: LifelineId) => setup.lifelines.includes(id) && !used.includes(id) && !answered;
  const consume = (id: LifelineId) => setUsed((u) => [...u, id]);

  const useFifty = () => {
    if (!lifelineReady("fifty")) return;
    const wrongs = q.choices.map((_, i) => i).filter((i) => i !== q.answer && !struck.includes(i));
    setStruck((s) => [...s, ...sample(rngFor([api.seed, "fifty", index]), wrongs, 2)]);
    consume("fifty");
  };

  const armPlusOne = () => {
    if (!lifelineReady("plusOne")) return;
    setArmed(true);
    consume("plusOne");
  };

  const useSwap = () => {
    if (!lifelineReady("swap") || secondChance) return;
    const next = swapQuestion(api.seed, setup.mode, q.topic, new Set(questions.map(keyOf)));
    if (!next) return;
    setQuestions((qs) => qs.map((old, i) => (i === index ? next : old)));
    setStruck([]);
    setHintOn(false);
    consume("swap");
  };

  const useHint = () => {
    if (!lifelineReady("hint")) return;
    setHintOn(true);
    consume("hint");
  };

  const LIFELINE_ACTIONS: Record<LifelineId, { act: () => void; blocked: boolean }> = {
    fifty: { act: useFifty, blocked: false },
    plusOne: { act: armPlusOne, blocked: armed },
    swap: { act: useSwap, blocked: secondChance },
    hint: { act: useHint, blocked: hintOn },
  };

  const pick = (i: number) => {
    if (answered || struck.includes(i)) return;
    if (i !== q.answer) setMisses((m) => m + 1);
    if (i !== q.answer && armed && !secondChance) {
      // Plus One catches the miss — the question stays open
      setStruck((s) => [...s, i]);
      setSecondChance(true);
      return;
    }
    setFinalPick(i);
    if (i === q.answer) {
      const ns = streak + 1;
      const gain = worth + streakBonus(ns);
      setStreak(ns);
      setCorrect((c) => c + 1);
      setPoints((p) => p + gain);
      setLastGain(gain);
    } else {
      setStreak(0);
      setLastGain(0);
    }
  };

  const next = () => {
    if (isLast) {
      const max = maxPoints(setup.mode);
      api.finish({
        score: points,
        max,
        perfect: correct === ROUND_SIZE,
        label: `${rankFor(points / max)} — ${correct} of ${questions.length} on ${setup.mode} mode.`,
      });
    } else {
      setFinalPick(null);
      setStruck([]);
      setArmed(false);
      setSecondChance(false);
      setHintOn(false);
      setIndex(index + 1);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-widest qa-muted">
          Question {index + 1} of {questions.length} · {points.toLocaleString()} pts
          {streak >= 3 ? ` · streak ×${streak}` : ""}
        </p>
        <span className="rounded-full bg-[var(--card-2)] px-3 py-1 text-[10px] font-bold uppercase tracking-widest qa-muted">
          {q.topic} · worth {worth.toLocaleString()}
        </span>
      </div>

      {setup.lifelines.length > 0 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Lifelines">
          {setup.lifelines.map((id) => {
            const meta = LIFELINES.find((l) => l.id === id)!;
            const { act, blocked } = LIFELINE_ACTIONS[id];
            // an armed Plus One is working, not spent — it only reads as used
            // once the question resolves or the second chance is burned
            const armedNow = id === "plusOne" && armed && !answered && !secondChance;
            const spent = used.includes(id) && !armedNow;
            const disabled = spent || blocked || answered;
            return (
              <button
                key={id}
                onClick={act}
                disabled={disabled}
                title={meta.blurb}
                className={`rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors ${
                  armedNow
                    ? "border-gold-600 bg-gold-500 text-ink-900"
                    : spent
                      ? "qa-card opacity-40 line-through"
                      : disabled
                        ? "qa-card opacity-60"
                        : "qa-card hover:bg-[var(--card-2)]"
                }`}
              >
                {meta.name}
                {armedNow ? " (armed)" : ""}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-start gap-3">
        <AndrewGlowbug playing misses={misses} rights={correct} />
        <AnimatePresence mode="wait">
        <motion.div
          key={`${index}:${q.q}`}
          initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="flex min-w-0 flex-1 flex-col gap-4"
        >
          <div className="qa-card grain rounded-2xl p-5">
            <p className="font-display text-lg font-semibold leading-relaxed sm:text-xl">{q.q}</p>
            {hintOn && (
              <p className="mt-3 text-sm italic qa-muted" aria-live="polite">
                Host hint: {q.hint || `It starts with “${q.choices[q.answer][0]}”.`}
              </p>
            )}
            {secondChance && !answered && (
              <p className="mt-3 text-sm qa-muted" aria-live="polite">
                Not that one — but Plus One holds the door. Guess again.
              </p>
            )}
          </div>

          <div className="grid gap-2 sm:grid-cols-2" role="group" aria-label="Answers">
            {q.choices.map((option, i) => {
              const isCorrect = answered && i === q.answer;
              const isWrongPick = answered && finalPick === i && i !== q.answer;
              const isStruck = struck.includes(i);
              return (
                <motion.button
                  key={option}
                  whileTap={answered || isStruck ? undefined : { scale: 0.97 }}
                  onClick={() => pick(i)}
                  disabled={answered || isStruck}
                  className={`rounded-xl border px-4 py-3 text-left font-semibold transition-colors ${
                    isCorrect
                      ? "border-sage-600 bg-sage-500 text-sand-50"
                      : isWrongPick
                        ? "border-clay-600 bg-clay-500 text-sand-50"
                        : isStruck
                          ? "qa-card opacity-35 line-through"
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
              className="flex flex-col gap-2"
            >
              <p className="text-sm qa-muted" aria-live="polite">
                {correctPick
                  ? `Correct — +${lastGain.toLocaleString()} points.${streak >= 3 ? " The streak glows." : ""}`
                  : `The answer was “${q.choices[q.answer]}”. No points lost — onward.`}
                {api.showExplanations && q.note ? ` ${q.note}` : ""}
              </p>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-gold-600" aria-live="polite">
                  {MILESTONES[index] ?? ""}
                </p>
                <button
                  onClick={next}
                  className="rounded-xl bg-teal-600 px-5 py-2.5 font-semibold text-sand-50 transition-colors hover:bg-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                >
                  {isLast ? "Finish round" : "Next question"}
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
        </AnimatePresence>
      </div>

      <p className="text-xs qa-muted">
        {MODES.find((m) => m.id === setup.mode)?.name} mode ·{" "}
        {setup.topic === "misc" ? "a blend of all nine topics" : setup.topic} ·{" "}
        {source === "live"
          ? "live from the Open Trivia DB"
          : source === "fallback"
            ? "from the offline vault (OpenTDB unreachable)"
            : `from the offline vault of ${(TRIVIA_TARGET_PER_TOPIC * TRIVIA_TOPICS.length).toLocaleString()}`}
      </p>
    </div>
  );
}
