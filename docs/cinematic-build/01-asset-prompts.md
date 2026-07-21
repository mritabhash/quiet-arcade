# 01 — Asset prompt pack (copy-paste ready)

Companion to `00-plan-and-ledger.md`. Every generation the makeover needs, with the full
prompt text and exact Higgsfield tool parameters. Style preamble and palette anchors are
LOCKED (§1 of the plan). Never name copyrighted IP in prompts.

**Shared style preamble** — prepend to every image prompt below (it is baked into the
video prompts already):

> Epic modern fantasy key art, masterful cinematic digital painting, painterly
> hand-painted textures with visible brushwork, dramatic volumetric lighting with strong
> rim light, 2.5D game keyart depth — crisp foreground, atmospheric hazy background —
> deep teal-blue grade (#2d8595) with tarnished-gold accents (#e0b654), terracotta ember
> warmth (#ae4d2c), obsidian-violet shadow (#1b1824). Immaculate detail, serene and
> majestic. No text, no watermark.

**Upload flow (once per source file):** `media_upload` (returns upload URL + media id) →
PUT the file bytes → `media_confirm`. Reuse the returned media id across calls.

---

## A. Knight cinematic loops — `generate_video`, model `seedance_2_0`

Common params for all eight:

```json
{
  "model": "seedance_2_0",
  "params": {
    "duration": 8, "resolution": "1080p", "mode": "std",
    "generate_audio": false, "aspect_ratio": "auto", "genre": "epic",
    "medias": [{ "role": "start_image", "data": { "id": "<uploaded webp id>", "type": "media_input" } }]
  }
}
```

Source = the matching `public/knight/<name>.webp`. Output → `public/knight/loops/<name>.mp4`.
Generate `guard` FIRST, record the real credit cost in the ledger, then apply the tier
rule from plan §4a. Every prompt below is complete — no assembly.

### A1 `guard` (tier 1)
> Cinematic live keyart loop. A woman knight in teal-enamel plate armour with gold
> filigree and a terracotta-red cape stands a night watch on a moonlit highland moor,
> hands stacked on the pommel of her sword planted point-down. Camera locked, a barely
> perceptible slow push-in. Her cape and long chestnut hair stir gently in a slow wind;
> she breathes calmly and blinks once; silver-blue moon haze drifts across the moor;
> faint motes of moonlit dust float upward; distant grass ripples. The scene ends almost
> exactly as it began, seamless ambient loop. Serene, majestic, painterly. No text.

### A2 `bonfire` (tier 1)
> Cinematic live keyart loop. The knight sits on a mossy stone beside a small campfire on
> a night moor, palms open toward the flames. Camera locked. The fire licks and flickers,
> casting warm dancing gold-orange light across her face and armour; small embers rise
> and drift out; a thin curl of smoke climbs; she slowly flexes her fingers toward the
> heat and her cape edge shifts. Cool moonlight rims her from behind. Ends near the
> starting pose, seamless ambient loop. Intimate, serene, painterly. No text.

### A3 `walk` (tier 1)
> Cinematic live keyart loop. The knight walks unhurried from left to right in side
> profile across a moonlit moor path, sheathed sword at her hip. Camera tracks laterally
> at her slow walking pace so she stays centred. Her terracotta cape and long hair trail
> and ripple behind her; heather sways as she passes; silver-blue moon haze drifts slowly
> the opposite way. Constant gentle pace, no camera shake, seamless ambient loop.
> Painterly, serene, majestic. No text.

### A4 `fight` (tier 1)
> Cinematic live keyart loop. On the left the knight holds a braced stance with her
> longsword raised; on the right an old mage in a pine-green hooded robe holds up a
> gnarled staff crowned with a glowing terracotta-orange orb. Camera locked. A thin arc
> of orange spell-light crackles from the orb to her blade, bursting into small gold
> sparks where it meets steel; the arc flickers and re-forms rhythmically; both capes and
> robes whip in the wind of the duel; moon haze drifts behind. A practiced ritual duel,
> elegant, never brutal. Seamless ambient loop. Painterly, majestic. No text.

### A5 `gaze` (tier 2)
> Cinematic live keyart loop. The knight, seen three-quarter from slightly behind,
> shades her eyes with a gauntleted hand and studies the far horizon of a night moor.
> Camera locked, faint slow push-in. Wind lifts her cape and hair in slow waves; a few
> tiny birds cross the far sky near the horizon; haze rolls gently over the moor; stars
> shimmer faintly. She holds the watchful pose throughout. Seamless ambient loop.
> Painterly, serene. No text.

### A6 `sharpen` (tier 2)
> Cinematic live keyart loop. The knight sits on a stone with her longsword laid flat
> across her knees, drawing a small grey whetstone along the blade in slow rhythmic
> strokes. Camera locked. Each stroke sends a soft line of moonlight down the steel and a
> few tiny gold sparks; her head stays bowed in calm focus; cape edge and hair shift
> slightly; moon haze drifts. Steady, meditative rhythm, seamless ambient loop.
> Painterly, quiet, devoted. No text.

### A7 `sleep` (tier 2)
> Cinematic live keyart loop. The knight sleeps sitting upright on a stone, head bowed,
> sheathed sword across her lap, cape wrapped around her. Camera locked. The night is
> utterly still: her shoulders rise and fall with slow breathing; stars twinkle softly;
> the bright moon's glow gently pulses through thin drifting cloud. Nothing else moves.
> Seamless ambient loop. Tender, hushed, painterly. No text.

### A8 `rest` (tier 2)
> Cinematic live keyart loop. The knight leans back on her hands on a stone, one leg
> stretched out, head tipped up to watch the night sky with a faint peaceful smile, sword
> leaning within reach. Camera locked. Two tiny gold fireflies drift in lazy circles
> beside her; her cape edge flutters; stars shimmer; moon haze drifts slowly. Seamless
> ambient loop. Unburdened, serene, painterly. No text.

---

## B. Hero parallax layers — `generate_image`, model `gpt_image_2`

Common params: `{"resolution": "2k", "quality": "medium", "aspect_ratio": "16:9"}`.
No reference image. Prepend the shared style preamble to each. Mid/fore layers get
`remove_background` after generation (fallback: CSS mask stacking, plan §4b).

### B1 `hero/dark-sky`
> Night sky backdrop for a layered 2.5D game title screen: an obsidian-violet highland
> night sky filled with a scattered silver star field, one luminous low full moon left of
> centre casting a soft halo, thin drifting bands of teal-blue cloud haze, the faint
> tops of far mountains dissolving into mist along the bottom edge. The lower third is
> calm and simple with no detailed subject matter. Vast, deep, tranquil.

### B2 `hero/dark-mid` (→ remove_background)
> A distant ridge line rendered as a single row of silhouetted structures on a plain pure
> white background, nothing above or below them: gothic observatory spires with small
> warm-gold lit windows, colossal weathered standing stones carved with faintly glowing
> teal runes, all hazed in atmospheric blue as if seen across a valley at night. Isolated
> subject on white for clean cutout, full silhouette visible, nothing cropped.

### B3 `hero/dark-fore` (→ remove_background)
> A foreground stone gateway rendered isolated on a plain pure white background: a grand
> ogive stone arch — the gate of an ancient arcade — with a diamond keystone rune glowing
> arcane teal, flanked by a brass lantern post with a warm flickering flame, worn stone
> steps, low curling ground mist, tufts of dark heather. Crisp painterly foreground
> detail, moonlit rim light on the stone edges. Isolated on white for clean cutout,
> nothing cropped.

### B4 `hero/light-sky`
> Same world at golden late afternoon, "parchment day": a warm aged-parchment sky in
> soft gold and cream, a rayed low sun left of centre with a gentle halo, drifting bands
> of warm haze, faint far mountain tops dissolving into golden mist along the bottom
> edge. Lower third calm and simple. Vast, warm, tranquil.

### B5 `hero/light-mid` (→ remove_background)
> The same distant ridge as a warm daytime silhouette on a plain pure white background:
> gothic observatory spires and colossal rune-carved standing stones hazed in warm gold
> afternoon light, runes glowing soft verdigris teal. Isolated on white for clean cutout,
> full silhouette, nothing cropped.

### B6 `hero/light-fore` (→ remove_background)
> The same foreground stone gateway at golden afternoon on a plain pure white background:
> ogive arch with softly glowing teal keystone rune, brass lantern unlit and gleaming,
> worn steps, thin warm ground haze, heather. Crisp painterly detail, warm gold rim
> light. Isolated on white for clean cutout, nothing cropped.

---

## C. Chamber-door cards — `generate_image`, model `gpt_image_2` (OPTIONAL phase)

Common params: `{"resolution": "1k", "quality": "low", "aspect_ratio": "16:9"}` (card
header crops to ~2.8:1 — compose the emblem centred with generous margins; bottom fades
dark). Shared card frame prompt — replace `<EMBLEM>` per game:

> A wide banner: an ornate arched chamber door of dark stone and tarnished brass in a
> candlelit ancient hall, centred, carved above the arch with <EMBLEM>, the emblem
> glowing softly. Warm gold candlelight from below, teal rune-light tracing the arch,
> obsidian shadow at the edges, bottom third fading into darkness. Painterly, quiet,
> inviting.

| gameId | `<EMBLEM>` |
|---|---|
| map-drop | a small globe pierced by a gleaming gold map pin |
| trivia | an open ancient tome with glowing sigils rising off its pages |
| time-capsule | a brass hourglass set over a faded etched map |
| borderline | a compass rose woven into interlocking border lines |
| word-grid | a five-by-five grid of carved letter tiles, one row aglow in gold |
| pattern-groups | sixteen small carved tiles in a four-by-four square, four of them glowing as one group |
| mini-crossword | a small crossword lattice chiselled into stone, two words crossing |
| hidden-strands | a thread of gold weaving through a field of carved letters |
| letter-hive | a honeycomb of seven stone cells with the centre cell glowing |
| globe-hunt | a brass spyglass trained on a small globe |
| country-shape | the unmistakable silhouette of a landmass carved in raised relief |
| time-lens | a round lens refracting three tiny scenes from different ages |
| higher-lower | a balance scale with a sun in one pan and a moon in the other |
| cat-pairs | two identical enamel tiles facing each other like a mirrored pair |
| odd-one-out | nine small tiles in a three-by-three, eight alike and one subtly different, faintly aglow |

Output → `public/chambers/<gameId>.webp` (compress to ~40 KB; card renders ~400 px wide).

---

## D. Cast portraits — `generate_image`, model `gpt_image_2` (OPTIONAL phase)

Params: `{"resolution": "1k", "quality": "medium", "aspect_ratio": "2:3"}`.

### D1 `cast/knight` — pass the uploaded `guard.webp` media id as reference
  (`"medias": [{"role": "image", "data": {"id": "<guard id>", "type": "media_input"}}]`)
> Character portrait, waist-up: the woman knight from the reference image — long chestnut
> hair, calm grey-green eyes, slim silver circlet with a single teal gem, sleek
> teal-enamel plate armour with gold filigree, gold diamond sigil on the cuirass,
> terracotta-red cape — facing three-quarter toward the viewer with a calm, steady
> expression, hands resting on the pommel of her sword. Moonlit night moor softly blurred
> behind her, silver-blue rim light, warm gold key light on her face.

### D2 `cast/mage` — no reference
> Character portrait, waist-up: an old mage with a long layered white beard and sharp
> knowing eyes beneath a worn pointed pine-green hood with a faded gold stripe, rope
> belt, both hands folded on a tall gnarled staff topped with a dormant terracotta-orange
> orb, the faintest amused smile. Moonlit night moor softly blurred behind him, cool blue
> rim light, ember-orange under-light from the orb.

---

## E. Post-processing recipes

- **Download:** `curl -L -o <path> "<rawUrl>"` (Bash tool; result URLs are in each
  completed generation / `job_display`).
- **Image → webp:** try `npx --yes sharp-cli --input in.png --output out.webp --format webp --quality 82`;
  if sharp-cli fails on this machine, keep the original png/jpg and reference that
  filename in code instead — do not block the build on conversion.
- **Video:** check `ffmpeg -version`; if present and a loop exceeds 4 MB:
  `ffmpeg -i in.mp4 -an -vf scale=1280:-2 -crf 26 -preset slow out.mp4`. If ffmpeg is
  absent, ship the original and rely on `preload="none"` + IntersectionObserver gating.
- **Lore map:** `upscale_image` on uploaded `public/lore-map.png`, 2k → replace file
  (keep a copy of the original at `docs/cinematic-build/lore-map-original.png`).
- Log every generation (model, params, credits, output path) in the ledger table of
  `00-plan-and-ledger.md` §8 as it completes.
