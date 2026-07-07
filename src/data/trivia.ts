/**
 * Trivia question bank. Like the flagship puzzle databases, this file keeps
 * compact fact tables and expands them into a large multiple-choice pool at
 * module load — combining new tables (capitals, elements, artworks, dishes,
 * vocabulary, animals, sports) with the existing gazetteer, Time Lens events,
 * and Higher-or-Lower comparison data. The build is fully deterministic
 * (fixed-seed RNG), so question ids/indices are stable across sessions and
 * the daily round is the same for everyone. Total: 10,000+ questions.
 */

import { COUNTRY_ROWS, PLACE_ROWS } from "./gazetteer";
import { TIME_EVENTS } from "./events";
import { COMPARISON_CATEGORIES } from "./comparisons";
import { mulberry32, shuffled } from "../lib/random";

export type TriviaTopic =
  | "Geography"
  | "History"
  | "Science & Space"
  | "Nature"
  | "Arts & Books"
  | "Food & Drink"
  | "Words"
  | "Sports & Games"
  | "Numbers";

export const TRIVIA_TOPICS: TriviaTopic[] = [
  "Geography", "History", "Science & Space", "Nature", "Arts & Books",
  "Food & Drink", "Words", "Sports & Games", "Numbers",
];

export interface TriviaQuestion {
  topic: TriviaTopic;
  q: string;
  /** 2 or 4 answers, pre-shuffled deterministically */
  choices: string[];
  /** index into choices */
  answer: number;
  /** optional one-line explanation */
  note?: string;
}

/* ------------------------------------------------------------------ */
/* fact tables                                                         */
/* ------------------------------------------------------------------ */

const CONTINENTS6 = ["Europe", "Asia", "Africa", "North America", "South America", "Oceania"];

/** [country, capital, continent] — ambiguous/multi-capital states are omitted. */
const CAPITALS: [string, string, string][] = [
  ["Albania","Tirana","Europe"],["Andorra","Andorra la Vella","Europe"],["Austria","Vienna","Europe"],
  ["Belarus","Minsk","Europe"],["Belgium","Brussels","Europe"],["Bosnia and Herzegovina","Sarajevo","Europe"],
  ["Bulgaria","Sofia","Europe"],["Croatia","Zagreb","Europe"],["Czechia","Prague","Europe"],
  ["Denmark","Copenhagen","Europe"],["Estonia","Tallinn","Europe"],["Finland","Helsinki","Europe"],
  ["France","Paris","Europe"],["Germany","Berlin","Europe"],["Greece","Athens","Europe"],
  ["Hungary","Budapest","Europe"],["Iceland","Reykjavík","Europe"],["Ireland","Dublin","Europe"],
  ["Italy","Rome","Europe"],["Latvia","Riga","Europe"],["Liechtenstein","Vaduz","Europe"],
  ["Lithuania","Vilnius","Europe"],["Luxembourg","Luxembourg City","Europe"],["Malta","Valletta","Europe"],
  ["Moldova","Chișinău","Europe"],["Monaco","Monaco","Europe"],["Montenegro","Podgorica","Europe"],
  ["Netherlands","Amsterdam","Europe"],["North Macedonia","Skopje","Europe"],["Norway","Oslo","Europe"],
  ["Poland","Warsaw","Europe"],["Portugal","Lisbon","Europe"],["Romania","Bucharest","Europe"],
  ["Russia","Moscow","Europe"],["San Marino","San Marino","Europe"],["Serbia","Belgrade","Europe"],
  ["Slovakia","Bratislava","Europe"],["Slovenia","Ljubljana","Europe"],["Spain","Madrid","Europe"],
  ["Sweden","Stockholm","Europe"],["Switzerland","Bern","Europe"],["Ukraine","Kyiv","Europe"],
  ["United Kingdom","London","Europe"],["Kosovo","Pristina","Europe"],
  ["Afghanistan","Kabul","Asia"],["Armenia","Yerevan","Asia"],["Azerbaijan","Baku","Asia"],
  ["Bahrain","Manama","Asia"],["Bangladesh","Dhaka","Asia"],["Bhutan","Thimphu","Asia"],
  ["Brunei","Bandar Seri Begawan","Asia"],["Cambodia","Phnom Penh","Asia"],["China","Beijing","Asia"],
  ["Cyprus","Nicosia","Asia"],["Georgia","Tbilisi","Asia"],["India","New Delhi","Asia"],
  ["Indonesia","Jakarta","Asia"],["Iran","Tehran","Asia"],["Iraq","Baghdad","Asia"],
  ["Japan","Tokyo","Asia"],["Jordan","Amman","Asia"],["Kazakhstan","Astana","Asia"],
  ["Kuwait","Kuwait City","Asia"],["Kyrgyzstan","Bishkek","Asia"],["Laos","Vientiane","Asia"],
  ["Lebanon","Beirut","Asia"],["Malaysia","Kuala Lumpur","Asia"],["Maldives","Malé","Asia"],
  ["Mongolia","Ulaanbaatar","Asia"],["Myanmar","Naypyidaw","Asia"],["Nepal","Kathmandu","Asia"],
  ["North Korea","Pyongyang","Asia"],["Oman","Muscat","Asia"],["Pakistan","Islamabad","Asia"],
  ["Philippines","Manila","Asia"],["Qatar","Doha","Asia"],["Saudi Arabia","Riyadh","Asia"],
  ["Singapore","Singapore","Asia"],["South Korea","Seoul","Asia"],["Syria","Damascus","Asia"],
  ["Taiwan","Taipei","Asia"],["Tajikistan","Dushanbe","Asia"],["Thailand","Bangkok","Asia"],
  ["Timor-Leste","Dili","Asia"],["Türkiye","Ankara","Asia"],["Turkmenistan","Ashgabat","Asia"],
  ["United Arab Emirates","Abu Dhabi","Asia"],["Uzbekistan","Tashkent","Asia"],["Vietnam","Hanoi","Asia"],
  ["Algeria","Algiers","Africa"],["Angola","Luanda","Africa"],["Benin","Porto-Novo","Africa"],
  ["Botswana","Gaborone","Africa"],["Burkina Faso","Ouagadougou","Africa"],["Burundi","Gitega","Africa"],
  ["Cameroon","Yaoundé","Africa"],["Cape Verde","Praia","Africa"],["Central African Republic","Bangui","Africa"],
  ["Chad","N'Djamena","Africa"],["Comoros","Moroni","Africa"],["Republic of the Congo","Brazzaville","Africa"],
  ["Democratic Republic of the Congo","Kinshasa","Africa"],["Djibouti","Djibouti City","Africa"],
  ["Egypt","Cairo","Africa"],["Equatorial Guinea","Malabo","Africa"],["Eritrea","Asmara","Africa"],
  ["Eswatini","Mbabane","Africa"],["Ethiopia","Addis Ababa","Africa"],["Gabon","Libreville","Africa"],
  ["The Gambia","Banjul","Africa"],["Ghana","Accra","Africa"],["Guinea","Conakry","Africa"],
  ["Guinea-Bissau","Bissau","Africa"],["Ivory Coast","Yamoussoukro","Africa"],["Kenya","Nairobi","Africa"],
  ["Lesotho","Maseru","Africa"],["Liberia","Monrovia","Africa"],["Libya","Tripoli","Africa"],
  ["Madagascar","Antananarivo","Africa"],["Malawi","Lilongwe","Africa"],["Mali","Bamako","Africa"],
  ["Mauritania","Nouakchott","Africa"],["Mauritius","Port Louis","Africa"],["Morocco","Rabat","Africa"],
  ["Mozambique","Maputo","Africa"],["Namibia","Windhoek","Africa"],["Niger","Niamey","Africa"],
  ["Nigeria","Abuja","Africa"],["Rwanda","Kigali","Africa"],["São Tomé and Príncipe","São Tomé","Africa"],
  ["Senegal","Dakar","Africa"],["Seychelles","Victoria","Africa"],["Sierra Leone","Freetown","Africa"],
  ["Somalia","Mogadishu","Africa"],["South Sudan","Juba","Africa"],["Sudan","Khartoum","Africa"],
  ["Tanzania","Dodoma","Africa"],["Togo","Lomé","Africa"],["Tunisia","Tunis","Africa"],
  ["Uganda","Kampala","Africa"],["Zambia","Lusaka","Africa"],["Zimbabwe","Harare","Africa"],
  ["Bahamas","Nassau","North America"],["Barbados","Bridgetown","North America"],["Belize","Belmopan","North America"],
  ["Canada","Ottawa","North America"],["Costa Rica","San José","North America"],["Cuba","Havana","North America"],
  ["Dominica","Roseau","North America"],["Dominican Republic","Santo Domingo","North America"],
  ["El Salvador","San Salvador","North America"],["Grenada","St. George's","North America"],
  ["Guatemala","Guatemala City","North America"],["Haiti","Port-au-Prince","North America"],
  ["Honduras","Tegucigalpa","North America"],["Jamaica","Kingston","North America"],
  ["Mexico","Mexico City","North America"],["Nicaragua","Managua","North America"],
  ["Panama","Panama City","North America"],["Trinidad and Tobago","Port of Spain","North America"],
  ["United States","Washington, D.C.","North America"],
  ["Argentina","Buenos Aires","South America"],["Brazil","Brasília","South America"],
  ["Chile","Santiago","South America"],["Colombia","Bogotá","South America"],["Ecuador","Quito","South America"],
  ["Guyana","Georgetown","South America"],["Paraguay","Asunción","South America"],["Peru","Lima","South America"],
  ["Suriname","Paramaribo","South America"],["Uruguay","Montevideo","South America"],
  ["Venezuela","Caracas","South America"],
  ["Australia","Canberra","Oceania"],["Fiji","Suva","Oceania"],["Kiribati","Tarawa","Oceania"],
  ["Marshall Islands","Majuro","Oceania"],["New Zealand","Wellington","Oceania"],["Palau","Ngerulmud","Oceania"],
  ["Papua New Guinea","Port Moresby","Oceania"],["Samoa","Apia","Oceania"],["Solomon Islands","Honiara","Oceania"],
  ["Tonga","Nukuʻalofa","Oceania"],["Tuvalu","Funafuti","Oceania"],["Vanuatu","Port Vila","Oceania"],
];

