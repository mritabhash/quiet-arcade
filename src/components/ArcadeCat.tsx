import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, animate, type AnimationPlaybackControls } from "framer-motion";
import { useSettings } from "../context/SettingsContext";

/**
 * The arcade's resident cat. She lives along the bottom edge of every page
 * and runs on her own small mind: a drifting mood reweights what she feels
 * like doing (naps, wanders, zoomies), she sometimes abandons a walk halfway
 * because she changed it, and now and then she leaves the screen entirely
 * and comes back when she pleases. Reduced motion sends her to a quiet sit.
 */

type Pose = "sit" | "walk" | "stretch" | "yawn" | "jump" | "sleep" | "purr";
type Mood = "lazy" | "curious" | "playful";
type Toy = "ball" | "butterfly" | "mouse";

const FUR = "#d98a66";
const STRIPE = "#ae4d2c";
const CREAM = "#f7f1e0";
const INK = "#1b1824";

function CatArt({ pose }: { pose: Pose }) {
  switch (pose) {
    case "walk":
      return (
        <g className="anim-trot">
          <path d="M20 46 Q8 38 11 26" fill="none" stroke={STRIPE} strokeWidth="5" strokeLinecap="round" className="anim-tailwag" />
          <rect x="26" y="50" width="5" height="16" rx="2.5" fill={FUR} className="anim-paw-a" />
          <rect x="36" y="50" width="5" height="16" rx="2.5" fill={STRIPE} className="anim-paw-b" />
          <rect x="50" y="50" width="5" height="16" rx="2.5" fill={STRIPE} className="anim-paw-a" />
          <rect x="60" y="50" width="5" height="16" rx="2.5" fill={FUR} className="anim-paw-b" />
          <ellipse cx="44" cy="45" rx="24" ry="12" fill={FUR} />
          <path d="M30 38 Q33 44 30 50 M40 36 Q43 43 40 50 M52 36 Q55 43 52 50" fill="none" stroke={STRIPE} strokeWidth="3" strokeLinecap="round" opacity="0.75" />
          <circle cx="68" cy="34" r="12" fill={FUR} />
          <path d="M59 26 L61 13 L69 22 Z" fill={FUR} />
          <path d="M71 21 L77 11 L81 24 Z" fill={FUR} />
          <ellipse cx="66" cy="33" rx="2" ry="3" fill={INK} className="anim-blink" />
          <ellipse cx="74" cy="33" rx="2" ry="3" fill={INK} className="anim-blink" />
          <path d="M76 39 L79 38 M76 41 L80 41" stroke={INK} strokeWidth="1" strokeLinecap="round" opacity="0.5" />
          <path d="M75 37 L77 39 L73 39 Z" fill={STRIPE} />
        </g>
      );
    case "stretch":
      return (
        <g>
          <path d="M14 40 Q6 28 12 18" fill="none" stroke={STRIPE} strokeWidth="5" strokeLinecap="round" className="anim-tailwag" />
          <ellipse cx="26" cy="44" rx="14" ry="13" fill={FUR} />
          <path d="M20 38 Q24 44 20 50" fill="none" stroke={STRIPE} strokeWidth="3" strokeLinecap="round" opacity="0.75" />
          <rect x="18" y="52" width="5" height="15" rx="2.5" fill={FUR} />
          <rect x="27" y="52" width="5" height="15" rx="2.5" fill={STRIPE} />
          <path d="M38 46 Q52 58 66 60 L66 66 L36 66 Z" fill={FUR} />
          <rect x="44" y="61" width="18" height="5" rx="2.5" fill={STRIPE} />
          <circle cx="70" cy="52" r="11" fill={FUR} />
          <path d="M62 45 L63 34 L70 41 Z" fill={FUR} />
          <path d="M72 40 L78 32 L81 44 Z" fill={FUR} />
          <path d="M66 51 Q68 53 70 51 M74 51 Q76 53 78 51" fill="none" stroke={INK} strokeWidth="1.4" strokeLinecap="round" />
          <path d="M76 56 L78 58 L74 58 Z" fill={STRIPE} />
        </g>
      );
    case "yawn":
      return (
        <g>
          <path d="M16 62 Q4 58 9 46" fill="none" stroke={STRIPE} strokeWidth="5" strokeLinecap="round" className="anim-tailwag" />
          <ellipse cx="34" cy="52" rx="17" ry="15" fill={FUR} />
          <path d="M24 42 Q28 50 24 58 M34 40 Q38 49 34 58" fill="none" stroke={STRIPE} strokeWidth="3" strokeLinecap="round" opacity="0.75" />
          <ellipse cx="42" cy="58" rx="8" ry="9" fill={CREAM} />
          <circle cx="48" cy="28" r="13" fill={FUR} />
          <path d="M38 20 L39 7 L47 15 Z" fill={FUR} />
          <path d="M51 14 L58 5 L61 18 Z" fill={FUR} />
          <path d="M42 26 Q44 24 46 26 M52 25 Q54 23 56 25" fill="none" stroke={INK} strokeWidth="1.4" strokeLinecap="round" />
          <ellipse cx="50" cy="35" rx="4.5" ry="5.5" fill={INK} />
          <ellipse cx="50" cy="37.5" rx="2.5" ry="2.5" fill={FUR} opacity="0.85" />
        </g>
      );
    case "jump":
      return (
        <g transform="rotate(-14 50 40)">
          <path d="M16 50 Q6 44 10 32" fill="none" stroke={STRIPE} strokeWidth="5" strokeLinecap="round" />
          <ellipse cx="42" cy="42" rx="23" ry="12" fill={FUR} />
          <path d="M30 34 Q33 41 30 48 M42 33 Q45 41 42 48" fill="none" stroke={STRIPE} strokeWidth="3" strokeLinecap="round" opacity="0.75" />
          <rect x="28" y="48" width="5" height="10" rx="2.5" fill={STRIPE} transform="rotate(30 30 48)" />
          <rect x="54" y="48" width="5" height="11" rx="2.5" fill={FUR} transform="rotate(-34 56 48)" />
          <circle cx="66" cy="30" r="12" fill={FUR} />
          <path d="M57 22 L59 9 L67 18 Z" fill={FUR} />
          <path d="M69 17 L75 7 L79 20 Z" fill={FUR} />
          <circle cx="64" cy="29" r="2.6" fill={INK} />
          <circle cx="72" cy="29" r="2.6" fill={INK} />
          <path d="M73 33 L75 35 L71 35 Z" fill={STRIPE} />
        </g>
      );
    case "sleep":
      return (
        <g>
          <g className="anim-snooze">
            <ellipse cx="38" cy="56" rx="22" ry="12" fill={FUR} />
            <path d="M24 50 Q28 56 24 62 M34 48 Q38 55 34 62" fill="none" stroke={STRIPE} strokeWidth="3" strokeLinecap="round" opacity="0.75" />
            <path d="M18 64 Q40 72 58 62" fill="none" stroke={STRIPE} strokeWidth="5" strokeLinecap="round" />
            <circle cx="52" cy="52" r="10" fill={FUR} />
            <path d="M44 45 L45 35 L52 42 Z" fill={FUR} />
            <path d="M54 41 L60 33 L63 45 Z" fill={FUR} />
            <path d="M48 52 Q50 54 52 52 M55 52 Q57 54 59 52" fill="none" stroke={INK} strokeWidth="1.4" strokeLinecap="round" />
          </g>
          <text x="62" y="38" fontSize="11" fontFamily="Georgia, serif" fill="var(--muted)" className="anim-zfloat">z</text>
          <text x="70" y="30" fontSize="8" fontFamily="Georgia, serif" fill="var(--muted)" className="anim-zfloat-late">z</text>
        </g>
      );
    case "purr":
      return (
        <g>
          <path d="M14 64 Q2 60 7 48" fill="none" stroke={STRIPE} strokeWidth="5" strokeLinecap="round" className="anim-tailwag" />
          <ellipse cx="32" cy="50" rx="16" ry="17" fill={FUR} />
          <path d="M22 40 Q26 49 22 58 M32 38 Q36 48 32 58" fill="none" stroke={STRIPE} strokeWidth="3" strokeLinecap="round" opacity="0.75" />
          <ellipse cx="38" cy="57" rx="8" ry="10" fill={CREAM} />
          <rect x="30" y="58" width="5" height="9" rx="2.5" fill={FUR} />
          <rect x="40" y="58" width="5" height="9" rx="2.5" fill={FUR} />
          <circle cx="46" cy="31" r="13" fill={FUR} />
          <path d="M36 23 L37 10 L45 18 Z" fill={FUR} />
          <path d="M49 17 L56 8 L59 21 Z" fill={FUR} />
          {/* eyes squeezed happy, cheeks warm */}
          <path d="M39 30 Q42 26.5 45 30 M48 30 Q51 26.5 54 30" fill="none" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="39" cy="35" r="2.2" fill="#d9a8a0" opacity="0.65" />
          <circle cx="54" cy="35" r="2.2" fill="#d9a8a0" opacity="0.65" />
          <path d="M49 37 Q51 39 53 37" fill="none" stroke={INK} strokeWidth="1.4" strokeLinecap="round" />
          <path d="M51 34 L53 36 L49 36 Z" fill={STRIPE} />
          <text x="58" y="18" fontSize="9" fontFamily="Georgia, serif" fontStyle="italic" fill="var(--muted)" className="anim-zfloat">prr</text>
        </g>
      );
    default:
      return (
        <g>
          <path d="M14 64 Q2 60 7 48" fill="none" stroke={STRIPE} strokeWidth="5" strokeLinecap="round" className="anim-tailwag" />
          <ellipse cx="32" cy="50" rx="16" ry="17" fill={FUR} />
          <path d="M22 40 Q26 49 22 58 M32 38 Q36 48 32 58" fill="none" stroke={STRIPE} strokeWidth="3" strokeLinecap="round" opacity="0.75" />
          <ellipse cx="38" cy="57" rx="8" ry="10" fill={CREAM} />
          <rect x="30" y="58" width="5" height="9" rx="2.5" fill={FUR} />
          <rect x="40" y="58" width="5" height="9" rx="2.5" fill={FUR} />
          <circle cx="46" cy="31" r="13" fill={FUR} />
          <path d="M36 23 L37 10 L45 18 Z" fill={FUR} />
          <path d="M49 17 L56 8 L59 21 Z" fill={FUR} />
          <ellipse cx="42" cy="30" rx="2.2" ry="3.2" fill={INK} className="anim-blink" />
          <ellipse cx="51" cy="30" rx="2.2" ry="3.2" fill={INK} className="anim-blink" />
          <path d="M52 36 L55 35 M52 38 L56 38" stroke={INK} strokeWidth="1" strokeLinecap="round" opacity="0.5" />
          <path d="M51 34 L53 36 L49 36 Z" fill={STRIPE} />
        </g>
      );
  }
}

