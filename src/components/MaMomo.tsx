import { motion, AnimatePresence, type TargetAndTransition } from "framer-motion";
import { useSettings } from "../context/SettingsContext";
import { EASE } from "./motion";

/**
 * Ma Momo — Pattern Groups' guardian chipmunk. A teacher through and
 * through: black glasses, a ruler she is not afraid to tap, and a heart
 * of gold underneath. The mood drives her pose, expression, and props;
 * her line appears in a speech bubble that lives in its own reserved row
 * so it never covers the board. Tapping her is... inadvisable.
 */

export type MomoMood =
  | "watch" // supervising: gentle bob, book in paw
  | "happy" // group solved: closed happy eyes, buck teeth
  | "gasp" // mistake: paws to cheeks, wide eyes, round mouth
  | "scold" // repeat mistake / poked a lot: ruler out, brows down
  | "stern" // last warning: still, lids half-lowered
  | "annoyed" // poked: crossed arms, flat eyes, anger mark
  | "celebrate" // puzzle won: bouncing, confetti
  | "sad"; // puzzle lost: droopy everything, one tear

const BODY_ANIM: Record<MomoMood, TargetAndTransition> = {
  watch: { y: [0, -2.5, 0], rotate: 0, transition: { duration: 2.4, repeat: Infinity, ease: "easeInOut" } },
  happy: { y: [0, -5, 0], rotate: 0, transition: { duration: 0.6, repeat: 2 } },
  gasp: { y: [0, -7, 0], rotate: [0, -6, 0], x: -2, transition: { duration: 0.55, ease: "easeOut" } },
  scold: { y: [0, 1.5, 0], rotate: 5, transition: { duration: 0.7, repeat: 3 } },
  stern: { y: 0, rotate: 3, transition: { duration: 0.5 } },
  annoyed: { x: [0, -3, 3, -2, 2, 0], y: 0, transition: { duration: 0.5 } },
  celebrate: { y: [0, -14, 0, -10, 0], rotate: [0, -5, 0, 5, 0], transition: { duration: 1.1, repeat: Infinity, repeatDelay: 0.5 } },
  sad: { y: 2, rotate: 2, transition: { duration: 0.6 } },
};

const INK = "#4a3120";
const FUR = "#c98a52";
const FUR_LIGHT = "#e6c391";
const BELLY = "#f2e2c8";
const STRIPE = "#6f4526";
const BLUSH = "#dd9d92";
const GLASS = "#1f1f1f";

function Brows({ mood }: { mood: MomoMood }) {
  if (mood === "scold" || mood === "stern" || mood === "annoyed")
    return (
      <g stroke={INK} strokeWidth="1.8" strokeLinecap="round">
        <path d="M27 37.5 L35 40" />
        <path d="M55 37.5 L47 40" />
      </g>
    );
  if (mood === "gasp")
    return (
      <g stroke={INK} strokeWidth="1.6" strokeLinecap="round" fill="none">
        <path d="M27.5 36.5 Q31.5 34.5 35.5 36.5" />
        <path d="M46.5 36.5 Q50.5 34.5 54.5 36.5" />
      </g>
    );
  if (mood === "sad")
    return (
      <g stroke={INK} strokeWidth="1.6" strokeLinecap="round">
        <path d="M27.5 40 L35 38" />
        <path d="M54.5 40 L47 38" />
      </g>
    );
  return null;
}

