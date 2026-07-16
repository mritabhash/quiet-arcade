import { PLACES, type Place } from "./places";
import { buildMapDrop } from "./generated";
import { BORDERLINE_CURATED } from "./borderlinePlaces";

/**
 * The full Map Drop puzzle database: the original hidden places plus a
 * much larger atlas of cities, islands, regions, river towns, and
 * landmarks. Daily puzzles are picked date-deterministically from this
 * list; free play draws from it endlessly (skipping recent rounds).
 *
 * Hints stay short (3–8 words) and evidence-based — weather, food,
 * script, festivals, terrain — never people's appearance.
 */

export type MapDifficulty = "Gentle" | "Medium" | "Tricky";

export interface MapDropPuzzle extends Place {
  continent: string;
  region: string;
  climate: string;
  difficulty: MapDifficulty;
  /** what the player is hunting: city, country, state, island, landmark, … */
  kind: string;
}

/** metadata for the original places in ./places.ts */
const LEGACY_META: Record<string, [string, string, string, MapDifficulty]> = {
  kolkata: ["Asia", "South Asia", "tropical", "Medium"],
  tokyo: ["Asia", "East Asia", "temperate", "Gentle"],
  cairo: ["Africa", "North Africa", "desert", "Gentle"],
  sylhet: ["Asia", "South Asia", "tropical", "Tricky"],
  kyoto: ["Asia", "East Asia", "temperate", "Medium"],
  venice: ["Europe", "Southern Europe", "temperate", "Gentle"],
  rio: ["South America", "Brazil", "tropical", "Gentle"],
  hanoi: ["Asia", "Southeast Asia", "subtropical", "Medium"],
  marrakesh: ["Africa", "North Africa", "arid", "Medium"],
  cusco: ["South America", "Andes", "highland", "Medium"],
  tbilisi: ["Asia", "Caucasus", "temperate", "Tricky"],
  "luang-prabang": ["Asia", "Southeast Asia", "tropical", "Tricky"],
  cartagena: ["South America", "Caribbean coast", "tropical", "Medium"],
  jodhpur: ["Asia", "South Asia", "desert", "Medium"],
  bishkek: ["Asia", "Central Asia", "continental", "Tricky"],
  asmara: ["Africa", "Horn of Africa", "highland", "Tricky"],
  paramaribo: ["South America", "Guianas", "equatorial", "Tricky"],
  ohrid: ["Europe", "Balkans", "mediterranean", "Tricky"],
};

const LEGACY: MapDropPuzzle[] = PLACES.map((p) => {
  const [continent, region, climate, difficulty] = LEGACY_META[p.id] ?? [
    "—",
    "—",
    "temperate",
    "Medium",
  ];
  return { ...p, continent, region, climate, difficulty, kind: "city" };
});

/** curated entries that are not cities */
const CURATED_KIND: Record<string, string> = {
  petra: "landmark",
  santorini: "island",
  zanzibar: "island",
  lofoten: "island",
  cappadocia: "region",
};

function m(
  id: string,
  name: string,
  country: string,
  continent: string,
  region: string,
  climate: string,
  difficulty: MapDifficulty,
  lat: number,
  lon: number,
  hints: [string, string, string, string, string, string, string],
  why: string,
): MapDropPuzzle {
  return { id, name, country, continent, region, climate, difficulty, lat, lon, hints, why, kind: CURATED_KIND[id] ?? "city" };
}

