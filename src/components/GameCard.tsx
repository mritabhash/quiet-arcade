import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import type { GameMeta } from "../types";
import { GameIcon } from "./icons";
import { Chip } from "./ui";
import { EASE } from "./motion";
import { useSettings } from "../context/SettingsContext";

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
  return (
    <motion.article
      whileHover={motionOK ? { y: -6 } : undefined}
      transition={{ duration: 0.3, ease: EASE }}
      className="group relative flex h-full flex-col overflow-hidden rounded-sm qa-card shadow-sm transition-shadow hover:shadow-xl hover:shadow-gold-500/10"
    >
      {/* chamber-door header: spires flanking a faint portal */}
      <div className={`relative h-36 overflow-hidden bg-gradient-to-b ${ACCENT_BG[meta.accent]}`}>
        <svg viewBox="0 0 400 144" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMax slice" aria-hidden>
          <path d="M-10 144 L30 74 L44 90 L58 48 L74 90 L88 74 L128 144 Z" className={ACCENT_MESA[meta.accent]} opacity="0.5" />
          <path d="M282 144 L326 62 L342 82 L356 34 L372 82 L388 62 L430 144 Z" className={ACCENT_MESA[meta.accent]} opacity="0.65" />
          <circle cx="200" cy="118" r="44" className={ACCENT_MESA[meta.accent]} opacity="0.25" />
          <ellipse cx="200" cy="150" rx="180" ry="18" className="fill-pine-900" opacity="0.14" />
        </svg>
        <div className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 transition-transform duration-500 ease-out group-hover:-translate-y-[58%] group-hover:scale-105">
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
