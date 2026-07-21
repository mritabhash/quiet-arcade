import { useEffect, useRef, useState } from "react";
import { BlurReveal } from "../components/motion";

/**
 * The Lore page: a mythical map of the arcade's world, left unwritten.
 *
 * The map hangs in a pan/zoom viewer — scroll or pinch to zoom in (up to 4×),
 * drag to pan once magnified, and use the + / − / reset controls. The gesture
 * logic mirrors ImageLightbox, but the map is a single fixed asset rather than
 * a PlaceImage, so it lives here as its own small surface. `data-lenis-prevent`
 * stops the page's smooth-scroll from sliding underneath while zooming, and the
 * wheel handler is non-passive so the wheel zooms instead of scrolling.
 */

const MIN_SCALE = 1;
const MAX_SCALE = 4;

function MythicalMap() {
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);

  const clampScale = (s: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));
  const reset = () => {
    setScale(1);
    setTx(0);
    setTy(0);
  };
  const zoomBy = (factor: number) =>
    setScale((s) => {
      const next = clampScale(s * factor);
      if (next === 1) {
        setTx(0);
        setTy(0);
      }
      return next;
    });

  // Non-passive wheel so the wheel zooms the map instead of scrolling the page.
  useEffect(() => {
    const el = surfaceRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomBy(Math.exp(-e.deltaY * 0.0015));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    if (scale <= 1) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, tx, ty };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    setTx(drag.current.tx + (e.clientX - drag.current.x));
    setTy(drag.current.ty + (e.clientY - drag.current.y));
  };
  const onPointerUp = () => {
    drag.current = null;
  };

  const btn =
    "flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-black/30 text-lg font-semibold text-white backdrop-blur-sm transition-colors hover:bg-black/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400";

  return (
    <div className="qa-card qa-vignette grain relative overflow-hidden rounded-3xl">
      <div
        ref={surfaceRef}
        data-lenis-prevent
        className="relative overflow-hidden"
        style={{
          cursor: scale > 1 ? (drag.current ? "grabbing" : "grab") : "zoom-in",
          touchAction: "none",
        }}
        onDoubleClick={() => (scale > 1 ? reset() : zoomBy(2.2))}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <img
          src={`${import.meta.env.BASE_URL}lore-map.webp`}
          alt="A hand-painted map of Arcanum, the arcade's world."
          draggable={false}
          loading="lazy"
          className="block w-full select-none"
          style={{
            transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
            transformOrigin: "center",
            transition: drag.current ? "none" : "transform 0.18s ease-out",
          }}
        />
      </div>

      {/* zoom controls, tucked in the corner over the vignette */}
      <div className="absolute bottom-3 right-3 flex gap-2">
        <button type="button" aria-label="Zoom out" onClick={() => zoomBy(1 / 1.25)} className={btn}>
          −
        </button>
        <button type="button" aria-label="Zoom in" onClick={() => zoomBy(1.25)} className={btn}>
          +
        </button>
        <button type="button" aria-label="Reset view" onClick={reset} className={`${btn} text-sm`}>
          ⟲
        </button>
      </div>
    </div>
  );
}

export function LorePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-6">
      <BlurReveal>
        <p className="qa-fleuron text-xs font-semibold uppercase tracking-[0.32em] text-gold-600 dark:text-gold-300">
          the lore
        </p>
        <h1 className="mt-2 font-display text-4xl font-semibold sm:text-5xl">
          Everything&apos;s Gonna Happen Again
        </h1>
      </BlurReveal>

      <div className="mt-8">
        <MythicalMap />
      </div>

      <p className="mt-4 text-center text-xs text-[var(--ink)]/50">
        Scroll or pinch to zoom · drag to pan · double-click to reset
      </p>

      <p className="mt-6 text-center font-display text-lg italic text-[var(--ink)]/80">
        The story of Arcanum will be told
      </p>
    </div>
  );
}