const NEW_PLACES: MapDropPuzzle[] = [
  m("buenos-aires", "Buenos Aires", "Argentina", "South America", "Río de la Plata", "temperate", "Gentle", -34.6, -58.38,
    ["January is hot; July feels European", "Grilled beef is a weekly ritual", "Cafés take melancholy seriously", "Spanish with an Italian melody", "Tango spills from old dance halls", "Football and poetry both matter here", "A vast brown river estuary nearby"],
    "Tango, asado, and that Italian-accented Spanish belong to Buenos Aires."),
  m("istanbul", "Istanbul", "Türkiye", "Asia", "Anatolia & Thrace", "mediterranean", "Gentle", 41.01, 28.98,
    ["Mild, rainy winters; warm summers", "Tea arrives in tulip glasses", "Ferries are part of commuting", "Simit sellers on every corner", "Calls to prayer echo over water", "Grand domes face each other", "A strait splits two continents"],
    "Only one city sits on two continents with ferries as buses — Istanbul."),
  m("mexico-city", "Mexico City", "Mexico", "North America", "Central Mexico", "highland", "Gentle", 19.43, -99.13,
    ["High altitude keeps evenings cool", "Tacos al pastor spin on corners", "Bright murals cover public walls", "Spanish with Nahuatl place names", "A sunken Aztec temple downtown", "Mariachis gather in one plaza", "Two volcanoes watch the valley"],
    "An Aztec temple under a colonial centre at 2,200 m — Mexico City."),
  m("cape-town", "Cape Town", "South Africa", "Africa", "Western Cape", "mediterranean", "Gentle", -33.92, 18.42,
    ["Dry summers, wet blustery winters", "Braai smoke on weekend afternoons", "Eleven official languages share signs", "Penguins live on a nearby beach", "Vineyards climb the mountainsides", "A flat-topped mountain looms overhead", "Two oceans meet down the coast"],
    "The flat mountain over a harbour of penguins and vineyards is Cape Town."),
  m("mumbai", "Mumbai", "India", "Asia", "South Asia", "tropical", "Medium", 19.08, 72.88,
    ["Monsoon floods arrive each June", "Vada pav is the street king", "Suburban trains carry millions daily", "Film posters tower over junctions", "Colonial Gothic beside glass towers", "Dabbawalas deliver lunch precisely", "A sea-facing promenade curves south"],
    "Lunchbox couriers, film hoardings, and Marine Drive — Mumbai."),
  m("seoul", "Seoul", "South Korea", "Asia", "East Asia", "continental", "Medium", 37.57, 126.98,
    ["Freezing winters, humid summers", "Kimchi with every single meal", "Cafés stay open past midnight", "A featherlight alphabet of circles", "Palace guards change in bright robes", "Mountains rise inside the city", "A river split by many bridges"],
    "Hangul, palace guards, and mountains inside the city point to Seoul."),
  m("lisbon", "Lisbon", "Portugal", "Europe", "Iberia", "mediterranean", "Gentle", 38.72, -9.14,
    ["Atlantic light, mild all year", "Custard tarts dusted with cinnamon", "Trams groan up steep hills", "Azulejo tiles cover whole façades", "Melancholy songs drift from taverns", "A red bridge spans the river", "Seven hills face a wide estuary"],
    "Fado, tiles, and tram 28 climbing seven hills — Lisbon."),
  m("edinburgh", "Edinburgh", "United Kingdom", "Europe", "Scotland", "oceanic", "Medium", 55.95, -3.19,
    ["Four seasons in one afternoon", "Shortbread and strong tea", "Bagpipes echo down stone closes", "A castle sits on a crag", "An arts festival swallows August", "Extinct volcano in the city", "Firth winds off the North Sea"],
    "A crag-top castle and festival August say Edinburgh."),
  m("prague", "Prague", "Czechia", "Europe", "Central Europe", "continental", "Gentle", 50.08, 14.44,
    ["Snow dusts spires in January", "Beer is cheaper than water", "An astronomical clock draws crowds", "Czech has accents like háčeks", "A statue-lined medieval bridge", "Red roofs below a castle hill", "A river bends through the centre"],
    "The clock, the bridge, and hundred spires — Prague."),
  m("havana", "Havana", "Cuba", "North America", "Caribbean", "tropical", "Medium", 23.11, -82.37,
    ["Hurricane season shapes the calendar", "Rum and strong sweet coffee", "Vintage cars still run daily", "Faded pastel colonial façades", "Son music floats from doorways", "A long seawall takes the waves", "Cigar leaf dries in the countryside"],
    "The Malecón, old Chevrolets, and son cubano — Havana."),
  m("new-orleans", "New Orleans", "United States", "North America", "Gulf Coast", "subtropical", "Medium", 29.95, -90.07,
    ["Humid heat and sudden downpours", "Gumbo and powdered-sugar beignets", "Brass bands parade for funerals", "French street names, Creole flavours", "Wrought-iron balconies drip ferns", "The city sits below river level", "A great river's final crescent"],
    "Brass, beignets, and the Mississippi's crescent — New Orleans."),
  m("varanasi", "Varanasi", "India", "Asia", "South Asia", "subtropical", "Medium", 25.32, 83.01,
    ["Scorching before the monsoon", "Lassi served in clay cups", "Bells ring before sunrise", "Sanskrit chants over loudspeakers", "Stone steps descend to water", "Fires burn at the ghats", "A sacred river flows north here"],
    "Ghats, dawn bells, and the northward Ganga bend — Varanasi."),
  m("samarkand", "Samarkand", "Uzbekistan", "Asia", "Central Asia", "arid", "Tricky", 39.65, 66.97,
    ["Baking summers, crisp winters", "Plov cooked in giant cauldrons", "Melons stacked at bazaars", "Uzbek in Latin, Russian in Cyrillic", "Turquoise domes and tiled portals", "A Silk Road crossroads for centuries", "Registan means 'sandy place'"],
    "Three tiled madrasas around one square — Samarkand's Registan."),
  m("petra", "Petra", "Jordan", "Asia", "Middle East", "desert", "Medium", 30.33, 35.44,
    ["Desert days, cold desert nights", "Bedouin tea brewed on coals", "You enter through a narrow gorge", "Arabic inscriptions in rock", "Camels rest by carved columns", "A treasury façade cut from cliffs", "A rose-red city, half as old as time"],
    "A carved rose-red façade at the end of a gorge — Petra."),
  m("santorini", "Santorini", "Greece", "Europe", "Aegean", "mediterranean", "Gentle", 36.39, 25.46,
    ["Dry, bright, windy summers", "Fava and grilled octopus", "Donkeys climb the cliff paths", "Greek letters on chapel doors", "Blue domes over white walls", "The island rims a drowned volcano", "Sunsets draw applauding crowds"],
    "White walls and blue domes on a caldera rim — Santorini."),
  m("zanzibar", "Zanzibar", "Tanzania", "Africa", "Swahili Coast", "tropical", "Medium", -6.16, 39.19,
    ["Hot with two rainy seasons", "Clove and cinnamon scent the air", "Dhows sail on the evening tide", "Swahili with Arabic loanwords", "Carved wooden doors with brass studs", "A spice island off East Africa", "Stone Town's maze of alleys"],
    "Spices, dhows, and Stone Town's carved doors — Zanzibar."),
  m("ubud", "Ubud, Bali", "Indonesia", "Asia", "Southeast Asia", "tropical", "Medium", -8.51, 115.26,
    ["Warm and green all year", "Rice with sambal at warungs", "Offerings of flowers on doorsteps", "Gamelan rehearsals drift at dusk", "Terraced paddies climb the hills", "Temples at every crossroads", "An island of a thousand shrines"],
    "Daily offerings and terraced paddies — Bali's cultural heart, Ubud."),
  m("queenstown", "Queenstown", "New Zealand", "Oceania", "South Island", "oceanic", "Tricky", -45.03, 168.66,
    ["Crisp air, snow on far peaks", "Flat whites and lamb pies", "People jump off bridges for fun", "English with a rising lilt", "A steamship crosses the lake", "Jagged range called The Remarkables", "Fiords carve the coast nearby"],
    "Bungee bridges under The Remarkables — Queenstown."),
  m("lofoten", "Lofoten Islands", "Norway", "Europe", "Arctic Norway", "subarctic", "Tricky", 68.15, 13.6,
    ["Midnight sun, then winter darkness", "Cod dries on wooden racks", "Red cabins stand on stilts", "Norwegian with northern dialects", "Sea eagles patrol the fjords", "Sharp peaks rise from the sea", "Northern lights on clear nights"],
    "Stockfish racks and red rorbuer under sharp peaks — Lofoten."),
  m("addis-ababa", "Addis Ababa", "Ethiopia", "Africa", "Horn of Africa", "highland", "Tricky", 9.02, 38.75,
    ["Cool highland air at 2,300 m", "Injera under every stew", "Coffee ceremonies burn incense", "A script of stacked syllables", "Runners train on hill roads", "Its own 13-month calendar", "Africa's diplomatic capital"],
    "Injera, Ge'ez script, and the 13-month calendar — Addis Ababa."),
  m("beirut", "Beirut", "Lebanon", "Asia", "Levant", "mediterranean", "Tricky", 33.89, 35.5,
    ["Swim mornings, ski afternoons", "Mezze tables that never end", "French, Arabic, English mid-sentence", "Cedar trees on the flag", "A corniche full of evening walkers", "Roman ruins beside new towers", "Mountains drop straight to the sea"],
    "Cedars, trilingual chatter, and sea-to-ski — Beirut."),
  m("isfahan", "Isfahan", "Iran", "Asia", "Middle East", "arid", "Tricky", 32.65, 51.67,
    ["Dry plateau days, cool nights", "Saffron ice cream between wafers", "Carpet weavers work in bazaars", "Nastaliq calligraphy flows on walls", "Bridges built for gathering, not crossing", "Blue-tiled domes mirror the sky", "'Half the world' in one square"],
    "Khaju bridge songs and blue tile — Isfahan, nesf-e jahān."),
  m("lhasa", "Lhasa", "China", "Asia", "Tibetan Plateau", "highland", "Tricky", 29.65, 91.14,
    ["Thin air at 3,650 metres", "Butter tea against the cold", "Prayer wheels spin clockwise", "Prayer flags snap on passes", "Pilgrims circle a golden-roofed temple", "A white-and-red palace on a hill", "The plateau roof of the world"],
    "The Potala's white walls above pilgrim circuits — Lhasa."),
  m("ulaanbaatar", "Ulaanbaatar", "Mongolia", "Asia", "Central Asia", "continental", "Tricky", 47.89, 106.91,
    ["The world's coldest capital", "Salted milk tea and mutton", "Gers ring the city's edges", "Cyrillic now, vertical script returning", "Wrestling, archery, horse racing festival", "Steppe begins where streets end", "Between Siberia and the Gobi"],
    "Ger districts and Naadam on the steppe — Ulaanbaatar."),
  m("almaty", "Almaty", "Kazakhstan", "Asia", "Central Asia", "continental", "Tricky", 43.24, 76.89,
    ["Hot summers under snowy peaks", "Apples were born near here", "Beshbarmak at long tables", "Kazakh and Russian share signs", "A high-altitude skating rink", "Tian Shan walls the south", "The old capital, still the biggest"],
    "Wild-apple foothills below the Tian Shan — Almaty."),
  m("yerevan", "Yerevan", "Armenia", "Asia", "Caucasus", "continental", "Tricky", 40.18, 44.51,
    ["Baking summers, snowy winters", "Apricots claim origin here", "Lavash bakes on oven walls", "An alphabet invented in 405 AD", "Pink volcanic stone buildings", "A snow cone floats on the horizon", "One of the oldest cities anywhere"],
    "Pink tuff streets facing Ararat — Yerevan."),
  m("baku", "Baku", "Azerbaijan", "Asia", "Caucasus", "arid", "Tricky", 40.41, 49.87,
    ["Famously windy, mild winters", "Tea with jam, not sugar", "Pomegranates in every market", "Azerbaijani in Latin letters", "Flame-shaped towers light up", "A walled old city by the shore", "Oil derricks in a landlocked sea"],
    "Flame Towers over the Caspian — Baku, city of winds."),
  m("kathmandu", "Kathmandu", "Nepal", "Asia", "South Asia", "highland", "Medium", 27.7, 85.32,
    ["Clear mountain views after monsoon", "Momos steam in tiny shops", "Prayer flags cross the alleys", "Devanagari on shop shutters", "A monkey temple watches the valley", "Pagodas in brick squares", "Gateway to the highest peaks"],
    "Stupas, pagodas, and Himalayan gateways — Kathmandu."),
  m("galle", "Galle", "Sri Lanka", "Asia", "South Asia", "tropical", "Tricky", 6.03, 80.22,
    ["Warm sea air year-round", "Rice and curry with sambol", "Stilt fishermen balance offshore", "Sinhala's rounded letters on signs", "Cricket matches by old ramparts", "A Dutch fort juts into the ocean", "Cinnamon country inland"],
    "A Dutch fort on a cricket-loving spice coast — Galle."),
  m("chiang-mai", "Chiang Mai", "Thailand", "Asia", "Southeast Asia", "tropical", "Medium", 18.79, 98.98,
    ["Cool season draws everyone north", "Khao soi noodles with pickles", "Saffron robes at dawn alms", "Looping Thai script on temples", "A moat squares the old town", "Lanterns rise each November", "Mountain temples above the city"],
    "Khao soi and lantern festivals in a moated old town — Chiang Mai."),
  m("penang", "George Town, Penang", "Malaysia", "Asia", "Southeast Asia", "equatorial", "Tricky", 5.41, 100.34,
    ["Hot, humid, brief fierce storms", "Char kway teow from hawker woks", "Shophouses in faded pastels", "Malay, Chinese, Tamil, English signs", "Street art hides in alleys", "Clan jetties stretch over water", "An island food capital"],
    "Hawker legends and clan jetties — George Town, Penang."),
  m("taipei", "Taipei", "Taiwan", "Asia", "East Asia", "subtropical", "Medium", 25.03, 121.57,
    ["Muggy summers, drizzly winters", "Beef noodle soup contests", "Night markets rule the evenings", "Traditional characters, not simplified", "Scooters wait in painted boxes", "A green tower like stacked boxes", "Hot springs in the northern hills"],
    "Night markets under Taipei 101 — Taipei."),
  m("hong-kong", "Hong Kong", "China", "Asia", "East Asia", "subtropical", "Gentle", 22.32, 114.17,
    ["Humid heat, typhoon warnings", "Dim sum carts still roll", "Double-decker trams rattle past", "Cantonese and English street names", "Bamboo scaffolds climb towers", "A star-named ferry crosses nightly", "Peaks rise straight from harbour"],
    "Bamboo scaffolding and the Star Ferry — Hong Kong."),
  m("shanghai", "Shanghai", "China", "Asia", "East Asia", "subtropical", "Medium", 31.23, 121.47,
    ["Sticky summers, damp chilly winters", "Soup dumplings eaten carefully", "The metro map keeps growing", "Simplified characters, neon gradients", "Art Deco banks face rocket towers", "Old lane houses called lòngtáng", "A bend in a muddy river"],
    "Art Deco Bund facing Pudong's towers — Shanghai."),
  m("dubai", "Dubai", "United Arab Emirates", "Asia", "Arabian Peninsula", "desert", "Gentle", 25.2, 55.27,
    ["Summer heat empties the streets", "Karak tea at every corner", "Abras cross a busy creek", "Arabic and English everywhere", "Gold souk windows blaze", "The world's tallest needle", "Dunes twenty minutes away"],
    "Creek abras below the Burj — Dubai."),
  m("muscat", "Muscat", "Oman", "Asia", "Arabian Peninsula", "desert", "Tricky", 23.59, 58.41,
    ["Hot, but sea breezes help", "Dates and cardamom coffee first", "Frankincense smoke in souks", "Arabic in elegant white-on-blue", "Low white buildings by law", "Rocky mountains meet the gulf", "Dhow harbours and old forts"],
    "Frankincense, white low-rise calm, and harbour forts — Muscat."),
  m("salvador", "Salvador", "Brazil", "South America", "Bahia", "tropical", "Medium", -12.97, -38.5,
    ["Warm Atlantic air all year", "Acarajé fried in dendê oil", "Drum parades shake the streets", "Portuguese with African rhythms", "Pastel mansions on steep hills", "Ribbons tied at church gates", "An elevator links two city levels"],
    "Acarajé, olodum drums, and the Lacerda lift — Salvador."),
  m("quito", "Quito", "Ecuador", "South America", "Andes", "highland", "Medium", -0.18, -78.47,
    ["Spring-like days, cold nights", "Roast corn with fresh cheese", "The sun sets at six, always", "Spanish with Kichwa words", "A winged virgin on a hill", "You can stand on the equator", "A volcano looms over rooftops"],
    "Equator monuments under Pichincha — Quito."),
  m("la-paz", "La Paz", "Bolivia", "South America", "Andes", "highland", "Medium", -16.5, -68.15,
    ["Breathless at 3,600 metres", "Salteñas leak sweet-spicy juice", "Cable cars are public transit", "Aymara and Spanish mix", "Bowler hats and layered skirts", "A witches' market sells offerings", "The city fills a canyon"],
    "Cable cars over a canyon city — La Paz."),
  m("montevideo", "Montevideo", "Uruguay", "South America", "Río de la Plata", "temperate", "Tricky", -34.9, -56.16,
    ["Mild, breezy, four seasons", "Mate thermoses under every arm", "A beach promenade rings the city", "Spanish, calm and unhurried", "Candombe drums on Sundays", "Old town gates still stand", "Across the water from a bigger rival"],
    "Mate on the rambla, candombe Sundays — Montevideo."),
  m("oaxaca", "Oaxaca", "Mexico", "North America", "Southern Mexico", "highland", "Medium", 17.07, -96.72,
    ["Warm days, cool mountain nights", "Seven famous mole sauces", "Mezcal from roadside palenques", "Zapotec heard in the markets", "Radish-carving contests in December", "Green stone colonial arcades", "Day of the Dead glows here"],
    "Mole, mezcal, and marigold altars — Oaxaca."),
  m("vancouver", "Vancouver", "Canada", "North America", "Pacific Northwest", "oceanic", "Medium", 49.28, -123.12,
    ["Rain, then perfect mountain days", "Sushi as common as coffee", "Seaplanes land downtown", "English and Cantonese and Punjabi", "A forest park bigger than downtown", "Ski hills visible from the beach", "Totem poles by the seawall"],
    "Seaplanes, seawall, and ski hills over the beach — Vancouver."),
  m("montreal", "Montreal", "Canada", "North America", "Quebec", "continental", "Medium", 45.5, -73.57,
    ["Deep snow, jazzy humid summers", "Bagels boiled in honey water", "Poutine at 3 a.m.", "French first on every sign", "Spiral staircases climb outside", "An underground city for winter", "An island in a great river"],
    "Bagels, poutine, and française signage on an island — Montreal."),
  m("reykjavik", "Reykjavik", "Iceland", "Europe", "North Atlantic", "subarctic", "Gentle", 64.15, -21.94,
    ["Summer nights never darken", "Fermented shark for the brave", "Pools are the town squares", "A language little changed in centuries", "Corrugated houses in bright paint", "Steam rises from the ground", "A church like a basalt ridge"],
    "Geothermal pools and Hallgrímskirkja — Reykjavik."),
  m("helsinki", "Helsinki", "Finland", "Europe", "Nordics", "continental", "Tricky", 60.17, 24.94,
    ["Sea ice in hard winters", "Cinnamon buns with coffee, often", "Saunas outnumber cars", "A language unrelated to neighbours", "Trams glide past granite churches", "Islands dot the harbour", "Design shops on every block"],
    "Sauna culture and archipelago trams — Helsinki."),
  m("dubrovnik", "Dubrovnik", "Croatia", "Europe", "Adriatic", "mediterranean", "Gentle", 42.65, 18.09,
    ["Bright Adriatic summers", "Grilled fish and black risotto", "Marble streets polished by feet", "Croatian's č and ž on menus", "You can walk the full walls", "Orange roofs beneath a fortress", "A pearl of the Adriatic"],
    "Complete medieval walls over orange roofs — Dubrovnik."),
  m("seville", "Seville", "Spain", "Europe", "Andalusia", "mediterranean", "Gentle", 37.39, -5.99,
    ["Europe's hottest summers", "Tapas standing at the bar", "Orange trees line the streets", "Flamenco stamps from courtyards", "A cathedral with a minaret tower", "Easter processions in hoods", "A river once ruled the Americas"],
    "Orange trees, flamenco, and the Giralda — Seville."),
  m("fez", "Fez", "Morocco", "Africa", "North Africa", "mediterranean", "Medium", 34.03, -5.0,
    ["Hot days, cool medina shade", "B'stilla: sweet and savoury pie", "Donkeys carry goods in alleys", "Arabic calligraphy over old gates", "Tanneries dye leather in pits", "The world's oldest university", "A medina of 9,000 lanes"],
    "Dye pits and the labyrinth medina — Fez."),
  m("dakar", "Dakar", "Senegal", "Africa", "West Africa", "arid", "Tricky", 14.72, -17.47,
    ["Dry heat cooled by trade winds", "Thieboudienne: rice and fish", "Wrestling is the biggest sport", "French and Wolof share the air", "Bright pirogues line the beaches", "A giant bronze statue faces the sea", "Africa's westernmost point"],
    "Pirogues and laamb wrestling at the continent's tip — Dakar."),
  m("accra", "Accra", "Ghana", "Africa", "West Africa", "tropical", "Tricky", 5.56, -0.2,
    ["Warm with sea breezes", "Jollof rice sparks friendly wars", "Kente cloth at celebrations", "English with Twi expressions", "Coffins carved as fish and planes", "Highlife music from open bars", "A star-marked independence square"],
    "Fantasy coffins and highlife by Black Star Square — Accra."),
  m("nairobi", "Nairobi", "Kenya", "Africa", "East Africa", "highland", "Medium", -1.29, 36.82,
    ["Mile-high, never too hot", "Nyama choma weekends", "Matatus painted like arcades", "Swahili and English swap mid-sentence", "Giraffes at the city's edge", "A national park with a skyline view", "East Africa's green capital"],
    "Lions with skyscraper backdrops — Nairobi."),
  m("antananarivo", "Antananarivo", "Madagascar", "Africa", "Indian Ocean", "highland", "Tricky", -18.88, 47.51,
    ["Highland cool on a tropical island", "Rice at every meal, twice", "Zebu carts share the roads", "Malagasy sounds Malay, not African", "Rice terraces climb the hills", "Baobabs grow down the coast", "Lemurs live nowhere else"],
    "Highland rice terraces on lemur island — Antananarivo."),
  m("suva", "Suva", "Fiji", "Oceania", "Melanesia", "tropical", "Tricky", -18.14, 178.44,
    ["Warm and very rainy", "Kava shared from one bowl", "Rugby is close to religion", "Fijian, Hindi, and English signs", "Sulu skirts as office wear", "Markets piled with taro", "A harbour on the wet side"],
    "Kava bowls and rugby fervour — Suva, Fiji."),
  m("honolulu", "Honolulu", "United States", "Oceania", "Hawaiian Islands", "tropical", "Gentle", 21.31, -157.86,
    ["Warm trade winds, brief showers", "Poke bowls and plate lunch", "Surfboards on every car", "Hawaiian words in daily speech", "A famous crater by the beach", "Leis given at arrivals", "The most isolated big city"],
    "Diamond Head over Waikīkī — Honolulu."),
  m("manaus", "Manaus", "Brazil", "South America", "Amazonia", "equatorial", "Tricky", -3.12, -60.02,
    ["Equatorial heat, daily storms", "Açaí eaten as a meal", "Boats are the highways", "Portuguese deep in the forest", "Two rivers meet, unmixed", "An opera house from rubber wealth", "Jungle in every direction"],
    "An opera house where black and sandy waters meet — Manaus."),
  m("cappadocia", "Cappadocia", "Türkiye", "Asia", "Anatolia", "continental", "Medium", 38.64, 34.83,
    ["Hot dry days, chilly nights", "Pottery kebabs cracked open", "Homes carved into soft rock", "Turkish signs, fairy-tale valleys", "Balloons fill the dawn sky", "Underground cities go ten floors", "Stone chimneys shaped by wind"],
    "Dawn balloons over fairy chimneys — Cappadocia."),
];

