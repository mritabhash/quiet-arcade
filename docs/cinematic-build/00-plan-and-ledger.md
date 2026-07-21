# Quiet Arcade — Cinematic Makeover: plan & asset ledger

**Written:** 2026-07-21 (planning session, Fable). **Executor:** Opus 4.8, next session.
**Companion docs:** `01-asset-prompts.md` (every generation prompt + exact tool params,
copy-paste ready) · `02-component-specs.md` (file-by-file code contracts, CSS blocks,
perf budgets, verification checklist, commit plan). Read all three before starting.
**Goal:** Visual makeover — cinematic, painterly, 2.5D-AAA-game feel (Arcane-adjacent art
direction) — while keeping the site's existing vibe intact: parchment grimoire (light) /
obsidian arcanum (dark), Grenze Gotisch type, teal/gold/clay/pine palette, calm and quiet,
full reduced-motion support. The centerpiece is the **female knight section** (KnightVigil):
replace the hand-drawn SVGs with Higgsfield-generated cinematic imagery + video and layered
effects.

**User's directives (verbatim intent):**
- "more interactive, it should look more like a thing in the world of arcane"
- "make the female knight section more cinematic and epic, use the higgsfield instead of
  using svgs everywhere, use various effects"
- "Keep the overall vibe of the website intact tho"
- "For image generation use gpt 2 and video use seedance"
- "Use scroll world, 21st dev and stuff" → `scroll-experience` skill + `mcp__magic__*`
  (21st.dev) tools
- "The artstyle is impostant, it should be cinematic, like 2.5d AAA game"

---

## 0. Ground truth (verified 2026-07-21)

- Repo `C:\new\quiet-arcade`, branch `versus-1v1` with **uncommitted versus WIP** (14
  modified + 9 untracked files — Nav, VersusShell, MapDrop, Trivia, supabase/…). Do NOT
  lose or mix this in.
- Higgsfield MCP (server id `16f414a9-e1dd-4f31-bd05-1e8166bec72a`): **1,121.5 credits**,
  Plus plan. Prior session's in-flight generations are NOT in history — regenerate.
- Models confirmed available:
  - **`gpt_image_2`** (image; 1k/2k/4k; quality low/medium/high; accepts reference image
    via `medias` role `image`; AR incl. 16:9, 3:2, 2:3 — **no 21:9**).
  - **`seedance_2_0`** (video; 4–15 s; 480p→4k std; roles `start_image`, `end_image`,
    `image_references`; `generate_audio:false` for silent loops; AR incl. 16:9 & 21:9;
    `genre:"epic"`). Budget fallback: `seedance_2_0_mini` (720p max).
- Existing character canon: `public/knight/*.webp` — 8 consistent keyart stills
  (`guard, walk, gaze, fight, bonfire, sleep, sharpen, rest`), 16:9, generated 2026-07-09
  from `docs/knight-prompts.md`. **These are the identity reference. Reuse them.**
- Dev quirks (details in memory `quiet-arcade-dev-notes`): Vite base `/quiet-arcade/`;
  launch.json pins 5173 but vite honors `$PORT`; verify with `npx tsc -b` (inside project
  dir) + `npm run lint`; Lenis smooth-scroll is global — any wheel-capturing area needs
  `data-lenis-prevent`; the hidden preview tab never ticks rAF, so verify animations via
  DOM/eval, not screenshots; GateGuard denies the first Bash/Edit/Write per file — state
  facts and retry (for new files: write stub → retry → then full write).
