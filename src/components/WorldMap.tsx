import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { COUNTRY_PATHS } from "../data/worldCountries";

/**
 * The shared world map (Natural Earth 110m country outlines) used by
 * the flagship geography games.
 * Interactive when `onPin` is given (click/drag/keyboard to place a pin);
 * otherwise a static result map. `extraPins` render as small neutral
 * markers (e.g. Borderline's guess trail).
 *
 * Zoom: mouse wheel / pinch / on-map buttons, up to MAX_ZOOM. While
 * zoomed, dragging empty water pans; a plain click still drops the pin
 * and dragging the pin itself still moves it. Keyboard: +/- zoom,
 * arrows aim (step shrinks with zoom), Enter drops.
 */

export const toXY = (lon: number, lat: number) => ({ x: lon + 180, y: 90 - lat });

const MAP_W = 360;
const MAP_H = 180;
const MAX_ZOOM = 10;
const MIN_VIEW_W = MAP_W / MAX_ZOOM;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

interface View {
  x: number;
  y: number;
  w: number; // height is always w / 2
}

interface Gesture {
  kind: "pending" | "pan" | "pin" | "pinch";
  startClient: { x: number; y: number };
  startView: View;
  onPinMarker: boolean;
  lastDist?: number;
}

export function WorldMap({
  pin,
  actual,
  extraPins,
  onPin,
  onDropEnd,
  ariaLabel,
}: {
  pin: { x: number; y: number } | null;
  actual: { x: number; y: number } | null;
  extraPins?: { x: number; y: number }[];
  onPin?: (x: number, y: number) => void;
  onDropEnd?: () => void;
  ariaLabel: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [cursor, setCursor] = useState({ x: 180, y: 90 });
  const [view, setView] = useState<View>({ x: 0, y: 0, w: MAP_W });
  const viewRef = useRef(view);
  viewRef.current = view;
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<Gesture | null>(null);
  const interactive = !!onPin;

  const zoom = MAP_W / view.w;
  // map units per "screen unit" — multiply marker sizes by this so they
  // stay the same size on screen at any zoom level
  const u = view.w / MAP_W;

  const toMapPoint = (e: { clientX: number; clientY: number }) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const p = pt.matrixTransform(ctm.inverse());
    return { x: clamp(p.x, 0, MAP_W), y: clamp(p.y, 0, MAP_H) };
  };

  const zoomAt = (mx: number, my: number, factor: number) => {
    setView((v) => {
      const w = clamp(v.w / factor, MIN_VIEW_W, MAP_W);
      if (w === v.w) return v;
      const rx = (mx - v.x) / v.w;
      const ry = (my - v.y) / (v.w / 2);
      return {
        w,
        x: clamp(mx - rx * w, 0, MAP_W - w),
        y: clamp(my - ry * (w / 2), 0, MAP_H - w / 2),
      };
    });
  };

  const resetView = () => setView({ x: 0, y: 0, w: MAP_W });

  /** Pan just enough to keep a point inside the visible window. */
  const ensureVisible = (mx: number, my: number) => {
    setView((v) => {
      const h = v.w / 2;
      const marginX = v.w * 0.08;
      const marginY = h * 0.08;
      let x = v.x;
      let y = v.y;
      if (mx < x + marginX) x = mx - marginX;
      else if (mx > x + v.w - marginX) x = mx - v.w + marginX;
      if (my < y + marginY) y = my - marginY;
      else if (my > y + h - marginY) y = my - h + marginY;
      x = clamp(x, 0, MAP_W - v.w);
      y = clamp(y, 0, MAP_H - h);
      return x === v.x && y === v.y ? v : { ...v, x, y };
    });
  };

  // Wheel zoom needs a non-passive listener so the page doesn't scroll.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const ctm = svg.getScreenCTM();
      if (!ctm) return;
      const p = pt.matrixTransform(ctm.inverse());
      zoomAt(clamp(p.x, 0, MAP_W), clamp(p.y, 0, MAP_H), e.deltaY < 0 ? 1.3 : 1 / 1.3);
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    svg.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      gesture.current = {
        kind: "pinch",
        startClient: { x: e.clientX, y: e.clientY },
        startView: { ...viewRef.current },
        onPinMarker: false,
        lastDist: Math.hypot(a.x - b.x, a.y - b.y),
      };
      return;
    }

    const p = toMapPoint(e);
    if (!p) return;
    let onPinMarker = false;
    if (interactive && pin) {
      const pxPerUnit = svg.clientWidth / viewRef.current.w;
      onPinMarker = Math.hypot(p.x - pin.x, p.y - pin.y) * pxPerUnit < 16;
    }
    gesture.current = {
      kind: "pending",
      startClient: { x: e.clientX, y: e.clientY },
      startView: { ...viewRef.current },
      onPinMarker,
    };
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const g = gesture.current;
    if (!g) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (g.kind === "pinch") {
      if (pointers.current.size < 2) return;
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const mid = toMapPoint({ clientX: (a.x + b.x) / 2, clientY: (a.y + b.y) / 2 });
      if (mid && g.lastDist && g.lastDist > 0) zoomAt(mid.x, mid.y, dist / g.lastDist);
      g.lastDist = dist;
      return;
    }

    const dx = e.clientX - g.startClient.x;
    const dy = e.clientY - g.startClient.y;
    if (g.kind === "pending") {
      if (Math.hypot(dx, dy) < 5) return;
      // dragging the pin (or anywhere at full view) moves the pin;
      // dragging open map while zoomed pans
      g.kind =
        interactive && (g.onPinMarker || g.startView.w === MAP_W) ? "pin" : "pan";
    }

    if (g.kind === "pin") {
      const p = toMapPoint(e);
      if (p) onPin?.(p.x, p.y);
      return;
    }

    // pan
    const svg = svgRef.current;
    if (!svg) return;
    const pxPerUnit = svg.clientWidth / g.startView.w;
    const w = g.startView.w;
    setView({
      w,
      x: clamp(g.startView.x - dx / pxPerUnit, 0, MAP_W - w),
      y: clamp(g.startView.y - dy / pxPerUnit, 0, MAP_H - w / 2),
    });
  };

  const onPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    pointers.current.delete(e.pointerId);
    const g = gesture.current;
    if (!g) return;
    if (g.kind === "pinch") {
      gesture.current = null;
      return;
    }
    if (g.kind === "pending" && interactive) {
      // a plain click (no drag) drops the pin, even while zoomed
      const p = toMapPoint(e);
      if (p) {
        onPin?.(p.x, p.y);
        onDropEnd?.();
      }
    } else if (g.kind === "pin") {
      onDropEnd?.();
    }
    gesture.current = null;
  };

  const onPointerCancel = (e: React.PointerEvent<SVGSVGElement>) => {
    pointers.current.delete(e.pointerId);
    gesture.current = null;
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const cur = pin ?? cursor;
    if (e.key === "+" || e.key === "=") {
      zoomAt(cur.x, cur.y, 1.5);
      e.preventDefault();
      return;
    }
    if (e.key === "-" || e.key === "_") {
      zoomAt(cur.x, cur.y, 1 / 1.5);
      e.preventDefault();
      return;
    }
    if (!onPin) return;
    const step = (e.shiftKey ? 10 : 3) * u;
    const nudge = (dx: number, dy: number) => {
      const nx = clamp(cur.x + dx, 0, MAP_W);
      const ny = clamp(cur.y + dy, 0, MAP_H);
      if (pin) onPin(nx, ny);
      else setCursor({ x: nx, y: ny });
      ensureVisible(nx, ny);
    };
    if (e.key === "ArrowLeft") nudge(-step, 0);
    else if (e.key === "ArrowRight") nudge(step, 0);
    else if (e.key === "ArrowUp") nudge(0, -step);
    else if (e.key === "ArrowDown") nudge(0, step);
    else if (e.key === "Enter" || e.key === " ") {
      onPin(cur.x, cur.y);
      onDropEnd?.();
    } else return;
    e.preventDefault();
  };

  const centerX = view.x + view.w / 2;
  const centerY = view.y + view.w / 4;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--line)]">
      <svg
        ref={svgRef}
        viewBox={`${view.x} ${view.y} ${view.w} ${view.w / 2}`}
        className={`block w-full touch-none bg-teal-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-500 dark:bg-teal-900 ${
          interactive ? "cursor-crosshair" : zoom > 1 ? "cursor-grab" : ""
        }`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onKeyDown={onKeyDown}
        tabIndex={interactive ? 0 : undefined}
        role={interactive ? "application" : "img"}
        aria-label={ariaLabel}
      >
        {COUNTRY_PATHS.map((d, i) => (
          <path
            key={i}
            d={d}
            fillRule="evenodd"
            className="fill-sand-300 stroke-sand-600 dark:fill-pine-700 dark:stroke-pine-500"
            strokeWidth={0.35 * u}
            strokeLinejoin="round"
          />
        ))}

        {interactive && !pin && (
          <g className="pointer-events-none opacity-60">
            <circle
              cx={cursor.x}
              cy={cursor.y}
              r={2.4 * u}
              fill="none"
              stroke="#7d3a27"
              strokeWidth={0.8 * u}
            />
            <path
              d={`M${cursor.x - 5 * u} ${cursor.y} H${cursor.x + 5 * u} M${cursor.x} ${cursor.y - 5 * u} V${cursor.y + 5 * u}`}
              stroke="#7d3a27"
              strokeWidth={0.6 * u}
            />
          </g>
        )}

        {extraPins?.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={1.8 * u}
            fill="#d19e34"
            stroke="#faf6ec"
            strokeWidth={0.5 * u}
            opacity={0.85}
          />
        ))}

        {actual && pin && (
          <motion.line
            x1={pin.x}
            y1={pin.y}
            x2={actual.x}
            y2={actual.y}
            stroke="#7d3a27"
            strokeWidth={0.8 * u}
            strokeDasharray={`${2 * u} ${2 * u}`}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.7, delay: 0.35 }}
          />
        )}

        {actual && (
          <motion.circle
            cx={actual.x}
            cy={actual.y}
            r={2.6 * u}
            fill="#37837b"
            stroke="#faf6ec"
            strokeWidth={0.8 * u}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 15 }}
          />
        )}

        {pin && (
          <motion.g
            initial={{ y: -14 * u, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 18 }}
            className="pointer-events-none"
          >
            <circle
              cx={pin.x}
              cy={pin.y}
              r={2.6 * u}
              fill="#bc6140"
              stroke="#faf6ec"
              strokeWidth={0.8 * u}
            />
          </motion.g>
        )}
      </svg>

      <div className="absolute right-2 top-2 flex flex-col gap-1" role="group" aria-label="Map zoom">
        <ZoomButton label="Zoom in" onClick={() => zoomAt(pin?.x ?? centerX, pin?.y ?? centerY, 1.5)}>
          +
        </ZoomButton>
        <ZoomButton label="Zoom out" onClick={() => zoomAt(centerX, centerY, 1 / 1.5)}>
          −
        </ZoomButton>
        {zoom > 1.01 && (
          <ZoomButton label="Reset zoom" onClick={resetView}>
            <span className="text-[10px] font-bold">1×</span>
          </ZoomButton>
        )}
      </div>

      {zoom > 1.01 && (
        <p
          aria-hidden
          className="pointer-events-none absolute bottom-2 left-2 rounded-full bg-[var(--card)]/85 px-2.5 py-1 text-[10px] font-semibold qa-muted"
        >
          {zoom.toFixed(1)}× · drag water to pan
        </p>
      )}
    </div>
  );
}

function ZoomButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--line)] bg-[var(--card)] text-base font-bold shadow-sm transition-colors hover:bg-[var(--card-2)] focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
    >
      {children}
    </button>
  );
}
