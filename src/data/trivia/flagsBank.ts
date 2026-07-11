/**
 * Flags topic — deliberately text-based (no emoji flags: Windows renders
 * them as bare letter pairs, which looks broken AND spells out the country
 * code). Questions describe colours, symbols and layouts instead, built on
 * FLAG_COLOURS plus an authored table of distinctive flag features.
 */

import { FLAG_COLOURS } from "../flagColours";
import { CAPITALS } from "./legacyFacts";
import { countryTier } from "./countriesBank";
import { Bank, TIER_TARGETS } from "./build";
import type { Tier, TriviaQuestion } from "./types";

/** [country, distinctive feature on its flag, tier] — phrasing never names the country */
const FEATURES: [string, string, Tier][] = [
  ["Canada","a single red maple leaf",0],
  ["Japan","a plain red disc on white",0],
  ["United States","fifty stars and thirteen stripes",0],
  ["United Kingdom","the overlapping red and white crosses of the Union Jack",0],
  ["Brazil","a starry blue globe wrapped in a banner reading “Ordem e Progresso”",0],
  ["China","one large gold star arced by four smaller ones",0],
  ["Türkiye","a white star and crescent on red",0],
  ["India","a navy 24-spoke wheel at the centre",0],
  ["Mexico","an eagle devouring a snake while perched on a cactus",0],
  ["Australia","the Southern Cross beside a large seven-pointed star",0],
  ["South Korea","a red-and-blue yin-yang circle among black trigrams",0],
  ["Israel","a blue six-pointed star between two blue bands",0],
  ["Switzerland","a bold white cross on a square red field",0],
  ["Greece","nine blue-and-white stripes with a cross in the corner",0],
  ["South Africa","a sideways six-colour Y shape",0],
  ["Spain","a coat of arms with two crowned pillars beside red and gold bands",0],
  ["Portugal","an armillary sphere behind a shield",0],
  ["Argentina","a golden sun with a face between sky-blue bands",0],
  ["Vietnam","a lone gold star centred on bright red",0],
  ["Saudi Arabia","an Arabic inscription above a horizontal sword",0],
  ["Egypt","a golden eagle at the centre of three bands",1],
  ["Lebanon","a green cedar tree",1],
  ["Albania","a black double-headed eagle on deep red",1],
  ["Nepal","two stacked triangular pennants — the only non-rectangular national flag",1],
  ["Cyprus","a copper-coloured outline of the island above olive branches",1],
  ["Kenya","a Maasai shield crossed by two spears",1],
  ["Bhutan","a white dragon clutching jewels",1],
  ["Sri Lanka","a gold lion holding a sword",1],
  ["Cambodia","the towers of Angkor Wat",1],
  ["Mongolia","the golden Soyombo symbol beside blue and red bands",1],
  ["Uganda","a grey crowned crane in a white disc",1],
  ["Zimbabwe","a carved stone bird on a red star",1],
  ["Barbados","a black trident head between blue bands",1],
  ["Jamaica","a gold diagonal cross over green and black",1],
  ["Malaysia","a crescent with a fourteen-point star above red and white stripes",1],
  ["Singapore","a white crescent and five small stars on red over white",1],
  ["Pakistan","a white crescent and star on deep green with a white hoist stripe",1],
  ["Bangladesh","a red disc riding on a field of green",1],
  ["Chile","one white star in a blue canton over white and red bands",1],
  ["Cuba","a lone white star inside a red triangle over striped bands",1],
  ["Panama","four quarters holding one red and one blue star",1],
  ["Uruguay","a golden Sun of May with a face in the corner of nine stripes",1],
  ["Croatia","a red-and-white checkerboard shield",1],
  ["Serbia","a white double-headed eagle beneath a crown",1],
  ["North Korea","a red star in a white circle beside broad red and blue bands",1],
  ["Angola","half a cog wheel crossed by a machete",1],
  ["Mozambique","an AK-47 rifle crossed with a hoe over an open book",1],
  ["Ethiopia","a gold star radiating on a blue disc",1],
  ["Ghana","a lone black star on gold between red and green",1],
  ["Morocco","a green interlaced pentagram on red",1],
  ["Tunisia","a red crescent and star inside a white circle",1],
  ["Algeria","a red crescent and star straddling green and white halves",1],
  ["Kiribati","a golden frigatebird flying over a rising sun and waves",2],
  ["Papua New Guinea","a golden bird-of-paradise opposite the Southern Cross",2],
  ["Fiji","a shield with a British lion and the Union Jack on light blue",2],
  ["Vanuatu","a curled boar's tusk enclosing crossed fern fronds",2],
  ["Palau","a golden full moon just off-centre on light blue",2],
  ["Nauru","a single white star beneath a thin gold stripe",2],
  ["Marshall Islands","two rising diagonal rays and a 24-point star",2],
  ["Belize","two woodcutters flanking a mahogany tree — more colours than any other flag",2],
  ["Nicaragua","a rainbow-arched triangle emblem between two blue bands",2],
  ["Dominica","a Sisserou parrot inside a red disc",2],
  ["Grenada","a nutmeg pod tucked into a red-and-green field",2],
  ["Moldova","an aurochs head on a shield held by an eagle",2],
  ["Kosovo","a gold map of the country beneath six white stars",2],
  ["Bosnia and Herzegovina","a yellow triangle edged by a line of white stars",2],
  ["Kazakhstan","a golden steppe eagle flying beneath a radiant sun",2],
  ["Kyrgyzstan","a sun with forty rays crossed by the crown of a yurt",2],
  ["Turkmenistan","a vertical carpet-pattern stripe of five medallions",2],
  ["Uzbekistan","a crescent beside twelve white stars",2],
  ["Tajikistan","a golden crown beneath an arc of seven stars",2],
  ["Georgia","one large red cross with four smaller crosses",2],
  ["Malta","the George Cross in the upper corner of white and red halves",2],
  ["San Marino","two towers topped with ostrich feathers under a crown",2],
  ["Seychelles","five oblique rays fanning out from one corner",2],
  ["Comoros","a crescent and four stars over four horizontal bands",2],
  ["Djibouti","a red star in a white triangle between light blue and green",2],
  ["Eritrea","a gold olive branch wreath inside a red triangle",2],
  ["Somalia","a lone white star on light blue",2],
  ["Niger","an orange disc resting on a white band",2],
  ["Cameroon","a single gold star centred on a red band",2],
  ["Senegal","a green five-pointed star on a gold band",2],
  ["Guinea-Bissau","a black star on a red vertical band",2],
  ["Togo","a white star in a red canton over five alternating stripes",2],
  ["Liberia","a single white star with red and white stripes, echoing the US flag",2],
  ["Lesotho","a black mokorotlo straw hat",2],
  ["Namibia","a golden sun beside a red diagonal band",2],
  ["Zambia","an orange eagle flying above three vertical stripes",2],
  ["Malawi","a rising red sun over black, red and green",2],
  ["Rwanda","a golden sun in the corner of a sky-blue band",2],
  ["Burundi","three red-and-green stars inside a white saltire",2],
  ["South Sudan","a gold star inside a blue triangle beside a black-red-green field",2],
  ["Democratic Republic of the Congo","a red diagonal stripe and a yellow star on sky blue",2],
  ["Tanzania","a black diagonal band edged in gold across green and blue",2],
  ["Mauritius","four plain horizontal bands — red, blue, yellow and green",2],
  ["Cape Verde","a circle of ten gold stars over a striped field",2],
  ["São Tomé and Príncipe","two black stars on a gold band",2],
  ["Dominican Republic","a white cross with a Bible at its centre — the only flag with one",2],
  ["Trinidad and Tobago","a black diagonal band edged in white on red",2],
  ["Bahamas","a black triangle pointing into aquamarine and gold bands",2],
  ["Guyana","a golden arrowhead spanning the whole flag",2],
  ["Suriname","a large gold star on a red band between green and white",2],
  ["Paraguay","different emblems on its front and back — unique among nations",2],
  ["Ecuador","a condor spreading its wings atop the coat of arms",2],
  ["Venezuela","an arc of eight white stars across a blue band",2],
  ["Honduras","five blue stars arranged in an X between two blue bands",2],
  ["Guatemala","a resplendent quetzal perched on a scroll",2],
  ["Belarus","a red folk-pattern stripe along the hoist",2],
  ["Latvia","a deep maroon field split by a narrow white stripe",2],
  ["Finland","a blue Nordic cross on white",1],
  ["Sweden","a yellow Nordic cross on blue",0],
  ["Norway","a blue cross outlined in white on red",1],
  ["Denmark","a white Nordic cross on red — the oldest national flag still in use",1],
  ["Iceland","a red cross outlined in white on deep blue",1],
];

