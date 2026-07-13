import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BlurReveal } from "../components/motion";
import { Button, Chip } from "../components/ui";
import { GAMES } from "../data/games";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import type { GameId } from "../types";

/**
 * Public leaderboards, refreshed once a day server-side. The queries name
 * their columns on purpose: the database only grants {handle, score, rank,
 * updated_at} — `select *` would be rejected, and nothing else about a
 * player is ever readable here.
 */

type Tab = "overall" | GameId;

interface Row {
  handle: string;
  score: number;
  rank: number;
}

interface Board {
  rows: Row[];
  updatedAt: string | null;
}

const shortTitle: Record<string, string> = { "mini-crossword": "Crossword", "higher-lower": "Higher/Lower" };

export function LeaderboardPage() {
  const { configured, status, profile } = useAuth();
  const [tab, setTab] = useState<Tab>("overall");
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;
    setLoading(true);
    setFailed(false);

    const fetchBoard = async (): Promise<Board> => {
      if (tab === "overall") {
        const { data, error } = await supabase!
          .from("leaderboard_overall")
          .select("handle, total_points, rank, updated_at")
          .order("rank", { ascending: true })
          .limit(100);
        if (error) throw error;
        return {
          rows: data.map((r) => ({ handle: r.handle, score: r.total_points, rank: r.rank })),
          updatedAt: data[0]?.updated_at ?? null,
        };
      }
      const { data, error } = await supabase!
        .from("leaderboard_by_game")
        .select("handle, best_score, rank, updated_at")
        .eq("game_id", tab)
        .order("rank", { ascending: true })
        .limit(100);
      if (error) throw error;
      return {
        rows: data.map((r) => ({ handle: r.handle, score: r.best_score, rank: r.rank })),
        updatedAt: data[0]?.updated_at ?? null,
      };
    };

    fetchBoard()
      .then((b) => {
        if (!cancelled) setBoard(b);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tab]);

  return (
    <div className="mx-auto max-w-3xl px-4 pt-10 sm:px-6">
      <BlurReveal>
        <h1 className="font-display text-4xl font-semibold">Leaderboards</h1>
        <p className="mt-2 qa-muted">
          The desert's quiet honour roll — refreshed once a day. Only players who opted in
          appear, and only as a handle, a score, and a rank.
        </p>
      </BlurReveal>

      {!configured ? (
        <BlurReveal delay={0.1} className="mt-8">
          <div className="qa-card rounded-2xl p-6">
            <p className="qa-muted">
              This deployment isn't connected to a server, so there are no leaderboards here —
              your own tale lives on the <Link to="/stats" className="underline">Stats</Link> page.
            </p>
          </div>
        </BlurReveal>
      ) : (
        <>
          <BlurReveal delay={0.08} className="mt-6">
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Leaderboard">
              <TabButton active={tab === "overall"} onClick={() => setTab("overall")}>
                ✦ Overall
              </TabButton>
              {GAMES.map((g) => (
                <TabButton key={g.id} active={tab === g.id} onClick={() => setTab(g.id)}>
                  {shortTitle[g.id] ?? g.title}
                </TabButton>
              ))}
            </div>
          </BlurReveal>

          <BlurReveal delay={0.14} className="mt-6">
            <div className="qa-card overflow-hidden rounded-2xl">
              <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-3">
                <p className="text-sm font-semibold">
                  {tab === "overall" ? "Total points, all games" : "Best score"}
                </p>
                {board?.updatedAt && (
                  <Chip>
                    updated{" "}
                    {new Date(board.updatedAt).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </Chip>
                )}
              </div>

              {loading ? (
                <p className="px-5 py-10 text-center text-sm qa-muted">Consulting the ledger…</p>
              ) : failed ? (
                <p className="px-5 py-10 text-center text-sm qa-muted">
                  The ledger is out of reach right now. Try again in a little while.
                </p>
              ) : !board || board.rows.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm qa-muted">
                  Nobody here yet. Boards fill in after the next daily refresh — play today's
                  games and opt in from your account page.
                </p>
              ) : (
                <ol>
                  {board.rows.map((row) => {
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
                          {mine && <span className="ml-2 text-xs font-bold text-teal-600 dark:text-teal-300">you</span>}
                        </span>
                        <span className="font-display text-lg font-semibold">
                          {row.score.toLocaleString()}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          </BlurReveal>

          {status !== "account" && (
            <BlurReveal delay={0.2} className="mt-6">
              <div className="qa-card flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5">
                <p className="text-sm qa-muted">
                  Want your name up there? Make an account, pick a handle, and opt in.
                </p>
                <Link to="/account">
                  <Button variant="secondary">Create account</Button>
                </Link>
              </div>
            </BlurReveal>
          )}
        </>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
        active
          ? "border-teal-600 bg-teal-600 text-sand-50"
          : "border-[var(--line)] bg-[var(--card)] qa-muted hover:text-[var(--ink)]"
      }`}
    >
      {children}
    </button>
  );
}
