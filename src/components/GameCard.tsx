import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import type { GameMeta } from "../types";
import { GameIcon } from "./icons";
import { Chip } from "./ui";
import { EASE } from "./motion";
import { useSettings } from "../context/SettingsContext";

const BASE = import.meta.env.BASE_URL;

const ACCENT_BG: Record<GameMeta["accent"], string> = {
  clay: "from-clay-200 to-sand-100 dark:from-clay-900 dark:to-pine-900",
  sage: "from-sage-200 to-sand-100 dark:from-sage-900 dark:to-pine-900",
  teal: "from-teal-200 to-sand-100 dark:from-teal-900 dark:to-pine-900",
  gold: "from-gold-200 to-sand-100 dark:from-gold-900 dark:to-pine-900",
};

const ACCENT_MESA: Record<GameMeta["accent"], string> = {
  clay: "fill-clay-400 dark:fill-clay-700",
  sage: "fill-sage-400 dark:fill-sage-700",
  teal: "fill-teal-400 dark:fill-teal-700",
  gold: "fill-gold-400 dark:fill-gold-600",
};

/**
 * A chamber door. The header is a painted door plate when the game has one,
 * with the drawn spires kept underneath as both an accent and a fallback;
 * on a fine pointer the whole card leans a few degrees toward the cursor and
 * a band of lantern light crosses it. All of that is motion-gated.
 */
export function GameCard({
  meta,
  best,
  doneToday,
}: {
  meta: GameMeta;
  best?: { score: number; max: number };
  doneToday: boolean;
}) {
  const { motionOK } = useSettings();
  const ref = useRef<HTMLElement>(null);
  const [artFailed, setArtFailed] = useState(false);
  const [hovered, setHovered] = useState(false);

  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const rotateX = useSpring(rx, { stiffness: 150, damping: 12 });
  const rotateY = useSpring(ry, { stiffness: 150, damping: 12 });
  const glareX = useTransform(rotateY, [-4, 4], ["-40%", "40%"]);

  const tiltable =
    motionOK && typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches;

  const onPointerMove = (e: React.PointerEvent) => {
    if (!tiltable) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    ry.set(px * 8);
    rx.set(-py * 8);
  };

  const rest = () => {
    rx.set(0);
    ry.set(0);
    setHovered(false);
  };

  return (
    <motion.article
      ref={ref}
      onPointerMove={onPointerMove}
      onPointerEnter={() => tiltable && setHovered(true)}
      onPointerLeave={rest}
      whileHover={motionOK ? { y: -6 } : undefined}
      transition={{ duration: 0.3, ease: EASE }}
      style={tiltable ? { rotateX, rotateY, transformPerspective: 900 } : undefined}
      className="group relative flex h-full flex-col overflow-hidden rounded-sm qa-card shadow-sm transition-shadow hover:shadow-xl hover:shadow-gold-500/10"
    >
      {/* chamber-door header: the painted plate, or spires flanking a portal */}
      <div className={`relative h-36 overflow-hidden bg-gradient-to-b ${ACCENT_BG[meta.accent]}`}>
        <svg viewBox="0 0 400 144" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMax slice" aria-hidden>
          <path d="M-10 144 L30 74 L44 90 L58 48 L74 90 L88 74 L128 144 Z" className={ACCENT_MESA[meta.accent]} opacity="0.5" />
          <path d="M282 144 L326 62 L342 82 L356 34 L372 82 L388 62 L430 144 Z" className={ACCENT_MESA[meta.accent]} opacity="0.65" />
          <circle cx="200" cy="118" r="44" className={ACCENT_MESA[meta.accent]} opacity="0.25" />
          <ellipse cx="200" cy="150" rx="180" ry="18" className="fill-pine-900" opacity="0.14" />
        </svg>
        {!artFailed && (
          <img
            src={`${BASE}chambers/${meta.id}.webp`}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-90 transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            loading="lazy"
            decoding="async"
            onError={() => setArtFailed(true)}
          />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--card)]/70 via-transparent to-transparent" />
        <div className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_2px_8px_rgba(10,8,16,0.55)] transition-transform duration-500 ease-out group-hover:-translate-y-[58%] group-hover:scale-105">
          <GameIcon id={meta.id} />
        </div>
        {doneToday && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-sage-600 px-2.5 py-1 text-xs font-semibold text-sand-50 shadow">
            <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 8.5 L6.5 12 L13 4.5" />
            </svg>
            Sealed today
          </span>
        )}
      </div>

      {/* a band of lantern light crossing the door as you lean over it */}
      {tiltable && hovered && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-r from-transparent via-gold-200/20 to-transparent"
          style={{ x: glareX }}
        />
      )}

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-2xl font-medium">{meta.title}</h3>
        <p className="mt-1 text-sm qa-muted">{meta.short}</p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <Chip>{meta.type}</Chip>
          <Chip>{meta.difficulty}</Chip>
          <Chip>{meta.minutes}</Chip>
        </div>

        <div className="mt-auto flex items-center justify-between pt-5">
          <p className="text-xs qa-muted">
            {best ? (
              <>
                Best{" "}
                <span className="font-semibold text-[var(--ink)]">
                  {best.score}/{best.max}
                </span>
              </>
            ) : (
              "Not played yet"
            )}
          </p>
          <Link
            to={`/games/${meta.id}`}
            className="inline-flex items-center gap-1.5 rounded-sm border border-gold-600/50 bg-clay-500 px-4 py-2 text-sm font-semibold text-sand-50 shadow-[0_3px_0_0_#511f12] transition-all hover:bg-clay-600 active:translate-y-[2px] active:shadow-none dark:border-gold-400/40"
          >
            Enter
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 8 H13 M9 4 L13 8 L9 12" />
            </svg>
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
