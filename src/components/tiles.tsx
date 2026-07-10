/**
 * The arcade's tile library: 10,080 procedurally distinct tiles built from
 * 15 subjects × 8 palettes × 3 patterns × 7 charms × 4 auras.
 * Deterministic: tileSpec(i) always yields the same tile, so daily rounds
 * stay identical for everyone. Rendered parametrically as inline SVG.
 */
import type { ReactNode } from "react";
import type { Rng } from "../lib/random";
import { pickIndex, shuffled } from "../lib/random";

export interface TilePalette {
  id: string;
  body: string;
  light: string;
  dark: string;
}

const PALETTES: TilePalette[] = [
  { id: "sand", body: "#e7cfa4", light: "#f2e3c2", dark: "#8a6544" },
  { id: "clay", body: "#cf7a54", light: "#e8a37e", dark: "#7c3a24" },
  { id: "gold", body: "#ddb05e", light: "#ecd39c", dark: "#8a6215" },
  { id: "sage", body: "#a9bc8f", light: "#cbdab4", dark: "#5c7052" },
  { id: "teal", body: "#6fa9a2", light: "#a3cdc7", dark: "#2f6b64" },
  { id: "dusk", body: "#8b93ad", light: "#b4bacf", dark: "#454e69" },
  { id: "pine", body: "#6d8a77", light: "#9db8a6", dark: "#31493c" },
  { id: "umber", body: "#a3765a", light: "#c49a7e", dark: "#5a3d2a" },
];

const PATTERNS = ["plain", "striped", "spotted"] as const;
const CHARMS = ["none", "sun", "star", "bell", "sprig", "feather", "moon"] as const;
const AURAS = ["none", "halo", "sparkle", "dunes"] as const;

export type TilePattern = (typeof PATTERNS)[number];
export type TileCharm = (typeof CHARMS)[number];
export type TileAura = (typeof AURAS)[number];

interface KindDef {
  id: string;
  label: string;
  /** three on-body points where stripes / spots are painted */
  spots: [number, number][];
  draw: (p: TilePalette) => ReactNode;
}

