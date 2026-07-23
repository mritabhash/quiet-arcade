/**
 * Mapillary street-level imagery for Map Drop → Moderate (GeoGuessr).
 *
 * Token-gated: reads a public client token from VITE_MAPILLARY_TOKEN. With no
 * token the feature reports itself unconfigured and the Moderate game shows a
 * disabled card instead of any imagery. Uses the anonymous Graph API; a local
 * haversine keeps this module import-light for the node test runner.
 */

const GRAPH = "https://graph.mapillary.com/images";
/** ~0.004° ≈ 400 m half-box around the place coordinate. */
const DEFAULT_HALF_DEG = 0.004;
/** An image counts as "at" the place only within this radius. */
const MAX_MATCH_KM = 0.4;
const RESULT_LIMIT = 50;

export interface StreetImage {
  id: string;
  lat: number;
  lon: number;
}

export interface StreetPlaceLike {
  name: string;
  lat: number;
  lon: number;
}

function token(): string {
  return (import.meta.env.VITE_MAPILLARY_TOKEN as string | undefined)?.trim() ?? "";
}

export function isMapillaryConfigured(): boolean {
  return token().length > 0;
}

export function bboxAround(
  lat: number,
  lon: number,
  halfDeg: number = DEFAULT_HALF_DEG,
): [number, number, number, number] {
  return [lon - halfDeg, lat - halfDeg, lon + halfDeg, lat + halfDeg];
}

function haversineKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const rad = Math.PI / 180;
  const dLat = (bLat - aLat) * rad;
  const dLon = (bLon - aLon) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(aLat * rad) * Math.cos(bLat * rad) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function nearestImage(
  place: { lat: number; lon: number },
  images: StreetImage[],
  maxKm: number = MAX_MATCH_KM,
): StreetImage | null {
  let best: StreetImage | null = null;
  let bestKm = Infinity;
  for (const img of images) {
    const d = haversineKm(place.lat, place.lon, img.lat, img.lon);
    if (d < bestKm) {
      bestKm = d;
      best = img;
    }
  }
  return best && bestKm <= maxKm ? best : null;
}

/**
 * The Mapillary image nearest the place, or null when the token is missing,
 * the request fails, or no imagery lies within MAX_MATCH_KM (no coverage).
 */
export async function findStreetImage(
  place: StreetPlaceLike,
  signal?: AbortSignal,
): Promise<StreetImage | null> {
  const key = token();
  if (!key) return null;
  const [minLon, minLat, maxLon, maxLat] = bboxAround(place.lat, place.lon);
  const url = new URL(GRAPH);
  url.search = new URLSearchParams({
    access_token: key,
    fields: "id,computed_geometry",
    bbox: `${minLon},${minLat},${maxLon},${maxLat}`,
    limit: String(RESULT_LIMIT),
  }).toString();
  try {
    const res = await fetch(url.toString(), { signal });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      data?: { id: string; computed_geometry?: { coordinates?: [number, number] } }[];
    };
    const images: StreetImage[] = (json.data ?? [])
      .map((d) => {
        const c = d.computed_geometry?.coordinates;
        return c ? { id: d.id, lat: c[1], lon: c[0] } : null;
      })
      .filter((v): v is StreetImage => v !== null);
    return nearestImage(place, images);
  } catch {
    return null;
  }
}
