import { useEffect, useRef } from "react";
import { useSettings } from "../context/SettingsContext";

/**
 * Occasional ambient rain on a fixed canvas. Showers arrive at random —
 * more often (and a touch heavier) in dark mode — fall for a while, then
 * drift off. Between showers the canvas is completely idle. Fades in and
 * out over a few seconds so it never pops. Disabled under reduced motion.
 */

interface Drop {
  x: number;
  y: number;
  len: number;
  speed: number;
  drift: number;
  alpha: number;
}

/** seconds */
const SHOWER_MIN = 35;
const SHOWER_MAX = 80;
const LULL_MIN = 90;
const LULL_MAX = 300;
const FADE_SECONDS = 4;

const rand = (min: number, max: number) => min + Math.random() * (max - min);

export function AmbientRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { motionOK, settings } = useSettings();
  const dark = settings.darkMode;

  useEffect(() => {
    if (!motionOK) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    /* dark mode rains more often and a little denser */
    const showerChance = dark ? 0.6 : 0.25;
    const density = dark ? 90 : 45;
    const color = dark ? "168,196,204" : "78,118,128";
    const baseAlpha = dark ? 0.16 : 0.1;

    let w = 0;
    let h = 0;
    let drops: Drop[] = [];
    let rafId = 0;
    let last = 0;
    /* 0 = dry lull, 1 = raining; alpha eases toward the target */
    let raining = false;
    let intensity = 0;
    let nextFlip = performance.now() / 1000 + rand(8, 40);

    function resize() {
      if (!canvas || !ctx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function makeDrops() {
      drops = Array.from({ length: density }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        len: rand(7, 16),
        speed: rand(340, 560),
        drift: rand(-24, -8),
        alpha: rand(0.35, 1),
      }));
    }

    function frame(now: number) {
      rafId = requestAnimationFrame(frame);
      if (!ctx) return;
      const t = now / 1000;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      if (t > nextFlip) {
        if (raining) {
          raining = false;
          nextFlip = t + rand(LULL_MIN, LULL_MAX);
        } else if (Math.random() < showerChance) {
          raining = true;
          if (drops.length === 0) makeDrops();
          nextFlip = t + rand(SHOWER_MIN, SHOWER_MAX);
        } else {
          /* the sky considered it, and passed — check again soon */
          nextFlip = t + rand(30, 90);
        }
      }

      const target = raining ? 1 : 0;
      intensity += (target - intensity) * Math.min(1, dt / (FADE_SECONDS / 3));

      ctx.clearRect(0, 0, w, h);
      if (intensity < 0.01) {
        if (!raining) drops = [];
        return;
      }

      ctx.lineCap = "round";
      ctx.lineWidth = 1;
      for (const d of drops) {
        d.y += d.speed * dt;
        d.x += d.drift * dt;
        if (d.y > h + d.len) {
          d.y = -d.len - Math.random() * 40;
          d.x = Math.random() * (w + 60);
        }
        ctx.strokeStyle = `rgba(${color},${(baseAlpha * d.alpha * intensity).toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x + d.drift * 0.04 * d.len, d.y - d.len);
        ctx.stroke();
      }
    }

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      } else if (!rafId) {
        last = performance.now();
        rafId = requestAnimationFrame(frame);
      }
    };

    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);
    resize();
    last = performance.now();
    rafId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [motionOK, dark]);

  if (!motionOK) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-20 h-full w-full"
    />
  );
}
