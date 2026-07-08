import { rngFor, pickIndex } from "./random";
import { FLAG_COLOURS } from "../data/flagColours";
import { COUNTRY_LANGUAGE, LANGUAGE_SENTENCES } from "../data/languageSentences";
import { COUNTRY_FACTS } from "../data/countryFacts";

/**
 * Map Drop easy mode: three hints that identify the country — two flag
 * colours, a sentence overheard in the local language, and a unique fact.
 * Picks are deterministic per round seed, so the daily's easy hints are
 * the same for everyone on a given date.
 */

export type EasyHints = [string, string, string];

/**
 * Which country's data a puzzle should use. Generated country-kind
 * puzzles store the continent in `country`, so when the country field
 * has no data the place's own name is tried (it IS the country then).
 */
export function easyCountryFor(place: { name: string; country: string }): string | null {
  for (const c of [place.country, place.name]) {
    const lang = COUNTRY_LANGUAGE[c];
    if (FLAG_COLOURS[c]?.length >= 2 && COUNTRY_FACTS[c]?.length && lang && LANGUAGE_SENTENCES[lang]?.length) {
      return c;
    }
  }
  return null;
}

/** The round's three easy hints, or null when the country is unmapped. */
export function easyHintsFor(
  place: { name: string; country: string },
  seed: number,
): EasyHints | null {
  const country = easyCountryFor(place);
  if (!country) return null;
  const colours = FLAG_COLOURS[country];
  const sentences = LANGUAGE_SENTENCES[COUNTRY_LANGUAGE[country]];
  const facts = COUNTRY_FACTS[country];
  const rng = rngFor([seed, "easy"]);
  const i = pickIndex(rng, colours.length);
  let j = pickIndex(rng, colours.length - 1);
  if (j >= i) j++;
  const [a, b] = i < j ? [colours[i], colours[j]] : [colours[j], colours[i]];
  return [
    `The flag flies ${a} and ${b}.`,
    `Overheard in the street: “${sentences[pickIndex(rng, sentences.length)]}”`,
    facts[pickIndex(rng, facts.length)],
  ];
}
