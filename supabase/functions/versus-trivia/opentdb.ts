/**
 * Deno port of src/data/trivia/opentdb.ts — fetches one shared OpenTDB round
 * per match so both players get identical questions. Over-fetches 20 (15
 * active + 5 spares for the Topic Swap lifeline).
 */

import type { TriviaMode } from "./scoring.ts";

const API = "https://opentdb.com/api.php";
export const ROUND = 15;
export const SPARES = 5;
const TOTAL = ROUND + SPARES;

/** mode → OpenTDB difficulty (mirrors the client) */
const DIFFICULTY: Record<TriviaMode, "easy" | "medium" | "hard"> = {
  easy: "easy",
  moderate: "medium",
  hard: "hard",
};

/** topic → closest OpenTDB category id(s) — mirrors the client map */
const CATEGORY: Record<string, number | number[]> = {
  History: 23,
  Geography: 22,
  Flags: 22,
  Countries: 22,
  "Movies & TV": [11, 14],
  "Pop Culture": [12, 26, 29],
  Tech: [18, 30],
  Science: 17,
  Cosmos: 17,
};

const CATEGORY_KEYWORDS: [string, string][] = [
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

function resolveCategory(topic: string): number | undefined {
  if (topic === "misc") return undefined;
  const c = CATEGORY[topic];
  if (c === undefined) return undefined;
  return Array.isArray(c) ? c[Math.floor(Math.random() * c.length)] : c;
}

function topicFor(topic: string, categoryName: string): string {
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

/** OpenTDB gives no clue, so synthesise the vault's first-letter style. */
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

interface RawResult {
  category: string;
  type: string;
  difficulty: string;
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
}

export interface StoredQuestion {
  question: string;
  choices: string[]; // string[4]
  correct_index: number;
  topic: string;
  hint: string;
}

function adapt(r: RawResult, topic: string): StoredQuestion | null {
  const correct = decode(r.correct_answer);
  const wrongs = r.incorrect_answers.map(decode);
  // keep only proper 4-choice questions so 50-50 and the answer grid stay intact
  if (!correct || wrongs.length < 3) return null;
  const choices = shuffle([correct, ...wrongs.slice(0, 3)]);
  return {
    question: decode(r.question),
    choices,
    correct_index: choices.indexOf(correct),
    topic: topicFor(topic, decode(r.category)),
    hint: firstLetterHint(correct),
  };
}

async function fetchBatch(difficulty: string, category?: number): Promise<RawResult[]> {
  const params = new URLSearchParams({
    amount: String(TOTAL),
    difficulty,
    type: "multiple",
    encode: "url3986",
  });
  if (category) params.set("category", String(category));

  const res = await fetch(`${API}?${params.toString()}`);
  if (!res.ok) throw new Error(`OpenTDB HTTP ${res.status}`);
  const data = (await res.json()) as { response_code: number; results: RawResult[] };
  if (data.response_code !== 0 || !Array.isArray(data.results)) {
    throw new Error(`OpenTDB response_code ${data.response_code}`);
  }
  return data.results;
}

/**
 * Fetch 20 usable questions (15 active + 5 swap spares) for topic + mode.
 * Retries without a category when a combo is too sparse. Throws when even the
 * uncategorised pool can't fill 15 — the caller surfaces a retry, never a
 * silent substitute (fairness rule).
 */
export async function fetchMatchRound(topic: string, mode: TriviaMode): Promise<StoredQuestion[]> {
  const difficulty = DIFFICULTY[mode];
  const category = resolveCategory(topic);

  let raw: RawResult[];
  try {
    raw = await fetchBatch(difficulty, category);
  } catch {
    // a category+difficulty combo can be too sparse — retry with any category
    raw = await fetchBatch(difficulty);
  }

  const usable = raw
    .map((r) => adapt(r, topic))
    .filter((q): q is StoredQuestion => q !== null);

  if (usable.length < ROUND) throw new Error("OpenTDB returned too few usable questions");
  return usable.slice(0, Math.min(TOTAL, usable.length));
}
