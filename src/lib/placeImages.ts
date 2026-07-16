/**
 * Real photos of a Map Drop place, used by moderate mode's picture round.
 *
 * Two free, key-less sources, combined so the pictures actually *hint* at the
 * place rather than being random stock imagery:
 *   1) Wikipedia's own page media (the curated landmark / skyline
 *      shots an editor chose to represent the place) — iconic, in page order.
 *   2) Wikimedia Commons *geosearch* — files geotagged within a few km of the
 *      place's coordinates, i.e. real pictures taken *at* the spot ("from the
 *      map"). Used to fill in when a place has a thin or missing article.
 *
 * Both APIs are anonymous-CORS (origin=*). Maps, flags, seals, logos and other
 * non-photo assets are filtered out; thumbnails + author credit come from a
 * single batched Commons imageinfo call.
 */

export interface PlaceImage {
  /** ~900px-wide thumbnail on upload.wikimedia.org (used for the card) */
  url: string;
  /** full-resolution original, for the zoom-to-inspect viewer */
  full: string;
  /** Commons file page — attribution / licence live here */
  descUrl: string;
  /** raw file title, e.g. "File:Foo bridge at dusk.jpg" */
  title: string;
  /** best-effort author/credit line for attribution */
  credit: string;
}

interface PlaceLike {
  name: string;
  country: string;
  lat: number;
  lon: number;
}

export interface PlaceImageCandidate {
  title: string;
  lat?: number;
  lon?: number;
}

const COMMONS = "https://commons.wikimedia.org/w/api.php";
const EN_WIKI = "https://en.wikipedia.org/w/api.php";
const WIKI_REST = "https://en.wikipedia.org/api/rest_v1/page/media-list";
const API_TITLE_LIMIT = 50;
const GEO_RESULT_LIMIT = 500;
const API_RETRY_DELAYS_MS = [750, 2_000] as const;
const completedPhotoCache = new Map<string, PlaceImage[]>();

/** JPEG/WebP are Commons' reliable photographic formats; PNG is mostly art. */
const PHOTO = /\.(?:jpe?g|webp)$/i;
const NON_PHOTO_WORDS = new Set([
  "artwork",
  "blazon",
  "carte",
  "chart",
  "collage",
  "crest",
  "diagram",
  "drawing",
  "emblem",
  "engraving",
  "etching",
  "flag",
  "harita",
  "icon",
  "illustration",
  "kaart",
  "karta",
  "karte",
  "locator",
  "logo",
  "litho",
  "lithograph",
  "map",
  "maps",
  "mapa",
  "mappa",
  "mappe",
  "manuscript",
  "miniature",
  "montage",
  "painting",
  "plan",
  "poster",
  "print",
  "sketch",
  "seal",
  "watercolor",
  "watercolour",
  "woodcut",
]);
const TITLE_NOISE = new Set([
  "a",
  "an",
  "and",
  "at",
  "by",
  "file",
  "from",
  "image",
  "img",
  "in",
  "near",
  "of",
  "on",
  "photo",
  "photograph",
  "picture",
  "the",
  "view",
  "with",
]);
const TOKEN_ALIASES: Record<string, string> = {
  centre: "center",
  shoppe: "shop",
  storefront: "shop",
  store: "shop",
  theatre: "theater",
};

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]*>/g, "")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function abortableDelay(ms: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) throw signal.reason;
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal?.reason);
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

async function getJson(url: string, signal?: AbortSignal): Promise<unknown> {
  for (let attempt = 0; ; attempt += 1) {
    const res = await fetch(url, { signal });
    if (res.ok) return res.json();
    const retryable = res.status === 429 || res.status === 502 || res.status === 503;
    if (!retryable || attempt >= API_RETRY_DELAYS_MS.length) {
      throw new Error(`HTTP ${res.status}`);
    }
    const retryAfter = Number(res.headers.get("retry-after"));
    const delay = Number.isFinite(retryAfter) && retryAfter > 0
      ? Math.min(10_000, retryAfter * 1_000)
      : API_RETRY_DELAYS_MS[attempt];
    await abortableDelay(delay, signal);
  }
}

function tokenise(value: string): string[] {
  return (value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .match(/[\p{L}\p{N}]+/gu) ?? [])
    .map((raw) => raw.replace(/\d{3,}$/u, ""))
    .map((raw) => TOKEN_ALIASES[raw] ?? raw)
    .map((raw) => {
      if (raw.length > 4 && raw.endsWith("ies")) return `${raw.slice(0, -3)}y`;
      if (raw.length > 4 && raw.endsWith("s") && !raw.endsWith("ss")) {
        return raw.slice(0, -1);
      }
      return raw;
    })
    .map((raw) => TOKEN_ALIASES[raw] ?? raw)
    .filter((raw) => raw.length > 1 && !/^\d+$/u.test(raw) && !TITLE_NOISE.has(raw));
}