- Current visual stack to build on (don't rewrite wholesale):
  - `src/pages/Home.tsx` — hero (ArcaneScene + parallax) → DailyRiddle → KnightVigil →
    ledger → games grid → house rites.
  - `src/components/ArcaneScene.tsx` — flat-SVG parallax skyline (3 depth groups via
    framer `useTransform`), light/dark via Tailwind `dark:` classes.
  - `src/components/KnightVigil.tsx` — 918 lines of hand-drawn SVG knight/mage/bonfire +
    an activity state machine (localStorage `quietArcade.knight`, ≥1 h per activity,
    avoids last 2). **The state machine stays; the SVG rendering goes.**
  - `src/index.css` — palette tokens, `.grain`, `.rune-glow`, `qa-*` keyframes, `html.rm`
    reduced-motion kill-switches. Extend, don't break.

---

## 1. Art direction (LOCKED — read before generating anything)

Every generated asset must read as one world. Base prompt template (adapted from
`docs/knight-prompts.md`, which already produced the canon stills):

> Epic modern fantasy key art, masterful cinematic digital painting, painterly
> hand-painted textures with visible brushwork, dramatic volumetric lighting and strong
> rim light, 2.5D game keyart depth (crisp foreground, atmospheric hazy background),
> deep teal-blue night grade with tarnished-gold accents and terracotta ember warmth.
> Immaculate detail, serene and majestic mood. No text, no watermark.

- Palette anchors (must appear in prompts): deep teal `#2d8595`, tarnished gold
  `#e0b654`, terracotta clay `#ae4d2c`, obsidian violet `#1b1824`, parchment `#efe5ca`.
- **Do not name copyrighted IP in prompts** (no "Arcane", "League of Legends",
  "Fortiche"). Describe the attributes instead: painterly texture, stylized realism,
  dramatic rim light, cel-painted highlights.
- Character consistency: upload `public/knight/guard.webp` once via `media_upload` +
  `media_confirm`, then pass its media id as the `image` reference in every
  `gpt_image_2` call that shows the knight; describe her anyway (chestnut hair, silver
  circlet with teal gem, teal-enamel plate with gold filigree, terracotta cape).
- Light-theme assets are "parchment day": same world at golden late afternoon, warm haze
  — NOT a generic sunny day.

## 2. Budget guardrails (1,121.5 credits total)

| Envelope | Cap | Notes |
|---|---|---|
| Knight videos (seedance) | ≤ 450 | Generate ONE first, note actual cost from the job result, then decide tier 2. |
| Hero layers (gpt_image_2) | ≤ 200 | 2k/medium quality. |
| Game-card art (gpt_image_2) | ≤ 150 | 1k/low is fine at card size. Optional phase — skip if over budget. |
| Cast portraits + lore upscale | ≤ 80 | Optional phase. |
| Reserve (retries, user asks) | ≥ 240 | Never dip below this. |

Rules: call `balance` before each phase and log it in the ledger (§8). One retry max per
asset, then move on with the best take. Prefer regenerating a prompt over upscaling a bad
image.

---

## 3. Phase 0 — safety rails (do this first)

1. `git status` — confirm the versus WIP matches §0. Commit it to `versus-1v1` as a WIP
   commit (`git add -A && git commit -m "wip(versus): checkpoint before cinematic makeover"`).
   Do not push unless the user asks.
2. Branch: `git checkout -b cinematic` (from versus-1v1, so the makeover sits on top of
   the current live feature set).
3. `preview_start` with the launch.json config; confirm the app renders at
   `/quiet-arcade/` before touching anything (real port from preview_logs "Local:" line).
4. `balance` → log starting credits in §8.

## 4. Phase 1 — asset generation (start everything early; builds continue while jobs run)

### 4a. Knight cinematic loops (seedance_2_0) — the centerpiece assets

For each activity, upload the existing still (`public/knight/<name>.webp`) via
`media_upload`/`media_confirm` and generate image-to-video with it as `start_image`:

- Params: `duration: 8`, `resolution: "1080p"`, `mode: "std"`, `generate_audio: false`,
  `aspect_ratio: "auto"`, `genre: "epic"`.
- Prompt pattern (subtle, loop-friendly — the scene must feel ALIVE, not busy):
  camera nearly static or a 5% slow push-in; describe only ambient motion; end frame
  should resemble the start frame so the loop seam is soft.

| # | Activity | Motion prompt core | Tier |
|---|---|---|---|
| 1 | guard | cape and hair stir in slow wind, moonlit haze drifts, distant grass ripples; she blinks once, breathes; embers of moonlight dust float | 1 |
| 2 | bonfire | flames lick and flicker casting warm dancing light on her armour, sparks and embers rise, thin smoke curls; she flexes her fingers toward the heat | 1 |
| 3 | walk | she strides slowly left-to-right, cape trailing, heather parting; moon haze drifts opposite | 1 |
| 4 | fight | a thin arc of orange spell-light crackles from the mage's staff orb to her raised blade, gold sparks burst at the contact point; both hold their stance, capes whipping | 1 |
| 5 | gaze | wind lifts her cape, tiny birds cross the far sky, haze rolls over the moor | 2 |
| 6 | sharpen | whetstone strokes glint along the blade, small gold sparks, rhythmic and calm | 2 |
| 7 | sleep | utterly still night; stars twinkle, her breathing gently rises and falls, moonlight pulses softly | 2 |
| 8 | rest | two gold fireflies drift lazy circles around her, cape edge flutters, stars shimmer | 2 |

Generate #1 first → record cost → if (8 × cost) > 450 credits, do tier 1 at 1080p and
tier 2 with `seedance_2_0_mini` at 720p (or leave tier 2 as Ken Burns stills — the
component in §5 must treat video as progressive enhancement anyway).

Post-process each: download mp4 (curl the result `rawUrl`), save to
`public/knight/loops/<name>.mp4`. Target ≤ 4 MB each; if bigger, re-encode 720p with
ffmpeg if available — if not, accept 1080p file size but lazy-load strictly (§5). Poster
stays the existing webp.

### 4b. Hero parallax layers (gpt_image_2) — 6 images

2.5D hero = 3 painted depth layers per theme, composited with the existing framer
parallax. 16:9 (widest gpt_image_2 offers), resolution 2k, quality medium. Reference
image: none (no character) — but include palette anchors + template §1.

- `hero/dark-sky.webp` — full-frame backdrop: obsidian-violet night sky over a highland
  valley, luminous low moon, star field, far mountain haze. (Composition: keep the lower
  third simple — the mid layer overlaps it.)
- `hero/dark-mid.webp` — **isolated on plain white background** for cutout: a ridge line
  of gothic observatory spires and colossal rune-carved standing stones, lit windows,
  silhouetted in blue haze. Run `remove_background` on the result → transparent png →
  webp.
- `hero/dark-fore.webp` — isolated for cutout: foreground stone gate of the arcade — an
  ogive arch with a glowing teal keystone rune, brass lantern post, low mist, worn steps.
  `remove_background` likewise.
- `hero/light-sky.webp`, `hero/light-mid.webp`, `hero/light-fore.webp` — same three
  compositions in "parchment day" grade (§1): warm gold haze, rayed sun instead of moon.

If `remove_background` cutouts come back ragged, fallback: request the mid/fore layers as
full-frame paintings with the sky painted in, and stack them with CSS `mask-image` linear
fades instead of true transparency. Either way the layer seams must be checked in both
themes at 375 px and 1440 px widths.

### 4c. Chamber-door card art (gpt_image_2, optional — skip if budget tight)

16 games in `src/data/games.ts`. One 3:2, 1k, quality low image per game: "an ornate
arched chamber door in a candlelit stone hall, door carved with an emblem of <game
motif>" — motif per game (map-drop: a globe pierced by a gold pin; trivia: an open
grimoire; letter-hive: a honeycomb of brass letter tiles; cat-pairs: twin enamel tiles;
etc. — derive from each game's existing icon/blurb). Same palette. Save
`public/chambers/<gameId>.webp` (~40 KB each at card size).

### 4d. Cast & lore (optional)

- Cinematic portraits for Cast page: knight (use guard reference) and old mage, 2:3
  bust portraits, 1k medium → `public/cast/knight.webp`, `public/cast/mage.webp`.
- `upscale_image` on `public/lore-map.png` → crisper pan/zoom on the Lore page.

## 5. Phase 2 — the Knight's Vigil, cinematic band (centerpiece)

New `src/components/CinematicVigil.tsx`; `Home.tsx` swaps `<KnightVigil />` for it.

**Keep** from KnightVigil.tsx: the entire state machine (`KnightActivity`, `ACTIVITIES`,
`CAPTIONS`, `loadKnight`, the 60 s interval, localStorage key `quietArcade.knight`) —
extract into `src/lib/knightState.ts` so both old component (kept for Cast page art
reuse: `Knight`/`OldMage` exports are imported by `Cast.tsx`) and the new band share it.
Do not delete KnightVigil.tsx; just stop rendering it on Home.

Band structure (full-bleed, `min-h-[72svh]`, `overflow-hidden`):

1. **Media layer** — the current activity's asset. `<video muted loop playsInline
   autoPlay preload="none" poster={webp}>` when: motionOK && desktop-ish
   (`matchMedia("(min-width: 768px)")`) && the loop file exists; else the still webp with
   a slow Ken Burns (CSS `@keyframes qa-kenburns`, scale 1→1.06 translate 30 s
   alternate). Only the ACTIVE activity's video element is mounted (the state machine
   changes at most hourly). IntersectionObserver pauses the video when the band scrolls
   out of view.
2. **Grade layer** — gradient overlay tinting the footage into the site palette
   (`bg-gradient-to-t from-pine-950/70 via-transparent to-pine-950/40` dark; a warm
   parchment equivalent light) + existing `.grain`.
3. **Effects layer** — new `src/components/EmberField.tsx`: one shared, theme-aware
   canvas particle field, ≤ 40 particles, rAF paused when offscreen or `html.rm`.
   Per-activity config: bonfire → rising embers (clay/gold); rest/sleep → fireflies +
   star twinkle; fight → brief gold spark bursts; others → drifting moon-dust motes.
4. **Cinema chrome** — letterbox bars (top/bottom black bars, `scaleY` 0→1 driven by
   `useScroll` progress into the section) and the caption rendered as a film subtitle:
   centered near the bottom bar, Grenze, fades in per activity change, with a small
   `qa-fleuron` rule. Add an activity title line ("The Vigil — hour of the bonfire").
5. **Scroll depth** — subtle `useTransform` parallax: media layer `y` drifts −20 px over
   the section's scroll range; a foreground mist div (blurred radial gradients) drifts
   +30 px. Nothing scroll-jacked; the page keeps flowing (quiet vibe).

Accessibility/fallbacks matrix (MUST all work): `html.rm` → still image, no letterbox
animation, no particles, caption static; video error/missing → poster still; light theme
→ same footage but the grade layer warms it (the stills are night scenes — that is
canon: the knight keeps a night vigil regardless of theme).

## 6. Phase 3 — hero + site-wide cinematic layer

1. **Hero (`ArcaneScene.tsx`)**: replace the flat spire/ridge/gate SVG paths with the
   three painted layers per theme (`<motion.img>` per depth group, reusing the existing
   `farY/midY/nearY` transforms; theme switch via `dark:hidden` / `hidden dark:block`
   like the current sun/moon). **Keep** the SVG orrery, stars, lit-window flickers and
   rune shimmers as an accent layer ON TOP of the paintings — that mixed-media layering
   is what reads as 2.5D. Add a pointer-parallax (±8 px `useSpring` on mouse move,
   desktop + motionOK only). Preload only the active theme's sky (`<link rel=preload>`
   via a tiny effect in Home).
2. **Scroll experience**: invoke the **`scroll-experience` skill** before this step and
   apply its patterns with the existing Lenis + framer stack: scroll-triggered section
   reveals are already there (BlurReveal) — add (a) the vigil letterbox scrub (§5), (b) a
   mist-wipe divider between Home sections (a horizontal fog band that drifts as you
   pass it), (c) gentle scale-settle on the games grid entrance. No pinned/hijacked
   sections — calm site.
3. **21st.dev polish** (`mcp__magic__21st_magic_component_inspiration` → `_builder` /
   `_refiner`): upgrade `GameCard` into a "chamber door" card — art from §4c as the card
   face, 3D tilt on hover (max 4°, spring), gold rim-light sweep, door-opening micro
   interaction on click-through. Also refine the ledger stat tiles (candle-glow counters)
   and the primary CTA buttons (ember gradient border). Adapt whatever 21st.dev returns
   to Tailwind tokens + Grenze — no foreign design language, no new UI deps beyond what
   the components inline.
4. **Effects toolkit** in `index.css`: `.qa-vignette` (inset radial shadow), `.qa-rays`
   (conic-gradient god rays, masked, slow rotate), `.qa-kenburns`, letterbox util, all
   with `html.rm` and `prefers-reduced-motion` kill rules exactly like existing anims.
5. **Route transitions** (`App.tsx`): AnimatePresence fade-through (240 ms, ease as
   `EASE` from motion.tsx) with a brief rune-glow flash on the incoming page heading.
   Skip entirely under `html.rm`.

## 7. Phase 4 — secondary pages + verification + ship

1. Lore: upscaled map in a pan/zoom frame (reuse ImageLightbox patterns,
   `data-lenis-prevent`); parchment vignette. Cast: add the §4d portraits as the knight
   and mage sheet art (SVG art stays for the other residents).
2. Verify (per dev-notes memory): `npx tsc -b` clean; `npm run lint` (pre-existing
   warnings only); both themes × {375, 768, 1440} widths; `html.rm` walk-through of
   Home; knight band forced through activities via localStorage
   `quietArcade.knight = {activity, startedAt: now, nextChangeAt: now+3600000, recent: []}`
   + reload; video lazy-load confirmed via read_network_requests (no loop mp4 fetched
   until band near viewport); Lighthouse-ish sanity: hero layer webps ≤ 300 KB each.
3. Commit per phase on `cinematic` (`feat(cinematic): …`). Do not merge or push without
   the user.
4. Update ledger below + memory `quiet-arcade-cinematic-build` with final state.

## 8. Asset ledger (executor: keep this current)

| Asset | Model | Params | Credits | Status | File |
|---|---|---|---|---|---|
| starting balance | — | — | 1,121.5 avail | ✅ 2026-07-21 | — |
| knight stills ×8 (REGENERATED) | gpt_image_2 | 2k high 16:9, `guard` first then as ref | ~24 | ✅ | public/knight/*.webp |
| knight loop ×4 (tier 1) | seedance_2_0 | 8s 1080p std silent | 288 (72 ea) | ✅ | loops/{guard,bonfire,walk,fight}.mp4 |
| knight loop ×4 (tier 2) | seedance_2_0_mini | 8s 720p silent | 80 (20 ea) | ✅ | loops/{gaze,sharpen,sleep,rest}.mp4 |
| hero layers ×6 | gpt_image_2 + remove_background | 2k medium 16:9 | ~18 | ✅ | public/hero/{dark,light}-{sky,mid,fore}.webp |
| chamber cards ×15 | gpt_image_2 | 1k low 16:9 | ~30 | ✅ | public/chambers/&lt;gameId&gt;.webp |
| cast portraits ×2 | gpt_image_2 | 1k medium 2:3 | ~6 | ✅ | src/assets/*-cinematic-portrait.webp |
| lore map upscale | upscale_image | — | — | ⬜ skipped (map already 1.8 MB; upscale would bloat it) |

**Ending balance: ~700 credits** (reserve of 240 never touched).

## 10. What changed against the plan (executor's notes, 2026-07-21)

1. **The eight knight stills were regenerated, not reused.** The user asked
   mid-run for new art in the Arcane style, so `guard` was generated first as the
   design anchor and passed as the character reference for the other seven; the
   2026-07-09 stills and their source jpegs were replaced. Two style directions
   were tested for `guard` (cinematic AAA keyart vs. thick oil-brushstroke); the
   first won on staging and palette and became canon.
2. **Video tiering was decided by measured cost**, as planned: 72 credits per
   1080p std loop vs 20 for mini/720p, so the four most-seen hours got the
   premium tier. All eight were then re-encoded to 720p H.264 (crf 27) with a
   portable `ffmpeg-static` binary — 8.6 MB → ~640 KB each, 6.2 MB for the set.
3. **The hero renders only the active theme's plates** rather than shipping both
   and hiding one with `dark:hidden`. Unsized absolutely-positioned `loading="lazy"`
   images never fetched (zero measured height), and rendering one theme also
   halves the payload. `settings.darkMode` drives it.
4. **A scrim was added under the hero copy** (`from-pine-950/90` dark,
   `from-sand-100/92` light) — the painted gate is too busy to read type over —
   plus a bottom fade into `var(--bg)` so the art sinks into the page.
5. **21st.dev's MCP is broken** (returns malformed tool results for every query),
   so the card tilt and glare sweep were built on the project's existing
   framer-motion. No new dependencies.
6. **`vite.config.ts` `base` is now `/`, not `/quiet-arcade/`** (changed by the
   versus work). Dev URL is `http://localhost:<port>/`. The dev-notes memory is
   stale on this point.
7. Cast portraits went to `src/assets/` and feed the page's existing
   `PortraitReveal` spotlight rather than replacing the drawn sheets — the drawn
   cast is what that page is about; the cinematic version is the reveal.

## 9. Execution order for Opus 4.8 (TL;DR)

1. Phase 0 safety rails (§3). 2. Kick off §4a video #1 + §4b hero layers (jobs run in
background). 3. While waiting: extract `knightState.ts`, scaffold `CinematicVigil` +
`EmberField` against the existing stills (site must look finished even with zero new
assets). 4. Wire arrived assets; decide video tier 2 from real cost. 5. Phase 3 hero +
scroll + 21st.dev. 6. Phase 4 verify + commit. Keep the reserve ≥ 240 credits, keep the
vibe quiet, and keep `html.rm` sacred.

