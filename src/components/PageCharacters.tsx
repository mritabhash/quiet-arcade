/**
 * Page-resident characters: a small dragon who guards the hall of games,
 * and the princess who keeps the ledger on the stats page. Both are pure
 * decoration — fixed, non-interactive, and quiet under reduced motion.
 */

/** A stubby verdigris dragon perched top-right, puffing little flames. */
export function GamesDragon() {
  return (
    <div aria-hidden className="pointer-events-none fixed right-1 top-[84px] z-30 h-24 w-28 sm:right-3">
      <svg viewBox="0 0 130 100" className="anim-float h-full w-full overflow-visible">
        {/* flame puff, drifting out of the snout */}
        <g className="anim-puff">
          <path d="M28 58 Q18 54 12 58 Q16 62 12 66 Q20 68 28 64 Z" className="fill-gold-400" />
          <path d="M26 60 Q20 58 17 60 Q19 62 17 63 Q22 64 26 62 Z" className="fill-clay-500" />
        </g>

        {/* tail curling behind */}
        <path d="M96 70 Q120 66 118 48" fill="none" strokeWidth="7" strokeLinecap="round" className="stroke-sage-600 dark:stroke-sage-400" />
        <path d="M112 42 L124 44 L116 53 Z" className="fill-sage-600 dark:fill-sage-400" />

        {/* wings, flapping */}
        <path d="M66 44 Q58 20 34 18 Q46 34 44 46 Z" className="anim-flap fill-sage-700 dark:fill-sage-500" />
        <path d="M78 44 Q86 18 108 14 Q98 32 98 46 Z" className="anim-flap-late fill-sage-700 dark:fill-sage-500" />

        {/* body */}
        <ellipse cx="72" cy="66" rx="26" ry="20" className="fill-sage-500 dark:fill-sage-300" />
        <ellipse cx="62" cy="72" rx="12" ry="13" fill="#f7f1e0" opacity="0.9" />
        {/* back spikes */}
        <path d="M60 47 L64 38 L68 47 Z M72 46 L76 37 L80 46 Z M84 49 L88 41 L91 50 Z" className="fill-gold-400" />
        {/* feet */}
        <ellipse cx="60" cy="85" rx="6" ry="4" className="fill-sage-600 dark:fill-sage-400" />
        <ellipse cx="82" cy="85" rx="6" ry="4" className="fill-sage-600 dark:fill-sage-400" />

        {/* head, big and round, facing the page */}
        <circle cx="44" cy="48" r="17" className="fill-sage-500 dark:fill-sage-300" />
        {/* snout */}
        <ellipse cx="32" cy="54" rx="9" ry="6.5" className="fill-sage-400 dark:fill-sage-200" />
        <circle cx="29" cy="52" r="1.2" fill="#1b1824" />
        <circle cx="33" cy="51" r="1.2" fill="#1b1824" />
        {/* horns */}
        <path d="M38 34 L34 24 L44 30 Z M50 32 L52 22 L58 31 Z" className="fill-gold-300" />
        {/* eyes */}
        <ellipse cx="41" cy="45" rx="2.6" ry="3.6" fill="#1b1824" className="anim-blink" />
        <ellipse cx="52" cy="45" rx="2.6" ry="3.6" fill="#1b1824" className="anim-blink" />
        <circle cx="42" cy="43.5" r="0.9" fill="#f7f1e0" />
        <circle cx="53" cy="43.5" r="0.9" fill="#f7f1e0" />
        {/* cheeks */}
        <circle cx="37" cy="50" r="2.2" className="fill-clay-300" opacity="0.6" />
        <circle cx="55" cy="50" r="2.2" className="fill-clay-300" opacity="0.6" />
      </svg>
    </div>
  );
}

