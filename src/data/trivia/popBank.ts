/**
 * Pop Culture topic — music hits and their artists, video games, brands and
 * platforms, comics/toys/games ephemera, plus the legacy curated rows for
 * sports, food, arts and words (they're pop culture in a cozy pub-quiz
 * sense). Song titles only — never lyrics.
 */

import { CURATED } from "./legacyFacts";
import { Bank, TIER_TARGETS, decadeOf, decadeWrongs } from "./build";
import type { Tier, TriviaQuestion } from "./types";

/** [artist, signature hit, year of hit, tier] */
const MUSIC: [string, string, number, Tier][] = [
  ["The Beatles","Hey Jude",1968,0],["Queen","Bohemian Rhapsody",1975,0],
  ["Michael Jackson","Thriller",1982,0],["Madonna","Like a Prayer",1989,0],
  ["Elvis Presley","Jailhouse Rock",1957,0],["ABBA","Dancing Queen",1976,0],
  ["Adele","Rolling in the Deep",2010,0],["Taylor Swift","Shake It Off",2014,0],
  ["Beyoncé","Single Ladies",2008,0],["Ed Sheeran","Shape of You",2017,0],
  ["Rihanna","Umbrella",2007,0],["Lady Gaga","Bad Romance",2009,0],
  ["Whitney Houston","I Will Always Love You",1992,0],
  ["Mariah Carey","All I Want for Christmas Is You",1994,0],
  ["Bob Marley","No Woman, No Cry",1974,0],["Elton John","Rocket Man",1972,0],
  ["Billy Joel","Piano Man",1973,0],["The Rolling Stones","Paint It Black",1966,0],
  ["Nirvana","Smells Like Teen Spirit",1991,0],["Coldplay","Viva la Vida",2008,0],
  ["U2","With or Without You",1987,0],["Eminem","Lose Yourself",2002,0],
  ["Drake","Hotline Bling",2015,0],["Billie Eilish","Bad Guy",2019,0],
  ["The Weeknd","Blinding Lights",2019,0],["Dua Lipa","Levitating",2020,0],
  ["Katy Perry","Firework",2010,0],["Justin Bieber","Sorry",2015,0],
  ["Britney Spears","…Baby One More Time",1998,0],
  ["Backstreet Boys","I Want It That Way",1999,0],["Spice Girls","Wannabe",1996,0],
  ["BTS","Dynamite",2020,0],["PSY","Gangnam Style",2012,0],
  ["Shakira","Hips Don't Lie",2006,0],["Bee Gees","Stayin' Alive",1977,0],
  ["John Lennon","Imagine",1971,0],["David Bowie","Space Oddity",1969,0],
  ["Prince","Purple Rain",1984,0],["Stevie Wonder","Superstition",1972,0],
  ["Aretha Franklin","Respect",1967,0],["Frank Sinatra","My Way",1969,0],
  ["Louis Armstrong","What a Wonderful World",1967,0],
  ["Bob Dylan","Like a Rolling Stone",1965,0],
  ["Pink Floyd","Another Brick in the Wall",1979,1],["Led Zeppelin","Stairway to Heaven",1971,1],
  ["The Beach Boys","Good Vibrations",1966,1],["Simon & Garfunkel","The Sound of Silence",1964,1],
  ["Fleetwood Mac","Dreams",1977,1],["Eagles","Hotel California",1976,1],
  ["AC/DC","Back in Black",1980,1],["Guns N' Roses","Sweet Child o' Mine",1987,1],
  ["Metallica","Enter Sandman",1991,1],["Bon Jovi","Livin' on a Prayer",1986,1],
  ["Bruce Springsteen","Born to Run",1975,1],["R.E.M.","Losing My Religion",1991,1],
  ["Radiohead","Creep",1992,1],["Oasis","Wonderwall",1995,1],
  ["Red Hot Chili Peppers","Californication",1999,1],["Green Day","American Idiot",2004,1],
  ["Linkin Park","In the End",2001,1],["Alicia Keys","Fallin'",2001,1],
  ["Amy Winehouse","Rehab",2006,1],["Sam Smith","Stay with Me",2014,1],
  ["Sia","Chandelier",2014,1],["Lorde","Royals",2013,1],["Avicii","Wake Me Up",2013,1],
  ["Daft Punk","Get Lucky",2013,1],["Gotye","Somebody That I Used to Know",2011,1],
  ["OutKast","Hey Ya!",2003,1],["Jay-Z","Empire State of Mind",2009,1],
  ["Kanye West","Stronger",2007,1],["2Pac","California Love",1995,1],
  ["The Police","Every Breath You Take",1983,1],
  ["Tina Turner","What's Love Got to Do with It",1984,1],
  ["Cyndi Lauper","Girls Just Want to Have Fun",1983,1],["a-ha","Take On Me",1985,1],
  ["Toto","Africa",1982,1],["Journey","Don't Stop Believin'",1981,1],
  ["George Michael","Careless Whisper",1984,1],["Celine Dion","My Heart Will Go On",1997,1],
  ["Ricky Martin","Livin' la Vida Loca",1999,1],["Alanis Morissette","Ironic",1996,1],
  ["No Doubt","Don't Speak",1996,1],["TLC","Waterfalls",1995,1],
  ["Destiny's Child","Say My Name",2000,1],["Usher","Yeah!",2004,1],
  ["50 Cent","In da Club",2003,1],["Black Eyed Peas","I Gotta Feeling",2009,1],
  ["Maroon 5","Moves Like Jagger",2011,1],["Imagine Dragons","Radioactive",2012,1],
  ["Twenty One Pilots","Stressed Out",2015,1],["Harry Styles","As It Was",2022,1],
  ["Olivia Rodrigo","Drivers License",2021,1],["Blackpink","DDU-DU DDU-DU",2018,1],
  ["Chuck Berry","Johnny B. Goode",1958,2],["Little Richard","Tutti Frutti",1955,2],
  ["Buddy Holly","Peggy Sue",1957,2],["The Kinks","You Really Got Me",1964,2],
  ["The Who","My Generation",1965,2],["Jimi Hendrix","Purple Haze",1967,2],
  ["Janis Joplin","Piece of My Heart",1968,2],["The Doors","Light My Fire",1967,2],
  ["Creedence Clearwater Revival","Fortunate Son",1969,2],
  ["Deep Purple","Smoke on the Water",1972,2],["Black Sabbath","Paranoid",1970,2],
  ["T. Rex","Get It On",1971,2],["Talking Heads","Once in a Lifetime",1980,2],
  ["Joy Division","Love Will Tear Us Apart",1980,2],["The Cure","Friday I'm in Love",1992,2],
  ["The Smiths","This Charming Man",1983,2],["New Order","Blue Monday",1983,2],
  ["Depeche Mode","Enjoy the Silence",1990,2],["Pixies","Where Is My Mind?",1988,2],
  ["Nina Simone","Feeling Good",1965,2],["Etta James","At Last",1960,2],
  ["Ray Charles","Georgia on My Mind",1960,2],["Sam Cooke","A Change Is Gonna Come",1964,2],
  ["Otis Redding","(Sittin' On) The Dock of the Bay",1968,2],
  ["Marvin Gaye","What's Going On",1971,2],["Al Green","Let's Stay Together",1971,2],
  ["Dolly Parton","Jolene",1973,2],["Johnny Cash","Ring of Fire",1963,2],
  ["Leonard Cohen","Hallelujah",1984,2],["Kate Bush","Running Up That Hill",1985,2],
  ["Björk","It's Oh So Quiet",1995,2],["Massive Attack","Teardrop",1998,2],
  ["Édith Piaf","La Vie en rose",1946,2],["Miriam Makeba","Pata Pata",1967,2],
];

