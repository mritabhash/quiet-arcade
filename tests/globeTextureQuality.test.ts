import assert from "node:assert/strict";
import test from "node:test";

import {
  getGlobeMinimumCameraDistance,
  getGlobeTextureSpec,
  isGlobeTextureMemoryConstrained,
} from "../src/lib/globeTextureQuality.ts";

test("selects an 8K 2:1 atlas on desktop-class GPUs", () => {
  assert.deepEqual(getGlobeTextureSpec(16_384, false), {
    width: 8192,
    height: 4096,
  });
});

test("preserves 2:1 fallbacks for constrained and older GPUs", () => {
  assert.deepEqual(getGlobeTextureSpec(16_384, true), {
    width: 4096,
    height: 2048,
  });
  assert.deepEqual(getGlobeTextureSpec(4096, false), {
    width: 4096,
    height: 2048,
  });
  assert.deepEqual(getGlobeTextureSpec(3000, false), {
    width: 2048,
    height: 1024,
  });
});

test("keeps max zoom within the source texture's pixel density", () => {
  const distance = getGlobeMinimumCameraDistance({
    textureWidth: 8192,
    viewportHeight: 440,
    pixelRatio: 2,
    verticalFovDegrees: 45,
  });
  assert.ok(distance > 1.8 && distance < 1.82, `unexpected distance ${distance}`);
});

test("recognises coarse-pointer and low-memory devices", () => {
  assert.equal(isGlobeTextureMemoryConstrained(true, 16), true);
  assert.equal(isGlobeTextureMemoryConstrained(false, 4), true);
  assert.equal(isGlobeTextureMemoryConstrained(false, undefined), true);
  assert.equal(isGlobeTextureMemoryConstrained(false, 8), false);
});
