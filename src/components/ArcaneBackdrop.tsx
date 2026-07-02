import { useMemo } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { rngFor, randInt, pick, type Rng } from "../lib/random";
import { useSettings } from "../context/SettingsContext";

/**
 * Fixed, daily-seeded field of faint arcana behind a page: runes, rings,
 * diamonds, sparks, and little constellations on three parallax depths.
 * The arrangement is deterministic for the seed, so it redraws itself
 * each midnight along with the puzzles.
 */

type GlyphKind = "rune" | "ring" | "diamond" | "spark" | "constellation";

interface Glyph {
  kind: GlyphKind;
  x: number;
  y: number;
  size: number;
  rot: number;
  opacity: number;
  color: string;
  seed: number;
}

const COLORS = [
  "text-gold-600 dark:text-gold-300",
  "text-teal-600 dark:text-teal-300",
  "text-clay-500 dark:text-clay-300",
  "text-sage-600 dark:text-sage-300",
];

const KINDS: GlyphKind[] = ["rune", "ring", "diamond", "spark", "constellation"];

function makeGlyphs(rng: Rng, count: number, minSize: number, maxSize: number): Glyph[] {
  return Array.from({ length: count }, () => ({
    kind: pick(rng, KINDS),
    x: randInt(rng, 2, 94),
    y: randInt(rng, 2, 94),
    size: randInt(rng, minSize, maxSize),
    rot: randInt(rng, -30, 30),
    opacity: randInt(rng, 16, 32) / 100,
    color: pick(rng, COLORS),
    seed: randInt(rng, 0, 1_000_000),
  }));
}

function GlyphShape({ glyph }: { glyph: Glyph }) {
  const rng = rngFor([glyph.seed]);
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (glyph.kind) {
    case "rune": {
      // two or three rough strokes, jittered per glyph
      const rows = randInt(rng, 2, 3);
      return (
        <g {...common}>
          {Array.from({ length: rows }, (_, i) => {
            const y = 5 + i * 7 + randInt(rng, -1, 1);
            return <path key={i} d={`M${4 + randInt(rng, 0, 3)} ${y} L${20 - randInt(rng, 0, 3)} ${y + randInt(rng, -3, 3)}`} />;
          })}
        </g>
      );
    }
    case "ring":
      return <circle {...common} cx="12" cy="12" r="9" strokeDasharray={pick(rng, ["2 4", "1 5", "6 3"])} />;
    case "diamond":
      return <rect {...common} x="6" y="6" width="12" height="12" transform="rotate(45 12 12)" />;
    case "spark":
      return (
        <path
          d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z"
          fill="currentColor"
          stroke="none"
        />
      );
    case "constellation": {
      const pts = Array.from({ length: randInt(rng, 3, 4) }, () => [randInt(rng, 2, 22), randInt(rng, 2, 22)]);
      return (
        <g {...common} strokeWidth={1}>
          <path d={`M${pts.map((p) => p.join(" ")).join(" L")}`} />
          {pts.map((p, i) => (
            <circle key={i} cx={p[0]} cy={p[1]} r="1.4" fill="currentColor" stroke="none" />
          ))}
        </g>
      );
    }
  }
}

function Layer({ glyphs, y }: { glyphs: Glyph[]; y?: MotionValue<number> }) {
  return (
    <motion.div style={y ? { y } : undefined} className="absolute inset-[-18%]">
      {glyphs.map((g, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className={`absolute ${g.color}`}
          style={{
            left: `${g.x}%`,
            top: `${g.y}%`,
            width: g.size,
            height: g.size,
            opacity: g.opacity,
            transform: `rotate(${g.rot}deg)`,
          }}
        >
          <GlyphShape glyph={g} />
        </svg>
      ))}
    </motion.div>
  );
}

export function ArcaneBackdrop({ seedParts }: { seedParts: (string | number)[] }) {
  const { motionOK } = useSettings();
  const { scrollY } = useScroll();
  // unclamped so long pages keep drifting; deeper layers move faster
  const yFar = useTransform(scrollY, (v) => v * -0.04);
  const yMid = useTransform(scrollY, (v) => v * -0.1);
  const yNear = useTransform(scrollY, (v) => v * -0.2);

  const layers = useMemo(() => {
    const rng = rngFor(["backdrop", ...seedParts]);
    return {
      far: makeGlyphs(rng, 12, 22, 38),
      mid: makeGlyphs(rng, 10, 36, 64),
      near: makeGlyphs(rng, 8, 56, 100),
      watermark: {
        x: randInt(rng, 4, 62),
        y: randInt(rng, 8, 55),
        size: randInt(rng, 300, 460),
        rot: randInt(rng, 0, 90),
        color: pick(rng, COLORS),
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedParts.join(":")]);

  const wm = layers.watermark;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* one large sigil-ring watermark anchoring the composition */}
      <motion.div style={motionOK ? { y: yFar } : undefined} className="absolute inset-[-18%]">
        <svg
          viewBox="0 0 120 120"
          className={`absolute ${wm.color}`}
          style={{ left: `${wm.x}%`, top: `${wm.y}%`, width: wm.size, height: wm.size, opacity: 0.12, transform: `rotate(${wm.rot}deg)` }}
        >
          <g fill="none" stroke="currentColor" strokeLinecap="round">
            <circle cx="60" cy="60" r="54" strokeWidth="0.8" strokeDasharray="3 6" />
            <circle cx="60" cy="60" r="40" strokeWidth="0.6" />
            <rect x="46" y="46" width="28" height="28" strokeWidth="0.8" transform="rotate(45 60 60)" />
            {[0, 45, 90, 135].map((deg) => (
              <path key={deg} d="M60 6 L60 20 M60 100 L60 114" strokeWidth="1" transform={`rotate(${deg} 60 60)`} />
            ))}
          </g>
        </svg>
      </motion.div>
      <Layer glyphs={layers.far} y={motionOK ? yFar : undefined} />
      <Layer glyphs={layers.mid} y={motionOK ? yMid : undefined} />
      <Layer glyphs={layers.near} y={motionOK ? yNear : undefined} />
    </div>
  );
}
