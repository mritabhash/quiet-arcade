import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useSettings } from "../context/SettingsContext";

/**
 * The knight's vigil — the ambient character band that replaced the old
 * moving-words marquee. A mythical knight lives here with her own slow
 * schedule: each activity holds for at least an hour, persists across
 * refreshes via localStorage, and never repeats the last two picks.
 * During the "fight" activity an old mage appears to duel her.
 *
 * Under reduced motion everything renders as a still illustration of
 * whatever she is currently doing.
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

const ACTIVITIES: KnightActivity[] = [
  "walk",
  "bonfire",
  "fight",
  "sleep",
  "sharpen",
  "guard",
  "gaze",
  "rest",
];

const CAPTIONS: Record<KnightActivity, string> = {
  walk: "The knight walks the quiet marches.",
  bonfire: "The knight rests beside a low fire.",
  fight: "The knight faces the old mage — again.",
  sleep: "The knight sleeps sitting, sword close.",
  sharpen: "The knight sharpens her blade.",
  guard: "The knight stands her watch.",
  gaze: "The knight studies the far horizon.",
  rest: "The knight rests, sword at her side.",
};

interface KnightState {
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

function loadKnight(): KnightState {
  const now = Date.now();
  try {
    const raw = localStorage.getItem(KNIGHT_KEY);
    if (raw) {
      const s = JSON.parse(raw) as KnightState;
      if (
        s &&
        ACTIVITIES.includes(s.activity) &&
        typeof s.nextChangeAt === "number" &&
        now < s.nextChangeAt
      ) {
        return s;
      }
      // time's up — move her on, remembering where she's been
      const recent = s && Array.isArray(s.recent) ? s.recent : [];
      const activity = pickActivity([s?.activity, ...recent].filter(Boolean) as KnightActivity[]);
      const fresh: KnightState = {
        activity,
        startedAt: now,
        nextChangeAt: now + nextDuration(),
        recent: [s?.activity, ...recent].filter(Boolean).slice(0, 2) as KnightActivity[],
      };
      localStorage.setItem(KNIGHT_KEY, JSON.stringify(fresh));
      return fresh;
    }
  } catch {
    /* fall through to a fresh state */
  }
  const fresh: KnightState = {
    activity: pickActivity([]),
    startedAt: now,
    nextChangeAt: now + nextDuration(),
    recent: [],
  };
  try {
    localStorage.setItem(KNIGHT_KEY, JSON.stringify(fresh));
  } catch {
    /* private mode */
  }
  return fresh;
}

