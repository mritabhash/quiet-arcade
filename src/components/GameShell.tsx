import { useCallback, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import type { GameApi, GameMeta, GameResult, Mode } from "../types";
import { hashSeed } from "../lib/random";
import { todayKey, prettyDate } from "../lib/date";
import {
  dailyEntryFor,
  recordResult,
  setDailyCompletion,
  reportItem,
  loadStats,
  effectiveStreak,
} from "../lib/storage";
import { copyShareText } from "../lib/flagship";
import { useSettings } from "../context/SettingsContext";
import { Button, Chip } from "./ui";
import { Counter, LineConfetti, EASE } from "./motion";
import { GameIcon } from "./icons";

interface ShellState {
  mode: Mode;
  runId: number;
  result: GameResult | null;
}

export function GameShell({
  meta,
  children,
}: {
  meta: GameMeta;
  children: (api: GameApi) => ReactNode;
}) {
  const { settings } = useSettings();
  const dateKey = todayKey();
  const alreadyDone = useMemo(() => dailyEntryFor(meta.id, dateKey), [meta.id, dateKey]);
  const [state, setState] = useState<ShellState>({
    mode: alreadyDone ? "practice" : "daily",
    runId: 1,
    result: null,
  });
  const [reported, setReported] = useState(false);
  const [copied, setCopied] = useState(false);
  const [howToOpen, setHowToOpen] = useState(settings.showExplanations);

  const { mode, runId, result } = state;

  const seed = useMemo(() => {
    return mode === "daily"
      ? hashSeed(`${dateKey}:${meta.id}`)
      : hashSeed(`${meta.id}:practice:${runId}:${Math.floor(Date.now() / 1000)}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, runId, dateKey, meta.id]);

  const finish = useCallback(
    (r: GameResult) => {
      setState((s) => {
        if (s.result) return s;
        recordResult(meta.id, s.mode, r.score, r.max, r.perfect);
        if (s.mode === "daily") {
          setDailyCompletion(meta.id, dateKey, {
            score: r.score,
            max: r.max,
            perfect: r.perfect,
          });
        }
        return { ...s, result: r };
      });
    },
    [meta.id, dateKey],
  );

  const api: GameApi = {
    seed,
    mode,
    dateKey,
    showExplanations: settings.showExplanations,
    finish,
  };

  const switchMode = (m: Mode) => {
    if (m === mode) return;
    setCopied(false);
    setState({ mode: m, runId: runId + 1, result: null });
  };

  const playAgain = () => {
    setCopied(false);
    setState((s) => ({ ...s, runId: s.runId + 1, result: null }));
  };

  const shareResult = async () => {
    if (!result?.share) return;
    const lines = [...result.share];
    if (mode === "daily") {
      lines.push(`Streak: ${effectiveStreak(loadStats())} days`);
    }
    if (await copyShareText(lines.join("\n"))) setCopied(true);
  };

  const dailyLocked = mode === "daily" && !!alreadyDone && !result;

  // map games get a wider shell so the world map has room to breathe
  const wide = meta.id === "map-drop" || meta.id === "time-capsule";

  return (
    <div className={`mx-auto ${wide ? "max-w-6xl" : "max-w-3xl"} px-4 pb-20 sm:px-6`}>
      <div className="flex flex-wrap items-center justify-between gap-4 pt-8">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl qa-card p-2">
            <GameIcon id={meta.id} />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold sm:text-3xl">{meta.title}</h1>
            <p className="text-sm qa-muted">
              {mode === "daily" ? prettyDate(dateKey) : "Practice — unlimited rounds"}
            </p>
          </div>
        </div>
        <div className="flex rounded-xl border border-[var(--line)] bg-[var(--card)] p-1" role="tablist" aria-label="Game mode">
          {(["daily", "practice"] as const).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              onClick={() => switchMode(m)}
              className={`relative rounded-lg px-4 py-1.5 text-sm font-semibold capitalize transition-colors ${
                mode === m ? "text-sand-50" : "qa-muted hover:text-[var(--ink)]"
              }`}
            >
              {mode === m && (
                <motion.span
                  layoutId={`mode-pill-${meta.id}`}
                  className="absolute inset-0 rounded-lg bg-teal-600"
                  transition={{ duration: 0.3, ease: EASE }}
                />
              )}
              <span className="relative">
                {meta.flagship && m === "practice" ? "free play" : m}
              </span>
            </button>
          ))}
        </div>
      </div>

      {settings.showExplanations && (
        <div className="mt-6 overflow-hidden rounded-2xl qa-card">
          <button
            className="flex w-full items-center justify-between px-5 py-3 text-left text-sm font-semibold"
            aria-expanded={howToOpen}
            onClick={() => setHowToOpen((o) => !o)}
          >
            How to play
            <motion.span animate={{ rotate: howToOpen ? 180 : 0 }} className="qa-muted">
              <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6 L8 11 L13 6" />
              </svg>
            </motion.span>
          </button>
          <AnimatePresence initial={false}>
            {howToOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: EASE }}
              >
                <ul className="space-y-1.5 px-5 pb-4 text-sm qa-muted">
                  {meta.howTo.map((line, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-gold-500">✦</span>
                      {line}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <div className="relative mt-6">
        {dailyLocked ? (
          <DailyDonePanel
            meta={meta}
            entry={alreadyDone!}
            onPractice={() => switchMode("practice")}
          />
        ) : (
          <motion.div
            key={`${mode}-${runId}`}
            initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            {children(api)}
          </motion.div>
        )}

        <AnimatePresence>
          {result && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="absolute inset-0 bg-pine-950/60 backdrop-blur-sm" aria-hidden />
              <LineConfetti active={result.perfect} />
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-label="Round result"
                className="qa-card relative w-full max-w-md rounded-3xl p-8 text-center shadow-2xl"
                initial={{ opacity: 0, y: 40, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16 }}
                transition={{ duration: 0.45, ease: EASE }}
              >
                <p className="text-sm font-semibold uppercase tracking-widest qa-muted">
                  {mode === "daily" ? "Daily complete" : "Round complete"}
                </p>
                <p className="mt-4 font-display text-5xl font-semibold">
                  <Counter value={result.score} />
                  <span className="text-2xl qa-muted"> / {result.max}</span>
                </p>
                <p className="mt-3 text-sm qa-muted">
                  {result.label ??
                    (result.perfect
                      ? "A perfect round. The desert approves."
                      : result.score / result.max >= 0.7
                        ? "A fine, quiet result."
                        : "Every day the sand shifts. Tomorrow is new.")}
                </p>
                {result.perfect && (
                  <p className="mt-2 inline-block rounded-full bg-gold-100 px-3 py-1 text-xs font-bold text-gold-700 dark:bg-gold-800 dark:text-gold-100">
                    ✦ Perfect
                  </p>
                )}
                <div className="mt-7 flex flex-wrap justify-center gap-3">
                  {mode === "practice" ? (
                    <Button onClick={playAgain}>
                      {meta.flagship ? (meta.freePlayLabel ?? "Play again") : "Play again"}
                    </Button>
                  ) : (
                    <Button onClick={() => switchMode("practice")}>
                      {meta.freePlayLabel ?? "Keep playing (practice)"}
                    </Button>
                  )}
                  {result.share && (
                    <Button variant="secondary" onClick={shareResult}>
                      {copied ? "Copied ✦" : "Share result"}
                    </Button>
                  )}
                  <Link to="/stats">
                    <Button variant="secondary">View stats</Button>
                  </Link>
                  <Link to="/games">
                    <Button variant="ghost">{meta.flagship ? "Back to Daily Games" : "All games"}</Button>
                  </Link>
                </div>
                <button
                  className="mt-5 text-xs underline decoration-dotted qa-muted hover:text-[var(--ink)] disabled:no-underline"
                  disabled={reported}
                  onClick={() => {
                    reportItem({
                      gameId: meta.id,
                      dateKey,
                      mode,
                      note: "player flagged this puzzle",
                      at: new Date().toISOString(),
                    });
                    setReported(true);
                  }}
                >
                  {reported ? "Thanks — noted for review." : "Something wrong with this puzzle? Report it."}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function DailyDonePanel({
  meta,
  entry,
  onPractice,
}: {
  meta: GameMeta;
  entry: { score: number; max: number; perfect: boolean };
  onPractice: () => void;
}) {
  const stats = loadStats();
  const streak = effectiveStreak(stats);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="qa-card rounded-3xl p-8 text-center"
    >
      <p className="text-sm font-semibold uppercase tracking-widest qa-muted">Today's {meta.title} is done</p>
      <p className="mt-4 font-display text-5xl font-semibold">
        {entry.score}
        <span className="text-2xl qa-muted"> / {entry.max}</span>
      </p>
      {entry.perfect && (
        <p className="mt-2 inline-block rounded-full bg-gold-100 px-3 py-1 text-xs font-bold text-gold-700 dark:bg-gold-800 dark:text-gold-100">
          ✦ Perfect
        </p>
      )}
      <div className="mt-4 flex justify-center gap-2">
        <Chip>Daily scores lock until tomorrow</Chip>
        {streak > 0 && <Chip>🔥 {streak}-day streak</Chip>}
      </div>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Button onClick={onPractice}>{meta.freePlayLabel ?? "Play practice round"}</Button>
        <Link to="/games">
          <Button variant="secondary">{meta.flagship ? "Back to Daily Games" : "All games"}</Button>
        </Link>
      </div>
    </motion.div>
  );
}
