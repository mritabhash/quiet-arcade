import { motion, AnimatePresence, type TargetAndTransition } from "framer-motion";
import { useSettings } from "../context/SettingsContext";
import { EASE } from "./motion";

/**
 * Map Drop's rabbit companion — a small detective who reacts to how the
 * round is going. The mood drives the pose, expression, tiny props, and
 * body animation; the line appears in a soft speech bubble.
 */

export type RabbitMood =
  | "curious" // round start: ears up, eyes wide
  | "investigating" // clue revealed: magnifying glass out
  | "tempted" // hovering the reveal button
  | "pointing" // map focused: holds a compass
  | "sleepy" // player idle too long: tiny watch, droopy ears
  | "celebrate" // correct on few clues: jumping, confetti
  | "happy" // correct mid-clues: content nod
  | "relieved" // correct on all clues: soft exhale
  | "squint" // close but wrong: squinting at the map
  | "shocked"; // very far wrong: dramatic fall

const BODY_ANIM: Record<RabbitMood, TargetAndTransition> = {
  curious: { y: [0, -3, 0], rotate: 0, transition: { duration: 2.2, repeat: Infinity, ease: "easeInOut" } },
  investigating: { y: 0, rotate: [-2, 2, -2], transition: { duration: 2.6, repeat: Infinity, ease: "easeInOut" } },
  tempted: { y: 0, rotate: 6, x: 3, transition: { duration: 0.4, ease: EASE } },
  pointing: { y: [0, -2, 0], rotate: -4, transition: { duration: 2, repeat: Infinity, ease: "easeInOut" } },
  sleepy: { y: 2, rotate: 3, transition: { duration: 0.6 } },
  celebrate: { y: [0, -16, 0, -12, 0], rotate: [0, -6, 0, 6, 0], transition: { duration: 1.1, repeat: Infinity, repeatDelay: 0.4 } },
  happy: { y: [0, -4, 0], rotate: 0, transition: { duration: 0.7, repeat: 2 } },
  relieved: { y: [0, 2, 0], rotate: [0, 1.5, 0], transition: { duration: 2.8, repeat: Infinity, ease: "easeInOut" } },
  squint: { y: 0, rotate: -6, x: -3, transition: { duration: 0.4 } },
  shocked: { y: [0, -8, 4], rotate: [0, 0, 84], x: [0, 0, 10], transition: { duration: 0.9, times: [0, 0.35, 1], ease: "easeIn" } },
};

const EAR_LEFT: Record<RabbitMood, string> = {
  curious: "M30 34 Q22 8 30 4 Q37 8 35 34",
  investigating: "M30 34 Q20 12 26 5 Q34 8 35 34",
  tempted: "M30 34 Q24 12 32 5 Q38 10 35 34",
  pointing: "M30 34 Q22 8 30 4 Q37 8 35 34",
  sleepy: "M30 34 Q16 26 14 32 Q20 38 33 36",
  celebrate: "M30 34 Q18 10 24 3 Q33 6 35 34",
  happy: "M30 34 Q22 8 30 4 Q37 8 35 34",
  relieved: "M30 34 Q20 18 20 12 Q28 12 35 34",
  squint: "M30 34 Q24 14 30 7 Q36 10 35 34",
  shocked: "M30 34 Q14 14 10 6 Q22 8 35 34",
};

const EAR_RIGHT: Record<RabbitMood, string> = {
  curious: "M45 34 Q43 8 51 4 Q58 9 50 34",
  investigating: "M45 34 Q46 10 54 5 Q60 12 50 34",
  tempted: "M45 34 Q44 12 52 6 Q58 12 50 34",
  pointing: "M45 34 Q43 8 51 4 Q58 9 50 34",
  sleepy: "M45 34 Q58 26 62 32 Q56 38 47 36",
  celebrate: "M45 34 Q50 8 58 3 Q63 8 50 34",
  happy: "M45 34 Q43 8 51 4 Q58 9 50 34",
  relieved: "M45 34 Q54 18 58 14 Q58 22 50 34",
  squint: "M45 34 Q44 14 50 7 Q56 12 50 34",
  shocked: "M45 34 Q60 12 66 6 Q56 10 50 34",
};

