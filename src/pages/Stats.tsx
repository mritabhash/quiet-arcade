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
import { flagshipStatsFor } from "../lib/flagship";
import type { GameId } from "../types";
import { GameIcon } from "../components/icons";

const FLAGSHIP_IDS: GameId[] = ["map-drop", "time-capsule", "borderline"];

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
    { label: "Dailies finished today", value: `${Object.keys(daily).length} / 12` },
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

      <BlurReveal delay={0.12} className="mt-10">
        <h2 className="font-display text-2xl font-semibold">The flagship expeditions</h2>
        <p className="mt-1 text-sm qa-muted">
          Daily rounds and free play are counted separately for the three big games.
        </p>
      </BlurReveal>
      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        {FLAGSHIP_IDS.map((id, i) => {
          const meta = GAME_INDEX[id];
          const fs = flagshipStatsFor(id);
          const avg = fs.freePlays > 0 ? Math.round(fs.freeScoreSum / fs.freePlays) : 0;
          const rows = [
            ["Daily plays", String(fs.dailyPlays)],
            ["Best daily", fs.bestDailyMax ? `${fs.bestDaily.toLocaleString()}/${fs.bestDailyMax.toLocaleString()}` : "—"],
            ["Perfect dailies", String(fs.perfectDailies)],
            ["Free-play rounds", String(fs.freePlays)],
            ["Best free play", fs.bestFreeMax ? `${fs.bestFree.toLocaleString()}/${fs.bestFreeMax.toLocaleString()}` : "—"],
            ["Average free score", fs.freePlays ? avg.toLocaleString() : "—"],
            ["Wins", String(fs.wins)],
            ["Hints / guesses used", String(fs.hintsUsed)],
          ] as const;
          return (
            <BlurReveal key={id} delay={i * 0.08}>
              <div className="qa-card grain h-full rounded-2xl p-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 shrink-0 rounded-xl bg-[var(--card-2)] p-1.5">
                    <GameIcon id={id} />
                  </div>
                  <p className="font-display text-xl font-semibold">{meta.title}</p>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
                  {rows.map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-[10px] font-bold uppercase tracking-widest qa-muted">{label}</dt>
                      <dd className="text-sm font-semibold">{value}</dd>
                    </div>
                  ))}
                </dl>
                {fs.recentPuzzles.length > 0 && (
                  <p className="mt-3 truncate text-xs qa-muted" title={fs.recentPuzzles.slice(0, 5).join(", ")}>
                    Recently: {fs.recentPuzzles.slice(0, 4).join(", ")}
                  </p>
                )}
              </div>
            </BlurReveal>
          );
        })}
      </div>

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
