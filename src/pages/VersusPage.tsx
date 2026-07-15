import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { versusAvailable, createMatch } from "../lib/versus/versusRepo";
import type { MapDropVersusConfig } from "../lib/versus/types";
import { Button, Chip } from "../components/ui";

const DIFFICULTIES = ["novice", "easy", "moderate", "hard"] as const;

export function VersusPage() {
  const nav = useNavigate();
  const [difficulty, setDifficulty] = useState<MapDropVersusConfig["difficulty"]>("hard");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!versusAvailable()) {
    return (
      <div className="mx-auto max-w-2xl px-4 pt-16 text-center">
        <h1 className="font-display text-3xl font-semibold">Versus</h1>
        <p className="mt-4 qa-muted">
          1v1 matches need the accounts backend. Once Supabase is configured, you can
          challenge a friend to the same puzzle.
        </p>
        <Link to="/games" className="mt-6 inline-block">
          <Button variant="secondary">Back to games</Button>
        </Link>
      </div>
    );
  }

  const create = async () => {
    setBusy(true);
    setError(null);
    try {
      const m = await createMatch("map-drop", { difficulty });
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

  return (
    <div className="mx-auto max-w-3xl px-4 pt-12">
      <h1 className="font-display text-3xl font-semibold">Versus — 1v1</h1>
      <p className="mt-2 qa-muted">Create a match, share the code, play the same puzzle.</p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div className="qa-card rounded-3xl p-6">
          <h2 className="font-display text-xl font-semibold">Create a Map Drop match</h2>
          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Difficulty">
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                aria-pressed={difficulty === d}
                className={`rounded-lg px-3 py-1 text-sm font-semibold capitalize ${
                  difficulty === d ? "bg-teal-600 text-sand-50" : "qa-muted"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
          <Button className="mt-5" onClick={create} disabled={busy}>
            {busy ? "Creating…" : "Create match"}
          </Button>
        </div>

        <form className="qa-card rounded-3xl p-6" onSubmit={join}>
          <h2 className="font-display text-xl font-semibold">Join by code</h2>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="ABC123"
            maxLength={6}
            aria-label="Match code"
            className="mt-4 w-full rounded-xl border border-[var(--line)] bg-[var(--card-2)] px-4 py-2 font-mono uppercase tracking-widest"
          />
          <Button className="mt-5" type="submit" variant="secondary">
            Join match
          </Button>
        </form>
      </div>

      {error && <Chip className="mt-6">{error}</Chip>}
    </div>
  );
}
