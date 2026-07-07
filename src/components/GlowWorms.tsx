import { useEffect, useRef } from "react";
import { useSettings } from "../context/SettingsContext";

/**
 * A site-wide drift of glow worms: little luminous bodies with fading
 * segmented tails that meander over the page and shy away from the cursor.
 * Renders on a fixed canvas above the content but below the nav; decorative
 * only, so it never intercepts pointer events. When motion is reduced it
 * settles into a static, faint scatter instead.
 */

interface Worm {
  x: number;
  y: number;
  angle: number;
  turn: number;
  speed: number;
  r: number;
  color: string;
  pulse: number;
  pulseSpeed: number;
  flare: number;
  tail: { x: number; y: number }[];
}

/* weighted palettes from the theme scales — gold-heavy, with sage/teal strays */
const DARK_PALETTE: [string, number][] = [
  ["224,182,84", 5], // gold-300
  ["245,229,184", 2], // gold-100
  ["138,191,162", 2], // sage-300
  ["108,189,200", 1], // teal-300
];
const LIGHT_PALETTE: [string, number][] = [
  ["183,131,37", 5], // gold-500
  ["200,104,66", 2], // clay-400
  ["73,135,106", 2], // sage-500
  ["45,133,149", 1], // teal-500
];

const TAIL = 14;
const SHY_RADIUS = 130;

function pickColor(palette: [string, number][]): string {
  let total = 0;
  for (const [, w] of palette) total += w;
  let roll = Math.random() * total;
  for (const [rgb, w] of palette) {
    roll -= w;
    if (roll <= 0) return rgb;
  }
  return palette[0][0];
}

function wormCount(w: number, h: number): number {
  return Math.max(7, Math.min(15, Math.round((w * h) / 95000)));
}

function makeWorm(w: number, h: number, palette: [string, number][]): Worm {
  const x = Math.random() * w;
  const y = Math.random() * h;
  return {
    x,
    y,
    angle: Math.random() * Math.PI * 2,
    turn: 0,
    speed: 18 + Math.random() * 18,
    r: 1.6 + Math.random() * 1.4,
    color: pickColor(palette),
    pulse: Math.random() * Math.PI * 2,
    pulseSpeed: 0.6 + Math.random() * 0.9,
    flare: 0,
    tail: [{ x, y }],
  };
}

