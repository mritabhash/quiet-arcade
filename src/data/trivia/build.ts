/**
 * Builder kit shared by the per-topic question banks. Each bank owns a Bank
 * instance with its own fixed seed, so pools are deterministic regardless of
 * which topics get built first (they are built lazily from index.ts).
 *
 * Volume strategy: direct template questions first, then `fill` loops that
 * sample 4-entity superlative / ordering questions until each tier quota is
 * met. Dedupe key includes the sorted choice set, so the same fact may appear
 * with different distractor line-ups — that is what makes 10,000 per topic
 * reachable without repeating an exact question.
 */

import { mulberry32, shuffled } from "../../lib/random";
import type { Tier, TriviaQuestion, TriviaTopic } from "./types";

/** per-tier quotas: 3,500 / 3,500 / 3,000 → ≥10,000 per topic */
export const TIER_TARGETS: [number, number, number] = [3500, 3500, 3000];

export function firstLetterHint(correct: string): string {
  const ch = correct.replace(/^(the|a|an)\s+/i, "").charAt(0).toUpperCase();
  return `It starts with “${ch}”.`;
}

/**
 * Does the hint give the answer away? Long answers use plain substring;
 * short ones (symbols, numbers, single letters) only count as leaked when
 * they appear as a whole token, otherwise "It starts with “K”." would flag
 * every sentence containing the letter k.
 */
export function hintLeaks(hint: string, correct: string): boolean {
  const h = hint.toLowerCase();
  const c = correct.toLowerCase();
  if (c.length >= 4) return h.includes(c);
  return h.split(/[^a-z0-9¹²³⁴₀-₉]+/i).includes(c);
}

const SMILE_HINT = "No clue from the host — just an encouraging smile.";

export class Bank {
  readonly qs: TriviaQuestion[] = [];
  readonly rng: () => number;
  readonly topic: TriviaTopic;
  private seen = new Set<string>();
  private tierCounts: [number, number, number] = [0, 0, 0];

  constructor(topic: TriviaTopic, seed: number) {
    this.topic = topic;
    this.rng = mulberry32(seed);
  }

  /** add one question; returns false if invalid or already present */
  push(tier: Tier, q: string, correct: string, wrongs: string[], hint?: string, note?: string): boolean {
    const ws = [...new Set(wrongs.filter((w) => w && w !== correct))].slice(0, 3);
    if (ws.length < 3) return false;
    const key = q + "::" + correct + "::" + [...ws].sort().join("|");
    if (this.seen.has(key)) return false;
    this.seen.add(key);
    const choices = shuffled(this.rng, [correct, ...ws]);
    // a hint must never contain the answer it is hinting at
    const fallback = firstLetterHint(correct);
    const safeHint =
      hint && !hintLeaks(hint, correct) ? hint : !hintLeaks(fallback, correct) ? fallback : SMILE_HINT;
    this.qs.push({
      topic: this.topic, q, choices, answer: choices.indexOf(correct),
      tier, hint: safeHint, note,
    });
    this.tierCounts[tier]++;
    return true;
  }

  count(tier: Tier): number {
    return this.tierCounts[tier];
  }

  /**
   * Deterministic sample of up to n distinct entries matching the filter.
   * Random indices rather than a contiguous walk — the distractor line-up
   * space per fact is what lets the fill loops reach their tier quotas.
   */
  pickN<T>(pool: readonly T[], n: number, ok: (t: T) => boolean = () => true): T[] {
    const seen = new Set<number>();
    const out: T[] = [];
    let guard = 0;
    while (out.length < n && seen.size < pool.length && guard++ < pool.length * 10) {
      const i = Math.floor(this.rng() * pool.length);
      if (seen.has(i)) continue;
      seen.add(i);
      if (ok(pool[i])) out.push(pool[i]);
    }
    for (let i = 0; i < pool.length && out.length < n; i++) {
      if (!seen.has(i) && ok(pool[i])) {
        seen.add(i);
        out.push(pool[i]);
      }
    }
    return out;
  }

  one<T>(pool: readonly T[]): T {
    return pool[Math.floor(this.rng() * pool.length)];
  }

  /** 4 distinct random rows, or null when the pool is too small */
  four<T>(pool: readonly T[]): [T, T, T, T] | null {
    if (pool.length < 4) return null;
    const idx = new Set<number>();
    while (idx.size < 4) idx.add(Math.floor(this.rng() * pool.length));
    const [a, b, c, d] = [...idx].map((i) => pool[i]);
    return [a, b, c, d];
  }

  /** keep calling gen until the tier quota is reached or tries run out */
  fill(tier: Tier, target: number, gen: () => unknown, maxTries = target * 80): void {
    let tries = 0;
    while (this.tierCounts[tier] < target && tries++ < maxTries) gen();
  }

  /**
   * Superlative fill: sample 4 rows, keep the set only when the winner beats
   * the runner-up by `minGap` (absolute) so the answer is never a judgement
   * call, then phrase it via makeQ. Larger gaps read easier.
   */
  fillSuperlative<T>(
    tier: Tier,
    target: number,
    pool: readonly T[],
    key: (t: T) => number,
    minGap: number,
    largest: boolean,
    makeQ: (four: T[], best: T) => { q: string; label: (t: T) => string; hint?: string; note?: string },
  ): void {
    this.fill(tier, target, () => {
      const four = this.four(pool);
      if (!four) return;
      const sorted = [...four].sort((x, y) => (largest ? key(y) - key(x) : key(x) - key(y)));
      const best = sorted[0];
      if (Math.abs(key(sorted[0]) - key(sorted[1])) < minGap) return;
      const { q, label, hint, note } = makeQ(four, best);
      this.push(tier, q, label(best), four.filter((t) => t !== best).map(label), hint, note);
    });
  }
}

export const fmtYear = (y: number): string => (y < 0 ? `${-y} BC` : `${y}`);

/** 3 plausible, distinct wrong years around a real one; wider spread = easier */
export function yearWrongs(rng: () => number, year: number, spread: number): string[] {
  const offsets = new Set<number>();
  let guard = 0;
  while (offsets.size < 3 && guard++ < 60) {
    const mag = 1 + Math.floor(rng() * spread);
    const off = rng() < 0.5 ? -mag : mag;
    if (off !== 0 && year + off !== year) offsets.add(off);
  }
  return [...offsets].map((o) => fmtYear(year + o));
}

/** decade label like "the 1980s" */
export function decadeOf(year: number): string {
  return `the ${Math.floor(year / 10) * 10}s`;
}

/** 3 distinct wrong decades near a year */
export function decadeWrongs(rng: () => number, year: number): string[] {
  const d = Math.floor(year / 10) * 10;
  const cands = [d - 30, d - 20, d - 10, d + 10, d + 20, d + 30].filter((x) => x >= 1900 && x <= 2020);
  const picked = shuffled(rng, cands).slice(0, 3);
  return picked.map((x) => `the ${x}s`);
}
