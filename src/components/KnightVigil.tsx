import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useSettings } from "../context/SettingsContext";

/**
 * The knight's vigil — the ambient character band on the home page.
 * A mythical knight lives here on her own slow schedule: each activity
 * holds for at least an hour, persists across refreshes via localStorage,
 * and never repeats the last two picks. During "fight" an old mage
 * appears to duel her.
 *
 * She is drawn as a layered storybook figure: solid tapered limbs,
 * fitted plate with painted highlights and shadows, moonlit rim light —
 * shading is done with neutral white/black overlays so it survives both
 * themes. Under reduced motion everything renders as a still.
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
  walk: "The knight walks the quiet marches, cloak trailing.",
  bonfire: "The knight warms her hands over a low fire.",
  fight: "The knight faces the old mage — again.",
  sleep: "The knight sleeps sitting, sword close.",
  sharpen: "The knight draws a whetstone along her blade.",
  guard: "The knight stands her watch, hands on the pommel.",
  gaze: "The knight shades her eyes and studies the horizon.",
  rest: "The knight leans back and watches the sky.",
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
        {/* far hills, a watching moon, and the night's small lives */}
        <svg
          viewBox="0 0 1200 260"
          preserveAspectRatio="xMidYMax slice"
          className="absolute inset-0 h-full w-full"
          aria-hidden
        >
          {/* moon — waking bright while she sleeps */}
          <circle
            cx="1050"
            cy="52"
            r="26"
            className="fill-gold-200 dark:fill-gold-300"
            opacity={a === "sleep" ? 0.75 : 0.5}
          />
          <circle cx="1050" cy="52" r="34" className="fill-gold-200" opacity={a === "sleep" ? 0.14 : 0.07} />

          {/* stars keep her sleeping company */}
          {a === "sleep" && (
            <g className="fill-gold-200">
              <path d="M180 46 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 Z" className="anim-twinkle" opacity="0.7" />
              <circle cx="420" cy="30" r="1.6" className="anim-twinkle" opacity="0.6" />
              <circle cx="700" cy="52" r="1.4" className="anim-twinkle" opacity="0.5" />
              <path d="M880 28 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6 Z" className="anim-twinkle" opacity="0.55" />
            </g>
          )}

          {/* far birds cross while she studies the horizon */}
          {a === "gaze" && motionOK && (
            <motion.g
              className="stroke-pine-700 dark:stroke-sand-300"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
              opacity="0.5"
              animate={{ x: [-80, 1280], y: [0, -14, -6] }}
              transition={{ duration: 46, repeat: Infinity, ease: "linear" }}
            >
              <path d="M0 92 q5 -6 10 0 q5 -6 10 0" />
              <path d="M34 78 q4 -5 8 0 q4 -5 8 0" />
              <path d="M-26 104 q4 -5 8 0 q4 -5 8 0" />
            </motion.g>
          )}

          <path d="M0 210 L140 150 L260 200 L420 130 L560 195 L720 145 L880 205 L1030 160 L1200 200 L1200 260 L0 260 Z" className="fill-sage-300 dark:fill-pine-800" opacity="0.5" />
          <path d="M0 235 L200 195 L430 230 L680 190 L900 232 L1200 205 L1200 260 L0 260 Z" className="fill-sage-400 dark:fill-pine-700" opacity="0.55" />
          {/* ground line */}
          <rect x="0" y="242" width="1200" height="18" className="fill-sand-300 dark:fill-pine-900" />
          {/* sparse standing stones and grass tufts */}
          <path d="M90 242 L96 214 L106 242 Z" className="fill-pine-700 dark:fill-pine-600" opacity="0.4" />
          <path d="M1120 242 L1126 220 L1134 242 Z" className="fill-pine-700 dark:fill-pine-600" opacity="0.4" />
          <g className="stroke-sage-400 dark:stroke-pine-600" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.55">
            <path d="M210 243 q-2 -7 -5 -9 M214 243 q0 -8 2 -11 M218 243 q3 -6 6 -8" />
            <path d="M760 243 q-2 -6 -4 -8 M764 243 q1 -8 3 -10" />
            <path d="M990 243 q-2 -6 -5 -8 M994 243 q1 -7 3 -10 M998 243 q3 -5 5 -7" />
          </g>
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
          {/* she turns to face the way she walks */}
          <motion.div
            className="h-full w-full"
            animate={motionOK && a === "walk" ? { scaleX: [1, 1, -1, -1, 1] } : { scaleX: 1 }}
            transition={
              motionOK && a === "walk"
                ? { duration: 150, repeat: Infinity, ease: "linear", times: [0, 0.495, 0.505, 0.995, 1] }
                : { duration: 0.4 }
            }
          >
            <Knight activity={a} seated={seated} motionOK={motionOK} />
          </motion.div>
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
/* palette — plate colours come from the theme; shading is neutral     */
/* overlay paint so it works in light and dark alike                   */

