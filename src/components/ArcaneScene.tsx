import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useScroll, useSpring, useTransform, type MotionValue } from "framer-motion";
import { useSettings } from "../context/SettingsContext";

/**
 * The hero, built like a stage set: three painted plates at three depths —
 * sky, the far rune-city ridge, the gate of the arcade itself — sliding at
 * their own speeds as you scroll and leaning a little toward the pointer.
 *
 * The orrery and the stars stay hand-drawn SVG on top of the paintings:
 * that mix of flat vector over painted depth is what sells the 2.5D. Both
 * themes are painted (obsidian night / parchment afternoon) and swap the
 * way the old sun and moon did.
 */

const BASE = import.meta.env.BASE_URL;

export function ArcaneScene({ scrollY }: { scrollY: MotionValue<number> }) {
  const { motionOK, settings } = useSettings();
  const theme = settings.darkMode ? "dark" : "light";
  const rootRef = useRef<HTMLDivElement>(null);

  const farY = useTransform(scrollY, [0, 700], [0, 90]);
  const midY = useTransform(scrollY, [0, 700], [0, 50]);
  const nearY = useTransform(scrollY, [0, 700], [0, 14]);

  // the set leans toward the pointer, a few pixels per plate
  const px = useMotionValue(0);
  const pointer = useSpring(px, { stiffness: 40, damping: 14 });
  const skyX = useTransform(pointer, [-1, 1], [3, -3]);
  const midX = useTransform(pointer, [-1, 1], [6, -6]);
  const foreX = useTransform(pointer, [-1, 1], [10, -10]);

  useEffect(() => {
    if (!motionOK) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const onMove = (e: PointerEvent) => {
      const w = window.innerWidth || 1;
      px.set((e.clientX / w) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [motionOK, px]);

  const live = <T,>(v: T) => (motionOK ? v : undefined);

  // The ambient gate loop is a heavy indulgence: desktop + dark + motion only.
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px) and (pointer: fine)");
    const on = () => setDesktop(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  const heroLoopOK = motionOK && theme === "dark" && desktop;

  return (
    <div ref={rootRef} className="absolute inset-0 overflow-hidden" aria-hidden>
      {/* the flat wash underneath, so there is never a bare flash */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#c8bfd6] via-[#e2d5c2] to-[#efe5ca] dark:from-[#0d0b13] dark:via-[#1b1824] dark:to-[#2b2440]" />

      {/* only the hour we are actually in gets fetched */}
      <Plates
        theme={theme}
        farY={live(farY)}
        midY={live(midY)}
        nearY={live(nearY)}
        skyX={live(skyX)}
        midX={live(midX)}
        foreX={live(foreX)}
      />

      {/* the assembled dark gate, brought to life — fades in over the plates */}
      {heroLoopOK && <HeroGateLoop y={live(nearY)} />}

      {/* a scrim under the copy: the gate is busy, the words come first */}
      <div
        className={`absolute inset-0 bg-gradient-to-r to-transparent ${
          theme === "dark" ? "from-pine-950/90 via-pine-950/40" : "from-sand-100/92 via-sand-100/45"
        }`}
      />

      {/* light thrown from the moon side */}
      <div className="qa-rays" />

      {/* the set sinks into the page rather than stopping at an edge */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[var(--bg)] to-transparent" />

      {/* the drawn layer: stars and the orrery rings */}
      <motion.svg
        viewBox="0 0 1440 810"
        preserveAspectRatio="xMidYMax slice"
        className="absolute inset-0 h-full w-full"
        style={motionOK ? { y: farY } : undefined}
      >
        <g className="opacity-20 dark:opacity-90">
          {[
            [120, 90, 1.6], [310, 150, 1.1], [455, 70, 1.4], [590, 190, 1], [730, 60, 1.8],
            [890, 130, 1.2], [1005, 80, 1], [1230, 60, 1.5], [1345, 160, 1.1], [665, 120, 1],
            [210, 220, 1], [1130, 240, 1.2], [40, 170, 1.3], [960, 210, 1],
          ].map(([x, y, r], i) => (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={r}
              className={`fill-sand-50 ${motionOK && i % 3 === 0 ? "anim-shimmer" : ""}`}
            />
          ))}
        </g>

        {/* orrery rings turning about the moon */}
        <g className={motionOK ? "anim-orrery" : undefined}>
          <circle
            cx="280"
            cy="170"
            r="104"
            fill="none"
            strokeDasharray="3 9"
            strokeWidth="1.5"
            className="stroke-gold-500 dark:stroke-gold-300"
            opacity="0.7"
          />
          <circle cx="384" cy="170" r="5" className="fill-clay-400 dark:fill-teal-300" />
        </g>
        <g className={motionOK ? "anim-orrery-reverse" : undefined}>
          <circle
            cx="280"
            cy="170"
            r="142"
            fill="none"
            strokeDasharray="1 14"
            strokeWidth="1.5"
            className="stroke-gold-500 dark:stroke-gold-400"
            opacity="0.5"
          />
          <circle cx="138" cy="170" r="4" className="fill-teal-500 dark:fill-gold-300" />
        </g>
      </motion.svg>

      {/* low mist over the whole set */}
      <div className="qa-mist" />
    </div>
  );
}

/** One theme's three plates. */
function Plates({
  theme,
  farY,
  midY,
  nearY,
  skyX,
  midX,
  foreX,
}: {
  theme: "dark" | "light";
  farY?: MotionValue<number>;
  midY?: MotionValue<number>;
  nearY?: MotionValue<number>;
  skyX?: MotionValue<number>;
  midX?: MotionValue<number>;
  foreX?: MotionValue<number>;
}) {
  const src = (layer: string) => `${BASE}hero/${theme}-${layer}.webp`;
  return (
    <>
      <motion.img
        src={src("sky")}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        style={{ y: farY, x: skyX }}
        decoding="async"
      />
      <motion.img
        src={src("mid")}
        alt=""
        className="absolute inset-x-0 bottom-[20%] w-full object-contain object-bottom opacity-95"
        style={{ y: midY, x: midX }}
        decoding="async"
      />
      <motion.img
        src={src("fore")}
        alt=""
        className="absolute inset-x-0 bottom-0 w-full object-contain object-bottom"
        style={{ y: nearY, x: foreX }}
        decoding="async"
      />
    </>
  );
}

/**
 * The dark hero, gently alive: an 8s silent loop of the assembled gate —
 * flickering lantern, curling mist, a pulsing keystone rune — faded in over
 * the painted plates. Mounted only when the browser is idle so it never
 * costs the first paint, and paused whenever the hero scrolls out of view.
 * The caller gates it to desktop + dark + motion; here we handle timing.
 */
function HeroGateLoop({ y }: { y?: MotionValue<number> }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [mount, setMount] = useState(false);
  const [ready, setReady] = useState(false);

  // wait for an idle moment before we even create the <video> element
  useEffect(() => {
    const w = window as typeof window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    // timeout so the perpetually-animating hero still mounts the loop
    const id = w.requestIdleCallback
      ? w.requestIdleCallback(() => setMount(true), { timeout: 2000 })
      : window.setTimeout(() => setMount(true), 1200);
    return () => {
      if (w.cancelIdleCallback) w.cancelIdleCallback(id);
      else clearTimeout(id);
    };
  }, []);

  // play only while the hero is on screen
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) v.play().catch(() => {});
        else v.pause();
      },
      { threshold: 0.05 },
    );
    io.observe(v);
    return () => io.disconnect();
  }, [mount]);

  if (!mount) return null;
  return (
    <motion.video
      ref={ref}
      className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
        ready ? "opacity-100" : "opacity-0"
      }`}
      style={{ y }}
      src={`${BASE}hero/gate-loop.mp4`}
      muted
      loop
      playsInline
      autoPlay
      preload="none"
      aria-hidden
      onCanPlay={() => setReady(true)}
    />
  );
}

/** Hook wrapper so pages can share one scroll listener for the hero. */
export function useHeroParallax() {
  const { scrollY } = useScroll();
  return scrollY;
}
