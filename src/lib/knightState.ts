import { useEffect, useState } from "react";
import { read, write } from "./storage";

/**
 * The knight's own slow schedule. Each activity holds for at least an hour,
 * persists across refreshes, and never repeats the last two picks.
 *
 * Extracted from KnightVigil so the drawn band (Cast page art) and the
 * cinematic band on the home page live off the same clock.
 */

const KNIGHT_KEY = "quietArcade.knight";

export type KnightActivity =
  | "walk"
  | "bonfire"
  | "fight"
  | "sleep"
  | "sharpen"
  | "guard"
  | "gaze"
  | "rest";

export const ACTIVITIES: KnightActivity[] = [
  "walk",
  "bonfire",
  "fight",
  "sleep",
  "sharpen",
  "guard",
  "gaze",
  "rest",
];

export const CAPTIONS: Record<KnightActivity, string> = {
  walk: "The knight walks the quiet marches, cloak trailing.",
  bonfire: "The knight warms her hands over a low fire.",
  fight: "The knight faces the old mage — again.",
  sleep: "The knight sleeps sitting, sword close.",
  sharpen: "The knight draws a whetstone along her blade.",
  guard: "The knight stands her watch, hands on the pommel.",
  gaze: "The knight shades her eyes and studies the horizon.",
  rest: "The knight leans back and watches the sky.",
};

/** The hour she is keeping, named for the film-subtitle kicker. */
export const HOUR_OF: Record<KnightActivity, string> = {
  walk: "the march",
  bonfire: "the bonfire",
  fight: "the duel",
  sleep: "stillness",
  sharpen: "the whetstone",
  guard: "the watch",
  gaze: "the horizon",
  rest: "the open sky",
};

export interface KnightState {
  activity: KnightActivity;
  startedAt: number;
  nextChangeAt: number;
  recent: KnightActivity[];
}

/** 60–100 minutes per activity */
function nextDuration(): number {
  return (60 + Math.random() * 40) * 60 * 1000;
}

function pickActivity(recent: KnightActivity[]): KnightActivity {
  const avoid = new Set(recent.slice(0, 2));
  const pool = ACTIVITIES.filter((a) => !avoid.has(a));
  return pool[Math.floor(Math.random() * pool.length)];
}

export function loadKnight(): KnightState {
  const now = Date.now();
  const s = read<KnightState | null>(KNIGHT_KEY, null);
  if (s && ACTIVITIES.includes(s.activity) && typeof s.nextChangeAt === "number" && now < s.nextChangeAt) {
    return s;
  }
  // nothing saved, or time's up — move her on, remembering where she's been
  const recent = s && Array.isArray(s.recent) ? s.recent : [];
  const activity = pickActivity([s?.activity, ...recent].filter(Boolean) as KnightActivity[]);
  const fresh: KnightState = {
    activity,
    startedAt: now,
    nextChangeAt: now + nextDuration(),
    recent: [s?.activity, ...recent].filter(Boolean).slice(0, 2) as KnightActivity[],
  };
  write(KNIGHT_KEY, fresh);
  return fresh;
}

/** Her current activity, checked once a minute for the turn of her hour. */
export function useKnightActivity(): KnightActivity {
  const [state, setState] = useState<KnightState>(() => loadKnight());

  useEffect(() => {
    const t = setInterval(() => {
      setState((prev) => {
        if (Date.now() < prev.nextChangeAt) return prev;
        return loadKnight();
      });
    }, 60_000);
    return () => clearInterval(t);
  }, []);

  return state.activity;
}