/** transcontinental or debated cases we keep out of "which continent" questions */
const CONTINENT_SKIP = new Set(["Russia","Türkiye","Kazakhstan","Georgia","Azerbaijan","Armenia","Cyprus","Egypt","Indonesia","Panama"]);

/** [element, symbol, atomic number] */
const ELEMENTS: [string, string, number][] = [
  ["Hydrogen","H",1],["Helium","He",2],["Lithium","Li",3],["Boron","B",5],["Carbon","C",6],
  ["Nitrogen","N",7],["Oxygen","O",8],["Fluorine","F",9],["Neon","Ne",10],["Sodium","Na",11],
  ["Magnesium","Mg",12],["Aluminium","Al",13],["Silicon","Si",14],["Phosphorus","P",15],["Sulfur","S",16],
  ["Chlorine","Cl",17],["Argon","Ar",18],["Potassium","K",19],["Calcium","Ca",20],["Titanium","Ti",22],
  ["Chromium","Cr",24],["Manganese","Mn",25],["Iron","Fe",26],["Cobalt","Co",27],["Nickel","Ni",28],
  ["Copper","Cu",29],["Zinc","Zn",30],["Arsenic","As",33],["Bromine","Br",35],["Krypton","Kr",36],
  ["Silver","Ag",47],["Tin","Sn",50],["Iodine","I",53],["Xenon","Xe",54],["Barium","Ba",56],
  ["Tungsten","W",74],["Platinum","Pt",78],["Gold","Au",79],["Mercury","Hg",80],["Lead","Pb",82],
  ["Radon","Rn",86],["Uranium","U",92],
];

/** [work, creator, kind] */
type ArtKind = "novel" | "play" | "painting" | "composition" | "sculpture";
const ARTS: [string, string, ArtKind][] = [
  ["Pride and Prejudice","Jane Austen","novel"],["Emma","Jane Austen","novel"],
  ["1984","George Orwell","novel"],["Animal Farm","George Orwell","novel"],
  ["War and Peace","Leo Tolstoy","novel"],["Anna Karenina","Leo Tolstoy","novel"],
  ["Crime and Punishment","Fyodor Dostoevsky","novel"],["The Brothers Karamazov","Fyodor Dostoevsky","novel"],
  ["Don Quixote","Miguel de Cervantes","novel"],
  ["One Hundred Years of Solitude","Gabriel García Márquez","novel"],
  ["Love in the Time of Cholera","Gabriel García Márquez","novel"],
  ["Moby-Dick","Herman Melville","novel"],["The Great Gatsby","F. Scott Fitzgerald","novel"],
  ["To Kill a Mockingbird","Harper Lee","novel"],["The Catcher in the Rye","J.D. Salinger","novel"],
  ["The Old Man and the Sea","Ernest Hemingway","novel"],["For Whom the Bell Tolls","Ernest Hemingway","novel"],
  ["Jane Eyre","Charlotte Brontë","novel"],["Wuthering Heights","Emily Brontë","novel"],
  ["Great Expectations","Charles Dickens","novel"],["Oliver Twist","Charles Dickens","novel"],
  ["A Tale of Two Cities","Charles Dickens","novel"],["Les Misérables","Victor Hugo","novel"],
  ["The Hunchback of Notre-Dame","Victor Hugo","novel"],["Madame Bovary","Gustave Flaubert","novel"],
  ["The Stranger","Albert Camus","novel"],["The Trial","Franz Kafka","novel"],
  ["The Metamorphosis","Franz Kafka","novel"],["Ulysses","James Joyce","novel"],
  ["Mrs Dalloway","Virginia Woolf","novel"],["To the Lighthouse","Virginia Woolf","novel"],
  ["Frankenstein","Mary Shelley","novel"],["Dracula","Bram Stoker","novel"],
  ["The Picture of Dorian Gray","Oscar Wilde","novel"],
  ["The Adventures of Huckleberry Finn","Mark Twain","novel"],
  ["The Adventures of Tom Sawyer","Mark Twain","novel"],
  ["Treasure Island","Robert Louis Stevenson","novel"],
  ["Strange Case of Dr Jekyll and Mr Hyde","Robert Louis Stevenson","novel"],
  ["Alice's Adventures in Wonderland","Lewis Carroll","novel"],
  ["The Lord of the Rings","J.R.R. Tolkien","novel"],["The Hobbit","J.R.R. Tolkien","novel"],
  ["Brave New World","Aldous Huxley","novel"],["Fahrenheit 451","Ray Bradbury","novel"],
  ["Slaughterhouse-Five","Kurt Vonnegut","novel"],["Catch-22","Joseph Heller","novel"],
  ["Beloved","Toni Morrison","novel"],["Things Fall Apart","Chinua Achebe","novel"],
  ["Midnight's Children","Salman Rushdie","novel"],["The God of Small Things","Arundhati Roy","novel"],
  ["The Kite Runner","Khaled Hosseini","novel"],["Norwegian Wood","Haruki Murakami","novel"],
  ["Kafka on the Shore","Haruki Murakami","novel"],["The Alchemist","Paulo Coelho","novel"],
  ["Little Women","Louisa May Alcott","novel"],["Anne of Green Gables","L.M. Montgomery","novel"],
  ["The Call of the Wild","Jack London","novel"],["The Grapes of Wrath","John Steinbeck","novel"],
  ["Of Mice and Men","John Steinbeck","novel"],["Doctor Zhivago","Boris Pasternak","novel"],
  ["The Master and Margarita","Mikhail Bulgakov","novel"],["Invisible Man","Ralph Ellison","novel"],
  ["The Color Purple","Alice Walker","novel"],["The Handmaid's Tale","Margaret Atwood","novel"],
  ["Life of Pi","Yann Martel","novel"],["The Remains of the Day","Kazuo Ishiguro","novel"],
  ["Never Let Me Go","Kazuo Ishiguro","novel"],["Twenty Thousand Leagues Under the Seas","Jules Verne","novel"],
  ["Around the World in Eighty Days","Jules Verne","novel"],["The Count of Monte Cristo","Alexandre Dumas","novel"],
  ["The Three Musketeers","Alexandre Dumas","novel"],["Robinson Crusoe","Daniel Defoe","novel"],
  ["Gulliver's Travels","Jonathan Swift","novel"],["The Wind in the Willows","Kenneth Grahame","novel"],
  ["Charlotte's Web","E.B. White","novel"],["The Little Prince","Antoine de Saint-Exupéry","novel"],
  ["Hamlet","William Shakespeare","play"],["Macbeth","William Shakespeare","play"],
  ["Othello","William Shakespeare","play"],["King Lear","William Shakespeare","play"],
  ["Romeo and Juliet","William Shakespeare","play"],["A Midsummer Night's Dream","William Shakespeare","play"],
  ["The Tempest","William Shakespeare","play"],["Twelfth Night","William Shakespeare","play"],
  ["A Doll's House","Henrik Ibsen","play"],["The Cherry Orchard","Anton Chekhov","play"],
  ["The Seagull","Anton Chekhov","play"],["Waiting for Godot","Samuel Beckett","play"],
  ["Death of a Salesman","Arthur Miller","play"],["The Crucible","Arthur Miller","play"],
  ["A Streetcar Named Desire","Tennessee Williams","play"],
  ["The Importance of Being Earnest","Oscar Wilde","play"],["Pygmalion","George Bernard Shaw","play"],
  ["Mona Lisa","Leonardo da Vinci","painting"],["The Last Supper","Leonardo da Vinci","painting"],
  ["The Starry Night","Vincent van Gogh","painting"],["Sunflowers","Vincent van Gogh","painting"],
  ["The Scream","Edvard Munch","painting"],["Guernica","Pablo Picasso","painting"],
  ["The Persistence of Memory","Salvador Dalí","painting"],
  ["Girl with a Pearl Earring","Johannes Vermeer","painting"],
  ["The Night Watch","Rembrandt van Rijn","painting"],["The Birth of Venus","Sandro Botticelli","painting"],
  ["The Kiss","Gustav Klimt","painting"],["Water Lilies","Claude Monet","painting"],
  ["Impression, Sunrise","Claude Monet","painting"],["American Gothic","Grant Wood","painting"],
  ["Las Meninas","Diego Velázquez","painting"],["The Garden of Earthly Delights","Hieronymus Bosch","painting"],
  ["Christina's World","Andrew Wyeth","painting"],["The Great Wave off Kanagawa","Hokusai","painting"],
  ["The Four Seasons","Antonio Vivaldi","composition"],["Symphony No. 9","Ludwig van Beethoven","composition"],
  ["Moonlight Sonata","Ludwig van Beethoven","composition"],["The Magic Flute","Wolfgang Amadeus Mozart","composition"],
  ["The Marriage of Figaro","Wolfgang Amadeus Mozart","composition"],
  ["The Nutcracker","Pyotr Ilyich Tchaikovsky","composition"],["Swan Lake","Pyotr Ilyich Tchaikovsky","composition"],
  ["The Rite of Spring","Igor Stravinsky","composition"],["Boléro","Maurice Ravel","composition"],
  ["Clair de Lune","Claude Debussy","composition"],["Rhapsody in Blue","George Gershwin","composition"],
  ["The Blue Danube","Johann Strauss II","composition"],["Carmen","Georges Bizet","composition"],
  ["La Traviata","Giuseppe Verdi","composition"],["The Barber of Seville","Gioachino Rossini","composition"],
  ["Messiah","George Frideric Handel","composition"],
  ["David","Michelangelo","sculpture"],["The Thinker","Auguste Rodin","sculpture"],
];

