import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { CAPTIONS, HOUR_OF, useKnightActivity } from "../lib/knightState";
import { useSettings } from "../context/SettingsContext";
import { EmberField } from "./EmberField";
import { EASE } from "./motion";

/**
 * The knight's vigil, shot as a scene rather than drawn as one.
 *
 * She keeps the same slow hours she always has (lib/knightState); this band
 * just gives them a camera: a painted plate that breathes as a silent loop
 * where the connection and the reader allow it, letterbox bars that close as
 * the section arrives, her caption set like a subtitle, and the air of the
 * moor drifting over the top. Every layer degrades on its own — no loop, no
 * motion, no canvas — down to a single still frame and a line of text.
 */

const BASE = import.meta.env.BASE_URL;

export function CinematicVigil() {
  const activity = useKnightActivity();
  const { motionOK } = useSettings();
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [wide, setWide] = useState(false);
  const [loopFailed, setLoopFailed] = useState(false);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const barScale = useTransform(scrollYProgress, [0, 0.22, 0.78, 1], [0, 1, 1, 0]);
  const mediaY = useTransform(scrollYProgress, [0, 1], [-24, 24]);
  const mistY = useTransform(scrollYProgress, [0, 1], [36, -36]);
  const captionY = useTransform(scrollYProgress, [0, 1], [18, -18]);

  // phones stay on the still: a loop is a lot to ask of a hotel wifi
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setWide(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // a fresh hour deserves a fresh try at the loop
  useEffect(() => setLoopFailed(false), [activity]);

  const showLoop = motionOK && wide && !loopFailed;
  const still = `${BASE}knight/${activity}.webp`;

  // the loop only runs while the band is on screen and the tab is watched
  useEffect(() => {
    if (!showLoop) return;
    const el = videoRef.current;
    const section = sectionRef.current;
    if (!el || !section) return;
    let visible = false;
    const sync = () => {
      if (visible && !document.hidden) void el.play().catch(() => {});
      else el.pause();
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        sync();
      },
      { threshold: 0.15 },
    );
    io.observe(section);
    document.addEventListener("visibilitychange", sync);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [showLoop, activity]);

  return (
    <section
      ref={sectionRef}
      aria-label="The knight's vigil"
      className="relative min-h-[72svh] overflow-hidden border-y border-[var(--line)] bg-pine-950"
    >
      <p className="sr-only">{CAPTIONS[activity]}</p>

      {/* the plate — one activity is mounted at a time */}
      <motion.div className="absolute inset-0" style={motionOK ? { y: mediaY } : undefined} aria-hidden>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activity}
            className="absolute inset-0"
            initial={motionOK ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            exit={motionOK ? { opacity: 0 } : undefined}
            transition={{ duration: 0.9, ease: EASE }}
          >
            {showLoop ? (
              <video
                ref={videoRef}
                className="h-full w-full object-cover object-[center_38%]"
                src={`${BASE}knight/loops/${activity}.mp4`}
                poster={still}
                muted
                loop
                playsInline
                autoPlay
                preload="none"
                onError={() => setLoopFailed(true)}
              />
            ) : (
              <img
                src={still}
                alt=""
                className={`h-full w-full object-cover object-[center_38%] ${motionOK ? "qa-kenburns" : ""}`}
                loading="lazy"
                decoding="async"
              />
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* grade: pull the night plate toward the page it lives on */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-pine-950/85 via-pine-950/15 to-pine-950/55"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 bg-gold-300/12 mix-blend-overlay dark:hidden" aria-hidden />
      <div className="grain pointer-events-none absolute inset-0" aria-hidden />
      <div className="qa-vignette pointer-events-none absolute inset-0" aria-hidden />

      {/* the air */}
      <EmberField activity={activity} />
      <motion.div className="qa-mist" style={motionOK ? { y: mistY } : undefined} aria-hidden />

      {/* cinema bars */}
      {motionOK ? (
        <>
          <motion.div
            className="pointer-events-none absolute inset-x-0 top-0 h-[7svh] origin-top bg-pine-950"
            style={{ scaleY: barScale }}
            aria-hidden
          />
          <motion.div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[7svh] origin-bottom bg-pine-950"
            style={{ scaleY: barScale }}
            aria-hidden
          />
        </>
      ) : (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[2svh] bg-pine-950" aria-hidden />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[2svh] bg-pine-950" aria-hidden />
        </>
      )}

      {/* the subtitle */}
      <motion.div
        className="absolute inset-x-0 bottom-[11svh] px-4"
        style={motionOK ? { y: captionY } : undefined}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activity}
            className="mx-auto max-w-3xl text-center"
            initial={motionOK ? { opacity: 0, y: 12 } : false}
            animate={{ opacity: 1, y: 0 }}
            exit={motionOK ? { opacity: 0, y: -8 } : undefined}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <p className="qa-fleuron mx-auto max-w-sm text-[11px] font-semibold uppercase tracking-[0.32em] text-gold-300">
              the vigil — hour of {HOUR_OF[activity]}
            </p>
            <p className="rune-glow mt-3 font-display text-2xl leading-snug text-sand-50 sm:text-3xl">
              {CAPTIONS[activity]}
            </p>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </section>
  );
}
