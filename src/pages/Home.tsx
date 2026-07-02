import { Link } from "react-router-dom";
import { motion, useTransform } from "framer-motion";
import { GAMES } from "../data/games";
import { GameCard } from "../components/GameCard";
import { BlurReveal, Counter, EASE, VelocityMarquee } from "../components/motion";
import { ArcaneScene, useHeroParallax } from "../components/ArcaneScene";
import { loadStats, loadDailyCompletions, effectiveStreak } from "../lib/storage";
import { todayKey } from "../lib/date";
import { useSettings } from "../context/SettingsContext";

export function HomePage() {
  const scrollY = useHeroParallax();
  const { motionOK } = useSettings();
  const contentY = useTransform(scrollY, [0, 500], [0, 110]);
  const contentOpacity = useTransform(scrollY, [0, 420], [1, 0.15]);

  const stats = loadStats();
  const daily = loadDailyCompletions()[todayKey()] ?? {};
  const doneCount = Object.keys(daily).length;
  const streak = effectiveStreak(stats);

  return (
    <>
      {/* HERO */}
      <section className="relative flex min-h-[94svh] items-center overflow-hidden" aria-label="Welcome">
        <ArcaneScene scrollY={scrollY} />
        <motion.div
          style={motionOK ? { y: contentY, opacity: contentOpacity } : undefined}
          className="relative mx-auto w-full max-w-6xl px-4 pb-44 sm:px-6"
        >
          <div className="max-w-2xl">
            <BlurReveal>
              <p className="qa-fleuron max-w-xs text-xs font-semibold uppercase tracking-[0.32em] text-gold-600 dark:text-gold-300">
                the arcanum is open
              </p>
            </BlurReveal>
            <BlurReveal delay={0.12}>
              <h1 className="rune-glow mt-4 font-display text-7xl font-semibold leading-[0.95] text-pine-900 dark:text-sand-50 sm:text-9xl">
                Quiet Arcade
              </h1>
            </BlurReveal>
            <BlurReveal delay={0.24}>
              <p className="mt-5 max-w-md text-xl leading-relaxed text-pine-800/90 dark:text-sand-100/85">
                Ten small rites of word, map, and memory. A fresh puzzle is inscribed each
                midnight — played in hush, kept in your browser, owed to no one.
              </p>
            </BlurReveal>
            <BlurReveal delay={0.36}>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <a
                  href="#games"
                  className="inline-flex items-center gap-2 border border-gold-600/60 bg-clay-500 px-7 py-3 font-display text-xl text-sand-50 shadow-[0_4px_0_0_#511f12] transition-all hover:bg-clay-600 active:translate-y-[3px] active:shadow-none dark:border-gold-400/50"
                >
                  Enter the hall
                </a>
                <Link
                  to="/stats"
                  className="inline-flex items-center gap-2 border border-pine-700/30 bg-sand-50/60 px-7 py-3 font-display text-xl text-pine-900 backdrop-blur transition-colors hover:bg-sand-50 dark:border-gold-400/25 dark:bg-pine-900/60 dark:text-sand-50 dark:hover:bg-pine-900"
                >
                  Consult the ledger
                </Link>
              </div>
            </BlurReveal>
          </div>
        </motion.div>
        <motion.div
          aria-hidden
          className="absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 text-pine-800/70 dark:text-gold-300/80"
          animate={motionOK ? { y: [0, 8, 0] } : undefined}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="text-[10px] font-semibold uppercase tracking-[0.3em]">descend</span>
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9 L12 15 L18 9" />
          </svg>
        </motion.div>
      </section>

      {/* MARQUEE — keeps drifting, leans into your scroll */}
      <section
        aria-label="The disciplines"
        className="border-y border-[var(--line)] bg-[var(--bg-soft)] py-5"
      >
        <VelocityMarquee
          baseVelocity={-1.2}
          className="font-display text-4xl font-medium text-pine-900/80 dark:text-sand-100/80 sm:text-5xl"
        >
          {"words ✦ maps ✦ memory ✦ logic ✦ omens ✦ trivia ✦ "}
        </VelocityMarquee>
        <VelocityMarquee
          baseVelocity={1.2}
          className="font-display text-4xl font-medium text-transparent [-webkit-text-stroke:1px_var(--muted)] sm:text-5xl"
        >
          {"one puzzle at midnight ✦ nothing leaves the vault ✦ "}
        </VelocityMarquee>
        <p className="sr-only">Words, maps, memory, logic, omens, trivia — one puzzle at midnight.</p>
      </section>

      {/* THE LEDGER */}
      <section aria-label="Your ledger" className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {[
            { big: <Counter value={doneCount} suffix=" / 10" />, small: "sigils sealed today" },
            { big: <Counter value={streak} />, small: "day streak — one seal keeps the flame" },
            { big: <Counter value={stats.totalPlays} />, small: "rounds etched all time" },
          ].map((item, i) => (
            <BlurReveal key={i} delay={i * 0.1} className="text-center">
              <p className="rune-glow font-display text-5xl font-semibold text-gold-600 dark:text-gold-300">{item.big}</p>
              <p className="qa-fleuron mx-auto mt-2 max-w-[16rem] text-sm qa-muted">{item.small}</p>
            </BlurReveal>
          ))}
        </div>
      </section>

      {/* GAMES GRID */}
      <section id="games" className="mx-auto max-w-6xl scroll-mt-20 px-4 pt-10 sm:px-6" aria-label="All games">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <BlurReveal>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-teal-600 dark:text-teal-300">
              the ten chambers
            </p>
            <h2 className="mt-2 font-display text-5xl font-semibold sm:text-6xl">Choose a door</h2>
          </BlurReveal>
          <BlurReveal delay={0.15}>
            <p className="max-w-sm text-right qa-muted max-sm:text-left">
              Each chamber inscribes one deterministic puzzle at midnight, your time. Seal the
              daily and practice mode never runs dry.
            </p>
          </BlurReveal>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {GAMES.map((meta, i) => {
            const pg = stats.perGame[meta.id];
            return (
              <BlurReveal key={meta.id} delay={(i % 3) * 0.08} y={30}>
                <GameCard
                  meta={meta}
                  best={pg ? { score: pg.best, max: pg.bestMax } : undefined}
                  doneToday={!!daily[meta.id]}
                />
              </BlurReveal>
            );
          })}
        </div>
      </section>

      {/* THE RITES */}
      <section className="mx-auto max-w-6xl px-4 pt-24 sm:px-6" aria-label="How Quiet Arcade works">
        <div className="grain relative overflow-hidden border border-gold-700/40 bg-gradient-to-br from-pine-800 to-pine-950 p-8 text-sand-50 sm:p-12 dark:border-gold-500/25">
          <BlurReveal>
            <h2 className="font-display text-4xl font-semibold text-gold-200">The house rites</h2>
          </BlurReveal>
          <div className="mt-8 grid gap-8 sm:grid-cols-3">
            {[
              {
                title: "One inscription a day",
                body: "Dailies are seeded from the date itself, so every visitor unearths the same puzzle — and scores lock until the next midnight.",
              },
              {
                title: "Nothing leaves the vault",
                body: "Scores, streaks, and settings live in this browser's localStorage. No accounts, no servers, no watchers.",
              },
              {
                title: "Tuned for quiet",
                body: "Low light, no shrieking timers, and a full reduced-motion rite in Settings for those who prefer stillness.",
              },
            ].map((item, i) => (
              <BlurReveal key={item.title} delay={i * 0.12}>
                <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.3, ease: EASE }}>
                  <span className="rune-glow font-display text-5xl font-semibold text-gold-300">
                    {["I", "II", "III"][i]}
                  </span>
                  <h3 className="mt-2 font-display text-2xl font-medium">{item.title}</h3>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-sand-100/75">{item.body}</p>
                </motion.div>
              </BlurReveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