/* --- her toys ------------------------------------------------------ */

function BallArt() {
  return (
    <svg viewBox="0 0 28 28" className="h-full w-full">
      <circle cx="14" cy="14" r="11.5" fill="#ae4d2c" />
      <g fill="none" stroke="#d98a66" strokeWidth="1.6" strokeLinecap="round">
        <path d="M4 10 Q14 16 24 10" />
        <path d="M4 18 Q14 12 24 18" />
        <path d="M10 3.5 Q16 14 10 24.5" />
        <path d="M18 3.5 Q12 14 18 24.5" />
      </g>
    </svg>
  );
}

function ButterflyArt() {
  return (
    <svg viewBox="0 0 32 26" className="h-full w-full overflow-visible">
      <g className="anim-flutter">
        <path d="M15 13 Q4 2 2 9 Q1 15 14 15 Z" fill="#e0b654" />
        <path d="M15 15 Q5 24 8 16.5 Q9 13 14 15.5 Z" fill="#d98a66" />
      </g>
      <g className="anim-flutter">
        <path d="M17 13 Q28 2 30 9 Q31 15 18 15 Z" fill="#e0b654" />
        <path d="M17 15 Q27 24 24 16.5 Q23 13 18 15.5 Z" fill="#d98a66" />
      </g>
      <ellipse cx="16" cy="14" rx="1.6" ry="5" fill="#443021" />
      <path d="M15 9 Q13 5 11 4 M17 9 Q19 5 21 4" fill="none" stroke="#443021" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

function MouseArt() {
  return (
    <svg viewBox="0 0 36 24" className="h-full w-full overflow-visible">
      <path d="M8 16 Q-2 14 0 7" fill="none" stroke="#7a748e" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="19" cy="15" rx="12" ry="7.5" fill="#a09bb2" />
      <circle cx="24" cy="8" r="4" fill="#a09bb2" />
      <circle cx="24" cy="8" r="2" fill="#c4c0d1" />
      <circle cx="28.5" cy="13.5" r="1.2" fill="#1b1824" />
      <circle cx="31.5" cy="15.5" r="1.4" fill="#ae4d2c" />
      <path d="M14 22 L14 23.5 M22 22 L22 23.5" stroke="#7a748e" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function ArcadeCat() {
  const { motionOK } = useSettings();
  const [pose, setPose] = useState<Pose>("sit");
  const [dir, setDir] = useState(1);
  const [prop, setProp] = useState<Toy | null>(null);
  const [propDir, setPropDir] = useState(1);
  const [petCount, setPetCount] = useState(0);
  const [hearts, setHearts] = useState<number[]>([]);
  const heartId = useRef(0);
  const x = useMotionValue(typeof window === "undefined" ? 140 : Math.min(180, window.innerWidth * 0.2));
  const y = useMotionValue(0);
  const propX = useMotionValue(-100);
  const propY = useMotionValue(0);
  const propRot = useMotionValue(0);
  const moodRef = useRef<Mood>("curious");

  // A pet: hearts rise, and she drops whatever she was doing to purr.
  // Bumping petCount restarts the brain effect, which opens with a purr.
  const pet = () => {
    const ids = [heartId.current++, heartId.current++, heartId.current++];
    setHearts((h) => [...h.slice(-6), ...ids]);
    setTimeout(() => setHearts((h) => h.filter((id) => !ids.includes(id))), 1600);
    if (motionOK) {
      setPetCount((c) => c + 1);
    } else {
      setPose("purr");
      setTimeout(() => setPose("sit"), 2200);
    }
  };

  useEffect(() => {
    if (!motionOK) {
      setPose("sit");
      setProp(null);
      return;
    }
    let alive = true;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const anims: AnimationPlaybackControls[] = [];

    const later = (fn: () => void, ms: number) => {
      timers.push(setTimeout(() => alive && fn(), ms));
    };
    const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);
    const track = (a: AnimationPlaybackControls) => {
      anims.push(a);
      return a;
    };

    // her mood drifts on its own schedule, nothing external decides it
    const shiftMood = () => {
      moodRef.current = (["lazy", "curious", "playful"] as Mood[])[Math.floor(Math.random() * 3)];
      later(shiftMood, rand(20000, 45000));
    };
    shiftMood();

    const rest = (ms = rand(1400, 3800)) => {
      setPose("sit");
      later(act, ms);
    };

    const walkTo = (target: number, speed: number, after: () => void, whims = true) => {
      setDir(target >= x.get() ? 1 : -1);
      setPose("walk");
      const walk = track(
        animate(x, target, {
          duration: Math.max(0.4, Math.abs(target - x.get()) / speed),
          ease: "linear",
          onComplete: after,
        }),
      );
      // a mind of her own: sometimes she just stops mid-walk and sits down
      if (whims && Math.random() < 0.25) {
        later(() => {
          walk.stop();
          rest();
        }, rand(900, 2200));
      }
    };

    const nap = () => {
      setPose("sleep");
      later(() => {
        setPose("stretch");
        later(() => rest(), 2100);
      }, rand(6000, 14000));
    };

    const pounce = (height: number, after: () => void) => {
      setPose("jump");
      track(animate(y, [0, -height, 0], { duration: 0.55, ease: "easeOut", onComplete: after }));
    };

    // she bats the wool ball, it rolls off, she hunts it back down
    const playBall = () => {
      const W = window.innerWidth;
      propRot.set(0);
      propX.set(Math.min(Math.max(x.get() + 70, 30), W - 90));
      setProp("ball");
      let swats = 2 + Math.floor(Math.random() * 3);
      const swat = () => {
        if (!alive) return;
        if (swats-- <= 0) {
          setProp(null);
          rest();
          return;
        }
        pounce(30, () => {
          const roll = (Math.random() < 0.5 ? -1 : 1) * rand(130, 280);
          const target = Math.min(Math.max(propX.get() + roll, 24), W - 60);
          track(animate(propRot, propRot.get() + (target - propX.get()) * 2.2, { duration: 1.1, ease: "easeOut" }));
          track(
            animate(propX, target, {
              duration: 1.1,
              ease: "easeOut",
              onComplete: () => walkTo(target - 48, 220, swat, false),
            }),
          );
        });
      };
      walkTo(propX.get() - 48, 120, swat, false);
    };

    // a mouse bolts across the floor; she gives chase, the mouse always wins
    const chaseMouse = () => {
      const W = window.innerWidth;
      const fromLeft = Math.random() < 0.5;
      setPropDir(fromLeft ? 1 : -1);
      propX.set(fromLeft ? -70 : W + 40);
      setProp("mouse");
      track(
        animate(propX, fromLeft ? W + 70 : -90, {
          duration: rand(2.6, 3.4),
          ease: "linear",
          onComplete: () => {
            if (alive) setProp(null);
          },
        }),
      );
      later(() => walkTo(fromLeft ? W - 150 : 60, 300, () => rest(rand(600, 1400)), false), 350);
    };

    // a butterfly drifts overhead; she pads along beneath it and leaps
    const chaseButterfly = () => {
      const W = window.innerWidth;
      const fromLeft = Math.random() < 0.5;
      setPropDir(fromLeft ? 1 : -1);
      propX.set(fromLeft ? -50 : W + 30);
      setProp("butterfly");
      const dur = rand(6, 8);
      track(animate(propY, [-150, -185, -140, -190, -150, -200, -160], { duration: dur, ease: "easeInOut" }));
      track(
        animate(propX, fromLeft ? W + 50 : -60, {
          duration: dur,
          ease: "linear",
          onComplete: () => {
            if (alive) setProp(null);
          },
        }),
      );
      later(
        () =>
          walkTo(W / 2 + rand(-120, 120), 140, () => pounce(54, () => rest(rand(800, 1600))), false),
        500,
      );
    };

    const act = () => {
      if (!alive) return;
      const mood = moodRef.current;
      const r = Math.random();
      const W = window.innerWidth;

      if (mood === "playful" && r < 0.18) {
        // zoomies: a flat-out dash across the floor, then an abrupt stop
        walkTo(rand(60, W - 140), 320, () => rest(rand(500, 1200)));
      } else if (r < 0.28) {
        walkTo(rand(60, W - 140), mood === "lazy" ? 55 : 85, () => rest());
      } else if (r < 0.36 && mood !== "lazy") {
        // wanders clean off the page, dwells in the wings, returns when she pleases
        const off = Math.random() < 0.5 ? -120 : W + 40;
        walkTo(off, 95, () => {
          setPose("sit");
          later(() => walkTo(rand(80, W - 160), 85, () => rest()), rand(4000, 11000));
        });
      } else if (r < 0.46) {
        setPose("stretch");
        later(() => rest(), 2100);
      } else if (r < 0.56) {
        setPose("yawn");
        later(() => (mood === "lazy" && Math.random() < 0.6 ? nap() : rest()), 1500);
      } else if (r < 0.66 && mood !== "lazy") {
        setPose("jump");
        track(animate(y, [0, -46, 0], { duration: 0.75, ease: "easeOut", onComplete: () => rest() }));
      } else if (r < 0.8 && mood !== "lazy") {
        // playtime: wool, wings, or whiskers — her pick
        const p = Math.random();
        if (p < 0.5) playBall();
        else if (p < 0.75) chaseButterfly();
        else chaseMouse();
      } else if (r < (mood === "lazy" ? 0.95 : 0.9)) {
        nap();
      } else {
        rest();
      }
    };

    if (petCount > 0) {
      // freshly petted: settle wherever she is and purr before resuming
      y.set(0);
      setProp(null);
      setPose("purr");
      later(act, 2600);
    } else {
      later(act, 1200);
    }
    return () => {
      alive = false;
      timers.forEach(clearTimeout);
      anims.forEach((a) => a.stop());
      setProp(null);
    };
  }, [motionOK, petCount, x, y, propX, propY, propRot]);

  return (
    <>
      {prop === "ball" && (
        <motion.div aria-hidden className="pointer-events-none fixed bottom-1 left-0 z-40 h-6 w-6" style={{ x: propX }}>
          <motion.div style={{ rotate: propRot }} className="h-full w-full">
            <BallArt />
          </motion.div>
        </motion.div>
      )}
      {prop === "butterfly" && (
        <motion.div aria-hidden className="pointer-events-none fixed bottom-0 left-0 z-40 h-7 w-8" style={{ x: propX, y: propY }}>
          <div style={{ transform: `scaleX(${propDir})` }} className="h-full w-full">
            <ButterflyArt />
          </div>
        </motion.div>
      )}
      {prop === "mouse" && (
        <motion.div aria-hidden className="pointer-events-none fixed bottom-1 left-0 z-40 h-5 w-8" style={{ x: propX }}>
          <div style={{ transform: `scaleX(${propDir})` }} className="h-full w-full">
            <MouseArt />
          </div>
        </motion.div>
      )}
      <motion.div
        role="button"
        tabIndex={0}
        aria-label="Pet the cat"
        title="Pet the cat"
        className="fixed bottom-0 left-0 z-40 h-[4.5rem] w-[5.5rem] cursor-pointer select-none rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
        style={{ x }}
        onPointerDown={pet}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            pet();
          }
        }}
      >
        <motion.div style={{ y }} className="relative h-full w-full">
          {hearts.map((id, i) => (
            <motion.span
              key={id}
              aria-hidden
              className="pointer-events-none absolute text-sm text-clay-500"
              style={{ left: 26 + (id % 3) * 16, top: 4 }}
              initial={{ opacity: 0, y: 8, scale: 0.5 }}
              animate={{ opacity: [0, 1, 0], y: -28, scale: 1, rotate: (id % 2 ? 1 : -1) * 14 }}
              transition={{ duration: 1.3, delay: (i % 3) * 0.12, ease: "easeOut" }}
            >
              ♥
            </motion.span>
          ))}
          <svg
            viewBox="0 0 90 70"
            className="h-full w-full overflow-visible drop-shadow-[0_2px_2px_rgba(20,16,30,0.35)]"
            style={{ transform: `scaleX(${dir})` }}
          >
            <CatArt pose={pose} />
          </svg>
        </motion.div>
      </motion.div>
    </>
  );
}