---

## Next-session execution — 2026-07-21 (cont.)

Balance at start: **697** credits. MCP server this session: `a5747bfe…` (different
from prior; old job ids don't resolve, so guard.webp was re-uploaded).

**Guard character reference (re-established):** media_id `25f240b9-fb12-49b4-9632-d23064f7edcf`
(PUT of `public/knight/guard.webp`, confirmed). Not needed for A/B (those are other
characters) but on hand for any knight/mage regen.

**A — Lore map:** `gpt_image_2` 2k/high 3:2, job `762083cf-b231-4e8a-b3c7-ebe194964907`
(7 cr). Excellent, textless, all elements present. Installed: backed up old to
`docs/cinematic-build/lore-map-original.png`; new `public/lore-map.webp` (328 KB,
sharp resize 2000 q72); deleted `public/lore-map.png`. `Lore.tsx` rewritten with an
inline pan/zoom viewer (wheel ≤4×, drag pan, +/−/reset, `data-lenis-prevent`,
`.qa-vignette`) pointing at `lore-map.webp`.

**B — Cast reveals (STYLE PIVOT):** user interrupted mid-run: "the artstyle should be
of arcane's artstyle". v1 (mild preamble, `gpt_image_2` 1k/med 2:3, 6×2=12 cr) came
out smooth/CGI-render — canon-accurate but not painterly. Regenerated all 6 with a
strengthened painterly preamble (oil/gouache, impasto, anti-CGI, chiaroscuro) —
6×2=12 cr. v2 adopted: clearly hand-painted oil, canon intact, no text issues
(princess scroll = tally marks, not gibberish). NOTE: doc's Momo guess ("moth-keeper
grandmother") was WRONG — source is a bespectacled chipmunk schoolteacher; prompted
correctly. **Arcane not named in any prompt** (copyright + doc rule); style captured
descriptively.

v2 job ids: dragon `1ae335a5-b574-4642-a302-de6410cc3735`, princess
`5782dd50-8a88-47b7-93f1-e16da6ad1be0`, rabbit `8c95204a-07bd-46c7-9e9b-e57c7909eb44`,
cat `451a5a6d-f5f2-4567-b787-755c04ee9dc6`, wizard `2f05fed6-6425-4016-bcfe-d12cfda8f796`,
momo `79e5a763-b59b-496e-9374-4ded3362309b`. Installed to
`src/assets/<key>-cinematic-portrait.webp` (sharp resize 600×900 q82, 73–105 KB).
`Cast.tsx` wired: dragon swapped off old png (deleted `games-dragon-portrait.png`),
+reveal on princess/rabbit/cat/wizard/momo. `tsc -b` clean; lint pre-existing warnings only.

**Spend so far:** 7 + 12 + 12 = **31 credits** (~666 left; 240 reserve safe).

**OPEN / next:**
- Knight & mage shipped portraits are the OLD smooth-render look → will clash with the
  new painterly cast. Recommend regenerating those 2 to match (~4 cr) — awaiting user OK.
- C (hero gate loop, 72 cr) not yet started — pending style approval + budget check.
- Verify in browser (Cast reveals via spotlight, Lore pan/zoom), then commit on `cinematic`.