function containsNonPhotoTerms(value: string): boolean {
  const words = tokenise(value);
  if (words.some((word) => NON_PHOTO_WORDS.has(word))) return true;
  return words.includes("coat") && (words.includes("arm") || words.includes("arms"));
}

function isUsablePhotoTitle(title: string): boolean {
  if (!PHOTO.test(title)) return false;
  const body = title.replace(/^File:/i, "").replace(/\.(?:jpe?g|webp)$/i, "");
  return !containsNonPhotoTerms(body);
}

export function isPhotographicImageMetadata(info: {
  mime?: string;
  mediatype?: string;
  extmetadata?: { Categories?: { value?: string } };
}): boolean {
  if (info.mediatype && info.mediatype !== "BITMAP") return false;
  if (info.mime && info.mime !== "image/jpeg" && info.mime !== "image/webp") return false;
  const categories = info.extmetadata?.Categories?.value ?? "";
  return !categories.split("|").some(containsNonPhotoTerms);
}

function titleFingerprint(title: string, placeWords: Set<string>): Set<string> {
  const body = title.replace(/^File:/i, "").replace(/\.(?:jpe?g|webp)$/i, "");
  const allWords = tokenise(body);
  const specific = new Set(allWords.filter((word) => !placeWords.has(word)));
  // Numbered bulk uploads sometimes contain nothing except the place name and
  // an ID ("Columbus, Ohio 114"). Keep the location stem in that case so the
  // whole burst still collapses to one clue.
  const isNumberedBurst = /\d{2,}/u.test(body);
  return specific.size === 0 || (specific.size === 1 && isNumberedBurst)
    ? new Set(allWords)
    : specific;
}

function sameSubject(a: Set<string>, b: Set<string>): boolean {
  if (a.size === 0 || b.size === 0) return false;
  let shared = 0;
  for (const word of a) if (b.has(word)) shared += 1;
  return shared / Math.min(a.size, b.size) >= 2 / 3;
}