/** The keeper of the ledger: a small princess with a scroll, mid-right. */
export function StatsPrincess() {
  return (
    <div aria-hidden className="pointer-events-none fixed left-1 top-[62%] z-30 h-32 w-24 sm:left-4">
      <svg viewBox="0 0 90 130" className="anim-float-slow h-full w-full overflow-visible">
        {/* sparkles about the crown */}
        <path d="M20 18 L21.5 22 L25 23 L21.5 24 L20 28 L18.5 24 L15 23 L18.5 22 Z" className="fill-gold-300 anim-twinkle" />
        <path d="M68 26 L69 29 L72 30 L69 31 L68 34 L67 31 L64 30 L67 29 Z" className="fill-teal-300 anim-twinkle" />

        {/* gown, bell-shaped with brass trim */}
        <path d="M32 68 L58 68 L72 118 Q74 124 66 124 L24 124 Q16 124 18 118 Z" className="fill-clay-400 dark:fill-clay-300" />
        <path d="M20 116 L70 116 L72 121 Q73 124 66 124 L24 124 Q17 124 18 121 Z" className="fill-gold-500 dark:fill-gold-400" />
        <path d="M45 70 L41 90 L45 112 L49 90 Z" className="fill-gold-300" opacity="0.55" />
        {/* bodice */}
        <path d="M35 52 L55 52 L58 72 L32 72 Z" className="fill-clay-500 dark:fill-clay-400" />
        {/* puffy sleeves */}
        <circle cx="32" cy="56" r="6.5" className="fill-clay-400 dark:fill-clay-300" />
        <circle cx="58" cy="56" r="6.5" className="fill-clay-400 dark:fill-clay-300" />

        {/* waving arm */}
        <g className="anim-wave">
          <path d="M60 58 Q68 50 70 40" fill="none" strokeWidth="6" strokeLinecap="round" className="stroke-clay-400 dark:stroke-clay-300" />
          <circle cx="70" cy="37" r="4" fill="#e7b194" />
        </g>
        {/* arm holding the ledger scroll */}
        <path d="M31 58 Q24 64 24 72" fill="none" strokeWidth="6" strokeLinecap="round" className="stroke-clay-400 dark:stroke-clay-300" />
        <g transform="rotate(-12 22 80)">
          <rect x="14" y="74" width="17" height="13" rx="2.5" fill="#f7f1e0" />
          <circle cx="14.5" cy="80.5" r="2.8" fill="#e3d2ab" />
          <circle cx="31.5" cy="80.5" r="2.8" fill="#e3d2ab" />
          <path d="M18 78 L27 78 M18 81 L27 81 M18 84 L24 84" stroke="#a5824d" strokeWidth="1" strokeLinecap="round" />
        </g>

        {/* hair falling behind the shoulders */}
        <path d="M30 34 Q26 52 30 60 L36 54 L36 40 Z" fill="#63472f" />
        <path d="M60 34 Q64 52 60 60 L54 54 L54 40 Z" fill="#63472f" />
        {/* face */}
        <circle cx="45" cy="40" r="12" fill="#e7b194" />
        <path d="M33 36 Q36 26 45 26 Q54 26 57 36 Q51 32 45 32 Q39 32 33 36 Z" fill="#63472f" />
        <ellipse cx="41" cy="41" rx="1.8" ry="2.6" fill="#1b1824" className="anim-blink" />
        <ellipse cx="49" cy="41" rx="1.8" ry="2.6" fill="#1b1824" className="anim-blink" />
        <path d="M42 46 Q45 48.5 48 46" fill="none" stroke="#1b1824" strokeWidth="1.3" strokeLinecap="round" />
        <circle cx="37" cy="44" r="1.8" className="fill-clay-300" opacity="0.7" />
        <circle cx="53" cy="44" r="1.8" className="fill-clay-300" opacity="0.7" />

        {/* crown */}
        <path d="M36 26 L36 18 L40 22 L45 15 L50 22 L54 18 L54 26 Z" className="fill-gold-400" />
        <circle cx="45" cy="22" r="1.8" className="fill-teal-400" />
      </svg>
    </div>
  );
}
