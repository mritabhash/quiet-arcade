import { COUNTRY_ROWS, PLACE_ROWS } from "./gazetteer";
import { hashSeed } from "../lib/random";
import type { MapDropPuzzle, MapDifficulty } from "./mapDropPuzzles";
import type { TimeCapsulePuzzle } from "./timeCapsulePuzzles";
import type { BorderlinePlace, BorderKind } from "./borderlinePlaces";

/**
 * Generated puzzle tier: expands the compact gazetteer into full puzzle
 * objects at module load, so each flagship game has well over a thousand
 * entries without shipping a thousand hand-written blobs. The curated
 * puzzles stay the premium tier; these keep free play from ever running
 * dry. All output is deterministic — no Math.random.
 */

const KIND_LABEL: Record<string, string> = {
  c: "city", i: "island", s: "state", re: "region",
  ri: "river", la: "lake", mt: "mountains", lm: "landmark",
};

const BORDER_KIND: Record<string, BorderKind> = {
  c: "city", i: "island", s: "state", re: "region",
  ri: "river", la: "lake", mt: "range", lm: "landmark",
};

interface Spot {
  name: string;
  country: string;
  continent: string;
  region: string;
  lat: number;
  lon: number;
  pop: number;
  temp: number;
  coastal: boolean;
  kind: string;
  lang: string;
  borders: string[];
}

/** curated Borderline rows double as metadata + extra answer sources */
export interface CuratedPlace {
  name: string;
  kind: string;
  country: string;
  continent: string;
  region: string;
  lat: number;
  lon: number;
  pop: number;
  temp: number;
  coastal: boolean;
  lang: string;
  borders: string[];
}

const KIND_TO_CODE: Record<string, string> = {
  country: "co", city: "c", island: "i", state: "s", region: "re",
  river: "ri", lake: "la", range: "mt", landmark: "lm",
};

const slug = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Every gazetteer + curated row as a uniform Spot. */
function allSpots(curated: CuratedPlace[]): Spot[] {
  const meta = new Map<string, { continent: string; region: string; lang: string }>();
  for (const c of curated) if (c.kind === "country") meta.set(c.name, c);
  for (const [name, continent, region, , , , , , lang] of COUNTRY_ROWS) {
    if (!meta.has(name)) meta.set(name, { continent, region, lang });
  }

  const spots: Spot[] = [];
  for (const c of curated) {
    spots.push({
      name: c.name, country: c.country, continent: c.continent, region: c.region,
      lat: c.lat, lon: c.lon, pop: c.pop, temp: c.temp, coastal: c.coastal,
      kind: KIND_TO_CODE[c.kind] ?? "re", lang: c.lang, borders: c.borders,
    });
  }
  for (const [name, continent, region, lat, lon, pop, temp, coastal, lang, borders] of COUNTRY_ROWS) {
    spots.push({
      name, country: name, continent, region, lat, lon, pop, temp,
      coastal: coastal === 1, kind: "co", lang,
      borders: borders ? borders.split("|") : [],
    });
  }
  for (const [name, country, lat, lon, pop, temp, coastal, kind] of PLACE_ROWS) {
    const m = meta.get(country);
    spots.push({
      name, country, lat, lon, pop, temp,
      coastal: coastal === 1, kind,
      continent: m?.continent ?? "—",
      region: m?.region ?? country,
      lang: m?.lang ?? "—",
      borders: [],
    });
  }
  return spots;
}

/* ------------------------------------------------------- clue text */

function climateClue(s: Spot): string {
  if (s.temp >= 26) return "Real heat lives here nearly all year round.";
  if (s.temp >= 20) return "Warm days set the rhythm of the calendar.";
  if (s.temp >= 12) return "The seasons trade places gently here.";
  if (s.temp >= 4) return "Winters bite properly; summers repay the debt.";
  return "Cold is the default; warmth is the visitor.";
}

