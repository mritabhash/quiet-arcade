/**
 * Cosmos topic — planets, moons, missions, constellations and space history.
 * Moon counts shift with new discoveries, so questions compare "known moons"
 * loosely and lean on order-from-the-Sun, rings and mission feats instead of
 * exact figures. Space-flavoured legacy curated rows land here.
 */

import { CURATED } from "./legacyFacts";
import { SPACEY } from "./scienceBank";
import { Bank, TIER_TARGETS, fmtYear, yearWrongs } from "./build";
import type { Tier, TriviaQuestion } from "./types";

/** [name, order from Sun, rough known moons, has famous rings, kind, claim to fame] */
const PLANETS: [string, number, number, boolean, string, string][] = [
  ["Mercury",1,0,false,"rocky","the smallest planet, closest to the Sun"],
  ["Venus",2,0,false,"rocky","the hottest planet, wrapped in thick clouds"],
  ["Earth",3,1,false,"rocky","the only known home of life"],
  ["Mars",4,2,false,"rocky","the red planet, home of Olympus Mons"],
  ["Jupiter",5,95,false,"gas giant","the largest planet, with the Great Red Spot"],
  ["Saturn",6,146,true,"gas giant","famous for its bright rings"],
  ["Uranus",7,28,false,"ice giant","the planet that spins on its side"],
  ["Neptune",8,16,false,"ice giant","the windiest planet, farthest from the Sun"],
];

/** [moon, body it orbits, tier] */
const MOONS: [string, string, Tier][] = [
  ["Phobos","Mars",1],["Deimos","Mars",2],["Io","Jupiter",1],["Europa","Jupiter",1],
  ["Ganymede","Jupiter",1],["Callisto","Jupiter",2],["Titan","Saturn",1],["Enceladus","Saturn",2],
  ["Mimas","Saturn",2],["Iapetus","Saturn",2],["Rhea","Saturn",2],["Triton","Neptune",2],
  ["Titania","Uranus",2],["Oberon","Uranus",2],["Miranda","Uranus",2],
  ["Charon","the dwarf planet Pluto",1],
];

/** [mission or milestone, year, feat, tier] */
const MISSIONS: [string, number, string, Tier][] = [
  ["Sputnik 1",1957,"became the first artificial satellite",0],
  ["Sputnik 2",1957,"carried Laika, the first animal to orbit Earth",1],
  ["Vostok 1",1961,"carried Yuri Gagarin, the first human in space",0],
  ["Vostok 6",1963,"carried Valentina Tereshkova, the first woman in space",1],
  ["Voskhod 2",1965,"saw Alexei Leonov make the first spacewalk",1],
  ["Apollo 8",1968,"first carried humans around the Moon",1],
  ["Apollo 11",1969,"made the first crewed Moon landing",0],
  ["Apollo 13",1970,"survived an oxygen-tank explosion and returned home",1],
  ["Apollo 17",1972,"made the last crewed Moon landing to date",1],
  ["Luna 2",1959,"was the first spacecraft to reach the Moon",2],
  ["Mariner 4",1965,"sent back the first close-up pictures of Mars",2],
  ["Venera 7",1970,"made the first soft landing on Venus",2],
  ["Pioneer 10",1972,"first flew through the asteroid belt",2],
  ["Voyager 1",1977,"became the farthest human-made object from Earth",1],
  ["Voyager 2",1977,"is the only probe to have visited Uranus and Neptune",1],
  ["Viking 1",1976,"made the first lasting landing on Mars",2],
  ["Skylab",1973,"was America's first space station",2],
  ["Salyut 1",1971,"was the world's first space station",2],
  ["Mir",1986,"was the long-lived Soviet space station",1],
  ["the International Space Station",1998,"began assembly in orbit",1],
  ["the Hubble Space Telescope",1990,"opened a famous eye on the universe from orbit",0],
  ["Cassini",1997,"spent thirteen years studying Saturn and its moons",1],
  ["Huygens",2005,"landed on Saturn's moon Titan",2],
  ["Galileo",1989,"was the first spacecraft to orbit Jupiter",2],
  ["New Horizons",2006,"set off to give humanity its first close look at Pluto",1],
  ["Mars Pathfinder",1997,"delivered Sojourner, the first Mars rover",2],
  ["Spirit and Opportunity",2004,"were twin rovers that far outlived their missions on Mars",1],
  ["Curiosity",2012,"landed a car-sized rover in Gale Crater on Mars",0],
  ["Perseverance",2021,"carried the Ingenuity helicopter to Mars",0],
  ["Ingenuity",2021,"made the first powered flight on another planet",1],
  ["Rosetta",2014,"orbited a comet for the first time",1],
  ["Philae",2014,"made the first landing on a comet",2],
  ["the James Webb Space Telescope",2021,"unfolded as Hubble's giant infrared successor",0],
  ["Chandrayaan-3",2023,"made the first landing near the Moon's south pole",1],
  ["Crew Dragon Demo-2",2020,"was the first crewed orbital flight by a private company",1],
  ["Juno",2011,"set out to orbit Jupiter and peer beneath its clouds",2],
  ["the Parker Solar Probe",2018,"flew closer to the Sun than any craft before it",1],
  ["Kepler",2009,"hunted planets around other stars",2],
  ["Dawn",2007,"visited the asteroid Vesta and the dwarf planet Ceres",2],
  ["Hayabusa2",2014,"brought samples of an asteroid back to Earth",2],
  ["OSIRIS-REx",2016,"collected a sample from the asteroid Bennu",2],
  ["MESSENGER",2004,"became the first spacecraft to orbit Mercury",2],
  ["Magellan",1989,"mapped Venus through its clouds by radar",2],
  ["Apollo-Soyuz",1975,"was the first international crewed docking in orbit",2],
  ["STS-1",1981,"was the maiden flight of the Space Shuttle",1],
  ["Shenzhou 5",2003,"carried China's first astronaut",1],
  ["Artemis I",2022,"flew an uncrewed test around the Moon for a new era",1],
];

