import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { useSettings } from "../context/SettingsContext";

/**
 * Original layered magepunk skyline for the hero, built for parallax.
 * A brass orrery moon, floating rune-carved monoliths, gothic spires,
 * a riveted brass conduit, and the glowing gate of the arcade itself.
 */
export function ArcaneScene({ scrollY }: { scrollY: MotionValue<number> }) {
  const { motionOK } = useSettings();
  const farY = useTransform(scrollY, [0, 700], [0, 90]);
  const midY = useTransform(scrollY, [0, 700], [0, 50]);
  const nearY = useTransform(scrollY, [0, 700], [0, 14]);

  return (
    <svg
      viewBox="0 0 1440 810"
      preserveAspectRatio="xMidYMax slice"
      className="absolute inset-0 h-full w-full"
      aria-hidden
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c8bfd6" />
          <stop offset="55%" stopColor="#e2d5c2" />
          <stop offset="100%" stopColor="#efe5ca" />
        </linearGradient>
        <linearGradient id="skyDark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0d0b13" />
          <stop offset="60%" stopColor="#1b1824" />
          <stop offset="100%" stopColor="#2b2440" />
        </linearGradient>
      </defs>

      <rect width="1440" height="810" className="fill-[url(#sky)] dark:fill-[url(#skyDark)]" />

      {/* scattered stars — faint by day, awake at night */}
      <motion.g style={motionOK ? { y: farY } : undefined} className="opacity-20 dark:opacity-90">
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
      </motion.g>

      {/* orrery on the left: a rayed sun by day, a half moon by night */}
      <motion.g style={motionOK ? { y: farY } : undefined}>
        <circle cx="280" cy="170" r="86" className="fill-gold-300 dark:fill-sand-100" opacity="0.16" />

        {/* sun — parchment hours only */}
        <g className="dark:hidden">
          <circle cx="280" cy="170" r="52" className="fill-gold-400" />
          <circle cx="280" cy="170" r="42" className="fill-gold-300" />
          <g strokeWidth="4" strokeLinecap="round" className="stroke-gold-500">
            {Array.from({ length: 12 }, (_, i) => (
              <path key={i} d="M280 104 L280 88" transform={`rotate(${i * 30} 280 170)`} />
            ))}
          </g>
        </g>

        {/* half moon — obsidian hours only */}
        <g className="hidden dark:block">
          <circle cx="280" cy="170" r="56" fill="none" strokeWidth="1" className="stroke-sand-100" opacity="0.3" />
          <path d="M280 114 A56 56 0 0 1 280 226 Z" className="fill-sand-100" opacity="0.95" />
          <g className="fill-sand-400" opacity="0.5">
            <circle cx="300" cy="150" r="8" />
            <circle cx="312" cy="184" r="5" />
            <circle cx="294" cy="206" r="4" />
          </g>
        </g>

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
      </motion.g>

      {/* floating rune monoliths */}
      <motion.g style={motionOK ? { y: farY } : undefined}>
        <g className={motionOK ? "anim-float" : undefined}>
          <path d="M212 340 L232 208 L266 226 L258 352 Z" className="fill-pine-300 dark:fill-pine-700" />
          <path d="M232 208 L266 226 L262 262 L236 246 Z" className="fill-pine-400 dark:fill-pine-600" opacity="0.6" />
          <g strokeWidth="3" strokeLinecap="round" className={`stroke-teal-600 dark:stroke-teal-300 ${motionOK ? "anim-shimmer" : ""}`}>
            <path d="M238 268 L252 268" />
            <path d="M240 288 L254 282" />
            <path d="M241 308 L253 312" />
          </g>
          <path d="M228 384 L244 372 L256 388 L240 396 Z" className="fill-pine-300 dark:fill-pine-700" opacity="0.55" />
        </g>
        <g className={motionOK ? "anim-float-slow" : undefined}>
          <path d="M604 232 L618 152 L642 166 L636 242 Z" className="fill-pine-300 dark:fill-pine-700" opacity="0.85" />
          <g strokeWidth="2.5" strokeLinecap="round" className={`stroke-gold-500 dark:stroke-gold-300 ${motionOK ? "anim-shimmer" : ""}`}>
            <path d="M618 188 L630 186" />
            <path d="M619 204 L631 206" />
          </g>
          <path d="M612 268 L626 260 L634 272 L620 278 Z" className="fill-pine-300 dark:fill-pine-700" opacity="0.4" />
        </g>
        <g className={motionOK ? "anim-float" : undefined}>
          <path d="M1310 372 L1328 268 L1356 284 L1348 384 Z" className="fill-pine-300 dark:fill-pine-700" opacity="0.9" />
          <g strokeWidth="3" strokeLinecap="round" className={`stroke-teal-600 dark:stroke-teal-300 ${motionOK ? "anim-shimmer" : ""}`}>
            <path d="M1330 310 L1344 306" />
            <path d="M1331 330 L1345 332" />
          </g>
        </g>
      </motion.g>

      {/* far spire skyline */}
      <motion.g style={motionOK ? { y: farY } : undefined}>
        <path d="M-20 560 L40 470 L58 486 L74 402 L92 486 L110 470 L170 560 Z" className="fill-pine-200 dark:fill-pine-800" />
        <path d="M150 560 L216 420 L232 300 L250 420 L316 560 Z" className="fill-pine-300 dark:fill-pine-850" />
        <path d="M380 560 L430 460 L444 380 L460 460 L512 560 Z" className="fill-pine-200 dark:fill-pine-800" />
        <path d="M1150 560 L1216 430 L1236 330 L1258 430 L1330 560 Z" className="fill-pine-300 dark:fill-pine-850" />
        <path d="M1320 560 L1382 450 L1400 396 L1420 450 L1460 560 Z" className="fill-pine-200 dark:fill-pine-800" />
        {/* lit windows in the far towers */}
        <g className={`fill-gold-400 dark:fill-gold-300 ${motionOK ? "anim-flicker" : ""}`}>
          <rect x="227" y="380" width="10" height="16" rx="4" />
          <rect x="439" y="424" width="9" height="14" rx="4" />
          <rect x="1231" y="392" width="10" height="16" rx="4" />
        </g>
      </motion.g>

      {/* mid ridge with the brass conduit */}
      <motion.g style={motionOK ? { y: midY } : undefined}>
        <path d="M-40 640 L120 480 L260 540 L360 452 L470 640 Z" className="fill-pine-400 dark:fill-pine-800" />
        <path d="M330 640 L470 490 L560 570 L640 512 L760 640 Z" className="fill-pine-300 dark:fill-pine-850" />
        <path d="M880 640 L1000 486 L1120 570 L1230 494 L1360 640 Z" className="fill-pine-400 dark:fill-pine-800" />
        <path d="M120 480 L260 540 L200 640 L60 640 Z" className="fill-pine-500 dark:fill-pine-900" opacity="0.45" />
        <path d="M1000 486 L1120 570 L1050 640 L940 640 Z" className="fill-pine-500 dark:fill-pine-900" opacity="0.4" />

        {/* riveted conduit carrying the arcade's charge */}
        <rect x="540" y="586" width="380" height="16" rx="8" className="fill-bark-500 dark:fill-bark-700" />
        <rect x="540" y="589" width="380" height="4" rx="2" className={`fill-gold-400 dark:fill-teal-400 ${motionOK ? "anim-shimmer" : ""}`} opacity="0.9" />
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <rect x={566 + i * 96} y={602} width={14} height={54} className="fill-pine-500 dark:fill-pine-700" />
            <circle cx={573 + i * 96} cy={594} r={3} className="fill-gold-300 dark:fill-gold-400" />
          </g>
        ))}
        <circle cx="920" cy="594" r="12" fill="none" strokeWidth="3" className="stroke-gold-500 dark:stroke-gold-400" />
        <path d="M920 585 L920 603 M911 594 L929 594" strokeWidth="2.5" className="stroke-gold-500 dark:stroke-gold-400" />
      </motion.g>

      {/* foreground: the gate of the arcade */}
      <motion.g style={motionOK ? { y: nearY } : undefined}>
        <path d="M-40 810 L-40 700 L260 646 L620 706 L1010 652 L1440 716 L1440 810 Z" className="fill-sand-200 dark:fill-pine-850" />
        <path d="M-40 810 L-40 750 L360 702 L820 764 L1240 712 L1440 748 L1440 810 Z" className="fill-sand-100 dark:fill-pine-900" />

        {/* low mist */}
        <g className={motionOK ? "anim-drift-slow" : undefined} opacity="0.25">
          <ellipse cx="400" cy="742" rx="260" ry="26" className="fill-sand-50 dark:fill-pine-600" />
          <ellipse cx="1140" cy="768" rx="300" ry="30" className="fill-sand-50 dark:fill-pine-600" />
        </g>

        {/* the gate: ogive arch, keystone rune, brass trim */}
        <g>
          <path d="M990 810 L990 648 L1088 566 L1186 648 L1186 810 Z" className="fill-pine-600 dark:fill-pine-850" />
          <path d="M1010 810 L1010 660 L1088 594 L1166 660 L1166 810 Z" className="fill-pine-700 dark:fill-pine-900" />
          <path
            d="M1030 810 L1030 690 Q1030 636 1088 614 Q1146 636 1146 690 L1146 810 Z"
            className={`fill-gold-300 dark:fill-teal-400 ${motionOK ? "anim-flicker" : ""}`}
            opacity="0.85"
          />
          <path d="M1080 574 L1096 574 L1096 590 L1080 590 Z" transform="rotate(45 1088 582)" className={`fill-teal-500 dark:fill-gold-300 ${motionOK ? "anim-shimmer" : ""}`} />
          <rect x="980" y="644" width="216" height="8" className="fill-bark-500 dark:fill-bark-700" />
          <circle cx="996" cy="648" r="2.5" className="fill-gold-400" />
          <circle cx="1180" cy="648" r="2.5" className="fill-gold-400" />
        </g>

        {/* stone steps up to the gate */}
        <g className="fill-pine-400 dark:fill-pine-700">
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={i} x={886 + i * 22} y={776 - i * 18} width={28} height={12} rx={2} />
          ))}
        </g>

        {/* lantern post on the left */}
        <g>
          <rect x="292" y="700" width="8" height="110" className="fill-bark-500 dark:fill-bark-700" />
          <path d="M296 700 L296 678 L342 678" fill="none" strokeWidth="7" strokeLinecap="round" className="stroke-bark-500 dark:stroke-bark-700" />
          <path d="M342 682 L342 700" strokeWidth="2.5" className="stroke-bark-500 dark:stroke-bark-700" />
          <circle cx="342" cy="712" r="16" className="fill-pine-700 dark:fill-pine-850" />
          <circle cx="342" cy="712" r="10" className={`fill-gold-300 dark:fill-gold-300 ${motionOK ? "anim-flicker" : ""}`} />
        </g>

        {/* rune obelisk on the right of the lantern */}
        <g>
          <path d="M430 810 L438 716 L462 716 L470 810 Z" className="fill-pine-600 dark:fill-pine-800" />
          <g strokeWidth="3" strokeLinecap="round" className={`stroke-teal-600 dark:stroke-teal-300 ${motionOK ? "anim-shimmer" : ""}`}>
            <path d="M444 736 L456 736" />
            <path d="M445 754 L457 750" />
            <path d="M446 772 L456 776" />
          </g>
        </g>
      </motion.g>
    </svg>
  );
}

/** Hook wrapper so pages can share one scroll listener for the hero. */
export function useHeroParallax() {
  const { scrollY } = useScroll();
  return scrollY;
}
