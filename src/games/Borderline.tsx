import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { GameApi } from "../types";
import { rngFor, pickIndex } from "../lib/random";
import { distanceKm } from "../data/cities";
import { BORDERLINE_PLACES, type BorderlinePlace } from "../data/borderlinePlaces";
import { pickFreshIndex } from "../lib/flagship";
import { recordFlagshipRound } from "../lib/repo";
import { WorldMap, toXY } from "../components/WorldMap";
import { Button, Chip } from "../components/ui";
import { EASE } from "../components/motion";

/**
 * Borderline: deduce the hidden place from structured feedback.
 * Each guess yields clue chips — distance, direction, continent,
 * borders, climate, population, coast, and cultural region — until the
 * player narrows in or runs out of guesses.
 */

const MAX_GUESSES = 6;
const GUESS_SCORES = [1000, 850, 700, 550, 400, 250] as const;
const MAX_SCORE = 1000;

const DIRECTIONS = ["north", "north-east", "east", "south-east", "south", "south-west", "west", "north-west"] as const;

function bearingLabel(fromLat: number, fromLon: number, toLat: number, toLon: number): string {
  const φ1 = (fromLat * Math.PI) / 180;
  const φ2 = (toLat * Math.PI) / 180;
  const Δλ = ((toLon - fromLon) * Math.PI) / 180;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const deg = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
  return DIRECTIONS[Math.round(deg / 45) % 8];
}

function sharesBorder(a: BorderlinePlace, b: BorderlinePlace): boolean {
  return a.borders.includes(b.name) || b.borders.includes(a.name);
}

type ChipTone = "good" | "warm" | "cold";

interface FeedbackChip {
  text: string;
  tone: ChipTone;
}

function feedbackFor(guess: BorderlinePlace, answer: BorderlinePlace): FeedbackChip[] {
  const chips: FeedbackChip[] = [];
  const dist = Math.round(distanceKm(guess.lat, guess.lon, answer.lat, answer.lon));
  const distLabel =
    dist < 500 ? "very close" : dist < 1500 ? "close" : dist < 4000 ? "getting there" : "far";
  chips.push({
    text: `${dist.toLocaleString()} km — ${distLabel}`,
    tone: dist < 1500 ? "good" : dist < 4000 ? "warm" : "cold",
  });
  chips.push({
    text: `answer is ${bearingLabel(guess.lat, guess.lon, answer.lat, answer.lon)} of here`,
    tone: "warm",
  });
  chips.push(
    guess.continent === answer.continent
      ? { text: `same continent (${answer.continent})`, tone: "good" }
      : { text: "different continent", tone: "cold" },
  );
  if (guess.kind !== "country" || answer.kind !== "country") {
    chips.push(
      guess.country === answer.country
        ? { text: `same country (${answer.country})`, tone: "good" }
        : { text: "different country", tone: "cold" },
    );
  }
  chips.push(
    sharesBorder(guess, answer)
      ? { text: "shares a border", tone: "good" }
      : { text: "no shared border", tone: "cold" },
  );
  const dTemp = answer.temp - guess.temp;
  chips.push(
    Math.abs(dTemp) <= 2
      ? { text: "similar climate", tone: "good" }
      : { text: `answer is ${dTemp > 0 ? "warmer" : "colder"}`, tone: "warm" },
  );
  const ratio = answer.pop / Math.max(guess.pop, 0.001);
  chips.push(
    ratio > 1.5
      ? { text: `population is ${ratio > 8 ? "much " : ""}higher`, tone: "warm" }
      : ratio < 0.67
        ? { text: `population is ${ratio < 0.125 ? "much " : ""}lower`, tone: "warm" }
        : { text: "similar population", tone: "good" },
  );
  chips.push({
    text: answer.coastal ? "answer has a coastline" : "answer is landlocked",
    tone: guess.coastal === answer.coastal ? "good" : "warm",
  });
  chips.push(
    guess.lang === answer.lang
      ? { text: `same cultural region (${answer.lang})`, tone: "good" }
      : { text: "different cultural region", tone: "cold" },
  );
  if (guess.flag && answer.flag) {
    const overlap = guess.flag.filter((c) => answer.flag!.includes(c));
    if (overlap.length > 0) {
      chips.push({ text: `flag shares ${overlap.join(", ")}`, tone: "warm" });
    }
  }
  return chips;
}

interface GuessRow {
  place: BorderlinePlace;
  chips: FeedbackChip[];
}

const TONE_CLASSES: Record<ChipTone, string> = {
  good: "border-sage-500/50 bg-sage-100 text-sage-800 dark:bg-sage-900/50 dark:text-sage-200",
  warm: "border-gold-500/50 bg-gold-100 text-gold-800 dark:bg-gold-900/40 dark:text-gold-200",
  cold: "border-clay-500/40 bg-clay-50 text-clay-700 dark:bg-clay-900/40 dark:text-clay-200",
};

