import { useRef, type ReactNode } from "react";
import { motion, useMotionValue, useMotionTemplate, useSpring, useTransform } from "framer-motion";
import { useSettings } from "../context/SettingsContext";

/**
 * A cursor-following mask reveal: the everyday `base` scene sits on top, and a
 * soft circular window trails the cursor to reveal a hidden `reveal` layer
 * underneath — a magical window into another version of the same scene.
 *
 * The window irises open when the cursor enters and closes when it leaves, and
 * the spotlight trails the cursor with a spring so the motion reads smooth and
 * cinematic rather than snapping. Under reduced motion the follow is near-instant
 * and the iris opens without the lazy easing. Touch devices simply see the base.
 */
export function SpotlightReveal({
  base,
  reveal,
  radius = 74,
  hint = "hover to reveal",
  className = "",
}: {
  base: ReactNode;
  reveal: ReactNode;
  /** Radius of the fully-open window, in plate pixels. */
  radius?: number;
  /** Quiet affordance shown until the cursor enters; pass "" to hide. */
  hint?: string;
  className?: string;
}) {
  const { motionOK } = useSettings();
  const wrap = useRef<HTMLDivElement>(null);

  // raw pointer position (px, relative to the plate) + how far open the window is
  const px = useMotionValue(-999);
  const py = useMotionValue(-999);
  const strength = useMotionValue(0);

  // the spotlight trails the cursor; the window irises open/closed. Reduced
  // motion collapses both springs to something effectively instant.
  const posCfg = motionOK ? { stiffness: 260, damping: 30, mass: 0.7 } : { stiffness: 1600, damping: 90 };
  const irisCfg = motionOK ? { stiffness: 170, damping: 24, mass: 0.8 } : { stiffness: 1600, damping: 90 };

  const sx = useSpring(px, posCfg);
  const sy = useSpring(py, posCfg);
  const open = useSpring(strength, irisCfg);

  const r = useTransform(open, (v) => v * radius); // feathered outer edge
  const rCore = useTransform(open, (v) => v * radius * 0.6); // solid core
  const rGlow = useTransform(open, (v) => v * radius * 1.35); // rim-light reach

  // feathered circular window that follows the cursor
  const mask = useMotionTemplate`radial-gradient(circle ${r}px at ${sx}px ${sy}px, #000 0px, #000 ${rCore}px, transparent ${r}px)`;
  // a soft warm-to-cool rim of light around the window's edge
  const glow = useMotionTemplate`radial-gradient(circle ${rGlow}px at ${sx}px ${sy}px, rgba(226,182,84,0) 0px, rgba(226,182,84,0.26) ${rCore}px, rgba(120,190,200,0.12) ${r}px, transparent ${rGlow}px)`;
  const glowOpacity = useTransform(open, [0, 0.15, 1], [0, 0.5, 1]);

  function move(e: React.PointerEvent) {
    const el = wrap.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    px.set(e.clientX - rect.left);
    py.set(e.clientY - rect.top);
  }

  function enter(e: React.PointerEvent) {
    const el = wrap.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    px.set(x);
    py.set(y);
    // appear at the cursor rather than sweeping in from the last corner
    sx.jump(x);
    sy.jump(y);
    strength.set(1);
  }

  function leave() {
    strength.set(0);
  }

  return (
    <div
      ref={wrap}
      onPointerMove={move}
      onPointerEnter={enter}
      onPointerLeave={leave}
      className={`group relative h-full w-full ${className}`}
    >
      {/* the everyday scene */}
      <div className="absolute inset-0">{base}</div>

      {/* the other version, seen only through the moving window */}
      <motion.div
        className="absolute inset-0"
        style={{ WebkitMaskImage: mask, maskImage: mask }}
        aria-hidden
      >
        {reveal}
      </motion.div>

      {/* warm rim light around the window's edge */}
      <motion.div
        className="pointer-events-none absolute inset-0 mix-blend-screen"
        style={{ background: glow, opacity: glowOpacity }}
        aria-hidden
      />

      {/* a quiet affordance, gone the moment you look through */}
      {hint && (
        <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center opacity-80 transition-opacity duration-300 group-hover:opacity-0">
          <span className="rounded-full bg-black/25 px-2.5 py-1 text-[0.58rem] font-medium uppercase tracking-[0.2em] text-white/85 backdrop-blur-sm">
            {hint}
          </span>
        </div>
      )}
    </div>
  );
}
