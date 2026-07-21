import { useCallback, useEffect, useRef, useState } from "react";
import { getMatch, joinMatch } from "./versusRepo";
import { openVersusChannel, type VersusChannel } from "./realtime";
import type { VersusProgress, VersusView } from "./types";

/**
 * Loads a match by code and, if the viewer isn't already a participant and a
 * slot is open, claims the guest seat. Once loaded it joins the realtime room
 * for presence + live progress; the opponent's submission auto-refreshes the
 * view. `refresh` stays available as a manual fallback if realtime drops.
 */
export function useVersusMatch(code: string) {
  const [view, setView] = useState<VersusView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [peers, setPeers] = useState<string[]>([]);
  const [opponentProgress, setOpponentProgress] = useState<VersusProgress | null>(null);
  const [started, setStarted] = useState(false);
  const channelRef = useRef<VersusChannel | null>(null);

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

  // Join the realtime room once we know who we are in this match.
  const selfId = view
    ? view.you_are === "guest"
      ? view.guest_id
      : view.you_are === "host"
        ? view.host_id
        : null
    : null;

  useEffect(() => {
    if (!selfId) return;
    const channel = openVersusChannel(code, selfId, {
      onPresence: setPeers,
      onStart: () => setStarted(true),
      onProgress: setOpponentProgress,
      onSubmitted: () => void refresh(),
    });
    channelRef.current = channel;
    return () => {
      channelRef.current = null;
      channel.leave();
    };
  }, [code, selfId, refresh]);

  const sendStart = useCallback(() => {
    channelRef.current?.broadcastStart();
    setStarted(true);
  }, []);

  const sendProgress = useCallback((p: VersusProgress) => {
    channelRef.current?.broadcastProgress(p);
  }, []);

  const sendSubmitted = useCallback(() => {
    channelRef.current?.broadcastSubmitted();
  }, []);

  return {
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
    selfId,
  };
}