const KINDS: KindDef[] = [
  {
    id: "cat",
    label: "cat",
    spots: [[26, 31], [38, 31], [32, 48]],
    draw: (p) => (
      <g>
        <path d="M15 28 L11 11 L27 18 Z" fill={p.body} stroke={p.dark} strokeWidth={2} strokeLinejoin="round" />
        <path d="M49 28 L53 11 L37 18 Z" fill={p.body} stroke={p.dark} strokeWidth={2} strokeLinejoin="round" />
        <path d="M16.5 24 L14 14.5 L22.5 18.5 Z" fill={p.light} />
        <path d="M47.5 24 L50 14.5 L41.5 18.5 Z" fill={p.light} />
        <ellipse cx={32} cy={38} rx={20} ry={17} fill={p.body} stroke={p.dark} strokeWidth={2} />
        <path d="M23 38 q2.5 2.8 5 0 M36 38 q2.5 2.8 5 0" fill="none" stroke={p.dark} strokeWidth={1.8} strokeLinecap="round" />
        <path d="M30.6 43 h2.8 l-1.4 2 Z" fill={p.dark} />
        <g stroke={p.dark} strokeWidth={1.1} opacity={0.7} strokeLinecap="round" fill="none">
          <path d="M14 41 l7 -.5 M15 45 l6 -1.5 M50 41 l-7 -.5 M49 45 l-6 -1.5" />
        </g>
      </g>
    ),
  },
  {
    id: "fox",
    label: "fox",
    spots: [[22, 28], [42, 28], [32, 32]],
    draw: (p) => (
      <g>
        <path d="M15 30 L10 10 L28 19 Z" fill={p.body} stroke={p.dark} strokeWidth={2} strokeLinejoin="round" />
        <path d="M49 30 L54 10 L36 19 Z" fill={p.body} stroke={p.dark} strokeWidth={2} strokeLinejoin="round" />
        <path d="M16.5 25 L13.5 13 L23 18.5 Z" fill={p.light} />
        <path d="M47.5 25 L50.5 13 L41 18.5 Z" fill={p.light} />
        <path d="M32 55 L15 35 Q14 22 32 22 Q50 22 49 35 Z" fill={p.body} stroke={p.dark} strokeWidth={2} strokeLinejoin="round" />
        <path d="M32 54 L25 41 h14 Z" fill={p.light} />
        <path d="M23 33 q2.5 2.5 5 0 M36 33 q2.5 2.5 5 0" fill="none" stroke={p.dark} strokeWidth={1.8} strokeLinecap="round" />
        <circle cx={32} cy={51} r={1.8} fill={p.dark} />
      </g>
    ),
  },
  {
    id: "owl",
    label: "owl",
    spots: [[26, 48], [32, 51], [38, 48]],
    draw: (p) => (
      <g>
        <path d="M19 19 L13 10 L25 13.5 Z" fill={p.body} stroke={p.dark} strokeWidth={2} strokeLinejoin="round" />
        <path d="M45 19 L51 10 L39 13.5 Z" fill={p.body} stroke={p.dark} strokeWidth={2} strokeLinejoin="round" />
        <ellipse cx={32} cy={36} rx={19} ry={21} fill={p.body} stroke={p.dark} strokeWidth={2} />
        <circle cx={25} cy={30} r={6.5} fill={p.light} stroke={p.dark} strokeWidth={1.5} />
        <circle cx={39} cy={30} r={6.5} fill={p.light} stroke={p.dark} strokeWidth={1.5} />
        <circle cx={25} cy={30} r={2.1} fill={p.dark} />
        <circle cx={39} cy={30} r={2.1} fill={p.dark} />
        <path d="M32 34 l-3 4.5 h6 Z" fill={p.dark} />
        <path d="M14 34 q-2 10 6 15 M50 34 q2 10 -6 15" fill="none" stroke={p.dark} strokeWidth={1.6} strokeLinecap="round" opacity={0.7} />
      </g>
    ),
  },
  {
    id: "rabbit",
    label: "rabbit",
    spots: [[25, 36], [39, 36], [32, 50]],
    draw: (p) => (
      <g>
        <ellipse cx={24} cy={17} rx={5} ry={12} fill={p.body} stroke={p.dark} strokeWidth={2} />
        <ellipse cx={40} cy={17} rx={5} ry={12} fill={p.body} stroke={p.dark} strokeWidth={2} />
        <ellipse cx={24} cy={17} rx={2.3} ry={8} fill={p.light} />
        <ellipse cx={40} cy={17} rx={2.3} ry={8} fill={p.light} />
        <ellipse cx={32} cy={41} rx={17} ry={15} fill={p.body} stroke={p.dark} strokeWidth={2} />
        <path d="M25 39 q2.5 2.8 5 0 M34 39 q2.5 2.8 5 0" fill="none" stroke={p.dark} strokeWidth={1.8} strokeLinecap="round" />
        <path d="M30.6 44 h2.8 l-1.4 2 Z" fill={p.dark} />
        <path d="M30 46.5 q-2 2 -4 1.5 M34 46.5 q2 2 4 1.5" fill="none" stroke={p.dark} strokeWidth={1.2} strokeLinecap="round" opacity={0.7} />
      </g>
    ),
  },
  {
    id: "bear",
    label: "bear",
    spots: [[22, 30], [42, 30], [32, 32]],
    draw: (p) => (
      <g>
        <circle cx={17} cy={22} r={6.5} fill={p.body} stroke={p.dark} strokeWidth={2} />
        <circle cx={47} cy={22} r={6.5} fill={p.body} stroke={p.dark} strokeWidth={2} />
        <circle cx={17} cy={22} r={3} fill={p.light} />
        <circle cx={47} cy={22} r={3} fill={p.light} />
        <ellipse cx={32} cy={38} rx={19} ry={17} fill={p.body} stroke={p.dark} strokeWidth={2} />
        <ellipse cx={32} cy={45} rx={8} ry={6} fill={p.light} />
        <circle cx={25} cy={34} r={1.8} fill={p.dark} />
        <circle cx={39} cy={34} r={1.8} fill={p.dark} />
        <path d="M30.5 43 h3 l-1.5 2.2 Z" fill={p.dark} />
      </g>
    ),
  },
  {
    id: "frog",
    label: "frog",
    spots: [[22, 36], [32, 38], [42, 36]],
    draw: (p) => (
      <g>
        <circle cx={22} cy={22} r={6} fill={p.body} stroke={p.dark} strokeWidth={2} />
        <circle cx={42} cy={22} r={6} fill={p.body} stroke={p.dark} strokeWidth={2} />
        <circle cx={22} cy={22} r={2} fill={p.dark} />
        <circle cx={42} cy={22} r={2} fill={p.dark} />
        <path d="M12 34 q20 -14 40 0 q2 17 -20 17 q-22 0 -20 -17 Z" fill={p.body} stroke={p.dark} strokeWidth={2} strokeLinejoin="round" />
        <path d="M22 41 q10 6 20 0" fill="none" stroke={p.dark} strokeWidth={1.6} strokeLinecap="round" />
        <circle cx={26} cy={45.5} r={1.2} fill={p.light} />
        <circle cx={38} cy={45.5} r={1.2} fill={p.light} />
      </g>
    ),
  },
  {
    id: "mouse",
    label: "mouse",
    spots: [[27, 34], [37, 34], [32, 48]],
    draw: (p) => (
      <g>
        <circle cx={18} cy={21} r={9} fill={p.body} stroke={p.dark} strokeWidth={2} />
        <circle cx={46} cy={21} r={9} fill={p.body} stroke={p.dark} strokeWidth={2} />
        <circle cx={18} cy={21} r={4.5} fill={p.light} />
        <circle cx={46} cy={21} r={4.5} fill={p.light} />
        <ellipse cx={32} cy={41} rx={15} ry={13} fill={p.body} stroke={p.dark} strokeWidth={2} />
        <path d="M27 39 q2.2 2.5 4.4 0 M33 39 q2.2 2.5 4.4 0" fill="none" stroke={p.dark} strokeWidth={1.6} strokeLinecap="round" />
        <path d="M30.8 44 h2.4 l-1.2 1.8 Z" fill={p.dark} />
        <g stroke={p.dark} strokeWidth={1} opacity={0.7} strokeLinecap="round" fill="none">
          <path d="M18 43 l7 -.5 M19 46.5 l6 -1.5 M46 43 l-7 -.5 M45 46.5 l-6 -1.5" />
        </g>
      </g>
    ),
  },
  {
    id: "snail",
    label: "snail",
    spots: [[25, 30], [35, 30], [30, 40]],
    draw: (p) => (
      <g>
        <path d="M9 52 q2 -8 12 -8 h27 q7 0 7 4 q0 4 -8 4 Z" fill={p.light} stroke={p.dark} strokeWidth={2} strokeLinejoin="round" />
        <circle cx={29} cy={33} r={14} fill={p.body} stroke={p.dark} strokeWidth={2} />
        <path d="M29 24 a9 9 0 1 1 -9 9 a6.5 6.5 0 1 0 6.5 -6.5 a4 4 0 1 1 -4 4" fill="none" stroke={p.dark} strokeWidth={1.5} strokeLinecap="round" opacity={0.75} />
        <path d="M49 44 q1 -8 -2 -12 M54 46 q2 -9 -1 -13" fill="none" stroke={p.dark} strokeWidth={1.6} strokeLinecap="round" />
        <circle cx={47} cy={31} r={1.7} fill={p.dark} />
        <circle cx={53} cy={32.5} r={1.7} fill={p.dark} />
      </g>
    ),
  },
  {
    id: "butterfly",
    label: "butterfly",
    spots: [[20, 32], [44, 32], [32, 50]],
    draw: (p) => (
      <g>
        <path d="M30 22 q-3 -7 -8 -9 M34 22 q3 -7 8 -9" fill="none" stroke={p.dark} strokeWidth={1.5} strokeLinecap="round" />
        <path d="M31 30 Q12 14 9 30 Q8 43 29 40 Z" fill={p.body} stroke={p.dark} strokeWidth={2} strokeLinejoin="round" />
        <path d="M33 30 Q52 14 55 30 Q56 43 35 40 Z" fill={p.body} stroke={p.dark} strokeWidth={2} strokeLinejoin="round" />
        <path d="M31 40 Q17 52 24 56 Q31 57 31 45 Z" fill={p.body} stroke={p.dark} strokeWidth={2} strokeLinejoin="round" />
        <path d="M33 40 Q47 52 40 56 Q33 57 33 45 Z" fill={p.body} stroke={p.dark} strokeWidth={2} strokeLinejoin="round" />
        <circle cx={19} cy={29} r={3.2} fill={p.light} />
        <circle cx={45} cy={29} r={3.2} fill={p.light} />
        <ellipse cx={32} cy={39} rx={2.6} ry={12} fill={p.dark} />
      </g>
    ),
  },
  {
    id: "fish",
    label: "fish",
    spots: [[30, 35], [38, 31], [38, 40]],
    draw: (p) => (
      <g>
        <path d="M11 25 L24 35 L11 45 Z" fill={p.body} stroke={p.dark} strokeWidth={2} strokeLinejoin="round" />
        <ellipse cx={37} cy={35} rx={17} ry={12} fill={p.body} stroke={p.dark} strokeWidth={2} />
        <path d="M34 25 q4 -8 11 -7 q-2 6 -7 8" fill={p.light} stroke={p.dark} strokeWidth={1.5} strokeLinejoin="round" />
        <circle cx={46} cy={32} r={2} fill={p.dark} />
        <path d="M31 35 q3 4 8 4" fill="none" stroke={p.dark} strokeWidth={1.4} strokeLinecap="round" opacity={0.7} />
        <circle cx={56} cy={26} r={1.6} fill={p.light} stroke={p.dark} strokeWidth={1} />
      </g>
    ),
  },
  {
    id: "cactus",
    label: "cactus",
    spots: [[32, 24], [32, 34], [32, 44]],
    draw: (p) => (
      <g>
        <rect x={27} y={14} width={10} height={34} rx={5} fill={p.body} stroke={p.dark} strokeWidth={2} />
        <path d="M27 36 H21 Q16 36 16 31 V24 Q16 21 19 21 Q22 21 22 24 V30 H27 Z" fill={p.body} stroke={p.dark} strokeWidth={2} strokeLinejoin="round" />
        <path d="M37 32 H43 Q48 32 48 27 V20 Q48 17 45 17 Q42 17 42 20 V26 H37 Z" fill={p.body} stroke={p.dark} strokeWidth={2} strokeLinejoin="round" />
        <path d="M21 48 h22 l-2.5 9 h-17 Z" fill={p.light} stroke={p.dark} strokeWidth={2} strokeLinejoin="round" />
        <g stroke={p.dark} strokeWidth={1} strokeLinecap="round" opacity={0.6}>
          <path d="M30 20 l-1.6 -1 M34 26 l1.6 -1 M30 40 l-1.6 1" />
        </g>
      </g>
    ),
  },
  {
    id: "lantern",
    label: "lantern",
    spots: [[27, 45.5], [32, 46], [37, 45.5]],
    draw: (p) => (
      <g>
        <path d="M26 12 q6 -8 12 0" fill="none" stroke={p.dark} strokeWidth={2} strokeLinecap="round" />
        <path d="M23 18 h18 l-2.5 -6 h-13 Z" fill={p.body} stroke={p.dark} strokeWidth={2} strokeLinejoin="round" />
        <rect x={23} y={18} width={18} height={24} rx={3} fill={p.light} stroke={p.dark} strokeWidth={2} />
        <path d="M32 37 q-4 -5 0 -11 q4 6 0 11 Z" fill="#d19e34" />
        <path d="M28 18 v24 M36 18 v24" stroke={p.dark} strokeWidth={1.1} opacity={0.45} />
        <path d="M21 42 h22 l2 7 h-26 Z" fill={p.body} stroke={p.dark} strokeWidth={2} strokeLinejoin="round" />
      </g>
    ),
  },
  {
    id: "potion",
    label: "potion",
    spots: [[26, 45], [32, 48], [38, 45]],
    draw: (p) => (
      <g>
        <rect x={28.5} y={11} width={7} height={7} rx={1.5} fill={p.light} stroke={p.dark} strokeWidth={1.6} />
        <rect x={28} y={17} width={8} height={13} fill={p.light} stroke={p.dark} strokeWidth={2} />
        <circle cx={32} cy={41} r={14} fill={p.light} stroke={p.dark} strokeWidth={2} />
        <path d="M19.6 41 h24.8 a12.4 12.4 0 0 1 -24.8 0 Z" fill={p.body} />
        <circle cx={27} cy={45} r={1.6} fill={p.light} opacity={0.9} />
        <circle cx={36} cy={48} r={1.2} fill={p.light} opacity={0.9} />
        <circle cx={32} cy={41} r={14} fill="none" stroke={p.dark} strokeWidth={2} />
      </g>
    ),
  },
  {
    id: "crown",
    label: "crown",
    spots: [[23, 38], [32, 36], [41, 38]],
    draw: (p) => (
      <g>
        <path d="M14 45 L12 24 L23 33 L32 18 L41 33 L52 24 L50 45 Z" fill={p.body} stroke={p.dark} strokeWidth={2} strokeLinejoin="round" />
        <circle cx={12} cy={22} r={2.2} fill={p.light} stroke={p.dark} strokeWidth={1.3} />
        <circle cx={32} cy={16} r={2.2} fill={p.light} stroke={p.dark} strokeWidth={1.3} />
        <circle cx={52} cy={22} r={2.2} fill={p.light} stroke={p.dark} strokeWidth={1.3} />
        <rect x={13} y={44} width={38} height={8} rx={2.5} fill={p.light} stroke={p.dark} strokeWidth={2} />
        <circle cx={23} cy={48} r={1.7} fill={p.dark} opacity={0.7} />
        <circle cx={32} cy={48} r={1.7} fill={p.dark} opacity={0.7} />
        <circle cx={41} cy={48} r={1.7} fill={p.dark} opacity={0.7} />
      </g>
    ),
  },
  {
    id: "scarab",
    label: "scarab",
    spots: [[26, 40], [38, 40], [32, 48]],
    draw: (p) => (
      <g>
        <g stroke={p.dark} strokeWidth={1.6} strokeLinecap="round">
          <path d="M18 31 l-8 -4 M18 39 l-9 1 M21 47 l-7 6 M46 31 l8 -4 M46 39 l9 1 M43 47 l7 6" />
        </g>
        <path d="M29 17 q-2 -4 -6 -4 M35 17 q2 -4 6 -4" fill="none" stroke={p.dark} strokeWidth={1.5} strokeLinecap="round" />
        <circle cx={32} cy={22} r={6} fill={p.body} stroke={p.dark} strokeWidth={2} />
        <ellipse cx={32} cy={41} rx={15} ry={14} fill={p.body} stroke={p.dark} strokeWidth={2} />
        <path d="M32 28 v26" stroke={p.dark} strokeWidth={1.4} opacity={0.6} />
        <path d="M20 34 q12 6 24 0" fill="none" stroke={p.dark} strokeWidth={1.3} opacity={0.5} />
      </g>
    ),
  },
];