/** [dish, country it is most associated with] */
const DISHES: [string, string][] = [
  ["Sushi","Japan"],["Ramen","Japan"],["Tempura","Japan"],["Kimchi","South Korea"],["Bibimbap","South Korea"],
  ["Pad Thai","Thailand"],["Tom Yum","Thailand"],["Pho","Vietnam"],["Bánh mì","Vietnam"],
  ["Peking Duck","China"],["Mapo Tofu","China"],["Dim Sum","China"],["Biryani","India"],
  ["Butter Chicken","India"],["Masala Dosa","India"],["Samosa","India"],["Rendang","Indonesia"],
  ["Nasi Goreng","Indonesia"],["Chicken Adobo","Philippines"],["Nasi Lemak","Malaysia"],
  ["Hainanese Chicken Rice","Singapore"],["Momo","Nepal"],["Dal Bhat","Nepal"],["Kottu Roti","Sri Lanka"],
  ["Plov","Uzbekistan"],["Khachapuri","Georgia"],["Mansaf","Jordan"],["Kabsa","Saudi Arabia"],
  ["Tagine","Morocco"],["Harira","Morocco"],["Injera","Ethiopia"],["Bobotie","South Africa"],
  ["Bunny Chow","South Africa"],["Poutine","Canada"],["Ceviche","Peru"],["Lomo Saltado","Peru"],
  ["Asado","Argentina"],["Feijoada","Brazil"],["Pão de Queijo","Brazil"],["Tacos al Pastor","Mexico"],
  ["Mole Poblano","Mexico"],["Guacamole","Mexico"],["Pupusa","El Salvador"],["Jerk Chicken","Jamaica"],
  ["Ropa Vieja","Cuba"],["Paella","Spain"],["Gazpacho","Spain"],["Churros","Spain"],
  ["Tortilla Española","Spain"],["Pizza Margherita","Italy"],["Risotto","Italy"],["Lasagne","Italy"],
  ["Tiramisu","Italy"],["Gelato","Italy"],["Spaghetti Carbonara","Italy"],["Ratatouille","France"],
  ["Coq au Vin","France"],["Crêpes","France"],["Bouillabaisse","France"],["Croissant","France"],
  ["Cheese Fondue","Switzerland"],["Rösti","Switzerland"],["Bratwurst","Germany"],["Pretzel","Germany"],
  ["Wiener Schnitzel","Austria"],["Goulash","Hungary"],["Pierogi","Poland"],["Borscht","Ukraine"],
  ["Beef Stroganoff","Russia"],["Moussaka","Greece"],["Souvlaki","Greece"],["Tzatziki","Greece"],
  ["Doner Kebab","Türkiye"],["Baklava","Türkiye"],["Fish and Chips","United Kingdom"],
  ["Haggis","United Kingdom"],["Irish Stew","Ireland"],["Stroopwafel","Netherlands"],
  ["Moules-frites","Belgium"],["Smørrebrød","Denmark"],["Köttbullar (meatballs)","Sweden"],
  ["Gravlax","Sweden"],["Lamington","Australia"],["Meat Pie","Australia"],["Hāngī","New Zealand"],
];

/** [word, short meaning] */
const VOCAB: [string, string][] = [
  ["ephemeral","lasting a very short time"],["ubiquitous","found everywhere at once"],
  ["gregarious","sociable and fond of company"],["laconic","using very few words"],
  ["garrulous","excessively talkative"],["benevolent","kind and well-meaning"],
  ["frugal","careful and sparing with money"],["opulent","rich and luxurious"],
  ["arid","very dry, with little rain"],["verdant","green with growing plants"],
  ["lucid","clear and easy to understand"],["tenacious","holding firm and not letting go"],
  ["audacious","bold and daring"],["meticulous","extremely careful about detail"],
  ["pragmatic","practical rather than idealistic"],["obsolete","no longer in use"],
  ["serene","calm and untroubled"],["turbulent","full of confusion and disorder"],
  ["candid","honest and direct"],["timid","easily frightened, shy"],
  ["ravenous","extremely hungry"],["jubilant","full of triumphant joy"],
  ["melancholy","a feeling of thoughtful sadness"],["furtive","secretive and sly"],
  ["placid","calm and not easily excited"],["brittle","hard but easily broken"],
  ["pliable","easily bent or shaped"],["astute","sharp and shrewd in judgement"],
  ["naive","innocent and overly trusting"],["zealous","full of energetic enthusiasm"],
  ["apathetic","showing no interest or emotion"],["eloquent","fluent and persuasive in speech"],
  ["reticent","reluctant to speak openly"],["amiable","friendly and pleasant"],
  ["abundant","existing in large quantities"],["scarce","in short supply"],
  ["opaque","impossible to see through"],["nimble","quick and light in movement"],
  ["lethargic","sluggish and lacking energy"],["prudent","cautious and sensible"],
  ["reckless","acting without care for danger"],["arrogant","exaggerating one's own importance"],
  ["counterfeit","made in imitation to deceive"],["dormant","inactive for a period of time"],
  ["durable","able to last a long time"],["vivid","strikingly bright or intense"],
  ["ancient","belonging to the very distant past"],["contemporary","belonging to the present time"],
  ["drought","a long period without rain"],["oasis","a fertile watered spot in a desert"],
  ["archipelago","a chain or cluster of islands"],["peninsula","land almost surrounded by water"],
  ["plateau","a broad area of high, flat land"],["estuary","a river mouth meeting the tide"],
  ["glacier","a slowly moving mass of ice"],["nocturnal","active mainly at night"],
  ["diurnal","active mainly during the day"],["herbivore","an animal that eats plants"],
  ["carnivore","an animal that eats meat"],["omnivore","an animal that eats plants and meat"],
  ["hibernate","to pass the winter in deep sleep"],["migrate","to move with the seasons"],
  ["camouflage","colouring that blends into surroundings"],["anonymous","of unknown or hidden name"],
];