const ARMOR = "fill-teal-700 dark:fill-teal-500";
const ARMOR_LIGHT = "fill-teal-600 dark:fill-teal-400";
const TRIM = "fill-gold-500 dark:fill-gold-400";
const CAPE = "fill-clay-500 dark:fill-clay-400";
const HAIR = "#6b4a2f";
const HAIR_DEEP = "#54371f";
const SKIN = "#e7b194";
const SKIN_SHADE = "#d09678";
const STEEL = "#d8dde4";
const STEEL_DEEP = "#aeb6c2";
const INK = "#2a2233";
const HI = "#fff8ec"; // highlight overlay
const LO = "#141020"; // shadow overlay

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
          ? { y: [0, -2.5, 0, -2.5, 0] }
          : breathing
            ? { scaleY: [1, 1.014, 1] }
            : motionOK && activity === "fight"
              ? { x: [0, 16, 0, 0, 5, 0], rotate: [0, 2.5, 0, 0, 1, 0] }
              : undefined
      }
      transition={
        bob
          ? { duration: 1.3, repeat: Infinity, ease: "easeInOut" }
          : breathing
            ? { duration: 3.8, repeat: Infinity, ease: "easeInOut" }
            : activity === "fight"
              ? { duration: 6.5, repeat: Infinity, ease: "easeInOut", times: [0, 0.1, 0.22, 0.72, 0.82, 1] }
              : undefined
      }
      style={{ transformOrigin: "50% 100%" }}
      aria-hidden
    >
      {/* grounding */}
      <ellipse cx="80" cy="176" rx="44" ry="7" className="fill-pine-900" opacity="0.14" />
      <circle cx="80" cy="92" r="62" className="fill-teal-300 anim-shimmer" opacity="0.06" />

      {/* the fire throws warm light on her while she sits beside it */}
      {activity === "bonfire" && (
        <motion.ellipse
          cx="96"
          cy="118"
          rx="34"
          ry="52"
          className="fill-gold-400"
          animate={motionOK ? { opacity: [0.08, 0.16, 0.1, 0.14, 0.08] } : undefined}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          opacity={motionOK ? undefined : 0.12}
        />
      )}

      {seated ? (
        <SeatedBody activity={activity} motionOK={motionOK} />
      ) : (
        <StandingBody activity={activity} motionOK={motionOK} />
      )}

      {/* drifting fireflies keep her company while she rests */}
      {motionOK && activity === "rest" && (
        <g>
          <motion.circle
            r="1.8"
            className="fill-gold-300"
            animate={{ cx: [118, 128, 122, 132, 118], cy: [110, 96, 86, 102, 110], opacity: [0, 0.9, 0.4, 0.9, 0] }}
            transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.circle
            r="1.4"
            className="fill-gold-200"
            animate={{ cx: [40, 30, 38, 26, 40], cy: [120, 108, 96, 112, 120], opacity: [0, 0.7, 0.3, 0.8, 0] }}
            transition={{ duration: 13, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          />
        </g>
      )}

      {/* sleeping breaths drift up and away */}
      {activity === "sleep" &&
        (motionOK ? (
          <g>
            <motion.text
              x="110"
              y="70"
              fontSize="13"
              className="fill-sand-600 dark:fill-sand-300"
              animate={{ y: [0, -14], opacity: [0, 0.75, 0] }}
              transition={{ duration: 4.2, repeat: Infinity, ease: "easeOut" }}
            >
              z
            </motion.text>
            <motion.text
              x="121"
              y="60"
              fontSize="9"
              className="fill-sand-600 dark:fill-sand-300"
              animate={{ y: [0, -12], opacity: [0, 0.55, 0] }}
              transition={{ duration: 4.2, repeat: Infinity, ease: "easeOut", delay: 1.6 }}
            >
              z
            </motion.text>
          </g>
        ) : (
          <g className="fill-sand-600 dark:fill-sand-300">
            <text x="110" y="64" fontSize="13" opacity="0.7">z</text>
            <text x="121" y="52" fontSize="9" opacity="0.5">z</text>
          </g>
        ))}
    </motion.svg>
  );
}

/* ---------------------------------------------------- shared pieces */

/** Her head — hair first, then face, circlet last. */
function Head({
  cx = 82,
  cy = 52,
  eyes = "open",
}: {
  cx?: number;
  cy?: number;
  eyes?: "open" | "closed" | "soft";
}) {
  const dx = cx - 82;
  const dy = cy - 52;
  return (
    <g transform={`translate(${dx} ${dy})`}>
      {/* face */}
      <circle cx="82" cy="52" r="12.5" fill={SKIN} />
      {/* soft cheek shadow under the fringe */}
      <path d="M71 47 Q73 55 78 60 Q72 58 70.5 52 Z" fill={SKIN_SHADE} opacity="0.45" />

      {/* eyes */}
      {eyes === "closed" ? (
        <path d="M75.5 53 Q77.5 55 79.5 53 M84.5 53 Q86.5 55 88.5 53" fill="none" stroke={INK} strokeWidth="1.4" strokeLinecap="round" />
      ) : eyes === "soft" ? (
        <path d="M75.5 52.5 Q77.5 51.6 79.5 52.5 M84.5 52.5 Q86.5 51.6 88.5 52.5" fill="none" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
      ) : (
        <g>
          <path d="M75.5 52.5 Q77.5 50.6 79.5 52.5 M84.5 52.5 Q86.5 50.6 88.5 52.5" fill="none" stroke={INK} strokeWidth="1.7" strokeLinecap="round" />
          {/* the flick of a lash */}
          <path d="M79.5 51.6 L80.6 50.6 M88.5 51.6 L89.6 50.6" stroke={INK} strokeWidth="1.1" strokeLinecap="round" />
        </g>
      )}
      {/* brows, nose, calm mouth */}
      <path d="M75 48.6 Q77.5 47.4 80 48.4 M84 48.4 Q86.5 47.4 89 48.6" fill="none" stroke={HAIR_DEEP} strokeWidth="1" strokeLinecap="round" opacity="0.75" />
      <path d="M82 54 Q81.2 55.6 82 56.4" fill="none" stroke={SKIN_SHADE} strokeWidth="1.1" strokeLinecap="round" />
      <path d="M79.5 59.4 Q82 60.8 84.5 59.4" fill="none" stroke={INK} strokeWidth="1.2" strokeLinecap="round" />
      {/* a touch of warmth on the cheeks */}
      <ellipse cx="75" cy="56.5" rx="2.2" ry="1.2" className="fill-clay-400" opacity="0.25" />
      <ellipse cx="89" cy="56.5" rx="2.2" ry="1.2" className="fill-clay-400" opacity="0.25" />

      {/* fringe over the crown, parted */}
      <path d="M69.5 49 Q69 37.5 82 35.5 Q95 37.5 94.5 49 Q90 41.5 82 41.5 Q74 41.5 69.5 49 Z" fill={HAIR} />
      <path d="M82 35.5 Q88 36.5 91.5 41 Q86 39 82 39.5 Z" fill={HAIR_DEEP} opacity="0.6" />
      {/* hair shine */}
      <path d="M73 41.5 Q77 37.5 82 37.3 Q77.5 39.5 75 43 Z" fill={HI} opacity="0.22" />
      {/* face-framing locks */}
      <path d="M69.5 47 Q66.5 58 69.5 70 Q73 64 72 52 Z" fill={HAIR} />
      <path d="M94.5 47 Q97.5 58 94.5 70 Q91 64 92 52 Z" fill={HAIR} />
      <path d="M94.5 47 Q96.6 56 95.4 64 Q93.6 58 93.4 51 Z" fill={HAIR_DEEP} opacity="0.5" />

      {/* silver circlet with her teal gem */}
      <path d="M70 43.5 Q82 36.5 94 43.5" fill="none" stroke={STEEL} strokeWidth="2.6" strokeLinecap="round" />
      <path d="M70 43.5 Q82 36.9 94 43.5" fill="none" stroke={HI} strokeWidth="0.9" strokeLinecap="round" opacity="0.5" />
      <circle cx="82" cy="38.8" r="2.3" className="fill-teal-300 anim-shimmer" />
    </g>
  );
}