const KIND_INDEX = Object.fromEntries(KINDS.map((k) => [k.id, k]));

export const TILE_COUNT =
  KINDS.length * PALETTES.length * PATTERNS.length * CHARMS.length * AURAS.length;

export interface TileSpec {
  /** stable id in [0, TILE_COUNT) — two tiles match iff their indices match */
  index: number;
  kind: string;
  name: string;
  palette: TilePalette;
  pattern: TilePattern;
  charm: TileCharm;
  aura: TileAura;
}

export function tileSpec(index: number): TileSpec {
  const i = ((index % TILE_COUNT) + TILE_COUNT) % TILE_COUNT;
  let r = i;
  const kind = KINDS[r % KINDS.length];
  r = Math.floor(r / KINDS.length);
  const palette = PALETTES[r % PALETTES.length];
  r = Math.floor(r / PALETTES.length);
  const pattern = PATTERNS[r % PATTERNS.length];
  r = Math.floor(r / PATTERNS.length);
  const charm = CHARMS[r % CHARMS.length];
  r = Math.floor(r / CHARMS.length);
  const aura = AURAS[r % AURAS.length];
  const name = [
    pattern !== "plain" ? pattern : null,
    palette.id,
    kind.label,
    charm !== "none" ? `with a ${charm} charm` : null,
    aura !== "none" ? `in a ${aura} aura` : null,
  ]
    .filter(Boolean)
    .join(" ");
  return { index: i, kind: kind.id, name, palette, pattern, charm, aura };
}

