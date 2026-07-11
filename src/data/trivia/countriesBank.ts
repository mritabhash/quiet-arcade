/**
 * Countries topic — capitals, continents, currencies, national dishes,
 * iconic-fact identification, borders, and population/climate comparisons.
 * Reuses the gazetteer and the Map Drop country data.
 */

import { COUNTRY_ROWS } from "../gazetteer";
import { ICONIC_FACTS } from "../iconicFacts";
import { CAPITALS, CONTINENTS6, CONTINENT_SKIP, DISHES } from "./legacyFacts";
import { Bank, TIER_TARGETS } from "./build";
import type { Tier, TriviaQuestion } from "./types";

/** countries almost everyone can place, regardless of size */
export const FAMOUS = new Set([
  "United States","United Kingdom","France","Germany","Italy","Spain","Portugal","Netherlands",
  "Belgium","Switzerland","Austria","Sweden","Norway","Denmark","Finland","Iceland","Ireland",
  "Greece","Russia","China","Japan","India","South Korea","Australia","New Zealand","Canada",
  "Mexico","Brazil","Argentina","Egypt","South Africa","Türkiye","Saudi Arabia",
  "United Arab Emirates","Israel","Thailand","Vietnam","Singapore","Cuba","Jamaica","Poland",
  "Ukraine","Czechia","Hungary","Croatia","Indonesia","Philippines","Pakistan","Nigeria",
  "Kenya","Morocco","Colombia","Chile","Peru",
]);

/** [country, currency, tier] — only unambiguous, well-known pairings */
const CURRENCIES: [string, string, Tier][] = [
  ["United States","US dollar",0],["United Kingdom","pound sterling",0],["Japan","yen",0],
  ["China","renminbi (yuan)",0],["India","rupee",0],["Switzerland","Swiss franc",0],
  ["Russia","ruble",0],["Brazil","real",1],["Mexico","Mexican peso",0],["Canada","Canadian dollar",0],
  ["Australia","Australian dollar",0],["South Korea","won",1],["Sweden","krona",1],
  ["Norway","Norwegian krone",1],["Poland","złoty",1],["Czechia","koruna",2],["Hungary","forint",2],
  ["Türkiye","lira",1],["Israel","shekel",1],["Saudi Arabia","riyal",1],
  ["United Arab Emirates","dirham",1],["Egypt","Egyptian pound",1],["South Africa","rand",1],
  ["Nigeria","naira",1],["Kenya","Kenyan shilling",2],["Ethiopia","birr",2],["Ghana","cedi",2],
  ["Thailand","baht",1],["Vietnam","dong",1],["Indonesia","rupiah",1],["Malaysia","ringgit",1],
  ["Philippines","Philippine peso",1],["Singapore","Singapore dollar",1],["Bangladesh","taka",2],
  ["Argentina","Argentine peso",1],["Chile","Chilean peso",2],["Peru","sol",2],
  ["Venezuela","bolívar",2],["Bolivia","boliviano",2],["Paraguay","guaraní",2],
  ["Guatemala","quetzal",2],["Honduras","lempira",2],["Costa Rica","colón",2],
  ["Nicaragua","córdoba",2],["Ukraine","hryvnia",1],["Romania","leu",2],["Bulgaria","lev",2],
  ["Serbia","Serbian dinar",2],["Albania","lek",2],["North Macedonia","denar",2],
  ["Iceland","Icelandic króna",2],["Georgia","lari",2],["Armenia","dram",2],
  ["Azerbaijan","manat",2],["Kazakhstan","tenge",2],["Mongolia","tögrög",2],
  ["Afghanistan","afghani",2],["Sri Lanka","Sri Lankan rupee",2],["Myanmar","kyat",2],
  ["Cambodia","riel",2],["Laos","kip",2],["New Zealand","New Zealand dollar",0],
  ["Botswana","pula",2],["Zambia","kwacha",2],["Tanzania","Tanzanian shilling",2],
  ["Angola","kwanza",2],["Mozambique","metical",2],["Eritrea","nakfa",2],["Tonga","paʻanga",2],
  ["Samoa","tala",2],["Papua New Guinea","kina",2],["Bhutan","ngultrum",2],["Maldives","rufiyaa",2],
];

const EURO_USERS = [
  "France","Germany","Italy","Spain","Portugal","Ireland","Netherlands","Belgium","Austria",
  "Finland","Greece","Slovakia","Slovenia","Estonia","Latvia","Lithuania","Luxembourg","Malta",
  "Cyprus","Croatia",
];

