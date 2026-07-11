/**
 * Movies & TV topic — films (director, release decade/year, ordering),
 * shows (first-aired, ordering) and characters → works. Tiers: 0 blockbuster
 * / household, 1 well-known classics, 2 older or cult territory.
 */

import { Bank, TIER_TARGETS, decadeOf, decadeWrongs, yearWrongs } from "./build";
import type { Tier, TriviaQuestion } from "./types";

/** [title, year, director ("" = don't ask), tier] */
const FILMS: [string, number, string, Tier][] = [
  ["Titanic",1997,"James Cameron",0],["Avatar",2009,"James Cameron",0],
  ["Jurassic Park",1993,"Steven Spielberg",0],["E.T. the Extra-Terrestrial",1982,"Steven Spielberg",0],
  ["Jaws",1975,"Steven Spielberg",0],["Raiders of the Lost Ark",1981,"Steven Spielberg",0],
  ["The Lion King",1994,"",0],["Toy Story",1995,"",0],["Finding Nemo",2003,"",0],
  ["Frozen",2013,"",0],["Up",2009,"",0],["Inside Out",2015,"",0],["Coco",2017,"",0],
  ["Shrek",2001,"",0],["Moana",2016,"",0],["Zootopia",2016,"",0],["Ratatouille",2007,"",0],
  ["The Incredibles",2004,"",0],["WALL-E",2008,"",0],["Monsters, Inc.",2001,"",0],
  ["Despicable Me",2010,"",0],["Kung Fu Panda",2008,"",0],["How to Train Your Dragon",2010,"",0],
  ["Cars",2006,"",0],["Star Wars",1977,"George Lucas",0],
  ["The Empire Strikes Back",1980,"",0],["Return of the Jedi",1983,"",0],
  ["Star Wars: The Force Awakens",2015,"",0],
  ["Harry Potter and the Philosopher's Stone",2001,"",0],
  ["The Fellowship of the Ring",2001,"Peter Jackson",0],
  ["The Return of the King",2003,"Peter Jackson",0],
  ["The Avengers",2012,"",0],["Avengers: Endgame",2019,"",0],["Iron Man",2008,"",0],
  ["Black Panther",2018,"",0],["Spider-Man",2002,"",0],
  ["Spider-Man: Into the Spider-Verse",2018,"",0],["Guardians of the Galaxy",2014,"",0],
  ["Thor",2011,"",0],["Deadpool",2016,"",0],
  ["The Dark Knight",2008,"Christopher Nolan",0],["Inception",2010,"Christopher Nolan",0],
  ["Interstellar",2014,"Christopher Nolan",0],["Oppenheimer",2023,"Christopher Nolan",0],
  ["Barbie",2023,"Greta Gerwig",0],["Forrest Gump",1994,"Robert Zemeckis",0],
  ["Back to the Future",1985,"Robert Zemeckis",0],["The Matrix",1999,"",0],
  ["Gladiator",2000,"Ridley Scott",0],["Pirates of the Caribbean: The Curse of the Black Pearl",2003,"",0],
  ["The Godfather",1972,"Francis Ford Coppola",0],["Pulp Fiction",1994,"Quentin Tarantino",0],
  ["Django Unchained",2012,"Quentin Tarantino",0],["Fight Club",1999,"David Fincher",0],
  ["Se7en",1995,"David Fincher",0],["The Silence of the Lambs",1991,"",0],
  ["Home Alone",1990,"",0],["Mrs. Doubtfire",1993,"",0],["The Truman Show",1998,"Peter Weir",0],
  ["Mean Girls",2004,"",0],["La La Land",2016,"Damien Chazelle",0],
  ["Whiplash",2014,"Damien Chazelle",0],["Joker",2019,"",0],["Parasite",2019,"Bong Joon-ho",0],
  ["Slumdog Millionaire",2008,"Danny Boyle",0],["The Shawshank Redemption",1994,"",0],
  ["The Green Mile",1999,"",0],["Grease",1978,"",0],["Dirty Dancing",1987,"",0],
  ["Ghostbusters",1984,"",0],["Rocky",1976,"",0],["Die Hard",1988,"",0],
  ["The Terminator",1984,"James Cameron",0],["Terminator 2: Judgment Day",1991,"James Cameron",0],
  ["Alien",1979,"Ridley Scott",0],["Aliens",1986,"James Cameron",0],
  ["Top Gun",1986,"",0],["Top Gun: Maverick",2022,"",0],["Dune",2021,"Denis Villeneuve",0],
  ["Skyfall",2012,"",0],["Transformers",2007,"",0],["It",2017,"",0],
  ["The Devil Wears Prada",2006,"",0],["The Hunger Games",2012,"",0],
  ["Casablanca",1942,"Michael Curtiz",1],["Gone with the Wind",1939,"",1],
  ["The Wizard of Oz",1939,"",1],["Citizen Kane",1941,"Orson Welles",1],
  ["Psycho",1960,"Alfred Hitchcock",1],["Vertigo",1958,"Alfred Hitchcock",1],
  ["Rear Window",1954,"Alfred Hitchcock",1],["The Birds",1963,"Alfred Hitchcock",1],
  ["Singin' in the Rain",1952,"",1],["Some Like It Hot",1959,"Billy Wilder",1],
  ["Sunset Boulevard",1950,"Billy Wilder",1],["12 Angry Men",1957,"Sidney Lumet",1],
  ["Lawrence of Arabia",1962,"David Lean",1],["The Sound of Music",1965,"",1],
  ["West Side Story",1961,"",1],["Mary Poppins",1964,"",1],["Breakfast at Tiffany's",1961,"",1],
  ["2001: A Space Odyssey",1968,"Stanley Kubrick",1],["The Shining",1980,"Stanley Kubrick",1],
  ["A Clockwork Orange",1971,"Stanley Kubrick",1],
  ["One Flew Over the Cuckoo's Nest",1975,"Miloš Forman",1],["Amadeus",1984,"Miloš Forman",1],
  ["Taxi Driver",1976,"Martin Scorsese",1],["Goodfellas",1990,"Martin Scorsese",1],
  ["The Departed",2006,"Martin Scorsese",1],["The Wolf of Wall Street",2013,"Martin Scorsese",1],
  ["Apocalypse Now",1979,"Francis Ford Coppola",1],["The Godfather Part II",1974,"Francis Ford Coppola",1],
  ["Schindler's List",1993,"Steven Spielberg",1],["Saving Private Ryan",1998,"Steven Spielberg",1],
  ["Braveheart",1995,"Mel Gibson",1],["Good Will Hunting",1997,"",1],
  ["Dead Poets Society",1989,"Peter Weir",1],["Rain Man",1988,"",1],
  ["A Beautiful Mind",2001,"Ron Howard",1],["Apollo 13",1995,"Ron Howard",1],
  ["The Big Lebowski",1998,"the Coen brothers",1],["Fargo",1996,"the Coen brothers",1],
  ["No Country for Old Men",2007,"the Coen brothers",1],
  ["There Will Be Blood",2007,"Paul Thomas Anderson",1],
  ["The Grand Budapest Hotel",2014,"Wes Anderson",1],["Moonrise Kingdom",2012,"Wes Anderson",1],
  ["Eternal Sunshine of the Spotless Mind",2004,"",1],["Amélie",2001,"",1],
  ["Life Is Beautiful",1997,"Roberto Benigni",1],["Cinema Paradiso",1988,"",1],
  ["Spirited Away",2001,"Hayao Miyazaki",1],["My Neighbor Totoro",1988,"Hayao Miyazaki",1],
  ["Howl's Moving Castle",2004,"Hayao Miyazaki",1],["Princess Mononoke",1997,"Hayao Miyazaki",1],
  ["Crouching Tiger, Hidden Dragon",2000,"Ang Lee",1],["Life of Pi",2012,"Ang Lee",1],
  ["Brokeback Mountain",2005,"Ang Lee",1],["City of God",2002,"",1],
  ["Pan's Labyrinth",2006,"Guillermo del Toro",1],["The Shape of Water",2017,"Guillermo del Toro",1],
  ["Birdman",2014,"Alejandro G. Iñárritu",1],["The Revenant",2015,"Alejandro G. Iñárritu",1],
  ["Gravity",2013,"Alfonso Cuarón",1],["Roma",2018,"Alfonso Cuarón",1],
  ["Arrival",2016,"Denis Villeneuve",1],["Blade Runner 2049",2017,"Denis Villeneuve",1],
  ["Blade Runner",1982,"Ridley Scott",1],["Mad Max: Fury Road",2015,"George Miller",1],
  ["Trainspotting",1996,"Danny Boyle",1],["The King's Speech",2010,"",1],
  ["12 Years a Slave",2013,"Steve McQueen",1],["Moonlight",2016,"Barry Jenkins",1],
  ["Everything Everywhere All at Once",2022,"",1],["The Social Network",2010,"David Fincher",1],
  ["Her",2013,"Spike Jonze",1],["Get Out",2017,"Jordan Peele",1],
  ["To Kill a Mockingbird",1962,"",1],["The Exorcist",1973,"",1],["Annie Hall",1977,"",1],
  ["Metropolis",1927,"Fritz Lang",2],["Nosferatu",1922,"F.W. Murnau",2],
  ["Battleship Potemkin",1925,"Sergei Eisenstein",2],["The General",1926,"Buster Keaton",2],
  ["City Lights",1931,"Charlie Chaplin",2],["Modern Times",1936,"Charlie Chaplin",2],
  ["The Great Dictator",1940,"Charlie Chaplin",2],["M",1931,"Fritz Lang",2],
  ["It Happened One Night",1934,"Frank Capra",2],["It's a Wonderful Life",1946,"Frank Capra",2],
  ["Bicycle Thieves",1948,"Vittorio De Sica",2],["Rashomon",1950,"Akira Kurosawa",2],
  ["Seven Samurai",1954,"Akira Kurosawa",2],["Ikiru",1952,"Akira Kurosawa",2],
  ["Ran",1985,"Akira Kurosawa",2],["Tokyo Story",1953,"Yasujirō Ozu",2],
  ["The Seventh Seal",1957,"Ingmar Bergman",2],["Wild Strawberries",1957,"Ingmar Bergman",2],
  ["Persona",1966,"Ingmar Bergman",2],["8½",1963,"Federico Fellini",2],
  ["La Dolce Vita",1960,"Federico Fellini",2],["Breathless",1960,"Jean-Luc Godard",2],
  ["The 400 Blows",1959,"François Truffaut",2],["Solaris",1972,"Andrei Tarkovsky",2],
  ["Stalker",1979,"Andrei Tarkovsky",2],["Once Upon a Time in the West",1968,"Sergio Leone",2],
  ["The Good, the Bad and the Ugly",1966,"Sergio Leone",2],
  ["A Fistful of Dollars",1964,"Sergio Leone",2],["Chinatown",1974,"Roman Polanski",2],
  ["The Third Man",1949,"Carol Reed",2],["On the Waterfront",1954,"Elia Kazan",2],
  ["A Streetcar Named Desire",1951,"Elia Kazan",2],["Ben-Hur",1959,"William Wyler",2],
  ["Spartacus",1960,"Stanley Kubrick",2],["Doctor Zhivago",1965,"David Lean",2],
  ["The Bridge on the River Kwai",1957,"David Lean",2],["Cool Hand Luke",1967,"",2],
  ["Bonnie and Clyde",1967,"Arthur Penn",2],["The Graduate",1967,"Mike Nichols",2],
  ["Midnight Cowboy",1969,"",2],["Easy Rider",1969,"Dennis Hopper",2],
  ["The French Connection",1971,"William Friedkin",2],["Dog Day Afternoon",1975,"Sidney Lumet",2],
  ["Network",1976,"Sidney Lumet",2],["Das Boot",1981,"Wolfgang Petersen",2],
  ["Wings of Desire",1987,"Wim Wenders",2],["Three Colours: Blue",1993,"Krzysztof Kieślowski",2],
  ["In the Mood for Love",2000,"Wong Kar-wai",2],["Oldboy",2003,"Park Chan-wook",2],
  ["A Separation",2011,"Asghar Farhadi",2],["Akira",1988,"",2],
];