function distanceBetweenKm(
  a: { lat?: number; lon?: number },
  b: { lat?: number; lon?: number },
): number {
  if (
    !Number.isFinite(a.lat) ||
    !Number.isFinite(a.lon) ||
    !Number.isFinite(b.lat) ||
    !Number.isFinite(b.lon)
  ) {
    return Infinity;
  }
  const rad = Math.PI / 180;
  const dLat = (b.lat! - a.lat!) * rad;
  const dLon = (b.lon! - a.lon!) * rad;
  const lat1 = a.lat! * rad;
  const lat2 = b.lat! * rad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function hasVerifiedLocation(candidate: { lat?: number; lon?: number }): boolean {
  return (
    candidate.lat !== undefined &&
    candidate.lon !== undefined &&
    Number.isFinite(candidate.lat) &&
    Number.isFinite(candidate.lon)
  );
}

/**
 * Keep separate photographs as separate clues. Commons often returns a bulk
 * upload of one storefront or building first; unique file names alone do not
 * make those useful as five different hints.
 */
export function selectDiverseImageCandidates<T extends PlaceImageCandidate>(
  place: Pick<PlaceLike, "name" | "country">,
  candidates: readonly T[],
  max: number,
  options: { maxUnknownLocations?: number } = {},
): T[] {
  if (max <= 0) return [];
  const maxUnknownLocations = Math.max(0, options.maxUnknownLocations ?? 1);
  const placeWords = new Set(tokenise(`${place.name} ${place.country}`));
  const fingerprints = new Map<T, Set<string>>();
  const unique: T[] = [];
  const seenTitles = new Set<string>();

  for (const candidate of candidates) {
    if (!isUsablePhotoTitle(candidate.title)) continue;
    const titleKey = candidate.title.replace(/_/g, " ").toLowerCase();
    if (seenTitles.has(titleKey)) continue;
    seenTitles.add(titleKey);
    fingerprints.set(candidate, titleFingerprint(candidate.title, placeWords));
    unique.push(candidate);
  }

  const selected: T[] = [];
  let unknownLocations = 0;
  // Similarity is transitive: "Peanut Shoppe" -> "Planters Peanuts sign" ->
  // "Planters Columbus" is one subject even though the first/last titles do
  // not share a word. Build those components before ranking by geography.
  const roots = unique.map((_, index) => index);
  const root = (index: number): number => {
    let current = index;
    while (roots[current] !== current) current = roots[current];
    while (roots[index] !== index) {
      const parent = roots[index];
      roots[index] = current;
      index = parent;
    }
    return current;
  };
  for (let i = 0; i < unique.length; i += 1) {
    for (let j = i + 1; j < unique.length; j += 1) {
      if (!sameSubject(fingerprints.get(unique[i])!, fingerprints.get(unique[j])!)) continue;
      const a = root(i);
      const b = root(j);
      if (a !== b) roots[b] = a;
    }
  }
  const subjectOf = new Map(unique.map((candidate, index) => [candidate, root(index)]));
  const usedSubjects = new Set<number>();

  // First favour shots from clearly separate blocks, then relax geography for
  // compact places. Subject similarity remains mandatory in every pass.
  for (const spacingKm of [0.2, 0.075, 0.025] as const) {
    for (const candidate of unique) {
      if (selected.includes(candidate)) continue;
      const subject = subjectOf.get(candidate)!;
      if (usedSubjects.has(subject)) continue;
      const hasLocation = hasVerifiedLocation(candidate);
      if (!hasLocation && unknownLocations >= maxUnknownLocations) continue;
      if (
        spacingKm > 0 &&
        selected.some((other) => distanceBetweenKm(candidate, other) < spacingKm)
      ) {
        continue;
      }
      selected.push(candidate);
      if (!hasLocation) unknownLocations += 1;
      usedSubjects.add(subject);
      if (selected.length >= max) return selected;
    }
  }
  return selected;
}

/** Resolve ambiguous names (for example, Columbus) to the nearby article. */
async function wikiArticleTitle(place: PlaceLike, signal?: AbortSignal): Promise<string> {
  const search = new URL(EN_WIKI);
  search.search = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    origin: "*",
    generator: "search",
    gsrsearch: `${place.name} ${place.country}`,
    gsrnamespace: "0",
    gsrlimit: "8",
    prop: "coordinates",
    coprimary: "primary",
    colimit: "max",
  }).toString();
  try {
    const j = (await getJson(search.toString(), signal)) as {
      query?: {
        pages?: {
          title: string;
          coordinates?: { lat: number; lon: number }[];
        }[];
      };
    };
    const pages = j.query?.pages ?? [];
    const located = pages.filter((page) => page.coordinates?.[0]);
    located.sort(
      (a, b) =>
        distanceBetweenKm(place, a.coordinates![0]) -
        distanceBetweenKm(place, b.coordinates![0]),
    );
    if (located[0]) return located[0].title;
    return pages[0]?.title ?? place.name;
  } catch {
    return place.name;
  }
}

/** Iconic images from the place's Wikipedia article, in page (document) order. */
async function wikiImageTitles(place: PlaceLike, signal?: AbortSignal): Promise<string[]> {
  const article = await wikiArticleTitle(place, signal);
  const title = encodeURIComponent(article.replace(/ /g, "_"));
  try {
    const j = (await getJson(`${WIKI_REST}/${title}`, signal)) as {
      items?: { title?: string; type?: string }[];
    };
    return (j.items ?? [])
      .filter((it) => it.type === "image" && it.title)
      .map((it) => it.title as string);
  } catch {
    return []; // no article / not reachable → geosearch will carry the round
  }
}

/** File titles geotagged near the coordinates, nearest first. */
async function geoImageCandidates(
  place: PlaceLike,
  signal?: AbortSignal,
): Promise<PlaceImageCandidate[]> {
  const geo = new URL(COMMONS);
  geo.search = new URLSearchParams({
    action: "query",
    format: "json",
    origin: "*",
    list: "geosearch",
    gsnamespace: "6", // File:
    gscoord: `${place.lat}|${place.lon}`,
    gsradius: "10000", // metres
    // A city centre can have hundreds of files from one bulk upload. Pull a
    // broad metadata-only pool, then resolve thumbnails for a small diverse set.
    gslimit: String(GEO_RESULT_LIMIT),
    gsprimary: "all",
  }).toString();
  try {
    const j = (await getJson(geo.toString(), signal)) as {
      query?: {
        geosearch?: { title: string; lat: number; lon: number; dist: number }[];
      };
    };
    const hits = j.query?.geosearch ?? [];
    hits.sort((a, b) => a.dist - b.dist);
    return hits.map(({ title, lat, lon }) => ({ title, lat, lon }));
  } catch {
    return [];
  }
}

