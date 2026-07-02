import { useMemo, useState } from "react";
import { motion, Reorder } from "framer-motion";
import type { GameApi } from "../types";
import { mulberry32, sample, shuffled } from "../lib/random";
import { TIME_EVENTS, type TimeEvent } from "../data/events";
import { Button } from "../components/ui";
import { EASE } from "../components/motion";

const COUNT = 6;

function yearLabel(year: number): string {
  return year < 0 ? `${-year} BCE` : `${year}`;
}

export function TimeLensGame({ api }: { api: GameApi }) {
  const initial = useMemo(() => {
    const rng = mulberry32(api.seed);
    const events = sample(rng, TIME_EVENTS, COUNT);
    let order = shuffled(rng, events);
    // make sure the starting order is not already solved
    const sorted = [...events].sort((a, b) => a.year - b.year);
    if (order.every((e, i) => e === sorted[i])) order = [...order].reverse();
    return order;
  }, [api.seed]);

  const [items, setItems] = useState<TimeEvent[]>(initial);
  const [submitted, setSubmitted] = useState<boolean[]>([]);
  const done = submitted.length > 0;

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
    const marks = items.map((e, i) => e === sorted[i]);
    setSubmitted(marks);
    const score = marks.filter(Boolean).length;
    setTimeout(() => {
      setItems(sorted);
      setSubmitted(sorted.map(() => true));
    }, 1500);
    setTimeout(() => {
      api.finish({
        score,
        max: COUNT,
        perfect: score === COUNT,
        label: score === COUNT ? "The timeline flows unbroken." : `${score} of ${COUNT} in their true place.`,
      });
    }, 3100);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest qa-muted">
        <span>Oldest</span>
        <span>drag or use arrows</span>
      </div>

      <Reorder.Group axis="y" values={items} onReorder={done ? () => {} : setItems} className="space-y-2">
        {items.map((event, i) => {
          const mark = submitted[i];
          return (
            <Reorder.Item
              key={event.label}
              value={event}
              dragListener={!done}
              className={`qa-card flex cursor-grab items-center gap-3 rounded-xl px-4 py-3 active:cursor-grabbing ${
                done ? (mark ? "border-sage-500 bg-sage-100 dark:bg-sage-900" : "border-clay-500 bg-clay-100 dark:bg-clay-900") : ""
              }`}
              whileDrag={{ scale: 1.03, boxShadow: "0 12px 24px rgba(60,40,20,0.18)" }}
              transition={{ duration: 0.3, ease: EASE }}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold-400 text-xs font-bold text-pine-900">
                {i + 1}
              </span>
              <p className="flex-1 text-sm font-medium">{event.label}</p>
              {done ? (
                <motion.span
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="font-display text-sm font-bold"
                >
                  {yearLabel(event.year)}
                </motion.span>
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

      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest qa-muted">Most recent</span>
        <Button onClick={submit} disabled={done}>
          Set in stone
        </Button>
      </div>
    </div>
  );
}
