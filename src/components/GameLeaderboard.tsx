import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BlurReveal } from "./motion";
import { Chip } from "./ui";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { dailyEntryFor, DAILY_COMPLETED_EVENT } from "../lib/storage";
import { todayKey } from "../lib/date";
import type { GameId } from "../types";

/**
 * Compact per-game leaderboard shown under a game's page — but only once the
 * player has finished *today's daily* for that game. Before that it stays a
 * locked teaser, so the board never spoils whether a daily is worth chasing.
 *
 * Completion is written to localStorage by setDailyCompletion(), which also
 * dispatches DAILY_COMPLETED_EVENT — we listen for it so the board unlocks the
 * moment the round ends, without a reload.
 */

interface Row {
  handle: string;
  score: number;
  rank: number;
}

export function GameLeaderboard({ gameId }: { gameId: GameId }) {
  const { configured, profile } = useAuth();
  const [done, setDone] = useState(() => dailyEntryFor(gameId, todayKey()) !== undefined);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  // unlock live when the daily is finished on this page
  useEffect(() => {
    setDone(dailyEntryFor(gameId, todayKey()) !== undefined);
    const onDone = (e: Event) => {
      const detail = (e as CustomEvent<{ gameId: string; dateKey: string }>).detail;
      if (detail?.gameId === gameId && detail.dateKey === todayKey()) setDone(true);
    };
    window.addEventListener(DAILY_COMPLETED_EVENT, onDone);
    return () => window.removeEventListener(DAILY_COMPLETED_EVENT, onDone);
  }, [gameId]);

  useEffect(() => {
    if (!supabase || !done) return;
    let cancelled = false;
    supabase
      .from("leaderboard_by_game")
      .select("handle, best_score, rank, updated_at")
      .eq("game_id", gameId)
      .order("rank", { ascending: true })
      .limit(10)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setFailed(true);
          return;
        }
        setRows(data.map((r) => ({ handle: r.handle, score: r.best_score, rank: r.rank })));
        setUpdatedAt(data[0]?.updated_at ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [gameId, done]);

  if (!configured) return null;

  return (
    <BlurReveal className="mx-auto mt-8 max-w-3xl px-4 pb-10 sm:px-6">
      <div className="qa-card overflow-hidden rounded-2xl">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-3">
          <p className="text-sm font-semibold">Today's honour roll</p>
          {done && updatedAt && (
            <Chip>
              updated{" "}
              {new Date(updatedAt).toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </Chip>
          )}
        </div>

        {!done ? (
          <p className="px-5 py-8 text-center text-sm qa-muted">
            🔒 Finish today's daily to unveil this game's leaderboard.
          </p>
        ) : failed ? (
          <p className="px-5 py-8 text-center text-sm qa-muted">
            The ledger is out of reach right now. Try again in a little while.
          </p>
        ) : rows === null ? (
          <p className="px-5 py-8 text-center text-sm qa-muted">Consulting the ledger…</p>
        ) : rows.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm qa-muted">
            Nobody here yet — boards fill in after the next daily refresh. Opt in from your{" "}
            <Link to="/account" className="underline">
              account page
            </Link>{" "}
            to appear.
          </p>
        ) : (
          <>
            <ol>
              {rows.map((row) => {
                const mine = profile?.handle != null && row.handle === profile.handle;
                return (
                  <li
                    key={`${row.rank}-${row.handle}`}
                    className={`flex items-center gap-4 border-b border-[var(--line)] px-5 py-2.5 last:border-b-0 ${
                      mine ? "bg-teal-600/10" : ""
                    }`}
                  >
                    <span
                      className={`w-10 shrink-0 font-display text-lg font-semibold ${
                        row.rank <= 3 ? "text-gold-600 dark:text-gold-300" : "qa-muted"
                      }`}
                    >
                      {row.rank <= 3 ? ["🥇", "🥈", "🥉"][row.rank - 1] : `#${row.rank}`}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-semibold">
                      {row.handle}
                      {mine && (
                        <span className="ml-2 text-xs font-bold text-teal-600 dark:text-teal-300">you</span>
                      )}
                    </span>
                    <span className="font-display text-lg font-semibold">{row.score.toLocaleString()}</span>
                  </li>
                );
              })}
            </ol>
            <div className="border-t border-[var(--line)] px-5 py-3 text-right">
              <Link to="/leaderboards" className="text-sm font-semibold underline qa-muted hover:text-[var(--ink)]">
                Full leaderboards →
              </Link>
            </div>
          </>
        )}
      </div>
    </BlurReveal>
  );
}
