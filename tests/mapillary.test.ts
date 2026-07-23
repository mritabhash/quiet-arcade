import assert from "node:assert/strict";
import test from "node:test";

import { bboxAround, nearestImage, type StreetImage } from "../src/lib/mapillary.ts";

test("bboxAround returns [minLon, minLat, maxLon, maxLat] in order", () => {
  const [minLon, minLat, maxLon, maxLat] = bboxAround(48.0, 2.0, 0.004);
  assert.ok(minLon < maxLon && minLat < maxLat);
  assert.equal(Math.round(minLon * 1000) / 1000, 1.996);
  assert.equal(Math.round(maxLon * 1000) / 1000, 2.004);
  assert.equal(Math.round(minLat * 1000) / 1000, 47.996);
  assert.equal(Math.round(maxLat * 1000) / 1000, 48.004);
});

test("nearestImage picks the closest image within the radius", () => {
  const place = { lat: 48.8584, lon: 2.2945 }; // Eiffel Tower
  const imgs: StreetImage[] = [
    { id: "far", lat: 48.87, lon: 2.31 },
    { id: "near", lat: 48.8585, lon: 2.2946 },
  ];
  assert.equal(nearestImage(place, imgs)?.id, "near");
});

test("nearestImage returns null when nothing is within maxKm", () => {
  const place = { lat: 0, lon: 0 };
  const imgs: StreetImage[] = [{ id: "a", lat: 10, lon: 10 }];
  assert.equal(nearestImage(place, imgs, 0.4), null);
});

test("nearestImage returns null for an empty list", () => {
  assert.equal(nearestImage({ lat: 1, lon: 1 }, []), null);
});