/**
 * Up to `max` real photos of the place — Wikipedia's iconic shots first, then
 * geotagged Commons pictures to fill. Returns fewer (or none) when coverage is
 * thin, so callers can retry without padding the round with repeats.
 */
export async function fetchPlaceImages(
  place: PlaceLike,
  max = 5,
  signal?: AbortSignal,
): Promise<PlaceImage[]> {
  if (max <= 0) return [];
  const cacheKey = `${place.name}|${place.country}|${place.lat}|${place.lon}|${max}`;
  const cached = completedPhotoCache.get(cacheKey);
  if (cached) return [...cached];
  // Always gather both sources. A page can have plenty of files but still show
  // one subject repeatedly, while a nearest-first geosearch can be dominated by
  // one uploader standing at one set of coordinates.
  const [wikiTitles, geoCandidates] = await Promise.all([
    wikiImageTitles(place, signal),
    geoImageCandidates(place, signal),
  ]);
  const perSource = Math.min(20, Math.max(max * 4, max));
  const wikiCandidates = selectDiverseImageCandidates<PlaceImageCandidate>(
    place,
    wikiTitles.map((title) => ({ title })),
    perSource,
    { maxUnknownLocations: perSource },
  );
  const geoPool = selectDiverseImageCandidates(place, geoCandidates, perSource);
  const candidates = selectDiverseImageCandidates<PlaceImageCandidate>(
    place,
    [...wikiCandidates, ...geoPool],
    API_TITLE_LIMIT,
    // Coordinates are resolved in the imageinfo batch below. Keep article
    // candidates until then; the final selection permits only one unknown.
    { maxUnknownLocations: API_TITLE_LIMIT },
  );
  if (candidates.length === 0) return [];

  // resolve thumbnails + attribution in one batched Commons imageinfo call
  const info = new URL(COMMONS);
  info.search = new URLSearchParams({
    action: "query",
    format: "json",
    origin: "*",
    titles: candidates.map((candidate) => candidate.title).join("|"),
    prop: "imageinfo|coordinates",
    iiprop: "url|mime|mediatype|extmetadata",
    iiextmetadatafilter: "Artist|Categories",
    iiurlwidth: "900",
    coprimary: "all",
    colimit: "max",
  }).toString();

  const ijson = (await getJson(info.toString(), signal)) as {
    query?: {
      pages?: Record<
        string,
        {
          title: string;
          coordinates?: { lat: number; lon: number }[];
          imageinfo?: {
            thumburl?: string;
            url?: string;
            descriptionurl?: string;
            mime?: string;
            mediatype?: string;
            extmetadata?: {
              Artist?: { value?: string };
              Categories?: { value?: string };
            };
          }[];
        }
      >;
    };
  };
  const pages = ijson.query?.pages ?? {};
  // MediaWiki normalises underscores to spaces in returned titles, while the
  // Wikipedia media-list gives underscores — key both sides on a spaced form.
  const key = (t: string) => t.replace(/_/g, " ").toLowerCase();
  const byTitle = new Map<string, (typeof pages)[string]>();
  for (const k in pages) byTitle.set(key(pages[k].title), pages[k]);

  const resolved: (PlaceImageCandidate & { image: PlaceImage })[] = [];
  for (const candidate of candidates) {
    const page = byTitle.get(key(candidate.title));
    const ii = page?.imageinfo?.[0];
    if (!ii?.thumburl || !isPhotographicImageMetadata(ii)) continue;
    const credit = stripHtml(ii.extmetadata?.Artist?.value ?? "");
    resolved.push({
      title: candidate.title,
      lat: page?.coordinates?.[0]?.lat ?? candidate.lat,
      lon: page?.coordinates?.[0]?.lon ?? candidate.lon,
      image: {
        url: ii.thumburl,
        full: ii.url ?? ii.thumburl,
        descUrl: ii.descriptionurl ?? "",
        title: candidate.title,
        credit: credit && credit.length <= 60 ? credit : "Wikimedia Commons",
      },
    });
  }
  // Article imagery remains first for landmark quality, but the final selector
  // permits at most one file without a verified camera location.
  const result = selectDiverseImageCandidates(place, resolved, max).map(({ image }) => image);
  // Cache only a complete clue set. Thin/transient responses remain retryable.
  if (result.length === max) {
    if (completedPhotoCache.size >= 32) {
      completedPhotoCache.delete(completedPhotoCache.keys().next().value!);
    }
    completedPhotoCache.set(cacheKey, result);
  }
  return [...result];
}
