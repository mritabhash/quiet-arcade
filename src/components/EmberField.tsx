import { useEffect, useRef } from "react";
import type { KnightActivity } from "../lib/knightState";
import { useSettings } from "../context/SettingsContext";

/**
 * The air of the vigil: embers over her fire, fireflies at rest, sparks at
 * the duel, moon-dust everywhere else. One pooled canvas, at most forty
 * motes, and the loop is cancelled outright when the band is offscreen, the
 * tab is hidden, or the reader has asked for stillness.
 */

/** Canvas can't read Tailwind classes; these mirror index.css tokens. */
const PALETTE = {
  ember: "224,158,66", // gold-400
  emberDeep: "200,104,66", // clay-400
  spark: "236,208,133", // gold-200
  dust: "216,221,228", // steel highlight
};

type Kind = "embers" | "fireflies" | "sparks" | "dust";

const KIND_OF: Record<KnightActivity, Kind> = {
  bonfire: "embers",
  rest: "fireflies",
  sleep: "fireflies",
  fight: "sparks",
  guard: "dust",
  walk: "dust",
  gaze: "dust",
  sharpen: "dust",
};

const COUNT: Record<Kind, number> = { embers: 28, fireflies: 10, sparks: 40, dust: 16 };

interface Mote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  life: number;
  maxLife: number;
  phase: number;
  colour: string;
  on: boolean;
}

function makeMote(): Mote {
  return { x: 0, y: 0, vx: 0, vy: 0, r: 1, life: 0, maxLife: 1, phase: 0, colour: PALETTE.dust, on: false };
}

export function EmberField({ activity }: { activity: KnightActivity }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { motionOK } = useSettings();

  useEffect(() => {
    if (!motionOK) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const kind = KIND_OF[activity];
    const pool: Mote[] = Array.from({ length: COUNT[kind] }, makeMote);
    let w = 0;
    let h = 0;
    let raf = 0;
    let running = false;
    let visible = false;
    let last = 0;
    let burstAt = 0;
    // sleep keeps a fixed constellation rather than drifting motes
    const stars = Array.from({ length: 12 }, () => ({ x: Math.random(), y: Math.random() * 0.55, p: Math.random() * 6.28 }));

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const spawn = (m: Mote, initial: boolean) => {
      m.on = true;
      m.phase = Math.random() * Math.PI * 2;
      if (kind === "embers") {
        m.x = w * (0.44 + Math.random() * 0.16);
        m.y = h * (initial ? 0.6 + Math.random() * 0.35 : 0.92);
        m.vx = (Math.random() - 0.5) * 8;
        m.vy = -(16 + Math.random() * 26);
        m.r = 1 + Math.random() * 1.8;
        m.maxLife = 2.4 + Math.random() * 2.6;
        m.colour = Math.random() < 0.35 ? PALETTE.emberDeep : PALETTE.ember;
      } else if (kind === "fireflies") {
        m.x = w * Math.random();
        m.y = h * (0.4 + Math.random() * 0.5);
        m.vx = (Math.random() - 0.5) * 6;
        m.vy = (Math.random() - 0.5) * 5;
        m.r = 1.2 + Math.random() * 1.1;
        m.maxLife = 8 + Math.random() * 8;
        m.colour = PALETTE.spark;
      } else if (kind === "dust") {
        m.x = w * Math.random();
        m.y = h * (initial ? Math.random() : 1.02);
        m.vx = (Math.random() - 0.3) * 5;
        m.vy = -(3 + Math.random() * 7);
        m.r = 0.8 + Math.random() * 1.4;
        m.maxLife = 9 + Math.random() * 9;
        m.colour = PALETTE.dust;
      } else {
        // sparks are only lit by a burst
        m.on = false;
      }
      m.life = initial ? Math.random() * m.maxLife : 0;
    };

    const burst = () => {
      const cx = w * 0.62;
      const cy = h * 0.4;
      let lit = 0;
      for (const m of pool) {
        if (m.on || lit >= 12) continue;
        const a = Math.random() * Math.PI * 2;
        const speed = 40 + Math.random() * 90;
        m.on = true;
        m.x = cx + (Math.random() - 0.5) * 10;
        m.y = cy + (Math.random() - 0.5) * 10;
        m.vx = Math.cos(a) * speed;
        m.vy = Math.sin(a) * speed - 20;
        m.r = 1 + Math.random() * 1.6;
        m.life = 0;
        m.maxLife = 0.8;
        m.colour = Math.random() < 0.5 ? PALETTE.spark : PALETTE.ember;
        lit++;
      }
    };

    const frame = (t: number) => {
      const dt = Math.min((t - last) / 1000 || 0, 0.05);
      last = t;
      ctx.clearRect(0, 0, w, h);

      if (kind === "sparks" && t > burstAt) {
        burst();
        burstAt = t + 4000 + Math.random() * 3000;
      }

      if (activity === "sleep") {
        for (const s of stars) {
          const a = 0.25 + 0.45 * (0.5 + 0.5 * Math.sin(t / 900 + s.p));
          ctx.fillStyle = `rgba(${PALETTE.dust},${a})`;
          ctx.beginPath();
          ctx.arc(s.x * w, s.y * h, 1.1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      for (const m of pool) {
        if (!m.on) continue;
        m.life += dt;
        if (m.life >= m.maxLife) {
          if (kind === "sparks") {
            m.on = false;
            continue;
          }
          spawn(m, false);
          continue;
        }
        const k = m.life / m.maxLife;

        if (kind === "embers") {
          m.x += (m.vx + Math.sin(t / 700 + m.phase) * 9) * dt;
          m.y += m.vy * dt;
        } else if (kind === "fireflies") {
          m.x += (m.vx + Math.sin(t / 1600 + m.phase) * 7) * dt;
          m.y += (m.vy + Math.cos(t / 2100 + m.phase) * 6) * dt;
        } else if (kind === "dust") {
          m.x += (m.vx + Math.sin(t / 2600 + m.phase) * 4) * dt;
          m.y += m.vy * dt;
        } else {
          m.vy += 120 * dt; // sparks fall
          m.x += m.vx * dt;
          m.y += m.vy * dt;
        }

        // fade in and out; fireflies also pulse
        let alpha = Math.sin(Math.PI * k);
        if (kind === "fireflies") alpha *= 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t / 500 + m.phase));
        if (kind === "dust") alpha *= 0.3;
        if (alpha <= 0.01) continue;

        ctx.fillStyle = `rgba(${m.colour},${alpha})`;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fill();

        if (kind !== "dust") {
          ctx.fillStyle = `rgba(${m.colour},${alpha * 0.16})`;
          ctx.beginPath();
          ctx.arc(m.x, m.y, m.r * 3.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (running) return;
      running = true;
      last = performance.now();
      burstAt = last + 800;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      if (!running) return;
      running = false;
      cancelAnimationFrame(raf);
      ctx.clearRect(0, 0, w, h);
    };
    const sync = () => {
      if (visible && !document.hidden) start();
      else stop();
    };

    resize();
    for (const m of pool) spawn(m, true);

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        sync();
      },
      { threshold: 0.05 },
    );
    io.observe(canvas);
    document.addEventListener("visibilitychange", sync);

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [activity, motionOK]);

  if (!motionOK) return null;
  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden />;
}