function Eyes({ mood }: { mood: MomoMood }) {
  switch (mood) {
    case "gasp":
      return (
        <g>
          <circle cx="31.5" cy="46" r="3" fill="none" stroke={INK} strokeWidth="1.5" />
          <circle cx="50.5" cy="46" r="3" fill="none" stroke={INK} strokeWidth="1.5" />
          <circle cx="31.5" cy="46" r="1" fill={INK} />
          <circle cx="50.5" cy="46" r="1" fill={INK} />
        </g>
      );
    case "happy":
    case "celebrate":
      return (
        <g stroke={INK} strokeWidth="1.8" strokeLinecap="round" fill="none">
          <path d="M28.5 46.5 Q31.5 43.5 34.5 46.5" />
          <path d="M47.5 46.5 Q50.5 43.5 53.5 46.5" />
        </g>
      );
    case "annoyed":
      return (
        <g stroke={INK} strokeWidth="1.9" strokeLinecap="round">
          <path d="M28.5 46 L34.5 46" />
          <path d="M47.5 46 L53.5 46" />
        </g>
      );
    case "scold":
    case "stern":
      return (
        <g>
          <path d="M28.5 44.3 L34.5 44.3" stroke={INK} strokeWidth="1.7" strokeLinecap="round" />
          <path d="M47.5 44.3 L53.5 44.3" stroke={INK} strokeWidth="1.7" strokeLinecap="round" />
          <circle cx="31.5" cy="46.4" r="1.7" fill={INK} />
          <circle cx="50.5" cy="46.4" r="1.7" fill={INK} />
        </g>
      );
    case "sad":
      return (
        <g>
          <circle cx="31.5" cy="46.4" r="1.9" fill={INK} />
          <circle cx="50.5" cy="46.4" r="1.9" fill={INK} />
          <path d="M34.5 49 Q35.6 51.5 34.3 52.6 Q32.9 51.6 34.5 49" fill="#8fc3d9" />
        </g>
      );
    default:
      return (
        <g fill={INK}>
          <circle cx="31.5" cy="46" r="2.1" />
          <circle cx="50.5" cy="46" r="2.1" />
          <circle cx="32.3" cy="45.2" r="0.7" fill="#fff" />
          <circle cx="51.3" cy="45.2" r="0.7" fill="#fff" />
        </g>
      );
  }
}

function Mouth({ mood }: { mood: MomoMood }) {
  if (mood === "gasp") return <ellipse cx="41" cy="58.5" rx="2.4" ry="3" fill={INK} />;
  if (mood === "celebrate")
    return (
      <g>
        <path d="M37 57 Q41 61.5 45 57 Z" fill={INK} />
        <path d="M39.2 58.6 Q41 60 42.8 58.6 Q41 60.8 39.2 58.6" fill="#e07a70" />
      </g>
    );
  if (mood === "happy" || mood === "watch")
    return (
      <g>
        <path d="M38 57.2 Q41 59.4 44 57.2" fill="none" stroke={INK} strokeWidth="1.5" strokeLinecap="round" />
        <rect x="39.7" y="58.2" width="2.6" height="2.7" rx="0.7" fill="#fff" stroke={INK} strokeWidth="0.9" />
      </g>
    );
  if (mood === "sad")
    return <path d="M37.5 59.6 Q41 56.8 44.5 59.6" fill="none" stroke={INK} strokeWidth="1.5" strokeLinecap="round" />;
  // scold / stern / annoyed
  return <path d="M37.5 59 Q41 57 44.5 59" fill="none" stroke={INK} strokeWidth="1.5" strokeLinecap="round" />;
}

function Paws({ mood }: { mood: MomoMood }) {
  switch (mood) {
    case "gasp":
      return (
        <g fill={FUR} stroke={INK} strokeWidth="1.4">
          <circle cx="29" cy="56.5" r="3.5" />
          <circle cx="53" cy="56.5" r="3.5" />
        </g>
      );
    case "scold":
    case "stern":
      return (
        <g>
          <circle cx="33" cy="67" r="3" fill={FUR} stroke={INK} strokeWidth="1.4" />
          {/* ruler raised in the right paw */}
          <g transform="rotate(-32 57 62)">
            <rect x="55" y="42" width="4.6" height="26" rx="1.2" fill="#e0b56d" stroke={INK} strokeWidth="1.3" />
            <g stroke={INK} strokeWidth="0.9">
              <line x1="55.4" y1="46" x2="57.6" y2="46" />
              <line x1="55.4" y1="50.5" x2="57.6" y2="50.5" />
              <line x1="55.4" y1="55" x2="57.6" y2="55" />
              <line x1="55.4" y1="59.5" x2="57.6" y2="59.5" />
              <line x1="55.4" y1="64" x2="57.6" y2="64" />
            </g>
          </g>
          <circle cx="52" cy="65" r="3" fill={FUR} stroke={INK} strokeWidth="1.4" />
        </g>
      );
    case "annoyed":
      return (
        <g stroke={FUR} strokeWidth="5.4" strokeLinecap="round" fill="none">
          <path d="M31 65.5 Q41 71 51 64" />
          <path d="M51 65.5 Q41 71 31 64" />
        </g>
      );
    case "celebrate":
      return (
        <g fill={FUR} stroke={INK} strokeWidth="1.4">
          <circle cx="24.5" cy="58" r="3.3" />
          <circle cx="57.5" cy="58" r="3.3" />
        </g>
      );
    case "sad":
      return (
        <g fill={FUR} stroke={INK} strokeWidth="1.4">
          <circle cx="30" cy="73" r="3" />
          <circle cx="52" cy="73" r="3" />
        </g>
      );
    default:
      // watching: a tiny open grade-book held in both paws
      return (
        <g>
          <path d="M33 64.5 Q41 60.5 49 64.5 L49 71.5 Q41 67.5 33 71.5 Z" fill="#f6efdd" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
          <line x1="41" y1="62.5" x2="41" y2="69.4" stroke={INK} strokeWidth="1.1" />
          <g stroke="#a49a7e" strokeWidth="0.8">
            <line x1="35.5" y1="65.4" x2="39" y2="64.5" />
            <line x1="35.5" y1="67.4" x2="39" y2="66.5" />
            <line x1="43" y1="64.5" x2="46.5" y2="65.4" />
          </g>
          <circle cx="32.5" cy="68" r="2.7" fill={FUR} stroke={INK} strokeWidth="1.3" />
          <circle cx="49.5" cy="68" r="2.7" fill={FUR} stroke={INK} strokeWidth="1.3" />
        </g>
      );
  }
}

