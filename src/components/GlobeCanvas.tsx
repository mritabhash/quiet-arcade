import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { getGlobeMapGeometry } from "../data/globeMap50m";
import {
  getGlobeMinimumCameraDistance,
  getGlobeTextureSpec,
  isGlobeTextureMemoryConstrained,
} from "../lib/globeTextureQuality";

/**
 * A rotatable 3D globe (Three.js) used by Map Drop's easy mode — the
 * MapTap-style "tap where this is" game. The Earth texture is painted locally
 * from Natural Earth's 1:50m country/coast vectors, so it remains deterministic
 * and does not depend on an external tile server.
 *
 * Placement is a tap, not a drag: a short press without much travel raycasts
 * onto the sphere and reports the lat/lon. A longer drag spins the globe. When
 * `guess`/`answer` are set, they render as pins with a great-circle arc between.
 *
 * Keyboard fallback (when `interactive`): the container is focusable; arrow keys
 * spin the globe and a fixed centre reticle marks the aim, Enter/Space drops the
 * guess at whatever the reticle is over. This makes pin placement pointer-free.
 */

export type LatLon = { lat: number; lon: number };

const R = 1;
const OCEAN = "#12303a";
const LAND = "#5c8f6b";
const LAND_LINE = "#3f6b50";
const GUESS_COLOR = "#e0b654"; // gold — the player's tap
const ANSWER_COLOR = "#5bbfb0"; // teal — the true location
const ARC_COLOR = "#e9c46a";

/** lat/lon → point on the sphere, aligned with the equirectangular texture. */
function latLonToVec3(lat: number, lon: number, r = R): THREE.Vector3 {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  );
}

/** inverse of the above — a sphere point back to lat/lon. */
function vec3ToLatLon(p: THREE.Vector3): LatLon {
  const v = p.clone().normalize();
  const lat = 90 - (Math.acos(v.y) * 180) / Math.PI;
  let lon = (Math.atan2(v.z, -v.x) * 180) / Math.PI - 180;
  if (lon < -180) lon += 360;
  if (lon > 180) lon -= 360;
  return { lat, lon };
}

/** Unwrap a geographic line, then paint the copies intersecting the map seam. */
function traceWrappedLine(
  ctx: CanvasRenderingContext2D,
  coordinates: readonly (readonly [number, number])[],
  close: boolean,
): void {
  if (coordinates.length === 0) return;
  const unwrapped: [number, number][] = [];
  let previousLongitude = coordinates[0][0];
  let minLongitude = previousLongitude;
  let maxLongitude = previousLongitude;
  unwrapped.push([previousLongitude, coordinates[0][1]]);
  for (let i = 1; i < coordinates.length; i++) {
    let longitude = coordinates[i][0];
    while (longitude - previousLongitude > 180) longitude -= 360;
    while (longitude - previousLongitude < -180) longitude += 360;
    unwrapped.push([longitude, coordinates[i][1]]);
    previousLongitude = longitude;
    minLongitude = Math.min(minLongitude, longitude);
    maxLongitude = Math.max(maxLongitude, longitude);
  }

  const firstCopy = Math.ceil((-180 - maxLongitude) / 360);
  const lastCopy = Math.floor((180 - minLongitude) / 360);
  for (let copy = firstCopy; copy <= lastCopy; copy++) {
    const shift = copy * 360;
    ctx.moveTo(unwrapped[0][0] + shift + 180, 90 - unwrapped[0][1]);
    for (let i = 1; i < unwrapped.length; i++) {
      ctx.lineTo(unwrapped[i][0] + shift + 180, 90 - unwrapped[i][1]);
    }
    if (close) ctx.closePath();
  }
}

/** Paint an opaque high-resolution atlas for this mounted globe. */
function landTexture(width: number, anisotropy: number): THREE.CanvasTexture {
  const height = width / 2;
  const cv = document.createElement("canvas");
  cv.width = width;
  cv.height = height;
  const ctx = cv.getContext("2d", { alpha: false });
  if (!ctx) throw new Error(`Could not allocate ${width}x${height} globe atlas`);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.fillStyle = OCEAN;
  ctx.fillRect(0, 0, width, height);
  ctx.save();
  ctx.scale(width / 360, height / 180);

  const { landRings, borderLines } = getGlobeMapGeometry();
  ctx.fillStyle = LAND;
  ctx.beginPath();
  for (const ring of landRings) traceWrappedLine(ctx, ring, true);
  ctx.fill("evenodd");

  ctx.strokeStyle = LAND_LINE;
  // Two source texels: readable when distant, still crisp at maximum zoom.
  ctx.lineWidth = 720 / width;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  for (const line of borderLines) traceWrappedLine(ctx, line, false);
  ctx.stroke();
  ctx.restore();

  const tex = new THREE.CanvasTexture(
    cv,
    THREE.UVMapping,
    THREE.RepeatWrapping,
    THREE.ClampToEdgeWrapping,
    THREE.LinearFilter,
    THREE.LinearMipmapLinearFilter,
    THREE.RGBAFormat,
    THREE.UnsignedByteType,
    anisotropy,
  );
  tex.name = `Natural Earth 50m ${width}x${height}`;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = true;
  return tex;
}

