import { supabase } from "../supabaseClient";
import type { VersusProgress } from "./types";

/**
 * Supabase Realtime channel for a Versus match: presence (who's in the room)
 * plus `start` / `progress` / `submitted` broadcasts. Purely additive on top
 * of the durable match rows — if realtime drops, the async flow still works.
 *
 * Nothing secret is ever broadcast: scores and step indices only (both
 * players see identical question content by design).
 */

export interface VersusChannel {
  broadcastStart(): void;
  broadcastProgress(p: VersusProgress): void;
  broadcastSubmitted(): void;
  leave(): void;
}

export interface VersusChannelHandlers {
  /** uids currently present in the room */
  onPresence?: (peers: string[]) => void;
  onStart?: () => void;
  onProgress?: (p: VersusProgress) => void;
  onSubmitted?: () => void;
}

const NOOP: VersusChannel = {
  broadcastStart() {},
  broadcastProgress() {},
  broadcastSubmitted() {},
  leave() {},
};

export function openVersusChannel(
  code: string,
  selfId: string,
  handlers: VersusChannelHandlers,
): VersusChannel {
  if (!supabase) return NOOP;
  const sb = supabase;

  const channel = sb.channel(`versus:${code}`, {
    config: { presence: { key: selfId }, broadcast: { self: false } },
  });

  channel.on("presence", { event: "sync" }, () => {
    handlers.onPresence?.(Object.keys(channel.presenceState()));
  });
  channel.on("broadcast", { event: "start" }, () => handlers.onStart?.());
  channel.on("broadcast", { event: "progress" }, (msg) =>
    handlers.onProgress?.(msg.payload as VersusProgress),
  );
  channel.on("broadcast", { event: "submitted" }, () => handlers.onSubmitted?.());

  channel.subscribe((status) => {
    if (status === "SUBSCRIBED") void channel.track({ at: Date.now() });
  });

  return {
    broadcastStart: () => void channel.send({ type: "broadcast", event: "start", payload: {} }),
    broadcastProgress: (p) =>
      void channel.send({ type: "broadcast", event: "progress", payload: p }),
    broadcastSubmitted: () =>
      void channel.send({ type: "broadcast", event: "submitted", payload: {} }),
    leave: () => void sb.removeChannel(channel),
  };
}
