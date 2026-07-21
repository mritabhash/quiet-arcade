import { useEffect, useRef, useState } from "react";
import { useSettings } from "../context/SettingsContext";

/**
 * One shared, very dark ambient loop living behind every page — drifting
 * nebula haze and faint gold motes, filmed once and reused site-wide. It
 * sits at the very back (-z-20), beneath PageAurora's per-page colour tint,
 * held down by a scrim so content always reads first. Mounted only once the
 * browser is idle so it never costs the first paint, paused while the tab is
 * hidden, and skipped entirely under reduced motion (the CSS wash carries on).
 */

const BASE = import.meta.env.BASE_URL;

export function AmbientVideo() {
  const { motionOK, settings } = useSettings();
  const enabled = motionOK;
  // a matched pair: the obsidian-night nebula for dark, a warm parchment-day
  // haze for light. Reduced motion keeps just the CSS wash.
  const src = settings.darkMode ? "ambient-loop.mp4" : "ambient-loop-light.mp4";
  const ref = useRef<HTMLVideoElement>(null);
  const [mount, setMount] = useState(false);
  const [ready, setReady] = useState(false);

  // re-fade when the theme (and therefore the clip) swaps
  useEffect(() => setReady(false), [settings.darkMode]);

  // wait for idle before creating the <video> at all
  useEffect(() => {
    if (!enabled) return;
    const w = window as typeof window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    // timeout so a perpetually-animating page (hero, Lenis) still mounts it
    const id = w.requestIdleCallback
      ? w.requestIdleCallback(() => setMount(true), { timeout: 2000 })
      : window.setTimeout(() => setMount(true), 1400);
    return () => {
      if (w.cancelIdleCallback) w.cancelIdleCallback(id);
      else clearTimeout(id);
    };
  }, [enabled]);

  // kick off playback once mounted, and don't burn cycles on a hidden tab
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (!document.hidden) v.play().catch(() => {});
    const onVis = () => {
      if (document.hidden) v.pause();
      else v.play().catch(() => {});
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [mount]);

  if (!enabled || !mount) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-20 overflow-hidden">
      <video
        key={src}
        ref={ref}
        className={`h-full w-full object-cover transition-opacity duration-[1600ms] ${
          ready ? "opacity-100" : "opacity-0"
        }`}
        src={`${BASE}${src}`}
        muted
        loop
        autoPlay
        playsInline
        preload="auto"
        onCanPlay={() => {
          setReady(true);
          ref.current?.play().catch(() => {});
        }}
      />
      {/* a soft scrim so text never fights the motion */}
      <div className="absolute inset-0 bg-[var(--bg)]/45" />
    </div>
  );
}
