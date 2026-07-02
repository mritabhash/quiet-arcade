/**
 * 5x5 word squares: the grids are symmetric, so across and down answers are
 * the same words with different clue text. Verified letter by letter.
 */

export interface CrosswordPuzzle {
  rows: [string, string, string, string, string];
  across: [string, string, string, string, string];
  down: [string, string, string, string, string];
}

export const CROSSWORDS: CrosswordPuzzle[] = [
  {
    rows: ["HEART", "EMBER", "ABUSE", "RESIN", "TREND"],
    across: [
      "It beats about 100,000 times a day",
      "A glowing fragment left in a campfire",
      "Treat cruelly or improperly",
      "Sticky substance tapped from pine trees",
      "The general direction fashion drifts",
    ],
    down: [
      "The centre of an artichoke, or of a matter",
      "Still warm in yesterday's fireplace",
      "Misuse of power",
      "Amber began as this, hardened over ages",
      "What forecasters spot in the data",
    ],
  },
  {
    rows: ["SCENT", "CANOE", "ENTER", "NOELS", "TERSE"],
    across: [
      "What desert rain releases from dry earth",
      "A quiet boat moved by paddle",
      "Come in",
      "Carols sung in December",
      "Short, sharp, and a little abrupt",
    ],
    down: [
      "A bloodhound follows one",
      "Vessel you might portage between lakes",
      "Key you press to submit",
      "Yuletide songs",
      "Like a one-word reply",
    ],
  },
  {
    rows: ["SPARE", "PANEL", "ANKLE", "RELIC", "ELECT"],
    across: [
      "Extra, like a tyre in the boot",
      "A group of experts on stage",
      "Joint between foot and leg",
      "An object surviving from the ancient past",
      "Choose by vote",
    ],
    down: [
      "Lean, or a bowling near-miss",
      "One flat section of a folding screen",
      "It rolls when you misstep on a kerb",
      "Something a desert dig might uncover",
      "Pick for office",
    ],
  },
];
