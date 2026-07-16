import { BlurReveal } from "../components/motion";

/**
 * The Lore page: a mythical map of the arcade's world, left unwritten.
 */

function MythicalMap() {
  return (
    <div className="qa-card grain overflow-hidden rounded-3xl">
      <img
        src={`${import.meta.env.BASE_URL}lore-map.png`}
        alt="A mythical map of the arcade's world."
        className="block w-full"
        loading="lazy"
      />
    </div>
  );
}

export function LorePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-6">
      <BlurReveal>
        <p className="qa-fleuron text-xs font-semibold uppercase tracking-[0.32em] text-gold-600 dark:text-gold-300">
          the lore
        </p>
        <h1 className="mt-2 font-display text-4xl font-semibold sm:text-5xl">
          Everything&apos;s Gonna Happen Again
        </h1>
      </BlurReveal>

      <div className="mt-8">
        <MythicalMap />
      </div>

      <p className="mt-6 text-center font-display text-lg italic text-[var(--ink)]/80">
        The story of Arcanum will be told
      </p>
    </div>
  );
}
