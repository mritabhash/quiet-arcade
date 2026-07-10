import { useLocation } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useSettings } from "../context/SettingsContext";

/**
 * A dial half-sunk into the edge of the page, fixed in place while its
 * rotation is geared to scroll distance — scrolling feels like turning it.
 * Each section of the arcade hangs a different instrument in a different
 * spot: Home a cratered moon, the games a chamber wheel, Stats an
 * astrolabe, Settings a brass gear.
 */

type Side = "left" | "right";

interface DialConfig {
  side: Side;
  /** vertical anchor as % of viewport height */
  top: number;
  art: React.ReactNode;
}

const MOON = (
  <>
    <circle cx="60" cy="60" r="46" className="fill-gold-300 dark:fill-sand-100" opacity="0.14" />
    <g fill="none" strokeLinecap="round" className="stroke-gold-600 dark:stroke-gold-300">
      <circle cx="60" cy="60" r="57" strokeWidth="1.5" opacity="0.75" />
      {Array.from({ length: 12 }, (_, i) => (
        <path key={i} d="M60 3 L60 9" strokeWidth="2" transform={`rotate(${i * 30} 60 60)`} />
      ))}
      <circle cx="60" cy="60" r="47" strokeWidth="1.2" strokeDasharray="3 8" opacity="0.6" />
    </g>
    <rect x="56" y="8" width="8" height="8" transform="rotate(45 60 12)" className="fill-teal-600 dark:fill-teal-300" opacity="0.9" />
    <circle cx="60" cy="60" r="36" className="fill-gold-200 dark:fill-sand-100" />
    <g className="fill-gold-500 dark:fill-sand-400" opacity="0.45">
      <circle cx="47" cy="48" r="7" />
      <circle cx="72" cy="42" r="4" />
      <circle cx="68" cy="66" r="9" />
      <circle cx="48" cy="72" r="4.5" />
      <circle cx="60" cy="55" r="2.8" />
    </g>
    <path d="M60 24 A36 36 0 0 1 60 96 A46 46 0 0 0 60 24 Z" className="fill-pine-900" opacity="0.22" />
  </>
);

/* eight-spoked chamber wheel — one spoke per pair of doors */
const WHEEL = (
  <>
    <g fill="none" strokeLinecap="round" className="stroke-clay-500 dark:stroke-clay-300">
      <circle cx="60" cy="60" r="56" strokeWidth="3" opacity="0.85" />
      <circle cx="60" cy="60" r="44" strokeWidth="1.5" opacity="0.6" />
      {Array.from({ length: 8 }, (_, i) => (
        <path key={i} d="M60 60 L60 6" strokeWidth="2" transform={`rotate(${i * 45} 60 60)`} opacity="0.75" />
      ))}
    </g>
    {Array.from({ length: 8 }, (_, i) => (
      <rect
        key={i}
        x="56.5"
        y="12"
        width="7"
        height="7"
        transform={`rotate(${i * 45 + 45 / 2} 60 60) rotate(45 60 15.5)`}
        className="fill-gold-500 dark:fill-gold-300"
        opacity="0.85"
      />
    ))}
    <circle cx="60" cy="60" r="10" className="fill-clay-500 dark:fill-clay-400" />
    <circle cx="60" cy="60" r="4" className="fill-gold-300 dark:fill-gold-200" />
  </>
);

/* graduated astrolabe with a fixed needle — the ledger's instrument */
const ASTROLABE = (
  <>
    <g fill="none" strokeLinecap="round" className="stroke-teal-600 dark:stroke-teal-300">
      <circle cx="60" cy="60" r="56" strokeWidth="1.5" opacity="0.85" />
      {Array.from({ length: 24 }, (_, i) => (
        <path key={i} d={i % 6 === 0 ? "M60 4 L60 14" : "M60 4 L60 9"} strokeWidth={i % 6 === 0 ? 2 : 1} transform={`rotate(${i * 15} 60 60)`} opacity="0.8" />
      ))}
      <circle cx="60" cy="60" r="38" strokeWidth="1" strokeDasharray="2 5" opacity="0.6" />
      <circle cx="60" cy="60" r="24" strokeWidth="1" opacity="0.5" />
    </g>
    <g strokeLinecap="round" className="stroke-gold-500 dark:stroke-gold-300">
      <path d="M60 60 L98 34" strokeWidth="2.5" />
      <path d="M60 60 L34 78" strokeWidth="1.5" opacity="0.7" />
    </g>
    <circle cx="98" cy="34" r="4" className="fill-gold-500 dark:fill-gold-300" />
    <circle cx="60" cy="60" r="5" className="fill-teal-600 dark:fill-teal-300" />
  </>
);

/* twelve-toothed brass gear — the machinery behind the settings */
const GEAR = (
  <>
    {Array.from({ length: 12 }, (_, i) => (
      <rect key={i} x="54" y="2" width="12" height="14" rx="2" className="fill-gold-600 dark:fill-gold-400" transform={`rotate(${i * 30} 60 60)`} />
    ))}
    <circle cx="60" cy="60" r="48" className="fill-gold-500 dark:fill-gold-300" />
    <circle cx="60" cy="60" r="38" className="fill-pine-100 dark:fill-pine-900" />
    <g fill="none" className="stroke-gold-600 dark:stroke-gold-400">
      <circle cx="60" cy="60" r="30" strokeWidth="1.5" strokeDasharray="4 6" opacity="0.8" />
    </g>
    {Array.from({ length: 4 }, (_, i) => (
      <circle key={i} cx="60" cy="26" r="3.5" className="fill-gold-600 dark:fill-gold-400" transform={`rotate(${i * 90 + 45} 60 60)`} />
    ))}
    <rect x="52" y="52" width="16" height="16" transform="rotate(45 60 60)" className="fill-clay-500 dark:fill-clay-400" />
  </>
);

function configFor(pathname: string): DialConfig {
  if (pathname.startsWith("/games")) return { side: "left", top: 66, art: WHEEL };
  if (pathname.startsWith("/stats")) return { side: "right", top: 30, art: ASTROLABE };
  if (pathname.startsWith("/settings")) return { side: "left", top: 34, art: GEAR };
  return { side: "right", top: 50, art: MOON };
}

export function SigilDial() {
  const { motionOK } = useSettings();
  const { pathname } = useLocation();
  const { scrollY } = useScroll();
  const cfg = configFor(pathname);
  // left-hand dials spin the other way, like a wheel rolling with the page
  const rotate = useTransform(scrollY, (v) => v * (cfg.side === "left" ? -0.22 : 0.22));

  return (
    <div
      key={pathname.split("/")[1] || "home"}
      aria-hidden
      className={`pointer-events-none fixed z-30 h-14 w-14 opacity-80 sm:h-40 sm:w-40 md:h-48 md:w-48 ${
        cfg.side === "left" ? "-left-6 sm:-left-16 md:-left-20" : "-right-6 sm:-right-16 md:-right-20"
      }`}
      style={{ top: `${cfg.top}%`, transform: "translateY(-50%)" }}
    >
      <motion.svg viewBox="0 0 120 120" className="h-full w-full" style={motionOK ? { rotate } : undefined}>
        {cfg.art}
      </motion.svg>
    </div>
  );
}