/** collective nouns: [animal (plural), group name] */
const COLLECTIVES: [string, string][] = [
  ["crows","a murder"],["owls","a parliament"],["lions","a pride"],["dolphins","a pod"],
  ["geese","a gaggle"],["starlings","a murmuration"],["sharks","a shiver"],["giraffes","a tower"],
  ["rhinos","a crash"],["zebras","a dazzle"],["tigers","an ambush"],["lemurs","a conspiracy"],
  ["porcupines","a prickle"],["hippos","a bloat"],["flamingos","a flamboyance"],["kangaroos","a mob"],
  ["hyenas","a cackle"],["bears","a sloth"],["foxes","a skulk"],["leopards","a leap"],
  ["frogs","an army"],["jellyfish","a smack"],["otters","a romp"],["ferrets","a business"],
  ["ravens","an unkindness"],["penguins","a waddle"],["eagles","a convocation"],["wolves","a pack"],
  ["fish","a school"],["bees","a swarm"],
];

/** baby animals: [animal, baby name] */
const BABIES: [string, string][] = [
  ["kangaroo","joey"],["swan","cygnet"],["hare","leveret"],["goose","gosling"],["deer","fawn"],
  ["bear","cub"],["fox","kit"],["horse","foal"],["whale","calf"],["owl","owlet"],
  ["frog","tadpole"],["seal","pup"],["pigeon","squab"],["goat","kid"],["sheep","lamb"],["pig","piglet"],
];

/** animal classes: [animal, class] */
const ANIMAL_CLASS: [string, string][] = [
  ["dolphin","mammal"],["whale","mammal"],["bat","mammal"],["platypus","mammal"],["seal","mammal"],
  ["elephant","mammal"],["hedgehog","mammal"],["shark","fish"],["seahorse","fish"],["eel","fish"],
  ["salmon","fish"],["penguin","bird"],["ostrich","bird"],["kiwi","bird"],["peacock","bird"],
  ["frog","amphibian"],["salamander","amphibian"],["newt","amphibian"],["axolotl","amphibian"],
  ["turtle","reptile"],["snake","reptile"],["crocodile","reptile"],["gecko","reptile"],
  ["chameleon","reptile"],["komodo dragon","reptile"],["toad","amphibian"],
];
const CLASS_POOL = ["mammal", "bird", "reptile", "amphibian", "fish"];

