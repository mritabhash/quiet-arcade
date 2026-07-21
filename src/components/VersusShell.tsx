import { useCallback, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import type { GameApi, GameResult } from "../types";
import type { VersusProgress, VersusView } from "../lib/versus/types";
import { submitScore } from "../lib/versus/versusRepo";
import { Button, Chip } from "./ui";

/** Trivia moderate/hard scores are written by the versus-trivia Edge Function
 *  (finalize), so the shell must not also call submit_versus_score. */
function isAuthoritativeTrivia(view: VersusView): boolean {
  return view.game_id === "trivia" && (view.config as { mode?: string }).mode !== "easy";
}

export function VersusShell({
  view,
  onSubmitted,
  render,
  peers = [],
  opponentProgress = null,
  started = false,
  onStart,
  sendProgress,
  sendSubmitted,
}: {
  view: VersusView;
  onSubmitted: () => void; // parent refreshes to reveal the opponent
  render: (api: GameApi) => ReactNode;
  /** uids currently present in the realtime room */
  peers?: string[];
  /** opponent's latest live progress broadcast */
  opponentProgress?: VersusProgress | null;
  /** live rooms: has the host broadcast start? */
  started?: boolean;
  onStart?: () => void;
  sendProgress?: (p: VersusProgress) => void;
  sendSubmitted?: () => void;
}) {
  const [result, setResult] = useState<GameResult | null>(null);
  const role: "host" | "guest" = view.you_are === "guest" ? "guest" : "host";
  const opponentId = role === "host" ? view.guest_id : view.host_id;
  const opponentOnline = opponentId !== null && peers.includes(opponentId);

  const finish = useCallback(
    (r: GameResult) => {
      setResult((prev) => {
        if (prev) return prev;
        if (isAuthoritativeTrivia(view)) {
          // the Edge Function already wrote the authoritative participant row
          sendSubmitted?.();
          onSubmitted();
        } else {
          void submitScore(view.id, r.score, r.max, { detail: r.label ?? "" }).then(() => {
            sendSubmitted?.();
            onSubmitted();
          });
        }
        return r;
      });
    },
    [view, onSubmitted, sendSubmitted],
  );

  const api: GameApi = useMemo(
    () => ({
      seed: view.seed,
      mode: "practice", // versus never writes daily stats
      dateKey: "",
      showExplanations: false,
      finish,
      versus: {
        matchId: view.id,
        config: view.config,
        role,
        onProgress: (p: VersusProgress) => sendProgress?.(p),
      },
    }),
    [view.id, view.seed, view.config, role, finish, sendProgress],
  );

  const me = view.participants.find((p) => p.role === role);
  const them = view.participants.find((p) => p.role !== role);
  // A reload after submitting must land on the result, not a fresh game.
  const submitted = result !== null || me?.finished_at != null;

  // Live rooms (realtime / matchmaking) hold at a ready gate until the host
  // starts; async code-shared matches begin immediately.
  const gated = view.live && !started && !submitted;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3 pt-8">
        <h1 className="font-display text-2xl font-semibold sm:text-3xl">Versus — {view.game_id}</h1>
        <div className="flex items-center gap-2">
          <Chip>You: {me?.score ?? "—"}</Chip>
          <Chip>Opponent: {them?.score ?? "waiting…"}</Chip>
        </div>
      </div>

      <OpponentStrip
        online={opponentOnline}
        hasOpponent={opponentId !== null}
        progress={opponentProgress}
        finished={them?.finished_at != null}
      />

      {submitted ? (
        <VersusResult view={view} onRefresh={onSubmitted} />
      ) : gated ? (
        <StartGate role={role} opponentOnline={opponentOnline} onStart={onStart} />
      ) : (
        <div className="mt-6">{render(api)}</div>
      )}
    </div>
  );
}

function OpponentStrip({
  online,
  hasOpponent,
  progress,
  finished,
}: {
  online: boolean;
  hasOpponent: boolean;
  progress: VersusProgress | null;
  finished: boolean;
}) {
  const dot = online ? "bg-sage-500" : "bg-[var(--line)]";
  const label = finished
    ? "Opponent has finished"
    : !hasOpponent
      ? "Waiting for an opponent to join…"
      : !online
        ? "Opponent is offline — the match still resolves when both have played"
        : progress
          ? progress.lockedIn
            ? "Opponent has locked in their answer"
            : progress.step !== undefined
              ? `Opponent — ${progress.score.toLocaleString()} pts · Q${progress.step + 1}`
              : "Opponent is placing their pin…"
          : "Opponent is here";
  return (
    <div className="mt-3 flex items-center gap-2 text-sm qa-muted" aria-live="polite">
      <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden />
      {label}
    </div>
  );
}

function StartGate({
  role,
  opponentOnline,
  onStart,
}: {
  role: "host" | "guest";
  opponentOnline: boolean;
  onStart?: () => void;
}) {
  return (
    <div className="mt-8 qa-card rounded-3xl p-8 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest qa-muted">Live match</p>
      <p className="mt-3 text-sm qa-muted">
        {opponentOnline
          ? role === "host"
            ? "Both players are here. Start when ready — you'll both begin together."
            : "Both players are here. Waiting for the host to start…"
          : "Waiting for your opponent to arrive…"}
      </p>
      {role === "host" && (
        <div className="mt-6 flex justify-center">
          <Button onClick={onStart} disabled={!opponentOnline}>
            {opponentOnline ? "Start the match" : "Waiting…"}
          </Button>
        </div>
      )}
    </div>
  );
}

function VersusResult({ view, onRefresh }: { view: VersusView; onRefresh: () => void }) {
  const backTo = `/games/${view.game_id}`;
  const host = view.participants.find((p) => p.role === "host");
  const guest = view.participants.find((p) => p.role === "guest");
  const complete = view.status === "complete";
  const winner =
    complete && host?.score != null && guest?.score != null
      ? host.score === guest.score
        ? "Tie"
        : host.score > guest.score
          ? "host"
          : "guest"
      : null;

  return (
    <div className="mt-8 qa-card rounded-3xl p-8 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest qa-muted">
        {complete ? "Match complete" : "Your score is in"}
      </p>
      <div className="mt-4 flex items-center justify-center gap-8 font-display text-4xl font-semibold">
        <span>{host?.score ?? "—"}</span>
        <span className="text-base qa-muted">vs</span>
        <span>{guest?.score ?? "—"}</span>
      </div>
      {complete ? (
        <p className="mt-4 text-sm qa-muted">
          {winner === "Tie" ? "A dead heat." : `Winner: the ${winner}.`}
        </p>
      ) : (
        <div className="mt-6 flex justify-center gap-3">
          <Button onClick={onRefresh}>Check for opponent</Button>
        </div>
      )}
      <div className="mt-6 flex justify-center gap-3">
        <Link to={backTo}>
          <Button variant="secondary">Back to the game</Button>
        </Link>
      </div>
    </div>
  );
}
