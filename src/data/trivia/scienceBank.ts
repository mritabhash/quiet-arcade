/**
 * Science topic — elements, units, formulas, discoveries, the living world
 * (classes, collective nouns, baby animals) and a curated layer. Space
 * questions live in the Cosmos bank; the legacy "Science & Space" curated
 * rows are split between the two by keyword.
 */

import {
  ANIMAL_CLASS, BABIES, CLASS_POOL, COLLECTIVES, CURATED, ELEMENTS,
} from "./legacyFacts";
import { Bank, TIER_TARGETS, fmtYear } from "./build";
import type { Tier, TriviaQuestion } from "./types";

export const SPACEY = /planet|galaxy|light-year|satellite|solar system|moon|orbit|space|sputnik|milky way/i;

/** [quantity, unit, tier] */
const UNITS: [string, string, Tier][] = [
  ["power","watt",0],["electrical voltage","volt",0],["sound loudness","decibel",0],
  ["computing data","byte",0],["force","newton",1],["energy","joule",1],
  ["electric current","ampere",1],["electrical resistance","ohm",1],["frequency","hertz",1],
  ["temperature (SI)","kelvin",1],["plane angle","radian",1],["distance at sea","nautical mile",1],
  ["gemstone mass","carat",1],["pressure","pascal",2],["luminous intensity","candela",2],
  ["amount of substance","mole",2],["electrical capacitance","farad",2],
  ["magnetic flux density","tesla",2],["electric charge","coulomb",2],
  ["radioactivity","becquerel",2],["a horse's height","hand",2],["type size in print","point",2],
];

/** [substance, formula, tier] */
const FORMULAS: [string, string, Tier][] = [
  ["water","H₂O",0],["carbon dioxide","CO₂",0],["table salt","NaCl",0],["oxygen gas","O₂",0],
  ["methane","CH₄",1],["ammonia","NH₃",1],["glucose","C₆H₁₂O₆",1],["hydrochloric acid","HCl",1],
  ["hydrogen peroxide","H₂O₂",1],["ozone","O₃",1],["sulfuric acid","H₂SO₄",2],
  ["laughing gas (nitrous oxide)","N₂O",2],["baking soda","NaHCO₃",2],
  ["chalk (calcium carbonate)","CaCO₃",2],["ethanol","C₂H₅OH",2],["rust (iron oxide)","Fe₂O₃",2],
  ["quartz (silica)","SiO₂",2],
];

/** [discovery, discoverer, year, tier] */
const DISCOVERIES: [string, string, number, Tier][] = [
  ["the laws of motion and universal gravitation","Isaac Newton",1687,0],
  ["the theory of general relativity","Albert Einstein",1915,0],
  ["penicillin","Alexander Fleming",1928,0],
  ["evolution by natural selection","Charles Darwin",1859,0],
  ["the practical light bulb","Thomas Edison",1879,0],
  ["the telephone (patent)","Alexander Graham Bell",1876,0],
  ["radium and polonium","Marie Curie",1898,1],
  ["the laws of inheritance, from pea plants","Gregor Mendel",1866,1],
  ["the double-helix structure of DNA","Watson and Crick, using Franklin's data",1953,1],
  ["X-rays","Wilhelm Röntgen",1895,1],
  ["the smallpox vaccine","Edward Jenner",1796,1],
  ["pasteurisation","Louis Pasteur",1864,1],
  ["the periodic table","Dmitri Mendeleev",1869,1],
  ["long-distance radio transmission","Guglielmo Marconi",1901,1],
  ["the polio vaccine","Jonas Salk",1955,1],
  ["dynamite","Alfred Nobel",1867,1],
  ["CRISPR gene editing","Doudna and Charpentier",2012,1],
  ["oxygen","Joseph Priestley",1774,2],
  ["the electron","J.J. Thomson",1897,2],
  ["the neutron","James Chadwick",1932,2],
  ["the proton","Ernest Rutherford",1917,2],
  ["insulin as a diabetes treatment","Banting and Best",1921,2],
  ["the circulation of blood","William Harvey",1628,2],
  ["microorganisms, through a homemade microscope","Antonie van Leeuwenhoek",1674,2],
  ["cells, named after monastery rooms","Robert Hooke",1665,2],
  ["electromagnetic induction","Michael Faraday",1831,2],
  ["energy quanta","Max Planck",1900,2],
  ["the photoelectric effect's explanation","Albert Einstein",1905,2],
  ["superconductivity","Heike Kamerlingh Onnes",1911,2],
  ["radioactivity","Henri Becquerel",1896,2],
];

