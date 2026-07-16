// Regenerates src/data/shapes.ts — every country as a normalized silhouette.
//
// Source: world-atlas/countries-110m.json (Natural Earth, public domain), read
// via topojson-client. Each country is projected equirectangularly (x = lon,
// y = -lat so north is up), rotated whole across the antimeridian when it spans
// it (Russia, USA, Fiji), then scaled to fit a 100x100 viewBox with 4-unit
// padding, aspect preserved, centered. Rings live in one path string; render
// with fillRule="evenodd" so enclaves punch through.
//
//   node scripts/genShapes.mjs

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";
import { feature } from "topojson-client";

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const topo = require("world-atlas/countries-110m.json");
const fc = feature(topo, topo.objects.countries);

const PAD = 4;
const SPAN = 100 - PAD * 2; // 92

// Not sovereign countries / de-facto territories — leave these out.
const DROP = new Set([
  "Antarctica",
  "Fr. S. Antarctic Lands",
  "N. Cyprus",
  "Somaliland",
]);

// Prettier display names for the abbreviated Natural Earth labels.
// A value of null drops the entry.
const RENAME = {
  "United States of America": "United States",
  "Dem. Rep. Congo": "DR Congo",
  "Central African Rep.": "Central African Republic",
  "Bosnia and Herz.": "Bosnia and Herzegovina",
  "Dominican Rep.": "Dominican Republic",
  "S. Sudan": "South Sudan",
  "W. Sahara": "Western Sahara",
  "Eq. Guinea": "Equatorial Guinea",
  "Solomon Is.": "Solomon Islands",
  "Falkland Is.": "Falkland Islands",
  "Lao PDR": "Laos",
  "Dem. Rep. Korea": "North Korea",
  "Republic of Korea": "South Korea",
  Korea: "South Korea",
  Macedonia: "North Macedonia",
  "Republic of Serbia": "Serbia",
  "United Republic of Tanzania": "Tanzania",
  "Czech Rep.": "Czechia",
  eSwatini: "Eswatini",
  Swaziland: "Eswatini",
  "The Bahamas": "Bahamas",
  "Timor-Leste": "East Timor",
  "Br. Indian Ocean Ter.": null,
};

function ringsOf(geom) {
  if (geom.type === "Polygon") return geom.coordinates;
  if (geom.type === "MultiPolygon") return geom.coordinates.flat();
  return [];
}

function fmt(n) {
  return String(+n.toFixed(1));
}

const shapes = [];

for (const f of fc.features) {
  let name = f.properties?.name ?? "";
  if (name in RENAME) {
    if (RENAME[name] === null) continue;
    name = RENAME[name];
  }
  if (DROP.has(name)) continue;

  const rings = ringsOf(f.geometry);
  if (!rings.length) continue;

  // Antimeridian: if the country spans more than half the globe in longitude,
  // shift the western lobe east by 360 so the outline stays continuous.
  let minLon = Infinity;
  let maxLon = -Infinity;
  for (const ring of rings) {
    for (const [lon] of ring) {
      if (lon < minLon) minLon = lon;
      if (lon > maxLon) maxLon = lon;
    }
  }
  const wrap = maxLon - minLon > 180;

  // Project to (x, y): x = wrapped lon, y = -lat (north up).
  const projected = rings.map((ring) =>
    ring.map(([lon, lat]) => [wrap && lon < 0 ? lon + 360 : lon, -lat]),
  );

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const ring of projected) {
    for (const [x, y] of ring) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  const w = maxX - minX;
  const h = maxY - minY;
  const s = SPAN / Math.max(w, h);
  const offX = PAD + (SPAN - w * s) / 2;
  const offY = PAD + (SPAN - h * s) / 2;

  const parts = [];
  for (const ring of projected) {
    let d = "";
    let prev = "";
    let pts = 0;
    for (const [x, y] of ring) {
      const nx = fmt(offX + (x - minX) * s);
      const ny = fmt(offY + (y - minY) * s);
      const token = `${nx} ${ny}`;
      if (token === prev) continue; // drop coincident points after rounding
      d += (d === "" ? "M" : "L") + token;
      prev = token;
      pts++;
    }
    if (pts >= 3) parts.push(d + "Z");
  }
  if (!parts.length) continue;

  shapes.push({ name, path: parts.join("") });
}

shapes.sort((a, b) => a.name.localeCompare(b.name));

const body = shapes
  .map((s) => `  { name: ${JSON.stringify(s.name)}, paths: [${JSON.stringify(s.path)}] },`)
  .join("\n");

const out = `/**
 * GENERATED FILE — do not hand-edit. Run \`node scripts/genShapes.mjs\`.
 *
 * Country silhouettes for Country Shape — every country from Natural Earth 110m
 * (world-atlas/countries-110m.json, public domain), normalized into a 100x100
 * viewBox (north up, aspect preserved, antimeridian countries rotated whole).
 * A country's rings live in ONE path string — render with fillRule="evenodd"
 * so enclaves (e.g. the Lesotho hole in South Africa) punch through.
 */

export interface CountryShape {
  name: string;
  paths: string[];
}

export const COUNTRY_SHAPES: CountryShape[] = [
${body}
];
`;

writeFileSync(join(root, "src/data/shapes.ts"), out);
console.log(`Wrote ${shapes.length} country shapes to src/data/shapes.ts`);
