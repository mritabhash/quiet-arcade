import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { useSettings } from "../context/SettingsContext";

/**
 * A small old wizard perched below the nav on the left, staff raised in a
 * casting pose. His spell — a glowing orb with a sparkle trail — hangs in
 * the air and sinks down the viewport in step with how far you've scrolled,
 * as if the whole page is the spell's descent.
 */
export function ScrollWizard() {
  const { motionOK } = useSettings();
  const { scrollYProgress } = useScroll();
  const smooth = useSpring(scrollYProgress, { stiffness: 90, damping: 24, restDelta: 0.001 });
  // the spell descends the viewport in step with the scroll: the beam
  // stretches down from the staff and the orb spins at its tip
  const orbTop = useTransform(smooth, (p) => `calc(${20 + p * 66}vh)`);
  const beamHeight = useTransform(smooth, (p) => `calc(${p * 66}vh + 10px)`);
  const orbSpin = useTransform(smooth, (p) => p * 540);

  return (
    <>
      {/* the caster */}
      <div
        aria-hidden
        className="pointer-events-none fixed left-1 top-[72px] z-30 h-24 w-[4.5rem] sm:left-2"
      >
        <svg viewBox="0 0 90 120" className="anim-float h-full w-full overflow-visible">
          {/* staff, raised to cast */}
          <path d="M70 30 L70 112" stroke="#63472f" strokeWidth="4" strokeLinecap="round" />
          <circle cx="70" cy="24" r="7" className="fill-teal-300 anim-shimmer" />
          <circle cx="70" cy="24" r="3" className="fill-gold-200" />
          <path d="M60 10 L62 14 L66 15 L62 17 L61 21 L59 17 L55 15 L59 14 Z" className="fill-gold-300 anim-twinkle" />
          <path d="M80 34 L81 37 L84 38 L81 39 L80 42 L79 39 L76 38 L79 37 Z" className="fill-teal-300 anim-twinkle" />

          {/* robe */}
          <path d="M28 62 L58 62 L66 110 Q68 118 60 118 L24 118 Q16 118 18 110 Z" className="fill-teal-700 dark:fill-teal-500" />
          <rect x="26" y="86" width="34" height="5" rx="2.5" className="fill-gold-500 dark:fill-gold-400" />
          {/* casting arm reaching to the staff */}
          <path d="M54 68 Q64 58 69 42" fill="none" strokeWidth="9" strokeLinecap="round" className="stroke-teal-700 dark:stroke-teal-500" />
          <circle cx="70" cy="38" r="5" fill="#e7b194" />

          {/* beard, big and soft */}
          <ellipse cx="42" cy="60" rx="14" ry="17" fill="#f7f1e0" />
          <circle cx="32" cy="52" r="6" fill="#f7f1e0" />
          <circle cx="52" cy="52" r="6" fill="#f7f1e0" />
          {/* face */}
          <circle cx="42" cy="46" r="9" fill="#e7b194" />
          <circle cx="39" cy="44" r="1.4" fill="#1b1824" />
          <circle cx="46" cy="44" r="1.4" fill="#1b1824" />
          <circle cx="42.5" cy="48" r="2" fill="#d98a66" />
          {/* white brows peeking under the hat */}
          <path d="M35 40 Q39 38 41 40 M44 40 Q46 38 50 40" fill="none" stroke="#f7f1e0" strokeWidth="2" strokeLinecap="round" />

          {/* tall crooked hat */}
          <ellipse cx="42" cy="36" rx="19" ry="5" className="fill-pine-700 dark:fill-pine-600" />
          <path d="M28 36 Q38 6 50 2 Q48 16 56 36 Z" className="fill-pine-700 dark:fill-pine-600" />
          <circle cx="50" cy="3" r="3" className="fill-gold-400" />
          <rect x="30" y="30" width="25" height="4" className="fill-gold-500 dark:fill-gold-400" transform="rotate(-4 42 32)" />
          <path d="M38 20 L39.5 23 L43 24 L39.5 25 L38 28 L36.5 25 L33 24 L36.5 23 Z" className="fill-gold-300" />
        </svg>
      </div>

      {/* the beam: cast from the staff, it stretches down as you scroll */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed z-30 w-[3px] rounded-full bg-gradient-to-b from-teal-300/0 via-teal-300/80 to-gold-300 shadow-[0_0_10px_2px_rgba(108,189,200,0.35)]"
        style={{ left: 58, top: "19vh", height: motionOK ? beamHeight : "4vh" }}
      />

      {/* the spell at the beam's tip, spinning as it sinks */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed z-30 h-11 w-11"
        style={{ left: 38, top: motionOK ? orbTop : "23vh" }}
      >
        <motion.svg
          viewBox="0 0 44 44"
          className="h-full w-full overflow-visible"
          style={motionOK ? { rotate: orbSpin } : undefined}
        >
          {/* rune ring that makes the spin readable */}
          <circle cx="22" cy="22" r="15" fill="none" strokeWidth="1.5" strokeDasharray="3 7" className="stroke-gold-300" opacity="0.8" />
          <rect x="19" y="4" width="6" height="6" transform="rotate(45 22 7)" className="fill-gold-300" opacity="0.9" />
          {/* the orb */}
          <circle cx="22" cy="22" r="16" className="fill-teal-400 anim-shimmer" opacity="0.25" />
          <circle cx="22" cy="22" r="9" className="fill-teal-300" opacity="0.85" />
          <circle cx="22" cy="22" r="4" className="fill-gold-200" />
          <path d="M4 22 L5.5 26 L9 27 L5.5 28 L4 32 L2.5 28 L-1 27 L2.5 26 Z" className="fill-teal-200 anim-twinkle" />
          <path d="M36 14 L37.5 18 L41 19 L37.5 20 L36 24 L34.5 20 L31 19 L34.5 18 Z" className="fill-gold-300 anim-twinkle" />
        </motion.svg>
      </motion.div>
    </>
  );
}
