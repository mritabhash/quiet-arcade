import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { PlaceImage } from "../lib/placeImages";

/**
 * A full-screen viewer for a Map Drop moderate-mode photo: open a picture to
 * inspect it up close. Zoom with the wheel / pinch / + − buttons, pan by
 * dragging when zoomed, and close with Escape, the ✕, or a backdrop click.
 *
 * `data-lenis-prevent` keeps the page's smooth-scroll from moving underneath,
 * and the wheel handler is non-passive so scrolling zooms rather than scrolls.
 */

const MIN_SCALE = 1;
const MAX_SCALE = 6;

export function ImageLightbox({ img, onClose }: { img: PlaceImage; onClose: () => void }) {
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

  // Escape / +- keyboard, and lock body scroll while open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "+" || e.key === "=") zoomBy(1.25);
      else if (e.key === "-" || e.key === "_") zoomBy(1 / 1.25);
      else if (e.key === "0") reset();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  // Non-passive wheel so it zooms instead of scrolling the page.
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

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/85 backdrop-blur-sm"
      data-lenis-prevent
      role="dialog"
      aria-modal="true"
      aria-label="Inspect photo"
      onClick={onClose}
    >
      <div className="flex items-center justify-end gap-2 p-3" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          aria-label="Zoom out"
          onClick={() => zoomBy(1 / 1.25)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-xl font-semibold text-white transition-colors hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
        >
          −
        </button>
        <button
          type="button"
          aria-label="Zoom in"
          onClick={() => zoomBy(1.25)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-xl font-semibold text-white transition-colors hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
        >
          +
        </button>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-xl font-semibold text-white transition-colors hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
        >
          ✕
        </button>
      </div>

      <div
        ref={surfaceRef}
        className="flex flex-1 items-center justify-center overflow-hidden p-4"
        style={{ cursor: scale > 1 ? (drag.current ? "grabbing" : "grab") : "zoom-in", touchAction: "none" }}
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={() => (scale > 1 ? reset() : zoomBy(2.5))}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <img
          src={img.full}
          onError={(e) => {
            // fall back to the 900px thumbnail if the original won't load
            if (e.currentTarget.src !== img.url) e.currentTarget.src = img.url;
          }}
          alt="Photo clue, enlarged for inspection"
          referrerPolicy="no-referrer"
          draggable={false}
          className="max-h-full max-w-full select-none rounded-lg object-contain shadow-2xl"
          style={{ transform: `translate(${tx}px, ${ty}px) scale(${scale})`, transformOrigin: "center" }}
        />
      </div>

      <div
        className="flex items-center justify-between gap-3 p-3 text-xs text-white/70"
        onClick={(e) => e.stopPropagation()}
      >
        <span>Scroll or pinch to zoom · drag to pan · Esc to close</span>
        <span className="truncate">{img.credit} · Wikimedia Commons</span>
      </div>
    </div>,
    document.body,
  );
}
