/** Shared shapes for the trivia vault. */

export type TriviaTopic =
  | "History"
  | "Geography"
  | "Flags"
  | "Countries"
  | "Movies & TV"
  | "Pop Culture"
  | "Tech"
  | "Science"
  | "Cosmos";

export const TRIVIA_TOPICS: TriviaTopic[] = [
  "History", "Geography", "Flags", "Countries", "Movies & TV",
  "Pop Culture", "Tech", "Science", "Cosmos",
];

/** 0 = easy, 1 = moderate, 2 = hard. Assigned at build time, never mixed down. */
export type Tier = 0 | 1 | 2;

export type TriviaMode = "easy" | "moderate" | "hard";

export interface TriviaQuestion {
  topic: TriviaTopic;
  q: string;
  /** always 4 answers, pre-shuffled deterministically */
  choices: string[];
  /** index into choices */
  answer: number;
  tier: Tier;
  /** one-line clue for the Host Hint lifeline (never contains the answer) */
  hint: string;
  /** optional one-line explanation shown after answering */
  note?: string;
}
