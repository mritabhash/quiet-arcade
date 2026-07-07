/**
 * Borderline place database. Every entry is guessable; hidden answers are
 * drawn from the same pool. The metadata drives the feedback chips:
 * distance, direction, continent, borders, climate (avg temp), population,
 * coastline, terrain, and language/cultural region — plus flag-colour
 * overlap for countries.
 */

import { buildBorderline } from "./generated";

export type BorderKind =
  | "country" | "city" | "state" | "island" | "region"
  | "river" | "lake" | "range" | "landmark";
export type BorderDifficulty = "Gentle" | "Medium" | "Tricky";

export interface BorderlinePlace {
  id: string;
  name: string;
  kind: BorderKind;
  /** containing country; equals name for countries */
  country: string;
  continent: string;
  region: string;
  lat: number;
  lon: number;
  /** population in millions */
  pop: number;
  /** rough annual average temperature, °C */
  temp: number;
  terrain: string;
  coastal: boolean;
  /** language / cultural region label */
  lang: string;
  /** names of bordering places (countries or neighbours) */
  borders: string[];
  /** dominant flag colours, for country answers */
  flag?: string[];
  difficulty: BorderDifficulty;
  /** one-line reveal note */
  note: string;
}

function b(
  id: string, name: string, kind: BorderKind, country: string, continent: string,
  region: string, lat: number, lon: number, pop: number, temp: number,
  terrain: string, coastal: boolean, lang: string, borders: string[],
  difficulty: BorderDifficulty, note: string, flag?: string[],
): BorderlinePlace {
  return { id, name, kind, country, continent, region, lat, lon, pop, temp, terrain, coastal, lang, borders, flag, difficulty, note };
}