/** [game, maker, year, tier] */
const GAMES: [string, string, number, Tier][] = [
  ["Minecraft","Mojang",2011,0],["Fortnite","Epic Games",2017,0],["Tetris","Alexey Pajitnov",1984,0],
  ["Super Mario Bros.","Nintendo",1985,0],["Pac-Man","Namco",1980,0],
  ["Pokémon GO","Niantic",2016,0],["Candy Crush Saga","King",2012,0],
  ["Angry Birds","Rovio",2009,0],["Among Us","Innersloth",2018,0],
  ["Grand Theft Auto V","Rockstar Games",2013,0],["Wordle","Josh Wardle",2021,0],
  ["Roblox","Roblox Corporation",2006,0],["Sonic the Hedgehog","Sega",1991,0],
  ["The Sims","Maxis",2000,0],["Wii Sports","Nintendo",2006,0],
  ["The Legend of Zelda","Nintendo",1986,1],["Pokémon Red & Green","Game Freak",1996,1],
  ["Space Invaders","Taito",1978,1],["World of Warcraft","Blizzard",2004,1],
  ["Skyrim","Bethesda",2011,1],["The Witcher 3","CD Projekt Red",2015,1],
  ["The Last of Us","Naughty Dog",2013,1],["Halo","Bungie",2001,1],
  ["League of Legends","Riot Games",2009,1],["Overwatch","Blizzard",2016,1],
  ["Doom","id Software",1993,1],["Street Fighter II","Capcom",1991,1],
  ["Mortal Kombat","Midway",1992,1],["Donkey Kong","Nintendo",1981,1],
  ["Animal Crossing","Nintendo",2001,1],["Clash of Clans","Supercell",2012,1],
  ["Elden Ring","FromSoftware",2022,1],["Genshin Impact","miHoYo",2020,1],
  ["Portal","Valve",2007,1],["Counter-Strike","Valve",2000,1],
  ["Red Dead Redemption","Rockstar Games",2010,1],
  ["Half-Life","Valve",1998,2],["God of War","Sony Santa Monica",2005,2],
  ["Uncharted","Naughty Dog",2007,2],["Dark Souls","FromSoftware",2011,2],
  ["Final Fantasy VII","Square",1997,2],["Metal Gear Solid","Konami",1998,2],
  ["Resident Evil","Capcom",1996,2],["Silent Hill","Konami",1999,2],
  ["Stardew Valley","ConcernedApe",2016,2],["Terraria","Re-Logic",2011,2],
  ["Hollow Knight","Team Cherry",2017,2],["Undertale","Toby Fox",2015,2],
  ["Baldur's Gate 3","Larian Studios",2023,2],["Cyberpunk 2077","CD Projekt Red",2020,2],
];