function composeIndex(k: number, pal: number, pat: number, ch: number, au: number): number {
  return (
    k +
    KINDS.length *
      (pal + PALETTES.length * (pat + PATTERNS.length * (ch + CHARMS.length * au)))
  );
}

export function randomTileSpec(rng: Rng, kindIdx?: number): TileSpec {
  const k = kindIdx ?? pickIndex(rng, KINDS.length);
  return tileSpec(
    composeIndex(
      k,
      pickIndex(rng, PALETTES.length),
      pickIndex(rng, PATTERNS.length),
      pickIndex(rng, CHARMS.length),
      pickIndex(rng, AURAS.length),
    ),
  );
}

/** n tiles with pairwise-distinct subjects — easy to tell apart in a match deck */
export function sampleDistinctTiles(rng: Rng, n: number): TileSpec[] {
  const kinds = shuffled(rng, KINDS.map((_, i) => i)).slice(0, Math.min(n, KINDS.length));
  return kinds.map((k) => randomTileSpec(rng, k));
}

/** a copy of `base` differing in exactly one visible dimension */
export function mutateTile(rng: Rng, base: TileSpec): TileSpec {
  const kindIdx = KINDS.findIndex((k) => k.id === base.kind);
  const palIdx = PALETTES.findIndex((p) => p.id === base.palette.id);
  const patIdx = PATTERNS.indexOf(base.pattern);
  const chIdx = CHARMS.indexOf(base.charm);
  const auIdx = AURAS.indexOf(base.aura);
  const bump = (cur: number, len: number) => (cur + 1 + pickIndex(rng, len - 1)) % len;
  switch (pickIndex(rng, 4)) {
    case 0:
      return tileSpec(composeIndex(kindIdx, bump(palIdx, PALETTES.length), patIdx, chIdx, auIdx));
    case 1:
      return tileSpec(composeIndex(kindIdx, palIdx, bump(patIdx, PATTERNS.length), chIdx, auIdx));
    case 2:
      return tileSpec(composeIndex(kindIdx, palIdx, patIdx, bump(chIdx, CHARMS.length), auIdx));
    default:
      return tileSpec(composeIndex(kindIdx, palIdx, patIdx, chIdx, bump(auIdx, AURAS.length)));
  }
}