/** extra curated rows: [q, correct, w1, w2, w3, tier, hint?, note?] */
const EXTRA: [string, string, string, string, string, Tier, string?, string?][] = [
  ["What is often called the powerhouse of the cell?","Mitochondria","Ribosome","Nucleus","Chloroplast",0],
  ["Which blood cells fight infection?","White blood cells","Red blood cells","Platelets","Plasma cells",0],
  ["Which vitamin does your body make from sunlight?","Vitamin D","Vitamin C","Vitamin A","Vitamin B12",0],
  ["What is the hardest natural substance?","Diamond","Quartz","Titanium","Obsidian",0],
  ["Which gas do plants absorb to make food?","Carbon dioxide","Oxygen","Nitrogen","Hydrogen",0],
  ["Which metal is liquid at room temperature?","Mercury","Gallium","Sodium","Tin",0],
  ["Which particle carries a negative charge?","Electron","Proton","Neutron","Photon",0],
  ["Which is the longest bone in the human body?","The femur","The tibia","The humerus","The spine",0],
  ["What is the green pigment in plants called?","Chlorophyll","Melanin","Carotene","Keratin",0],
  ["Which organ filters your blood?","The kidneys","The lungs","The spleen","The gallbladder",0],
  ["Which gas gives fizzy drinks their bubbles?","Carbon dioxide","Oxygen","Helium","Nitrogen",0],
  ["Newton's third law: every action has an equal and opposite…?","Reaction","Attraction","Momentum","Inertia",0],
  ["What is the study of weather called?","Meteorology","Astrology","Geology","Ecology",0],
  ["What is the study of fossils called?","Paleontology","Archaeology","Anthropology","Mineralogy",0],
  ["How many pairs of chromosomes do humans typically have?","23","21","46","32",1],
  ["Which organ produces insulin?","The pancreas","The liver","The kidney","The thyroid",1],
  ["What is the body's largest artery?","The aorta","The carotid","The femoral artery","The vena cava",1],
  ["Which acid works in your stomach?","Hydrochloric acid","Sulfuric acid","Citric acid","Acetic acid",1],
  ["Which part of the brain controls balance and coordination?","The cerebellum","The cortex","The brain stem","The hippocampus",1],
  ["Which is the smallest bone in the human body?","The stapes","The stirrup toe","The pinky phalanx","The coccyx",1,"It lives in your ear."],
  ["What is frozen carbon dioxide commonly called?","Dry ice","Black ice","Permafrost","Glacier glass",1],
  ["What protein are hair and nails made of?","Keratin","Collagen","Elastin","Myosin",1],
  ["Roughly how fast does sound travel in air?","343 metres per second","150 metres per second","1,000 metres per second","30 metres per second",2],
  ["What is absolute zero, roughly, in Celsius?","−273 °C","−100 °C","−373 °C","−212 °C",1],
  ["What is the study of birds called?","Ornithology","Herpetology","Ichthyology","Entomology",1],
  ["What is the study of insects called?","Entomology","Etymology","Ecology","Embryology",1],
  ["What is the study of earthquakes called?","Seismology","Volcanology","Tectonology","Geodesy",1],
  ["What is the study of fungi called?","Mycology","Botany","Bacteriology","Virology",2],
  ["Which element has the highest melting point of any metal?","Tungsten","Iron","Titanium","Platinum",2],
  ["How many chambers does a fish heart have?","2","4","3","1",2],
  ["Animals most active at dawn and dusk are called…?","Crepuscular","Nocturnal","Diurnal","Matutinal",2],
  ["Which sense is most directly wired to memory?","Smell","Sight","Hearing","Touch",1],
  ["What device measures electric current?","An ammeter","A barometer","A voltmeter","An odometer",2],
  ["What kind of energy does a stretched spring store?","Elastic potential energy","Kinetic energy","Thermal energy","Chemical energy",1],
  ["What is the most abundant element in the universe?","Hydrogen","Oxygen","Helium","Carbon",1],
  ["Roughly what fraction of the human body is water?","About 60%","About 30%","About 90%","About 45%",1],
  ["Which blood type is the universal donor?","O negative","AB positive","A positive","B negative",1],
  ["What do you call an animal that eats both plants and meat?","An omnivore","A herbivore","A carnivore","A detritivore",0],
  ["Which tiny structures in cells build proteins?","Ribosomes","Lysosomes","Vacuoles","Centrioles",2],
  ["What is the chemical symbol for potassium?","K","P","Po","Pt",1],
];

