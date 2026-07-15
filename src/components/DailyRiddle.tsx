import { useState } from "react";
import { BlurReveal } from "./motion";
import { riddleForDate } from "../data/riddles";
import { todayKey } from "../lib/date";

/**
 * The day's riddle — one per midnight, same for every visitor, drawn from the
 * 100-riddle ledger. Sits between the hero and the knight's vigil. The answer
 * stays veiled until asked for.
 */
export function DailyRiddle() {
  const riddle = riddleForDate(todayKey());
  const [revealed, setRevealed] = useState(false);

  return (
    <section aria-label="Riddle of the day" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-3xl text-center">
        <BlurReveal>
          <p className="qa-fleuron mx-auto max-w-xs text-xs font-semibold uppercase tracking-[0.32em] text-teal-600 dark:text-teal-300">
            riddle of the day
          </p>
        </BlurReveal>
        <BlurReveal delay={0.12}>
          <p className="rune-glow mt-6 font-display text-4xl font-semibold leading-tight text-pine-900 dark:text-sand-50 sm:text-5xl md:text-6xl">
            “{riddle.q}”
          </p>
        </BlurReveal>
        <BlurReveal delay={0.24}>
          <div className="mt-8" aria-live="polite">
            {revealed ? (
              <p className="font-display text-3xl font-semibold text-gold-600 dark:text-gold-300">
                {riddle.a}
              </p>
            ) : (
              <button
                onClick={() => setRevealed(true)}
                className="inline-flex items-center gap-2 border border-gold-600/50 bg-sand-50/60 px-6 py-2.5 font-display text-lg text-pine-900 backdrop-blur transition-colors hover:bg-sand-50 dark:border-gold-400/40 dark:bg-pine-900/60 dark:text-sand-50 dark:hover:bg-pine-900"
              >
                🔮 Unveil the answer
              </button>
            )}
          </div>
        </BlurReveal>
        <BlurReveal delay={0.3}>
          <p className="mt-6 text-sm qa-muted">A new riddle is inscribed each midnight.</p>
        </BlurReveal>
      </div>
    </section>
  );
}
