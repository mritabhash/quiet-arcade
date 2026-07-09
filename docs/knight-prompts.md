# Knight Vigil — image generation prompt pack

Eight modern, majestic cinematic scene images replace the SVG knight band
on the home page.
Generate them with any image model that supports **consistent characters /
reference images** (Midjourney `--cref`, DALL·E/GPT-4o with reference,
Gemini/Imagen character reference, Leonardo character reference, etc.).

## How to generate

1. **Generate `guard` first.** It defines her look. Then pass the guard
   image as the character reference for the other seven so her face,
   hair, and armour stay identical.
2. **Aspect ratio 16:9** (wider like 21:9 is even better if supported),
   at least **1536 px wide**.
3. **Keep her and everything important in the lower half of the frame** —
   the site crops the band from the bottom portion of the image. Keep her
   roughly centred horizontally (phones crop the sides).
4. Save as **PNG or JPG**, named exactly:
   `guard`, `walk`, `gaze`, `fight`, `bonfire`, `sleep`, `sharpen`, `rest`
5. Put them in `quiet-arcade/public/knight/` and commit.

Every prompt below = STYLE block + KNIGHT block + that scene's text.
Copy all three parts together.

---

## STYLE block (start every prompt with this)

> Epic modern digital concept art, cinematic key-art quality, wide 16:9
> landscape. Majestic and atmospheric: a vast twilight sky with dramatic
> soft clouds, volumetric silver-blue moonlight breaking through, deep
> atmospheric haze over rolling highland moors. Crisp, refined detail on
> the character; smooth painterly gradients in the environment; elegant
> cinematic colour grade — deep teal-blue night, luminous silver
> moonlight, warm gold accents, one muted terracotta note in her cape.
> Grand, serene, museum-piece fantasy realism — regal and awe-inspiring,
> never gritty or grim. Low horizon; one or two colossal weathered
> standing stones in the far distance for a sense of scale; one luminous
> moon placed low in the sky, near her head height. All important
> content in the lower half of the frame — the upper sky will be
> cropped. Ultra-detailed clean render, no text, no watermark, no
> border, no signature.

## KNIGHT block (include in every prompt, unchanged)

> THE KNIGHT, identical in every image: a young woman in her
> mid-twenties, warm ivory skin, calm grey-green eyes, long
> chestnut-brown hair falling past her shoulders, a slim silver circlet
> with one small teal gem centred on her brow. She wears sleek,
> elegantly sculpted modern-fantasy plate armour in teal-enamelled steel
> with polished gold filigree trim: layered rounded pauldrons, a fitted
> cuirass with a small gold diamond-shaped sigil on the chest, armoured
> skirt plates over dark trousers, steel greaves and boots, and a
> flowing terracotta-red cape clasped at the shoulders. Her longsword has a slender gold crossguard, a
> leather-wrapped grip, and a round gold pommel. Full figure visible,
> head to boots, about one third of the frame height.

---

## 1. `guard` — standing her watch  *(generate this one first)*

> She stands in three-quarter view facing slightly right, tall and
> patient, both gauntleted hands resting stacked on the pommel of her
> longsword, which is planted point-down in the earth in front of her.
> Her cape stirs faintly in the night breeze. Vigilant, serene.

## 2. `walk` — walking the marches

> She walks from left to right in side profile, mid-stride and
> unhurried, her cape and hair trailing behind her, sword sheathed at
> her hip, following a worn footpath through low heather.

## 3. `gaze` — studying the horizon

> Seen in three-quarter view from slightly behind, she raises one
> gauntleted hand to shade her eyes as she studies the far horizon; her
> other hand rests on the sword hilt at her hip. A few tiny distant
> birds cross the sky near the horizon line.

## 4. `fight` — the duel with the old mage

> On the left of the frame she lunges toward the right, longsword raised
> mid-swing, cape flaring behind her. Facing her on the right stands THE
> OLD MAGE: an elderly wizard with a long layered white beard and sharp
> knowing eyes, wearing a deep pine-green hooded robe with a worn pointed
> hood, a faded gold stripe down the front and a simple rope belt,
> holding a tall gnarled wooden staff topped with a glowing
> terracotta-orange orb. A thin streak of orange spell-light arcs from
> his staff toward her blade, sparking gold where it meets. A practiced,
> almost ritual duel between old acquaintances — dynamic but not brutal.

## 5. `bonfire` — fireside

> She sits on a low mossy stone beside a small campfire ringed with
> stones, holding both open palms toward the flames; her sword leans
> against the stone at her side. Warm gold-orange firelight glows on her
> face and armour from one side while cool moonlight rims her from the
> other; a thin curl of smoke rises and two or three embers drift up.

## 6. `sleep` — sleeping sitting up

> She sleeps sitting upright on a low stone, head bowed forward, eyes
> closed, arms loosely folded, her sheathed sword resting across her
> lap. The moon is brighter than usual and a handful of small stars are
> out; the night is deeply still.

## 7. `sharpen` — tending the blade

> She sits on a low stone with her longsword laid flat across her
> knees, drawing a small grey whetstone along the blade with her right
> hand, eyes down and focused on the work; a few tiny gold sparks glint
> where stone meets steel.

## 8. `rest` — watching the sky

> She sits on a low stone leaning back, propped on her hands, one leg
> stretched out, head tipped back watching the night sky with a faint
> peaceful smile; her sword leans within easy reach; two tiny gold
> fireflies drift in the air near her.