/** Her sword, drawn point-down with a live blade. */
function SwordDown({ x = 102, y = 112, tilt = 0 }: { x?: number; y?: number; tilt?: number }) {
  return (
    <g transform={`rotate(${tilt} ${x} ${y})`}>
      {/* pommel, wrapped grip */}
      <circle cx={x} cy={y - 2} r="2.6" className={TRIM} />
      <rect x={x - 1.8} y={y} width="3.6" height="9" rx="1.4" fill="#7a5a36" />
      <path d={`M${x - 1.8} ${y + 2.5} h3.6 M${x - 1.8} ${y + 5.5} h3.6`} stroke="#5d4226" strokeWidth="0.9" />
      {/* curved crossguard */}
      <path d={`M${x - 8} ${y + 9.5} Q${x} ${y + 6.5} ${x + 8} ${y + 9.5} Q${x} ${y + 11.5} ${x - 8} ${y + 9.5} Z`} className={TRIM} />
      {/* tapered blade with fuller and edge-light */}
      <path d={`M${x - 2.2} ${y + 11} L${x + 2.2} ${y + 11} L${x + 1.2} ${y + 48} L${x} ${y + 54} L${x - 1.2} ${y + 48} Z`} fill={STEEL} />
      <path d={`M${x} ${y + 12} L${x + 1.6} ${y + 12} L${x + 0.9} ${y + 47} L${x} ${y + 52} Z`} fill={STEEL_DEEP} opacity="0.7" />
      <path d={`M${x - 0.4} ${y + 13} L${x - 0.4} ${y + 46}`} stroke={HI} strokeWidth="0.8" opacity="0.6" />
    </g>
  );
}

/* --------------------------------------------------------- standing */