export function GlowWorms() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { motionOK, settings } = useSettings();
  const dark = settings.darkMode;

  useEffect(() => {
    if (!dark) return; // glow worms belong to the dark
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const palette = dark ? DARK_PALETTE : LIGHT_PALETTE;
    /* additive light reads beautifully on parchment-dark; on light sand it
       washes out, so there we draw normal soft orbs a touch stronger */
    const composite = dark ? "lighter" : "source-over";
    const strength = dark ? 1 : 1.35;

    let w = 0;
    let h = 0;
    const worms: Worm[] = [];
    const pointer = { x: -9999, y: -9999 };
    let rafId = 0;
    let last = 0;
    /* episodic presence: the worms come and go on their own schedule,
       fading gently — sometimes visible, sometimes entirely absent */
    let episode = 0;
    let episodeTarget = Math.random() < 0.5 ? 1 : 0;
    let nextEpisodeFlip = performance.now() / 1000 + 6 + Math.random() * 24;

    function resize() {
      if (!canvas || !ctx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      w = rect.width || window.innerWidth;
      h = rect.height || window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const want = wormCount(w, h);
      while (worms.length < want) worms.push(makeWorm(w, h, palette));
      worms.length = Math.min(worms.length, want);
    }

    function drawStatic() {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < wormCount(w, h); i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const rgb = pickColor(palette);
        const g = ctx.createRadialGradient(x, y, 0, x, y, 10);
        g.addColorStop(0, `rgba(${rgb},0.18)`);
        g.addColorStop(1, `rgba(${rgb},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function step(worm: Worm, dt: number, t: number) {
      /* random-walk the turning rate for a meandering, wormy path */
      worm.turn += (Math.random() - 0.5) * 2.4 * dt;
      worm.turn *= 0.96;
      worm.angle += worm.turn * dt * 1.2 + Math.sin(t * 0.3 + worm.pulse) * 0.004;

      /* shy away from the cursor, flaring a little as they flee */
      const dx = worm.x - pointer.x;
      const dy = worm.y - pointer.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < SHY_RADIUS * SHY_RADIUS && d2 > 0.01) {
        const d = Math.sqrt(d2);
        const push = 1 - d / SHY_RADIUS;
        let diff = Math.atan2(dy, dx) - worm.angle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        worm.angle += diff * push * 4 * dt;
        worm.flare = Math.max(worm.flare, push * 0.8);
      }

      worm.x += Math.cos(worm.angle) * worm.speed * dt;
      worm.y += Math.sin(worm.angle) * worm.speed * dt;

      /* wrap around the viewport, dropping the tail so it doesn't streak */
      const m = 24;
      if (worm.x < -m) { worm.x = w + m; worm.tail.length = 0; }
      if (worm.x > w + m) { worm.x = -m; worm.tail.length = 0; }
      if (worm.y < -m) { worm.y = h + m; worm.tail.length = 0; }
      if (worm.y > h + m) { worm.y = -m; worm.tail.length = 0; }

      worm.tail.push({ x: worm.x, y: worm.y });
      if (worm.tail.length > TAIL) worm.tail.shift();

      worm.flare = Math.max(0, worm.flare - dt * 0.7);
    }

    function draw(worm: Worm, t: number) {
      if (!ctx) return;
      const breath = 0.55 + 0.45 * Math.sin(t * worm.pulseSpeed + worm.pulse);
      const glow = (0.1 + 0.16 * breath + worm.flare * 0.22) * strength * episode;
      const rgb = worm.color;

      for (let i = 0; i < worm.tail.length - 1; i++) {
        const seg = worm.tail[i];
        const f = (i + 1) / worm.tail.length;
        ctx.beginPath();
        ctx.arc(seg.x, seg.y, worm.r * (0.35 + 0.65 * f), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb},${(glow * 0.45 * f).toFixed(3)})`;
        ctx.fill();
      }

      const haloR = worm.r * (6 + 3 * breath + worm.flare * 4);
      const g = ctx.createRadialGradient(worm.x, worm.y, 0, worm.x, worm.y, haloR);
      g.addColorStop(0, `rgba(${rgb},${(glow * 0.9).toFixed(3)})`);
      g.addColorStop(0.4, `rgba(${rgb},${(glow * 0.35).toFixed(3)})`);
      g.addColorStop(1, `rgba(${rgb},0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(worm.x, worm.y, haloR, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(worm.x, worm.y, worm.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${rgb},${Math.min(0.85, glow * 2.6).toFixed(3)})`;
      ctx.fill();
    }

    function frame(now: number) {
      rafId = requestAnimationFrame(frame);
      if (!ctx) return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const t = now / 1000;

      /* flip between visible and absent spells at irregular intervals */
      if (t > nextEpisodeFlip) {
        episodeTarget = episodeTarget ? 0 : 1;
        nextEpisodeFlip = t + (episodeTarget ? 25 + Math.random() * 40 : 20 + Math.random() * 70);
      }
      episode += ((episodeTarget - episode) * dt) / 2.5;

      ctx.clearRect(0, 0, w, h);
      if (episode < 0.02) return; // fully faded out — keep the sky empty
      ctx.globalCompositeOperation = composite;
      for (const worm of worms) {
        step(worm, dt, t);
        draw(worm, t);
      }
      ctx.globalCompositeOperation = "source-over";
    }

    function start() {
      if (rafId) return;
      last = performance.now();
      rafId = requestAnimationFrame(frame);
    }

    function stop() {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
    }

    const onResize = () => {
      resize();
      if (!motionOK) drawStatic();
    };
    /* observe the element, not the window: it also catches the first layout
       pass in embedded viewports that report a zero-sized window at mount */
    const observer = new ResizeObserver(() => {
      if (Math.round(w) !== Math.round(canvas.getBoundingClientRect().width) ||
          Math.round(h) !== Math.round(canvas.getBoundingClientRect().height)) {
        onResize();
      }
    });
    observer.observe(canvas);
    const onPointerMove = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
    };
    const onPointerLeave = () => {
      pointer.x = -9999;
      pointer.y = -9999;
    };
    const onVisibility = () => {
      if (document.hidden) stop();
      else if (motionOK) start();
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerleave", onPointerLeave);
    document.addEventListener("visibilitychange", onVisibility);

    resize();
    if (motionOK) start();
    else drawStatic();

    return () => {
      stop();
      observer.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [motionOK, dark]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-30 h-full w-full"
    />
  );
}