/** [show, first-aired year, tier] */
const SHOWS: [string, number, Tier][] = [
  ["Friends",1994,0],["The Simpsons",1989,0],["Game of Thrones",2011,0],["Breaking Bad",2008,0],
  ["Stranger Things",2016,0],["The Office (US)",2005,0],["SpongeBob SquarePants",1999,0],
  ["Sherlock",2010,0],["The Crown",2016,0],["Squid Game",2021,0],["Wednesday",2022,0],
  ["Money Heist",2017,0],["The Big Bang Theory",2007,0],["Grey's Anatomy",2005,0],
  ["The Mandalorian",2019,0],["The Witcher",2019,0],["The Last of Us",2023,0],
  ["Ted Lasso",2020,0],["Avatar: The Last Airbender",2005,0],["Doctor Who (revived)",2005,0],
  ["Seinfeld",1989,1],["The Sopranos",1999,1],["The Wire",2002,1],["Lost",2004,1],
  ["Mad Men",2007,1],["Dexter",2006,1],["Prison Break",2005,1],["How I Met Your Mother",2005,1],
  ["Modern Family",2009,1],["Downton Abbey",2010,1],["Peaky Blinders",2013,1],
  ["Black Mirror",2011,1],["Westworld",2016,1],["Better Call Saul",2015,1],
  ["The Handmaid's Tale",2017,1],["Chernobyl",2019,1],["Fleabag",2016,1],
  ["The Queen's Gambit",2020,1],["Narcos",2015,1],["Vikings",2013,1],["Suits",2011,1],
  ["True Detective",2014,1],["The X-Files",1993,1],["ER",1994,1],["Frasier",1993,1],
  ["Cheers",1982,1],["The Fresh Prince of Bel-Air",1990,1],["Buffy the Vampire Slayer",1997,1],
  ["The West Wing",1999,1],["24",2001,1],["House",2004,1],
  ["M*A*S*H",1972,2],["Twin Peaks",1990,2],["Star Trek (the original series)",1966,2],
  ["The Twilight Zone",1959,2],["I Love Lucy",1951,2],["Monty Python's Flying Circus",1969,2],
  ["Fawlty Towers",1975,2],["Blackadder",1983,2],["Columbo",1971,2],["Dallas",1978,2],
  ["The Muppet Show",1976,2],["Sesame Street",1969,2],["Doctor Who (original run)",1963,2],
];