function AuraArt({ type, palette }: { type: TileAura; palette: TilePalette }) {
  switch (type) {
    case "none":
      return null;
    case "halo":
      return <circle cx={32} cy={34} r={27} fill={palette.light} opacity={0.4} />;
    case "sparkle":
      return (
        <g fill="#d19e34" opacity={0.85}>
          <path d="M10 12 l1 2.3 2.3 1 -2.3 1 -1 2.3 -1 -2.3 -2.3 -1 2.3 -1 Z" />
          <path d="M55 20 l.8 1.9 1.9 .8 -1.9 .8 -.8 1.9 -.8 -1.9 -1.9 -.8 1.9 -.8 Z" />
          <path d="M9 50 l.8 1.9 1.9 .8 -1.9 .8 -.8 1.9 -.8 -1.9 -1.9 -.8 1.9 -.8 Z" />
        </g>
      );
    case "dunes":
      return (
        <g fill={palette.light} opacity={0.55}>
          <path d="M1 63 q15 -11 32 0 Z" />
          <path d="M31 63 q17 -13 32 0 Z" />
        </g>
      );
  }
}

function CharmArt({ type }: { type: TileCharm }) {
  switch (type) {
    case "none":
      return null;
    case "sun":
      return (
        <g stroke="#d19e34" strokeWidth={1.2} strokeLinecap="round">
          <circle cx={52} cy={11} r={2.4} fill="#d19e34" stroke="none" />
          <path d="M52 7 v-1.5 M52 15 v1.5 M48 11 h-1.5 M56 11 h1.5 M49.2 8.2 l-1 -1 M54.8 13.8 l1 1 M54.8 8.2 l1 -1 M49.2 13.8 l-1 1" fill="none" />
        </g>
      );
    case "star":
      return <path d="M52 5.5 l1.3 3 3 1.2 -3 1.2 -1.3 3 -1.3 -3 -3 -1.2 3 -1.2 Z" fill="#f0e3c6" stroke="#8a6215" strokeWidth={0.8} strokeLinejoin="round" />;
    case "bell":
      return (
        <g>
          <path d="M48.8 13 q0 -5.5 3.2 -5.5 q3.2 0 3.2 5.5 q1 .7 1 1.2 h-8.4 q0 -.5 1 -1.2 Z" fill="#f0e3c6" stroke="#8a6215" strokeWidth={0.9} strokeLinejoin="round" />
          <circle cx={52} cy={15.4} r={1} fill="#8a6215" />
        </g>
      );
    case "sprig":
      return (
        <g stroke="#41543b" strokeWidth={1.1} strokeLinecap="round">
          <path d="M52 16 v-7.5" fill="none" />
          <path d="M52 11.5 q-3.2 -.5 -3.7 -3.2 q3.2 .5 3.7 3.2 Z" fill="#7d9271" strokeWidth={0.8} />
          <path d="M52 14 q3.2 -.5 3.7 -3.2 q-3.2 .5 -3.7 3.2 Z" fill="#7d9271" strokeWidth={0.8} />
        </g>
      );
    case "feather":
      return (
        <g>
          <path d="M52 16 q-3.6 -3.6 0 -8.6 q3.6 5 0 8.6 Z" fill="#cfe4e0" stroke="#2f6b64" strokeWidth={0.9} strokeLinejoin="round" />
          <path d="M52 15 v-6.5" fill="none" stroke="#2f6b64" strokeWidth={0.9} strokeLinecap="round" />
        </g>
      );
    case "moon":
      return <path d="M54.3 6.6 a4.3 4.3 0 1 0 .01 7.8 a5.2 5.2 0 0 1 -.01 -7.8 Z" fill="#efe8d4" stroke="#454e69" strokeWidth={0.8} />;
  }
}

function PatternMarks({
  pattern,
  spots,
  dark,
}: {
  pattern: TilePattern;
  spots: [number, number][];
  dark: string;
}) {
  if (pattern === "plain") return null;
  if (pattern === "spotted") {
    return (
      <g fill={dark} opacity={0.4}>
        {spots.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={2} />
        ))}
      </g>
    );
  }
  return (
    <g stroke={dark} opacity={0.45} strokeWidth={1.6} strokeLinecap="round" fill="none">
      {spots.map(([x, y], i) => (
        <path key={i} d={`M ${x - 4} ${y} q 4 3 8 0`} />
      ))}
    </g>
  );
}

export function TileArt({ tile, className = "h-full w-full" }: { tile: TileSpec; className?: string }) {
  const kind = KIND_INDEX[tile.kind];
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <AuraArt type={tile.aura} palette={tile.palette} />
      {kind.draw(tile.palette)}
      <PatternMarks pattern={tile.pattern} spots={kind.spots} dark={tile.palette.dark} />
      <CharmArt type={tile.charm} />
    </svg>
  );
}