const POP = new Map(COUNTRY_ROWS.map((r) => [r[0], r[5]]));
/** fame tier shared by the Countries and Flags banks */
export const countryTier = (c: string): Tier => (FAMOUS.has(c) ? 0 : (POP.get(c) ?? 0) >= 8 ? 1 : 2);

export function buildCountries(): TriviaQuestion[] {
  const bank = new Bank("Countries", 20260711);

  const continentOf = new Map<string, string>(CAPITALS.map(([c, , k]) => [c, k]));
  for (const r of COUNTRY_ROWS) if (!continentOf.has(r[0])) continentOf.set(r[0], r[1]);
  const capOf = new Map(CAPITALS.map(([c, cap]) => [c, cap]));
  const all = [...continentOf.keys()];
  const byCont = new Map<string, string[]>();
  for (const [c, k] of continentOf) {
    if (!byCont.has(k)) byCont.set(k, []);
    byCont.get(k)!.push(c);
  }
  const tierOf = countryTier;
  const contHint = (c: string) => {
    const k = continentOf.get(c);
    return k ? `Look to ${k}.` : undefined;
  };

  /* ---- capitals, both directions, plus continents ------------------- */
  for (const [country, capital, continent] of CAPITALS) {
    const t = tierOf(country);
    const others = CAPITALS.filter(([c, , k]) => k === continent && c !== country);
    bank.push(t, `What is the capital of ${country}?`, capital,
      bank.pickN(others, 3).map((r) => r[1]), `Look to ${continent}.`);
    bank.push(t, `${capital} is the capital of which country?`, country,
      bank.pickN(others, 3).map((r) => r[0]), `Somewhere in ${continent}.`);
    if (!CONTINENT_SKIP.has(country)) {
      bank.push(t, `Which continent is ${country} in?`, continent,
        bank.pickN(CONTINENTS6, 3, (k) => k !== continent), `Its capital is ${capital}.`);
    }
  }

  /* ---- iconic facts → country --------------------------------------- */
  for (const [country, facts] of Object.entries(ICONIC_FACTS)) {
    const t = tierOf(country);
    const cont = continentOf.get(country);
    for (const f of facts) {
      if (f.toLowerCase().includes(country.toLowerCase())) continue; // giveaway
      const wrongs = bank.pickN(byCont.get(cont ?? "") ?? all, 3, (c) => c !== country);
      bank.push(t, `Which country does this describe? “${f}”`, country, wrongs, contHint(country));
    }
  }

  /* ---- national dishes ----------------------------------------------- */
  for (const [dish, country] of DISHES) {
    const t = tierOf(country);
    const wrongs = bank.pickN(DISHES, 8, (d) => d[1] !== country).map((d) => d[1]);
    bank.push(t, `Which country is ${dish} most associated with?`, country,
      [...new Set(wrongs)].slice(0, 3), contHint(country));
  }

  /* ---- currencies ----------------------------------------------------- */
  for (const [country, cur, t] of CURRENCIES) {
    const wrongs = bank.pickN(CURRENCIES, 8, (r) => r[1] !== cur).map((r) => r[1]);
    bank.push(t, `Which currency is used in ${country}?`, cur, [...new Set(wrongs)].slice(0, 3),
      contHint(country));
  }
  for (const country of EURO_USERS) {
    bank.push(tierOf(country), `Which currency is used in ${country}?`, "euro",
      bank.pickN(CURRENCIES, 3, (r) => r[0] !== country).map((r) => r[1]), contHint(country));
  }

  /* ---- landlocked & borders ------------------------------------------ */
  for (const r of COUNTRY_ROWS) {
    const [name, continent, , , , , , coastal, , borderStr] = r;
    if (coastal === 0) {
      const coastalSame = COUNTRY_ROWS.filter((x) => x[1] === continent && x[7] === 1 && x[0] !== name);
      bank.push(tierOf(name), "Which of these countries is landlocked?", name,
        bank.pickN(coastalSame, 3).map((x) => x[0]), contHint(name), `${name} has no coastline.`);
    }
    const borders = borderStr ? borderStr.split("|") : [];
    if (borders.length) {
      const others = (byCont.get(continent) ?? []).filter((c) => c !== name && !borders.includes(c));
      const correct = bank.one(borders);
      bank.push(tierOf(name), `Which of these countries shares a border with ${name}?`, correct,
        bank.pickN(others, 3), undefined, `${name} borders ${borders.join(", ")}.`);
    }
  }

  /* ---- combinatorial fills per tier ----------------------------------- */
  const rowsForTier = (t: Tier) => COUNTRY_ROWS.filter((r) => tierOf(r[0]) <= t && (t > 0 || tierOf(r[0]) === 0));
  const namesForTier = (t: Tier) => all.filter((c) => (t === 0 ? tierOf(c) === 0 : tierOf(c) <= t));
  const popGap: [number, number, number] = [60, 15, 3];
  const tempGap: [number, number, number] = [11, 6, 3];

  for (const t of [0, 1, 2] as Tier[]) {
    const target = TIER_TARGETS[t];
    const rows = rowsForTier(t);
    const names = namesForTier(t);

    // largest / smallest population
    bank.fillSuperlative(t, Math.floor(target * 0.3), rows, (r) => r[5], popGap[t], true,
      (_four, best) => ({
        q: "Which of these countries has the largest population?",
        label: (r) => r[0],
        note: `${best[0]} has roughly ${best[5] >= 1 ? Math.round(best[5]) : best[5]} million people.`,
      }));
    bank.fillSuperlative(t, Math.floor(target * 0.42), rows, (r) => r[5], popGap[t] / 3, false,
      (_four, _best) => ({
        q: "Which of these countries has the smallest population?",
        label: (r) => r[0],
      }));

    // warmest / coldest
    bank.fillSuperlative(t, Math.floor(target * 0.52), rows, (r) => r[6], tempGap[t], true,
      (_four, best) => ({
        q: "Which of these countries is the warmest on average?",
        label: (r) => r[0],
        note: `Rough annual mean: ${best[0]} ~${best[6]} °C.`,
      }));
    bank.fillSuperlative(t, Math.floor(target * 0.62), rows, (r) => r[6], tempGap[t], false,
      (_four, _best) => ({
        q: "Which of these countries is the coldest on average?",
        label: (r) => r[0],
      }));

    // euro membership
    const euroPool = EURO_USERS.filter((c) => tierOf(c) <= t || t === 2);
    bank.fill(t, Math.floor(target * 0.7), () => {
      const correct = bank.one(euroPool);
      const wrongs = bank.pickN(names, 3, (c) => !EURO_USERS.includes(c) && continentOf.get(c) === "Europe");
      if (wrongs.length < 3) return;
      bank.push(t, "Which of these countries uses the euro?", correct, wrongs, contHint(correct));
    });

    // continent membership
    bank.fill(t, Math.floor(target * 0.82), () => {
      const cont = bank.one(CONTINENTS6);
      const inCont = names.filter((c) => continentOf.get(c) === cont && !CONTINENT_SKIP.has(c));
      const outCont = names.filter((c) => continentOf.get(c) !== cont && !CONTINENT_SKIP.has(c));
      if (!inCont.length || outCont.length < 3) return;
      const correct = bank.one(inCont);
      bank.push(t, `Which of these countries is in ${cont}?`, correct, bank.pickN(outCont, 3),
        capOf.has(correct) ? `Its capital is ${capOf.get(correct)}.` : undefined);
    });

    // borders, re-asked with fresh line-ups
    bank.fill(t, Math.floor(target * 0.9), () => {
      const r = bank.one(rows);
      const borders = r[9] ? r[9].split("|") : [];
      if (!borders.length) return;
      const others = (byCont.get(r[1]) ?? []).filter((c) => c !== r[0] && !borders.includes(c));
      if (others.length < 3) return;
      bank.push(t, `Which of these countries shares a border with ${r[0]}?`, bank.one(borders),
        bank.pickN(others, 3), undefined, `${r[0]} borders ${borders.join(", ")}.`);
    });

    // capital re-asks with fresh line-ups (catch-all, effectively unbounded)
    const capsForTier = CAPITALS.filter(([c]) => (t === 0 ? tierOf(c) === 0 : tierOf(c) <= t));
    bank.fill(t, target, () => {
      const [country, capital, continent] = bank.one(capsForTier);
      const wrongs = bank.pickN(CAPITALS, 6, (r) => r[1] !== capital).map((r) => r[1]);
      bank.push(t, `Which of these cities is the capital of ${country}?`, capital,
        [...new Set(wrongs)].slice(0, 3), `Look to ${continent}.`);
    });
  }

  return bank.qs;
}