/** ready-made questions: [topic, question, correct, wrong, wrong, wrong, note?] */
const CURATED: [TriviaTopic, string, string, string, string, string, string?][] = [
  ["Sports & Games","How many players does a football (soccer) team field at once?","11","9","10","12"],
  ["Sports & Games","How many players per side are on court in basketball?","5","6","7","4"],
  ["Sports & Games","How many players per side take the field in cricket?","11","10","12","13"],
  ["Sports & Games","How many players per side play indoor volleyball?","6","5","7","8"],
  ["Sports & Games","How many players per side are in rugby union?","15","13","11","17"],
  ["Sports & Games","How many players per side play water polo?","7","6","8","9"],
  ["Sports & Games","How many players per side take the field in baseball?","9","8","10","11"],
  ["Sports & Games","How many players per side play team handball?","7","6","8","9"],
  ["Sports & Games","Wimbledon, the oldest tennis major, is played in which city?","London","Paris","New York","Melbourne"],
  ["Sports & Games","The French Open (Roland-Garros) is played on which surface?","Clay","Grass","Hard court","Carpet"],
  ["Sports & Games","The Australian Open is hosted in which city?","Melbourne","Sydney","Perth","Brisbane"],
  ["Sports & Games","In tennis, a score of zero is called what?","Love","Nil","Duck","Blank"],
  ["Sports & Games","In golf, one stroke under par on a hole is called a…?","Birdie","Eagle","Bogey","Albatross"],
  ["Sports & Games","In golf, two strokes under par on a hole is called an…?","Eagle","Birdie","Bogey","Condor"],
  ["Sports & Games","Scoring three goals in one match is commonly called a…?","Hat-trick","Treble","Triplet","Turkey"],
  ["Sports & Games","In cricket, a batter out without scoring is said to be out for a…?","Duck","Goose","Blank","Zero"],
  ["Sports & Games","In bowling, three strikes in a row is called a…?","Turkey","Hat-trick","Triple crown","Strikeout"],
  ["Sports & Games","A 'googly' is a deceptive delivery in which sport?","Cricket","Baseball","Golf","Hockey"],
  ["Sports & Games","A 'scrum' restarts play in which sport?","Rugby","Football","Hockey","Lacrosse"],
  ["Sports & Games","The butterfly is a stroke in which sport?","Swimming","Badminton","Fencing","Rowing"],
  ["Sports & Games","How often are the Summer Olympic Games held?","Every 4 years","Every 2 years","Every 3 years","Every 5 years"],
  ["Sports & Games","How many rings appear on the Olympic flag?","5","4","6","7"],
  ["Sports & Games","The first modern Olympic Games (1896) were held in which city?","Athens","Paris","Rome","London"],
  ["Sports & Games","A marathon is officially how long?","42.195 km","40 km","45 km","38.6 km"],
  ["Sports & Games","The Tour de France is a famous race in which sport?","Cycling","Running","Sailing","Motor racing"],
  ["Sports & Games","The America's Cup is contested in which sport?","Sailing","Golf","Tennis","Rowing"],
  ["Sports & Games","The Ryder Cup pits Europe against the USA in which sport?","Golf","Tennis","Athletics","Rugby"],
  ["Sports & Games","The Ashes is a storied cricket rivalry between England and…?","Australia","India","South Africa","West Indies"],
  ["Sports & Games","The Stanley Cup is the championship trophy of which sport?","Ice hockey","Basketball","Baseball","American football"],
  ["Sports & Games","The Super Bowl decides the champion of which sport?","American football","Baseball","Basketball","Ice hockey"],
  ["Sports & Games","Sumo wrestling is the national sport of which country?","Japan","China","South Korea","Mongolia"],
  ["Sports & Games","Taekwondo originated in which country?","South Korea","Japan","China","Thailand"],
  ["Sports & Games","Judo originated in which country?","Japan","South Korea","China","Brazil"],
  ["Sports & Games","A standard chessboard has how many squares?","64","72","81","56"],
  ["Sports & Games","In chess, which piece can only move diagonally?","Bishop","Rook","Knight","Queen"],
  ["Sports & Games","In chess, the game ends immediately with what move?","Checkmate","Stalemate","Castling","Check"],
  ["Sports & Games","In darts, the small centre circle of the board scores…?","50","25","100","60"],
  ["Sports & Games","How many pins stand in ten-pin bowling?","10","9","12","8"],
  ["Sports & Games","A shuttlecock is used in which sport?","Badminton","Tennis","Squash","Table tennis"],
  ["Sports & Games","Which sport is played at Augusta National every April?","Golf (the Masters)","Tennis","Polo","Horse racing"],
  ["Sports & Games","In snooker, which colour ball is worth the most points?","Black","Pink","Blue","Red"],
  ["Sports & Games","How many points is the bullseye's outer ring (the '25') in darts?","25","50","33","20"],
  ["Sports & Games","'Checkmate' comes from a Persian phrase meaning what?","The king is helpless","The queen falls","Victory is mine","The board is closed"],
  ["Sports & Games","Which piece begins a chess game in each corner?","Rook","Bishop","Knight","Pawn"],
  ["Sports & Games","The FIFA World Cup is held how often?","Every 4 years","Every 2 years","Every 3 years","Every 5 years"],
  ["Science & Space","What is the chemical formula of water?","H₂O","CO₂","O₂","H₂O₂"],
  ["Science & Space","At sea level, water boils at what temperature?","100 °C","90 °C","110 °C","120 °C"],
  ["Science & Space","Roughly how fast does light travel in a vacuum?","300,000 km per second","150,000 km per second","30,000 km per second","3,000,000 km per second"],
  ["Science & Space","How many bones does an adult human body have?","206","186","226","250"],
  ["Science & Space","How many chambers does the human heart have?","4","2","3","6"],
  ["Science & Space","What is the largest organ of the human body?","The skin","The liver","The brain","The lungs"],
  ["Science & Space","DNA is famously shaped like a…?","Double helix","Single strand","Triple knot","Flat ladder"],
  ["Science & Space","Plants make food from sunlight through which process?","Photosynthesis","Respiration","Fermentation","Transpiration"],
  ["Science & Space","Which planet is known as the Red Planet?","Mars","Venus","Jupiter","Mercury"],
  ["Science & Space","Which is the largest planet in the Solar System?","Jupiter","Saturn","Neptune","Earth"],
  ["Science & Space","Which planet is the hottest in the Solar System?","Venus","Mercury","Mars","Jupiter"],
  ["Science & Space","Which planet is famous for its bright ring system?","Saturn","Jupiter","Uranus","Neptune"],
  ["Science & Space","How many planets are in the Solar System?","8","9","7","10"],
  ["Science & Space","Which planet sits closest to the Sun?","Mercury","Venus","Mars","Earth"],
  ["Science & Space","Earth's galaxy is called the…?","Milky Way","Andromeda","Whirlpool","Sombrero"],
  ["Science & Space","A light-year measures what?","Distance","Time","Speed","Brightness"],
  ["Science & Space","Who first walked on the Moon, in 1969?","Neil Armstrong","Buzz Aldrin","Yuri Gagarin","John Glenn"],
  ["Science & Space","The first artificial satellite, launched in 1957, was called…?","Sputnik 1","Explorer 1","Vostok 1","Apollo 1"],
  ["Science & Space","Who was the first human in space, in 1961?","Yuri Gagarin","Neil Armstrong","Alan Shepard","Valentina Tereshkova"],
  ["Science & Space","Who developed the theory of general relativity?","Albert Einstein","Isaac Newton","Niels Bohr","Galileo Galilei"],
  ["Science & Space","Who formulated the laws of motion and universal gravitation?","Isaac Newton","Albert Einstein","Johannes Kepler","Michael Faraday"],
  ["Science & Space","Who discovered penicillin in 1928?","Alexander Fleming","Louis Pasteur","Marie Curie","Joseph Lister"],
  ["Science & Space","Marie Curie won Nobel Prizes in which two fields?","Physics and Chemistry","Physics and Medicine","Chemistry and Peace","Medicine and Chemistry"],
  ["Science & Space","Who proposed evolution by natural selection?","Charles Darwin","Gregor Mendel","Alfred Wegener","Carl Linnaeus"],
  ["Science & Space","Who is called the father of genetics for his pea-plant work?","Gregor Mendel","Charles Darwin","Louis Pasteur","Francis Crick"],
  ["Science & Space","Who proposed that the Earth orbits the Sun, in 1543?","Nicolaus Copernicus","Galileo Galilei","Tycho Brahe","Ptolemy"],
  ["Science & Space","The World Wide Web was invented by…?","Tim Berners-Lee","Bill Gates","Steve Jobs","Alan Turing"],
  ["Science & Space","Which gas do humans exhale more of than they inhale?","Carbon dioxide","Oxygen","Nitrogen","Hydrogen"],
  ["Science & Space","Which gas makes up most of Earth's atmosphere?","Nitrogen","Oxygen","Carbon dioxide","Argon"],
  ["Science & Space","What force keeps planets in orbit around the Sun?","Gravity","Magnetism","Friction","Inertia"],
  ["Science & Space","Sound cannot travel through…?","A vacuum","Water","Steel","Air"],
  ["Science & Space","What instrument measures atmospheric pressure?","Barometer","Thermometer","Hygrometer","Anemometer"],
  ["Science & Space","On the pH scale, 7 means a solution is…?","Neutral","Acidic","Alkaline","Toxic"],
  ["Science & Space","Diamond is a crystal form of which element?","Carbon","Silicon","Quartz","Boron"],
  ["Science & Space","How many moons does Mars have?","2","1","0","4"],
  ["Science & Space","How many teeth does a full adult human set have?","32","28","30","36"],
  ["Nature","Which is the fastest land animal?","Cheetah","Lion","Pronghorn","Greyhound"],
  ["Nature","Which is the largest animal ever known to have lived?","Blue whale","African elephant","Sperm whale","Argentinosaurus"],
  ["Nature","Which is the tallest living land animal?","Giraffe","Elephant","Ostrich","Camel"],
  ["Nature","Which is the largest living bird?","Ostrich","Emu","Albatross","Condor"],
  ["Nature","Which bird lays the largest eggs?","Ostrich","Emu","Swan","Eagle"],
  ["Nature","Which is the largest living reptile?","Saltwater crocodile","Komodo dragon","Anaconda","Galápagos tortoise"],
  ["Nature","Which is the only mammal capable of true flight?","Bat","Flying squirrel","Sugar glider","Colugo"],
  ["Nature","Which big cat is the largest?","Tiger","Lion","Jaguar","Leopard"],
  ["Nature","How many hearts does an octopus have?","3","1","2","4"],
  ["Nature","How many legs does a spider have?","8","6","10","12"],
  ["Nature","Honey is made by bees from what?","Nectar","Pollen","Sap","Dew"],
  ["Nature","A caterpillar transforms into a butterfly inside a…?","Chrysalis","Nest","Burrow","Web"],
  ["Nature","Which tree grows from an acorn?","Oak","Maple","Birch","Elm"],
  ["Nature","Bamboo is technically a kind of…?","Grass","Tree","Fern","Shrub"],
  ["Nature","Which is the tallest species of tree on Earth?","Coast redwood","Giant sequoia","Douglas fir","Mountain ash"],
  ["Nature","Which desert is the largest hot desert in the world?","Sahara","Gobi","Kalahari","Mojave"],
  ["Nature","Which is the deepest known point in the ocean?","The Mariana Trench","The Puerto Rico Trench","The Java Trench","The Tonga Trench"],
  ["Nature","Which ocean is the largest?","Pacific","Atlantic","Indian","Arctic"],
  ["Nature","Which is the longest mountain range on land?","The Andes","The Himalayas","The Rockies","The Alps"],
  ["Nature","Coral reefs are built by tiny animals called…?","Polyps","Krill","Plankton","Barnacles"],
  ["Nature","Which animal is known to sleep standing up?","Horse","Dog","Pig","Kangaroo"],
  ["Nature","What do pandas mostly eat?","Bamboo","Fish","Fruit","Insects"],
  ["Nature","Which bird is famous for mimicking human speech?","Parrot","Crow","Owl","Sparrow"],
  ["Nature","Which land animal has the longest gestation, nearly two years?","Elephant","Giraffe","Rhinoceros","Hippopotamus"],
  ["History","The Great Wall was built over centuries to protect which country?","China","India","Mongolia","Japan"],
  ["History","The pyramids of Giza stand in which country?","Egypt","Sudan","Mexico","Iraq"],
  ["History","The Colosseum was the great arena of which ancient empire?","Roman","Greek","Persian","Ottoman"],
  ["History","Which ancient city was buried by Mount Vesuvius in 79 AD?","Pompeii","Athens","Carthage","Troy"],
  ["History","The Renaissance began in which country?","Italy","France","Greece","Spain"],
  ["History","Who painted the ceiling of the Sistine Chapel?","Michelangelo","Leonardo da Vinci","Raphael","Botticelli"],
  ["History","The Mona Lisa hangs in which museum?","The Louvre","The Uffizi","The Prado","The British Museum"],
  ["History","Which empire was ruled by Genghis Khan?","The Mongol Empire","The Ottoman Empire","The Persian Empire","The Han Empire"],
  ["History","Machu Picchu was built by which civilisation?","The Inca","The Maya","The Aztec","The Olmec"],
  ["History","The Aztec capital Tenochtitlan stood where which city is today?","Mexico City","Lima","Guatemala City","Cusco"],
  ["History","The Taj Mahal was built as a…?","Mausoleum","Palace","Temple","Fortress"],
  ["History","Cleopatra was the last active ruler of which kingdom?","Ptolemaic Egypt","Ancient Rome","Babylon","Nubia"],
  ["History","Which wonder of the ancient world stood at Alexandria?","A lighthouse","A colossus","Hanging gardens","A great temple"],
  ["History","The samurai were the warrior class of which country?","Japan","China","Korea","Mongolia"],
  ["History","The Vikings sailed chiefly from which region?","Scandinavia","The British Isles","Iberia","The Baltics"],
  ["History","Which document, sealed in 1215, limited the English king's power?","The Magna Carta","The Bill of Rights","The Domesday Book","The Habeas Corpus Act"],
  ["History","Who was the first President of the United States?","George Washington","Thomas Jefferson","John Adams","Abraham Lincoln"],
  ["History","The Berlin Wall fell in which year?","1989","1991","1985","1979"],
  ["History","The Titanic sank in which ocean?","The Atlantic","The Pacific","The Arctic","The Mediterranean"],
  ["History","Which queen ruled the United Kingdom for over 70 years, until 2022?","Elizabeth II","Victoria","Elizabeth I","Anne"],
  ["History","The Rosetta Stone unlocked the reading of which script?","Egyptian hieroglyphs","Cuneiform","Linear B","Sanskrit"],
  ["History","The Silk Road primarily connected China with…?","Europe and the Middle East","Australia","The Americas","Sub-Saharan Africa"],
  ["History","Which country gifted the Statue of Liberty to the USA?","France","United Kingdom","Spain","Italy"],
  ["History","Angkor Wat, the vast temple complex, is in which country?","Cambodia","Thailand","Vietnam","Laos"],
  ["History","Petra, the rose-red city carved in stone, is in which country?","Jordan","Egypt","Syria","Saudi Arabia"],
  ["Arts & Books","Which instrument has 88 keys?","Piano","Organ","Harpsichord","Accordion"],
  ["Arts & Books","How many strings does a standard violin have?","4","5","6","3"],
  ["Arts & Books","The Beatles formed in which city?","Liverpool","London","Manchester","Birmingham"],
  ["Arts & Books","Opera as an art form began in which country?","Italy","France","Germany","Austria"],
  ["Arts & Books","Who leads an orchestra with a baton?","The conductor","The concertmaster","The composer","The soloist"],
  ["Arts & Books","Haiku is a short poem form from which country?","Japan","China","Korea","Vietnam"],
  ["Arts & Books","Which artist is famous for cutting off part of his own ear?","Vincent van Gogh","Paul Gauguin","Claude Monet","Edvard Munch"],
  ["Arts & Books","Flamenco music and dance come from which country?","Spain","Portugal","Mexico","Argentina"],
  ["Arts & Books","The tango originated in which country?","Argentina","Brazil","Spain","Cuba"],
  ["Arts & Books","Ballet developed its formal vocabulary chiefly in which language?","French","Italian","Russian","German"],
  ["Arts & Books","In Greek mythology, who is king of the gods?","Zeus","Poseidon","Hades","Apollo"],
  ["Arts & Books","In Greek mythology, who rules the sea?","Poseidon","Zeus","Hades","Hermes"],
  ["Arts & Books","In Norse mythology, Thor wields a hammer called…?","Mjölnir","Gungnir","Gram","Skofnung"],
  ["Arts & Books","In Greek myth, whose only weak spot was his heel?","Achilles","Hector","Perseus","Odysseus"],
  ["Arts & Books","Who opened a forbidden box releasing the world's ills?","Pandora","Persephone","Athena","Cassandra"],
  ["Arts & Books","King Midas turned everything he touched into…?","Gold","Silver","Stone","Glass"],
  ["Arts & Books","Icarus fell after flying too close to the…?","Sun","Moon","Sea","Mountain"],
  ["Arts & Books","The Trojan War ended thanks to a giant wooden…?","Horse","Bull","Eagle","Ship"],
  ["Arts & Books","Anubis, god of mummification, belongs to which mythology?","Egyptian","Greek","Norse","Mesopotamian"],
  ["Arts & Books","Sherlock Holmes was created by which author?","Arthur Conan Doyle","Agatha Christie","Edgar Allan Poe","Charles Dickens"],
  ["Arts & Books","Hercule Poirot was created by which author?","Agatha Christie","Arthur Conan Doyle","Dorothy L. Sayers","Raymond Chandler"],
  ["Arts & Books","Which playwright is known as 'the Bard of Avon'?","William Shakespeare","Christopher Marlowe","Ben Jonson","John Milton"],
  ["Food & Drink","Which spice, from crocus flowers, is the most expensive by weight?","Saffron","Vanilla","Cardamom","Cinnamon"],
  ["Food & Drink","Chocolate is made from the beans of which tree?","Cacao","Coffee","Carob","Vanilla"],
  ["Food & Drink","Which country drinks the most tea per person?","Türkiye","United Kingdom","China","India"],
  ["Food & Drink","Champagne may only be so named if it comes from…?","France","Italy","Spain","Portugal"],
  ["Food & Drink","Which cheese is traditionally grated over spaghetti bolognese?","Parmesan","Cheddar","Brie","Gouda"],
  ["Food & Drink","Tofu is made from which plant?","Soybean","Chickpea","Rice","Wheat"],
  ["Food & Drink","Which fruit is famously spiky and strong-smelling?","Durian","Jackfruit","Rambutan","Lychee"],
  ["Food & Drink","Wasabi accompanies which cuisine's dishes?","Japanese","Chinese","Thai","Korean"],
  ["Food & Drink","Which grain feeds more than half the world's population?","Rice","Wheat","Maize","Barley"],
  ["Food & Drink","Hummus is made mainly from which legume?","Chickpeas","Lentils","Black beans","Peas"],
  ["Food & Drink","Which nut is used to make marzipan?","Almond","Cashew","Hazelnut","Walnut"],
  ["Food & Drink","Espresso originated in which country?","Italy","France","Türkiye","Austria"],
  ["Food & Drink","Which vegetable is the main ingredient of sauerkraut?","Cabbage","Cucumber","Turnip","Radish"],
  ["Food & Drink","Guacamole's main ingredient is…?","Avocado","Green tomato","Pea","Lime"],
  ["Food & Drink","Which food do honeybees produce?","Honey","Royal jelly only","Nectar","Pollen"],
  ["Food & Drink","Maple syrup is most associated with which country?","Canada","United States","Norway","Russia"],
  ["Words","Which language has the most native speakers in the world?","Mandarin Chinese","English","Spanish","Hindi"],
  ["Words","Brazil's official language is…?","Portuguese","Spanish","Brazilian","French"],
  ["Words","Which alphabet is used for Russian?","Cyrillic","Latin","Greek","Runic"],
  ["Words","A word that reads the same backwards, like 'level', is a…?","Palindrome","Anagram","Acronym","Homophone"],
  ["Words","Two words that sound alike but differ in meaning are…?","Homophones","Synonyms","Antonyms","Palindromes"],
  ["Words","A word formed by rearranging another's letters is an…?","Anagram","Acronym","Idiom","Epigram"],
  ["Words","Which language gave us the words 'piano' and 'opera'?","Italian","French","Spanish","Latin"],
  ["Words","Which language gave us 'kindergarten' and 'rucksack'?","German","Dutch","Danish","Yiddish"],
  ["Words","'Tsunami' is a loanword from which language?","Japanese","Chinese","Malay","Korean"],
  ["Words","'Safari' comes from which language?","Swahili","Arabic","Zulu","Amharic"],
  ["Words","How many letters are in the English alphabet?","26","24","25","28"],
  ["Words","The dot over a lowercase 'i' or 'j' is called a…?","Tittle","Serif","Diacritic","Cedilla"],
];

