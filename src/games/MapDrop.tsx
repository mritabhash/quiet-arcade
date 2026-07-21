import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { GameApi } from "../types";
import { rngFor, pickIndex } from "../lib/random";
import { CITIES, distanceKm } from "../data/cities";
import {
  MAP_DROP_PHOTO_PUZZLES,
  MAP_DROP_PUZZLES,
  MAP_DROP_VERIFIED_PHOTO_PUZZLES,
} from "../data/mapDropPuzzles";
import { pickFreshIndex } from "../lib/flagship";
import { recordFlagshipRound } from "../lib/repo";
import { LazyGlobeCanvas as GlobeCanvas } from "../components/LazyGlobeCanvas";
import { Button, Chip } from "../components/ui";
import { Counter, EASE } from "../components/motion";
import { RabbitGuide, type RabbitMood } from "../components/RabbitGuide";
import { easyFreeHintsFor } from "../lib/easyMode";
import { read, write } from "../lib/storage";
import { fetchPlaceImages, type PlaceImage } from "../lib/placeImages";
import { ImageLightbox } from "../components/ImageLightbox";
import { MapTapEasy } from "./MapTapEasy";

/** Hard mode: hints come one at a time — ceiling by hints revealed, index is (revealed - 1). */
const HINT_POINTS = [5000, 4300, 3600, 2900, 2200, 1500, 800] as const;
const MAX_SCORE = 5000;
/** Moderate mode: a photo round. One geotagged picture opens at the ceiling;
 *  each extra photo (up to five) costs a flat fee. */
const MODERATE_MAX_SCORE = 4000;
const MODERATE_IMG_COST = 150;
const MODERATE_MAX_IMAGES = 5;
// Moderate promises five separate photo clues; an incomplete/diversity-thin
// result blocks the round and offers a retry instead of counting repeats.
const MODERATE_MIN_IMAGES = MODERATE_MAX_IMAGES;
/** Easy mode: three famous facts are free; three closer looks cost a flat fee each. */
const EASY_MAX_SCORE = 3000;
const EASY_HINT_COST = 200;
const EASY_TOTAL_HINTS = 6;
/** Novice mode: the answer's name is free; one pricey reveal says where it sits. */
const NOVICE_MAX_SCORE = 5000;
const NOVICE_HINT_COST = 2000;
const NOVICE_TOTAL_HINTS = 2;
const DIFFICULTY_KEY = "quietArcade.mapDropDifficulty";
const DIFFICULTIES = ["novice", "easy", "moderate", "hard"] as const;
type Difficulty = (typeof DIFFICULTIES)[number];
/** stored prefs from the two-mode era: "standard" was the 7-hint flow */
function readDifficulty(): Difficulty {
  const raw = read<string>(DIFFICULTY_KEY, "easy");
  if (raw === "standard") return "hard";
  return (DIFFICULTIES as readonly string[]).includes(raw) ? (raw as Difficulty) : "easy";
}
/** Full points inside the bullseye; fades with distance, but any pin
 *  inside FADE_KM banks at least MIN_FACTOR of the ceiling. */
const BULLSEYE_KM = 25;
const FADE_KM = 1500;
const MIN_FACTOR = 0.1;


const LINES = {
  start: ["Read the hints. Drop wisely.", "Trust the weather.", "Food clues matter."],
  reveal: ["Careful, hints cost points.", "Okay… that one cost us.", "The picture sharpens."],
  lastHint: ["That's all I've got. Drop it."],
  tempted: ["One more hint?", "Do you really need it?"],
  pinMoved: ["That pin feels brave.", "Bold drop.", "Watching. Closely."],
  sleepy: ["Tick tock, detective.", "The map isn't going anywhere…"],
  celebrate: ["The rabbit council approves.", "That was suspiciously good."],
  happy: ["Solid drop. Claps.", "Nicely read."],
  squint: ["You're close.", "So close I can taste it."],
  shocked: ["Wrong continent, bestie.", "That pin went on a journey."],
};

const randomOf = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