/** [character, film or show, tier] — character names never contain the work's name */
const CHARACTERS: [string, string, Tier][] = [
  ["Darth Vader","Star Wars",0],["Luke Skywalker","Star Wars",0],["Yoda","Star Wars",0],
  ["Hermione Granger","the Harry Potter films",0],["Albus Dumbledore","the Harry Potter films",0],
  ["Frodo Baggins","The Lord of the Rings",0],["Gandalf","The Lord of the Rings",0],
  ["Gollum","The Lord of the Rings",0],["Captain Jack Sparrow","Pirates of the Caribbean",0],
  ["Simba","The Lion King",0],["Elsa","Frozen",0],["Olaf","Frozen",0],
  ["Buzz Lightyear","Toy Story",0],["Woody","Toy Story",0],["Dory","Finding Nemo",0],
  ["Donkey","Shrek",0],["Katniss Everdeen","The Hunger Games",0],["Tony Stark","Iron Man",0],
  ["Thanos","Avengers: Endgame",0],["Neo","The Matrix",0],["Morpheus","The Matrix",1],
  ["Marty McFly","Back to the Future",0],["Doc Brown","Back to the Future",1],
  ["The Joker","The Dark Knight",0],["Walter White","Breaking Bad",0],
  ["Jesse Pinkman","Breaking Bad",1],["Eleven","Stranger Things",0],
  ["Jon Snow","Game of Thrones",0],["Daenerys Targaryen","Game of Thrones",0],
  ["Tyrion Lannister","Game of Thrones",1],["Chandler Bing","Friends",0],
  ["Ross Geller","Friends",0],["Michael Scott","The Office (US)",0],
  ["Dwight Schrute","The Office (US)",1],["Don Draper","Mad Men",1],
  ["Omar Little","The Wire",2],["Fox Mulder","The X-Files",1],
  ["Sheldon Cooper","The Big Bang Theory",0],["Geralt of Rivia","The Witcher",1],
  ["Ellen Ripley","Alien",1],["Sarah Connor","The Terminator",1],
  ["Vito Corleone","The Godfather",1],["Michael Corleone","The Godfather",1],
  ["Tyler Durden","Fight Club",1],["The Dude","The Big Lebowski",2],
  ["Chihiro","Spirited Away",2],["Maximus","Gladiator",1],
  ["Truman Burbank","The Truman Show",1],["Regina George","Mean Girls",1],
  ["Miranda Priestly","The Devil Wears Prada",1],["Andy Dufresne","The Shawshank Redemption",2],
  ["Clarice Starling","The Silence of the Lambs",2],["Hannibal Lecter","The Silence of the Lambs",1],
  ["Norman Bates","Psycho",1],["Scarlett O'Hara","Gone with the Wind",1],
  ["Dorothy Gale","The Wizard of Oz",0],["Maria von Trapp","The Sound of Music",1],
  ["Kevin McCallister","Home Alone",0],["Optimus Prime","Transformers",0],
  ["Po","Kung Fu Panda",1],["Hiccup","How to Train Your Dragon",1],
  ["Lightning McQueen","Cars",0],["Remy","Ratatouille",1],["Carl Fredricksen","Up",1],
  ["Miguel","Coco",1],["Maui","Moana",1],["Groot","Guardians of the Galaxy",0],
  ["Rocket Raccoon","Guardians of the Galaxy",1],["Loki","Thor",0],
  ["Pennywise","It",0],["Jack Torrance","The Shining",1],["Furiosa","Mad Max: Fury Road",1],
  ["John McClane","Die Hard",1],["Rocky Balboa","Rocky",0],["Gordon Gekko","Wall Street",2],
];