/* ------------------------------------------------------------------ */
/* builders                                                            */
/* ------------------------------------------------------------------ */

const rng = mulberry32(271828183);
const QUESTIONS: TriviaQuestion[] = [];
const seen = new Set<string>();

function push(topic: TriviaTopic, q: string, correct: string, wrongs: string[], note?: string) {
  const need = wrongs.length >= 3 ? 3 : 1;
  const ws = [...new Set(wrongs.filter((w) => w && w !== correct))].slice(0, need);
  if (ws.length < need) return;
  const key = q + "::" + correct;
  if (seen.has(key)) return;
  seen.add(key);
  const choices = shuffled(rng, [correct, ...ws]);
  QUESTIONS.push({ topic, q, choices, answer: choices.indexOf(correct), note });
}

/** deterministic sample of up to n entries matching the filter */
function pickN<T>(pool: readonly T[], n: number, ok: (t: T) => boolean): T[] {
  const out: T[] = [];
  // start at a seeded offset and walk — cheaper than shuffling the pool each call
  const start = Math.floor(rng() * pool.length);
  for (let i = 0; i < pool.length && out.length < n; i++) {
    const t = pool[(start + i) % pool.length];
    if (ok(t)) out.push(t);
  }
  return out;
}

const fmtYear = (y: number) => (y < 0 ? `${-y} BC` : `${y}`);