export function BorderlineGame({ api }: { api: GameApi }) {
  const answer = useMemo(() => {
    const rng = rngFor([api.seed]);
    if (api.mode === "daily") {
      return BORDERLINE_PLACES[pickIndex(rng, BORDERLINE_PLACES.length)];
    }
    const ids = BORDERLINE_PLACES.map((p) => p.id);
    return BORDERLINE_PLACES[pickFreshIndex("borderline", ids, rng)];
  }, [api.seed, api.mode]);

  const [query, setQuery] = useState("");
  const [guesses, setGuesses] = useState<GuessRow[]>([]);
  const [done, setDone] = useState<null | { won: boolean }>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const guessedIds = useMemo(() => new Set(guesses.map((g) => g.place.id)), [guesses]);
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return BORDERLINE_PLACES.filter(
      (p) => !guessedIds.has(p.id) && p.name.toLowerCase().includes(q),
    ).slice(0, 6);
  }, [query, guessedIds]);

  const submitGuess = (place: BorderlinePlace) => {
    if (done) return;
    setQuery("");
    if (place.id === answer.id) {
      setGuesses((g) => [...g, { place, chips: [{ text: "that's it!", tone: "good" }] }]);
      setDone({ won: true });
      return;
    }
    const next = [...guesses, { place, chips: feedbackFor(place, answer) }];
    setGuesses(next);
    if (next.length >= MAX_GUESSES) setDone({ won: false });
    else inputRef.current?.focus();
  };

  const finishRound = () => {
    if (!done) return;
    const n = guesses.length;
    const score = done.won ? GUESS_SCORES[n - 1] : 0;
    const perfect = done.won && n === 1;
    const lastReal = guesses.length > (done.won ? 1 : 0) ? guesses[guesses.length - (done.won ? 2 : 1)] : null;
    const lastDist = lastReal
      ? Math.round(distanceKm(lastReal.place.lat, lastReal.place.lon, answer.lat, answer.lon))
      : 0;
    recordFlagshipRound("borderline", api.mode, {
      score,
      max: MAX_SCORE,
      won: done.won,
      perfect,
      hintsUsed: n,
      puzzleId: answer.id,
    });
    api.finish({
      score,
      max: MAX_SCORE,
      perfect,
      label: done.won
        ? `${answer.name} found in ${n} guess${n === 1 ? "" : "es"}.`
        : `The hidden place was ${answer.name}.`,
      share: [
        "Quiet Arcade: Borderline",
        done.won ? `Solved in: ${n} guess${n === 1 ? "" : "es"}` : "Not solved this time",
        `Distance clue: ${lastDist === 0 ? "—" : lastDist < 1500 ? "close" : "far"}`,
        `Region match: ${lastReal && lastReal.place.continent === answer.continent ? "yes" : "no"}`,
        `Mode: ${api.mode === "daily" ? "Daily" : "Free Play"}`,
      ],
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest qa-muted">Hidden place</p>
          <h2 className="mt-1 font-display text-2xl font-semibold">
            {done
              ? done.won
                ? "Found it."
                : "The trail went cold."
              : "Guess. Read the chips. Narrow in."}
          </h2>
        </div>
        <p className="text-sm qa-muted">
          {guesses.length} / {MAX_GUESSES} guesses
        </p>
      </div>

      {/* mystery panel / reveal */}
      {done ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="flex flex-col gap-4"
        >
          <div className="qa-card rounded-2xl p-5">
            <p className="text-xs font-bold uppercase tracking-widest qa-muted">The answer</p>
            <h3 className="mt-1 font-display text-3xl font-semibold" aria-live="polite">
              {answer.name}
              {answer.kind !== "country" && (
                <span className="text-lg qa-muted"> · {answer.country}</span>
              )}
            </h3>
            <p className="mt-2 text-sm leading-snug">{answer.note}</p>
          </div>
          <WorldMap
            pin={null}
            actual={toXY(answer.lon, answer.lat)}
            extraPins={guesses.map((g) => toXY(g.place.lon, g.place.lat))}
            ariaLabel={`Result map showing ${answer.name} and your ${guesses.length} guesses.`}
          />
          <div className="flex justify-end">
            <Button onClick={finishRound}>Bank the score</Button>
          </div>
        </motion.div>
      ) : (
        <div className="relative">
          <label className="sr-only" htmlFor="borderline-guess">
            Guess a place
          </label>
          <input
            id="borderline-guess"
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && matches.length > 0) submitGuess(matches[0]);
            }}
            placeholder="Type a country, region, city, or island…"
            autoComplete="off"
            className="w-full rounded-2xl border border-[var(--line)] bg-[var(--card)] px-4 py-3 font-medium placeholder:qa-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          />
          {matches.length > 0 && (
            <ul
              role="listbox"
              aria-label="Matching places"
              className="qa-card absolute inset-x-0 top-full z-10 mt-1 overflow-hidden rounded-2xl shadow-xl"
            >
              {matches.map((p) => (
                <li key={p.id}>
                  <button
                    role="option"
                    aria-selected={false}
                    onClick={() => submitGuess(p)}
                    className="flex w-full items-baseline justify-between px-4 py-2.5 text-left text-sm font-semibold transition-colors hover:bg-[var(--card-2)]"
                  >
                    {p.name}
                    <span className="text-xs font-normal qa-muted">
                      {p.kind === "country" ? p.continent : `${p.kind} · ${p.country}`}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* guess history, newest first */}
      <div className="flex flex-col gap-3" aria-live="polite">
        {[...guesses].reverse().map((g, i) => (
          <motion.div
            key={g.place.id}
            initial={{ opacity: 0, y: -10, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.4, ease: EASE }}
            className="qa-card rounded-2xl px-4 py-3"
          >
            <p className="text-sm font-semibold">
              <span className="qa-muted">#{guesses.length - i}</span> {g.place.name}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {g.chips.map((c, j) => (
                <span
                  key={j}
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${TONE_CLASSES[c.tone]}`}
                >
                  {c.text}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
        {guesses.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[var(--line)] px-4 py-8 text-center">
            <p className="text-sm qa-muted">
              The mystery panel is empty. Your first guess lights the first clues.
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <Chip>distance</Chip>
              <Chip>direction</Chip>
              <Chip>borders</Chip>
              <Chip>climate</Chip>
              <Chip>population</Chip>
              <Chip>coastline</Chip>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