/** [constellation, what it depicts, tier] */
const CONSTELLATIONS: [string, string, Tier][] = [
  ["Orion","the Hunter",0],["Ursa Major","the Great Bear",0],["Taurus","the Bull",0],
  ["Leo","the Lion",0],["Gemini","the Twins",0],["Ursa Minor","the Little Bear",1],
  ["Canis Major","the Great Dog",1],["Scorpius","the Scorpion",1],["Cygnus","the Swan",1],
  ["Pegasus","the Winged Horse",1],["Cassiopeia","the Seated Queen",1],["Draco","the Dragon",1],
  ["Aries","the Ram",1],["Cancer","the Crab",1],["Virgo","the Maiden",1],["Libra","the Scales",1],
  ["Sagittarius","the Archer",1],["Aquarius","the Water Bearer",1],["Pisces","the Fish",1],
  ["Crux","the Southern Cross",1],["Andromeda","the Chained Princess",2],
  ["Aquila","the Eagle",2],["Lyra","the Lyre",2],["Capricornus","the Sea Goat",2],
  ["Centaurus","the Centaur",2],["Cetus","the Sea Monster",2],["Delphinus","the Dolphin",2],
  ["Corvus","the Crow",2],["Lepus","the Hare",2],["Vulpecula","the Little Fox",2],
  ["Monoceros","the Unicorn",2],["Pavo","the Peacock",2],["Tucana","the Toucan",2],
  ["Grus","the Crane",2],["Camelopardalis","the Giraffe",2],["Ophiuchus","the Serpent Bearer",2],
  ["Boötes","the Herdsman",2],["Auriga","the Charioteer",2],["Perseus","the Hero",2],
  ["Hydra","the Water Snake",2],
];

