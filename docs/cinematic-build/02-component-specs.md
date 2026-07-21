# 02 — Component & code specs (file by file)

Companion to `00-plan-and-ledger.md`. Exact implementation contracts so no design
decisions remain at execution time. All new animation utilities MUST have `html.rm` and
`prefers-reduced-motion` kill rules identical in shape to the existing blocks in
`src/index.css`.

## 1. `src/lib/knightState.ts` (new — extraction, zero behavior change)

Move verbatim from `src/components/KnightVigil.tsx`: `KnightActivity`, `ACTIVITIES`,
`CAPTIONS`, `KnightState`, `nextDuration`, `pickActivity`, `loadKnight`, key
`quietArcade.knight`. Add one hook:

```ts
export function useKnightActivity(): KnightActivity
// useState(loadKnight) + the existing 60s interval effect, returns state.activity
```

`KnightVigil.tsx` re-imports from here (its own copies deleted) and KEEPS exporting
`Knight` and `OldMage` — `Cast.tsx` imports them. KnightVigil itself stops being
rendered on Home but stays in the tree for Cast.

## 2. `src/components/CinematicVigil.tsx` (new — the centerpiece)

Rendered by `Home.tsx` in place of `<KnightVigil />`. Structure:

```tsx
export function CinematicVigil() {
  const activity = useKnightActivity();
  const { motionOK } = useSettings();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
  const barScale = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], [0, 1, 1, 0]);
  const mediaY   = useTransform(scrollYProgress, [0, 1], [-20, 20]);   // px
  const mistY    = useTransform(scrollYProgress, [0, 1], [30, -30]);
  ...
}
```

- `<section ref aria-label="The knight's vigil" class="relative min-h-[72svh] overflow-hidden border-y border-[var(--line)] bg-pine-950">`
  plus the existing `sr-only` caption paragraph.
- **Media layer** (`absolute inset-0`, `motion.div style={{ y: mediaY }}` when motionOK):
  - `wantVideo = motionOK && matchMedia("(min-width: 768px)").matches` (evaluate in a
    `useSyncExternalStore` or a mounted-state effect — no SSR here, simple state is fine).
  - When wantVideo: `<video key={activity} class="h-full w-full object-cover object-bottom"
    muted loop playsInline autoPlay preload="none" poster={base + "knight/" + activity + ".webp"}
    src={base + "knight/loops/" + activity + ".mp4"} onError={() => setVideoFailed(true)}>`
    where `base = import.meta.env.BASE_URL`. `videoFailed` (per-activity, reset on
    activity change) drops to the still path.
  - Else: `<img>` of the still with class `qa-kenburns` (motionOK only).
  - IntersectionObserver on the section: `video.pause()` when < 15% visible,
    `video.play().catch(()=>{})` when visible. Also `document.visibilitychange`.
  - Only the current activity's element exists in the DOM — never mount all eight.
  - Activity change: crossfade via AnimatePresence (`motion.div` wrapper, opacity
    0→1 / 1→0, 900ms EASE); under `!motionOK` swap instantly.
- **Grade layer** (`absolute inset-0 pointer-events-none`):
  `bg-gradient-to-t from-pine-950/75 via-pine-950/10 to-pine-950/45` + a second div
  `.grain`. In light theme add `bg-gold-300/10 mix-blend-overlay` warm wash div
  (`dark:hidden`) — footage stays night canon; the wash ties it to parchment pages.
- **Effects layer**: `<EmberField activity={activity} />` (§3), `absolute inset-0`.
- **Letterbox**: two `motion.div`s, `absolute inset-x-0 h-[7svh] bg-pine-950`, top one
  `top-0 origin-top`, bottom `bottom-0 origin-bottom`, `style={{ scaleY: barScale }}`
  (render only when motionOK; otherwise thin static 2svh bars for the cinema frame).
- **Subtitle block** (inside bottom safe area, above the bottom bar, centred,
  `relative z-10 mx-auto max-w-3xl px-4 text-center`):
  - kicker: `qa-fleuron` uppercase tracking widest, gold-300 — `THE VIGIL — HOUR OF THE
    ${activity}` (map: guard→watch, walk→march, gaze→horizon, fight→duel,
    bonfire→bonfire, sleep→stillness, sharpen→whetstone, rest→open sky).
  - caption: `CAPTIONS[activity]` in `font-display text-2xl sm:text-3xl text-sand-50`
    with `.rune-glow`; AnimatePresence fade/slide 12px on activity change.
- **Mist layer**: one absolutely-positioned div with two blurred radial-gradient
  pseudo-blobs (`.qa-mist`, §4), `style={{ y: mistY }}`.

## 3. `src/components/EmberField.tsx` (new)

```tsx
export function EmberField({ activity }: { activity: KnightActivity })
```

