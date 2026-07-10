import { BlurReveal } from "../components/motion";

/**
 * The Lore page: a mythical map of the arcade's world, left unwritten.
 */

const MARKS: { x: number; y: number; label: string }[] = [
  { x: 468, y: 138, label: "the watchfire" },
  { x: 258, y: 210, label: "the west tower" },
  { x: 660, y: 258, label: "the roost" },
  { x: 622, y: 388, label: "the ledger keep" },
  { x: 300, y: 402, label: "the burrow" },
  { x: 736, y: 170, label: "the glowing hollow" },
  { x: 452, y: 316, label: "the sunning stone" },
];

function Mountain({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <path
      d={`M${x - 22 * s} ${y} L${x} ${y - 30 * s} L${x + 22 * s} ${y} M${x - 4 * s} ${y - 24 * s} L${x + 6 * s} ${y - 12 * s}`}
      fill="none"
      className="stroke-pine-700 dark:stroke-sand-300"
      strokeWidth={2}
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  );
}

function Tree({ x, y }: { x: number; y: number }) {
  return (
    <path
      d={`M${x} ${y} v-8 M${x} ${y - 8} l-7 10 h14 Z M${x} ${y - 14} l-5 8 h10 Z`}
      className="fill-sage-500/60 stroke-pine-700 dark:fill-pine-600 dark:stroke-sand-300"
      strokeWidth={1.3}
      strokeLinejoin="round"
    />
  );
}

