import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSettings } from "../context/SettingsContext";
import { EASE } from "./motion";

/**
 * Andrew Glowbug — the trivia vault's guardian. A luminous green glowworm
 * of impeccable breeding: tuxedo top, spectacles, top hat, cane. He drifts
 * about the empty margins of the page and delivers a politely devastating
 * remark every time an answer goes astray. Purely decorative overlay —
 * never intercepts the pointer, hides where there are no margins to haunt,
 * and perches quietly in a corner when motion is reduced.
 */

const GREETING = "Andrew Glowbug, guardian of this vault. Do try to be sensible.";

/* even correct answers earn no warmth — merely a suspension of criticism */
const BEGRUDGING_LINES = [
  "Correct. Kindly refrain from looking pleased.",
  "Adequate.",
  "Correct — as it should have been all along.",
  "One right answer does not a scholar make.",
  "Hmm. Proceed.",
  "I shall note it. Without enthusiasm.",
];

const JUDGE_LINES = [
  "Hmm. One rather hoped for better.",
  "A bold choice. Bold, and quite wrong.",
  "I shan't say I'm disappointed. I shall merely look it.",
  "The answer was practically waving at you, old bean.",
  "Do compose yourself. The vault is watching.",
  "Most regrettable. Shall we agree that never happened?",
  "In my day, one simply knew these things.",
  "I've polished my spectacles. It remains wrong, I'm afraid.",
  "Full marks for courage. None, alas, for accuracy.",
  "The cane and I are withholding comment.",
  "One assumes that was a slip of the finger.",
  "How thrillingly incorrect.",
];

const BUBBLE_MS = 5200;
/** he relocates roughly every two minutes… */
const STAND_STILL_MS = 105_000;
const STAND_STILL_JITTER_MS = 45_000;
/** …and takes his time about it */
const GLIDE_SECONDS = 32;

/** the centered content column he must never loom over */
const CONTENT_WIDTH = 830;
const WORM_WIDTH = 96;

interface Spot {
  x: number;
  y: number;
  left: boolean;
}

/** a waypoint strictly inside the page's side gutters, clear of all text */
function pickSpot(): Spot {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const gutter = Math.max(0, (w - CONTENT_WIDTH) / 2);
  const room = Math.max(8, gutter - WORM_WIDTH - 16);
  const left = Math.random() < 0.5;
  const x = left ? 12 + Math.random() * room : w - WORM_WIDTH - 12 - Math.random() * room;
  const y = h * 0.16 + Math.random() * (h * 0.58);
  return { x, y, left };
}

