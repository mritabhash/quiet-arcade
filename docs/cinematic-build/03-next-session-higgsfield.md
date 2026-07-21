# 03 — Remaining Higgsfield work (next session)

Written 2026-07-21, after the main build (see 00 §10 for what shipped and how the
plan changed). The Higgsfield MCP disconnected mid-session; everything below is
what was left on the table. Budget context: balance was **~700 credits** after
the build; keep the **240-credit reserve** untouched. Total planned spend below
is ≤ 60 credits at measured prices (gpt_image_2: 3 cr at 2k / ~2 cr at 1k;
upscale unknown — probe with `get_cost` first).

## 0. Session preflight

1. Confirm the Higgsfield MCP is connected (`balance`); log credits in 00 §8.
2. Recover the character reference: the canon `guard` keyart is job
   `81746a32-3a93-47c2-bf62-43b30ae22914` (2026-07-21). If job ids from a prior
   session can't be referenced in `medias`, re-upload the local canon instead:
   `media_upload` → PUT `public/knight/guard.webp` → `media_confirm`, and use
   that media id as the `image` reference. **Never generate a knight or mage
   image without the reference attached.**
3. Style preamble (LOCKED — prepend to every prompt):
   > Cinematic 2.5D AAA game key art, painterly hand-painted illustration with
   > visible brushwork, stylized realism, dramatic volumetric lighting with
   > strong rim light, rich teal-blue night grade (#2d8595) with tarnished-gold
   > (#e0b654) and terracotta (#ae4d2c) accents, obsidian-violet shadow
   > (#1b1824). No text, no watermark.
   Never name copyrighted IP ("Arcane" etc.) in a prompt.
4. Gotchas from the build (details in memory `quiet-arcade-cinematic-build`):
   max 8 concurrent jobs (429 beyond); image results' `minUrl` is a ready webp,
   but `remove_background` `_min` is only 600px — take `rawUrl` and downscale
   with `npx sharp-cli -i in -o out.webp -f webp -q 82 resize <px>`; a video
   prompt may bounce back a "preset recommendation" — resend with
   `declined_preset_id` to force the literal generation; GateGuard denies the
   first Bash/Edit/Write per file — state facts and retry.

## A. Lore map, cinematic remake (the one real gap) — ~6 credits

`public/lore-map.png` (1.8 MB) is the old-style map; it now clashes with the
painted world. Generate a replacement, 2k **high**, AR **3:2** (the page shows
it full-width in a rounded card; 3:2 crops least):

> [style preamble] A hand-painted fantasy world map of the Arcanum — the world
> of a quiet nightly arcade — drawn as an aged parchment chart lit by
> candlelight, with painterly terrain rising out of the vellum in 2.5D relief:
> a dark highland moor with colossal rune-carved standing stones and a small
> campfire glow at its heart, a gothic observatory city on a far ridge with
> warm-gold lit windows, an ogive stone gate with a glowing teal keystone at
> the map's centre crossroads, low mist in the valleys, a honeycomb grove, a
> small desert of tiles in one corner, tiny sailing distances marked by
> compass-rose flourishes and dotted gold paths connecting fifteen small
> chamber-door icons scattered across the land. Ornate border with brass
> corner filigree. Rich parchment golds warmed by teal and terracotta inks.
> No text, no letters, no labels, no watermark.

- The old map HAD no labels either ("left unwritten") — keep it textless; the
  "No text" instruction matters doubly here because maps invite gibberish
  cartography labels. If text sneaks in, regenerate once; if it persists,
  accept the best take and note it.
- Install: back up old file to `docs/cinematic-build/lore-map-original.png`
  (git already tracks the old one — the backup is belt-and-braces for the
  working tree), then write the new art as `public/lore-map.png` (the Lore
  page references that exact path). Use `minUrl` webp → convert/rename to png
  is NOT needed: just update `Lore.tsx` to point at `lore-map.webp` instead
  and delete the png. Keep ≤ 400 KB via sharp resize 2000.
- Code half (no Higgsfield needed, may already be done — check first): wrap
  the map in a pan/zoom viewer reusing `ImageLightbox.tsx` interaction
  patterns (wheel zoom ≤ 4×, drag pan, ＋/− buttons, `data-lenis-prevent` on
  the container, `.qa-vignette` frame). NOTE: `ImageLightbox` takes a
  `PlaceImage` (url/full/descUrl/title/credit) — don't force the map into it;
  lift the gesture code into the Lore page or a small shared component.

## B. Cast reveals for the remaining residents — ~12 credits, 6 × 1k medium 2:3

Cast.tsx gives knight + mage a cinematic `PortraitReveal`; the dragon has an
old-style png. Give every resident a cinematic reveal in the same portrait
recipe (waist-up/full-body as fits, moonlit moor or their home softly blurred
behind, cool rim light + warm key light). Base each design on the DRAWN
character (read the component source for canonical colors/features before
prompting):

| key | drawn source | prompt core |
|---|---|---|
| dragon (replaces old png) | `PageCharacters.tsx` DragonArt | a stubby, friendly verdigris-green dragon with tiny wings and gold chest scutes, puffing a small candle flame, guarding a hall of arched game doors |
| princess | `PageCharacters.tsx` PrincessArt | a young keeper-of-the-ledger princess, crown slightly askew, clay-red gown with gold trim, holding an unrolled tally scroll, warm library of ledgers behind |
| rabbit | `RabbitGuide.tsx` RabbitArt | a small sand-coloured rabbit scout with a tiny leather satchel and a gold map pin, sitting alert on a moonlit map table |
| cat | `ArcadeCat.tsx` CatArt | a plump terracotta-orange arcade cat curled near a brass lantern, one eye lazily open, tail wrapped |
| wizard | `ScrollWizard.tsx` WizardArt | a tiny cheerful blue-robed wizard with a starry pointed hat riding a slow-drifting scroll like a magic carpet |
| momo | `MaMomo.tsx` MomoArt | (read the component for her design first) a grandmotherly moth-keeper figure in warm shawls, lantern light |

Install to `src/assets/<key>-cinematic-portrait.webp` (~60–80 KB each, sharp
resize 900) and wire `reveal: <PortraitReveal src={...} motionOK={motionOK} />`
on each sheet in `Cast.tsx` (pattern already there for knight/mage/dragon).
Delete `games-dragon-portrait.png` when the dragon's replacement lands.

## C. Hero gate ambient loop, dark theme only (OPTIONAL — decide by feel, 72 cr)

If and only if the budget stays ≥ 350 after A+B and the user wants more motion:
one `seedance_2_0` 8s/1080p/std silent loop from the DARK hero composite —
upload a screenshot of the assembled dark hero (or the `dark-fore` art over
`dark-sky`) as `start_image`:

> Cinematic live key art loop. An ancient stone gate with a glowing teal
> keystone rune under a night sky. Camera locked. The lantern flame flickers
> warmly; ground mist curls slowly through the arch; stars shimmer; the rune's
> glow gently pulses. Nothing else moves. Seamless ambient loop. Painterly,
> serene. No text.

Integration is NOT a video swap of the hero (too heavy for the landing
viewport) — it's a `<video>` layer that fades in over the fore plate ONLY on
desktop dark theme after `requestIdleCallback`, `preload="none"`, same
IntersectionObserver/rm gating as CinematicVigil. If that reads as too much
for the quiet vibe, skip — the hero already works. This is the first thing to
cut.

## D. Post-generation housekeeping (every item)

1. Re-encode/resize per recipe (video: ffmpeg-static portable install per
   memory — native resolution, `-crf 21 -preset slow -an -movflags +faststart`;
   images: sharp-cli).
2. `npx tsc -b` + `npm run lint` clean (pre-existing warnings only).
3. Verify in the preview browser: dev URL is `http://localhost:<port>/` (vite
   `base` is `/` now — NOT `/quiet-arcade/`). Video never composites into
   hidden-tab screenshots — verify framing by drawing a video frame to a
   canvas probe, and playback via `currentTime`/`readyState`.
4. Log every generation (model, params, credits, path) in 00 §8; update §10
   with any deviation; commit per section (`feat(cinematic): …`) on branch
   `cinematic`. No push, no merge.

## Kickoff prompt (paste into the next session)

> Finish the Quiet Arcade cinematic makeover's remaining Higgsfield work.
> Read quiet-arcade/docs/cinematic-build/03-next-session-higgsfield.md and
> execute it top to bottom on branch `cinematic`: preflight (balance +
> re-establish the guard.webp character reference), A (cinematic Lore map +
> pan/zoom viewer), B (cast reveals for dragon, princess, rabbit, cat, wizard,
> momo), then decide C (hero gate loop) only if budget ≥ 350 and it serves the
> quiet vibe. Keep the locked style preamble on every prompt, keep the
> 240-credit reserve, verify per section D, and update the ledger in
> 00-plan-and-ledger.md as you go.