/** Label the player's pin by the closest charted place, e.g. "near Dhaka". */
function nearestLabel(lat: number, lon: number): string {
  let best = { name: "", country: "", d: Infinity };
  for (const p of [...MAP_DROP_PUZZLES, ...CITIES]) {
    const d = distanceKm(lat, lon, p.lat, p.lon);
    if (d < best.d) best = { name: p.name, country: p.country, d };
  }
  return best.d > 1200 ? "somewhere far off the charts" : `near ${best.name}, ${best.country}`;
}

interface Outcome {
  pin: { x: number; y: number };
  pinLabel: string;
  dist: number;
  base: number;
  score: number;
}

export function MapDropGame({ api }: { api: GameApi }) {
  const versusDifficulty = api.versus
    ? (api.versus.config as { difficulty?: Difficulty }).difficulty
    : undefined;
  const [difficulty, setDifficulty] = useState<Difficulty>(
    () => versusDifficulty ?? readDifficulty(),
  );
  // Keep the round's puzzle stable when a solo player tries another difficulty.
  // Rounds that start in photo mode use the curated city pool so a versus match
  // cannot select a generated location with genuinely thin image coverage.
  const initialDifficulty = useRef(difficulty).current;
  // Every player gets the same Daily place regardless of their saved setting.
  // The shared Daily pool is photo-capable so Moderate can keep its contract.
  const puzzlePool =
    api.versus && initialDifficulty === "moderate"
      ? MAP_DROP_VERIFIED_PHOTO_PUZZLES
      : api.mode === "daily" || initialDifficulty === "moderate"
      ? MAP_DROP_PHOTO_PUZZLES
      : MAP_DROP_PUZZLES;
  const place = useMemo(() => {
    const rng = rngFor([api.seed]);
    // daily stays purely date-deterministic; versus must be too, or the two
    // players' local recent-puzzle memories would pick them different places
    if (api.mode === "daily" || api.versus) {
      return puzzlePool[pickIndex(rng, puzzlePool.length)];
    }
    // free play skips recent rounds
    const ids = puzzlePool.map((p) => p.id);
    return puzzlePool[pickFreshIndex("map-drop", ids, rng)];
  }, [api.seed, api.mode, api.versus, puzzlePool]);

  const easyFree = useMemo(() => easyFreeHintsFor(place, api.seed), [place, api.seed]);
  // Moderate is a photo round fetched from Wikimedia Commons: images === null
  // while loading, imagesFailed when the spot lacks enough usable pictures.
  const [images, setImages] = useState<PlaceImage[] | null>(null);
  const [imagesFailed, setImagesFailed] = useState(false);
  const [photoAttempt, setPhotoAttempt] = useState(0);
  const [zoomImg, setZoomImg] = useState<PlaceImage | null>(null);
  // Easy can fall back to hard when its country data is missing. Moderate must
  // wait for all five photos so its clue and scoring contract never changes.
  const eff: Difficulty =
    difficulty === "easy" && easyFree === null ? "hard" : difficulty;
  const moderateReady =
    difficulty === "moderate" && images?.length === MODERATE_MAX_IMAGES;
  const moderateLoading = difficulty === "moderate" && !imagesFailed && images === null;
  const moderateUnavailable = difficulty === "moderate" && imagesFailed;
  const roundReady = difficulty !== "moderate" || moderateReady;

  // novice/moderate/hard all reveal one at a time; easy is delegated to MapTapEasy
  const [revealed, setRevealed] = useState(1);
  const [pin, setPin] = useState<{ x: number; y: number } | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [rabbit, setRabbit] = useState<{ mood: RabbitMood; line: string }>(() => ({
    mood: "curious",
    line: randomOf(LINES.start),
  }));
  const beforeTempt = useRef<{ mood: RabbitMood; line: string } | null>(null);
  const [poke, setPoke] = useState(0);

  const say = (mood: RabbitMood, lines: string[]) =>
    setRabbit({ mood, line: randomOf(lines) });
  const bump = () => setPoke((p) => p + 1);

  // If the player stalls, the rabbit checks its tiny watch.
  useEffect(() => {
    if (outcome) return;
    const t = setTimeout(
      () => setRabbit({ mood: "sleepy", line: randomOf(LINES.sleepy) }),
      45000,
    );
    return () => clearTimeout(t);
  }, [poke, outcome]);

  // Fetch moderate mode's geotagged photos when the place or mode changes.
  useEffect(() => {
    if (difficulty !== "moderate") return;
    let cancelled = false;
    const ctrl = new AbortController();
    setImages(null);
    setImagesFailed(false);
    fetchPlaceImages(place, MODERATE_MAX_IMAGES, ctrl.signal)
      .then((list) => {
        if (cancelled) return;
        if (list.length === MODERATE_MIN_IMAGES) setImages(list);
        else setImagesFailed(true);
      })
      .catch(() => {
        if (!cancelled) setImagesFailed(true);
      });
    return () => {
      cancelled = true;
      ctrl.abort();
    };
  }, [difficulty, place, photoAttempt]);

  const imageCount = images?.length ?? 0;
  const totalHints =
    eff === "hard"
      ? 7
      : eff === "novice"
        ? NOVICE_TOTAL_HINTS
        : eff === "easy"
          ? EASY_TOTAL_HINTS
          : imageCount; // moderate reveals the geotagged photos one by one
  const hints =
    eff === "novice"
      ? [
          place.kind === "mountains"
            ? `The mountains are called ${place.name}.`
            : `The ${place.kind}'s name is ${place.name}.`,
          `You'll find it in ${place.country}.`,
        ]
      : eff === "easy"
        ? [...easyFree!.map((h) => h.text), ...place.hints.slice(0, 3)]
        : place.hints;
  const ceiling =
    eff === "novice"
      ? NOVICE_MAX_SCORE - (revealed - 1) * NOVICE_HINT_COST
      : eff === "easy"
        ? EASY_MAX_SCORE - (revealed - 3) * EASY_HINT_COST
        : eff === "moderate"
          ? MODERATE_MAX_SCORE - (revealed - 1) * MODERATE_IMG_COST
          : HINT_POINTS[revealed - 1];
  const maxScore =
    eff === "easy" ? EASY_MAX_SCORE : eff === "moderate" ? MODERATE_MAX_SCORE : MAX_SCORE;
  const modeLabel = difficulty[0].toUpperCase() + difficulty.slice(1);

  const switchDifficulty = (d: Difficulty) => {
    if (api.versus) return; // config is fixed for a match
    if (d === difficulty || outcome) return;
    setDifficulty(d);
    write(DIFFICULTY_KEY, d);
    setRevealed(1); // every non-easy mode opens with a single clue revealed
    bump();
  };

  const revealHint = () => {
    if (revealed >= totalHints || outcome) return;
    const n = revealed + 1;
    setRevealed(n);
    beforeTempt.current = null;
    say("investigating", n === totalHints ? LINES.lastHint : LINES.reveal);
    bump();
  };

  const onTemptEnter = () => {
    if (outcome) return;
    beforeTempt.current = rabbit;
    say("tempted", LINES.tempted);
  };
  const onTemptLeave = () => {
    if (outcome || !beforeTempt.current) return;
    setRabbit(beforeTempt.current);
    beforeTempt.current = null;
  };

  const onPinPlaced = () => {
    if (outcome) return;
    if (rabbit.mood !== "pointing") say("pointing", LINES.pinMoved);
    api.versus?.onProgress({ role: api.versus.role, score: 0, lockedIn: false });
    bump();
  };

  const confirmDrop = () => {
    if (!pin || outcome) return;
    const dist = Math.round(distanceKm(90 - pin.y, pin.x - 180, place.lat, place.lon));
    const factor =
      dist <= BULLSEYE_KM ? 1 : dist < FADE_KM ? Math.max(MIN_FACTOR, 1 - dist / FADE_KM) : 0;
    const score = Math.round(ceiling * factor);
    setOutcome({
      pin,
      pinLabel: nearestLabel(90 - pin.y, pin.x - 180),
      dist,
      base: ceiling,
      score,
    });
    if (score === maxScore || dist <= 100) say("celebrate", LINES.celebrate);
    else if (dist <= 600) say("happy", LINES.happy);
    else if (dist <= 2500) say("squint", LINES.squint);
    else say("shocked", LINES.shocked);
    api.versus?.onProgress({ role: api.versus.role, score, lockedIn: true });
  };

  const finishRound = () => {
    if (!outcome) return;
    if (!api.versus) {
      recordFlagshipRound("map-drop", api.mode, {
        score: outcome.score,
        max: maxScore,
        won: outcome.dist <= 600,
        perfect: outcome.score === maxScore,
        hintsUsed: revealed,
        puzzleId: place.id,
      });
    }
    api.finish({
      score: outcome.score,
      max: maxScore,
      perfect: outcome.score === maxScore,
      label: `${place.name}, ${place.country} — ${modeLabel}, ${revealed}/${totalHints} hints, ${outcome.dist.toLocaleString()} km off.`,
      share: [
        "Quiet Arcade: Map Drop",
        `Score: ${outcome.score.toLocaleString()}/${maxScore.toLocaleString()}`,
        `Difficulty: ${modeLabel}`,
        `Distance: ${outcome.dist.toLocaleString()} km`,
        `Hints used: ${revealed}/${totalHints}`,
        `Mode: ${api.mode === "daily" ? "Daily" : "Free Play"}`,
      ],
    });
  };

  // Easy mode is the MapTap-style 3D globe game: five rounds, tap to place.
  if (difficulty === "easy") {
    return (
      <MapTapEasy
        api={api}
        difficulties={DIFFICULTIES}
        difficulty={difficulty}
        onPick={(d) => switchDifficulty(d as Difficulty)}
      />
    );
  }

  /* ------------------------------------------------ post-guess */
  if (outcome) {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest qa-muted">
              {outcome.dist <= 600 ? `The ${place.kind}, pinned` : `The ${place.kind} got away`}
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold" aria-live="polite">
              {place.name}, {place.country}
            </h2>
          </div>
          <p className="font-display text-3xl font-semibold">
            <Counter value={outcome.score} />
            <span className="text-base font-normal qa-muted"> / {maxScore.toLocaleString()}</span>
          </p>
        </div>

        <div
          className="relative overflow-hidden rounded-3xl border border-[var(--line)] bg-[#0b2731]"
          role="img"
          aria-label={`Result globe. Your pin landed ${outcome.dist.toLocaleString()} kilometres from ${place.name}.`}
        >
          <GlobeCanvas
            className="h-[380px] w-full sm:h-[440px]"
            interactive={false}
            guess={{ lat: 90 - outcome.pin.y, lon: outcome.pin.x - 180 }}
            answer={{ lat: place.lat, lon: place.lon }}
            showArc
          />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Your pin" value={outcome.pinLabel} />
          <Stat label="Distance" value={`${outcome.dist.toLocaleString()} km`} />
          <Stat label="Hints used" value={`${revealed} / ${totalHints}`} />
          <Stat label="Ceiling" value={`${outcome.base.toLocaleString()} pts`} />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={finishRound}>Bank the score</Button>
          {api.mode === "practice" && api.playAgain && (
            <Button
              variant="secondary"
              onClick={() => {
                finishRound();
                api.playAgain?.();
              }}
            >
              Play again
            </Button>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5, ease: EASE }}
          className="qa-card rounded-2xl p-5"
        >
          <p className="text-xs font-bold uppercase tracking-widest qa-muted">Why</p>
          <p className="mt-2 text-sm leading-snug">{place.why}</p>
        </motion.div>

        <RabbitGuide mood={rabbit.mood} line={rabbit.line} />
      </div>
    );
  }

  /* ----------------------------------------------------- play */
  return (
    <div className="flex flex-col gap-5">
      {zoomImg && <ImageLightbox img={zoomImg} onClose={() => setZoomImg(null)} />}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest qa-muted">
            Hidden {place.kind}
          </p>
          <h2 className="mt-1 font-display text-2xl font-semibold">
            Find the {place.kind}. Drop your pin.
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {!api.versus && (
            <div
              className="flex rounded-xl border border-[var(--line)] bg-[var(--card)] p-1"
              role="tablist"
              aria-label="Hint difficulty"
            >
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  role="tab"
                  aria-selected={difficulty === d}
                  onClick={() => switchDifficulty(d)}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold capitalize transition-colors ${
                    difficulty === d
                      ? "bg-[var(--card-2)] text-[var(--ink)]"
                      : "qa-muted hover:text-[var(--ink)]"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          )}
          <div className="text-right">
            <p className="font-display text-2xl font-semibold">
              {ceiling.toLocaleString()}
              <span className="text-sm font-normal qa-muted"> pts possible</span>
            </p>
            <p className="text-xs qa-muted">
              {moderateLoading
                ? "Finding photos…"
                : moderateUnavailable
                  ? "Photos unavailable"
                  : `${revealed} / ${totalHints} ${moderateReady ? "photos" : "hints"}`}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.9fr)]">
        <div className="flex flex-col gap-2.5">
          {moderateLoading ? (
            <div className="flex flex-col gap-2.5">
              <div className="h-44 w-full animate-pulse rounded-2xl bg-[var(--card-2)]" />
              <p className="text-xs qa-muted">
                Fetching real photos taken near this place…
              </p>
            </div>
          ) : moderateUnavailable ? (
            <div
              className="qa-card flex flex-col items-start gap-3 rounded-2xl px-4 py-4"
              role="alert"
            >
              <div>
                <p className="text-sm font-semibold">Five distinct photos are required</p>
                <p className="mt-1 text-xs leading-snug qa-muted">
                  This photo set could not be completed. Retry to keep the same
                  Moderate clues and scoring rules{api.versus ? " for this match" : ""}.
                </p>
              </div>
              <Button
                variant="secondary"
                className="px-4 py-1.5 text-sm"
                onClick={() => setPhotoAttempt((attempt) => attempt + 1)}
              >
                Retry photos
              </Button>
            </div>
          ) : moderateReady ? (
            <div className="flex flex-col gap-2.5" aria-live="polite">
              {images!.slice(0, revealed).map((img, i) => (
                <motion.figure
                  key={`${place.id}-${i}`}
                  initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ duration: 0.5, ease: EASE }}
                  className="qa-card overflow-hidden rounded-2xl"
                >
                  <button
                    type="button"
                    onClick={() => setZoomImg(img)}
                    aria-label={`Inspect photo ${i + 1} — opens a zoomable view`}
                    className="group relative block w-full cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                  >
                    <img
                      src={img.url}
                      alt={`Photo clue ${i + 1} taken near the hidden place`}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="h-44 w-full bg-[var(--card-2)] object-cover"
                    />
                    <span
                      aria-hidden
                      className="absolute bottom-2 right-2 rounded-full bg-black/55 px-2 py-1 text-[10px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                    >
                      ⌕ Zoom
                    </span>
                  </button>
                  <figcaption className="flex items-center justify-between gap-2 px-3 py-2 text-[10px] qa-muted">
                    <span className="font-bold uppercase tracking-widest">Photo {i + 1}</span>
                    <span className="truncate" title={`${img.credit} — Wikimedia Commons`}>
                      {img.credit}
                    </span>
                  </figcaption>
                </motion.figure>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2.5" aria-live="polite">
              {hints.slice(0, revealed).map((hint, i) => (
                <motion.div
                  key={`${difficulty}-${i}`}
                  initial={{ opacity: 0, x: -18, filter: "blur(6px)" }}
                  animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                  transition={{ duration: 0.5, ease: EASE, delay: i < (eff === "easy" ? 3 : 1) ? i * 0.15 : 0 }}
                  className="qa-card rounded-2xl px-4 py-3"
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest qa-muted">
                    {eff === "novice"
                      ? i === 0
                        ? "The name"
                        : place.kind === "country"
                          ? "Continent"
                          : "Country"
                      : eff === "easy"
                        ? i < 3
                          ? easyFree![i].label
                          : `Closer look ${i - 2}`
                        : `Hint ${i + 1}`}
                  </p>
                  <p className="mt-0.5 text-sm font-medium leading-snug">{hint}</p>
                </motion.div>
              ))}
            </div>
          )}

          {!moderateLoading &&
            !moderateUnavailable &&
            (revealed < totalHints ? (
              <button
                onClick={revealHint}
                onMouseEnter={onTemptEnter}
                onMouseLeave={onTemptLeave}
                onFocus={onTemptEnter}
                onBlur={onTemptLeave}
                className="rounded-2xl border border-dashed border-[var(--line)] px-4 py-3 text-left transition-colors hover:bg-[var(--card-2)] focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              >
                <p className="text-sm font-semibold">
                  Reveal {moderateReady ? "photo" : "hint"} {revealed + 1}
                </p>
                <p className="text-xs qa-muted">
                  {eff === "hard"
                    ? `Lowers your ceiling to ${HINT_POINTS[revealed].toLocaleString()} pts`
                    : eff === "novice"
                      ? `Costs ${NOVICE_HINT_COST.toLocaleString()} points — ceiling drops to ${(NOVICE_MAX_SCORE - revealed * NOVICE_HINT_COST).toLocaleString()} pts`
                      : eff === "easy"
                        ? `Costs ${EASY_HINT_COST} points — ceiling drops to ${(EASY_MAX_SCORE - (revealed - 2) * EASY_HINT_COST).toLocaleString()} pts`
                        : `Costs ${MODERATE_IMG_COST} points — ceiling drops to ${(MODERATE_MAX_SCORE - revealed * MODERATE_IMG_COST).toLocaleString()} pts`}
                </p>
              </button>
            ) : (
              <Chip className="self-start">
                {moderateReady
                  ? `All ${totalHints} photos are out`
                  : totalHints === 2
                    ? "Both hints are out"
                    : `All ${totalHints === 7 ? "seven" : "three"} hints are out`}
              </Chip>
            ))}

          <div className="mt-auto pt-3">
            <RabbitGuide mood={rabbit.mood} line={rabbit.line} />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="relative overflow-hidden rounded-3xl border border-[var(--line)] bg-[#0b2731]">
            <GlobeCanvas
              className="h-[380px] w-full sm:h-[440px]"
              interactive={!outcome && roundReady}
              ariaLabel="Interactive globe. Drag or use arrow keys to aim the centre reticle, then tap or press Enter to drop your guess. Scroll, pinch, or the plus and minus keys zoom."
              onTap={(lat, lon) => {
                setPin({ x: lon + 180, y: 90 - lat });
                onPinPlaced();
              }}
              guess={pin ? { lat: 90 - pin.y, lon: pin.x - 180 } : null}
              answer={null}
            />
            {!pin && roundReady && (
              <p className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-4 py-3 text-center text-sm font-medium text-sand-50">
                Drag or arrow-key to spin · scroll or pinch to zoom · tap or Enter to drop
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={confirmDrop} disabled={!pin || !roundReady}>
              Confirm drop
            </Button>
            <p className="text-xs leading-snug qa-muted">
              {!roundReady
                ? moderateLoading
                  ? "Waiting for five distinct photo clues…"
                  : api.versus
                    ? "Retry the photo set to continue this match."
                    : "Retry the photo set, or choose another difficulty."
                : pin
                  ? "Tap again to move your guess, then confirm. Closer keeps more points."
                  : "Drag to spin the globe, then tap to drop your pin."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="qa-card rounded-2xl px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-widest qa-muted">{label}</p>
      <p className="mt-0.5 truncate text-sm font-semibold" title={value}>
        {value}
      </p>
    </div>
  );
}