/** [thing, launch year, tier] */
const LAUNCHES: [string, number, Tier][] = [
  ["YouTube",2005,0],["Facebook",2004,0],["Instagram",2010,0],["TikTok",2016,0],
  ["Twitter",2006,0],["WhatsApp",2009,0],["Snapchat",2011,0],["Netflix",1997,1],
  ["Spotify",2008,0],["Disney+",2019,0],["Twitch",2011,1],["Reddit",2005,1],
  ["Pinterest",2010,1],["LinkedIn",2003,1],["Discord",2015,1],["Telegram",2013,1],
  ["Uber",2009,1],["Airbnb",2008,1],["the PlayStation",1994,1],["the Xbox",2001,1],
  ["the Game Boy",1989,1],["the Sony Walkman",1979,1],["MTV",1981,2],["Disneyland",1955,1],
  ["the Barbie doll",1959,1],["Hot Wheels",1968,2],["the Rubik's Cube",1974,1],
  ["Dungeons & Dragons",1974,2],["Monopoly (Parker Brothers)",1935,2],
  ["Scrabble",1948,2],["the first Eurovision Song Contest",1956,2],
  ["the first Glastonbury Festival",1970,2],["the first Comic-Con in San Diego",1970,2],
];

/** curated: [q, correct, w1, w2, w3, tier, note?] */
const EXTRA: [string, string, string, string, string, Tier, string?][] = [
  ["Which pop star is known as the 'Queen of Pop'?","Madonna","Cher","Britney Spears","Celine Dion",0],
  ["What nationality is ABBA?","Swedish","Norwegian","Danish","Dutch",0],
  ["Which country gave the world K-pop?","South Korea","Japan","China","Thailand",0],
  ["Which artist has won the most Grammy Awards?","Beyoncé","Taylor Swift","Michael Jackson","Stevie Wonder",1,"She passed the record in 2023."],
  ["Which festival takes place at Worthy Farm in England?","Glastonbury","Coachella","Lollapalooza","Reading",1],
  ["Coachella takes place in which US state?","California","Nevada","Texas","Arizona",1],
  ["Which toy brand is famous for its minifigures?","LEGO","Playmobil","Mattel","Hasbro",0],
  ["Which fast-food chain's mascot is a clown?","McDonald's","Burger King","KFC","Wendy's",0],
  ["'Just Do It' is the slogan of which brand?","Nike","Adidas","Puma","Reebok",0],
  ["'I'm Lovin' It' belongs to which chain?","McDonald's","Subway","Domino's","Starbucks",0],
  ["What colour is the Netflix logo?","Red","Blue","Black","Green",0],
  ["Which app's icon is a white ghost?","Snapchat","WhatsApp","Discord","Signal",1],
  ["In fan culture, what does 'GOAT' stand for?","Greatest of All Time","Golden Order of All Talent","Great Original Artist Trophy","Grandest of All Titles",0],
  ["Los del Río sparked which 90s dance craze?","The Macarena","The Ketchup Song","La Bamba","Lambada",1],
  ["Which app popularised 15-second dance challenges?","TikTok","Vine","Instagram","YouTube",0],
  ["Taylor Swift's fans are known as…?","Swifties","Taylors","Swiftlings","The Eras",0],
  ["Harry Styles rose to fame with which boy band?","One Direction","NSYNC","The Wanted","Westlife",0],
  ["Beyoncé rose to fame with which group?","Destiny's Child","TLC","En Vogue","The Pussycat Dolls",1],
  ["Justin Timberlake left which group to go solo?","NSYNC","Backstreet Boys","98 Degrees","Boyz II Men",1],
  ["Which rapper co-founded Beats headphones?","Dr. Dre","Jay-Z","Kanye West","Snoop Dogg",1],
  ["In rock–paper–scissors, what beats rock?","Paper","Scissors","Nothing","Fire",0],
  ["Which board game is about buying streets and charging rent?","Monopoly","Risk","Cluedo","The Game of Life",0],
  ["Miss Scarlett is a suspect in which board game?","Cluedo","Monopoly","Guess Who?","Battleship",1],
  ["In Uno, what does a plain wild card let you do?","Choose the next colour","Skip everyone","Draw four cards","Swap hands",1],
  ["Origami, the art of paper folding, comes from which country?","Japan","China","Korea","Vietnam",0],
  ["Which superhero is called 'the Caped Crusader'?","Batman","Superman","Iron Man","The Flash",0],
  ["Superman was born on which planet?","Krypton","Xandar","Vulcan","Oa",0],
  ["What is Spider-Man's real name?","Peter Parker","Miles Morales","Ben Reilly","Harry Osborn",0],
  ["Wonder Woman hails from which island?","Themyscira","Atlantis","Asgard","Genosha",2],
  ["Which comics company created the X-Men?","Marvel","DC","Dark Horse","Image",1],
  ["Superman and Batman belong to which comics company?","DC","Marvel","Image","Dark Horse",1],
  ["Mickey Mouse made his public debut in which 1928 cartoon?","Steamboat Willie","Fantasia","The Karnival Kid","Silly Symphonies",2],
  ["Hello Kitty comes from which country?","Japan","South Korea","China","United States",0],
  ["Pikachu is what type of Pokémon?","Electric","Fire","Water","Normal",0],
  ["What is the name of Mario's brother?","Luigi","Wario","Toad","Yoshi",0],
  ["Which princess does Mario usually rescue?","Peach","Daisy","Zelda","Rosalina",1],
  ["What does Sonic the Hedgehog collect?","Golden rings","Coins","Stars","Emeralds only",1],
  ["A 'one-hit wonder' is an artist famous for…?","A single big hit","One concert","One album a year","Winning one award",1],
  ["Which iconic doll got her own blockbuster film in 2023?","Barbie","Polly Pocket","Bratz","American Girl",0],
  ["The Rubik's Cube was invented in which country?","Hungary","Germany","Russia","Poland",2],
];