const CONFETTI = [
  { x: 8, y: 16, c: "#c86842", d: 0 },
  { x: 66, y: 10, c: "#49876a", d: 0.15 },
  { x: 20, y: 4, c: "#d19e34", d: 0.3 },
  { x: 58, y: 22, c: "#2d8595", d: 0.45 },
  { x: 36, y: 0, c: "#c86842", d: 0.6 },
  { x: 74, y: 28, c: "#d19e34", d: 0.75 },
];

/** Ma Momo's static art for a given mood — reused by the Cast page. */
export function MomoArt({ mood }: { mood: MomoMood }) {
  return (
    <svg viewBox="0 0 80 96" className="h-full w-full" role="img" aria-label={`Ma Momo looking ${mood}`}>
      {/* tail — a big fluffy question-mark curl behind her */}
      <path
        d="M26 82 Q6 76 9 55 Q11 43 21 46 Q28 49 24 58 Q21 68 31 75 Z"
        fill={FUR}
        stroke={INK}
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M14 68 Q10 58 16 50" fill="none" stroke={STRIPE} strokeWidth="2.4" strokeLinecap="round" opacity="0.7" />
      {/* body */}
      <ellipse cx="41" cy="73" rx="16.5" ry="14.5" fill={FUR} stroke={INK} strokeWidth="1.8" />
      {/* back stripes */}
      <path d="M28.5 65 Q26 73 29.5 81" fill="none" stroke={STRIPE} strokeWidth="2.6" strokeLinecap="round" />
      <path d="M32.5 63.5 Q30 73 33 83" fill="none" stroke={FUR_LIGHT} strokeWidth="2" strokeLinecap="round" />
      {/* belly */}
      <ellipse cx="43" cy="77" rx="9.5" ry="8" fill={BELLY} />
      {/* feet */}
      <ellipse cx="33" cy="88.5" rx="5.5" ry="3" fill={FUR} stroke={INK} strokeWidth="1.5" />
      <ellipse cx="50" cy="88.5" rx="5.5" ry="3" fill={FUR} stroke={INK} strokeWidth="1.5" />
      {/* ears */}
      <circle cx="30" cy="31.5" r="4.9" fill={FUR} stroke={INK} strokeWidth="1.7" />
      <circle cx="52" cy="31.5" r="4.9" fill={FUR} stroke={INK} strokeWidth="1.7" />
      <circle cx="30.5" cy="32" r="2.2" fill={BLUSH} opacity="0.75" />
      <circle cx="51.5" cy="32" r="2.2" fill={BLUSH} opacity="0.75" />
      {/* head */}
      <circle cx="41" cy="45.5" r="15.5" fill={FUR} stroke={INK} strokeWidth="1.8" />
      {/* crown stripe running down between the lenses */}
      <path d="M39 30.6 Q41 29.4 43 30.6 L42.2 41.2 Q41 41.9 39.8 41.2 Z" fill={STRIPE} opacity="0.8" />
      {/* chubby cheek pouches */}
      <circle cx="29.5" cy="52.5" r="4.7" fill={FUR_LIGHT} />
      <circle cx="52.5" cy="52.5" r="4.7" fill={FUR_LIGHT} />
      <circle cx="28.5" cy="52" r="2.3" fill={BLUSH} opacity="0.6" />
      <circle cx="53.5" cy="52" r="2.3" fill={BLUSH} opacity="0.6" />
      <Brows mood={mood} />
      {/* the famous black glasses */}
      <g>
        <rect x="25.5" y="41" width="12" height="9.5" rx="3.4" fill="#ffffff" opacity="0.14" />
        <rect x="25.5" y="41" width="12" height="9.5" rx="3.4" fill="none" stroke={GLASS} strokeWidth="2" />
        <rect x="44.5" y="41" width="12" height="9.5" rx="3.4" fill="#ffffff" opacity="0.14" />
        <rect x="44.5" y="41" width="12" height="9.5" rx="3.4" fill="none" stroke={GLASS} strokeWidth="2" />
        <path d="M37.5 44.8 Q41 43.3 44.5 44.8" fill="none" stroke={GLASS} strokeWidth="1.8" />
        <line x1="25.5" y1="44.2" x2="21.5" y2="42.5" stroke={GLASS} strokeWidth="1.8" strokeLinecap="round" />
        <line x1="56.5" y1="44.2" x2="60.5" y2="42.5" stroke={GLASS} strokeWidth="1.8" strokeLinecap="round" />
      </g>
      <Eyes mood={mood} />
      {/* nose */}
      <path d="M39.6 53.4 Q41 52.5 42.4 53.4 Q41.9 55.2 41 55.4 Q40.1 55.2 39.6 53.4" fill={INK} />
      <Mouth mood={mood} />
      {/* tiny teacher collar */}
      <path d="M35 61.5 Q41 64.5 47 61.5 L45.5 64.8 Q41 66.8 36.5 64.8 Z" fill="#f6efdd" stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />
      <Paws mood={mood} />
      {/* anger mark when poked */}
      {mood === "annoyed" && (
        <g stroke="#c0533b" strokeWidth="1.6" strokeLinecap="round" fill="none">
          <path d="M59 30 Q61 32 63 30" />
          <path d="M61 27.5 Q61.7 29.5 61 31.5" transform="rotate(90 61 29.5)" />
        </g>
      )}
    </svg>
  );
}

