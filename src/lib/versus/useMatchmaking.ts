import { useCallback, useEffect, useRef, useState } from "react";
import type { GameId } from "../../types";
import { supabase } from "../supabaseClient";
import { dequeue, enqueue, findMyMatch } from "./versusRepo";
import type { VersusConfig } from "./types";

/**
 * Random matchmaking. `start` enqueues; when the RPC pairs immediately the
 * hook broadcasts `paired` to the waiting player's personal channel and
 * resolves. When parked, it listens on its own channel AND polls
 * `find_my_match()` every 2s (covers a missed broadcast). `cancel` dequeues.
 */

const POLL_MS = 2000;

export type MatchmakingStatus = "idle" | "searching" | "matched";

/** Fire a one-shot `paired` broadcast at the opponent's personal channel. */
function notifyPaired(opponentUid: string, code: string): void {
  if (!supabase) return;
  const sb = supabase;
  const channel = sb.channel(`matchmaking:${opponentUid}`);
  channel.subscribe((status) => {
    if (status === "SUBSCRIBED") {
      void channel
        .send({ type: "broadcast", event: "paired", payload: { code } })
        .finally(() => void sb.removeChannel(channel));
    }
  });
}

export function useMatchmaking() {
  const [status, setStatus] = useState<MatchmakingStatus>("idle");
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const stopWaiting = useCallback(() => {
    cleanupRef.current?.();
    cleanupRef.current = null;
  }, []);

  useEffect(() => stopWaiting, [stopWaiting]);

  const start = useCallback(
    async (gameId: GameId, config: VersusConfig) => {
      if (!supabase) return;
      const sb = supabase;
      setError(null);
      setCode(null);
      setStatus("searching");
      try {
        const res = await enqueue(gameId, config);
        if (res.matched && res.match) {
          // we are the second player; the waiter (host) gets a nudge
          notifyPaired(res.match.host_id, res.match.code);
          setCode(res.match.code);
          setStatus("matched");
          return;
        }

        // parked: listen for the pairing push + poll as a fallback
        const {
          data: { user },
        } = await sb.auth.getUser();
        const uid = user?.id;

        const finish = (matchCode: string) => {
          stopWaiting();
          setCode(matchCode);
          setStatus("matched");
        };

        const channel = uid
          ? sb
              .channel(`matchmaking:${uid}`)
              .on("broadcast", { event: "paired" }, (msg) => {
                const c = (msg.payload as { code?: string }).code;
                if (c) finish(c);
              })
              .subscribe()
          : null;

        const timer = setInterval(() => {
          void findMyMatch()
            .then((m) => {
              if (m) finish(m.code);
            })
            .catch(() => {});
        }, POLL_MS);

        cleanupRef.current = () => {
          clearInterval(timer);
          if (channel) void sb.removeChannel(channel);
        };
      } catch (e) {
        setError((e as Error).message);
        setStatus("idle");
      }
    },
    [stopWaiting],
  );

  const cancel = useCallback(async () => {
    stopWaiting();
    setStatus("idle");
    setCode(null);
    try {
      await dequeue();
    } catch {
      // best-effort; a stale row is ignored by pairing after 2 minutes anyway
    }
  }, [stopWaiting]);

  return { start, cancel, status, code, error };
}