function MythicalMap() {
  return (
    <div className="qa-card grain overflow-hidden rounded-3xl">
      <svg
        viewBox="0 0 900 540"
        className="block w-full"
        role="img"
        aria-label="A mythical map of the arcade's world."
      >
        {/* parchment */}
        <rect x={0} y={0} width={900} height={540} className="fill-sand-100 dark:fill-pine-900" />
        <rect x={14} y={14} width={872} height={512} rx={10} fill="none" className="stroke-gold-600/50" strokeWidth={2} strokeDasharray="1 6" strokeLinecap="round" />
        <rect x={22} y={22} width={856} height={496} rx={8} fill="none" className="stroke-clay-600/40" strokeWidth={1} />

        {/* the quiet sea */}
        <path
          d="M22 22 H200 Q160 120 196 210 Q232 300 172 392 Q140 452 176 518 H22 Z"
          className="fill-teal-200/70 dark:fill-teal-900/60"
        />
        <path
          d="M22 22 H200 Q160 120 196 210 Q232 300 172 392 Q140 452 176 518"
          fill="none"
          className="stroke-teal-700/60 dark:stroke-teal-400/50"
          strokeWidth={2}
        />
        {[
          [70, 120], [110, 190], [66, 260], [104, 330], [70, 420], [120, 470],
        ].map(([x, y], i) => (
          <path key={i} d={`M${x} ${y} q8 -6 16 0 q8 6 16 0`} fill="none" className="stroke-teal-700/50 dark:stroke-teal-400/40" strokeWidth={1.6} strokeLinecap="round" />
        ))}
        <text x={96} y={72} className="fill-teal-800 dark:fill-teal-300 font-display" fontSize={17} fontStyle="italic">the quiet sea</text>

        {/* mountains of the north-east */}
        <Mountain x={560} y={92} s={1.2} />
        <Mountain x={618} y={100} />
        <Mountain x={672} y={88} s={1.35} />
        <Mountain x={730} y={102} s={0.9} />
        <Mountain x={790} y={92} s={1.1} />
        <text x={632} y={62} className="fill-pine-700 dark:fill-sand-300 font-display" fontSize={15} fontStyle="italic">the old teeth</text>

        {/* the deep wood */}
        <Tree x={760} y={210} /> <Tree x={790} y={232} /> <Tree x={732} y={240} />
        <Tree x={772} y={264} /> <Tree x={806} y={200} /> <Tree x={744} y={288} />
        <Tree x={800} y={300} />
        <text x={716} y={330} className="fill-pine-700 dark:fill-sand-300 font-display" fontSize={14} fontStyle="italic">the deep wood</text>

        {/* the dune sea */}
        {[
          [300, 462], [360, 480], [430, 466], [500, 484], [566, 468], [400, 500], [480, 506],
        ].map(([x, y], i) => (
          <path key={i} d={`M${x - 26} ${y} q26 -16 52 0`} fill="none" className="stroke-gold-600/70" strokeWidth={1.8} strokeLinecap="round" />
        ))}
        <text x={392} y={528} className="fill-gold-700 dark:fill-gold-300 font-display" fontSize={14} fontStyle="italic">the dune sea</text>

        {/* a river from the old teeth to the quiet sea */}
        <path
          d="M700 118 Q600 190 508 196 Q380 204 330 260 Q290 306 220 300 Q200 298 196 288"
          fill="none"
          className="stroke-teal-600/70 dark:stroke-teal-400/60"
          strokeWidth={3}
          strokeLinecap="round"
        />

        {/* the hall of fifteen doors */}
        <g>
          <path d="M420 268 L420 236 L452 208 L484 236 L484 268 Z" className="fill-clay-500" />
          <path d="M438 268 L438 244 Q438 230 452 226 Q466 230 466 244 L466 268 Z" className="fill-teal-600" />
          <rect x={447} y={206} width={10} height={10} transform="rotate(45 452 211)" className="fill-gold-500" />
          <rect x={414} y={268} width={76} height={5} className="fill-pine-800 dark:fill-sand-300" />
        </g>
        {Array.from({ length: 15 }, (_, i) => {
          const a = (i / 15) * Math.PI * 2 - Math.PI / 2;
          return (
            <circle
              key={i}
              cx={452 + Math.cos(a) * 62}
              cy={244 + Math.sin(a) * 62}
              r={3}
              className="fill-clay-500/80"
            />
          );
        })}
        <text x={452} y={302} textAnchor="middle" className="fill-[var(--ink)] font-display" fontSize={15} fontWeight={600}>the hall of fifteen doors</text>

        {/* wandering routes */}
        <path d="M452 306 Q380 350 310 396 M452 306 Q540 350 616 382 M484 240 Q520 190 560 160 M420 240 Q340 220 268 216" fill="none" className="stroke-clay-600/50" strokeWidth={1.5} strokeDasharray="3 6" strokeLinecap="round" />

        {/* compass rose */}
        <g transform="translate(74,70)" className="stroke-clay-600" fill="none" strokeWidth={1.5}>
          <circle r={17} />
          <path d="M0 -26 L5 -5 L0 26 L-5 -5 Z" className="fill-clay-500/70" strokeWidth={1} />
          <path d="M-26 0 L-5 -4 L26 0 L-5 4 Z" className="fill-gold-500/60" strokeWidth={1} />
        </g>

        {/* the moon that watches */}
        <circle cx={836} cy={58} r={20} className="fill-gold-300/80 dark:fill-sand-200/90" />
        <circle cx={828} cy={52} r={5} className="fill-gold-500/40 dark:fill-sand-400/50" />
        <circle cx={844} cy={64} r={3.4} className="fill-gold-500/40 dark:fill-sand-400/50" />

        {/* unnamed places, waiting */}
        {MARKS.map((m) => (
          <g key={m.label}>
            <circle cx={m.x} cy={m.y} r={5.5} className="fill-gold-500 stroke-pine-800 dark:stroke-sand-100" strokeWidth={1.6} />
            <circle cx={m.x} cy={m.y} r={2} className="fill-pine-800 dark:fill-sand-100" />
            <text x={m.x} y={m.y + 22} textAnchor="middle" className="fill-[var(--ink)] font-display" fontSize={12.5} fontStyle="italic">
              {m.label}
            </text>
          </g>
        ))}

      </svg>
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