/* --- capitals ------------------------------------------------------ */
{
  for (const [country, capital, continent] of CAPITALS) {
    const sameCont = CAPITALS.filter(([c, , k]) => k === continent && c !== country);
    const otherCaps = pickN(sameCont, 3, () => true).map((r) => r[1]);
    push("Geography", `What is the capital of ${country}?`, capital, otherCaps);
    const otherCountries = pickN(sameCont, 3, () => true).map((r) => r[0]);
    push("Geography", `${capital} is the capital of which country?`, country, otherCountries);
    if (!CONTINENT_SKIP.has(country)) {
      const wrongConts = pickN(CONTINENTS6, 3, (c) => c !== continent);
      push("Geography", `${country} is in which continent?`, continent, wrongConts);
    }
  }
}

const continentOf = new Map<string, string>();
for (const [c, , k] of CAPITALS) continentOf.set(c, k);
for (const r of COUNTRY_ROWS) if (!continentOf.has(r[0])) continentOf.set(r[0], r[1]);
const countriesByContinent = new Map<string, string[]>();
for (const [c, k] of continentOf) {
  if (!countriesByContinent.has(k)) countriesByContinent.set(k, []);
  countriesByContinent.get(k)!.push(c);
}

/* --- gazetteer countries: borders, landlocked, population, climate -- */
{
  for (const row of COUNTRY_ROWS) {
    const [name, continent, , , , , , , , borderStr] = row;
    const borders = borderStr ? borderStr.split("|") : [];
    if (borders.length) {
      const others = (countriesByContinent.get(continent) ?? []).filter(
        (c) => c !== name && !borders.includes(c),
      );
      const wrongs = pickN(others, 3, () => true);
      const correct = borders[Math.floor(rng() * borders.length)];
      push(
        "Geography",
        `Which of these countries shares a border with ${name}?`,
        correct,
        wrongs,
        `${name} borders ${borders.join(", ")}.`,
      );
    }
    if (row[7] === 0) {
      const coastalSame = COUNTRY_ROWS.filter((r) => r[1] === continent && r[7] === 1 && r[0] !== name);
      const wrongs = pickN(coastalSame, 3, () => true).map((r) => r[0]);
      push("Geography", `Which of these countries is landlocked?`, name, wrongs,
        `${name} has no coastline.`);
    }
  }
  // population pairs
  for (const a of COUNTRY_ROWS) {
    const partners = pickN(COUNTRY_ROWS, 6, (b) => b !== a && (a[5] >= b[5] * 2.5 || b[5] >= a[5] * 2.5));
    for (const b of partners) {
      const hi = a[5] > b[5] ? a : b;
      const pair = [a, b].sort((x, y) => x[0].localeCompare(y[0]));
      push("Numbers", `Which country has the larger population — ${pair[0][0]} or ${pair[1][0]}?`, hi[0],
        [pair[0][0] === hi[0] ? pair[1][0] : pair[0][0]],
        `${hi[0]}: about ${hi[5]} million people; ${(hi === a ? b : a)[0]}: about ${(hi === a ? b : a)[5]} million.`);
    }
    // climate pairs
    const warm = pickN(COUNTRY_ROWS, 4, (b) => b !== a && Math.abs(a[6] - b[6]) >= 9);
    for (const b of warm) {
      const hot = a[6] > b[6] ? a : b;
      const cold = hot === a ? b : a;
      const pair = [a, b].sort((x, y) => x[0].localeCompare(y[0]));
      push("Geography", `Which country is warmer on average — ${pair[0][0]} or ${pair[1][0]}?`, hot[0], [cold[0]],
        `Rough annual means: ${hot[0]} ~${hot[6]} °C, ${cold[0]} ~${cold[6]} °C.`);
    }
  }
}

/* --- gazetteer places ---------------------------------------------- */
{
  const nameCount = new Map<string, number>();
  for (const p of PLACE_ROWS) nameCount.set(p[0], (nameCount.get(p[0]) ?? 0) + 1);
  // shared islands / regions that span borders make bad single-answer questions
  const AMBIGUOUS = new Set(["Borneo", "New Guinea", "Ireland", "Hispaniola", "Timor", "Tierra del Fuego"]);
  const askable = PLACE_ROWS.filter(
    (p) => nameCount.get(p[0]) === 1 && !AMBIGUOUS.has(p[0]) &&
      ["c", "i", "s", "lm"].includes(p[7]) && continentOf.has(p[1]),
  );

  for (const p of askable) {
    const [name, country, , , , , , kind] = p;
    const continent = continentOf.get(country)!;
    const wrongs = pickN(countriesByContinent.get(continent) ?? [], 3, (c) => c !== country);
    const q =
      kind === "c" ? `Which country is the city of ${name} in?`
      : kind === "i" ? `The island of ${name} belongs to which country?`
      : kind === "s" ? `${name} is a state or province of which country?`
      : `Which country is ${name} in?`;
    push("Geography", q, country, wrongs);
  }

  // reverse: which of these cities is in X?
  const cities = askable.filter((p) => p[7] === "c");
  const cityByCountry = new Map<string, typeof cities>();
  for (const c of cities) {
    if (!cityByCountry.has(c[1])) cityByCountry.set(c[1], []);
    cityByCountry.get(c[1])!.push(c);
  }
  for (const [country, list] of cityByCountry) {
    const continent = continentOf.get(country)!;
    for (const target of list.slice(0, 2)) {
      const wrongs = pickN(cities, 3, (c) => c[1] !== country && continentOf.get(c[1]) === continent)
        .map((c) => c[0]);
      push("Geography", `Which of these cities is in ${country}?`, target[0], wrongs,
        `${target[0]} is in ${country}.`);
    }
  }

  // north/south and east/west pairs
  const latLabel = (p: (typeof cities)[number]) =>
    `${p[0]} sits near ${Math.abs(p[2]).toFixed(0)}°${p[2] >= 0 ? "N" : "S"}`;
  const pairSeen = new Set<string>();
  cities.forEach((a, ai) => {
    const partners = pickN(cities, 5, (b) => b !== a && Math.abs(a[2] - b[2]) >= 13);
    for (const b of partners) {
      const key = [a[0], b[0]].sort().join("|");
      if (pairSeen.has(key)) continue;
      pairSeen.add(key);
      const north = a[2] > b[2] ? a : b;
      const south = north === a ? b : a;
      const pair = [a, b].sort((x, y) => x[0].localeCompare(y[0]));
      if (ai % 2 === 0) {
        push("Geography", `Which city lies further north — ${pair[0][0]} or ${pair[1][0]}?`, north[0], [south[0]],
          `${latLabel(north)}; ${latLabel(south)}.`);
      } else {
        push("Geography", `Which city lies further south — ${pair[0][0]} or ${pair[1][0]}?`, south[0], [north[0]],
          `${latLabel(south)}; ${latLabel(north)}.`);
      }
    }
    // east/west, away from the antimeridian to keep the answer unambiguous
    if (a[3] > -140 && a[3] < 140) {
      const ew = pickN(cities, 3, (b) => b !== a && b[3] > -140 && b[3] < 140 && Math.abs(a[3] - b[3]) >= 28);
      for (const b of ew) {
        const key = "ew:" + [a[0], b[0]].sort().join("|");
        if (pairSeen.has(key)) continue;
        pairSeen.add(key);
        const east = a[3] > b[3] ? a : b;
        const west = east === a ? b : a;
        const pair = [a, b].sort((x, y) => x[0].localeCompare(y[0]));
        push("Geography", `Which city lies further east — ${pair[0][0]} or ${pair[1][0]}?`, east[0], [west[0]]);
      }
    }
    // city population pairs
    if (a[4] >= 0.08) {
      const pop = pickN(cities, 3, (b) => b !== a && b[4] >= 0.08 &&
        (a[4] >= b[4] * 3 || b[4] >= a[4] * 3) && Math.abs(a[4] - b[4]) >= 0.5);
      for (const b of pop) {
        const key = "pop:" + [a[0], b[0]].sort().join("|");
        if (pairSeen.has(key)) continue;
        pairSeen.add(key);
        const hi = a[4] > b[4] ? a : b;
        const lo = hi === a ? b : a;
        const pair = [a, b].sort((x, y) => x[0].localeCompare(y[0]));
        push("Numbers", `Which city has the larger population — ${pair[0][0]} or ${pair[1][0]}?`, hi[0], [lo[0]],
          `${hi[0]}: roughly ${hi[4]} million; ${lo[0]}: roughly ${lo[4]} million.`);
      }
    }
  });
}

