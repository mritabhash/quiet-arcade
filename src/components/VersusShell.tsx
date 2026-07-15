import { useCallback, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import type { GameApi, GameResult } from "../types";
import type { VersusView } from "../lib/versus/types";
import { submitScore } from "../lib/versus/versusRepo";
import { Button, Chip } from "./ui";

export function VersusShell({
  view,
  onSubmitted,
  render,
}: {
  view: VersusView;
  onSubmitted: () => void; // parent refreshes to reveal the opponent
  render: (api: GameApi) => ReactNode;
}) {
  const [result, setResult] = useState<GameResult | null>(null);
  const role: "host" | "guest" = view.you_are === "guest" ? "guest" : "host";

  const finish = useCallback(
    (r: GameResult) => {
      setResult((prev) => {
        if (prev) return prev;
        void submitScore(view.id, r.score, r.max, { detail: r.label ?? "" }).then(onSubmitted);
        return r;
      });
    },
    [view.id, onSubmitted],
  );

  const api: GameApi = useMemo(
    () => ({
      seed: view.seed,
      mode: "practice", // versus never writes daily stats
      dateKey: "",
      showExplanations: false,
      finish,
      versus: {
        config: view.config,
        role,
        onProgress: () => {}, // wired up in the realtime pillar
      },
    }),
    [view.seed, view.config, role, finish],
  );

  const me = view.participants.find((p) => p.role === role);
  const them = view.participants.find((p) => p.role !== role);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3 pt-8">
        <h1 className="font-display text-2xl font-semibold sm:text-3xl">Versus — {view.game_id}</h1>
        <div className="flex items-center gap-2">
          <Chip>You: {me?.score ?? "—"}</Chip>
          <Chip>Opponent: {them?.score ?? "waiting…"}</Chip>
        </div>
      </div>

      {result ? (
        <VersusResult view={view} onRefresh={onSubmitted} />
      ) : (
        <div className="mt-6">{render(api)}</div>
      )}
    </div>
  );
}

function VersusResult({ view, onRefresh }: { view: VersusView; onRefresh: () => void }) {
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
        <Link to="/versus">
          <Button variant="secondary">Back to Versus</Button>
        </Link>
      </div>
    </div>
  );
}
