import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BlurReveal } from "../components/motion";
import { useSettings } from "../context/SettingsContext";

export function NotFoundPage() {
  const { motionOK } = useSettings();
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 pt-20 text-center sm:px-6">
      <BlurReveal>
        <motion.svg
          viewBox="0 0 200 140"
          className="h-44 w-64"
          aria-hidden
          animate={motionOK ? { y: [0, -6, 0] } : undefined}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          <path d="M10 120 L60 100 L120 116 L190 104 L190 140 L10 140 Z" className="fill-sand-300 dark:fill-pine-800" />
          <rect x="92" y="52" width="8" height="60" className="fill-bark-500" />
          <path d="M60 56 L96 40 L96 72 Z" className="fill-clay-500" />
          <path d="M136 62 L100 48 L100 76 Z" className="fill-gold-400" />
          <circle cx="52" cy="30" r="12" className="fill-gold-200 dark:fill-sand-100" />
        </motion.svg>
      </BlurReveal>
      <BlurReveal delay={0.12}>
        <h1 className="font-display text-5xl font-semibold">Lost in the dunes</h1>
      </BlurReveal>
      <BlurReveal delay={0.22}>
        <p className="mt-3 max-w-sm qa-muted">
          This path leads only to sand. The signpost points two ways — neither is the page you asked
          for.
        </p>
      </BlurReveal>
      <BlurReveal delay={0.32}>
        <div className="mt-8 flex gap-3">
          <Link
            to="/"
            className="rounded-xl bg-clay-500 px-6 py-3 font-semibold text-sand-50 shadow-[0_4px_0_0_#7d3a27] transition-all hover:bg-clay-600 active:translate-y-[3px] active:shadow-none"
          >
            Back to the arcade
          </Link>
          <Link
            to="/games"
            className="rounded-xl border border-[var(--line)] bg-[var(--card)] px-6 py-3 font-semibold transition-colors hover:bg-[var(--card-2)]"
          >
            See the games
          </Link>
        </div>
      </BlurReveal>
    </div>
  );
}