/** If a large canvas allocation is rejected, retry at the next safe tier. */
function landTextureWithFallback(
  preferredWidth: number,
  anisotropy: number,
): { texture: THREE.CanvasTexture; width: number } {
  let width = preferredWidth;
  let lastError: unknown;
  while (width >= 2) {
    try {
      return { texture: landTexture(width, anisotropy), width };
    } catch (error) {
      lastError = error;
      width = Math.floor(width / 2);
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Could not allocate globe atlas");
}

function makePin(color: string): THREE.Mesh {
  const geo = new THREE.SphereGeometry(0.022, 16, 16);
  const mat = new THREE.MeshBasicMaterial({ color });
  return new THREE.Mesh(geo, mat);
}

/** A raised great-circle arc between two lat/lon points, as a line. */
function makeArc(a: LatLon, b: LatLon): THREE.Line {
  const va = latLonToVec3(a.lat, a.lon).normalize();
  const vb = latLonToVec3(b.lat, b.lon).normalize();
  const steps = 64;
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const p = new THREE.Vector3().copy(va).lerp(vb, t).normalize();
    const lift = 1 + 0.18 * Math.sin(Math.PI * t); // bow the arc off the surface
    pts.push(p.multiplyScalar(R * lift));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineBasicMaterial({ color: ARC_COLOR });
  return new THREE.Line(geo, mat);
}

export function GlobeCanvas({
  interactive,
  onTap,
  guess,
  answer,
  showArc,
  className,
  ariaLabel,
}: {
  interactive: boolean;
  onTap?: (lat: number, lon: number) => void;
  guess?: LatLon | null;
  answer?: LatLon | null;
  showArc?: boolean;
  className?: string;
  ariaLabel?: string;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<THREE.Mesh | null>(null);
  const overlayRef = useRef<THREE.Group | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const onTapRef = useRef(onTap);
  const interactiveRef = useRef(interactive);
  const touchedRef = useRef(false);
  /** set inside the scene effect; multiplies the camera distance (< 1 = zoom in). */
  const zoomByRef = useRef<(factor: number) => void>(() => {});
  const [focused, setFocused] = useState(false);

  onTapRef.current = onTap;
  interactiveRef.current = interactive;

  /** Keyboard control: arrows spin the globe, Enter/Space drops at the reticle. */
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!interactive) return;
    const globe = globeRef.current;
    const camera = cameraRef.current;
    if (!globe || !camera) return;
    const STEP = 0.12; // radians per key press (~7°)
    let pitch = 0;
    let yaw = 0;
    switch (e.key) {
      case "ArrowUp":
        pitch = -STEP;
        break;
      case "ArrowDown":
        pitch = STEP;
        break;
      case "ArrowLeft":
        yaw = -STEP;
        break;
      case "ArrowRight":
        yaw = STEP;
        break;
      case "+":
      case "=":
        e.preventDefault();
        zoomByRef.current(0.85); // closer
        return;
      case "-":
      case "_":
        e.preventDefault();
        zoomByRef.current(1 / 0.85); // farther
        return;
      case "Enter":
      case " ": {
        e.preventDefault();
        if (!onTapRef.current) return;
        // raycast through the view centre — the point under the reticle
        const rc = new THREE.Raycaster();
        rc.setFromCamera(new THREE.Vector2(0, 0), camera);
        const hit = rc.intersectObject(globe, false)[0];
        if (hit) {
          const local = globe.worldToLocal(hit.point.clone());
          const { lat, lon } = vec3ToLatLon(local);
          onTapRef.current(lat, lon);
        }
        return;
      }
      default:
        return;
    }
    e.preventDefault();
    touchedRef.current = true; // stop the idle spin so the aim holds still
    const dq = new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch, yaw, 0, "XYZ"));
    globe.quaternion.premultiply(dq);
  };

  // ---- one-time scene setup ------------------------------------------------
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 3);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.cursor = "grab";
    renderer.domElement.style.touchAction = "none";
    rendererRef.current = renderer;

    const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    const memoryConstrained = isGlobeTextureMemoryConstrained(
      window.matchMedia?.("(pointer: coarse)").matches ?? false,
      deviceMemory,
    );
    const preferredTextureSpec = getGlobeTextureSpec(
      renderer.capabilities.maxTextureSize,
      memoryConstrained,
    );
    const allocatedTexture = landTextureWithFallback(
      preferredTextureSpec.width,
      Math.max(1, renderer.capabilities.getMaxAnisotropy()),
    );
    const texture = allocatedTexture.texture;
    const textureSpec = {
      width: allocatedTexture.width,
      height: allocatedTexture.width / 2,
    };

    const globe = new THREE.Mesh(
      new THREE.SphereGeometry(R, 128, 96),
      new THREE.MeshBasicMaterial({ map: texture }),
    );
    globe.rotation.y = -Math.PI / 2; // start looking at the Atlantic/Africa
    scene.add(globe);
    globeRef.current = globe;

    const overlay = new THREE.Group();
    globe.add(overlay); // pins/arc ride along with the globe's rotation
    overlayRef.current = overlay;

    // ---- zoom: dolly the camera along its z axis ---------------------------
    const ABSOLUTE_MIN_DIST = 1.45; // geometry safety floor (R = 1)
    const MAX_DIST = 4.5; // farthest — the whole globe with a margin
    let minDist = ABSOLUTE_MIN_DIST;
    let dist = 3;
    const applyZoom = (next: number) => {
      dist = Math.min(MAX_DIST, Math.max(minDist, next));
      camera.position.z = dist;
    };
    zoomByRef.current = (factor: number) => applyZoom(dist * factor);

    const resize = () => {
      const w = mount.clientWidth || 1;
      const h = mount.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      // Do not let zoom magnify a map texel beyond roughly one screen pixel.
      minDist = Math.min(
        MAX_DIST,
        Math.max(
          ABSOLUTE_MIN_DIST,
          getGlobeMinimumCameraDistance({
            textureWidth: textureSpec.width,
            viewportHeight: h,
            pixelRatio: renderer.getPixelRatio(),
            verticalFovDegrees: camera.fov,
            radius: R,
          }),
        ),
      );
      applyZoom(dist);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    // ---- pointer: tap vs. drag vs. two-finger pinch ------------------------
    const raycaster = new THREE.Raycaster();
    const pointers = new Map<number, { x: number; y: number }>();
    let contextLost = false;
    let moved = 0;
    let didPinch = false;
    let pinchStartGap = 0;
    let pinchStartDist = 0;
    let last = { x: 0, y: 0 };
    const el = renderer.domElement;
    const onContextLost = (event: Event) => {
      event.preventDefault();
      contextLost = true;
    };
    const onContextRestored = () => {
      contextLost = false;
      texture.needsUpdate = true;
    };
    const gap = () => {
      const [a, b] = [...pointers.values()];
      return Math.hypot(a.x - b.x, a.y - b.y);
    };

    const onDown = (e: PointerEvent) => {
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      el.setPointerCapture(e.pointerId);
      el.style.cursor = "grabbing";
      if (pointers.size === 1) {
        moved = 0;
        didPinch = false;
        last = { x: e.clientX, y: e.clientY };
      } else if (pointers.size === 2) {
        didPinch = true; // a second finger cancels any tap intent
        pinchStartGap = gap();
        pinchStartDist = dist;
      }
    };
    const onMove = (e: PointerEvent) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      touchedRef.current = true;
      if (pointers.size >= 2) {
        // pinch: fingers apart → smaller distance → zoom in
        if (pinchStartGap > 0) applyZoom((pinchStartDist * pinchStartGap) / gap());
        return;
      }
      const dx = e.clientX - last.x;
      const dy = e.clientY - last.y;
      moved += Math.abs(dx) + Math.abs(dy);
      last = { x: e.clientX, y: e.clientY };
      const dq = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(dy * 0.005, dx * 0.005, 0, "XYZ"),
      );
      globe.quaternion.premultiply(dq);
    };
    const onUp = (e: PointerEvent) => {
      const had = pointers.has(e.pointerId);
      pointers.delete(e.pointerId);
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
      if (pointers.size === 0) {
        el.style.cursor = "grab";
        // a lone short press with little travel is a tap → place a guess
        if (had && !didPinch && moved < 6 && interactiveRef.current && onTapRef.current) {
          const rect = el.getBoundingClientRect();
          const ndc = new THREE.Vector2(
            ((e.clientX - rect.left) / rect.width) * 2 - 1,
            -((e.clientY - rect.top) / rect.height) * 2 + 1,
          );
          raycaster.setFromCamera(ndc, camera);
          const hit = raycaster.intersectObject(globe, false)[0];
          if (hit) {
            const local = globe.worldToLocal(hit.point.clone());
            const { lat, lon } = vec3ToLatLon(local);
            onTapRef.current(lat, lon);
          }
        }
      } else if (pointers.size === 1) {
        // dropped from a pinch back to one finger — reset the drag baseline
        const [p] = [...pointers.values()];
        last = { x: p.x, y: p.y };
      }
    };
    // Wheel-to-zoom is bound to the whole map zone (the canvas's parent), not
    // just the canvas, so scrolling anywhere over it — including the zoom
    // buttons or the hint bar — zooms and never scrolls the page.
    const zone = mount.parentElement ?? el;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      touchedRef.current = true;
      applyZoom(dist * Math.exp(e.deltaY * 0.001));
    };
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("webglcontextlost", onContextLost);
    el.addEventListener("webglcontextrestored", onContextRestored);
    zone.addEventListener("wheel", onWheel, { passive: false });

    let raf = 0;
    const tick = () => {
      // gentle idle spin until the player grabs it
      if (interactiveRef.current && pointers.size === 0 && !touchedRef.current) {
        globe.rotateY(0.0015);
      }
      if (!contextLost) renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("webglcontextlost", onContextLost);
      el.removeEventListener("webglcontextrestored", onContextRestored);
      zone.removeEventListener("wheel", onWheel);
      texture.dispose();
      renderer.dispose();
      globe.geometry.dispose();
      (globe.material as THREE.Material).dispose();
      if (el.parentNode) el.parentNode.removeChild(el);
    };
  }, []);

  // ---- reflect guess / answer / arc into the overlay -----------------------
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    // clear previous pins/arc
    for (const child of [...overlay.children]) {
      overlay.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        (child.material as THREE.Material).dispose();
      } else if (child instanceof THREE.Line) {
        child.geometry.dispose();
        (child.material as THREE.Material).dispose();
      }
    }
    if (guess) {
      const pin = makePin(GUESS_COLOR);
      pin.position.copy(latLonToVec3(guess.lat, guess.lon, R * 1.01));
      overlay.add(pin);
    }
    if (answer) {
      const pin = makePin(ANSWER_COLOR);
      pin.position.copy(latLonToVec3(answer.lat, answer.lon, R * 1.01));
      overlay.add(pin);
    }
    if (showArc && guess && answer) {
      overlay.add(makeArc(guess, answer));
    }
  }, [guess, answer, showArc]);

  return (
    <div
      className={`relative outline-none ${
        interactive ? "focus-visible:ring-2 focus-visible:ring-teal-400" : ""
      } ${className ?? ""}`}
      tabIndex={interactive ? 0 : -1}
      role={interactive ? "application" : undefined}
      aria-label={interactive ? ariaLabel : undefined}
      aria-hidden={interactive ? undefined : true}
      // keep Lenis smooth-scroll from scrolling the page when the wheel is used
      // to zoom the globe (our own non-passive wheel handler does the zooming)
      data-lenis-prevent
      onKeyDown={onKeyDown}
      onFocus={() => {
        if (!interactive) return;
        touchedRef.current = true; // hold the aim steady for keyboard users
        setFocused(true);
      }}
      onBlur={() => setFocused(false)}
    >
      {/* dedicated host for the Three.js canvas — no React children here */}
      <div ref={mountRef} className="absolute inset-0" aria-hidden />
      {interactive && focused && (
        <svg
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          width="30"
          height="30"
          viewBox="0 0 30 30"
        >
          <circle cx="15" cy="15" r="9" fill="none" stroke={GUESS_COLOR} strokeWidth="2" />
          <circle cx="15" cy="15" r="1.6" fill={GUESS_COLOR} />
        </svg>
      )}
      <div className="absolute right-3 top-3 flex flex-col gap-1.5">
        <button
          type="button"
          aria-label="Zoom in"
          onClick={() => zoomByRef.current(0.8)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/45 text-lg font-semibold text-sand-50 backdrop-blur-sm transition-colors hover:bg-black/65 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
        >
          +
        </button>
        <button
          type="button"
          aria-label="Zoom out"
          onClick={() => zoomByRef.current(1 / 0.8)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/45 text-lg font-semibold text-sand-50 backdrop-blur-sm transition-colors hover:bg-black/65 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
        >
          −
        </button>
      </div>
    </div>
  );
}
