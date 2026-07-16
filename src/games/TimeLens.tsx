import { useMemo, useState } from "react";
import { motion, Reorder } from "framer-motion";
import type { GameApi } from "../types";
import { mulberry32, shuffled } from "../lib/random";
import { TIME_EVENTS, type TimeEvent } from "../data/events";
import { TIME_LENS_GAMES } from "../data/timeLensGames";
import { Button } from "../components/ui";
import { EASE } from "../components/motion";

const COUNT = 6;

function yearLabel(year: number): string {
  return year < 0 ? `${-year} BCE` : `${year}`;
}

function Check() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4 text-sage-600 dark:text-sage-300" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8.5 L6.5 12 L13 4" />
    </svg>
  );
}

function Cross() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4 text-clay-600 dark:text-clay-300" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4 L12 12 M12 4 L4 12" />
    </svg>
  );
}

export function TimeLensGame({ api }: { api: GameApi }) {
  const initial = useMemo(() => {
    const rng = mulberry32(api.seed);
    // draw one of the ten thousand curated games
    const game = TIME_LENS_GAMES[Math.floor(rng() * TIME_LENS_GAMES.length)];
    const events = game.map((idx) => TIME_EVENTS[idx]);
    let order = shuffled(rng, events);
    // make sure the starting order is not already solved
    const sorted = [...events].sort((a, b) => a.year - b.year);
    if (order.every((e, i) => e === sorted[i])) order = [...order].reverse();
    return order;
  }, [api.seed]);

  const [items, setItems] = useState<TimeEvent[]>(initial);
  const [phase, setPhase] = useState<"play" | "review">("play");
  // marks[i] === true when the event the player placed at position i is in its
  // correct chronological slot. Captured at submit, aligned to the player's order.
  const [marks, setMarks] = useState<boolean[]>([]);
  const [score, setScore] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const done = phase === "review";

  const swap = (i: number, j: number) => {
    if (done || j < 0 || j >= items.length) return;
    setItems((prev) => {
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const submit = () => {
    if (done) return;
    const sorted = [...items].sort((a, b) => a.year - b.year);
    const m = items.map((e, i) => e === sorted[i]);
    setMarks(m);
    setScore(m.filter(Boolean).length);
    setPhase("review");
  };

  const revealTrueOrder = () => {
    setItems((prev) => [...prev].sort((a, b) => a.year - b.year));
    setRevealed(true);
  };

  const finish = () => {
    api.finish({
      score,
      max: COUNT,
      perfect: score === COUNT,
      label:
        score === COUNT
          ? "The timeline flows unbroken."
          : `${score} of ${COUNT} in their true place.`,
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest qa-muted">
        <span>Oldest</span>
        <span>{done ? (revealed ? "the true order" : "your answer, checked") : "drag or use arrows"}</span>
      </div>

      <Reorder.Group axis="y" values={items} onReorder={done ? () => {} : setItems} className="space-y-2">
        {items.map((event, i) => {
          // In review (before reveal) rows stay in the player's order, so
          // marks[i] tells whether this slot is right. After reveal the list is
          // already sorted, so every row is the correct answer.
          const mark = revealed ? true : marks[i];
          return (
            <Reorder.Item
              key={event.label}
              value={event}
              dragListener={!done}
              className={`qa-card flex cursor-grab items-center gap-3 rounded-xl px-4 py-3 active:cursor-grabbing ${
                done
                  ? mark
                    ? "border-sage-500 bg-sage-100 dark:bg-sage-900"
                    : "border-clay-500 bg-clay-100 dark:bg-clay-900"
                  : ""
              }`}
              whileDrag={{ scale: 1.03, boxShadow: "0 12px 24px rgba(60,40,20,0.18)" }}
              transition={{ duration: 0.3, ease: EASE }}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold-400 text-xs font-bold text-pine-900">
                {i + 1}
              </span>
              <p className="flex-1 text-sm font-medium">{event.label}</p>
              {done ? (
                <motion.div
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2"
                >
                  {!revealed && (mark ? <Check /> : <Cross />)}
                  <span className="font-display text-sm font-bold tabular-nums">{yearLabel(event.year)}</span>
                </motion.div>
              ) : (
                <span className="flex flex-col">
                  <button
                    aria-label={`Move "${event.label}" up`}
                    onClick={() => swap(i, i - 1)}
                    className="rounded p-0.5 qa-muted hover:bg-[var(--card-2)] hover:text-[var(--ink)]"
                  >
                    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M4 10 L8 5 L12 10" /></svg>
                  </button>
                  <button
                    aria-label={`Move "${event.label}" down`}
                    onClick={() => swap(i, i + 1)}
                    className="rounded p-0.5 qa-muted hover:bg-[var(--card-2)] hover:text-[var(--ink)]"
                  >
                    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M4 6 L8 11 L12 6" /></svg>
                  </button>
                </span>
              )}
            </Reorder.Item>
          );
        })}
      </Reorder.Group>

      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-bold uppercase tracking-widest qa-muted">Most recent</span>
        {!done ? (
          <Button onClick={submit}>Set in stone</Button>
        ) : (
          <div className="flex flex-wrap items-center justify-end gap-3">
            <span className="font-display text-sm font-semibold">
              {score} / {COUNT} correct
            </span>
            {!revealed && (
              <Button variant="secondary" onClick={revealTrueOrder}>
                Reveal true order
              </Button>
            )}
            <Button onClick={finish}>See score</Button>
          </div>
        )}
      </div>

      {done && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-xs qa-muted"
        >
          {revealed
            ? "This is the true chronological order. Take your time, then tap “See score.”"
            : "Green sits in its true place; red is out of order. Reveal the answer or tap “See score” when you’re ready."}
        </motion.p>
      )}
    </div>
  );
}