/* --- history: Time Lens events ------------------------------------- */
{
  const OFFSETS = [7, 12, 18, 26, 35, 47, 61];
  for (const ev of TIME_EVENTS) {
    const wrongs = new Set<number>();
    while (wrongs.size < 3) {
      const off = OFFSETS[Math.floor(rng() * OFFSETS.length)] * (rng() < 0.5 ? -1 : 1);
      const y = ev.year + off;
      if (y !== ev.year && !(ev.year > 0 && y <= 0)) wrongs.add(y);
    }
    push("History", `In which year: ${ev.label.toLowerCase()}?`, fmtYear(ev.year),
      [...wrongs].map(fmtYear));
  }
  for (let i = 0; i < TIME_EVENTS.length; i++) {
    for (let j = i + 1; j < TIME_EVENTS.length; j++) {
      const a = TIME_EVENTS[i];
      const b = TIME_EVENTS[j];
      if (Math.abs(a.year - b.year) < 25) continue;
      const first = a.year < b.year ? a : b;
      const later = first === a ? b : a;
      const pair = [a.label, b.label].sort();
      push("History", `Which happened first — “${pair[0]}” or “${pair[1]}”?`, first.label, [later.label],
        `${first.label} (${fmtYear(first.year)}) came before ${later.label.toLowerCase()} (${fmtYear(later.year)}).`);
    }
  }
}

/* --- numbers: Higher-or-Lower comparisons --------------------------- */
{
  for (const cat of COMPARISON_CATEGORIES) {
    for (let i = 0; i < cat.items.length; i++) {
      for (let j = i + 1; j < cat.items.length; j++) {
        const a = cat.items[i];
        const b = cat.items[j];
        const [lo, hi] = a.value < b.value ? [a, b] : [b, a];
        if (lo.value <= 0 || hi.value / lo.value < 1.35) continue;
        push("Numbers", `${cat.question} — ${a.name} or ${b.name}?`, hi.name, [lo.name],
          `${hi.name}: ${hi.value.toLocaleString()} ${cat.unit}; ${lo.name}: ${lo.value.toLocaleString()} ${cat.unit}.`);
      }
    }
  }
}

/* --- science: elements ---------------------------------------------- */
{
  for (const [name, symbol, num] of ELEMENTS) {
    const wrongSyms = pickN(ELEMENTS, 3, (e) => e[1] !== symbol).map((e) => e[1]);
    push("Science & Space", `What is the chemical symbol for ${name.toLowerCase()}?`, symbol, wrongSyms);
    const wrongNames = pickN(ELEMENTS, 3, (e) => e[0] !== name).map((e) => e[0]);
    push("Science & Space", `Which element has the symbol ${symbol}?`, name, wrongNames);
    if (num <= 30 || ["Silver", "Gold", "Mercury", "Lead", "Uranium", "Iron", "Copper"].includes(name)) {
      const wrongs = pickN(ELEMENTS, 3, (e) => e[2] !== num).map((e) => e[0]);
      push("Science & Space", `Which element has atomic number ${num}?`, name, wrongs);
    }
  }
}

/* --- arts & books ---------------------------------------------------- */
{
  const VERB: Record<ArtKind, string> = {
    novel: "wrote", play: "wrote", painting: "painted", composition: "composed", sculpture: "sculpted",
  };
  const PLURAL: Record<ArtKind, string> = {
    novel: "novels", play: "plays", painting: "paintings", composition: "works", sculpture: "sculptures",
  };
  ARTS.forEach(([work, creator, kind], i) => {
    const wrongCreators = [...new Set(
      pickN(ARTS, 8, (r) => r[2] === kind && r[1] !== creator).map((r) => r[1]),
    )].slice(0, 3);
    push("Arts & Books", `Who ${VERB[kind]} “${work}”?`, creator, wrongCreators);
    if (i % 2 === 0) {
      const wrongWorks = pickN(ARTS, 3, (r) => r[2] === kind && r[1] !== creator).map((r) => r[0]);
      push("Arts & Books", `Which of these ${PLURAL[kind]} is by ${creator}?`, work, wrongWorks);
    }
  });
}

/* --- food ------------------------------------------------------------ */
{
  DISHES.forEach(([dish, country], i) => {
    const wrongCountries = [...new Set(pickN(DISHES, 8, (d) => d[1] !== country).map((d) => d[1]))].slice(0, 3);
    push("Food & Drink", `Which country is ${dish} most associated with?`, country, wrongCountries);
    if (i % 2 === 0) {
      const wrongDishes = pickN(DISHES, 3, (d) => d[1] !== country);
      push("Food & Drink", `Which of these dishes comes from ${country}?`, dish, wrongDishes.map((d) => d[0]));
    }
  });
}

/* --- words ------------------------------------------------------------ */
{
  VOCAB.forEach(([word, meaning], i) => {
    const wrongMeanings = pickN(VOCAB, 3, (v) => v[0] !== word).map((v) => v[1]);
    push("Words", `What does “${word}” mean?`, meaning, wrongMeanings);
    if (i % 2 === 0) {
      const wrongWords = pickN(VOCAB, 3, (v) => v[0] !== word).map((v) => v[0]);
      push("Words", `Which word means “${meaning}”?`, word, wrongWords);
    }
  });
}

/* --- nature ----------------------------------------------------------- */
{
  for (const [animal, group] of COLLECTIVES) {
    const wrongs = pickN(COLLECTIVES, 3, (c) => c[1] !== group).map((c) => c[1]);
    push("Nature", `What is a group of ${animal} called?`, group, wrongs);
  }
  for (const [animal, baby] of BABIES) {
    const wrongs = pickN(BABIES, 3, (b) => b[1] !== baby).map((b) => b[1]);
    push("Nature", `What is a baby ${animal} called?`, baby, wrongs);
  }
  for (const [animal, cls] of ANIMAL_CLASS) {
    const wrongs = pickN(CLASS_POOL, 3, (c) => c !== cls);
    push("Nature", `A ${animal} belongs to which class of animals?`, cls, wrongs);
  }
}

/* --- curated ----------------------------------------------------------- */
for (const [topic, q, correct, w1, w2, w3, note] of CURATED) {
  push(topic, q, correct, [w1, w2, w3], note);
}

export const TRIVIA_QUESTIONS: readonly TriviaQuestion[] = QUESTIONS;
export const TRIVIA_COUNT = QUESTIONS.length;