export function KnightVigil() {
  const { motionOK } = useSettings();
  const [state, setState] = useState<KnightState>(() => loadKnight());

  // check once a minute whether her hour has passed
  useEffect(() => {
    const t = setInterval(() => {
      setState((prev) => {
        if (Date.now() < prev.nextChangeAt) return prev;
        return loadKnight();
      });
    }, 60_000);
    return () => clearInterval(t);
  }, []);

  const a = state.activity;
  const seated = a === "bonfire" || a === "sleep" || a === "rest" || a === "sharpen";

  return (
    <section
      aria-label="The knight's vigil"
      className="relative overflow-hidden border-y border-[var(--line)] bg-[var(--bg-soft)]"
    >
      <p className="sr-only">{CAPTIONS[a]}</p>

      <div className="relative mx-auto h-56 max-w-6xl sm:h-64">
        {/* far hills and a watching moon */}
        <svg
          viewBox="0 0 1200 260"
          preserveAspectRatio="xMidYMax slice"
          className="absolute inset-0 h-full w-full"
          aria-hidden
        >
          <circle cx="1050" cy="52" r="26" className="fill-gold-200 dark:fill-gold-300" opacity="0.5" />
          <path d="M0 210 L140 150 L260 200 L420 130 L560 195 L720 145 L880 205 L1030 160 L1200 200 L1200 260 L0 260 Z" className="fill-sage-300 dark:fill-pine-800" opacity="0.5" />
          <path d="M0 235 L200 195 L430 230 L680 190 L900 232 L1200 205 L1200 260 L0 260 Z" className="fill-sage-400 dark:fill-pine-700" opacity="0.55" />
          {/* ground line */}
          <rect x="0" y="242" width="1200" height="18" className="fill-sand-300 dark:fill-pine-900" />
          {/* sparse standing stones */}
          <path d="M90 242 L96 214 L106 242 Z" className="fill-pine-700 dark:fill-pine-600" opacity="0.4" />
          <path d="M1120 242 L1126 220 L1134 242 Z" className="fill-pine-700 dark:fill-pine-600" opacity="0.4" />
        </svg>

        {/* the knight (and, when duelling, the mage) */}
        <motion.div
          className="absolute bottom-2 left-1/2 ml-[-80px] h-44 w-40 sm:h-48"
          animate={
            motionOK && a === "walk"
              ? { x: ["-38vw", "34vw", "-38vw"] }
              : { x: a === "fight" ? "-16vw" : 0 }
          }
          transition={
            motionOK && a === "walk"
              ? { duration: 150, repeat: Infinity, ease: "linear" }
              : { duration: 0.8 }
          }
        >
          <Knight activity={a} seated={seated} motionOK={motionOK} />
        </motion.div>

        {a === "fight" && (
          <div
            className="absolute bottom-2 left-1/2 ml-[-80px] h-44 w-40 sm:h-48"
            style={{ transform: "translateX(11vw)" }}
          >
            <OldMage motionOK={motionOK} />
          </div>
        )}

        {a === "bonfire" && (
          <div className="absolute bottom-3 left-1/2 ml-[38px] h-20 w-16">
            <Bonfire motionOK={motionOK} />
          </div>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function Knight({
  activity,
  seated,
  motionOK,
}: {
  activity: KnightActivity;
  seated: boolean;
  motionOK: boolean;
}) {
  const breathing =
    motionOK && (activity === "sleep" || activity === "rest" || activity === "bonfire");
  const bob = motionOK && activity === "walk";

  return (
    <motion.svg
      viewBox="0 0 160 190"
      className="h-full w-full overflow-visible"
      animate={
        bob
          ? { y: [0, -3, 0] }
          : breathing
            ? { scaleY: [1, 1.012, 1] }
            : motionOK && activity === "fight"
              ? { x: [0, 14, 0, 0, 6, 0], rotate: [0, 2, 0, 0, 1, 0] }
              : undefined
      }
      transition={
        bob
          ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" }
          : breathing
            ? { duration: 3.6, repeat: Infinity, ease: "easeInOut" }
            : activity === "fight"
              ? { duration: 6.5, repeat: Infinity, ease: "easeInOut", times: [0, 0.12, 0.24, 0.7, 0.82, 1] }
              : undefined
      }
      style={{ transformOrigin: "50% 100%" }}
      aria-hidden
    >
      {/* faint magical aura */}
      <ellipse cx="80" cy="176" rx="46" ry="8" className="fill-pine-900" opacity="0.12" />
      <circle cx="80" cy="92" r="62" className="fill-teal-300 anim-shimmer" opacity="0.07" />

      {seated ? <SeatedBody activity={activity} /> : <StandingBody activity={activity} />}

      {/* sharpening sparks */}
      {motionOK && activity === "sharpen" && (
        <g>
          <motion.path
            d="M116 128 L118 132 L122 133 L118 134 L116 138 L114 134 L110 133 L114 132 Z"
            className="fill-gold-300"
            animate={{ opacity: [0, 1, 0], scale: [0.6, 1.1, 0.6] }}
            transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 0.8 }}
          />
          <motion.circle
            cx="122"
            cy="124"
            r="1.6"
            className="fill-gold-200"
            animate={{ opacity: [0, 1, 0], y: [0, -6] }}
            transition={{ duration: 1.1, repeat: Infinity, repeatDelay: 1.3, delay: 0.5 }}
          />
        </g>
      )}

      {/* sleeping breaths */}
      {activity === "sleep" && (
        <g className="anim-twinkle">
          <text x="112" y="66" fontSize="13" className="fill-sand-600 dark:fill-sand-300" opacity="0.7">z</text>
          <text x="122" y="54" fontSize="9" className="fill-sand-600 dark:fill-sand-300" opacity="0.5">z</text>
        </g>
      )}
    </motion.svg>
  );
}

/** shared knight colours */
const ARMOR = "fill-teal-700 dark:fill-teal-500";
const ARMOR_LIGHT = "fill-teal-600 dark:fill-teal-400";
const TRIM = "fill-gold-500 dark:fill-gold-400";
const CAPE = "fill-clay-500 dark:fill-clay-400";
const HAIR = "#6b4a2f";
const SKIN = "#e7b194";

function StandingBody({ activity }: { activity: KnightActivity }) {
  const gazing = activity === "gaze";
  const fighting = activity === "fight";
  return (
    <g>
      {/* cape behind */}
      <path d="M66 74 Q52 120 58 168 L74 168 Q68 120 74 78 Z" className={`${CAPE} ${fighting ? "" : "anim-flutter"}`} opacity="0.9" />

      {/* legs — greaves */}
      <path d="M72 122 L68 168 L78 168 L80 128 Z" className={ARMOR} />
      <path d="M88 122 L92 168 L102 168 L96 126 Z" className={ARMOR} />
      <path d="M64 168 L80 168 L80 174 L62 174 Z" className={TRIM} />
      <path d="M90 168 L104 168 L106 174 L88 174 Z" className={TRIM} />

      {/* torso — cuirass with gold sigil */}
      <path d="M66 76 L98 76 L96 126 L70 126 Z" className={ARMOR_LIGHT} />
      <path d="M66 76 L98 76 L94 92 L70 92 Z" className={ARMOR} />
      <circle cx="82" cy="104" r="5" className={TRIM} />
      <path d="M70 124 L94 124 L92 130 L72 130 Z" className={TRIM} />

      {/* sword arm */}
      {fighting ? (
        /* raised, mid-swing */
        <g>
          <path d="M94 84 Q112 70 120 52" fill="none" strokeWidth="9" strokeLinecap="round" className="stroke-teal-600 dark:stroke-teal-400" />
          <circle cx="121" cy="50" r="4.5" fill={SKIN} />
          <g transform="rotate(-38 121 50)">
            <rect x="119" y="6" width="4" height="44" rx="1.5" fill="#d8dde4" />
            <rect x="113" y="46" width="16" height="4" rx="2" className={TRIM} />
            <rect x="119" y="50" width="4" height="9" rx="1.5" fill="#8a6a3a" />
          </g>
        </g>
      ) : (
        /* sword point-down at her side */
        <g>
          <path d="M94 84 Q104 96 104 110" fill="none" strokeWidth="9" strokeLinecap="round" className="stroke-teal-600 dark:stroke-teal-400" />
          <circle cx="104" cy="113" r="4.5" fill={SKIN} />
          <rect x="102" y="116" width="4" height="46" rx="1.5" fill="#d8dde4" />
          <rect x="96" y="114" width="16" height="4" rx="2" className={TRIM} />
        </g>
      )}

      {/* off arm: shading eyes when gazing */}
      {gazing ? (
        <g>
          <path d="M70 84 Q58 74 56 62" fill="none" strokeWidth="9" strokeLinecap="round" className="stroke-teal-600 dark:stroke-teal-400" />
          <circle cx="56" cy="59" r="4.5" fill={SKIN} />
          <rect x="48" y="52" width="14" height="4" rx="2" fill={SKIN} transform="rotate(-8 55 54)" />
        </g>
      ) : (
        <path d="M70 84 Q60 98 62 112" fill="none" strokeWidth="9" strokeLinecap="round" className="stroke-teal-600 dark:stroke-teal-400" />
      )}

      {/* long hair falling from under the circlet */}
      <path d="M68 44 Q60 66 64 84 L72 78 L72 56 Z" fill={HAIR} />
      <path d="M96 44 Q104 68 100 86 L90 78 L92 56 Z" fill={HAIR} />

      {/* head */}
      <circle cx="82" cy="48" r="13" fill={SKIN} />
      <path d="M69 44 Q72 32 82 32 Q92 32 95 44 Q88 39 82 39 Q76 39 69 44 Z" fill={HAIR} />
      {/* calm eyes */}
      <path d="M76 48 L80 48 M85 48 L89 48" stroke="#1b1824" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M79 54 Q82 55.5 85 54" fill="none" stroke="#1b1824" strokeWidth="1.2" strokeLinecap="round" />
      {/* silver circlet with a teal gem */}
      <path d="M69 41 Q82 34 95 41" fill="none" stroke="#d8dde4" strokeWidth="3" strokeLinecap="round" />
      <circle cx="82" cy="36.5" r="2.2" className="fill-teal-300 anim-shimmer" />
      {/* pauldrons */}
      <ellipse cx="67" cy="80" rx="8" ry="6.5" className={ARMOR} />
      <ellipse cx="97" cy="80" rx="8" ry="6.5" className={ARMOR} />
    </g>
  );
}

function SeatedBody({ activity }: { activity: KnightActivity }) {
  const sleeping = activity === "sleep";
  const sharpening = activity === "sharpen";
  return (
    <g>
      {/* a low stone to sit on */}
      <path d="M58 148 L104 148 L100 172 L62 172 Z" className="fill-sand-500 dark:fill-pine-700" />

      {/* cape pooling */}
      <path d="M60 96 Q48 130 52 166 L66 166 Q62 128 68 100 Z" className={CAPE} opacity="0.9" />

      {/* bent legs */}
      <path d="M70 132 L58 152 L66 158 L80 140 Z" className={ARMOR} />
      <path d="M92 132 L104 152 L96 158 L84 140 Z" className={ARMOR} />
      <ellipse cx="60" cy="158" rx="7" ry="4" className={TRIM} />
      <ellipse cx="102" cy="158" rx="7" ry="4" className={TRIM} />

      {/* torso, slumped a touch when sleeping */}
      <g transform={sleeping ? "rotate(6 82 120)" : undefined}>
        <path d="M68 92 L96 92 L94 138 L70 138 Z" className={ARMOR_LIGHT} />
        <path d="M68 92 L96 92 L93 106 L71 106 Z" className={ARMOR} />
        <circle cx="82" cy="118" r="4.5" className={TRIM} />

        {/* head, bowed in sleep */}
        <g transform={sleeping ? "rotate(14 82 66)" : undefined}>
          <path d="M70 62 Q62 82 66 98 L74 92 L74 72 Z" fill={HAIR} />
          <path d="M94 62 Q102 84 98 100 L88 92 L90 72 Z" fill={HAIR} />
          <circle cx="82" cy="64" r="12.5" fill={SKIN} />
          <path d="M70 60 Q73 49 82 49 Q91 49 94 60 Q87 55 82 55 Q77 55 70 60 Z" fill={HAIR} />
          {sleeping ? (
            <path d="M76 64 Q78 66 80 64 M84 64 Q86 66 88 64" fill="none" stroke="#1b1824" strokeWidth="1.4" strokeLinecap="round" />
          ) : (
            <path d="M76 64 L80 64 M84 64 L88 64" stroke="#1b1824" strokeWidth="1.5" strokeLinecap="round" />
          )}
          <path d="M79 70 Q82 71.5 85 70" fill="none" stroke="#1b1824" strokeWidth="1.1" strokeLinecap="round" />
          <path d="M70 57 Q82 50 94 57" fill="none" stroke="#d8dde4" strokeWidth="2.6" strokeLinecap="round" />
          <circle cx="82" cy="52.5" r="2" className="fill-teal-300 anim-shimmer" />
        </g>

        {/* pauldrons */}
        <ellipse cx="69" cy="96" rx="7.5" ry="6" className={ARMOR} />
        <ellipse cx="95" cy="96" rx="7.5" ry="6" className={ARMOR} />
      </g>

      {sharpening ? (
        /* blade across the knee, whetstone hand working */
        <g>
          <rect x="74" y="126" width="52" height="4" rx="1.5" fill="#d8dde4" transform="rotate(8 100 128)" />
          <rect x="68" y="124" width="12" height="5" rx="2" className={TRIM} transform="rotate(8 74 126)" />
          <path d="M94 106 Q104 112 110 122" fill="none" strokeWidth="8" strokeLinecap="round" className="stroke-teal-600 dark:stroke-teal-400" />
          <motion.g
            animate={{ x: [-7, 8, -7] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          >
            <circle cx="110" cy="126" r="4" fill={SKIN} />
            <rect x="105" y="121" width="10" height="6" rx="2" fill="#8a8066" />
          </motion.g>
        </g>
      ) : (
        /* sword resting against the stone beside her */
        <g transform="rotate(14 116 140)">
          <rect x="114" y="104" width="4" height="52" rx="1.5" fill="#d8dde4" />
          <rect x="108" y="102" width="16" height="4" rx="2" className={TRIM} />
          <rect x="114" y="94" width="4" height="9" rx="1.5" fill="#8a6a3a" />
        </g>
      )}
    </g>
  );
}

/** The old mage — appears only for the duel. */
function OldMage({ motionOK }: { motionOK: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 160 190"
      className="h-full w-full overflow-visible"
      animate={motionOK ? { x: [0, -8, 0, 0, -4, 0] } : undefined}
      transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut", times: [0, 0.16, 0.3, 0.7, 0.85, 1] }}
      style={{ transformOrigin: "50% 100%" }}
      aria-hidden
    >
      <ellipse cx="80" cy="176" rx="44" ry="8" className="fill-pine-900" opacity="0.12" />
      {/* dangerous aura */}
      <circle cx="80" cy="96" r="58" className="fill-clay-400 anim-shimmer" opacity="0.09" />

      {/* long robe */}
      <path d="M62 78 L98 78 L108 168 Q110 176 100 176 L60 176 Q50 176 52 168 Z" className="fill-pine-700 dark:fill-pine-600" />
      <path d="M78 82 L74 120 L80 168 L86 120 L82 82 Z" className="fill-gold-500 dark:fill-gold-400" opacity="0.5" />

      {/* staff arm, raised to cast */}
      <path d="M94 88 Q110 76 116 58" fill="none" strokeWidth="9" strokeLinecap="round" className="stroke-pine-700 dark:stroke-pine-600" />
      <circle cx="117" cy="55" r="4.5" fill={SKIN} />
      <path d="M118 160 L118 36" stroke="#63472f" strokeWidth="4" strokeLinecap="round" />
      <motion.g
        animate={motionOK ? { scale: [1, 1.25, 1], opacity: [0.8, 1, 0.8] } : undefined}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "118px 28px" }}
      >
        <circle cx="118" cy="28" r="8" className="fill-clay-400" opacity="0.85" />
        <circle cx="118" cy="28" r="3.5" className="fill-gold-200" />
        <path d="M104 20 L106 24 L110 25 L106 26 L105 30 L103 26 L99 25 L103 24 Z" className="fill-clay-300 anim-twinkle" />
      </motion.g>

      {/* other arm tucked in the sleeve */}
      <path d="M66 90 Q58 100 60 112" fill="none" strokeWidth="9" strokeLinecap="round" className="stroke-pine-700 dark:stroke-pine-600" />

      {/* long white beard */}
      <ellipse cx="78" cy="76" rx="13" ry="16" fill="#f7f1e0" />
      <circle cx="69" cy="68" r="5" fill="#f7f1e0" />
      <circle cx="87" cy="68" r="5" fill="#f7f1e0" />
      {/* face — wise, but the eyes are sharp */}
      <circle cx="78" cy="62" r="9" fill={SKIN} />
      <path d="M72 60 L76 60 M80 60 L84 60" stroke="#1b1824" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M71 56 Q74 54 76 56 M80 56 Q82 54 85 56" fill="none" stroke="#f7f1e0" strokeWidth="1.8" strokeLinecap="round" />

      {/* hood with a worn point */}
      <path d="M66 56 Q70 38 82 34 Q92 44 90 56 Q84 50 78 50 Q72 50 66 56 Z" className="fill-pine-800 dark:fill-pine-700" />
      <circle cx="82" cy="35" r="2.4" className="fill-clay-400" />
    </motion.svg>
  );
}

/** A small flickering bonfire for her fireside hours. */
function Bonfire({ motionOK }: { motionOK: boolean }) {
  return (
    <svg viewBox="0 0 64 80" className="h-full w-full overflow-visible" aria-hidden>
      {/* logs */}
      <rect x="14" y="64" width="36" height="5" rx="2.5" fill="#63472f" transform="rotate(-8 32 66)" />
      <rect x="14" y="64" width="36" height="5" rx="2.5" fill="#4d3624" transform="rotate(9 32 66)" />
      {/* flames */}
      {motionOK ? (
        <motion.g
          animate={{ scaleY: [1, 1.14, 0.96, 1.08, 1], scaleX: [1, 0.94, 1.05, 0.97, 1] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "32px 64px" }}
        >
          <path d="M32 24 Q42 40 40 52 Q40 62 32 62 Q24 62 24 52 Q22 40 32 24 Z" className="fill-clay-400" />
          <path d="M32 36 Q38 46 36 54 Q36 60 32 60 Q28 60 28 54 Q26 46 32 36 Z" className="fill-gold-400" />
          <path d="M32 46 Q34 51 33 55 Q33 58 32 58 Q31 58 31 55 Q30 51 32 46 Z" className="fill-gold-200" />
        </motion.g>
      ) : (
        <g>
          <path d="M32 24 Q42 40 40 52 Q40 62 32 62 Q24 62 24 52 Q22 40 32 24 Z" className="fill-clay-400" />
          <path d="M32 36 Q38 46 36 54 Q36 60 32 60 Q28 60 28 54 Q26 46 32 36 Z" className="fill-gold-400" />
        </g>
      )}
      {/* drifting embers */}
      {motionOK && (
        <g>
          <motion.circle cx="28" cy="30" r="1.3" className="fill-gold-300" animate={{ y: [-2, -18], opacity: [0.9, 0] }} transition={{ duration: 2.6, repeat: Infinity, repeatDelay: 0.7 }} />
          <motion.circle cx="38" cy="26" r="1.1" className="fill-gold-200" animate={{ y: [0, -16], opacity: [0.8, 0] }} transition={{ duration: 3.1, repeat: Infinity, repeatDelay: 1.4, delay: 1 }} />
        </g>
      )}
      {/* warm glow on the ground */}
      <ellipse cx="32" cy="70" rx="24" ry="6" className="fill-gold-400" opacity="0.18" />
    </svg>
  );
}