function latitudeClue(s: Spot): string {
  const a = Math.abs(s.lat);
  const south = s.lat < 0 ? " — and midsummer lands in December" : "";
  if (a < 12) return "The equator is practically next door.";
  if (a < 30) return `The tropics are close company here${south}.`;
  if (a < 50) return `This sits in the middle latitudes${south}.`;
  return `You are deep toward one of the poles here${south}.`;
}

function natureClue(s: Spot): string {
  switch (s.kind) {
    case "i": return "You will need a boat or a plane to arrive.";
    case "ri": return "It flows rather than sits — follow the water.";
    case "la": return "It is water, but it goes nowhere in a hurry.";
    case "mt": return "The air thins as you approach it.";
    case "lm": return "People cross the world just to stand at this one spot.";
    case "s": case "re": return "It is a whole stretch of land, not a single dot.";
    case "co": return s.coastal
      ? "This country hears the sea on at least one side."
      : "This country is landlocked — no coast at all.";
    default: return s.coastal
      ? "Salt air is never far from these streets."
      : "There is no coastline for a long way in any direction.";
  }
}

function scaleClue(s: Spot): string {
  if (s.kind === "lm" || s.kind === "ri" || s.kind === "la" || s.kind === "mt") {
    return "Its fame is far larger than its footprint.";
  }
  if (s.pop >= 15) return "Tens of millions of lives overlap here.";
  if (s.pop >= 5) return "Millions of people call this place home.";
  if (s.pop >= 1) return "It is a big place by most standards.";
  if (s.pop >= 0.1) return "Modest in size, stubborn in character.";
  return "Few people live here; the legend outnumbers them.";
}

function cultureClue(s: Spot): string {
  return `Everyday speech here belongs to the ${s.lang} world.`;
}

function regionClue(s: Spot): string {
  return `Locals would file it under ${s.region}.`;
}

function nameClue(s: Spot): string {
  const letters = s.name.replace(/[^A-Za-zÀ-ž]/g, "").length;
  return `The name starts with “${s.name[0]}” and runs ${letters} letters.`;
}

function difficultyFor(s: Spot): MapDifficulty {
  if (s.kind === "lm" || s.pop >= 8) return "Gentle";
  if (s.pop >= 1 || s.kind === "co") return "Medium";
  return "Tricky";
}

/* ------------------------------------------------------ Map Drop */

export function buildMapDrop(
  curated: CuratedPlace[],
  exclude: Set<string>,
): MapDropPuzzle[] {
  const out: MapDropPuzzle[] = [];
  const seen = new Set(exclude);
  for (const s of allSpots(curated)) {
    const key = s.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      id: `g-${slug(s.name)}`,
      name: s.name,
      country: s.kind === "co" ? s.continent : s.country,
      continent: s.continent,
      region: s.region,
      climate: s.temp >= 24 ? "hot" : s.temp >= 15 ? "warm" : s.temp >= 7 ? "temperate" : "cold",
      difficulty: difficultyFor(s),
      lat: s.lat,
      lon: s.lon,
      hints: [
        climateClue(s),
        latitudeClue(s),
        natureClue(s),
        scaleClue(s),
        cultureClue(s),
        regionClue(s),
        nameClue(s),
      ],
      why: `${s.name} — ${KIND_LABEL[s.kind] ?? "country"} filed under ${s.region}.`,
    });
  }
  return out;
}

/* ----------------------------------------------------- Borderline */

