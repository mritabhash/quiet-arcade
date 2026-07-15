import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { COUNTRY_PATHS } from "../data/worldCountries";

/**
 * A rotatable 3D globe (Three.js) used by Map Drop's easy mode — the
 * MapTap-style "tap where this is" game. The Earth texture is painted from the
 * app's own Natural Earth country outlines (COUNTRY_PATHS, equirectangular
 * x = lon + 180, y = 90 - lat), so no external map image is needed.
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

/** Paint the land texture from COUNTRY_PATHS once, then reuse it. */
let cachedTexture: THREE.CanvasTexture | null = null;
function landTexture(): THREE.CanvasTexture {
  if (cachedTexture) return cachedTexture;
  const W = 2048;
  const H = 1024;
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext("2d")!;
  ctx.fillStyle = OCEAN;
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.scale(W / 360, H / 180); // map units (0..360, 0..180) → canvas pixels
  ctx.fillStyle = LAND;
  ctx.strokeStyle = LAND_LINE;
  ctx.lineWidth = 0.3;
  ctx.lineJoin = "round";
  for (const d of COUNTRY_PATHS) {
    const path = new Path2D(d);
    ctx.fill(path, "evenodd");
    ctx.stroke(path);
  }
  ctx.restore();
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  cachedTexture = tex;
  return tex;
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
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.cursor = "grab";
    renderer.domElement.style.touchAction = "none";
    rendererRef.current = renderer;

    const globe = new THREE.Mesh(
      new THREE.SphereGeometry(R, 64, 64),
      new THREE.MeshBasicMaterial({ map: landTexture() }),
    );
    globe.rotation.y = -Math.PI / 2; // start looking at the Atlantic/Africa
    scene.add(globe);
    globeRef.current = globe;

    const overlay = new THREE.Group();
    globe.add(overlay); // pins/arc ride along with the globe's rotation
    overlayRef.current = overlay;

    const resize = () => {
      const w = mount.clientWidth || 1;
      const h = mount.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    // ---- zoom: dolly the camera along its z axis ---------------------------
    const MIN_DIST = 1.45; // closest before clipping the sphere (R = 1)
    const MAX_DIST = 4.5; // farthest — the whole globe with a margin
    let dist = 3;
    const applyZoom = (next: number) => {
      dist = Math.min(MAX_DIST, Math.max(MIN_DIST, next));
      camera.position.z = dist;
    };
    zoomByRef.current = (factor: number) => applyZoom(dist * factor);

    // ---- pointer: tap vs. drag vs. two-finger pinch ------------------------
    const raycaster = new THREE.Raycaster();
    const pointers = new Map<number, { x: number; y: number }>();
    let moved = 0;
    let didPinch = false;
    let pinchStartGap = 0;
    let pinchStartDist = 0;
    let last = { x: 0, y: 0 };
    const el = renderer.domElement;
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
    zone.addEventListener("wheel", onWheel, { passive: false });

    let raf = 0;
    const tick = () => {
      // gentle idle spin until the player grabs it
      if (interactiveRef.current && pointers.size === 0 && !touchedRef.current) {
        globe.rotateY(0.0015);
      }
      renderer.render(scene, camera);
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
      zone.removeEventListener("wheel", onWheel);
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