function Eyes({ mood }: { mood: RabbitMood }) {
  switch (mood) {
    case "shocked":
      return (
        <g>
          <circle cx="33" cy="48" r="3.4" fill="none" stroke="#3a2c22" strokeWidth="1.6" />
          <circle cx="47" cy="48" r="3.4" fill="none" stroke="#3a2c22" strokeWidth="1.6" />
          <circle cx="33" cy="48" r="1.1" fill="#3a2c22" />
          <circle cx="47" cy="48" r="1.1" fill="#3a2c22" />
        </g>
      );
    case "squint":
    case "investigating":
      return (
        <g stroke="#3a2c22" strokeWidth="1.8" strokeLinecap="round">
          <path d="M30 48 L36 47" />
          <path d="M44 47 L50 48" />
        </g>
      );
    case "sleepy":
      return (
        <g stroke="#3a2c22" strokeWidth="1.8" strokeLinecap="round">
          <path d="M30 49 Q33 51 36 49" fill="none" />
          <path d="M44 49 Q47 51 50 49" fill="none" />
        </g>
      );
    case "celebrate":
    case "happy":
    case "relieved":
      return (
        <g stroke="#3a2c22" strokeWidth="1.8" strokeLinecap="round" fill="none">
          <path d="M30 48 Q33 44.5 36 48" />
          <path d="M44 48 Q47 44.5 50 48" />
        </g>
      );
    default:
      return (
        <g fill="#3a2c22">
          <circle cx="33" cy="48" r="2.1" />
          <circle cx="47" cy="48" r="2.1" />
          <circle cx="33.8" cy="47.2" r="0.7" fill="#fff" />
          <circle cx="47.8" cy="47.2" r="0.7" fill="#fff" />
        </g>
      );
  }
}

function Mouth({ mood }: { mood: RabbitMood }) {
  if (mood === "shocked") return <ellipse cx="40" cy="56" rx="2.6" ry="3.4" fill="#3a2c22" />;
  if (mood === "celebrate" || mood === "happy")
    return <path d="M36 55 Q40 59 44 55" fill="none" stroke="#3a2c22" strokeWidth="1.6" strokeLinecap="round" />;
  if (mood === "sleepy" || mood === "relieved")
    return <path d="M37.5 56 Q40 57.5 42.5 56" fill="none" stroke="#3a2c22" strokeWidth="1.4" strokeLinecap="round" />;
  return (
    <path d="M40 53.5 L40 55.5 M37.5 56.5 Q40 58 42.5 56.5" fill="none" stroke="#3a2c22" strokeWidth="1.4" strokeLinecap="round" />
  );
}

function Prop({ mood }: { mood: RabbitMood }) {
  switch (mood) {
    case "investigating":
      return (
        <g>
          {/* magnifying glass in the right paw */}
          <circle cx="62" cy="64" r="6" fill="none" stroke="#8a6a3a" strokeWidth="2" />
          <circle cx="62" cy="64" r="4.4" fill="#cfe4e6" opacity="0.55" />
          <line x1="66" y1="69" x2="71" y2="75" stroke="#8a6a3a" strokeWidth="2.4" strokeLinecap="round" />
        </g>
      );
    case "pointing":
      return (
        <g>
          {/* little compass */}
          <circle cx="62" cy="66" r="6" fill="#f0e6cf" stroke="#8a6a3a" strokeWidth="1.8" />
          <path d="M62 62 L64 66 L62 70 L60 66 Z" fill="#b4552f" />
          <circle cx="62" cy="66" r="0.9" fill="#3a2c22" />
        </g>
      );
    case "sleepy":
      return (
        <g>
          {/* tiny pocket watch */}
          <circle cx="61" cy="67" r="5" fill="#f0e6cf" stroke="#8a6a3a" strokeWidth="1.6" />
          <line x1="61" y1="67" x2="61" y2="64" stroke="#3a2c22" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="61" y1="67" x2="63.4" y2="67" stroke="#3a2c22" strokeWidth="1.2" strokeLinecap="round" />
          <text x="66" y="56" fontSize="7" fill="#8a8066">z</text>
          <text x="70" y="50" fontSize="5" fill="#a49a7e">z</text>
        </g>
      );
    case "squint":
      return (
        <g>
          {/* pointing paw toward the map */}
          <path d="M58 66 Q66 62 71 63" fill="none" stroke="#e9dcc3" strokeWidth="5" strokeLinecap="round" />
        </g>
      );
    default:
      return null;
  }
}