export function buildBorderline(curated: CuratedPlace[]): BorderlinePlace[] {
  const seen = new Set(curated.map((c) => c.name.toLowerCase()));
  const out: BorderlinePlace[] = [];
  for (const s of allSpots(curated)) {
    const key = s.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const kind: BorderKind = s.kind === "co" ? "country" : (BORDER_KIND[s.kind] ?? "region");
    out.push({
      id: `g-${slug(s.name)}`,
      name: s.name,
      kind,
      country: s.country,
      continent: s.continent,
      region: s.region,
      lat: s.lat,
      lon: s.lon,
      pop: s.pop,
      temp: s.temp,
      terrain:
        s.kind === "i" ? "island" :
        s.kind === "mt" ? "mountainous" :
        s.kind === "ri" || s.kind === "la" ? "waterway" :
        s.coastal ? "coastal" : Math.abs(s.lat) > 45 ? "northern plains" : "inland",
      coastal: s.coastal,
      lang: s.lang,
      borders: s.borders,
      difficulty: difficultyFor(s),
      note: `${s.name} — ${KIND_LABEL[s.kind] ?? "country"} in ${s.region}.`,
    });
  }
  return out;
}

/* --------------------------------------------------- Time Capsule */

/** [decade, scene fragment, tech clue, street clue] */
const ERAS: [number, string, string, string][] = [
  [1890, "Gas lamps hiss beside brand-new electric wires", "The telephone is a marvel most have never touched", "Horse trams still outnumber motor cars"],
  [1900, "Steam, soot, and optimism hang over the boulevards", "Cinema is a fairground novelty", "The first automobiles frighten the horses"],
  [1910, "Recruiting posters and telegram boys work the streets", "Wireless telegraphy is front-page magic", "Bicycles and boots move the many; motors move the few"],
  [1920, "Jazz spills from a wireless set in a café window", "Radio sets gather families after dark", "Open-top motor cars honk past the last horse carts"],
  [1930, "Queues and grand cinemas share the same street", "Talking pictures have killed the silent screen", "Art Deco façades rise over tram tracks"],
  [1940, "Ration books and radio bulletins set the mood", "News arrives by crackling shortwave", "Buses run half-empty on rationed fuel"],
  [1950, "Chrome fins and soda fountains catch the sun", "Television aerials sprout on every roof", "Motor scooters weave between brand-new sedans"],
  [1960, "Transistor radios and protest placards share the square", "The space race dominates the newsstand", "Miniskirts and mop-tops fill the crosswalks"],
  [1970, "Concrete towers rise over flared trousers", "Colour television glows in shop windows", "Compact hatchbacks queue at fuel pumps"],
  [1980, "Neon, synth-pop, and arcade bleeps colour the night", "Cassette walkmans hang from every belt", "Boxy sedans and boomboxes rule the kerb"],
  [1990, "Dial-up modems screech behind internet-café glass", "Pagers beep; the web is brand new", "Rollerblades and early minivans share the streets"],
  [2000, "Flip phones snap shut outside the multiplex", "MP3 players are replacing CD wallets", "Low-cost airlines fill the departure boards"],
];

export function buildTimeCapsule(
  curated: CuratedPlace[],
  exclude: Set<string>,
): TimeCapsulePuzzle[] {
  const out: TimeCapsulePuzzle[] = [];
  for (const s of allSpots(curated)) {
    if (s.kind !== "c" || s.pop < 0.4) continue;
    for (const [decade, scene, tech, street] of ERAS) {
      const h = hashSeed(`${s.name}:${decade}`);
      if (h % 3 !== 0) continue; // each city keeps ~4 of 12 eras
      const id = `g-${slug(s.name)}-${decade}`;
      if (exclude.has(id)) continue;
      out.push({
        id,
        place: s.name,
        country: s.country,
        region: s.region,
        lat: s.lat,
        lon: s.lon,
        year: decade + (h % 10),
        scene: `${scene}, ${s.coastal ? "down where the harbour keeps the city honest" : "across an inland city that trusts its own weather"}. The signs and shouts carry a ${s.lang} cadence.`,
        clues: [
          tech,
          street,
          climateClue(s),
          `The setting is ${s.region}.`,
          `The city's name begins with “${s.name[0]}”.`,
        ],
        explanation: `${s.name}, ${s.country}, in the ${decade}s — placed by its ${s.lang} streets and ${s.region} setting.`,
        difficulty: s.pop >= 3 ? "Medium" : "Tricky",
      });
    }
  }
  return out;
}
