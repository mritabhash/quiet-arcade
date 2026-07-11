/**
 * Trivia vault entry point. Topic pools build lazily (memoized) so a round
 * only pays for what it plays; each bank has its own fixed seed, so pools
 * are deterministic regardless of build order and the daily draw is the
 * same for everyone with the same setup.
 */

import { mulberry32, shuffled } from "../../lib/random";
import { TRIVIA_TOPICS, type Tier, type TriviaMode, type TriviaQuestion, type TriviaTopic } from "./types";
import { buildHistory } from "./historyBank";
import { buildGeography } from "./geographyBank";
import { buildFlags } from "./flagsBank";
import { buildCountries } from "./countriesBank";
import { buildMedia } from "./mediaBank";
import { buildPop } from "./popBank";
import { buildTech } from "./techBank";
import { buildScience } from "./scienceBank";
import { buildCosmos } from "./cosmosBank";

export { TRIVIA_TOPICS } from "./types";
export type { Tier, TriviaMode, TriviaQuestion, TriviaTopic } from "./types";

export const ROUND_SIZE = 15;
/** what each topic's bank is built to clear — used for site copy */
export const TRIVIA_TARGET_PER_TOPIC = 10000;

const BUILDERS: Record<TriviaTopic, () => TriviaQuestion[]> = {
  History: buildHistory,
  Geography: buildGeography,
  Flags: buildFlags,
  Countries: buildCountries,
  "Movies & TV": buildMedia,
  "Pop Culture": buildPop,
  Tech: buildTech,
  Science: buildScience,
  Cosmos: buildCosmos,
};

const cache = new Map<TriviaTopic, TriviaQuestion[]>();

export function topicPool(topic: TriviaTopic): TriviaQuestion[] {
  let pool = cache.get(topic);
  if (!pool) {
    pool = BUILDERS[topic]();
    cache.set(topic, pool);
  }
  return pool;
}

/** which tiers a mode draws from; hard leans on tier 2 with some tier 1 */
function tierAllowed(mode: TriviaMode, tier: Tier): boolean {
  if (mode === "easy") return tier === 0;
  if (mode === "moderate") return tier === 1;
  return tier >= 1;
}

const HARD_T2_SHARE = 0.7;

function eligible(topic: TriviaTopic, mode: TriviaMode): TriviaQuestion[] {
  return topicPool(topic).filter((q) => tierAllowed(mode, q.tier));
}

export type TopicChoice = TriviaTopic | "misc";

/**
 * Deterministic 15-question round for a seed + setup. Misc mixes all topics
 * (max 2 per topic); hard mode aims for ~70% tier-2 questions with the
 * lighter tier-1 ones placed earlier, so the round gently ramps.
 */
export function drawRound(seed: number, topic: TopicChoice, mode: TriviaMode): TriviaQuestion[] {
  const modeIdx = mode === "easy" ? 0 : mode === "moderate" ? 1 : 2;
  const topicIdx = topic === "misc" ? 9 : TRIVIA_TOPICS.indexOf(topic);
  const rng = mulberry32((seed ^ (topicIdx * 2654435761)) + modeIdx * 40503 + 17);

  const topics = topic === "misc" ? TRIVIA_TOPICS : [topic];
  const pool = topics.flatMap((t) => eligible(t, mode));
  const order = shuffled(rng, pool.map((_, i) => i));

  const picked: TriviaQuestion[] = [];
  const perTopic: Record<string, number> = {};
  const seen = new Set<string>();
  let t2 = 0;
  const wantT2 = mode === "hard" ? Math.round(ROUND_SIZE * HARD_T2_SHARE) : 0;

  const take = (accept: (q: TriviaQuestion) => boolean) => {
    for (const idx of order) {
      if (picked.length >= ROUND_SIZE) return;
      const q = pool[idx];
      if (seen.has(q.q + "::" + q.choices[q.answer])) continue;
      if (topic === "misc" && (perTopic[q.topic] ?? 0) >= 2) continue;
      if (!accept(q)) continue;
      picked.push(q);
      seen.add(q.q + "::" + q.choices[q.answer]);
      perTopic[q.topic] = (perTopic[q.topic] ?? 0) + 1;
      if (q.tier === 2) t2++;
    }
  };

  if (mode === "hard") {
    take((q) => q.tier === 2 && t2 < wantT2);
    take(() => true);
    // lighter questions first → gentle ramp
    picked.sort((a, b) => a.tier - b.tier);
  } else {
    take(() => true);
  }
  return picked;
}

/**
 * Topic Swap lifeline: a replacement question of the same mode from a random
 * different topic, avoiding anything already seen this round.
 */
export function swapQuestion(
  seed: number,
  mode: TriviaMode,
  avoidTopic: TriviaTopic,
  usedQuestions: Set<string>,
): TriviaQuestion | null {
  const rng = mulberry32((seed ^ 0x9e3779b9) + usedQuestions.size * 101);
  const topics = shuffled(rng, TRIVIA_TOPICS.filter((t) => t !== avoidTopic));
  for (const t of topics) {
    const pool = eligible(t, mode);
    for (let i = 0; i < 40; i++) {
      const q = pool[Math.floor(rng() * pool.length)];
      if (!usedQuestions.has(q.q + "::" + q.choices[q.answer])) return q;
    }
  }
  return null;
}
