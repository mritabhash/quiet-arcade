import type { GameId } from "../../types";

/**
 * Canonical matchmaking bucket key for a (game, config) pair. Players are
 * paired ONLY within the same bucket — never with mismatched configs.
 *
 * Formats (documented in supabase/migrations/0004_versus_queue.sql):
 *   map-drop:<difficulty>    e.g. map-drop:hard
 *   trivia:<topic>:<mode>    e.g. trivia:misc:moderate
 *
 * Trivia lifelines are excluded from the key: the created match carries one
 * shared pack (the config payload) for both players, so packs always match.
 */
export function configKey(gameId: GameId, config: Record<string, unknown>): string {
  if (gameId === "map-drop") return `map-drop:${config.difficulty ?? "hard"}`;
  if (gameId === "trivia") return `trivia:${config.topic ?? "misc"}:${config.mode ?? "moderate"}`;
  return gameId;
}