/** base colour tokens for inclusion questions */
const BASE_COLOURS = ["red", "blue", "green", "white", "black", "gold", "yellow", "orange"];

const fmtColours = (list: string[]): string =>
  list.length === 1 ? list[0]
  : list.slice(0, -1).join(", ") + " and " + list[list.length - 1];

export function buildFlags(): TriviaQuestion[] {
  const bank = new Bank("Flags", 17760704);

  const continentOf = new Map<string, string>(CAPITALS.map(([c, , k]) => [c, k]));
  const countries = Object.keys(FLAG_COLOURS).filter((c) => continentOf.has(c));
  const hasColour = (country: string, colour: string) =>
    (FLAG_COLOURS[country] ?? []).some((entry) => entry.includes(colour)) ||
    (colour === "gold" && (FLAG_COLOURS[country] ?? []).some((e) => e.includes("yellow"))) ||
    (colour === "yellow" && (FLAG_COLOURS[country] ?? []).some((e) => e.includes("gold")));
  const colourKey = (country: string) => [...(FLAG_COLOURS[country] ?? [])].sort().join("|");
  const sameContinent = (country: string) =>
    countries.filter((c) => c !== country && continentOf.get(c) === continentOf.get(country));
  const contHint = (c: string) => {
    const k = continentOf.get(c);
    return k ? `The country is in ${k}.` : undefined;
  };

  /* ---- distinctive features, both directions --------------------------- */
  for (const [country, feature, t] of FEATURES) {
    const wrongs = bank.pickN(sameContinent(country), 3);
    if (wrongs.length === 3) {
      bank.push(t, `Which country's flag shows ${feature}?`, country, wrongs, contHint(country));
    }
    const wrongFeatures = bank.pickN(FEATURES, 6, (f) => f[0] !== country).map((f) => f[1]);
    bank.push(t, `What appears on the flag of ${country}?`, feature,
      [...new Set(wrongFeatures)].slice(0, 3), contHint(country) ?? undefined);
  }

  /* ---- colour sets ------------------------------------------------------ */
  for (const country of countries) {
    const palette = FLAG_COLOURS[country];
    const t = countryTier(country);
    const wrongs = bank.pickN(countries, 10,
      (c) => c !== country && colourKey(c) !== colourKey(country));
    const wrongCombos = [...new Set(wrongs.map((c) => fmtColours(FLAG_COLOURS[c])))]
      .filter((combo) => combo !== fmtColours(palette)).slice(0, 3);
    bank.push(t, `Which of these are the main colours of ${country}'s flag?`,
      fmtColours(palette), wrongCombos, contHint(country));
  }

  /* ---- combinatorial fills per tier -------------------------------------- */
  for (const t of [0, 1, 2] as Tier[]) {
    const target = TIER_TARGETS[t];
    const pool = countries.filter((c) => (t === 0 ? countryTier(c) === 0 : countryTier(c) <= t));

    // colour inclusion
    bank.fill(t, Math.floor(target * 0.4), () => {
      const colour = bank.one(BASE_COLOURS);
      const withC = pool.filter((c) => hasColour(c, colour));
      const withoutC = countries.filter((c) => !hasColour(c, colour) && (countryTier(c) <= t || t === 2));
      if (!withC.length || withoutC.length < 3) return;
      const correct = bank.one(withC);
      bank.push(t, `Which of these countries has ${colour} in its flag?`, correct,
        bank.pickN(withoutC, 3), contHint(correct),
        `${correct}'s flag flies ${fmtColours(FLAG_COLOURS[correct])}.`);
    });

    // two-colour flags
    bank.fill(t, Math.floor(target * 0.55), () => {
      const twos = pool.filter((c) => FLAG_COLOURS[c].length === 2);
      const manys = countries.filter((c) => FLAG_COLOURS[c].length >= 3 && (countryTier(c) <= t || t === 2));
      if (!twos.length || manys.length < 3) return;
      const correct = bank.one(twos);
      bank.push(t, "Which of these flags uses just two main colours?", correct,
        bank.pickN(manys, 3), contHint(correct),
        `${correct}'s flag keeps to ${fmtColours(FLAG_COLOURS[correct])}.`);
    });

    // feature re-asks with fresh line-ups
    const feats = FEATURES.filter((f) => (t === 0 ? f[2] === 0 : f[2] <= t));
    bank.fill(t, Math.floor(target * 0.8), () => {
      const [country, feature] = bank.one(feats);
      const wrongs = bank.pickN(countries, 6, (c) => c !== country);
      bank.push(t, `Which country's flag shows ${feature}?`, country,
        wrongs.slice(0, 3), contHint(country));
    });

    // colour-set re-asks (catch-all, fresh wrong combos each time)
    bank.fill(t, target, () => {
      const country = bank.one(pool);
      const palette = fmtColours(FLAG_COLOURS[country]);
      const wrongs = bank.pickN(countries, 8, (c) => c !== country && colourKey(c) !== colourKey(country));
      const combos = [...new Set(wrongs.map((c) => fmtColours(FLAG_COLOURS[c])))]
        .filter((combo) => combo !== palette).slice(0, 3);
      bank.push(t, `Which of these are the main colours of ${country}'s flag?`, palette, combos,
        contHint(country));
    });
  }

  return bank.qs;
}
