/**
 * Geography topic — where places are, what they are, and how they compare:
 * cities/islands/states/landmarks → country, feature identification
 * (river vs lake vs mountains), and lat/lon/population comparisons.
 * Built on the ~1,100-row gazetteer that powers the flagship map games.
 */

import { COUNTRY_ROWS, PLACE_ROWS, type PlaceRow } from "../gazetteer";
import { CAPITALS } from "./legacyFacts";
import { Bank, TIER_TARGETS } from "./build";
import type { Tier, TriviaQuestion } from "./types";

/** shared islands / regions that span borders make bad single-answer questions */
const AMBIGUOUS = new Set(["Borneo", "New Guinea", "Ireland", "Hispaniola", "Timor", "Tierra del Fuego"]);

const KIND_LABEL: Record<string, string> = {
  c: "city", i: "island", s: "state or province", re: "region",
  ri: "river", la: "lake", mt: "mountain range", lm: "landmark",
};

export function buildGeography(): TriviaQuestion[] {
  const bank = new Bank("Geography", 19140628);

  const continentOf = new Map<string, string>(CAPITALS.map(([c, , k]) => [c, k]));
  for (const r of COUNTRY_ROWS) if (!continentOf.has(r[0])) continentOf.set(r[0], r[1]);

  const nameCount = new Map<string, number>();
  for (const p of PLACE_ROWS) nameCount.set(p[0], (nameCount.get(p[0]) ?? 0) + 1);
  const askable = PLACE_ROWS.filter(
    (p) => nameCount.get(p[0]) === 1 && !AMBIGUOUS.has(p[0]) && continentOf.has(p[1]),
  );

  /** city fame from population; other kinds lean on their country's continent visibility */
  const placeTier = (p: PlaceRow): Tier => {
    if (p[7] === "c") return p[4] >= 8 ? 0 : p[4] >= 1.5 ? 1 : 2;
    const famousCountry = ["Europe", "North America"].includes(continentOf.get(p[1]) ?? "");
    return p[4] >= 4 ? 0 : famousCountry ? 1 : 2;
  };

  const cities = askable.filter((p) => p[7] === "c");
  const countriesOf = (cont: string) => [...continentOf.entries()].filter(([, k]) => k === cont).map(([c]) => c);

  /* ---- place → country, all kinds ------------------------------------ */
  for (const p of askable) {
    const [name, country, , , , , , kind] = p;
    const continent = continentOf.get(country)!;
    const wrongs = bank.pickN(countriesOf(continent), 3, (c) => c !== country);
    if (wrongs.length < 3) continue;
    const label = KIND_LABEL[kind] ?? "place";
    const q =
      kind === "c" ? `Which country is the city of ${name} in?`
      : kind === "i" ? `The island of ${name} belongs to which country?`
      : kind === "s" ? `${name} is a state or province of which country?`
      : kind === "lm" ? `The landmark ${name} is in which country?`
      : `Which country is the ${label} of ${name} mainly in?`;
    // rivers/lakes/ranges often cross borders — only ask when the gazetteer
    // pins them to one country
    if (["ri", "la", "mt", "re"].includes(kind) && nameCount.get(name)! > 1) continue;
    bank.push(placeTier(p), q, country, wrongs, `Somewhere in ${continent}.`);
  }

  /* ---- what kind of thing is X? --------------------------------------- */
  const featureKinds = ["ri", "la", "mt", "i"];
  for (const p of askable.filter((x) => featureKinds.includes(x[7]))) {
    const correct = KIND_LABEL[p[7]];
    const wrongs = featureKinds.filter((k) => k !== p[7]).map((k) => KIND_LABEL[k]);
    bank.push(placeTier(p), `What kind of feature is ${p[0]}?`, correct, wrongs,
      `You'd find it in ${p[1]}.`, `${p[0]} is a ${correct} in ${p[1]}.`);
  }

  /* ---- combinatorial fills per tier ------------------------------------ */
  const latGap: [number, number, number] = [18, 8, 3.5];
  const lonGap: [number, number, number] = [30, 14, 6];
  const popGap: [number, number, number] = [7, 2.5, 0.8];

  for (const t of [0, 1, 2] as Tier[]) {
    const target = TIER_TARGETS[t];
    const cityPool = cities.filter((p) => (t === 0 ? placeTier(p) === 0 : placeTier(p) <= t));
    // keep lon comparisons away from the antimeridian so "further east" stays intuitive
    const lonPool = cityPool.filter((p) => Math.abs(p[3]) <= 150);

    bank.fillSuperlative(t, Math.floor(target * 0.18), cityPool, (p) => p[2], latGap[t], true,
      (_four, best) => ({
        q: "Which of these cities lies furthest north?",
        label: (p) => p[0],
        note: `${best[0]} sits near ${Math.abs(best[2]).toFixed(0)}°${best[2] >= 0 ? "N" : "S"}.`,
      }));
    bank.fillSuperlative(t, Math.floor(target * 0.36), cityPool, (p) => p[2], latGap[t], false,
      (_four, best) => ({
        q: "Which of these cities lies furthest south?",
        label: (p) => p[0],
        note: `${best[0]} sits near ${Math.abs(best[2]).toFixed(0)}°${best[2] >= 0 ? "N" : "S"}.`,
      }));
    bank.fillSuperlative(t, Math.floor(target * 0.46), lonPool, (p) => p[3], lonGap[t], true,
      (_four, _best) => ({ q: "Which of these cities lies furthest east?", label: (p) => p[0] }));
    bank.fillSuperlative(t, Math.floor(target * 0.56), lonPool, (p) => p[3], lonGap[t], false,
      (_four, _best) => ({ q: "Which of these cities lies furthest west?", label: (p) => p[0] }));
    bank.fillSuperlative(t, Math.floor(target * 0.68), cityPool, (p) => p[4], popGap[t], true,
      (_four, best) => ({
        q: "Which of these cities has the largest population?",
        label: (p) => p[0],
        note: `${best[0]} is home to roughly ${best[4] >= 10 ? Math.round(best[4]) : best[4]} million people.`,
      }));

    // which of these cities is in X? (fresh line-ups, huge space)
    bank.fill(t, Math.floor(target * 0.84), () => {
      const targetCity = bank.one(cityPool);
      const country = targetCity[1];
      const continent = continentOf.get(country)!;
      const wrongs = bank.pickN(cities, 3, (c) => c[1] !== country && continentOf.get(c[1]) === continent);
      if (wrongs.length < 3) return;
      bank.push(t, `Which of these cities is in ${country}?`, targetCity[0],
        wrongs.map((c) => c[0]), undefined, `${targetCity[0]} is in ${country}.`);
    });

    // place → country re-asks with fresh line-ups (catch-all)
    const placePool = askable.filter((p) => (t === 0 ? placeTier(p) === 0 : placeTier(p) <= t));
    bank.fill(t, target, () => {
      const p = bank.one(placePool);
      const continent = continentOf.get(p[1])!;
      const wrongs = bank.pickN(countriesOf(continent), 6, (c) => c !== p[1]);
      if (wrongs.length < 3) return;
      const label = KIND_LABEL[p[7]] ?? "place";
      bank.push(t, `In which country would you find the ${label} of ${p[0]}?`, p[1],
        wrongs.slice(0, 3), `Somewhere in ${continent}.`);
    });
  }

  return bank.qs;
}
