import type { Geometry, Position } from "geojson";
import { feature, mesh } from "topojson-client";
import type { GeometryCollection, Objects, Topology } from "topojson-specification";
import atlasJson from "world-atlas/countries-50m.json";

/** Natural Earth medium-scale vectors, decoded once and shared by every globe. */
export const GLOBE_MAP_SOURCE = "Natural Earth 1:50m";

export type GlobeCoordinate = readonly [longitude: number, latitude: number];

export interface GlobeMapGeometry {
  landRings: readonly (readonly GlobeCoordinate[])[];
  borderLines: readonly (readonly GlobeCoordinate[])[];
  coordinateCount: number;
}

interface AtlasObjects extends Objects {
  countries: GeometryCollection;
  land: GeometryCollection;
}

const topology = atlasJson as unknown as Topology<AtlasObjects>;
let cachedGeometry: GlobeMapGeometry | null = null;

function asCoordinate(position: Position): GlobeCoordinate {
  return [position[0], position[1]];
}

function appendLandRings(
  geometry: Geometry,
  output: GlobeCoordinate[][],
): void {
  if (geometry.type === "Polygon") {
    for (const ring of geometry.coordinates) output.push(ring.map(asCoordinate));
    return;
  }
  if (geometry.type === "MultiPolygon") {
    for (const polygon of geometry.coordinates) {
      for (const ring of polygon) output.push(ring.map(asCoordinate));
    }
    return;
  }
  if (geometry.type === "GeometryCollection") {
    for (const child of geometry.geometries) appendLandRings(child, output);
  }
}

export function getGlobeMapGeometry(): GlobeMapGeometry {
  if (cachedGeometry) return cachedGeometry;

  const land = feature(topology, topology.objects.land);
  const landRings: GlobeCoordinate[][] = [];
  for (const landFeature of land.features) {
    if (landFeature.geometry) appendLandRings(landFeature.geometry, landRings);
  }

  // mesh() emits each shared country/coast arc once, avoiding doubled borders.
  const borderLines = mesh(topology, topology.objects.countries).coordinates.map(
    (line) => line.map(asCoordinate),
  );
  const coordinateCount =
    landRings.reduce((total, ring) => total + ring.length, 0) +
    borderLines.reduce((total, line) => total + line.length, 0);

  cachedGeometry = { landRings, borderLines, coordinateCount };
  return cachedGeometry;
}
