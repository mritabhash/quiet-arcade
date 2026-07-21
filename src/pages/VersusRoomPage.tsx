import { useParams } from "react-router-dom";
import { useVersusMatch } from "../lib/versus/useVersusMatch";
import { VersusShell } from "../components/VersusShell";
import { MapDropGame } from "../games/MapDrop";
import { TriviaGame } from "../games/Trivia";

export function VersusRoomPage() {
  const { code = "" } = useParams();
  const {
    view,
    loading,
    error,
    refresh,
    peers,
    opponentProgress,
    started,
    sendStart,
    sendProgress,
    sendSubmitted,
  } = useVersusMatch(code.toUpperCase());

  if (loading) return <p className="mx-auto max-w-2xl px-4 pt-16 qa-muted">Loading match…</p>;
  if (error || !view)
    return <p className="mx-auto max-w-2xl px-4 pt-16 qa-muted">{error ?? "Match not found."}</p>;

  const link = `${window.location.origin}${import.meta.env.BASE_URL}versus/${view.code}`;

  return (
    <div>
      {view.status === "open" && (
        <div className="mx-auto max-w-6xl px-4 pt-6">
          <p className="qa-muted text-sm">
            Share this link with your opponent:{" "}
            <code className="rounded bg-[var(--card-2)] px-2 py-1">{link}</code>
          </p>
        </div>
      )}
      <VersusShell
        view={view}
        onSubmitted={refresh}
        peers={peers}
        opponentProgress={opponentProgress}
        started={started}
        onStart={sendStart}
        sendProgress={sendProgress}
        sendSubmitted={sendSubmitted}
        render={(api) => {
          if (view.game_id === "map-drop") return <MapDropGame api={api} />;
          if (view.game_id === "trivia") return <TriviaGame api={api} />;
          return <p className="qa-muted">This game isn't wired for Versus yet.</p>;
        }}
      />
    </div>
  );
}
