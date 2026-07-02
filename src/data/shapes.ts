/**
 * Stylised low-poly country silhouettes for Country Shape,
 * hand-drawn for this project in 100x100 viewboxes.
 */

export interface CountryShape {
  name: string;
  paths: string[];
}

export const COUNTRY_SHAPES: CountryShape[] = [
  {
    name: "Italy",
    paths: [
      "M38 6 L50 2 L58 8 L54 18 L60 28 L70 42 L82 50 L84 58 L74 58 L62 48 L54 36 L48 44 L56 56 L52 64 L44 56 L46 44 L40 30 L32 16 Z",
      "M52 70 L66 66 L70 74 L56 78 Z",
      "M28 62 L36 60 L38 74 L30 76 Z",
    ],
  },
  {
    name: "Chile",
    paths: [
      "M52 2 L60 4 L56 16 L60 28 L54 40 L58 52 L52 64 L56 76 L48 90 L42 98 L36 96 L44 84 L46 70 L50 56 L46 42 L52 28 L48 14 Z",
    ],
  },
  {
    name: "Japan",
    paths: [
      "M60 8 L74 4 L78 12 L68 18 L62 16 Z",
      "M52 22 L64 20 L70 28 L60 40 L48 46 L40 42 L48 32 Z",
      "M32 50 L42 46 L44 54 L34 58 Z",
      "M18 60 L30 56 L32 64 L22 70 Z",
    ],
  },
  {
    name: "India",
    paths: [
      "M30 12 L44 6 L58 12 L70 10 L78 20 L70 28 L74 36 L64 40 L58 52 L52 68 L48 84 L42 96 L36 80 L30 64 L22 50 L14 42 L24 36 L20 24 Z",
    ],
  },
  {
    name: "Australia",
    paths: [
      "M20 34 L30 24 L42 20 L50 26 L58 18 L64 26 L78 30 L88 44 L86 58 L78 70 L64 76 L50 72 L38 74 L26 66 L14 54 L14 42 Z",
      "M74 82 L82 78 L84 88 L76 90 Z",
    ],
  },
  {
    name: "Brazil",
    paths: [
      "M32 14 L46 8 L58 14 L70 12 L82 22 L86 34 L78 48 L70 62 L58 74 L48 88 L40 76 L42 62 L32 54 L22 44 L18 30 L26 22 Z",
    ],
  },
  {
    name: "France",
    paths: [
      "M36 8 L52 4 L58 14 L74 18 L80 30 L70 42 L74 56 L62 66 L46 62 L30 66 L22 52 L10 44 L24 34 L20 20 Z",
    ],
  },
  {
    name: "Egypt",
    paths: [
      "M16 22 L34 18 L48 24 L58 18 L72 22 L68 32 L78 44 L84 60 L84 80 L16 80 L16 40 Z",
    ],
  },
  {
    name: "United Kingdom",
    paths: [
      "M44 4 L56 8 L52 20 L62 26 L58 40 L66 52 L58 66 L46 72 L36 66 L44 56 L36 48 L44 40 L34 30 L42 22 L36 12 Z",
      "M18 44 L28 40 L30 52 L20 58 Z",
    ],
  },
  {
    name: "Norway",
    paths: [
      "M40 96 L36 80 L44 66 L40 56 L50 42 L46 34 L58 20 L54 12 L66 4 L78 8 L72 20 L64 22 L68 30 L58 36 L62 44 L52 50 L56 58 L48 66 L52 78 L46 86 Z",
    ],
  },
  {
    name: "Mexico",
    paths: [
      "M8 22 L24 18 L40 22 L58 24 L64 34 L76 44 L88 50 L84 60 L70 62 L60 70 L52 62 L40 56 L28 44 L20 46 L12 34 Z",
      "M14 40 L20 52 L28 62 L24 66 L14 52 Z",
    ],
  },
  {
    name: "Türkiye",
    paths: [
      "M10 40 L26 32 L44 28 L64 30 L84 34 L90 44 L80 56 L62 62 L44 60 L28 62 L16 54 L22 48 Z",
    ],
  },
];