export function buildPop(): TriviaQuestion[] {
  const bank = new Bank("Pop Culture", 19811201);

  /* ---- music, both directions -------------------------------------------- */
  for (const [artist, hit, year, t] of MUSIC) {
    const wrongArtists = bank.pickN(MUSIC, 6, (m) => m[0] !== artist).map((m) => m[0]);
    bank.push(t, `Who made “${hit}” famous?`, artist, wrongArtists.slice(0, 3),
      `Think ${decadeOf(year)}.`);
    bank.push(t, `In which decade was “${hit}” a hit?`, decadeOf(year),
      decadeWrongs(bank.rng, year), undefined, `${artist} released it in ${year}.`);
  }

  /* ---- games ---------------------------------------------------------------- */
  for (const [game, maker, year, t] of GAMES) {
    const wrongMakers = [...new Set(bank.pickN(GAMES, 8, (g) => g[1] !== maker).map((g) => g[1]))];
    bank.push(t, `Who made the game ${game}?`, maker, wrongMakers.slice(0, 3),
      `Think ${decadeOf(year)}.`);
    bank.push(t === 0 ? 1 : t, `In which decade was ${game} first released?`, decadeOf(year),
      decadeWrongs(bank.rng, year));
  }

  /* ---- launches --------------------------------------------------------------- */
  for (const [thing, year, t] of LAUNCHES) {
    bank.push(t, `In which decade did ${thing} launch?`, decadeOf(year),
      decadeWrongs(bank.rng, year), undefined, `${capitalise(thing)} arrived in ${year}.`);
  }

  /* ---- curated: new + legacy sports/food/arts/words --------------------------- */
  for (const [q, correct, w1, w2, w3, t, note] of EXTRA) {
    bank.push(t, q, correct, [w1, w2, w3], undefined, note);
  }
  for (const [topic, q, correct, w1, w2, w3, note] of CURATED) {
    if (!["Sports & Games", "Food & Drink", "Arts & Books", "Words"].includes(topic)) continue;
    bank.push(1, q, correct, [w1, w2, w3], undefined, note);
  }

  /* ---- fills per tier ------------------------------------------------------------ */
  type Dated = { label: string; year: number; tier: Tier };
  const dated: Dated[] = [
    ...MUSIC.map(([artist, hit, year, tier]) => ({ label: `“${hit}” (${artist})`, year, tier })),
    ...GAMES.map(([game, , year, tier]) => ({ label: `the game ${game}`, year, tier })),
    ...LAUNCHES.map(([thing, year, tier]) => ({ label: thing, year, tier })),
  ];
  const gaps: [number, number, number] = [15, 6, 2];

  for (const t of [0, 1, 2] as Tier[]) {
    const target = TIER_TARGETS[t];
    const pool = dated.filter((d) => (t === 0 ? d.tier === 0 : d.tier <= t));

    bank.fillSuperlative(t, Math.floor(target * 0.35), pool, (d) => d.year, gaps[t], false,
      (_four, best) => ({
        q: "Which of these arrived first?",
        label: (d) => capitalise(d.label),
        note: `${capitalise(best.label)} — ${best.year}.`,
      }));
    bank.fillSuperlative(t, Math.floor(target * 0.6), pool, (d) => d.year, gaps[t], true,
      (_four, best) => ({
        q: "Which of these is the most recent?",
        label: (d) => capitalise(d.label),
        note: `${capitalise(best.label)} — ${best.year}.`,
      }));

    // hit → artist re-asks with fresh line-ups (catch-all)
    const musicPool = MUSIC.filter((m) => (t === 0 ? m[3] === 0 : m[3] <= t));
    bank.fill(t, target, () => {
      const m = bank.one(musicPool);
      const roll = bank.rng();
      if (roll < 0.6) {
        const wrongs = bank.pickN(MUSIC, 6, (x) => x[0] !== m[0]).map((x) => x[0]);
        bank.push(t, `Who made “${m[1]}” famous?`, m[0], wrongs.slice(0, 3), `Think ${decadeOf(m[2])}.`);
      } else {
        const wrongs = bank.pickN(MUSIC, 6, (x) => x[0] !== m[0] && x[1] !== m[1]).map((x) => x[1]);
        bank.push(t, `Which of these songs is a ${m[0]} hit?`, m[1], wrongs.slice(0, 3));
      }
    });
  }

  return bank.qs;
}

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