function StandingBody({ activity, motionOK }: { activity: KnightActivity; motionOK: boolean }) {
  const gazing = activity === "gaze";
  const fighting = activity === "fight";
  const guarding = activity === "guard";
  const walking = activity === "walk";

  const legSwing = motionOK && walking;

  return (
    <g>
      {/* cape sweeps behind her */}
      <g className={fighting ? "" : "anim-flutter"}>
        <path d="M65 78 Q45 110 51 150 Q53 166 61 170 L72 167 Q62 128 73 84 Z" className={CAPE} opacity="0.95" />
        <path d="M60 100 Q52 132 57 160 L64 163 Q57 132 66 98 Z" fill={LO} opacity="0.16" />
        <path d="M69 84 Q64 110 66 138 Q68 116 73 90 Z" fill={HI} opacity="0.14" />
      </g>

      {/* her long hair falls over the cape */}
      <path d="M92 44 Q106 58 104 86 Q103 100 95 108 Q99 84 93 64 Q90 52 88 48 Z" fill={HAIR} />
      <path d="M97 60 Q102 76 99 96 Q97 82 94 68 Z" fill={HAIR_DEEP} opacity="0.55" />

      {/* legs — solid, with knee cops and boots */}
      <motion.g
        animate={legSwing ? { rotate: [7, -7, 7] } : { rotate: 0 }}
        transition={legSwing ? { duration: 1.3, repeat: Infinity, ease: "easeInOut" } : undefined}
        style={{ transformOrigin: "74px 116px" }}
      >
        <path d="M69 112 L80 114 Q80 138 76 158 L66 158 Q68 136 69 112 Z" className={ARMOR} />
        <path d="M70 114 Q69 136 67.5 154 L66 158 Q68 136 69 112 Z" fill={LO} opacity="0.18" />
        <ellipse cx="72.5" cy="138" rx="4.6" ry="4" className={ARMOR_LIGHT} />
        <path d="M65.5 156 L76.5 156 Q81 160 81 166 Q81 171 75 171 L64 171 Q60 166 65.5 156 Z" className={ARMOR} />
        <path d="M64.5 168 L80 168 L80.5 171 L64 171 Z" fill={LO} opacity="0.22" />
        <path d="M66 158 L76 158" stroke={HI} strokeWidth="1" opacity="0.35" />
      </motion.g>
      <motion.g
        animate={legSwing ? { rotate: [-7, 7, -7] } : { rotate: 0 }}
        transition={legSwing ? { duration: 1.3, repeat: Infinity, ease: "easeInOut" } : undefined}
        style={{ transformOrigin: "90px 116px" }}
      >
        <path d="M84 114 L95 112 Q96 136 98 158 L88 158 Q84 138 84 114 Z" className={ARMOR} />
        <path d="M93 114 Q94 136 96.5 154 L98 158 Q96 136 95 112 Z" fill={LO} opacity="0.18" />
        <ellipse cx="91.5" cy="138" rx="4.6" ry="4" className={ARMOR_LIGHT} />
        <path d="M87.5 156 L98.5 156 Q104 160 104 166 Q104 171 98 171 L87 171 Q83 166 87.5 156 Z" className={ARMOR} />
        <path d="M86.5 168 L102 168 L102.5 171 L86 171 Z" fill={LO} opacity="0.22" />
        <path d="M88 158 L98 158" stroke={HI} strokeWidth="1" opacity="0.35" />
      </motion.g>

      {/* tasset skirt over the hips */}
      <path d="M67 106 L97 106 L99 120 Q91 127 82 127 Q73 127 65 120 Z" className={ARMOR} />
      <path d="M73 108 Q73 118 74.5 124 M82 108 L82 127 M91 108 Q91 118 89.5 124" fill="none" stroke={LO} strokeWidth="1" opacity="0.25" />
      <path d="M67 106 L97 106 L97.6 110 L66.5 110 Z" fill={HI} opacity="0.12" />

      {/* cuirass — fitted, with a bright left edge toward the moon */}
      <path d="M66 78 Q63.5 92 70 104 Q74 111 82 111 Q90 111 94 104 Q100.5 92 98 78 Q90 72 82 72 Q74 72 66 78 Z" className={ARMOR_LIGHT} />
      <path d="M66 78 Q82 69 98 78 Q98.5 87 95 93 Q82 84 69 93 Q65.5 87 66 78 Z" className={ARMOR} />
      <path d="M68.5 80 Q66.5 92 71.5 102 L74 105 Q69 93 71 82 Z" fill={HI} opacity="0.2" />
      <path d="M95.5 82 Q97 93 92.5 102 L90 105 Q94.5 93 93 84 Z" fill={LO} opacity="0.16" />
      {/* gold sigil */}
      <path d="M82 90 L85.5 97 L82 104 L78.5 97 Z" className={TRIM} />
      <circle cx="82" cy="97" r="1.4" fill={HI} opacity="0.7" />
      {/* belt */}
      <rect x="70.5" y="105" width="23" height="4.6" rx="2" fill={LO} opacity="0.3" />
      <circle cx="82" cy="107.3" r="2.4" className={TRIM} />

      {/* neck */}
      <path d="M78.5 62 L85.5 62 L85 70 L79 70 Z" fill={SKIN} />
      <path d="M78.5 62 L85.5 62 L85.3 65 L78.7 65 Z" fill={SKIN_SHADE} opacity="0.5" />

      {/* off arm */}
      {gazing ? (
        /* raised, shading her eyes */
        <g>
          <path d="M69 80 Q59 74 56.5 62 L62 58.5 Q64.5 70 73 76 Z" className={ARMOR_LIGHT} />
          <ellipse cx="59" cy="60" rx="4.6" ry="4" className={ARMOR} />
          <circle cx="58" cy="56.5" r="3.6" fill={SKIN} />
          <rect x="52" y="50.5" width="15" height="4" rx="2" fill={SKIN} transform="rotate(-9 58 52)" />
        </g>
      ) : guarding ? (
        /* both hands meet on the pommel — drawn with the sword below */
        <path d="M68 82 Q63 96 72 108 L78 106 Q70 96 74 84 Z" className={ARMOR_LIGHT} />
      ) : (
        <motion.g
          animate={motionOK && walking ? { rotate: [-6, 6, -6] } : { rotate: 0 }}
          transition={motionOK && walking ? { duration: 1.3, repeat: Infinity, ease: "easeInOut" } : undefined}
          style={{ transformOrigin: "68px 82px" }}
        >
          <path d="M68 80 Q59 94 61.5 110 L68 111 Q66 96 73 85 Z" className={ARMOR_LIGHT} />
          <path d="M62.5 96 Q61.5 104 62.5 110 L65 110.5 Q64 102 65 95 Z" fill={LO} opacity="0.15" />
          <path d="M60.5 108 Q60 114 63 116.5 Q66.5 117.5 68.5 114.5 Q69 110 66.5 108 Z" className={ARMOR} />
          <circle cx="64.5" cy="119" r="3.4" fill={SKIN} />
        </motion.g>
      )}

      {/* sword arm and blade */}
      {fighting ? (
        /* raised for the swing — the whole arm group beats with the duel */
        <motion.g
          animate={motionOK ? { rotate: [0, -24, 8, 0, -10, 0] } : undefined}
          transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut", times: [0, 0.1, 0.22, 0.72, 0.82, 1] }}
          style={{ transformOrigin: "96px 82px" }}
        >
          <path d="M95 80 Q110 70 118 54 L123 58 Q115 74 100 85 Z" className={ARMOR_LIGHT} />
          <ellipse cx="119" cy="56" rx="4.6" ry="4" className={ARMOR} />
          <circle cx="122" cy="52" r="3.8" fill={SKIN} />
          <g transform="rotate(-36 122 52)">
            {/* blade up */}
            <path d="M120 46 L124 46 L123 12 L122 6 L121 12 Z" fill={STEEL} />
            <path d="M122 45 L123.6 45 L122.9 13 L122 8 Z" fill={STEEL_DEEP} opacity="0.7" />
            <path d="M121.4 44 L121.4 13" stroke={HI} strokeWidth="0.8" opacity="0.6" />
            <path d="M114 47.5 Q122 44.5 130 47.5 Q122 50.5 114 47.5 Z" className={TRIM} />
            <rect x="120.2" y="49" width="3.6" height="9" rx="1.4" fill="#7a5a36" />
            <circle cx="122" cy="60" r="2.4" className={TRIM} />
          </g>
          {/* parry spark when the mage's bolt arrives */}
          {motionOK && (
            <motion.path
              d="M132 40 l2.4 5 5 2.4 -5 2.4 -2.4 5 -2.4 -5 -5 -2.4 5 -2.4 Z"
              className="fill-gold-200"
              animate={{ opacity: [0, 0, 1, 0, 0], scale: [0.5, 0.5, 1.25, 0.5, 0.5] }}
              transition={{ duration: 6.5, repeat: Infinity, times: [0, 0.76, 0.8, 0.85, 1] }}
              style={{ transformOrigin: "134px 45px" }}
            />
          )}
        </motion.g>
      ) : guarding ? (
        /* sword planted before her, both hands at rest on the pommel */
        <g>
          <path d="M96 82 Q101 96 92 108 L86 106 Q94 96 90 84 Z" className={ARMOR_LIGHT} />
          {/* blade into the earth */}
          <path d="M80 122 L84 122 L83 164 L82 172 L81 164 Z" fill={STEEL} />
          <path d="M82 123 L83.6 123 L82.9 162 L82 168 Z" fill={STEEL_DEEP} opacity="0.7" />
          <path d="M81.2 124 L81.2 160" stroke={HI} strokeWidth="0.8" opacity="0.55" />
          <path d="M73 120.5 Q82 117.5 91 120.5 Q82 123.5 73 120.5 Z" className={TRIM} />
          <rect x="80.2" y="108" width="3.6" height="10" rx="1.4" fill="#7a5a36" />
          <circle cx="82" cy="106" r="2.8" className={TRIM} />
          {/* her hands, one over the other */}
          <circle cx="79.5" cy="110" r="3.4" fill={SKIN} />
          <circle cx="84.5" cy="108.5" r="3.4" fill={SKIN_SHADE} />
        </g>
      ) : (
        /* at ease, blade point-down at her side (swings gently on the walk) */
        <motion.g
          animate={motionOK && walking ? { rotate: [6, -6, 6] } : { rotate: 0 }}
          transition={motionOK && walking ? { duration: 1.3, repeat: Infinity, ease: "easeInOut" } : undefined}
          style={{ transformOrigin: "96px 82px" }}
        >
          <path d="M96 80 Q105 94 102.5 110 L96 111 Q98 96 91 85 Z" className={ARMOR_LIGHT} />
          <path d="M101.5 96 Q102.5 104 101.5 110 L99 110.5 Q100 102 99 95 Z" fill={LO} opacity="0.15" />
          <path d="M103.5 108 Q104 114 101 116.5 Q97.5 117.5 95.5 114.5 Q95 110 97.5 108 Z" className={ARMOR} />
          <circle cx="99.5" cy="119" r="3.4" fill={SKIN} />
          <SwordDown x={100} y={114} tilt={4} />
        </motion.g>
      )}

      {/* pauldrons — layered plates with a bright rim */}
      <g>
        <ellipse cx="66.5" cy="79" rx="9" ry="7" className={ARMOR} />
        <ellipse cx="66.5" cy="77.8" rx="6" ry="4.4" className={ARMOR_LIGHT} />
        <path d="M59 76 Q62 71.5 67 71.2" fill="none" stroke={HI} strokeWidth="1.2" opacity="0.4" strokeLinecap="round" />
        <ellipse cx="97.5" cy="79" rx="9" ry="7" className={ARMOR} />
        <ellipse cx="97.5" cy="77.8" rx="6" ry="4.4" className={ARMOR_LIGHT} />
        <path d="M90 75 Q94 71.2 99 71.4" fill="none" stroke={HI} strokeWidth="1.2" opacity="0.4" strokeLinecap="round" />
      </g>

      {/* head — she scans the marches on guard, blinks now and then */}
      {guarding && motionOK ? (
        <motion.g
          animate={{ rotate: [0, -4, 0, 4, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", times: [0, 0.25, 0.5, 0.75, 1] }}
          style={{ transformOrigin: "82px 60px" }}
        >
          <Head eyes="soft" />
        </motion.g>
      ) : (
        <Head eyes={gazing || fighting ? "soft" : "open"} />
      )}

      {/* moonlit rim along her left */}
      <path d="M67 76 Q64 92 70 105" fill="none" stroke={HI} strokeWidth="1.1" opacity="0.28" strokeLinecap="round" />
    </g>
  );
}

/* ----------------------------------------------------------- seated */

function SeatedBody({ activity, motionOK }: { activity: KnightActivity; motionOK: boolean }) {
  const sleeping = activity === "sleep";
  const sharpening = activity === "sharpen";
  const resting = activity === "rest";
  const bonfire = activity === "bonfire";

  return (
    <g>
      {/* a low mossy stone to sit on */}
      <path d="M56 148 Q54 144 60 144 L102 144 Q108 144 106 150 L102 172 L62 172 Z" className="fill-sand-500 dark:fill-pine-700" />
      <path d="M56 148 Q54 144 60 144 L102 144 Q108 144 106 150 L105 154 L58 154 Z" fill={HI} opacity="0.12" />
      <path d="M62 168 L102 168 L102 172 L62 172 Z" fill={LO} opacity="0.2" />
      <path d="M60 146 q4 -3 8 0 q-4 2 -8 0 Z" className="fill-sage-400 dark:fill-pine-600" opacity="0.5" />

      {/* cape pooling onto the stone */}
      <path d="M60 94 Q46 128 52 164 Q54 170 60 170 L68 166 Q60 130 68 98 Z" className={CAPE} opacity="0.95" />
      <path d="M57 116 Q51 140 55 162 L60 164 Q55 138 62 112 Z" fill={LO} opacity="0.16" />

      {/* hair over the shoulder */}
      <path d="M92 60 Q104 76 101 100 Q99 110 93 116 Q97 92 91 74 Q88 66 87 62 Z" fill={HAIR} />
      <path d="M96 74 Q100 88 97 104 Q95 90 92 78 Z" fill={HAIR_DEEP} opacity="0.55" />

      {/* legs — bent, one eased out when she rests */}
      {resting ? (
        <g>
          {/* extended leg */}
          <path d="M84 132 Q98 140 110 152 L106 159 Q94 150 80 142 Z" className={ARMOR} />
          <ellipse cx="96" cy="145" rx="4.4" ry="3.8" className={ARMOR_LIGHT} transform="rotate(35 96 145)" />
          <path d="M106 150 Q113 152 115 158 Q115 163 110 163 L103 161 Q102 154 106 150 Z" className={ARMOR} />
          {/* tucked leg */}
          <path d="M72 132 L60 152 Q58 156 62 158 L70 158 Q76 146 82 140 Z" className={ARMOR} />
          <path d="M58 154 Q52 158 53 163 Q55 166 60 165 L66 162 Q64 156 60 154 Z" className={ARMOR} />
        </g>
      ) : (
        <g>
          <path d="M70 130 L56 150 Q54 154 58 156 L64 157 Q72 144 82 138 Z" className={ARMOR} />
          <path d="M70 132 Q63 141 58 150 L56 150 Q62 140 70 130 Z" fill={LO} opacity="0.18" />
          <ellipse cx="66" cy="143" rx="4.4" ry="3.8" className={ARMOR_LIGHT} transform="rotate(-35 66 143)" />
          <path d="M56 152 Q49 156 50 161 Q52 165 57 164 L63 161 Q61 155 57 152 Z" className={ARMOR} />
          <path d="M94 130 L108 150 Q110 154 106 156 L100 157 Q92 144 82 138 Z" className={ARMOR} />
          <path d="M94 132 Q101 141 106 150 L108 150 Q102 140 94 130 Z" fill={LO} opacity="0.18" />
          <ellipse cx="98" cy="143" rx="4.4" ry="3.8" className={ARMOR_LIGHT} transform="rotate(35 98 143)" />
          <path d="M108 152 Q115 156 114 161 Q112 165 107 164 L101 161 Q103 155 107 152 Z" className={ARMOR} />
        </g>
      )}

      {/* torso — slumped a touch in sleep, leaned back at rest */}
      <g transform={sleeping ? "rotate(6 82 118)" : resting ? "rotate(-5 82 118)" : undefined}>
        {/* tassets */}
        <path d="M69 122 L95 122 L97 134 Q90 139 82 139 Q74 139 67 134 Z" className={ARMOR} />
        <path d="M75 124 Q75 132 76 136 M82 124 L82 139 M89 124 Q89 132 88 136" fill="none" stroke={LO} strokeWidth="1" opacity="0.25" />

        {/* cuirass */}
        <path d="M68 92 Q65.5 104 70.5 116 Q74 123 82 123 Q90 123 93.5 116 Q98.5 104 96 92 Q89 86 82 86 Q75 86 68 92 Z" className={ARMOR_LIGHT} />
        <path d="M68 92 Q82 83 96 92 Q96.5 100 93.5 106 Q82 98 70.5 106 Q67.5 100 68 92 Z" className={ARMOR} />
        <path d="M70.5 94 Q68.5 104 72.5 114 L75 117 Q70.5 105 72.5 96 Z" fill={HI} opacity="0.2" />
        <path d="M93.5 96 Q95 105 91.5 114 L89 117 Q93 105 91.5 97 Z" fill={LO} opacity="0.16" />
        <path d="M82 102 L85 108 L82 114 L79 108 Z" className={TRIM} />

        {/* head */}
        <g transform={sleeping ? "rotate(13 82 68)" : resting ? "rotate(-7 82 68)" : undefined}>
          <Head cy={64} eyes={sleeping ? "closed" : resting ? "soft" : "open"} />
        </g>

        {/* pauldrons */}
        <ellipse cx="69" cy="93" rx="8.4" ry="6.6" className={ARMOR} />
        <ellipse cx="69" cy="91.8" rx="5.6" ry="4.2" className={ARMOR_LIGHT} />
        <ellipse cx="95" cy="93" rx="8.4" ry="6.6" className={ARMOR} />
        <ellipse cx="95" cy="91.8" rx="5.6" ry="4.2" className={ARMOR_LIGHT} />
      </g>

      {/* arms and the business of her hands */}
      {sharpening ? (
        /* blade across the knee, whetstone hand working */
        <g>
          {/* steadying hand under the flat */}
          <path d="M70 98 Q62 108 64 120 L70 121 Q69 110 75 102 Z" className={ARMOR_LIGHT} />
          <circle cx="68" cy="123" r="3.4" fill={SKIN} />
          {/* the blade, laid flat */}
          <g transform="rotate(8 100 128)">
            <path d="M72 126 L126 126 L132 128 L126 130 L72 130 Z" fill={STEEL} />
            <path d="M72 128 L128 128" stroke={STEEL_DEEP} strokeWidth="1" opacity="0.7" />
            {/* the glint chasing each stroke */}
            {motionOK && (
              <motion.rect
                x="76"
                y="125.4"
                width="10"
                height="1.6"
                rx="0.8"
                fill={HI}
                animate={{ x: [0, 38, 0], opacity: [0, 0.8, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
            <path d="M64 124 Q72 122.5 74 126 Q72 129.5 64 128 Z" className={TRIM} />
          </g>
          {/* working arm */}
          <path d="M94 100 Q104 108 108 118 L102 122 Q98 112 90 106 Z" className={ARMOR_LIGHT} />
          <motion.g
            animate={motionOK ? { x: [-7, 8, -7] } : undefined}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          >
            <circle cx="108" cy="126" r="3.8" fill={SKIN} />
            <rect x="103" y="121" width="10" height="6" rx="2" fill="#8a8066" />
            <rect x="103" y="121" width="10" height="2.4" rx="1.2" fill={HI} opacity="0.25" />
          </motion.g>
          {/* sparks */}
          {motionOK && (
            <g>
              <motion.path
                d="M116 120 L118 124 L122 125 L118 126 L116 130 L114 126 L110 125 L114 124 Z"
                className="fill-gold-300"
                animate={{ opacity: [0, 1, 0], scale: [0.6, 1.1, 0.6] }}
                transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 0.8 }}
              />
              <motion.circle
                cx="122"
                cy="118"
                r="1.6"
                className="fill-gold-200"
                animate={{ opacity: [0, 1, 0], y: [0, -7] }}
                transition={{ duration: 1.1, repeat: Infinity, repeatDelay: 1.3, delay: 0.5 }}
              />
            </g>
          )}
        </g>
      ) : bonfire ? (
        /* both palms open to the fire's warmth */
        <g>
          <path d="M70 98 Q62 106 62 116 L68 118 Q68 108 75 102 Z" className={ARMOR_LIGHT} />
          <path d="M94 98 Q106 104 112 112 L108 118 Q101 110 90 105 Z" className={ARMOR_LIGHT} />
          <circle cx="66" cy="120" r="3.4" fill={SKIN} />
          <motion.g
            animate={motionOK ? { y: [0, -1.5, 0] } : undefined}
            transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
          >
            <ellipse cx="112" cy="115" rx="4.2" ry="3.2" fill={SKIN} transform="rotate(-20 112 115)" />
          </motion.g>
          {/* sword sleeping against the stone */}
          <g transform="rotate(15 118 140)">
            <SwordDown x={118} y={102} />
          </g>
        </g>
      ) : (
        /* hands folded loose in her lap; blade leans on the stone */
        <g>
          <path d="M70 98 Q63 108 66 120 L72 121 Q70 110 76 102 Z" className={ARMOR_LIGHT} />
          <path d="M94 98 Q101 108 98 120 L92 121 Q94 110 88 102 Z" className={ARMOR_LIGHT} />
          <circle cx="78" cy="124" r="3.4" fill={SKIN} />
          <circle cx="86" cy="124" r="3.4" fill={SKIN_SHADE} />
          <g transform="rotate(15 118 140)">
            <SwordDown x={118} y={102} />
          </g>
        </g>
      )}

      {/* moonlit rim */}
      <path d="M68 90 Q65.5 104 70 116" fill="none" stroke={HI} strokeWidth="1.1" opacity="0.26" strokeLinecap="round" />
    </g>
  );
}

/* ------------------------------------------------------- the old mage */

/** The old mage — appears only for the duel, and gives as good as he gets. */
function OldMage({ motionOK }: { motionOK: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 160 190"
      className="h-full w-full overflow-visible"
      animate={motionOK ? { x: [0, -10, 0, 0, -4, 0] } : undefined}
      transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut", times: [0, 0.14, 0.28, 0.7, 0.85, 1] }}
      style={{ transformOrigin: "50% 100%" }}
      aria-hidden
    >
      <ellipse cx="80" cy="176" rx="42" ry="7" className="fill-pine-900" opacity="0.14" />
      {/* dangerous aura */}
      <circle cx="80" cy="96" r="58" className="fill-clay-400 anim-shimmer" opacity="0.08" />

      {/* long robe, folded and shaded */}
      <path d="M62 78 Q58 74 64 72 L96 72 Q102 74 98 78 L108 164 Q110 174 99 175 L61 175 Q50 174 52 164 Z" className="fill-pine-700 dark:fill-pine-600" />
      <path d="M62 90 Q58 130 56 164 L61 172 Q60 130 66 92 Z" fill={LO} opacity="0.2" />
      <path d="M95 92 Q100 130 103 166 L99 172 Q99 130 92 94 Z" fill={LO} opacity="0.14" />
      <path d="M78 78 L74 118 L80 172 L86 118 L82 78 Z" className="fill-gold-500 dark:fill-gold-400" opacity="0.45" />
      <path d="M78 78 L76.5 96 L80 96 L80 78 Z" fill={HI} opacity="0.18" />
      {/* rope belt */}
      <path d="M70 112 Q80 116 94 112" fill="none" stroke="#8a6a3a" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="92" cy="114" r="1.6" fill="#8a6a3a" />

      {/* staff arm, raised to cast */}
      <path d="M94 86 Q108 78 114 62 L120 66 Q114 82 100 92 Z" className="fill-pine-700 dark:fill-pine-600" />
      <circle cx="117" cy="60" r="4" fill={SKIN} />
      {/* gnarled staff */}
      <path d="M118 162 Q116 100 118 40 Q120 34 122 40 Q120 100 122 162 Z" fill="#63472f" />
      <path d="M118 46 Q114 40 116 34 M120 44 Q124 38 122 32" fill="none" stroke="#63472f" strokeWidth="2.4" strokeLinecap="round" />
      <motion.g
        animate={motionOK ? { scale: [1, 1.3, 1], opacity: [0.85, 1, 0.85] } : undefined}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "120px 27px" }}
      >
        <circle cx="120" cy="27" r="8" className="fill-clay-400" opacity="0.85" />
        <circle cx="120" cy="27" r="3.5" className="fill-gold-200" />
        <circle cx="120" cy="27" r="12" className="fill-clay-300" opacity="0.25" />
        <path d="M104 20 L106 24 L110 25 L106 26 L105 30 L103 26 L99 25 L103 24 Z" className="fill-clay-300 anim-twinkle" />
      </motion.g>

      {/* his bolt streaks toward her — she answers it with the parry spark */}
      {motionOK && (
        <g>
          <motion.circle
            cy="34"
            r="4"
            className="fill-clay-400"
            animate={{ cx: [118, 108, -560], opacity: [0, 1, 1], scale: [0.6, 1, 0.8] }}
            transition={{ duration: 6.5, repeat: Infinity, ease: "easeIn", times: [0.62, 0.66, 0.8] }}
            style={{ opacity: 0 }}
          />
          <motion.circle
            cy="34"
            r="2"
            className="fill-gold-200"
            animate={{ cx: [118, 104, -540], opacity: [0, 0.9, 0] }}
            transition={{ duration: 6.5, repeat: Infinity, ease: "easeIn", times: [0.63, 0.68, 0.8] }}
            style={{ opacity: 0 }}
          />
        </g>
      )}

      {/* sleeve arm tucked */}
      <path d="M66 90 Q58 98 59 110 L66 112 Q65 102 71 95 Z" className="fill-pine-700 dark:fill-pine-600" />
      <path d="M58 108 Q57 114 61 116 Q65 117 67 113 Q67 109 64 107 Z" className="fill-pine-800 dark:fill-pine-700" />

      {/* long white beard, layered */}
      <path d="M66 66 Q64 88 74 96 Q80 99 86 96 Q94 88 92 66 Q86 60 79 60 Q72 60 66 66 Z" fill="#f7f1e0" />
      <path d="M74 68 Q73 82 78 90 Q74 84 72 72 Z" fill="#ddd3ba" opacity="0.7" />
      <circle cx="68" cy="66" r="4.6" fill="#f7f1e0" />
      <circle cx="90" cy="66" r="4.6" fill="#f7f1e0" />
      {/* face — wise, but the eyes are sharp */}
      <circle cx="79" cy="60" r="9" fill={SKIN} />
      <path d="M73.5 59 L77 59 M81 59 L84.5 59" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M72.5 55.5 Q75 53.5 77.5 55.5 M80.5 55.5 Q83 53.5 85.5 55.5" fill="none" stroke="#f7f1e0" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M76 64 Q79 65.4 82 64" fill="none" stroke={SKIN_SHADE} strokeWidth="1.2" strokeLinecap="round" />

      {/* hood with a worn point */}
      <path d="M65 56 Q67 36 81 31 Q93 40 91 56 Q85 49 78.5 49 Q71.5 49 65 56 Z" className="fill-pine-800 dark:fill-pine-700" />
      <path d="M67 52 Q70 40 79 36 Q72 42 69 52 Z" fill={HI} opacity="0.1" />
      <circle cx="81" cy="32.5" r="2.4" className="fill-clay-400" />
    </motion.svg>
  );
}

/** A small flickering bonfire for her fireside hours. */
function Bonfire({ motionOK }: { motionOK: boolean }) {
  return (
    <svg viewBox="0 0 64 80" className="h-full w-full overflow-visible" aria-hidden>
      {/* stones ring the pit */}
      <ellipse cx="14" cy="68" rx="4" ry="2.6" className="fill-sand-500 dark:fill-pine-700" />
      <ellipse cx="50" cy="68" rx="4" ry="2.6" className="fill-sand-500 dark:fill-pine-700" />
      <ellipse cx="32" cy="72" rx="5" ry="2.8" className="fill-sand-500 dark:fill-pine-700" />
      {/* logs */}
      <rect x="14" y="63" width="36" height="5" rx="2.5" fill="#63472f" transform="rotate(-8 32 65)" />
      <rect x="14" y="63" width="36" height="5" rx="2.5" fill="#4d3624" transform="rotate(9 32 65)" />
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
      {/* drifting embers and a curl of smoke */}
      {motionOK && (
        <g>
          <motion.circle cx="28" cy="30" r="1.3" className="fill-gold-300" animate={{ y: [-2, -18], opacity: [0.9, 0] }} transition={{ duration: 2.6, repeat: Infinity, repeatDelay: 0.7 }} />
          <motion.circle cx="38" cy="26" r="1.1" className="fill-gold-200" animate={{ y: [0, -16], opacity: [0.8, 0] }} transition={{ duration: 3.1, repeat: Infinity, repeatDelay: 1.4, delay: 1 }} />
          <motion.path
            d="M32 20 Q36 14 33 8 Q31 4 34 0"
            fill="none"
            className="stroke-sand-500 dark:stroke-sand-300"
            strokeWidth="2"
            strokeLinecap="round"
            animate={{ opacity: [0, 0.35, 0], y: [2, -6] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeOut" }}
          />
        </g>
      )}
      {/* warm glow on the ground */}
      <ellipse cx="32" cy="70" rx="24" ry="6" className="fill-gold-400" opacity="0.18" />
    </svg>
  );
}
