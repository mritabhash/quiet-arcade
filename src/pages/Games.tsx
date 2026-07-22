import { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { GAMES } from "../data/games";
import type { GameMeta } from "../types";
import { GameCard } from "../components/GameCard";
import { GameCorridor } from "../components/GameCorridor";
import { BlurReveal, EASE } from "../components/motion";
import { GameIcon } from "../components/icons";
import { Chip } from "../components/ui";
import { loadStats, loadDailyCompletions } from "../lib/storage";
import { todayKey } from "../lib/date";
import { useSettings } from "../context/SettingsContext";

const TYPES = ["All", "Words", "Logic", "Geography", "Trivia", "Memory", "Comparison"] as const;

/** Fisher–Yates — a fresh order of doors every visit. */
function shuffled<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function hasWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (c.getContext("webgl") || c.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

export function GamesPage() {
  const { motionOK, settings } = useSettings();
  const navigate = useNavigate();
  const stats = loadStats();
  const daily = loadDailyCompletions()[todayKey()] ?? {};

  const canCorridor = useMemo(() => motionOK && hasWebGL(), [motionOK]);
  const [mode, setMode] = useState<"corridor" | "list">(canCorridor ? "corridor" : "list");
  const order = useMemo(() => shuffled(GAMES), []);
  const [focused, setFocused] = useState<GameMeta | null>(null);

  if (mode === "corridor") {
    return (
      <CorridorView
        order={order}
        dark={settings.darkMode}
        focused={focused}
        setFocused={setFocused}
        onEnter={(id) => navigate(`/games/${id}`)}
        onList={() => setMode("list")}
        best={(id) => {
          const pg = stats.perGame[id];
          return pg ? { score: pg.best, max: pg.bestMax } : undefined;
        }}
        doneToday={(id) => !!daily[id]}
      />
    );
  }

  return <ListView canCorridor={canCorridor} onCorridor={() => setMode("corridor")} stats={stats} daily={daily} />;
}

/* ------------------------------------------------------------------ corridor */

function CorridorView({
  order,
  dark,
  focused,
  setFocused,
  onEnter,
  onList,
  best,
  doneToday,
}: {
  order: GameMeta[];
  dark: boolean;
  focused: GameMeta | null;
  setFocused: (m: GameMeta | null) => void;
  onEnter: (id: string) => void;
  onList: () => void;
  best: (id: GameMeta["id"]) => { score: number; max: number } | undefined;
  doneToday: (id: GameMeta["id"]) => boolean;
}) {
  const b = focused ? best(focused.id) : undefined;
  const done = focused ? doneToday(focused.id) : false;
  const openRef = useRef<((id: string) => void) | null>(null);

  return (
    <>
      <h1 className="sr-only">The games — walk the cave of doors, or switch to a list</h1>

      <GameCorridor games={order} dark={dark} onEnter={onEnter} onFocusChange={setFocused} openRef={openRef} />

      {/* HUD, portalled to <body> so the route's transform never traps it */}
      {createPortal(
        <div className="pointer-events-none fixed inset-0 z-10">
          {/* title + walking hint, top-centre, clear of the floating nav */}
          <div className="absolute inset-x-0 top-20 flex flex-col items-center px-4 text-center sm:top-24">
            <p className="qa-fleuron w-full max-w-xs text-[11px] font-semibold uppercase tracking-[0.3em] text-gold-600 dark:text-gold-300">
              the cave of doors
            </p>
            <p className="mt-2 max-w-xs text-xs qa-muted">
              Scroll to walk the cave · reach a door · tap it to open
            </p>
          </div>

          {/* list-view escape hatch, bottom-right */}
          <button
            onClick={onList}
            className="pointer-events-auto absolute bottom-6 right-4 inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--bg)]/70 px-4 py-2 text-xs font-semibold backdrop-blur-xl transition-colors hover:bg-[var(--card-2)] sm:right-6"
          >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 4h9M5 8h9M5 12h9M2 4h.01M2 8h.01M2 12h.01" />
            </svg>
            List view
          </button>

          {/* the door you are facing — crisp HTML over the 3D */}
          <AnimatePresence mode="wait">
            {focused && (
              <motion.div
                key={focused.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.4, ease: EASE }}
                className="pointer-events-auto absolute inset-x-0 bottom-20 mx-auto flex max-w-md flex-col items-center px-4 text-center sm:bottom-24"
              >
                <div className="w-full rounded-2xl border border-[var(--line)] bg-[var(--bg)]/80 p-5 shadow-[0_18px_50px_-20px_rgba(0,0,0,0.7)] backdrop-blur-xl">
                  <div className="mx-auto mb-2 h-11 w-11 text-gold-600 dark:text-gold-300">
                    <GameIcon id={focused.id} />
                  </div>
                  <h2 className="font-display text-3xl font-semibold leading-tight">{focused.title}</h2>
                  <p className="mx-auto mt-1.5 max-w-sm text-sm qa-muted">{focused.short}</p>
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
                    <Chip>{focused.type}</Chip>
                    <Chip>{focused.difficulty}</Chip>
                    {done && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-sage-600 px-2.5 py-1 text-xs font-semibold text-sand-50">
                        Sealed today
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => (openRef.current ? openRef.current(focused.id) : onEnter(focused.id))}
                    className="group mt-4 inline-flex items-center gap-2 rounded-xl border border-gold-600/50 bg-clay-500 px-6 py-2.5 font-display text-lg text-sand-50 shadow-[0_10px_24px_-12px_rgba(81,31,18,0.9)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-clay-600 dark:border-gold-400/40"
                  >
                    Open the door
                    <svg viewBox="0 0 16 16" className="h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M3 8 H13 M9 4 L13 8 L9 12" />
                    </svg>
                  </button>
                  {b && (
                    <p className="mt-2 text-xs qa-muted">
                      Best <span className="font-semibold text-[var(--ink)]">{b.score}/{b.max}</span>
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>,
        document.body,
      )}

      {/* keyboard / screen-reader path: every door as a plain link */}
      <nav aria-label="All games" className="sr-only">
        <ul>
          {order.map((g) => (
            <li key={g.id}>
              <Link to={`/games/${g.id}`}>{g.title}</Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}

/* ---------------------------------------------------------------------- list */

function ListView({
  canCorridor,
  onCorridor,
  stats,
  daily,
}: {
  canCorridor: boolean;
  onCorridor: () => void;
  stats: ReturnType<typeof loadStats>;
  daily: Record<string, unknown>;
}) {
  const [filter, setFilter] = useState<(typeof TYPES)[number]>("All");
  const shown = GAMES.filter((g) => filter === "All" || g.type === filter);

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <BlurReveal>
          <h1 className="font-display text-4xl font-semibold">The games</h1>
          <p className="mt-2 max-w-lg qa-muted">
            Fifteen quiet rooms in one arcade. Each has a daily puzzle and endless free play.
          </p>
        </BlurReveal>
        {canCorridor && (
          <button
            onClick={onCorridor}
            className="inline-flex items-center gap-1.5 self-start rounded-full border border-[var(--line)] bg-[var(--card)]/70 px-4 py-2 text-sm font-semibold backdrop-blur transition-colors hover:bg-[var(--card-2)] sm:self-auto"
          >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M8 1.5 L14 5 v6 l-6 3.5 L2 11 V5 Z M8 1.5 V8 M8 8 L2 5 M8 8 l6-3" />
            </svg>
            Walk the hall
          </button>
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Filter by type">
        {TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            aria-pressed={filter === t}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              filter === t ? "bg-teal-600 text-sand-50" : "qa-card qa-muted hover:bg-[var(--card-2)]"
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