function Worm({ judging }: { judging: boolean }) {
  return (
    <svg viewBox="0 0 110 130" className="h-full w-full" role="img" aria-label="Andrew Glowbug, guardian of the vault">
      <defs>
        <radialGradient id="andrewGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#9fd08a" stopOpacity="0.5" />
          <stop offset="55%" stopColor="#9fd08a" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#9fd08a" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* the glow that makes him a glowworm */}
      <circle cx="52" cy="86" r="46" fill="url(#andrewGlow)" />

      {/* tail segments, curled behind like a settee */}
      <ellipse cx="76" cy="112" rx="11" ry="8.5" fill="#8bbf74" stroke="#3f5a35" strokeWidth="1.8" />
      <ellipse cx="59" cy="112" rx="11.5" ry="9.5" fill="#9fd08a" stroke="#3f5a35" strokeWidth="1.8" />
      <ellipse cx="44" cy="106" rx="11" ry="10" fill="#8bbf74" stroke="#3f5a35" strokeWidth="1.8" />
      {/* tail tip light */}
      <circle cx="84" cy="109" r="3.4" fill="#e8f6c8" stroke="#3f5a35" strokeWidth="1.2" />

      {/* torso in the tuxedo top */}
      <ellipse cx="38" cy="83" rx="13" ry="17" fill="#2b2b33" stroke="#1b1b21" strokeWidth="1.8" />
      {/* jacket lapels + shirt front */}
      <path d="M38 68 L32 78 L38 92 L44 78 Z" fill="#f4efe2" />
      <path d="M38 68 L30 80 L33 82 L38 72 Z" fill="#1b1b21" />
      <path d="M38 68 L46 80 L43 82 L38 72 Z" fill="#1b1b21" />
      {/* shirt buttons */}
      <circle cx="38" cy="82" r="0.9" fill="#2b2b33" />
      <circle cx="38" cy="86" r="0.9" fill="#2b2b33" />
      {/* bow tie */}
      <path d="M33 69 L38 71.5 L43 69 L43 74 L38 71.5 L33 74 Z" fill="#49876a" stroke="#1b1b21" strokeWidth="1" />

      {/* right arm folded behind the back, as one does */}
      <path d="M28 84 Q22 90 27 96" fill="none" stroke="#3f5a35" strokeWidth="4.5" strokeLinecap="round" />

      {/* left arm holding the cane */}
      <path d="M48 84 Q56 88 59 95" fill="none" stroke="#2b2b33" strokeWidth="4.5" strokeLinecap="round" />
      <circle cx="60" cy="96" r="3.2" fill="#f4efe2" stroke="#3f5a35" strokeWidth="1.2" />
      {/* the cane */}
      <line x1="61" y1="74" x2="61" y2="118" stroke="#6b4a2b" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M61 74 Q61 66 53 67" fill="none" stroke="#b78325" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="61" cy="118" r="1.8" fill="#b78325" />

      {/* head */}
      <circle cx="38" cy="52" r="14.5" fill="#9fd08a" stroke="#3f5a35" strokeWidth="1.8" />

      {/* top hat, at a gentleman's tilt */}
      <g transform="rotate(-7 38 40)">
        <rect x="29" y="22" width="18" height="17" rx="2" fill="#2b2b33" stroke="#1b1b21" strokeWidth="1.6" />
        <rect x="29" y="33" width="18" height="4" fill="#49876a" />
        <ellipse cx="38" cy="40" rx="14" ry="3.6" fill="#2b2b33" stroke="#1b1b21" strokeWidth="1.6" />
      </g>

      {/* spectacles */}
      <g stroke="#b78325" strokeWidth="1.6" fill="none">
        <circle cx="31.5" cy="52.5" r="4.6" />
        <circle cx="44.5" cy="52.5" r="4.6" />
        <path d="M36.1 52.5 L39.9 52.5" />
        <path d="M26.9 52 L24 50.5" />
        <path d="M49.1 52 L52 50.5" />
      </g>

      {/* the face: permanently, profoundly unimpressed. He does not smile. */}
      <g>
        {/* heavy brows knotted toward the bridge — steeper when judging */}
        <path
          d={judging ? "M27.5 45.5 L34.8 49" : "M28 46.5 L34.6 48.6"}
          stroke="#3f5a35" strokeWidth="2.4" strokeLinecap="round"
        />
        <path
          d={judging ? "M48.5 45.5 L41.2 49" : "M48 46.5 L41.4 48.6"}
          stroke="#3f5a35" strokeWidth="2.4" strokeLinecap="round"
        />
        {/* half-lidded eyes that have seen every wrong answer before */}
        <path d="M28.8 52 L34.2 52" stroke="#3a2c22" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M41.8 52 L47.2 52" stroke="#3a2c22" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="31.5" cy="53.6" r="1.2" fill="#3a2c22" />
        <circle cx="44.5" cy="53.6" r="1.2" fill="#3a2c22" />
      </g>

      {/* a distinguished grey beard, combed and grave */}
      <g>
        <path
          d="M26.5 55 Q25.5 68 32 72.5 Q38 76 44 72.5 Q50.5 68 49.5 55 Q46 60.5 38 60.5 Q30 60.5 26.5 55 Z"
          fill="#ddd6c2" stroke="#8a8066" strokeWidth="1.4" strokeLinejoin="round"
        />
        {/* comb lines */}
        <path d="M33 63 Q33.5 68 35.5 71" fill="none" stroke="#b3a98d" strokeWidth="1" strokeLinecap="round" />
        <path d="M38 63.5 Q38 69 38 72.5" fill="none" stroke="#b3a98d" strokeWidth="1" strokeLinecap="round" />
        <path d="M43 63 Q42.5 68 40.5 71" fill="none" stroke="#b3a98d" strokeWidth="1" strokeLinecap="round" />
        {/* moustache over a mouth set in a hard, disapproving line */}
        <path d="M30.5 58.5 Q34 61.5 38 60 Q42 61.5 45.5 58.5" fill="none" stroke="#c9c0a6" strokeWidth="2.6" strokeLinecap="round" />
        <path d="M34.5 63.5 L41.5 63.5" stroke="#6d6450" strokeWidth="1.4" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export function AndrewGlowbug({
  playing,
  misses,
  rights = 0,
}: {
  playing: boolean;
  misses: number;
  rights?: number;
}) {
  const { motionOK } = useSettings();
  const [spot, setSpot] = useState<Spot>(() => ({ x: 24, y: window.innerHeight - 200, left: true }));
  const [line, setLine] = useState<string | null>(GREETING);
  const [judging, setJudging] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const lastLineRef = useRef(-1);
  const prevMissesRef = useRef(misses);

  const say = (text: string, judge: boolean) => {
    clearTimeout(timerRef.current);
    setLine(text);
    setJudging(judge);
    timerRef.current = setTimeout(() => {
      setLine(null);
      setJudging(false);
    }, BUBBLE_MS);
  };

  /* the greeting fades on its own */
  useEffect(() => {
    timerRef.current = setTimeout(() => setLine(null), BUBBLE_MS + 1500);
    return () => clearTimeout(timerRef.current);
  }, []);

  /* every miss earns a fresh remark */
  useEffect(() => {
    if (misses > prevMissesRef.current) {
      let i = Math.floor(Math.random() * JUDGE_LINES.length);
      if (i === lastLineRef.current) i = (i + 1) % JUDGE_LINES.length;
      lastLineRef.current = i;
      say(JUDGE_LINES[i], true);
    }
    prevMissesRef.current = misses;
  }, [misses]);

  /* right answers get, at most, a withering acknowledgement */
  const prevRightsRef = useRef(rights);
  useEffect(() => {
    if (rights > prevRightsRef.current && Math.random() < 0.35) {
      say(BEGRUDGING_LINES[Math.floor(Math.random() * BEGRUDGING_LINES.length)], true);
    }
    prevRightsRef.current = rights;
  }, [rights]);

  /* a kindly word when a fresh round begins */
  useEffect(() => {
    if (playing) say("Fifteen questions. I shall be observing. Closely.", false);
  }, [playing]);

  /* He stands still. Roughly every two minutes he glides — slowly, with
     dignity — to another patch of empty margin, and resumes standing still. */
  const driftTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const scheduleDrift = () => {
    clearTimeout(driftTimerRef.current);
    driftTimerRef.current = setTimeout(
      () => setSpot(pickSpot()),
      STAND_STILL_MS + Math.random() * STAND_STILL_JITTER_MS,
    );
  };

  useEffect(() => {
    if (motionOK) scheduleDrift();
    return () => clearTimeout(driftTimerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [motionOK]);

  return (
    <motion.div
      className="pointer-events-none fixed left-0 top-0 z-30 hidden lg:block"
      initial={false}
      animate={motionOK ? { x: spot.x, y: spot.y } : { x: 16, y: window.innerHeight - 190 }}
      transition={{ duration: motionOK ? GLIDE_SECONDS : 0, ease: "easeInOut" }}
      onAnimationComplete={motionOK ? scheduleDrift : undefined}
      aria-hidden={line === null}
    >
      <motion.div
        className="relative h-28 w-24"
        animate={
          motionOK
            ? judging
              ? { y: 0, rotate: -4, scale: 1.05 }
              : { y: [0, -3, 0], rotate: 0, scale: 1, transition: { duration: 5.5, repeat: Infinity, ease: "easeInOut" } }
            : undefined
        }
        style={{ transformOrigin: "50% 85%" }}
      >
        <Worm judging={judging} />
      </motion.div>

      <AnimatePresence>
        {line && (
          <motion.div
            key={line}
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3, ease: EASE }}
            className={`qa-card absolute top-1 w-52 rounded-2xl px-3.5 py-2.5 text-sm italic leading-snug shadow-md ${
              spot.left ? "left-full ml-2 rounded-bl-sm" : "right-full mr-2 rounded-br-sm"
            }`}
            aria-live="polite"
          >
            {line}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
