export interface StrandTheme {
  theme: string;
  words: [string, string, string, string, string, string];
}

export const STRAND_THEMES: StrandTheme[] = [
  { theme: "Desert life", words: ["CACTUS", "CAMEL", "LIZARD", "SCORPION", "VULTURE", "MIRAGE"] },
  { theme: "Night sky", words: ["COMET", "NEBULA", "GALAXY", "METEOR", "PLANET", "ECLIPSE"] },
  { theme: "In the kitchen", words: ["WHISK", "LADLE", "SKILLET", "GRATER", "SPATULA", "KETTLE"] },
  { theme: "Under the sea", words: ["CORAL", "KELP", "DOLPHIN", "CURRENT", "LAGOON", "PEARL"] },
  { theme: "Instruments", words: ["CELLO", "OBOE", "MARIMBA", "SITAR", "BANJO", "VIOLIN"] },
  { theme: "Wild weather", words: ["MONSOON", "DRIZZLE", "THUNDER", "BREEZE", "CYCLONE", "FROST"] },
  { theme: "Among the trees", words: ["WILLOW", "CEDAR", "JUNIPER", "ASPEN", "BAOBAB", "MAPLE"] },
  { theme: "Gem drawer", words: ["OPAL", "GARNET", "TOPAZ", "AMBER", "JASPER", "BERYL"] },
];
