import { Link } from "react-router-dom";
import { BlurReveal } from "../components/motion";
import { useSettings } from "../context/SettingsContext";
import { DragonArt, PrincessArt } from "../components/PageCharacters";
import { RabbitArt } from "../components/RabbitGuide";
import { MomoArt } from "../components/MaMomo";
import { Worm } from "../components/AndrewGlowbug";
import { Knight, OldMage } from "../components/KnightVigil";
import { CatArt } from "../components/ArcadeCat";
import { WizardArt } from "../components/ScrollWizard";

/**
 * The Cast page: a reference sheet for every character who keeps the arcade.
 * Each sheet shows the character's real art (large and still), where they
 * live on the Lore map, what they watch over, and the colours they're drawn
 * in. The art here is the very same art the live components render — no
 * copies — so a change to a character shows up on their sheet too.
 */

/** A little glowing drift, standing in for the site-wide (canvas) glow worms. */
function GlowwormsPortrait() {
  const worms: { x: number; y: number; rgb: string; a: number }[] = [
    { x: 40, y: 46, rgb: "224,182,84", a: 220 },
    { x: 92, y: 70, rgb: "138,191,162", a: 160 },
    { x: 66, y: 96, rgb: "108,189,200", a: 30 },
    { x: 104, y: 34, rgb: "245,229,184", a: 200 },
  ];
  return (
    <svg viewBox="0 0 140 130" className="h-full w-full overflow-visible" aria-hidden>
      <defs>
        {worms.map((w, i) => (
          <radialGradient key={i} id={`gw-${i}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={`rgba(${w.rgb},0.95)`} />
            <stop offset="40%" stopColor={`rgba(${w.rgb},0.35)`} />
            <stop offset="100%" stopColor={`rgba(${w.rgb},0)`} />
          </radialGradient>
        ))}
      </defs>
      {worms.map((w, i) => {
        const rad = (w.a * Math.PI) / 180;
        return (
          <g key={i}>
            {/* fading tail */}
            {[0, 1, 2, 3, 4].map((t) => {
              const d = (t + 1) * 6;
              const tx = w.x - Math.cos(rad) * d;
              const ty = w.y - Math.sin(rad) * d;
              return (
                <circle
                  key={t}
                  cx={tx}
                  cy={ty}
                  r={2.2 * (1 - t / 6)}
                  fill={`rgba(${w.rgb},${0.5 * (1 - t / 5)})`}
                />
              );
            })}
            {/* halo + core */}
            <circle cx={w.x} cy={w.y} r={20} fill={`url(#gw-${i})`} />
            <circle cx={w.x} cy={w.y} r={2.4} fill={`rgba(${w.rgb},0.95)`} />
          </g>
        );
      })}
    </svg>
  );
}

type Character = {
  key: string;
  name: string;
  role: string;
  home: string;
  blurb: string;
  palette: string[]; // hex ("#..") or tailwind bg-* class
  darkPlate?: boolean;
  art: React.ReactNode;
};

/** One colour chip: a hex value paints inline, anything else is a bg-* class. */
function Swatch({ c }: { c: string }) {
  const isHex = c.startsWith("#");
  return (
    <span
      className={`h-4 w-4 rounded-full ring-1 ring-black/10 dark:ring-white/10 ${isHex ? "" : c}`}
      style={isHex ? { backgroundColor: c } : undefined}
      title={c}
      aria-hidden
    />
  );
}

function Sheet({ c }: { c: Character }) {
  return (
    <article className="qa-card grain flex flex-col overflow-hidden rounded-3xl">
      <div
        className={`flex h-48 items-center justify-center border-b border-[var(--line)] ${
          c.darkPlate ? "bg-pine-900" : "bg-sand-100 dark:bg-pine-900/60"
        }`}
      >
        <div className="h-40 w-40">{c.art}</div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <p className="qa-fleuron text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-gold-600 dark:text-gold-300">
          {c.role}
        </p>
        <h2 className="font-display text-2xl font-semibold leading-tight">{c.name}</h2>
        <p className="font-display text-sm italic text-teal-700 dark:text-teal-300">{c.home}</p>
        <p className="mt-1 text-sm leading-relaxed text-[var(--ink)]/80">{c.blurb}</p>
        <div className="mt-auto flex gap-1.5 pt-3">
          {c.palette.map((p) => (
            <Swatch key={p} c={p} />
          ))}
        </div>
      </div>
    </article>
  );
}

export function CastPage() {
  const { motionOK } = useSettings();

  const cast: Character[] = [
    {
      key: "knight",
      name: "The Knight",
      role: "Vigil · Home",
      home: "the watchfire",
      blurb:
        "The home page's eternal vigil. She keeps her hour on her own slow schedule — walking the marches, sharpening her blade, standing watch beneath the moon.",
      palette: ["bg-teal-700", "bg-gold-500", "bg-clay-500", "#d8dde4", "#e7b194"],
      art: <Knight activity="guard" seated={false} motionOK={motionOK} />,
    },
    {
      key: "mage",
      name: "The Old Mage",
      role: "Rival · Home",
      home: "the far marches",
      blurb:
        "He appears only for the duel, staff raised and eyes sharp, and gives as good as he gets — bolt for parry, hour after quiet hour.",
      palette: ["bg-pine-700", "bg-gold-500", "bg-clay-400", "#f7f1e0"],
      art: <OldMage motionOK={motionOK} />,
    },
    {
      key: "dragon",
      name: "Games Dragon",
      role: "Guardian · Games",
      home: "the roost",
      blurb:
        "A stubby verdigris dragon who guards the hall of games — puffing little flames, flapping stubby wings, and blinking at every passer-by.",
      palette: ["bg-sage-500", "bg-sage-700", "bg-gold-400", "bg-clay-300"],
      art: <DragonArt />,
    },
    {
      key: "princess",
      name: "Stats Princess",
      role: "Keeper · Stats",
      home: "the ledger keep",
      blurb:
        "Keeper of the ledger. She waves from the margin of the stats page, crown a little askew and scroll in hand, and never drops a tally.",
      palette: ["bg-clay-400", "bg-gold-500", "bg-teal-400", "#e7b194"],
      art: <PrincessArt />,
    },
    {
      key: "rabbit",
      name: "Rabbit Guide",
      role: "Companion · Map Drop",
      home: "the burrow",
      blurb:
        "Map Drop's pocket detective. Ears up, magnifying glass out — she celebrates a bullseye and topples clean over at a wild miss.",
      palette: ["#e9dcc3", "#f6efdd", "#d9a8a0", "#3a2c22"],
      art: <RabbitArt mood="investigating" />,
    },
    {
      key: "momo",
      name: "Ma Momo",
      role: "Guardian · Pattern Groups",
      home: "the schoolroom",
      blurb:
        "Pattern Groups' guardian chipmunk: black glasses, a ruler she is not afraid to tap, and a heart of gold underneath. Poking her is inadvisable.",
      palette: ["#c98a52", "#6f4526", "#f2e2c8", "#dd9d92", "#1f1f1f"],
      art: <MomoArt mood="watch" />,
    },
    {
      key: "andrew",
      name: "Andrew Glowbug",
      role: "Guardian · Trivia",
      home: "the trivia vault",
      blurb:
        "Guardian of the vault: a luminous glowworm of impeccable breeding — tuxedo, spectacles, top hat and cane — who meets every wrong answer with a politely devastating remark.",
      palette: ["#9fd08a", "#2b2b33", "#b78325", "#f4efe2"],
      art: <Worm mood="calm" />,
    },
    {
      key: "cat",
      name: "The Arcade Cat",
      role: "Resident · Everywhere",
      home: "the sunning stone",
      blurb:
        "The arcade's resident cat, roaming the bottom of every page on a mind of her own — naps, zoomies, wool and butterflies, and the odd vanishing act. Pet her.",
      palette: ["#d98a66", "#ae4d2c", "#f7f1e0", "#1b1824"],
      art: (
        <svg viewBox="0 0 90 70" className="h-full w-full overflow-visible">
          <CatArt pose="sit" />
        </svg>
      ),
    },
    {
      key: "wizard",
      name: "Scroll Wizard",
      role: "Caster · Home",
      home: "the west tower",
      blurb:
        "A small old wizard perched below the nav, staff raised in a casting pose. His spell hangs in the air and sinks down the page in step with how far you scroll.",
      palette: ["bg-teal-700", "bg-pine-700", "bg-gold-400", "#e7b194"],
      art: <WizardArt />,
    },
    {
      key: "glowworms",
      name: "Glow Worms",
      role: "Ambient · Dark mode",
      home: "the glowing hollow",
      blurb:
        "A drift of luminous bodies that meander the dark and shy away from the cursor — present on their own episodic schedule, and gone again just as quietly.",
      palette: ["bg-gold-300", "bg-sage-300", "bg-teal-300", "bg-clay-400"],
      darkPlate: true,
      art: <GlowwormsPortrait />,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-6">
      <BlurReveal>
        <p className="qa-fleuron text-xs font-semibold uppercase tracking-[0.32em] text-gold-600 dark:text-gold-300">
          the cast
        </p>
        <h1 className="mt-2 font-display text-4xl font-semibold sm:text-5xl">Meet the Cast</h1>
        <p className="mt-4 max-w-2xl text-[var(--ink)]/80">
          The quiet keepers of Arcanum — the small creatures who guard the doors, keep the
          ledger, and drift through the dark. Each lives somewhere on the{" "}
          <Link to="/lore" className="text-teal-700 underline decoration-dotted underline-offset-4 dark:text-teal-300">
            map
          </Link>
          .
        </p>
      </BlurReveal>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cast.map((c) => (
          <Sheet key={c.key} c={c} />
        ))}
      </div>
    </div>
  );
}
