import { useCallback, useEffect, useState } from "react";
import { getMatch, joinMatch } from "./versusRepo";
import type { VersusView } from "./types";

/** Loads a match by code and, if the viewer isn't already a participant and a
 *  slot is open, claims the guest seat. Poll `refresh` to see the opponent's
 *  submission in the async flow (realtime replaces polling in pillar 3). */
export function useVersusMatch(code: string) {
  const [view, setView] = useState<VersusView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const v = await getMatch(code);
      setView(v);
      setError(v ? null : "Match not found.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        let v = await getMatch(code);
        if (v && v.you_are === "none" && v.guest_id === null && v.status !== "expired") {
          await joinMatch(code);
          v = await getMatch(code);
        }
        if (alive) {
          setView(v);
          setError(v ? null : "Match not found.");
        }
      } catch (e) {
        if (alive) setError((e as Error).message);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [code]);

  return { view, loading, error, refresh };
}
