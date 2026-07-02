import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  motion,
  useInView,
  animate,
  AnimatePresence,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  useAnimationFrame,
  useMotionValue,
} from "framer-motion";
import { useSettings } from "../context/SettingsContext";

export const EASE: [number, number, number, number] = [0.21, 0.47, 0.32, 0.98];

/** Componentry-style blur reveal: content unblurs and rises into place. */
export function BlurReveal({
  children,
  delay = 0,
  y = 24,
  className,
  once = true,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  once?: boolean;
}) {
  const { motionOK } = useSettings();
  if (!motionOK) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, filter: "blur(14px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once, margin: "-40px" }}
      transition={{ duration: 0.8, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/** Number that counts up when it scrolls into view. */
export function Counter({
  value,
  duration = 1.1,
  className,
  suffix = "",
}: {
  value: number;
  duration?: number;
  className?: string;
  suffix?: string;
}) {
  const { motionOK } = useSettings();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20px" });
  const [display, setDisplay] = useState(motionOK ? 0 : value);

  useEffect(() => {
    if (!motionOK) {
      setDisplay(value);
      return;
    }
    if (!inView) return;
    const controls = animate(0, value, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v * 10) / 10),
    });
    return () => controls.stop();
  }, [inView, value, duration, motionOK]);

  const text = Number.isInteger(value) ? Math.round(display).toLocaleString() : display.toLocaleString();
  return (
    <span ref={ref} className={className}>
      {text}
      {suffix}
    </span>
  );
}

/** Smooth progress bar. */
export function Progress({
  value,
  max,
  accentClass = "bg-teal-500",
  label,
}: {
  value: number;
  max: number;
  accentClass?: string;
  label?: string;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label ?? "progress"}
      className="h-2 w-full overflow-hidden rounded-full bg-[var(--card-2)]"
    >
      <motion.div
        className={`h-full rounded-full ${accentClass}`}
        initial={false}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.7, ease: EASE }}
      />
    </div>
  );
}

/** Hairline of brass light along the top edge that fills as you scroll. */
export function ScrollProgress() {
  const { motionOK } = useSettings();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 28, restDelta: 0.001 });
  if (!motionOK) return null;
  return (
    <motion.div
      aria-hidden
      className="fixed inset-x-0 top-0 z-50 h-[2px] origin-left bg-gradient-to-r from-clay-500 via-gold-400 to-teal-400"
      style={{ scaleX }}
    />
  );
}

const wrapRange = (min: number, max: number, v: number) =>
  min + ((((v - min) % (max - min)) + (max - min)) % (max - min));

/**
 * Endless band of text that drifts on its own and picks up speed with
 * scroll velocity — so the page feels like it keeps moving with you.
 */
export function VelocityMarquee({
  children,
  baseVelocity = -1.4,
  className = "",
}: {
  children: string;
  baseVelocity?: number;
  className?: string;
}) {
  const { motionOK } = useSettings();
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, { damping: 50, stiffness: 400 });
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 3], { clamp: false });
  const directionFactor = useRef(1);
  const x = useTransform(baseX, (v) => `${wrapRange(-25, 0, v)}%`);

  useAnimationFrame((_, delta) => {
    if (!motionOK) return;
    let moveBy = directionFactor.current * baseVelocity * (delta / 1000);
    const vf = velocityFactor.get();
    if (vf < 0) directionFactor.current = -1;
    else if (vf > 0) directionFactor.current = 1;
    moveBy += directionFactor.current * moveBy * Math.abs(vf);
    baseX.set(baseX.get() + moveBy);
  });

  return (
    <div aria-hidden className="flex flex-nowrap overflow-hidden whitespace-nowrap">
      <motion.div className={`flex flex-nowrap gap-0 whitespace-nowrap ${className}`} style={motionOK ? { x } : undefined}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="block pr-8">
            {children}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

const CONFETTI_COLORS = ["#ae4d2c", "#d19e34", "#64a284", "#44a0af", "#d3ba87"];

/** Minimal line confetti for perfect scores. */
export function LineConfetti({ active }: { active: boolean }) {
  const { motionOK } = useSettings();
  const pieces = useRef(
    Array.from({ length: 26 }, (_, i) => ({
      x: (i * 137.5) % 100,
      delay: (i % 7) * 0.09,
      duration: 1.4 + ((i * 53) % 10) / 10,
      rotate: ((i * 83) % 360) - 180,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      height: 10 + ((i * 31) % 14),
    })),
  );
  if (!motionOK) return null;
  return (
    <AnimatePresence>
      {active && (
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          {pieces.current.map((p, i) => (
            <motion.span
              key={i}
              className="absolute top-0 w-[3px] rounded-full"
              style={{ left: `${p.x}%`, height: p.height, backgroundColor: p.color }}
              initial={{ y: -30, opacity: 0, rotate: 0 }}
              animate={{ y: "110vh", opacity: [0, 1, 1, 0.6], rotate: p.rotate }}
              exit={{ opacity: 0 }}
              transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}