const CONFETTI = [
  { x: 8, y: 18, c: "#c86842", d: 0 },
  { x: 66, y: 12, c: "#49876a", d: 0.15 },
  { x: 20, y: 6, c: "#d19e34", d: 0.3 },
  { x: 58, y: 24, c: "#2d8595", d: 0.45 },
  { x: 36, y: 2, c: "#c86842", d: 0.6 },
  { x: 74, y: 30, c: "#d19e34", d: 0.75 },
];

/** The rabbit's static art for a given mood — reused by the Cast page. */
export function RabbitArt({ mood }: { mood: RabbitMood }) {
  return (
    <svg viewBox="0 0 80 96" className="h-full w-full" role="img" aria-label={`Rabbit guide looking ${mood}`}>
      {/* ears */}
      <path d={EAR_LEFT[mood]} fill="#e9dcc3" stroke="#3a2c22" strokeWidth="1.8" strokeLinejoin="round" />
      <path d={EAR_RIGHT[mood]} fill="#e9dcc3" stroke="#3a2c22" strokeWidth="1.8" strokeLinejoin="round" />
      <path d={EAR_LEFT[mood]} fill="#d9a8a0" opacity="0.5" transform="translate(2 4) scale(0.82)" />
      <path d={EAR_RIGHT[mood]} fill="#d9a8a0" opacity="0.5" transform="translate(4 4) scale(0.82)" />
      {/* body */}
      <ellipse cx="40" cy="74" rx="19" ry="16" fill="#e9dcc3" stroke="#3a2c22" strokeWidth="1.8" />
      {/* belly */}
      <ellipse cx="40" cy="78" rx="10" ry="8.5" fill="#f6efdd" />
      {/* head */}
      <circle cx="40" cy="48" r="15.5" fill="#e9dcc3" stroke="#3a2c22" strokeWidth="1.8" />
      {/* cheeks */}
      <circle cx="29" cy="53" r="2.6" fill="#d9a8a0" opacity="0.6" />
      <circle cx="51" cy="53" r="2.6" fill="#d9a8a0" opacity="0.6" />
      <Eyes mood={mood} />
      <Mouth mood={mood} />
      {/* feet */}
      <ellipse cx="30" cy="88" rx="6" ry="3.4" fill="#e9dcc3" stroke="#3a2c22" strokeWidth="1.6" />
      <ellipse cx="50" cy="88" rx="6" ry="3.4" fill="#e9dcc3" stroke="#3a2c22" strokeWidth="1.6" />
      <Prop mood={mood} />
    </svg>
  );
}

export function RabbitGuide({ mood, line }: { mood: RabbitMood; line: string }) {
  const { motionOK } = useSettings();

  return (
    <div className="flex items-end gap-3" aria-live="polite">
      <motion.div
        className="relative h-24 w-20 shrink-0"
        animate={motionOK ? BODY_ANIM[mood] : undefined}
        style={{ transformOrigin: "50% 90%" }}
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
        <RabbitArt mood={mood} />
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key={line}
          initial={{ opacity: 0, y: 6, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.3, ease: EASE }}
          className="qa-card relative mb-6 max-w-56 rounded-2xl rounded-bl-sm px-3.5 py-2.5 text-sm leading-snug"
        >
          {line}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
