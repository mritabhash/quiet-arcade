export const GLOBE_TEXTURE_MAX_WIDTH = 8192;
export const GLOBE_TEXTURE_CONSTRAINED_WIDTH = 4096;

export interface GlobeTextureSpec {
  width: number;
  height: number;
}

/**
 * Pick the sharpest 2:1 globe texture that the GPU and memory budget support.
 * WebGL texture limits are normally powers of two, but rounding down also gives
 * a predictable fallback for mocked/older capabilities.
 */
export function getGlobeTextureSpec(
  maxTextureSize: number,
  memoryConstrained: boolean,
): GlobeTextureSpec {
  const safeMax = Math.max(2, Math.floor(maxTextureSize));
  const supportedPowerOfTwo = 2 ** Math.floor(Math.log2(safeMax));
  const preferredWidth = memoryConstrained
    ? GLOBE_TEXTURE_CONSTRAINED_WIDTH
    : GLOBE_TEXTURE_MAX_WIDTH;
  const width = Math.min(preferredWidth, supportedPowerOfTwo);
  return { width, height: width / 2 };
}

/**
 * Use 8K only when the browser positively reports desktop-class memory.
 * Firefox/Safari do not expose deviceMemory, so they take the safe 4K path.
 */
export function isGlobeTextureMemoryConstrained(
  coarsePointer: boolean,
  deviceMemoryGb?: number,
): boolean {
  return coarsePointer || deviceMemoryGb === undefined || deviceMemoryGb <= 4;
}

/**
 * Minimum camera distance for approximately one source texel per rendered
 * pixel at the centre of the globe. This prevents zoom from merely enlarging
 * the texture. Derived by matching equirectangular texels/radian to the camera's
 * projected pixels/radian at the sphere's front surface.
 */
export function getGlobeMinimumCameraDistance({
  textureWidth,
  viewportHeight,
  pixelRatio,
  verticalFovDegrees,
  radius = 1,
}: {
  textureWidth: number;
  viewportHeight: number;
  pixelRatio: number;
  verticalFovDegrees: number;
  radius?: number;
}): number {
  const safeTextureWidth = Math.max(1, textureWidth);
  const physicalHeight = Math.max(1, viewportHeight) * Math.max(0.1, pixelRatio);
  const halfFov = (Math.max(1, Math.min(179, verticalFovDegrees)) * Math.PI) / 360;
  return radius + (Math.PI * physicalHeight) / (Math.tan(halfFov) * safeTextureWidth);
}
