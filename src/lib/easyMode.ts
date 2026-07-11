import { rngFor, pickIndex, shuffled } from "./random";
import { FLAG_COLOURS } from "../data/flagColours";
import { COUNTRY_LANGUAGE, LANGUAGE_SENTENCES } from "../data/languageSentences";
import { COUNTRY_FACTS } from "../data/countryFacts";
import { ICONIC_FACTS } from "../data/iconicFacts";
import { LANGUAGE_HINTS } from "../data/languageHints";

/**
 * Map Drop's country-hint helpers. Moderate mode opens with three hints
 * that identify the country — two flag colours, a sentence overheard in
 * the local language, and a unique fact; easy mode gets famous facts plus
 * an in-language line. Picks are deterministic per round seed, so the
 * daily's hints are the same for everyone on a given date.
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

export interface EasyFreeHint {
  label: string;
  text: string;
}

/**
 * A sentence written in the country's language that says which language it
 * is — recognizing the script or the words is the hint. Never names the
 * country or city. Null when the language is unmapped.
 */
export function languageHintFor(place: { name: string; country: string }): string | null {
  for (const c of [place.country, place.name]) {
    const hint = LANGUAGE_HINTS[COUNTRY_LANGUAGE[c] ?? ""];
    if (hint) return hint;
  }
  return null;
}

/**
 * Easy mode's free clues: famous, average-person facts about the country
 * plus one in-language sentence about the local tongue — never naming the
 * country, never leaning on geography trivia. Falls back to three facts
 * when the language is unmapped; null when the country has no fact entries.
 */
export function easyFreeHintsFor(
  place: { name: string; country: string },
  seed: number,
): [EasyFreeHint, EasyFreeHint, EasyFreeHint] | null {
  const country = [place.country, place.name].find(
    (c) => (ICONIC_FACTS[c]?.length ?? 0) + (COUNTRY_FACTS[c]?.length ?? 0) >= 3,
  );
  if (!country) return null;
  // skip the language line when the language's name contains the answer
  // (e.g. a country-kind puzzle in "bahasa Indonesia") — a fact fills in
  const raw = languageHintFor(place);
  const lang =
    raw &&
    ![place.country, place.name].some((c) => raw.toLowerCase().includes(c.toLowerCase()))
      ? raw
      : null;
  const need = lang ? 2 : 3;
  const rng = rngFor([seed, "easy-facts"]);
  // iconic pop-culture facts first; the deeper COUNTRY_FACTS as gap-fillers.
  // Facts that name the place sink to the back so a free hint never spells
  // out the answer (a Turkey fact mentioning Istanbul, on the Istanbul round).
  const iconic = shuffled(rng, ICONIC_FACTS[country] ?? []);
  const deep = shuffled(rng, COUNTRY_FACTS[country] ?? []);
  const safe = (f: string) => !f.toLowerCase().includes(place.name.toLowerCase());
  const ordered = [
    ...iconic.filter(safe),
    ...deep.filter(safe),
    ...iconic.filter((f) => !safe(f)),
    ...deep.filter((f) => !safe(f)),
  ];
  const hints = ordered
    .slice(0, need)
    .map((text, i) => ({ label: `Famous fact ${i + 1}`, text }));
  if (lang) hints.push({ label: "In the local tongue", text: lang });
  return hints as [EasyFreeHint, EasyFreeHint, EasyFreeHint];
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
