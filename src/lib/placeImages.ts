/**
 * Real photos of a Map Drop place, used by moderate mode's picture round.
 *
 * Two free, key-less sources, combined so the pictures actually *hint* at the
 * place rather than being random stock imagery:
 *   1) Wikipedia's own page media (the curated montage / landmark / skyline
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

const COMMONS = "https://commons.wikimedia.org/w/api.php";
const WIKI_REST = "https://en.wikipedia.org/api/rest_v1/page/media-list";

/** Diagrams/heraldry/maps rather than photographs of a place. */
const BANNED =
  /(?:^|[\s_-])(?:map|maps|flag|locator|coat[_\s-]?of[_\s-]?arms|seal|logo|emblem|blazon|diagram|plan|chart|icon|svg)(?:$|[\s_-])/i;
const PHOTO = /\.(?:jpe?g|png)$/i;

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]*>/g, "")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function getJson(url: string, signal?: AbortSignal): Promise<unknown> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/** Iconic images from the place's Wikipedia article, in page (document) order. */
async function wikiImageTitles(name: string, signal?: AbortSignal): Promise<string[]> {
  const title = encodeURIComponent(name.replace(/ /g, "_"));
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
async function geoImageTitles(place: PlaceLike, signal?: AbortSignal): Promise<string[]> {
  const geo = new URL(COMMONS);
  geo.search = new URLSearchParams({
    action: "query",
    format: "json",
    origin: "*",
    list: "geosearch",
    gsnamespace: "6", // File:
    gscoord: `${place.lat}|${place.lon}`,
    gsradius: "10000", // metres
    gslimit: "60",
    gsprimary: "all",
  }).toString();
  try {
    const j = (await getJson(geo.toString(), signal)) as {
      query?: { geosearch?: { title: string; dist: number }[] };
    };
    const hits = j.query?.geosearch ?? [];
    hits.sort((a, b) => a.dist - b.dist);
    return hits.map((h) => h.title);
  } catch {
    return [];
  }
}

/**
 * Up to `max` real photos of the place — Wikipedia's iconic shots first, then
 * geotagged Commons pictures to fill. Returns fewer (or none) when coverage is
 * thin, so callers should fall back to another hint mode.
 */
export async function fetchPlaceImages(
  place: PlaceLike,
  max = 5,
  signal?: AbortSignal,
): Promise<PlaceImage[]> {
  const usable = (ts: string[]) => ts.filter((t) => PHOTO.test(t) && !BANNED.test(t));

  // Wikipedia's iconic shots first; only pay for geosearch if the article is thin.
  let titles = await wikiImageTitles(place.name, signal);
  if (usable(titles).length < max) {
    titles = titles.concat(await geoImageTitles(place, signal));
  }

  const candidates = [...new Set(usable(titles))].slice(0, max * 3);
  if (candidates.length === 0) return [];

  // resolve thumbnails + attribution in one batched Commons imageinfo call
  const info = new URL(COMMONS);
  info.search = new URLSearchParams({
    action: "query",
    format: "json",
    origin: "*",
    titles: candidates.join("|"),
    prop: "imageinfo",
    iiprop: "url|extmetadata",
    iiurlwidth: "900",
  }).toString();

  const ijson = (await getJson(info.toString(), signal)) as {
    query?: {
      pages?: Record<
        string,
        {
          title: string;
          imageinfo?: {
            thumburl?: string;
            url?: string;
            descriptionurl?: string;
            extmetadata?: { Artist?: { value?: string } };
          }[];
        }
      >;
    };
  };
  const pages = ijson.query?.pages ?? {};
  // MediaWiki normalises underscores to spaces in returned titles, while the
  // Wikipedia media-list gives underscores — key both sides on a spaced form.
  const key = (t: string) => t.replace(/_/g, " ");
  const byTitle = new Map<string, (typeof pages)[string]>();
  for (const k in pages) byTitle.set(key(pages[k].title), pages[k]);

  const out: PlaceImage[] = [];
  for (const title of candidates) {
    const ii = byTitle.get(key(title))?.imageinfo?.[0];
    if (!ii?.thumburl) continue;
    const credit = stripHtml(ii.extmetadata?.Artist?.value ?? "");
    out.push({
      url: ii.thumburl,
      full: ii.url ?? ii.thumburl,
      descUrl: ii.descriptionurl ?? "",
      title,
      credit: credit && credit.length <= 60 ? credit : "Wikimedia Commons",
    });
    if (out.length >= max) break;
  }
  return out;
}
