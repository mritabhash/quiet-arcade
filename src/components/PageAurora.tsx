import { useSettings } from "../context/SettingsContext";

/**
 * A whisper-quiet living wash behind every page: two large, soft colour glows
 * that slowly drift and breathe, tinted differently per route so each room of
 * the arcade has its own ambient hue. Pure transform/opacity so it holds
 * 60fps and never repaints the layout; reduced motion keeps the faint colour
 * but stops the movement. Deliberately barely-there — it sets a mood, it does
 * not compete with the content.
 */

// r,g,b tuples from the site palette
const T = "45,133,149"; // teal
const G = "224,182,84"; // tarnished gold
const C = "174,77,44"; // terracotta / clay
const S = "138,191,140"; // sage
const V = "120,104,196"; // arcane violet
const M = "122,116,142"; // muted slate

/** first path segment -> [glow A colour, glow B colour] */
const AURORA: Record<string, [string, string]> = {
  home: [T, G],
  games: [G, C],
  stats: [C, G],
  lore: [V, T],
  cast: [S, G],
  leaderboards: [G, T],
  account: [T, V],
  versus: [C, T],
  settings: [M, S],
};

export function PageAurora({ pathname }: { pathname: string }) {
  const { motionOK } = useSettings();
  const key = pathname.split("/")[1] || "home";
  const [a, b] = AURORA[key] ?? AURORA.home;
  const still = motionOK ? "" : " qa-aurora-still";
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className={`qa-aurora-blob qa-aurora-a${still}`}
        style={{ background: `radial-gradient(closest-side, rgba(${a},1) 0%, rgba(${a},0) 72%)` }}
      />
      <div
        className={`qa-aurora-blob qa-aurora-b${still}`}
        style={{ background: `radial-gradient(closest-side, rgba(${b},1) 0%, rgba(${b},0) 72%)` }}
      />
    </div>
  );
}