const CURATED: BorderlinePlace[] = [
  /* ------------------------------------------------ countries: Asia */
  b("nepal", "Nepal", "country", "Nepal", "Asia", "South Asia", 28.4, 84.1, 30, 12, "mountainous", false, "South Asian", ["India", "China"], "Medium", "A Himalayan kingdom-turned-republic wedged between two giants.", ["red", "blue", "white"]),
  b("india", "India", "country", "India", "Asia", "South Asia", 22.4, 79.0, 1430, 24, "varied", true, "South Asian", ["Pakistan", "China", "Nepal", "Bhutan", "Bangladesh", "Myanmar"], "Gentle", "The world's most populous country.", ["orange", "white", "green", "blue"]),
  b("bhutan", "Bhutan", "country", "Bhutan", "Asia", "South Asia", 27.5, 90.4, 0.8, 10, "mountainous", false, "South Asian", ["India", "China"], "Tricky", "Measures Gross National Happiness in the eastern Himalaya.", ["yellow", "orange", "white"]),
  b("bangladesh", "Bangladesh", "country", "Bangladesh", "Asia", "South Asia", 23.7, 90.4, 173, 26, "delta plains", true, "South Asian", ["India", "Myanmar"], "Gentle", "A vast river delta of Bengali speakers.", ["green", "red"]),
  b("pakistan", "Pakistan", "country", "Pakistan", "Asia", "South Asia", 30.4, 69.3, 240, 22, "varied", true, "South Asian", ["India", "Afghanistan", "Iran", "China"], "Gentle", "From Karakoram peaks to the Indus delta.", ["green", "white"]),
  b("sri-lanka", "Sri Lanka", "country", "Sri Lanka", "Asia", "South Asia", 7.9, 80.8, 22, 27, "island hills", true, "South Asian", [], "Medium", "A teardrop island of tea and cricket.", ["orange", "green", "yellow", "red"]),
  b("china", "China", "country", "China", "Asia", "East Asia", 35.9, 104.2, 1410, 14, "varied", true, "East Asian", ["Russia", "Mongolia", "Kazakhstan", "India", "Nepal", "Bhutan", "Myanmar", "Laos", "Vietnam", "Pakistan", "North Korea"], "Gentle", "The Middle Kingdom.", ["red", "yellow"]),
  b("japan", "Japan", "country", "Japan", "Asia", "East Asia", 36.2, 138.3, 124, 15, "island mountains", true, "East Asian", [], "Gentle", "An archipelago of islands and precision.", ["white", "red"]),
  b("south-korea", "South Korea", "country", "South Korea", "Asia", "East Asia", 36.5, 127.9, 52, 13, "hilly", true, "East Asian", ["North Korea"], "Gentle", "Hangul, K-dramas, and kimchi.", ["white", "red", "blue", "black"]),
  b("north-korea", "North Korea", "country", "North Korea", "Asia", "East Asia", 40.3, 127.0, 26, 10, "mountainous", true, "East Asian", ["South Korea", "China", "Russia"], "Medium", "The hermit kingdom above the 38th parallel.", ["red", "blue", "white"]),
  b("mongolia", "Mongolia", "country", "Mongolia", "Asia", "Central Asia", 46.9, 103.8, 3.4, 0, "steppe", false, "Central Asian", ["Russia", "China"], "Medium", "The land of Chinggis Khan and endless steppe.", ["red", "blue", "yellow"]),
  b("vietnam", "Vietnam", "country", "Vietnam", "Asia", "Southeast Asia", 14.1, 108.3, 100, 24, "coastal mountains", true, "Southeast Asian", ["China", "Laos", "Cambodia"], "Gentle", "An S-shaped coast from Hanoi to the Mekong.", ["red", "yellow"]),
  b("thailand", "Thailand", "country", "Thailand", "Asia", "Southeast Asia", 15.1, 101.0, 72, 27, "plains and hills", true, "Southeast Asian", ["Myanmar", "Laos", "Cambodia", "Malaysia"], "Gentle", "The never-colonised kingdom of Southeast Asia.", ["red", "white", "blue"]),
  b("laos", "Laos", "country", "Laos", "Asia", "Southeast Asia", 18.2, 103.9, 7.6, 24, "forested mountains", false, "Southeast Asian", ["Thailand", "Vietnam", "Cambodia", "China", "Myanmar"], "Tricky", "Southeast Asia's only landlocked country.", ["red", "blue", "white"]),
  b("cambodia", "Cambodia", "country", "Cambodia", "Asia", "Southeast Asia", 12.6, 105.0, 17, 27, "plains", true, "Southeast Asian", ["Thailand", "Laos", "Vietnam"], "Medium", "Home of Angkor's temple towers.", ["red", "blue", "white"]),
  b("myanmar", "Myanmar", "country", "Myanmar", "Asia", "Southeast Asia", 21.9, 96.0, 54, 25, "river valleys", true, "Southeast Asian", ["India", "Bangladesh", "China", "Laos", "Thailand"], "Medium", "Golden pagodas along the Irrawaddy.", ["yellow", "green", "red", "white"]),
  b("indonesia", "Indonesia", "country", "Indonesia", "Asia", "Southeast Asia", -2.5, 118.0, 278, 27, "volcanic islands", true, "Southeast Asian", ["Malaysia", "Papua New Guinea"], "Gentle", "Seventeen thousand islands on the equator.", ["red", "white"]),
  b("malaysia", "Malaysia", "country", "Malaysia", "Asia", "Southeast Asia", 4.1, 109.5, 34, 27, "rainforest", true, "Southeast Asian", ["Thailand", "Indonesia", "Singapore"], "Medium", "Split across a peninsula and Borneo.", ["red", "white", "blue", "yellow"]),
  b("philippines", "Philippines", "country", "Philippines", "Asia", "Southeast Asia", 12.9, 121.8, 117, 27, "volcanic islands", true, "Southeast Asian", [], "Gentle", "Seven thousand islands of jeepneys and karaoke.", ["blue", "red", "white", "yellow"]),
  b("kazakhstan", "Kazakhstan", "country", "Kazakhstan", "Asia", "Central Asia", 48.0, 66.9, 20, 6, "steppe", false, "Central Asian", ["Russia", "China", "Kyrgyzstan", "Uzbekistan", "Turkmenistan"], "Medium", "The world's largest landlocked country.", ["blue", "yellow"]),
  b("uzbekistan", "Uzbekistan", "country", "Uzbekistan", "Asia", "Central Asia", 41.4, 64.6, 36, 14, "desert and oases", false, "Central Asian", ["Kazakhstan", "Kyrgyzstan", "Tajikistan", "Afghanistan", "Turkmenistan"], "Tricky", "Doubly landlocked, with Silk Road cities.", ["blue", "white", "green"]),
  b("kyrgyzstan", "Kyrgyzstan", "country", "Kyrgyzstan", "Asia", "Central Asia", 41.2, 74.8, 7, 5, "mountainous", false, "Central Asian", ["Kazakhstan", "Uzbekistan", "Tajikistan", "China"], "Tricky", "Nomad yurts under the Tian Shan.", ["red", "yellow"]),
  b("afghanistan", "Afghanistan", "country", "Afghanistan", "Asia", "Central Asia", 33.9, 67.7, 41, 13, "mountainous", false, "Central Asian", ["Pakistan", "Iran", "Turkmenistan", "Uzbekistan", "Tajikistan", "China"], "Medium", "The Hindu Kush crossroads.", ["black", "red", "green", "white"]),
  b("iran", "Iran", "country", "Iran", "Asia", "Middle East", 32.4, 53.7, 89, 17, "plateau", true, "Persian", ["Iraq", "Türkiye", "Armenia", "Azerbaijan", "Turkmenistan", "Afghanistan", "Pakistan"], "Medium", "The Persian plateau of poetry and tiles.", ["green", "white", "red"]),
  b("iraq", "Iraq", "country", "Iraq", "Asia", "Middle East", 33.2, 43.7, 45, 22, "river plains", true, "Arab", ["Türkiye", "Iran", "Kuwait", "Saudi Arabia", "Jordan", "Syria"], "Medium", "Mesopotamia, between two rivers.", ["red", "white", "black", "green"]),
  b("saudi-arabia", "Saudi Arabia", "country", "Saudi Arabia", "Asia", "Middle East", 24.0, 45.0, 36, 26, "desert", true, "Arab", ["Jordan", "Iraq", "Kuwait", "Qatar", "United Arab Emirates", "Oman", "Yemen"], "Gentle", "Deserts, oil, and the two holy cities.", ["green", "white"]),
  b("united-arab-emirates", "United Arab Emirates", "country", "United Arab Emirates", "Asia", "Middle East", 24.0, 54.0, 9.9, 28, "desert", true, "Arab", ["Saudi Arabia", "Oman"], "Medium", "Seven emirates and the tallest tower.", ["red", "green", "white", "black"]),
  b("israel", "Israel", "country", "Israel", "Asia", "Middle East", 31.4, 35.0, 9.8, 20, "coastal and desert", true, "Levantine", ["Egypt", "Jordan", "Lebanon", "Syria"], "Medium", "From Galilee to the Negev.", ["white", "blue"]),
  b("jordan", "Jordan", "country", "Jordan", "Asia", "Middle East", 31.3, 36.5, 11, 18, "desert plateau", true, "Arab", ["Israel", "Saudi Arabia", "Iraq", "Syria"], "Medium", "Petra's kingdom, mostly desert.", ["black", "white", "green", "red"]),
  b("turkiye", "Türkiye", "country", "Türkiye", "Asia", "Anatolia", 39.0, 35.2, 85, 13, "plateau", true, "Turkic", ["Greece", "Bulgaria", "Georgia", "Armenia", "Iran", "Iraq", "Syria"], "Gentle", "Bridges two continents at the Bosphorus.", ["red", "white"]),
  b("georgia-country", "Georgia", "country", "Georgia", "Asia", "Caucasus", 42.3, 43.4, 3.7, 9, "mountainous", true, "Caucasian", ["Russia", "Azerbaijan", "Armenia", "Türkiye"], "Tricky", "Wine's birthplace under the Caucasus.", ["white", "red"]),
  b("armenia", "Armenia", "country", "Armenia", "Asia", "Caucasus", 40.1, 45.0, 2.8, 7, "highland", false, "Caucasian", ["Georgia", "Azerbaijan", "Iran", "Türkiye"], "Tricky", "An ancient alphabet facing Mount Ararat.", ["red", "blue", "orange"]),
  b("azerbaijan", "Azerbaijan", "country", "Azerbaijan", "Asia", "Caucasus", 40.1, 47.6, 10, 12, "lowland and hills", true, "Turkic", ["Russia", "Georgia", "Armenia", "Iran"], "Tricky", "Land of fire on the Caspian.", ["blue", "red", "green"]),
  b("singapore", "Singapore", "country", "Singapore", "Asia", "Southeast Asia", 1.35, 103.82, 5.9, 27, "island city", true, "Southeast Asian", ["Malaysia"], "Gentle", "The city-state at the strait.", ["red", "white"]),
  /* ------------------------------------------------ countries: Europe */
  b("france", "France", "country", "France", "Europe", "Western Europe", 46.6, 2.4, 68, 12, "varied", true, "Romance", ["Spain", "Italy", "Switzerland", "Germany", "Belgium", "Luxembourg"], "Gentle", "The hexagon of wine and revolutions.", ["blue", "white", "red"]),
  b("germany", "Germany", "country", "Germany", "Europe", "Central Europe", 51.2, 10.4, 84, 9, "plains and forest", true, "Germanic", ["France", "Belgium", "Netherlands", "Denmark", "Poland", "Czechia", "Austria", "Switzerland", "Luxembourg"], "Gentle", "Europe's industrial heart.", ["black", "red", "yellow"]),
  b("spain", "Spain", "country", "Spain", "Europe", "Iberia", 40.4, -3.7, 48, 15, "plateau", true, "Romance", ["France", "Portugal"], "Gentle", "Iberia's larger kingdom.", ["red", "yellow"]),
  b("portugal", "Portugal", "country", "Portugal", "Europe", "Iberia", 39.6, -8.0, 10, 16, "coastal hills", true, "Romance", ["Spain"], "Gentle", "The Atlantic edge of Iberia.", ["green", "red", "yellow"]),
  b("italy", "Italy", "country", "Italy", "Europe", "Southern Europe", 42.8, 12.8, 59, 14, "peninsula", true, "Romance", ["France", "Switzerland", "Austria", "Slovenia"], "Gentle", "The boot in the Mediterranean.", ["green", "white", "red"]),
  b("switzerland", "Switzerland", "country", "Switzerland", "Europe", "Central Europe", 46.8, 8.2, 8.8, 6, "alpine", false, "Germanic", ["France", "Germany", "Austria", "Italy"], "Gentle", "Landlocked Alps, four languages.", ["red", "white"]),
  b("austria", "Austria", "country", "Austria", "Europe", "Central Europe", 47.6, 14.1, 9.1, 7, "alpine", false, "Germanic", ["Germany", "Czechia", "Slovakia", "Hungary", "Slovenia", "Italy", "Switzerland"], "Medium", "Waltzes and mountain passes.", ["red", "white"]),
  b("netherlands", "Netherlands", "country", "Netherlands", "Europe", "Western Europe", 52.1, 5.3, 18, 10, "flat polders", true, "Germanic", ["Germany", "Belgium"], "Gentle", "Below sea level, behind dikes.", ["red", "white", "blue"]),
  b("belgium", "Belgium", "country", "Belgium", "Europe", "Western Europe", 50.5, 4.5, 11.7, 10, "lowland", true, "mixed Romance-Germanic", ["France", "Netherlands", "Germany", "Luxembourg"], "Medium", "Two languages, one waffle culture.", ["black", "yellow", "red"]),
  b("united-kingdom", "United Kingdom", "country", "United Kingdom", "Europe", "British Isles", 54.0, -2.5, 68, 9, "island hills", true, "Germanic", ["Ireland"], "Gentle", "The island kingdom of four nations.", ["red", "white", "blue"]),
  b("ireland", "Ireland", "country", "Ireland", "Europe", "British Isles", 53.2, -8.2, 5.3, 10, "green lowland", true, "Celtic", ["United Kingdom"], "Gentle", "The emerald isle.", ["green", "white", "orange"]),
  b("norway", "Norway", "country", "Norway", "Europe", "Nordics", 61.0, 8.8, 5.5, 2, "fjords", true, "Nordic", ["Sweden", "Finland", "Russia"], "Gentle", "Fjords and midnight sun.", ["red", "white", "blue"]),
  b("sweden", "Sweden", "country", "Sweden", "Europe", "Nordics", 62.2, 15.6, 10.5, 3, "forest and lakes", true, "Nordic", ["Norway", "Finland"], "Gentle", "Forests, flat-packs, and fika.", ["blue", "yellow"]),
  b("finland", "Finland", "country", "Finland", "Europe", "Nordics", 64.5, 26.0, 5.6, 2, "lakes and forest", true, "Nordic", ["Sweden", "Norway", "Russia"], "Medium", "Land of a hundred thousand lakes.", ["white", "blue"]),
  b("denmark", "Denmark", "country", "Denmark", "Europe", "Nordics", 56.0, 10.0, 5.9, 8, "flat islands", true, "Nordic", ["Germany"], "Medium", "Flat, bike-loving, and hygge.", ["red", "white"]),
  b("iceland", "Iceland", "country", "Iceland", "Europe", "North Atlantic", 64.9, -18.6, 0.4, 4, "volcanic", true, "Nordic", [], "Gentle", "Fire and ice in the North Atlantic.", ["blue", "white", "red"]),
  b("poland", "Poland", "country", "Poland", "Europe", "Central Europe", 52.1, 19.4, 37, 8, "plains", true, "Slavic", ["Germany", "Czechia", "Slovakia", "Ukraine", "Belarus", "Lithuania", "Russia"], "Gentle", "The great plain between powers.", ["white", "red"]),
  b("czechia", "Czechia", "country", "Czechia", "Europe", "Central Europe", 49.8, 15.5, 10.9, 8, "hills and basins", false, "Slavic", ["Germany", "Poland", "Slovakia", "Austria"], "Medium", "Castles, spires, and pilsner.", ["white", "red", "blue"]),
  b("hungary", "Hungary", "country", "Hungary", "Europe", "Central Europe", 47.2, 19.5, 9.6, 11, "plains", false, "Uralic", ["Austria", "Slovakia", "Ukraine", "Romania", "Serbia", "Croatia", "Slovenia"], "Medium", "A language island on the Danube plain.", ["red", "white", "green"]),
  b("romania", "Romania", "country", "Romania", "Europe", "Balkans", 45.9, 25.0, 19, 10, "carpathian", true, "Romance", ["Hungary", "Ukraine", "Moldova", "Bulgaria", "Serbia"], "Medium", "Carpathian castles and the Danube delta.", ["blue", "yellow", "red"]),
  b("greece", "Greece", "country", "Greece", "Europe", "Southern Europe", 39.1, 22.9, 10.4, 16, "islands and mountains", true, "Hellenic", ["Albania", "North Macedonia", "Bulgaria", "Türkiye"], "Gentle", "The wine-dark Aegean world.", ["blue", "white"]),
  b("croatia", "Croatia", "country", "Croatia", "Europe", "Balkans", 45.1, 15.2, 3.9, 12, "coast and karst", true, "Slavic", ["Slovenia", "Hungary", "Serbia", "Bosnia and Herzegovina", "Montenegro"], "Medium", "A crescent of Adriatic islands.", ["red", "white", "blue"]),
  b("serbia", "Serbia", "country", "Serbia", "Europe", "Balkans", 44.0, 21.0, 6.6, 11, "hills and plains", false, "Slavic", ["Hungary", "Romania", "Bulgaria", "North Macedonia", "Montenegro", "Bosnia and Herzegovina", "Croatia"], "Tricky", "The Balkan crossroads on the Danube.", ["red", "blue", "white"]),
  b("ukraine", "Ukraine", "country", "Ukraine", "Europe", "Eastern Europe", 49.0, 31.4, 37, 9, "steppe plains", true, "Slavic", ["Poland", "Slovakia", "Hungary", "Romania", "Moldova", "Belarus", "Russia"], "Gentle", "Black-earth breadbasket of Europe.", ["blue", "yellow"]),
  b("russia", "Russia", "country", "Russia", "Europe", "Eastern Europe", 60.0, 90.0, 144, -3, "taiga and steppe", true, "Slavic", ["Norway", "Finland", "Ukraine", "Belarus", "Poland", "Lithuania", "Georgia", "Azerbaijan", "Kazakhstan", "Mongolia", "China", "North Korea"], "Gentle", "Eleven time zones of taiga.", ["white", "blue", "red"]),
  /* --------------------------------------------- countries: Africa */
  b("egypt", "Egypt", "country", "Egypt", "Africa", "North Africa", 26.8, 30.0, 105, 23, "desert and delta", true, "Arab", ["Libya", "Sudan", "Israel"], "Gentle", "The Nile's gift.", ["red", "white", "black", "yellow"]),
  b("morocco", "Morocco", "country", "Morocco", "Africa", "North Africa", 31.8, -7.1, 37, 18, "atlas mountains", true, "Arab-Berber", ["Algeria"], "Gentle", "Souks and kasbahs below the Atlas.", ["red", "green"]),
  b("algeria", "Algeria", "country", "Algeria", "Africa", "North Africa", 28.0, 1.7, 45, 23, "sahara", true, "Arab-Berber", ["Morocco", "Tunisia", "Libya", "Niger", "Mali", "Mauritania"], "Medium", "Africa's largest country, mostly Sahara.", ["green", "white", "red"]),
  b("tunisia", "Tunisia", "country", "Tunisia", "Africa", "North Africa", 34.0, 9.5, 12, 19, "coastal plains", true, "Arab", ["Algeria", "Libya"], "Medium", "Carthage's small successor.", ["red", "white"]),
  b("ethiopia", "Ethiopia", "country", "Ethiopia", "Africa", "Horn of Africa", 9.1, 40.5, 126, 22, "highland", false, "Horn African", ["Eritrea", "Djibouti", "Somalia", "Kenya", "South Sudan", "Sudan"], "Medium", "The highland never colonised.", ["green", "yellow", "red", "blue"]),
  b("kenya", "Kenya", "country", "Kenya", "Africa", "East Africa", 0.0, 37.9, 55, 20, "savannah", true, "Swahili", ["Ethiopia", "Somalia", "Tanzania", "Uganda", "South Sudan"], "Gentle", "Safari plains on the equator.", ["black", "red", "green", "white"]),
  b("tanzania", "Tanzania", "country", "Tanzania", "Africa", "East Africa", -6.4, 34.9, 65, 23, "savannah plateau", true, "Swahili", ["Kenya", "Uganda", "Rwanda", "Zambia", "Malawi", "Mozambique", "Democratic Republic of the Congo"], "Medium", "Kilimanjaro and the Serengeti.", ["green", "yellow", "black", "blue"]),
  b("nigeria", "Nigeria", "country", "Nigeria", "Africa", "West Africa", 9.1, 8.7, 224, 27, "savannah and delta", true, "West African", ["Benin", "Niger", "Cameroon", "Chad"], "Gentle", "Africa's most populous country.", ["green", "white"]),
  b("ghana", "Ghana", "country", "Ghana", "Africa", "West Africa", 7.9, -1.0, 34, 27, "coastal plains", true, "West African", ["Ivory Coast", "Burkina Faso", "Togo"], "Medium", "The Black Star of independence.", ["red", "yellow", "green", "black"]),
  b("senegal", "Senegal", "country", "Senegal", "Africa", "West Africa", 14.5, -14.5, 18, 27, "sahel", true, "West African", ["Mauritania", "Mali", "Guinea", "The Gambia"], "Medium", "Teranga at the continent's western tip.", ["green", "yellow", "red"]),
  b("mali", "Mali", "country", "Mali", "Africa", "West Africa", 17.6, -4.0, 23, 28, "sahel and sahara", false, "West African", ["Senegal", "Mauritania", "Algeria", "Niger", "Burkina Faso", "Guinea", "Ivory Coast"], "Tricky", "Timbuktu's desert republic on the Niger river.", ["green", "yellow", "red"]),
  b("south-africa", "South Africa", "country", "South Africa", "Africa", "Southern Africa", -29.0, 24.0, 60, 17, "plateau", true, "Southern African", ["Namibia", "Botswana", "Zimbabwe", "Mozambique", "Eswatini", "Lesotho"], "Gentle", "The rainbow nation with three capitals.", ["green", "yellow", "black", "white", "red", "blue"]),
  b("namibia", "Namibia", "country", "Namibia", "Africa", "Southern Africa", -22.6, 17.1, 2.6, 20, "desert", true, "Southern African", ["South Africa", "Botswana", "Angola", "Zambia"], "Tricky", "Red dunes and a skeleton coast.", ["blue", "red", "green", "white", "yellow"]),
  b("madagascar", "Madagascar", "country", "Madagascar", "Africa", "Indian Ocean", -19.0, 46.9, 30, 23, "island highland", true, "Malagasy", [], "Medium", "The lemur island continent.", ["white", "red", "green"]),
  b("democratic-republic-of-the-congo", "Democratic Republic of the Congo", "country", "Democratic Republic of the Congo", "Africa", "Central Africa", -2.9, 23.6, 102, 25, "rainforest basin", true, "Central African", ["Republic of the Congo", "Central African Republic", "South Sudan", "Uganda", "Rwanda", "Burundi", "Tanzania", "Zambia", "Angola"], "Tricky", "The Congo basin's rainforest giant.", ["blue", "red", "yellow"]),
  b("cape-verde", "Cape Verde", "country", "Cape Verde", "Africa", "West Africa", 16.0, -24.0, 0.6, 24, "volcanic islands", true, "Lusophone African", [], "Tricky", "Morna music on Atlantic volcano islands.", ["blue", "white", "red", "yellow"]),
  /* ------------------------------------------- countries: Americas */
  b("united-states", "United States", "country", "United States", "North America", "North America", 39.8, -98.6, 335, 12, "varied", true, "Anglo-American", ["Canada", "Mexico"], "Gentle", "Fifty states, sea to shining sea.", ["red", "white", "blue"]),
  b("canada", "Canada", "country", "Canada", "North America", "North America", 56.1, -106.3, 40, -4, "boreal forest", true, "Anglo-American", ["United States"], "Gentle", "The second-largest country on Earth.", ["red", "white"]),
  b("mexico", "Mexico", "country", "Mexico", "North America", "Mesoamerica", 23.6, -102.6, 129, 21, "plateau", true, "Latin American", ["United States", "Guatemala", "Belize"], "Gentle", "From Baja to the Yucatán.", ["green", "white", "red"]),
  b("guatemala", "Guatemala", "country", "Guatemala", "North America", "Central America", 15.8, -90.2, 18, 22, "volcanic highland", true, "Latin American", ["Mexico", "Belize", "Honduras", "El Salvador"], "Tricky", "Maya highlands and volcano lakes.", ["blue", "white"]),
  b("cuba", "Cuba", "country", "Cuba", "North America", "Caribbean", 21.5, -79.5, 11, 25, "island plains", true, "Latin American", [], "Medium", "The Caribbean's largest island.", ["red", "white", "blue"]),
  b("brazil", "Brazil", "country", "Brazil", "South America", "Brazil", -10.3, -53.2, 216, 25, "rainforest and cerrado", true, "Latin American", ["Uruguay", "Argentina", "Paraguay", "Bolivia", "Peru", "Colombia", "Venezuela", "Guyana", "Suriname"], "Gentle", "Half a continent in one country.", ["green", "yellow", "blue"]),
  b("argentina", "Argentina", "country", "Argentina", "South America", "Southern Cone", -35.4, -65.2, 46, 14, "pampas", true, "Latin American", ["Chile", "Bolivia", "Paraguay", "Brazil", "Uruguay"], "Gentle", "Tango, pampas, and Patagonia.", ["blue", "white", "yellow"]),
  b("chile", "Chile", "country", "Chile", "South America", "Southern Cone", -35.7, -71.5, 20, 12, "andes and coast", true, "Latin American", ["Peru", "Bolivia", "Argentina"], "Gentle", "A 4,300 km ribbon of a country.", ["red", "white", "blue"]),
  b("peru", "Peru", "country", "Peru", "South America", "Andes", -9.2, -75.0, 34, 18, "andes and coast", true, "Latin American", ["Ecuador", "Colombia", "Brazil", "Bolivia", "Chile"], "Gentle", "Inca stones and ceviche.", ["red", "white"]),
  b("bolivia", "Bolivia", "country", "Bolivia", "South America", "Andes", -16.3, -63.6, 12, 16, "altiplano", false, "Latin American", ["Peru", "Brazil", "Paraguay", "Argentina", "Chile"], "Medium", "Salt flats on the high plateau.", ["red", "yellow", "green"]),
  b("colombia", "Colombia", "country", "Colombia", "South America", "Andes", 4.6, -74.1, 52, 22, "andes and rainforest", true, "Latin American", ["Panama", "Venezuela", "Brazil", "Peru", "Ecuador"], "Gentle", "Coffee country with two coastlines.", ["yellow", "blue", "red"]),
  b("uruguay", "Uruguay", "country", "Uruguay", "South America", "Southern Cone", -32.6, -55.8, 3.4, 16, "rolling grassland", true, "Latin American", ["Brazil", "Argentina"], "Medium", "The small mate-drinking republic.", ["blue", "white", "yellow"]),
  /* --------------------------------------------- countries: Oceania */
  b("australia", "Australia", "country", "Australia", "Oceania", "Oceania", -25.3, 133.8, 26, 21, "outback", true, "Anglo-Pacific", [], "Gentle", "The island continent.", ["blue", "red", "white"]),
  b("new-zealand", "New Zealand", "country", "New Zealand", "Oceania", "Oceania", -41.8, 172.8, 5.2, 11, "island mountains", true, "Anglo-Pacific", [], "Gentle", "Aotearoa, land of the long white cloud.", ["blue", "red", "white"]),
  b("fiji", "Fiji", "country", "Fiji", "Oceania", "Melanesia", -17.8, 178.0, 0.9, 26, "volcanic islands", true, "Pacific Islander", [], "Medium", "Three hundred islands of kava and rugby.", ["blue", "white", "red"]),
  b("papua-new-guinea", "Papua New Guinea", "country", "Papua New Guinea", "Oceania", "Melanesia", -6.5, 145.0, 10, 26, "rainforest mountains", true, "Pacific Islander", ["Indonesia"], "Tricky", "Over 800 languages on one island's half.", ["red", "black", "yellow"]),
  /* ------------------------------- states, cities, islands, regions */
  b("kerala", "Kerala", "state", "India", "Asia", "South Asia", 10.5, 76.2, 35, 27, "backwater coast", true, "South Asian", ["Tamil Nadu", "Karnataka"], "Medium", "India's palm-lined backwater state."),
  b("rajasthan", "Rajasthan", "state", "India", "Asia", "South Asia", 26.6, 73.8, 81, 25, "desert", false, "South Asian", ["Punjab", "Gujarat", "Pakistan"], "Medium", "India's desert of forts and colours."),
  b("west-bengal", "West Bengal", "state", "India", "Asia", "South Asia", 23.7, 87.9, 99, 26, "delta plains", true, "South Asian", ["Bangladesh", "Nepal", "Bhutan", "Bihar"], "Medium", "Bengal's Indian half, from Darjeeling to the delta."),
  b("tamil-nadu", "Tamil Nadu", "state", "India", "Asia", "South Asia", 11.1, 78.7, 77, 28, "coastal plains", true, "South Asian", ["Kerala", "Karnataka"], "Medium", "Temple gopurams and filter coffee."),
  b("california", "California", "state", "United States", "North America", "North America", 36.8, -119.4, 39, 16, "coast and sierra", true, "Anglo-American", ["Oregon", "Nevada", "Arizona", "Mexico"], "Gentle", "Golden Gate to the Mojave."),
  b("texas", "Texas", "state", "United States", "North America", "North America", 31.5, -99.3, 30, 19, "plains", true, "Anglo-American", ["Mexico", "New Mexico", "Oklahoma", "Louisiana"], "Gentle", "The lone star state."),
  b("alaska", "Alaska", "state", "United States", "North America", "North America", 64.2, -152.2, 0.7, -3, "tundra and glaciers", true, "Anglo-American", ["Canada"], "Medium", "America's arctic frontier."),
  b("quebec", "Quebec", "state", "Canada", "North America", "North America", 52.0, -71.0, 8.8, 1, "boreal forest", true, "Francophone", ["Ontario", "United States"], "Medium", "French-speaking North America."),
  b("bavaria", "Bavaria", "state", "Germany", "Europe", "Central Europe", 48.9, 11.4, 13, 8, "alpine foothills", false, "Germanic", ["Austria", "Czechia"], "Medium", "Lederhosen, lakes, and fairy-tale castles."),
  b("catalonia", "Catalonia", "region", "Spain", "Europe", "Iberia", 41.8, 1.5, 7.8, 15, "coast and pyrenees", true, "Romance", ["France", "Aragon"], "Medium", "Barcelona's proud region with its own language."),
  b("scotland", "Scotland", "region", "United Kingdom", "Europe", "British Isles", 56.8, -4.2, 5.5, 8, "highlands", true, "Celtic", ["England"], "Gentle", "Lochs, glens, and bagpipes."),
  b("siberia", "Siberia", "region", "Russia", "Asia", "North Asia", 60.0, 100.0, 33, -8, "taiga", true, "Slavic", ["Mongolia", "Kazakhstan", "China"], "Medium", "The frozen three-quarters of Russia."),
  b("patagonia", "Patagonia", "region", "Argentina", "South America", "Southern Cone", -44.0, -69.0, 2.0, 8, "windswept steppe", true, "Latin American", ["Chile"], "Medium", "Glaciers and guanacos at the world's end."),
  b("tibet", "Tibet", "region", "China", "Asia", "Tibetan Plateau", 31.0, 88.0, 3.6, 1, "high plateau", false, "Tibetan", ["Nepal", "India", "Bhutan"], "Medium", "The roof of the world."),
  b("amazon-basin", "Amazon Basin", "river", "Brazil", "South America", "Amazonia", -3.5, -62.0, 30, 27, "rainforest", false, "Latin American", ["Peru", "Colombia", "Bolivia"], "Medium", "The world's largest river system."),
  b("nile-valley", "Nile Valley", "river", "Egypt", "Africa", "North Africa", 25.0, 32.0, 90, 25, "river valley", false, "Arab", ["Sudan"], "Medium", "The green ribbon through the desert."),
  b("sahara", "Sahara", "region", "Algeria", "Africa", "North Africa", 23.0, 8.0, 2.5, 28, "desert", false, "Arab-Berber", ["Mali", "Libya", "Niger", "Chad"], "Medium", "The world's largest hot desert."),
  b("sicily", "Sicily", "island", "Italy", "Europe", "Southern Europe", 37.6, 14.2, 4.8, 18, "volcanic island", true, "Romance", [], "Medium", "The Mediterranean's largest island, under Etna."),
  b("crete", "Crete", "island", "Greece", "Europe", "Aegean", 35.2, 24.9, 0.6, 18, "island mountains", true, "Hellenic", [], "Tricky", "Minoan palaces and mountain villages."),
  b("hokkaido", "Hokkaido", "island", "Japan", "Asia", "East Asia", 43.2, 142.8, 5.1, 7, "snowy island", true, "East Asian", [], "Medium", "Japan's snowy northern island."),
  b("bali", "Bali", "island", "Indonesia", "Asia", "Southeast Asia", -8.4, 115.1, 4.3, 27, "volcanic island", true, "Southeast Asian", ["Java"], "Gentle", "The island of a thousand temples."),
  b("java", "Java", "island", "Indonesia", "Asia", "Southeast Asia", -7.5, 110.0, 152, 27, "volcanic island", true, "Southeast Asian", ["Bali"], "Medium", "The world's most populous island."),
  b("zanzibar-island", "Zanzibar", "island", "Tanzania", "Africa", "Swahili Coast", -6.1, 39.3, 1.9, 26, "spice island", true, "Swahili", [], "Medium", "The spice island off East Africa."),
  b("greenland", "Greenland", "island", "Denmark", "North America", "Arctic", 71.7, -42.6, 0.056, -10, "ice sheet", true, "Inuit-Nordic", [], "Medium", "The world's largest island, mostly ice."),
  b("hawaii", "Hawaii", "state", "United States", "Oceania", "Hawaiian Islands", 20.8, -156.3, 1.4, 24, "volcanic islands", true, "Pacific Islander", [], "Gentle", "The mid-Pacific volcano chain."),
  b("kashmir-valley", "Kashmir Valley", "region", "India", "Asia", "South Asia", 34.1, 74.8, 7, 13, "himalayan valley", false, "South Asian", ["Pakistan", "Punjab"], "Tricky", "Saffron fields and houseboat lakes."),
  b("mekong-delta", "Mekong Delta", "river", "Vietnam", "Asia", "Southeast Asia", 10.0, 105.8, 17, 27, "river delta", true, "Southeast Asian", ["Cambodia"], "Tricky", "Vietnam's rice-bowl river maze."),
  b("andalusia", "Andalusia", "region", "Spain", "Europe", "Iberia", 37.5, -4.7, 8.5, 18, "sierra and coast", true, "Romance", ["Portugal"], "Medium", "Flamenco's southern homeland."),
  b("provence", "Provence", "region", "France", "Europe", "Western Europe", 43.9, 6.0, 5.1, 14, "lavender hills", true, "Romance", ["Italy"], "Medium", "Lavender fields and Roman ruins."),
  b("yucatan", "Yucatán", "state", "Mexico", "North America", "Mesoamerica", 20.7, -89.0, 2.4, 26, "limestone flats", true, "Latin American", ["Quintana Roo", "Campeche"], "Medium", "Cenotes and Maya pyramids."),
];

/** hand-written tier — also feeds metadata to the other generators */
export const BORDERLINE_CURATED = CURATED;

/** curated + generated gazetteer tier (1000+ guessable places) */
export const BORDERLINE_PLACES: BorderlinePlace[] = [...CURATED, ...buildBorderline(CURATED)];