/** curated cosmos rows: [q, correct, w1, w2, w3, tier, note?] */
const SPACE_FACTS: [string, string, string, string, string, Tier, string?][] = [
  ["What is the Sun?","A star","A planet","A comet","A nebula",0],
  ["Roughly how long does sunlight take to reach Earth?","8 minutes","8 seconds","8 hours","8 days",0],
  ["Which planet do the moons Phobos and Deimos orbit?","Mars","Jupiter","Saturn","Neptune",1,"Their names mean fear and panic."],
  ["On which planet does a day last longer than its year?","Venus","Mercury","Mars","Jupiter",1],
  ["Where is Olympus Mons, the tallest volcano known?","Mars","Earth","Venus","Io",1],
  ["What is Jupiter's Great Red Spot?","A giant storm","A volcano","A crater","A frozen sea",0],
  ["Which planet is light enough that it would float in water?","Saturn","Jupiter","Uranus","Mercury",1],
  ["In 2006, Pluto was reclassified as a what?","Dwarf planet","Comet","Asteroid","Moon",0],
  ["What is Ceres?","The largest object in the asteroid belt","A moon of Mars","A comet","A distant star",2],
  ["Roughly how often does Halley's Comet return?","Every 76 years","Every 10 years","Every 200 years","Every 500 years",1],
  ["Which galaxy is on a slow collision course with the Milky Way?","Andromeda","Whirlpool","Sombrero","Triangulum",1],
  ["What is the nearest star system to our own?","Alpha Centauri","Sirius","Betelgeuse","Vega",1],
  ["A light-year measures what?","Distance","Time","Speed","Brightness",0],
  ["What do we call a star that collapses into a point of no return?","A black hole","A supernova","A quasar","A pulsar",0],
  ["What is a supernova?","An exploding star","A newborn star","A spinning galaxy","A meteor shower",0],
  ["What will our Sun eventually swell into?","A red giant","A black hole","A blue dwarf","A comet",1],
  ["About how long does the ISS take to orbit Earth?","90 minutes","24 hours","8 hours","10 minutes",1],
  ["Why do astronauts get slightly taller in space?","Their spines decompress","Bones grow faster","Their suits stretch them","Lower gravity inflates cells",1],
  ["Why do footprints on the Moon last so long?","There is no wind or rain","Moon dust is sticky","Gravity presses them deep","They are frozen in ice",0],
  ["The Moon drifts away from Earth by about how much each year?","4 centimetres","4 metres","4 millimetres","40 centimetres",2],
  ["Ocean tides are caused mainly by what?","The Moon's gravity","Earth's spin","The Sun's heat","Deep sea currents",0],
  ["A solar eclipse happens when what blocks the Sun?","The Moon","Earth's shadow","Venus","Clouds of dust",0],
  ["Auroras are caused by what striking the atmosphere?","Particles from the Sun","Moonlight","Meteor dust","Cosmic rays from deep space",1],
  ["The asteroid belt lies between which two planets?","Mars and Jupiter","Earth and Mars","Jupiter and Saturn","Venus and Earth",1],
  ["What lies beyond Neptune, home to Pluto?","The Kuiper Belt","The Oort Wall","The Great Void","The Bok Corridor",2],
  ["Which moon has a thick orange atmosphere?","Titan","Europa","Io","Triton",2],
  ["Which moon likely hides an ocean beneath its ice?","Europa","Phobos","Miranda","Deimos",1],
  ["Betelgeuse is a famous red star in which constellation?","Orion","Taurus","Leo","Cygnus",2],
  ["What is the brightest star in the night sky?","Sirius","Polaris","Vega","Betelgeuse",1],
  ["Polaris, the North Star, sits in which constellation?","Ursa Minor","Ursa Major","Orion","Cassiopeia",2],
  ["Which planet often shines as the 'evening star'?","Venus","Mars","Jupiter","Mercury",1],
  ["What are Saturn's rings mostly made of?","Ice","Rock dust","Gas","Metal fragments",1],
  ["Who first saw Jupiter's four big moons through a telescope?","Galileo Galilei","Isaac Newton","Johannes Kepler","Edmond Halley",1],
  ["Who published the Sun-centred model of the heavens in 1543?","Nicolaus Copernicus","Galileo Galilei","Tycho Brahe","Ptolemy",1],
  ["Kepler's laws describe what?","How planets orbit the Sun","How stars are born","How galaxies spin","How comets melt",2],
  ["What does NASA stand for?","National Aeronautics and Space Administration","North American Space Agency","National Astronomy and Satellite Association","New Age Space Alliance",0],
  ["Which country launched the first satellite?","The Soviet Union","The United States","China","Germany",0],
  ["What is a shooting star really?","A meteor burning up","A falling star","A comet's tail","A satellite flare",0],
  ["The Milky Way is what kind of galaxy?","A spiral galaxy","An elliptical galaxy","A ring galaxy","An irregular galaxy",1],
  ["Roughly how many stars are in the Milky Way?","100–400 billion","1 million","50 trillion","10,000",2],
];

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function buildCosmos(): TriviaQuestion[] {
  const bank = new Bank("Cosmos", 19691207);

  const planetNames = PLANETS.map((p) => p[0]);
  const ordinal = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth"];

  /* ---- planets ----------------------------------------------------------- */
  for (const [name, order, , , kind, fame] of PLANETS) {
    bank.push(0, `Which planet is ${fame}?`, name,
      bank.pickN(planetNames, 3, (p) => p !== name));
    bank.push(1, `Which planet is ${ordinal[order - 1]} from the Sun?`, name,
      bank.pickN(planetNames, 3, (p) => p !== name), undefined,
      `${name} is planet number ${order}.`);
    bank.push(2, `What kind of planet is ${name}?`, kind,
      ["rocky", "gas giant", "ice giant", "dwarf planet"].filter((k) => k !== kind));
  }

  /* ---- moons -------------------------------------------------------------- */
  for (const [moon, body, t] of MOONS) {
    const wrongBodies = [...new Set(MOONS.map((m) => m[1]).filter((b) => b !== body))];
    bank.push(t, `${moon} is a moon of which body?`, body, bank.pickN(wrongBodies, 3));
  }

  /* ---- missions, both directions ------------------------------------------ */
  for (const [mission, year, feat, t] of MISSIONS) {
    const wrongMissions = bank.pickN(MISSIONS, 6, (m) => m[0] !== mission).map((m) => m[0]);
    bank.push(t, `Which mission ${feat}?`, mission, wrongMissions.slice(0, 3), `Think ${fmtYear(year)}.`);
    bank.push(2, `Which year saw this space milestone? “${capitalise(mission)} ${feat}”`,
      fmtYear(year), yearWrongs(bank.rng, year, 6));
  }

  /* ---- constellations ------------------------------------------------------- */
  for (const [name, depicts, t] of CONSTELLATIONS) {
    const wrongDepicts = bank.pickN(CONSTELLATIONS, 6, (c) => c[1] !== depicts).map((c) => c[1]);
    bank.push(t, `In the night sky, what does the constellation ${name} depict?`, depicts,
      wrongDepicts.slice(0, 3));
    const wrongNames = bank.pickN(CONSTELLATIONS, 6, (c) => c[0] !== name).map((c) => c[0]);
    bank.push(t === 0 ? 1 : t, `Which constellation depicts ${depicts}?`, name, wrongNames.slice(0, 3));
  }

  /* ---- curated space rows (new + legacy) -------------------------------------- */
  for (const [q, correct, w1, w2, w3, t, note] of SPACE_FACTS) {
    bank.push(t, q, correct, [w1, w2, w3], undefined, note);
  }
  for (const [topic, q, correct, w1, w2, w3, note] of CURATED) {
    if (topic !== "Science & Space") continue;
    if (!SPACEY.test(q + " " + correct)) continue;
    bank.push(1, q, correct, [w1, w2, w3], undefined, note);
  }

  /* ---- fills per tier ------------------------------------------------------------ */
  for (const t of [0, 1, 2] as Tier[]) {
    const target = TIER_TARGETS[t];
    const missions = MISSIONS.filter((m) => (t === 0 ? m[3] === 0 : m[3] <= t));

    // planet order comparisons: closest to / farthest from the Sun
    bank.fillSuperlative(t, Math.floor(target * 0.18), PLANETS, (p) => p[1], 1, false,
      (_four, best) => ({
        q: "Which of these planets is closest to the Sun?",
        label: (p) => p[0],
        note: `${best[0]} is the ${ordinal[best[1] - 1]} planet from the Sun.`,
      }));
    bank.fillSuperlative(t, Math.floor(target * 0.32), PLANETS, (p) => p[1], 1, true,
      (_four, _best) => ({
        q: "Which of these planets is farthest from the Sun?",
        label: (p) => p[0],
      }));

    // moons of a given body
    bank.fill(t, Math.floor(target * 0.45), () => {
      const body = bank.one(["Mars", "Jupiter", "Saturn", "Uranus"]);
      const ofBody = MOONS.filter((m) => m[1] === body && (t === 2 || m[2] <= t));
      const others = MOONS.filter((m) => m[1] !== body);
      if (!ofBody.length || others.length < 3) return;
      const correct = bank.one(ofBody);
      bank.push(t, `Which of these moons orbits ${body}?`, correct[0],
        bank.pickN(others, 3).map((m) => m[0]));
    });

    // mission ordering
    bank.fillSuperlative(t, Math.floor(target * 0.6), missions, (m) => m[1],
      t === 0 ? 12 : t === 1 ? 5 : 2, false,
      (_four, best) => ({
        q: "Which of these space milestones came first?",
        label: (m) => m[0],
        note: `${best[0]} — ${fmtYear(best[1])}.`,
      }));

    // mission feat re-asks with fresh line-ups (catch-all)
    bank.fill(t, target, () => {
      const m = bank.one(missions);
      const wrongs = bank.pickN(MISSIONS, 6, (x) => x[0] !== m[0]).map((x) => x[0]);
      bank.push(t, `Which mission ${m[2]}?`, m[0], wrongs.slice(0, 3), `Think ${fmtYear(m[1])}.`);
    });
  }

  return bank.qs;
}
