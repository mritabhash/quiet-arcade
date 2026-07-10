import { motion } from "framer-motion";
import type { GameId } from "../types";
import { useSettings } from "../context/SettingsContext";

/**
 * Original animated SVG icons, one per game.
 * Each is a 48x48 viewbox and loops a very gentle motion.
 */

function useLoop() {
  const { motionOK } = useSettings();
  return motionOK;
}

const slow = { duration: 3.2, repeat: Infinity, ease: "easeInOut" as const };

function WordGridIcon() {
  const loop = useLoop();
  return (
    <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden>
      {[0, 1, 2].map((r) =>
        [0, 1, 2].map((c) => (
          <rect
            key={`${r}${c}`}
            x={6 + c * 13}
            y={6 + r * 13}
            width={11}
            height={11}
            rx={2.5}
            fill={r === 1 && c === 1 ? "#bc6140" : r === 0 && c === 2 ? "#d9a741" : "var(--card-2)"}
            stroke="var(--line)"
          />
        )),
      )}
      {loop && (
        <motion.rect
          x={6}
          y={32}
          width={11}
          height={11}
          rx={2.5}
          fill="#788d63"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={slow}
        />
      )}
    </svg>
  );
}

function PatternGroupsIcon() {
  const loop = useLoop();
  const colors = ["#788d63", "#d9a741", "#bc6140", "#37837b"];
  return (
    <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden>
      {colors.map((fill, i) => {
        const x = 8 + (i % 2) * 18;
        const y = 8 + Math.floor(i / 2) * 18;
        return loop ? (
          <motion.rect
            key={i}
            width={14}
            height={14}
            rx={4}
            fill={fill}
            initial={{ x, y }}
            animate={{ rotate: [0, i % 2 ? 6 : -6, 0] }}
            transition={{ ...slow, delay: i * 0.4 }}
            style={{ originX: "50%", originY: "50%" }}
          />
        ) : (
          <rect key={i} x={x} y={y} width={14} height={14} rx={4} fill={fill} />
        );
      })}
    </svg>
  );
}

function CrosswordIcon() {
  const loop = useLoop();
  return (
    <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden>
      <rect x={6} y={6} width={36} height={36} rx={4} fill="var(--card-2)" stroke="var(--line)" />
      <path d="M6 18 H42 M6 30 H42 M18 6 V42 M30 6 V42" stroke="var(--line)" strokeWidth={1.5} />
      <rect x={30} y={6} width={12} height={12} fill="#d9a741" opacity={0.9} rx={3} />
      {loop && (
        <motion.rect
          x={6}
          y={18}
          width={12}
          height={12}
          rx={3}
          fill="#37837b"
          animate={{ opacity: [0.3, 0.9, 0.3] }}
          transition={slow}
        />
      )}
    </svg>
  );
}

