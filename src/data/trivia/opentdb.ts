/**
 * Live rounds from the Open Trivia Database (https://opentdb.com).
 *
 * This is what makes the three modes actually feel different: OpenTDB serves
 * real, human-written questions at three genuine difficulty levels and across
 * two dozen categories, so Easy / Moderate / Hard finally read as distinct in
 * both difficulty AND kind — the thing the generated vault couldn't give us.
 *
 * The trade-off (chosen deliberately): a round is a live network draw, so it
 * is NOT the same fifteen questions for everyone and needs a connection. The
 * caller falls back to the local vault (drawRound) whenever a fetch fails, so
 * the game still plays offline.
 */

import type { Tier, TriviaMode, TriviaQuestion, TriviaTopic } from "./types";
import type { TopicChoice } from "./index";

const API = "https://opentdb.com/api.php";
const ROUND = 15;

/** mode → OpenTDB difficulty. This is the whole point of the fix. */
const DIFFICULTY: Record<TriviaMode, "easy" | "medium" | "hard"> = {
  easy: "easy",
  moderate: "medium",
  hard: "hard",
};

/** mode → the tier we tag the question with, so tier-aware code still works. */
const TIER_OF: Record<TriviaMode, Tier> = { easy: 0, moderate: 1, hard: 2 };

/**
 * Each topic maps to the closest OpenTDB category id (some topics have several
 * good fits, so we pick one at random for variety). OpenTDB has no Flags /
 * Countries / Cosmos category, so those borrow the nearest neighbour
 * (Geography, Science & Nature).
 */
const CATEGORY: Record<TriviaTopic, number | number[]> = {
  History: 23,
  Geography: 22,
  Flags: 22,
  Countries: 22,
  "Movies & TV": [11, 14], // Film, Television
  "Pop Culture": [12, 26, 29], // Music, Celebrities, Comics
  Tech: [18, 30], // Computers, Gadgets
  Science: 17, // Science & Nature
  Cosmos: 17, // no astronomy category; Science & Nature is closest
};

/** Keyword → topic, for tagging Misc questions from OpenTDB's category string. */
const CATEGORY_KEYWORDS: [string, TriviaTopic][] = [
  ["History", "History"],
  ["Geography", "Geography"],
  ["Film", "Movies & TV"],
  ["Television", "Movies & TV"],
  ["Music", "Pop Culture"],
  ["Celebrities", "Pop Culture"],
  ["Comics", "Pop Culture"],
  ["Computers", "Tech"],
  ["Gadgets", "Tech"],
  ["Science", "Science"],
];

function resolveCategory(topic: TopicChoice): number | undefined {
  if (topic === "misc") return undefined;
  const c = CATEGORY[topic];
  return Array.isArray(c) ? c[Math.floor(Math.random() * c.length)] : c;
}

function topicFor(topic: TopicChoice, categoryName: string): TriviaTopic {
  if (topic !== "misc") return topic;
  for (const [kw, t] of CATEGORY_KEYWORDS) if (categoryName.includes(kw)) return t;
  return "History";
}

/** Answers arrive percent-encoded (encode=url3986); undo that safely. */
function decode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

/** OpenTDB gives no clue, so synthesise the same first-letter style the vault uses. */
function firstLetterHint(answer: string): string {
  const first = answer.trim()[0]?.toUpperCase();
  return first ? `It starts with “${first}”.` : "No clue from the host.";
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

type RawResult = {
  category: string;
  type: string;
  difficulty: string;
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
};

function adapt(r: RawResult, topic: TopicChoice, mode: TriviaMode): TriviaQuestion | null {
  const correct = decode(r.correct_answer);
  const wrongs = r.incorrect_answers.map(decode);
  // keep only proper 4-choice questions so 50-50 and the answer grid stay intact
  if (!correct || wrongs.length < 3) return null;
  const choices = shuffle([correct, ...wrongs.slice(0, 3)]);
  return {
    topic: topicFor(topic, decode(r.category)),
    q: decode(r.question),
    choices,
    answer: choices.indexOf(correct),
    tier: TIER_OF[mode],
    hint: firstLetterHint(correct),
  };
}

async function fetchBatch(difficulty: string, category?: number): Promise<RawResult[]> {
  const params = new URLSearchParams({
    amount: String(ROUND),
    difficulty,
    type: "multiple",
    encode: "url3986",
  });
  if (category) params.set("category", String(category));

  const res = await fetch(`${API}?${params.toString()}`);
  if (!res.ok) throw new Error(`OpenTDB HTTP ${res.status}`);
  const data = (await res.json()) as { response_code: number; results: RawResult[] };
  // response_code 0 = success; anything else (no results, rate-limited, …) is a miss
  if (data.response_code !== 0 || !Array.isArray(data.results)) {
    throw new Error(`OpenTDB response_code ${data.response_code}`);
  }
  return data.results;
}

/**
 * Fetch a live 15-question round from OpenTDB for the given topic + mode.
 * Throws if the round can't be filled — the caller is expected to fall back
 * to the local vault so play never blocks.
 */
export async function fetchRound(topic: TopicChoice, mode: TriviaMode): Promise<TriviaQuestion[]> {
  const difficulty = DIFFICULTY[mode];
  const category = resolveCategory(topic);

  let raw: RawResult[];
  try {
    raw = await fetchBatch(difficulty, category);
  } catch {
    // a category+difficulty combo can be too sparse to fill 15 — retry with any category
    raw = await fetchBatch(difficulty);
  }

  const round = raw
    .map((r) => adapt(r, topic, mode))
    .filter((q): q is TriviaQuestion => q !== null);

  if (round.length < ROUND) throw new Error("OpenTDB returned too few usable questions");
  return round.slice(0, ROUND);
}