export function buildMedia(): TriviaQuestion[] {
  const bank = new Bank("Movies & TV", 18951228);

  const directors = [...new Set(FILMS.map((f) => f[2]).filter(Boolean))];
  const works = [...FILMS.map((f) => f[0]), ...SHOWS.map((s) => s[0])];

  /* ---- directors, both directions ---------------------------------------- */
  for (const [title, year, director, t] of FILMS) {
    if (director) {
      bank.push(t, `Who directed ${title}?`, director,
        bank.pickN(directors, 3, (d) => d !== director), `Think ${decadeOf(year)}.`);
    }
    bank.push(t, `In which decade was ${title} released?`, decadeOf(year),
      decadeWrongs(bank.rng, year));
    bank.push(2, `In which year was ${title} released?`, String(year),
      yearWrongs(bank.rng, year, 4).map((s) => s.replace(" BC", "")));
  }
  for (const director of directors) {
    const theirs = FILMS.filter((f) => f[2] === director);
    const others = FILMS.filter((f) => f[2] !== director && f[2] !== "");
    for (const film of theirs) {
      bank.push(film[3], `Which of these films did ${director} direct?`, film[0],
        bank.pickN(others, 3).map((f) => f[0]));
    }
  }

  /* ---- shows ---------------------------------------------------------------- */
  for (const [show, year, t] of SHOWS) {
    bank.push(t, `In which decade did ${show} first air?`, decadeOf(year),
      decadeWrongs(bank.rng, year));
  }

  /* ---- characters ------------------------------------------------------------ */
  for (const [character, work, t] of CHARACTERS) {
    const wrongs = [...new Set(bank.pickN(CHARACTERS, 8, (c) => c[1] !== work).map((c) => c[1]))];
    bank.push(t, `${character} is a character in…?`, work, wrongs.slice(0, 3));
  }

  /* ---- fills per tier ----------------------------------------------------------- */
  type Dated = { title: string; year: number; tier: Tier };
  const dated: Dated[] = [
    ...FILMS.map(([title, year, , tier]) => ({ title, year, tier })),
    ...SHOWS.map(([title, year, tier]) => ({ title, year, tier })),
  ];
  const gaps: [number, number, number] = [15, 6, 2];

  for (const t of [0, 1, 2] as Tier[]) {
    const target = TIER_TARGETS[t];
    const pool = dated.filter((d) => (t === 0 ? d.tier === 0 : d.tier <= t));

    bank.fillSuperlative(t, Math.floor(target * 0.3), pool, (d) => d.year, gaps[t], false,
      (_four, best) => ({
        q: "Which of these came to screens first?",
        label: (d) => d.title,
        note: `${best.title} — ${best.year}.`,
      }));
    bank.fillSuperlative(t, Math.floor(target * 0.55), pool, (d) => d.year, gaps[t], true,
      (_four, best) => ({
        q: "Which of these is the most recent?",
        label: (d) => d.title,
        note: `${best.title} — ${best.year}.`,
      }));

    // director re-asks with fresh line-ups
    const dirPool = FILMS.filter((f) => f[2] && (t === 0 ? f[3] === 0 : f[3] <= t));
    bank.fill(t, Math.floor(target * 0.75), () => {
      const f = bank.one(dirPool);
      bank.push(t, `Which of these films did ${f[2]} direct?`, f[0],
        bank.pickN(FILMS, 6, (x) => x[2] !== f[2]).map((x) => x[0]).slice(0, 3));
    });

    // character re-asks with fresh line-ups (catch-all)
    const charPool = CHARACTERS.filter((c) => (t === 0 ? c[2] === 0 : c[2] <= t));
    bank.fill(t, target, () => {
      const c = bank.one(charPool);
      const wrongs = [...new Set(bank.pickN(works, 6, (w) => w !== c[1]))];
      bank.push(t, `${c[0]} is a character in…?`, c[1], wrongs.slice(0, 3));
    });
  }

  return bank.qs;
}