/** hand-written tier */
const CURATED: MapDropPuzzle[] = [...LEGACY, ...NEW_PLACES];

/** City rounds with curated coordinates/articles, used by the live photo mode. */
export const MAP_DROP_PHOTO_PUZZLES: MapDropPuzzle[] = CURATED.filter(
  (puzzle) => puzzle.kind === "city",
);

/**
 * Current selector coverage-checked cities for fixed Moderate versus matches.
 * Keeping this explicit prevents a thin generated location from trapping both
 * players; broader solo photo rounds can still use every curated city.
 */
const VERIFIED_PHOTO_CITY_IDS = new Set([
  "asmara",
  "cairo",
  "cape-town",
  "lisbon",
  "mumbai",
  "paramaribo",
  "rio",
]);

export const MAP_DROP_VERIFIED_PHOTO_PUZZLES: MapDropPuzzle[] =
  MAP_DROP_PHOTO_PUZZLES.filter((puzzle) => VERIFIED_PHOTO_CITY_IDS.has(puzzle.id));

/** curated + generated gazetteer tier (1000+ hidden places) */
export const MAP_DROP_PUZZLES: MapDropPuzzle[] = [
  ...CURATED,
  ...buildMapDrop(BORDERLINE_CURATED, new Set(CURATED.map((p) => p.name.toLowerCase()))),
];
