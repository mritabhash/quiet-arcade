import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createMatch, versusAvailable } from "../lib/versus/versusRepo";
import { useMatchmaking } from "../lib/versus/useMatchmaking";
import type { MapDropVersusConfig, TriviaVersusConfig, VersusConfig } from "../lib/versus/types";
import type { GameId } from "../types";
import { TRIVIA_TOPICS } from "../data/trivia";
import { BlurReveal } from "./motion";
import { Button, Chip } from "./ui";

/**
 * Per-game 1v1 entry point, shown on the game's own page (Map Drop, Trivia).
 * Versus lives here rather than in a separate nav section so challenging a
 * friend is one tap from the game you're already looking at. The match room
 * itself still lives at /versus/<code> — that's the shareable link.
 */

export const VERSUS_GAMES: readonly GameId[] = ["map-drop", "trivia"];

const DIFFICULTIES = ["novice", "easy", "moderate", "hard"] as const;
const TRIVIA_MODES = ["easy", "moderate", "hard"] as const;
const LIFELINE_IDS = ["fifty", "plusOne", "swap", "hint"] as const;
const LIFELINE_NAMES: Record<(typeof LIFELINE_IDS)[number], string> = {
  fifty: "50-50",
  plusOne: "Plus One",
  swap: "Topic Swap",
  hint: "Host Hint",
};
const ALLOWANCE: Record<(typeof TRIVIA_MODES)[number], number> = { easy: 1, moderate: 2, hard: 3 };

export function GameVersusPanel({ gameId }: { gameId: GameId }) {
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [difficulty, setDifficulty] = useState<MapDropVersusConfig["difficulty"]>("hard");
  const [topic, setTopic] = useState<string>("misc");
  const [mode, setMode] = useState<(typeof TRIVIA_MODES)[number]>("moderate");
  const [lifelines, setLifelines] = useState<string[]>(["fifty"]);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mm = useMatchmaking();

  // land in the room the moment matchmaking pairs us
  useEffect(() => {
    if (mm.status === "matched" && mm.code) nav(`/versus/${mm.code}`);
  }, [mm.status, mm.code, nav]);

  if (!VERSUS_GAMES.includes(gameId) || !versusAvailable()) return null;
  const isTrivia = gameId === "trivia";

  const currentConfig = (): VersusConfig =>
    isTrivia
      ? ({ topic, mode, lifelines: lifelines.slice(0, ALLOWANCE[mode]) } satisfies TriviaVersusConfig)
      : ({ difficulty } satisfies MapDropVersusConfig);

  const create = async () => {
    setBusy(true);
    setError(null);
    try {
      const m = await createMatch(gameId, currentConfig());
      nav(`/versus/${m.code}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  const join = (e: React.FormEvent) => {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (c) nav(`/versus/${c}`);
  };

  const toggleLifeline = (id: string) =>
    setLifelines((ls) => {
      let next = ls.includes(id) ? ls.filter((l) => l !== id) : [...ls, id];
      if (next.length > ALLOWANCE[mode]) next = next.slice(next.length - ALLOWANCE[mode]);
      return next;
    });

  const pill = (active: boolean) =>
    `rounded-lg px-3 py-1 text-sm font-semibold capitalize transition-colors ${
      active ? "bg-teal-600 text-sand-50" : "qa-card hover:bg-[var(--card-2)]"
    }`;

  /* ------------------------------------------------ searching */
  if (mm.status === "searching") {
    return (
      <section className="mx-auto mt-10 max-w-3xl px-4 sm:px-6">
        <div className="qa-card flex flex-col items-center gap-4 rounded-3xl p-8 text-center">
          <div
            className="h-8 w-8 animate-spin rounded-full border-2 border-teal-600 border-t-transparent"
            aria-hidden
          />
          <p className="text-sm qa-muted" aria-live="polite">
            Finding an opponent… you'll only be paired with someone who picked the same settings.
          </p>
          <Button variant="secondary" onClick={() => void mm.cancel()}>
            Cancel
          </Button>
        </div>
      </section>
    );
  }

  return (
    <BlurReveal>
      <section className="mx-auto mt-10 max-w-3xl px-4 sm:px-6">
        <div className="qa-card grain rounded-3xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-semibold">Challenge someone · 1v1</h2>
              <p className="mt-1 text-sm qa-muted">
                Same puzzle, two players, one winner. Share a code or let the queue find you a
                stranger.
              </p>
            </div>
            <Button variant="secondary" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
              {open ? "Hide" : "Set up a match"}
            </Button>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Button onClick={() => void mm.start(gameId, currentConfig())}>Quick Match</Button>
            <Button variant="secondary" onClick={create} disabled={busy}>
              {busy ? "Creating…" : "Create a code"}
            </Button>
          </div>

          {open && (
            <div className="mt-6 flex flex-col gap-4 border-t border-[var(--line)] pt-5">
              {isTrivia ? (
                <>
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-bold uppercase tracking-widest qa-muted">Topic</p>
                    <div className="flex flex-wrap gap-2" role="group" aria-label="Topic">
                      {["misc", ...TRIVIA_TOPICS].map((t) => (
                        <button key={t} onClick={() => setTopic(t)} aria-pressed={topic === t} className={pill(topic === t)}>
                          {t === "misc" ? "Misc" : t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-bold uppercase tracking-widest qa-muted">Mode</p>
                    <div className="flex flex-wrap gap-2" role="group" aria-label="Mode">
                      {TRIVIA_MODES.map((m) => (
                        <button
                          key={m}
                          onClick={() => {
                            setMode(m);
                            setLifelines((ls) => ls.slice(0, ALLOWANCE[m]));
                          }}
                          aria-pressed={mode === m}
                          className={pill(mode === m)}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-bold uppercase tracking-widest qa-muted">
                      Lifelines · {lifelines.length} of {ALLOWANCE[mode]}
                    </p>
                    <div className="flex flex-wrap gap-2" role="group" aria-label="Lifelines">
                      {LIFELINE_IDS.map((id) => (
                        <button key={id} onClick={() => toggleLifeline(id)} aria-pressed={lifelines.includes(id)} className={pill(lifelines.includes(id))}>
                          {LIFELINE_NAMES[id]}
                        </button>
                      ))}
                    </div>
                  </div>
                  {mode !== "easy" && (
                    <p className="text-xs qa-muted">
                      Moderate and hard matches draw one shared round from the Open Trivia DB,
                      scored by the arcade keeper — answers stay hidden until you lock in.
                    </p>
                  )}
                </>
              ) : (
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-bold uppercase tracking-widest qa-muted">Difficulty</p>
                  <div className="flex flex-wrap gap-2" role="group" aria-label="Difficulty">
                    {DIFFICULTIES.map((d) => (
                      <button key={d} onClick={() => setDifficulty(d)} aria-pressed={difficulty === d} className={pill(difficulty === d)}>
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <form className="flex flex-wrap items-end gap-3" onSubmit={join}>
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <label htmlFor="versus-code" className="text-xs font-bold uppercase tracking-widest qa-muted">
                    Got a code from a friend?
                  </label>
                  <input
                    id="versus-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="ABC123"
                    maxLength={6}
                    className="w-full rounded-xl border border-[var(--line)] bg-[var(--card-2)] px-4 py-2 font-mono uppercase tracking-widest"
                  />
                </div>
                <Button type="submit" variant="secondary">
                  Join
                </Button>
              </form>
            </div>
          )}

          {(error ?? mm.error) && <Chip className="mt-5">{error ?? mm.error}</Chip>}
        </div>
      </section>
    </BlurReveal>
  );
}