export function buildScience(): TriviaQuestion[] {
  const bank = new Bank("Science", 16870705);

  /* ---- elements: symbol / number, both directions ----------------------- */
  const elemTier = (n: number): Tier => (n <= 20 ? (n <= 8 ? 0 : 1) : n <= 36 ? 1 : 2);
  const COMMON = new Set(["Hydrogen","Oxygen","Carbon","Gold","Silver","Iron","Copper","Nitrogen","Helium","Sodium","Calcium","Zinc","Lead","Mercury","Uranium"]);
  for (const [name, symbol, num] of ELEMENTS) {
    const t: Tier = COMMON.has(name) ? 0 : elemTier(num);
    const wrongSyms = bank.pickN(ELEMENTS, 6, (e) => e[1] !== symbol).map((e) => e[1]);
    bank.push(t, `What is the chemical symbol for ${name.toLowerCase()}?`, symbol, wrongSyms.slice(0, 3));
    const wrongNames = bank.pickN(ELEMENTS, 6, (e) => e[0] !== name).map((e) => e[0]);
    bank.push(t, `Which element has the symbol ${symbol}?`, name, wrongNames.slice(0, 3));
    bank.push(2, `What is the atomic number of ${name.toLowerCase()}?`, String(num),
      numWrongs(bank.rng, num), undefined, `${name} (${symbol}) is element ${num}.`);
  }

  /* ---- units and formulas ------------------------------------------------ */
  for (const [quantity, unit, t] of UNITS) {
    const wrongUnits = bank.pickN(UNITS, 6, (u) => u[1] !== unit).map((u) => u[1]);
    bank.push(t, `Which unit measures ${quantity}?`, unit, wrongUnits.slice(0, 3));
    const wrongQs = bank.pickN(UNITS, 6, (u) => u[0] !== quantity).map((u) => u[0]);
    bank.push(t, `The ${unit} is a unit of what?`, quantity, wrongQs.slice(0, 3));
  }
  for (const [substance, formula, t] of FORMULAS) {
    const wrongFs = bank.pickN(FORMULAS, 6, (f) => f[1] !== formula).map((f) => f[1]);
    bank.push(t, `What is the chemical formula of ${substance}?`, formula, wrongFs.slice(0, 3));
    const wrongSubs = bank.pickN(FORMULAS, 6, (f) => f[0] !== substance).map((f) => f[0]);
    bank.push(t, `${formula} is the formula of what?`, substance, wrongSubs.slice(0, 3));
  }

  /* ---- discoveries -------------------------------------------------------- */
  for (const [what, who, year, t] of DISCOVERIES) {
    const wrongWho = [...new Set(bank.pickN(DISCOVERIES, 8, (d) => d[1] !== who).map((d) => d[1]))];
    bank.push(t, `Who gave the world ${what}?`, who, wrongWho.slice(0, 3), `Think ${fmtYear(year)}.`);
  }

  /* ---- the living world ---------------------------------------------------- */
  for (const [animal, cls] of ANIMAL_CLASS) {
    bank.push(1, `What kind of animal is a ${animal}?`, cls, CLASS_POOL.filter((c) => c !== cls).slice(0, 3));
  }
  for (const [animals, group] of COLLECTIVES) {
    const wrongs = bank.pickN(COLLECTIVES, 6, (c) => c[1] !== group).map((c) => c[1]);
    bank.push(2, `What is a group of ${animals} called?`, group, wrongs.slice(0, 3));
  }
  for (const [animal, baby] of BABIES) {
    const wrongs = bank.pickN(BABIES, 6, (b) => b[1] !== baby).map((b) => b[1]);
    bank.push(1, `What is a baby ${animal} called?`, baby, wrongs.slice(0, 3));
  }

  /* ---- curated layers -------------------------------------------------------- */
  for (const [topic, q, correct, w1, w2, w3, note] of CURATED) {
    if (topic !== "Science & Space" && topic !== "Nature") continue;
    if (SPACEY.test(q + " " + correct)) continue; // those belong to Cosmos
    bank.push(topic === "Nature" ? 0 : 1, q, correct, [w1, w2, w3], undefined, note);
  }
  for (const [q, correct, w1, w2, w3, t, hint, note] of EXTRA) {
    bank.push(t, q, correct, [w1, w2, w3], hint, note);
  }

  /* ---- fills per tier ----------------------------------------------------------- */
  for (const t of [0, 1, 2] as Tier[]) {
    const target = TIER_TARGETS[t];

    // which element is heavier (higher atomic number)?
    const elems = ELEMENTS.filter(([n, , num]) => (t === 0 ? COMMON.has(n) : t === 1 ? num <= 36 || COMMON.has(n) : true));
    bank.fillSuperlative(t, Math.floor(target * 0.3), elems, (e) => e[2], t === 0 ? 20 : t === 1 ? 8 : 3, true,
      (_four, best) => ({
        q: "Which of these elements has the highest atomic number?",
        label: (e) => e[0],
        note: `${best[0]} is element ${best[2]}.`,
      }));

    // which came first among discoveries?
    bank.fillSuperlative(t, Math.floor(target * 0.45), DISCOVERIES.filter((d) => d[3] <= t || t === 2),
      (d) => d[2], t === 0 ? 60 : t === 1 ? 25 : 10, false,
      (_four, best) => ({
        q: "Which of these breakthroughs came first?",
        label: (d) => capitalise(d[0]),
        note: `${capitalise(best[0])} — ${fmtYear(best[2])} (${best[1]}).`,
      }));

    // class identification quadruples: one mammal among non-mammals, etc.
    bank.fill(t, Math.floor(target * 0.7), () => {
      const cls = bank.one(CLASS_POOL);
      const inCls = ANIMAL_CLASS.filter((a) => a[1] === cls);
      const outCls = ANIMAL_CLASS.filter((a) => a[1] !== cls);
      if (!inCls.length || outCls.length < 3) return;
      const correct = bank.one(inCls);
      bank.push(t, `Which of these animals is a ${cls}?`, correct[0],
        bank.pickN(outCls, 3).map((a) => a[0]), undefined,
        `The ${correct[0]} is a ${cls}.`);
    });

    // symbol / collective / baby re-asks with fresh line-ups (catch-all)
    bank.fill(t, target, () => {
      const roll = bank.rng();
      if (roll < 0.4) {
        const e = bank.one(elems);
        const wrongs = bank.pickN(ELEMENTS, 6, (x) => x[1] !== e[1]).map((x) => x[1]);
        bank.push(t, `What is the chemical symbol for ${e[0].toLowerCase()}?`, e[1], wrongs.slice(0, 3));
      } else if (roll < 0.7) {
        const e = bank.one(elems);
        const wrongs = bank.pickN(ELEMENTS, 6, (x) => x[0] !== e[0]).map((x) => x[0]);
        bank.push(t, `Which element has the symbol ${e[1]}?`, e[0], wrongs.slice(0, 3));
      } else if (roll < 0.85) {
        const u = bank.one(UNITS);
        const wrongs = bank.pickN(UNITS, 6, (x) => x[1] !== u[1]).map((x) => x[1]);
        bank.push(t, `Which unit measures ${u[0]}?`, u[1], wrongs.slice(0, 3));
      } else {
        const c = bank.one(COLLECTIVES);
        const wrongs = bank.pickN(COLLECTIVES, 6, (x) => x[1] !== c[1]).map((x) => x[1]);
        bank.push(t, `What is a group of ${c[0]} called?`, c[1], wrongs.slice(0, 3));
      }
    });
  }

  return bank.qs;
}

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** 3 nearby-but-wrong atomic numbers, always ≥ 1 */
function numWrongs(rng: () => number, n: number): string[] {
  const out = new Set<number>();
  let guard = 0;
  while (out.size < 3 && guard++ < 60) {
    const off = 1 + Math.floor(rng() * 6);
    const v = rng() < 0.5 ? n - off : n + off;
    if (v >= 1 && v !== n) out.add(v);
  }
  return [...out].map(String);
}
