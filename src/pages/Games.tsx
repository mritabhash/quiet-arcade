import { useState } from "react";
import { GAMES } from "../data/games";
import { GameCard } from "../components/GameCard";
import { BlurReveal } from "../components/motion";
import { loadStats, loadDailyCompletions } from "../lib/storage";
import { todayKey } from "../lib/date";

const TYPES = ["All", "Words", "Logic", "Geography", "Trivia", "Memory", "Comparison"] as const;

export function GamesPage() {
  const [filter, setFilter] = useState<(typeof TYPES)[number]>("All");
  const stats = loadStats();
  const daily = loadDailyCompletions()[todayKey()] ?? {};
  const shown = GAMES.filter((g) => filter === "All" || g.type === filter);

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
      <BlurReveal>
        <h1 className="font-display text-4xl font-semibold">The games</h1>
        <p className="mt-2 max-w-lg qa-muted">
          Fifteen quiet rooms in one arcade. Each has a daily puzzle and endless free play.
        </p>
      </BlurReveal>

      <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Filter by type">
        {TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            aria-pressed={filter === t}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              filter === t
                ? "bg-teal-600 text-sand-50"
                : "qa-card qa-muted hover:bg-[var(--card-2)]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((meta, i) => {
          const pg = stats.perGame[meta.id];
          return (
            <BlurReveal key={meta.id} delay={(i % 3) * 0.07} y={26}>
              <GameCard
                meta={meta}
                best={pg ? { score: pg.best, max: pg.bestMax } : undefined}
                doneToday={!!daily[meta.id]}
              />
            </BlurReveal>
          );
        })}
      </div>
    </div>
  );
}