One `<canvas class="absolute inset-0 h-full w-full" aria-hidden>`; DPR-aware resize via
ResizeObserver; rAF loop that STOPS (cancelled, not idling) when: `html.rm` present,
tab hidden, or canvas not intersecting viewport. Max 40 particles, object pool, no
allocation in the frame loop. Per-activity config table:

| activity | kind | colors (rgba) | behavior |
|---|---|---|---|
| bonfire | embers ×28 | `224,158,66` / `200,104,66` | spawn lower-centre, rise with sine sway, shrink+fade |
| rest, sleep | fireflies ×10 | `236,208,133` | slow Lissajous drift, pulse alpha; sleep adds star twinkle: 12 fixed points, alpha sine |
| fight | spark bursts | `236,208,133` / `224,158,66` | every 4–7 s burst of 12 radial sparks at 62% width / 40% height, gravity, 0.8 s life |
| guard, walk, gaze, sharpen | moon motes ×16 | `216,221,228` at 0.25 α | slow upward drift with horizontal wander |

Colors are hard-coded rgba (canvas can't read Tailwind classes); they are the palette's
gold-300/clay-400/steel values — keep in a `PALETTE` const with a comment pointing at
index.css.

## 4. `src/index.css` additions (exact blocks)

```css
/* cinematic toolkit */
@keyframes qa-kenburns { 0% { transform: scale(1) translateY(0); }
  100% { transform: scale(1.07) translateY(-1.5%); } }
.qa-kenburns { animation: qa-kenburns 34s ease-in-out infinite alternate; will-change: transform; }

.qa-vignette { position: relative; }
.qa-vignette::after { content: ""; position: absolute; inset: 0; pointer-events: none;
  box-shadow: inset 0 0 120px 30px rgb(18 16 25 / 0.55); }

@keyframes qa-rays { to { transform: rotate(360deg); } }
.qa-rays { position: absolute; inset: -40%; pointer-events: none; opacity: 0.12;
  background: conic-gradient(from 0deg, transparent 0deg 14deg, var(--ember) 17deg,
    transparent 20deg 42deg, var(--ember) 45deg, transparent 48deg 360deg);
  filter: blur(22px); animation: qa-rays 240s linear infinite;
  mask-image: radial-gradient(closest-side, black 30%, transparent 72%); }

.qa-mist { position: absolute; inset: 0; pointer-events: none; opacity: 0.5;
  background:
    radial-gradient(42% 30% at 22% 82%, rgb(108 189 200 / 0.10), transparent 70%),
    radial-gradient(50% 34% at 78% 88%, rgb(160 155 178 / 0.12), transparent 70%);
  filter: blur(6px); }
```

Append `.qa-kenburns` and `.qa-rays` to BOTH existing kill lists (`html.rm { … }` and the
`prefers-reduced-motion` block), exactly like `.anim-*`.

## 5. `src/components/ArcaneScene.tsx` (rewrite of the painted layers)

Keep: component signature, `useHeroParallax`, `farY/midY/nearY` transforms, the `<defs>`
sky gradients as instant-paint fallback. Replace the spire/ridge/gate `<path>` skyline
with stacked images; keep SVG accents on top.

```
<div class="absolute inset-0" aria-hidden>
  <motion.img src={hero/(theme)-sky}  class="absolute inset-0 h-full w-full object-cover"          style={{y: farY}} />
  <motion.img src={hero/(theme)-mid}  class="absolute inset-x-0 bottom-[24%] w-full object-contain object-bottom" style={{y: midY}} />
  <motion.img src={hero/(theme)-fore} class="absolute inset-x-0 bottom-0 w-full object-contain object-bottom"     style={{y: nearY}} />
  <div class="qa-rays hidden dark:block" />           // emanating from the moon side
  <svg …existing orrery + stars + window flickers… /> // accent layer, zIndex above imgs
  <div class="qa-mist" />
</div>
```

- Theme switching mirrors the existing sun/moon trick: render both `<img>` sets, light
  set `dark:hidden`, dark set `hidden dark:block` (6 imgs; browser only fetches the
  visible ones if `loading="lazy"` is NOT used on the active theme — set
  `loading="eager"` + `fetchpriority="high"` on sky, `lazy` on the rest; acceptable
  double-fetch on theme toggle).
- Pointer parallax (desktop + motionOK): `useSpring(useMotionValue(0))` pair driven by a
  `pointermove` listener on the section — mid layer ±6 px, fore ±10 px, sky ±3 px,
  spring `{ stiffness: 40, damping: 14 }`. Remove listener under reduced motion.
- Delete the now-dead skyline path code; KEEP the orrery, stars, monoliths' rune shimmer
  (monolith shapes themselves are replaced by the mid painting), lantern flicker circle
  repositioned onto the painted lantern (tune cx/cy to the actual art after it arrives).
- If `remove_background` cutouts failed (plan §4b fallback): full-frame mid/fore images
  with `mask-image: linear-gradient(to top, black 55%, transparent 82%)` instead of
  object-contain.

## 6. `src/pages/Home.tsx`

- Swap `<KnightVigil />` → `<CinematicVigil />`.
- Add `<link rel="preload" as="image">` for the active theme's `hero-sky` via a small
  effect (read `document.documentElement.classList.contains("dark")`).
- Between major sections insert `<MistDivider />` (new tiny component in `motion.tsx`):
  a `h-24 relative overflow-hidden` band containing a `.qa-mist` div whose `x` drifts
  ±40 px via `useScroll`-driven transform. Place after DailyRiddle and after the ledger.
- Hero content, CTAs, copy: UNCHANGED.

## 7. `src/components/GameCard.tsx` — chamber-door upgrade

- Header (`h-36` div): if `public/chambers/<id>.webp` exists (build a `CHAMBER_ART`
  map with `import.meta.glob("../../public/chambers/*.webp", { eager: true, query: "?url" })`
  — or simply reference by convention and let a broken image fall back), render it as
  `absolute inset-0 object-cover opacity-90` under the existing SVG spires (SVG stays as
  a tinted accent at 40% opacity) with the existing GameIcon floating on top. If card
  art phase was skipped, header is unchanged.
- Hover (motionOK only): 3D tilt — `onPointerMove` sets `rotateX/rotateY` motion values
  clamped ±4°, spring back on leave (`stiffness 150 damping 12`), `transformPerspective:
  900`. Plus a rim-light sweep: absolutely-positioned `bg-gradient-to-r from-transparent
  via-gold-200/25 to-transparent` bar, `x: -120% → 120%` once per hoverStart (600 ms).
  Keep the existing `y: -6` lift.
- Use `mcp__magic__21st_magic_component_inspiration` for tilt-card references BEFORE
  writing; adapt to Tailwind tokens + Grenze; **no new npm deps**.

## 8. `src/App.tsx`

- Existing `Page` blur-fade transition is good — keep. Optional polish: raise exit
  duration to 0.3 and add `filter: blur(0px)` spring; nothing else. Do NOT add
  fade-to-black overlays (too heavy for the quiet vibe).

## 9. Lore & Cast (optional phase)

- Lore: wrap the (upscaled) map in a pan/zoom viewer — reuse the interaction patterns
  from `src/components/ImageLightbox.tsx` (wheel zoom to 4×, drag pan, buttons), root div
  gets `data-lenis-prevent`, plus `.qa-vignette` on the frame.
- Cast: knight and mage sheets swap their art slot to the D1/D2 portraits (`<img>` in the
  same frame the SVG occupied); all other residents keep SVG art. Sheets keep listing the
  SVG source as "drawn form".

## 10. Performance & a11y budgets (hard limits)

- Hero: visible-theme payload ≤ 900 KB total (sky ≤ 350 KB, mid+fore ≤ 550 KB combined).
- Loops: `preload="none"`, one mounted video max, ≤ 4 MB each (target; 1080p std may
  exceed — then ffmpeg re-encode per 01-§E, or serve 720p mini output).
- No layout shift: every media layer is absolutely positioned inside sized sections.
- Canvas: 0 rAF ticks when offscreen/hidden/rm (verify via a counter in dev console).
- `html.rm` walk-through must show: static hero (no parallax/rays), still knight band
  with static caption, no tilt, no kenburns, instant crossfades.
- Keyboard: no new interactive elements in the bands (pure decoration, `aria-hidden`
  media layers, captions readable by SR via existing `sr-only` + visible text).

## 11. Verification checklist (run per phase, all from dev-notes memory)

1. `npx tsc -b` (inside `C:\new\quiet-arcade`) — clean.
2. `npm run lint` — only pre-existing warnings.
3. Preview via launch.json config; real port from preview_logs "Local:" line; app at
   `/quiet-arcade/`.
4. Force each activity: set localStorage `quietArcade.knight` =
   `{"activity":"<name>","startedAt":<now>,"nextChangeAt":<now+3600000>,"recent":[]}` →
   reload → assert video/img `src` via `read_page`/eval (rAF doesn't tick in the hidden
   preview tab — do NOT rely on screenshots for animation).
5. `read_network_requests`: no `loops/*.mp4` fetched before the band nears the viewport;
   only one mp4 in flight ever.
6. Both themes × widths 375 / 768 / 1440: hero layer seams, band crop, card grid.
7. Toggle reduced motion in /settings → §10 rm assertions.
8. Wheel-scroll over Lore map viewer: page must NOT scroll (data-lenis-prevent), same
   as GlobeCanvas behavior.

## 12. Commit plan (branch `cinematic`)

1. `feat(cinematic): extract knight state, add CinematicVigil + EmberField (stills mode)`
2. `feat(cinematic): knight video loops + assets`
3. `feat(cinematic): painted 2.5D hero layers in ArcaneScene`
4. `feat(cinematic): chamber card art + hover tilt, mist dividers, effects toolkit`
5. `feat(cinematic): lore/cast portraits + polish` (optional)
Each commit passes §11.1–2. No push, no merge without the user.
