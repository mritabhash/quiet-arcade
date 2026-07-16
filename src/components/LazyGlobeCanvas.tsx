import { lazy, Suspense } from "react";
import type { GlobeCanvasProps } from "./GlobeCanvas";

const DetailedGlobeCanvas = lazy(() =>
  import("./GlobeCanvas").then(({ GlobeCanvas }) => ({ default: GlobeCanvas })),
);

/** Load the detailed world atlas only when a globe is actually on screen. */
export function LazyGlobeCanvas(props: GlobeCanvasProps) {
  return (
    <Suspense
      fallback={
        <div
          className={`flex items-center justify-center bg-[#0b2731] ${props.className ?? ""}`}
          role="status"
          aria-label="Loading detailed globe"
        >
          <span className="text-sm font-medium text-sand-50/70">Loading detailed globe…</span>
        </div>
      }
    >
      <DetailedGlobeCanvas {...props} />
    </Suspense>
  );
}