function StrandsIcon() {
  const loop = useLoop();
  const d = "M8 38 L20 26 L16 14 L30 18 L40 10";
  return (
    <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden>
      {[8, 20, 16, 30, 40].map((x, i) => {
        const ys = [38, 26, 14, 18, 10];
        return <circle key={i} cx={x} cy={ys[i]} r={4} fill="var(--card-2)" stroke="var(--line)" />;
      })}
      {loop ? (
        <motion.path
          d={d}
          fill="none"
          stroke="#37837b"
          strokeWidth={3}
          strokeLinecap="round"
          animate={{ pathLength: [0, 1, 1, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
        />
      ) : (
        <path d={d} fill="none" stroke="#37837b" strokeWidth={3} strokeLinecap="round" />
      )}
    </svg>
  );
}

function hexPoints(cx: number, cy: number, r: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i + Math.PI / 6;
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
  }).join(" ");
}

function HiveIcon() {
  const loop = useLoop();
  return (
    <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden>
      {Array.from({ length: 6 }, (_, i) => {
        const a = (Math.PI / 3) * i;
        return (
          <polygon
            key={i}
            points={hexPoints(24 + 13 * Math.cos(a), 24 + 13 * Math.sin(a), 6.5)}
            fill="var(--card-2)"
            stroke="var(--line)"
          />
        );
      })}
      {loop ? (
        <motion.polygon
          points={hexPoints(24, 24, 6.5)}
          fill="#d9a741"
          animate={{ scale: [1, 1.14, 1] }}
          transition={slow}
          style={{ originX: "50%", originY: "50%" }}
        />
      ) : (
        <polygon points={hexPoints(24, 24, 6.5)} fill="#d9a741" />
      )}
    </svg>
  );
}

function MapDropIcon() {
  const loop = useLoop();
  const pin = "M24 8 C29 8 32 12 32 16 C32 22 24 30 24 30 C24 30 16 22 16 16 C16 12 19 8 24 8 Z";
  return (
    <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden>
      <path d="M6 34 L16 30 L24 34 L34 30 L42 34 L42 42 L6 42 Z" fill="#94a87e" opacity={0.6} />
      <path d="M6 34 L16 30 L24 34 L34 30 L42 34" fill="none" stroke="var(--line)" />
      {loop ? (
        <motion.g animate={{ y: [0, -5, 0] }} transition={slow}>
          <path d={pin} fill="#bc6140" />
          <circle cx={24} cy={16} r={3.5} fill="#faf6ec" />
        </motion.g>
      ) : (
        <g>
          <path d={pin} fill="#bc6140" />
          <circle cx={24} cy={16} r={3.5} fill="#faf6ec" />
        </g>
      )}
    </svg>
  );
}

function GlobeIcon() {
  const loop = useLoop();
  return (
    <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden>
      <circle cx={24} cy={24} r={16} fill="#7bb8b0" opacity={0.35} stroke="#37837b" strokeWidth={1.5} />
      <ellipse cx={24} cy={24} rx={7} ry={16} fill="none" stroke="#37837b" />
      <path d="M8 24 H40 M10.5 15 H37.5 M10.5 33 H37.5" stroke="#37837b" strokeWidth={1} opacity={0.7} />
      {loop && (
        <motion.circle
          cy={24}
          r={3}
          fill="#d9a741"
          animate={{ cx: [14, 34, 14] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </svg>
  );
}

function ShapeIcon() {
  const loop = useLoop();
  const shape = "M14 10 L28 6 L38 16 L34 28 L38 38 L22 42 L12 32 L16 22 Z";
  return (
    <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden>
      {loop ? (
        <motion.path
          d={shape}
          fill="#e09a78"
          stroke="#9e4c32"
          strokeWidth={1.5}
          animate={{ rotate: [0, 4, 0, -4, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          style={{ originX: "50%", originY: "50%" }}
        />
      ) : (
        <path d={shape} fill="#e09a78" stroke="#9e4c32" strokeWidth={1.5} />
      )}
      <circle cx={24} cy={24} r={2.5} fill="#7d3a27" />
    </svg>
  );
}

function TimeLensIcon() {
  const loop = useLoop();
  return (
    <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden>
      <circle cx={24} cy={24} r={16} fill="var(--card-2)" stroke="var(--line)" strokeWidth={1.5} />
      <circle cx={24} cy={24} r={2} fill="#bc6140" />
      <path d="M24 24 L24 13" stroke="#bc6140" strokeWidth={2.5} strokeLinecap="round" />
      {loop ? (
        <motion.path
          d="M24 24 L32 28"
          stroke="#d9a741"
          strokeWidth={2.5}
          strokeLinecap="round"
          animate={{ rotate: 360 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          style={{ originX: "50%", originY: "50%" }}
        />
      ) : (
        <path d="M24 24 L32 28" stroke="#d9a741" strokeWidth={2.5} strokeLinecap="round" />
      )}
    </svg>
  );
}

function HigherLowerIcon() {
  const loop = useLoop();
  return (
    <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden>
      {loop ? (
        <>
          <motion.rect x={9} width={12} rx={3} fill="#788d63" initial={{ y: 20, height: 22 }} animate={{ y: [20, 12, 20], height: [22, 30, 22] }} transition={slow} />
          <motion.rect x={27} width={12} rx={3} fill="#bc6140" initial={{ y: 14, height: 28 }} animate={{ y: [14, 24, 14], height: [28, 18, 28] }} transition={slow} />
        </>
      ) : (
        <>
          <rect x={9} y={16} width={12} height={26} rx={3} fill="#788d63" />
          <rect x={27} y={10} width={12} height={32} rx={3} fill="#bc6140" />
        </>
      )}
      <path d="M12 8 L15 4 L18 8 M30 40 L33 44 L36 40" stroke="var(--muted)" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TimeCapsuleIcon() {
  const loop = useLoop();
  return (
    <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden>
      {/* archive card */}
      <rect x={7} y={10} width={34} height={28} rx={3} fill="var(--card-2)" stroke="var(--line)" strokeWidth={1.5} />
      <path d="M12 17 H30 M12 22 H36 M12 27 H26" stroke="var(--muted)" strokeWidth={1.6} strokeLinecap="round" opacity={0.6} />
      {/* wax-seal clock */}
      {loop ? (
        <motion.g animate={{ rotate: [0, 6, 0, -6, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} style={{ originX: "72%", originY: "68%" }}>
          <circle cx={34.5} cy={32.5} r={7.5} fill="#d9a741" stroke="#8a6a3a" strokeWidth={1.4} />
          <path d="M34.5 32.5 L34.5 27.5 M34.5 32.5 L38 34" stroke="#5c4322" strokeWidth={1.8} strokeLinecap="round" />
        </motion.g>
      ) : (
        <g>
          <circle cx={34.5} cy={32.5} r={7.5} fill="#d9a741" stroke="#8a6a3a" strokeWidth={1.4} />
          <path d="M34.5 32.5 L34.5 27.5 M34.5 32.5 L38 34" stroke="#5c4322" strokeWidth={1.8} strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}

function BorderlineIcon() {
  const loop = useLoop();
  return (
    <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden>
      {/* dashed border rings closing on the hidden place */}
      <circle cx={24} cy={24} r={17} fill="none" stroke="var(--muted)" strokeWidth={1.4} strokeDasharray="4 4" opacity={0.55} />
      {loop ? (
        <motion.circle
          cx={24}
          cy={24}
          r={11}
          fill="none"
          stroke="#37837b"
          strokeWidth={1.8}
          strokeDasharray="4 4"
          animate={{ rotate: 360 }}
          transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
          style={{ originX: "50%", originY: "50%" }}
        />
      ) : (
        <circle cx={24} cy={24} r={11} fill="none" stroke="#37837b" strokeWidth={1.8} strokeDasharray="4 4" />
      )}
      {loop ? (
        <motion.circle cx={24} cy={24} r={4.5} fill="#bc6140" animate={{ scale: [1, 1.2, 1] }} transition={slow} style={{ originX: "50%", originY: "50%" }} />
      ) : (
        <circle cx={24} cy={24} r={4.5} fill="#bc6140" />
      )}
      <circle cx={24} cy={24} r={1.6} fill="#faf6ec" />
    </svg>
  );
}

function TriviaIcon() {
  const loop = useLoop();
  return (
    <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden>
      {/* a stack of question cards with a glowing mark */}
      <rect x={10} y={13} width={26} height={26} rx={5} fill="none" stroke="var(--muted)" strokeWidth={1.4} opacity={0.5} transform="rotate(-6 23 26)" />
      <rect x={12} y={11} width={26} height={26} rx={5} className="fill-sand-200 dark:fill-pine-800" stroke="#37837b" strokeWidth={1.8} transform="rotate(3 25 24)" />
      {loop ? (
        <motion.path
          d="M21 21 q0 -4 4 -4 q4.4 0 4.4 3.6 q0 2.6-3 3.6 q-1.4.5-1.4 2.4"
          fill="none"
          stroke="#bc6140"
          strokeWidth={2.4}
          strokeLinecap="round"
          animate={{ opacity: [1, 0.55, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
      ) : (
        <path
          d="M21 21 q0 -4 4 -4 q4.4 0 4.4 3.6 q0 2.6-3 3.6 q-1.4.5-1.4 2.4"
          fill="none"
          stroke="#bc6140"
          strokeWidth={2.4}
          strokeLinecap="round"
        />
      )}
      <circle cx={25.2} cy={31.6} r={1.5} fill="#d19e34" />
    </svg>
  );
}

function OddOneOutIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden>
      {[0, 1, 2].map((r) =>
        [0, 1, 2].map((c) => {
          const odd = r === 1 && c === 2;
          return (
            <rect
              key={`${r}${c}`}
              x={7 + c * 12}
              y={7 + r * 12}
              width={10}
              height={10}
              rx={3}
              fill={odd ? "#bc6140" : "var(--card-2)"}
              stroke={odd ? "#7c3a24" : "var(--line)"}
              strokeWidth={1.4}
            />
          );
        }),
      )}
      <circle cx={40} cy={40} r={2} fill="#d19e34" />
    </svg>
  );
}

function CatPairsIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden>
      {/* face-down card with a paw print */}
      <g transform="rotate(-7 15 24)">
        <rect x={6} y={12} width={18} height={24} rx={4} className="fill-sand-200 dark:fill-pine-800" stroke="#bc6140" strokeWidth={1.6} />
        <ellipse cx={15} cy={26} rx={2.7} ry={2.2} fill="#c98d5f" />
        <circle cx={11.4} cy={22.4} r={1.15} fill="#c98d5f" />
        <circle cx={15} cy={21.3} r={1.15} fill="#c98d5f" />
        <circle cx={18.6} cy={22.4} r={1.15} fill="#c98d5f" />
      </g>
      {/* face-up card with a dozing cat */}
      <g transform="rotate(6 33 24)">
        <rect x={24} y={11} width={18} height={24} rx={4} className="fill-sand-200 dark:fill-pine-800" stroke="#37837b" strokeWidth={1.8} />
        <path d="M27.5 22 L26.5 16.5 L31 19 Z" fill="#cf7a54" stroke="#7c3a24" strokeWidth={1} strokeLinejoin="round" />
        <path d="M38.5 22 L39.5 16.5 L35 19 Z" fill="#cf7a54" stroke="#7c3a24" strokeWidth={1} strokeLinejoin="round" />
        <ellipse cx={33} cy={25.5} rx={6.5} ry={6} fill="#cf7a54" stroke="#7c3a24" strokeWidth={1.2} />
        <path d="M29.8 25 q1 1.1 2 0 M34.2 25 q1 1.1 2 0" fill="none" stroke="#7c3a24" strokeWidth={1.1} strokeLinecap="round" />
        <path d="M32.4 28 h1.2 l-.6 1 Z" fill="#7c3a24" />
      </g>
      <circle cx={24} cy={41} r={1.4} fill="#d19e34" />
    </svg>
  );
}

export function GameIcon({ id }: { id: GameId }) {
  switch (id) {
    case "time-capsule":
      return <TimeCapsuleIcon />;
    case "borderline":
      return <BorderlineIcon />;
    case "word-grid":
      return <WordGridIcon />;
    case "pattern-groups":
      return <PatternGroupsIcon />;
    case "mini-crossword":
      return <CrosswordIcon />;
    case "hidden-strands":
      return <StrandsIcon />;
    case "letter-hive":
      return <HiveIcon />;
    case "map-drop":
      return <MapDropIcon />;
    case "globe-hunt":
      return <GlobeIcon />;
    case "country-shape":
      return <ShapeIcon />;
    case "time-lens":
      return <TimeLensIcon />;
    case "higher-lower":
      return <HigherLowerIcon />;
    case "trivia":
      return <TriviaIcon />;
    case "cat-pairs":
      return <CatPairsIcon />;
    case "odd-one-out":
      return <OddOneOutIcon />;
  }
}
