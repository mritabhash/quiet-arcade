import assert from "node:assert/strict";
import test from "node:test";

import {
  selectDiverseImageCandidates,
  type PlaceImageCandidate,
} from "../src/lib/placeImages.ts";

const COLUMBUS = { name: "Columbus", country: "United States" };

const storefrontBurst: PlaceImageCandidate[] = [
  { title: "File:Peanut Shoppe Columbus.jpg", lat: 39.959914, lon: -82.999961 },
  { title: "File:Ohio Theater closed.jpg", lat: 39.960117, lon: -82.999983 },
  {
    title: "File:Planters Peanuts shop sign, Fifth Third Center, Columbus, OH 2024-04-12.jpg",
    lat: 39.959938,
    lon: -83.000229,
  },
  { title: "File:Planters Columbus.jpg", lat: 39.960314, lon: -83.00025 },
  {
    title: "File:Back of Gillig Low Floor BRT Plus COTA CMAX 1720.jpg",
    lat: 39.960381,
    lon: -83.000175,
  },
  { title: "File:Ohio Statehouse Summer.jpg", lat: 39.96035, lon: -82.999542 },
];

test("turns the exact Columbus storefront regression into five distinct clues", () => {
  const candidates = [
    ...storefrontBurst,
    { title: "File:Ohio Stadium Overhead.jpg", lat: 40.0017, lon: -83.0197 },
    { title: "File:Franklin Park Conservatory.jpg", lat: 39.9653, lon: -82.953 },
    { title: "File:Scioto Mile and skyline.jpg", lat: 39.956, lon: -83.007 },
    { title: "File:German Village brick street.jpg", lat: 39.947, lon: -82.997 },
    { title: "File:North Market entrance.jpg", lat: 39.971, lon: -83.004 },
  ];

  const first = selectDiverseImageCandidates(COLUMBUS, candidates, 5);
  const second = selectDiverseImageCandidates(COLUMBUS, candidates, 5);

  assert.equal(first.length, 5);
  assert.deepEqual(
    first.map(({ title }) => title),
    second.map(({ title }) => title),
    "selection must be deterministic",
  );
  assert.equal(
    first.filter(({ title }) => /peanut|planter/i.test(title)).length,
    1,
    "one storefront must not masquerade as several clues",
  );
});

test("normalises spelling and numbered bulk-upload variants", () => {
  const picked = selectDiverseImageCandidates(
    COLUMBUS,
    [
      { title: "File:Ohio_Theatre,_Columbus,_OH.jpg" },
      { title: "File:Ohio Theater, Columbus, OH - 48310718507.jpg" },
      { title: "File:Columbus, Ohio Ɱ 114.jpg" },
      { title: "File:Columbus, Ohio Ɱ 116.jpg" },
      { title: "File:Columbus at night.jpg" },
    ],
    5,
  );

  assert.equal(picked.filter(({ title }) => /theat/i.test(title)).length, 1);
  assert.equal(picked.filter(({ title }) => /Ɱ/.test(title)).length, 1);
  assert.equal(picked.length, 3);
});

test("returns fewer clues instead of padding a thin pool with repeats", () => {
  const picked = selectDiverseImageCandidates(
    COLUMBUS,
    storefrontBurst.filter(({ title }) => /peanut|planter/i.test(title)),
    5,
  );

  assert.equal(picked.length, 1);
});

test("rejects maps, montages, heraldry, and other non-photo assets", () => {
  const picked = selectDiverseImageCandidates(
    { name: "Asmara", country: "Eritrea" },
    [
      { title: "File:Asmara_Montage.png" },
      { title: "File:Asmara_coats_of_arms_with_transparent_background.png" },
      { title: "File:Mappa_di_Asmara_TCI_1929.jpg" },
      { title: "File:Map_of_Asmara.jpg" },
      { title: "File:Asmara_map.jpg" },
      { title: "File:Asmara_1935_Panorama_(2567806345).jpg" },
      { title: "File:Solar_traffic_light_Asmara,_Eritrea.jpg" },
    ],
    5,
  );

  assert.deepEqual(
    picked.map(({ title }) => title),
    [
      "File:Asmara_1935_Panorama_(2567806345).jpg",
      "File:Solar_traffic_light_Asmara,_Eritrea.jpg",
    ],
  );
});

test("does not turn one camera position into five unrelated clues", () => {
  const coordinate = { lat: 39.9599, lon: -83.0002 };
  const picked = selectDiverseImageCandidates(
    COLUMBUS,
    [
      { title: "File:North entrance.jpg", ...coordinate },
      { title: "File:Interior lobby.jpg", ...coordinate },
      { title: "File:Roof detail.jpg", ...coordinate },
      { title: "File:Window display.jpg", ...coordinate },
      { title: "File:Street sign.jpg", ...coordinate },
    ],
    5,
  );

  assert.equal(picked.length, 1);
});