export function MaMomo({ mood, line, onPoke }: { mood: MomoMood; line: string; onPoke: () => void }) {
  const { motionOK } = useSettings();

  return (
    <div className="flex min-h-[6.5rem] items-end gap-3">
      <motion.button
        type="button"
        onClick={onPoke}
        whileTap={{ scale: 0.9 }}
        className="relative h-24 w-20 shrink-0 cursor-pointer rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2"
        aria-label="Ma Momo, the guardian chipmunk. Poke at your own risk."
        title="Ma Momo (do not poke)"
      >
        {motionOK && mood === "celebrate" && (
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            {CONFETTI.map((c, i) => (
              <motion.span
                key={i}
                className="absolute h-1.5 w-1.5 rounded-[2px]"
                style={{ left: c.x, top: c.y, backgroundColor: c.c }}
                initial={{ opacity: 0, y: 8, rotate: 0 }}
                animate={{ opacity: [0, 1, 0], y: [-4, -18], rotate: 200 }}
                transition={{ duration: 1.4, delay: c.d, repeat: Infinity, repeatDelay: 0.6 }}
              />
            ))}
          </div>
        )}
        <motion.div
          className="h-full w-full"
          animate={motionOK ? BODY_ANIM[mood] : undefined}
          style={{ transformOrigin: "50% 92%" }}
        >
          <MomoArt mood={mood} />
        </motion.div>
      </motion.button>

      <AnimatePresence mode="wait">
        <motion.div
          key={line}
          initial={{ opacity: 0, y: 6, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.3, ease: EASE }}
          className="qa-card relative mb-6 max-w-64 rounded-2xl rounded-bl-sm px-3.5 py-2.5 text-sm leading-snug"
          aria-live="polite"
        >
          {line}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
