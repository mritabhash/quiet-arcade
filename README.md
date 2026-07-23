# Quiet Arcade

Quiet Arcade is a lightweight static browser arcade built with React, Vite, TypeScript, React Router, and Tailwind CSS. It includes five calm built-in games with no login, backend, paid API, external database, or copyrighted assets.

## Install

```bash
npm install
```

## Run Locally

```bash
npm run dev
```

## Build

```bash
npm run build
```

The production build is written to `dist/`.

## Environment

All environment variables are optional — the arcade runs fully offline without
them. See `.env.example` for the full list; copy it to `.env.local` and fill in
what you need.

### Map Drop street view (optional)

Map Drop's **Moderate** difficulty is a GeoGuessr-style round using
[Mapillary](https://www.mapillary.com/) street imagery. To enable it:

1. Create a free Mapillary account and register an app at
   <https://www.mapillary.com/dashboard/developers>.
2. Copy the app's **Client Token**.
3. Put it in `.env.local` as `VITE_MAPILLARY_TOKEN=...` and restart `npm run dev`.

Without a token, Moderate shows a disabled card and the other difficulties work
normally.

## Deploy

Quiet Arcade is a static website and can be deployed to Vercel, Netlify, Cloudflare Pages, GitHub Pages, or any static host.

Use these defaults:

- Build command: `npm run build`
- Output directory: `dist`

The app uses React Router hash routing, so direct links work on static hosts without server rewrite rules.

## Games

- Daily Map Mystery
- Higher or Lower
- Guess the Year
- Fake or Real
- Tiny City Builder

Each game has daily and practice modes. Daily mode is scored once per date on a device. Practice mode can be played without daily limits.

## Add More Game Data

Game data lives in `src/data/`:

- `mapMystery.ts`
- `higherLower.ts`
- `guessTheYear.ts`
- `fakeOrReal.ts`
- `cityChallenges.ts`

Add new objects using the existing TypeScript shapes. The compiler will catch missing fields. Daily challenges use seeded shuffling over these arrays, so adding data changes future daily selections but does not require any backend work.

## localStorage Stats

Quiet Arcade stores local settings and progress in the browser:

- `quietArcade.settings`
- `quietArcade.stats`
- `quietArcade.dailyCompletions`
- `quietArcade.reportedItems`
- `quietArcade.citySaves`

Stats include total games played, best scores, daily streak, perfect rounds, last played date, and daily completions. Reported Fake or Real statements are hidden from future practice rounds on the same device.

## Daily Challenges

Daily mode uses the current local date formatted as `YYYY-MM-DD`. A deterministic seeded random function in `src/utils/seededRandom.ts` combines the date with a game-specific seed, so every visitor gets the same daily challenge on the same date.

Completed daily challenges are stored in `quietArcade.dailyCompletions`, which prevents repeatedly farming the same daily score on that device.
