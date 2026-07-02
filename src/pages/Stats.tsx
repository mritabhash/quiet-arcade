import { useMemo, useState } from "react";
import { BlurReveal, Counter } from "../components/motion";
import { Button, Chip, ConfirmModal } from "../components/ui";
import { GAMES, GAME_INDEX } from "../data/games";
import {
  loadStats,
  loadDailyCompletions,
  resetStats,
  effectiveStreak,
} from "../lib/storage";
import { todayKey, prettyDate } from "../lib/date";
import { GameIcon } from "../components/icons";

export function StatsPage() {
  const [version, setVersion] = useState(0);
  const stats = useMemo(() => loadStats(), [version]);
  const daily = useMemo(() => loadDailyCompletions()[todayKey()] ?? {}, [version]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const streak = effectiveStreak(stats);
  const mostPlayed = useMemo(() => {
    let best: { id: string; plays: number } | null = null;
    for (const [id, pg] of Object.entries(stats.perGame)) {
      if (pg && (!best || pg.plays > best.plays)) best = { id, plays: pg.plays };
    }
    return best ? GAME_INDEX[best.id as keyof typeof GAME_INDEX] : null;
  }, [stats]);

  const headline = [
    { label: "Games played", value: stats.totalPlays },
    { label: "Current daily streak", value: streak },
    { label: "Longest daily streak", value: stats.longestStreak },
    { label: "Perfect rounds", value: stats.perfectRounds },
  ];

  const secondary = [
    { label: "Daily challenges completed", value: String(stats.dailyCompleted) },
    { label: "Practice rounds played", value: String(stats.practiceRounds) },
    { label: "Dailies finished today", value: `${Object.keys(daily).length} / 10` },
    { label: "Last played", value: stats.lastPlayed ? prettyDate(stats.lastPlayed) : "Never — yet" },
    { label: "Most played game", value: mostPlayed ? mostPlayed.title : "No favourite yet" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
      <BlurReveal>
        <h1 className="font-display text-4xl font-semibold">Your quiet record</h1>
        <p className="mt-2 max-w-lg qa-muted">
          Everything here lives in this browser's localStorage. Nothing is uploaded, ranked, or
          compared with anyone.
        </p>
      </BlurReveal>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {headline.map((item, i) => (
          <BlurReveal key={item.label} delay={i * 0.08}>
            <div className="qa-card grain rounded-2xl p-6 text-center">
              <p className="font-display text-4xl font-semibold text-teal-700 dark:text-teal-300">
                <Counter value={item.value} />
              </p>
              <p className="mt-1 text-sm qa-muted">{item.label}</p>
            </div>
          </BlurReveal>
        ))}
      </div>

      <BlurReveal delay={0.1} className="mt-4">
        <div className="qa-card flex flex-wrap justify-between gap-x-8 gap-y-3 rounded-2xl px-6 py-5">
          {secondary.map((item) => (
            <div key={item.label}>
              <p className="text-xs font-bold uppercase tracking-widest qa-muted">{item.label}</p>
              <p className="mt-0.5 font-semibold">{item.value}</p>
            </div>
          ))}
        </div>
      </BlurReveal>

      <BlurReveal delay={0.15} className="mt-10">
        <h2 className="font-display text-2xl font-semibold">Game by game</h2>
      </BlurReveal>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {GAMES.map((meta, i) => {
          const pg = stats.perGame[meta.id];
          const today = daily[meta.id];
          return (
            <BlurReveal key={meta.id} delay={(i % 2) * 0.06}>
              <div className="qa-card flex items-center gap-4 rounded-2xl px-5 py-4">
                <div className="h-11 w-11 shrink-0 rounded-xl bg-[var(--card-2)] p-1.5">
                  <GameIcon id={meta.id} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{meta.title}</p>
                  <p className="text-xs qa-muted">
                    {pg
                      ? `Best ${pg.best}/${pg.bestMax} · ${pg.plays} plays · ${pg.perfect} perfect`
                      : "Not played yet"}
                  </p>
                </div>
                {today && <Chip className="shrink-0">✓ today</Chip>}
              </div>
            </BlurReveal>
          );
        })}
      </div>

      <BlurReveal delay={0.1} className="mt-12">
        <div className="rounded-2xl border border-clay-300 bg-clay-50 p-6 dark:border-clay-800 dark:bg-clay-900/30">
          <h2 className="font-display text-lg font-semibold">Reset stats</h2>
          <p className="mt-1 max-w-md text-sm qa-muted">
            Clears all scores, streaks, and daily completions. Settings and saved preferences stay.
          </p>
          <Button variant="danger" className="mt-4" onClick={() => setConfirmOpen(true)}>
            Reset all stats
          </Button>
        </div>
      </BlurReveal>

      <ConfirmModal
        open={confirmOpen}
        title="Reset every stat?"
        body="Streaks, best scores, perfect rounds, and today's completions will be gone. There is no undo."
        confirmLabel="Yes, reset stats"
        onConfirm={() => {
          resetStats();
          setVersion((v) => v + 1);
        }}
        onClose={() => setConfirmOpen(false)}
      />
    </div>
  );
}
