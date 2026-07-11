/**
 * History topic — dated events (year, decade and ordering questions) and
 * leaders (who did it / which realm did they lead). Event labels are
 * headline-style present-tense statements, same voice as TIME_EVENTS, so
 * they read naturally both inside questions and as answer choices.
 */

import { TIME_EVENTS } from "../events";
import { CURATED } from "./legacyFacts";
import { Bank, TIER_TARGETS, fmtYear, yearWrongs, decadeOf, decadeWrongs } from "./build";
import type { Tier, TriviaQuestion } from "./types";

/** [year, headline, tier] */
const EVENTS: [number, string, Tier][] = [
  [1914,"The First World War begins",0],[1918,"The First World War ends",0],
  [1939,"The Second World War begins",0],[1945,"The Second World War ends",0],
  [1969,"Humans first walk on the Moon",0],[1912,"The Titanic sinks",0],
  [1989,"The Berlin Wall falls",0],[1776,"The United States declares independence",0],
  [1789,"The French Revolution begins",0],[1963,"President John F. Kennedy is assassinated",0],
  [1963,"Martin Luther King Jr. gives his “I Have a Dream” speech",0],
  [1994,"Nelson Mandela becomes president of South Africa",0],
  [1991,"The Soviet Union dissolves",0],[1986,"The Chernobyl disaster unfolds",0],
  [1815,"Napoleon loses at Waterloo",0],[1666,"The Great Fire of London blazes",0],
  [1861,"The American Civil War begins",0],[1865,"Abraham Lincoln is assassinated",1],
  [1929,"The Wall Street Crash hits",0],[1953,"Everest is climbed for the first time",0],
  [1961,"Yuri Gagarin becomes the first human in space",0],
  [1903,"The Wright brothers make the first powered flight",0],
  [1889,"The Eiffel Tower opens",0],[1937,"The Golden Gate Bridge opens",1],
  [2016,"The United Kingdom votes to leave the EU",0],
  [2022,"Queen Elizabeth II dies after seventy years on the throne",0],
  [1997,"Hong Kong returns to China",1],
  [1969,"Woodstock takes place",1],[1955,"Rosa Parks refuses to give up her bus seat",1],
  [1066,"The Battle of Hastings decides England's crown",1],
  [1588,"England defeats the Spanish Armada",1],[1605,"The Gunpowder Plot is foiled",1],
  [1620,"The Mayflower sails for America",1],[1649,"England executes King Charles I",2],
  [1755,"A great earthquake levels Lisbon",2],
  [1804,"Napoleon crowns himself emperor",1],[1821,"Napoleon dies on Saint Helena",2],
  [1833,"The British Empire abolishes slavery",1],[1848,"Revolutions sweep across Europe",2],
  [1859,"Darwin publishes On the Origin of Species",1],
  [1863,"Lincoln delivers the Gettysburg Address",1],
  [1869,"The Suez Canal opens",1],[1871,"Germany unifies into one empire",1],
  [1893,"New Zealand becomes the first country where women can vote",1],
  [1901,"Queen Victoria dies",1],[1917,"The Russian Revolution overthrows the tsar",1],
  [1920,"The League of Nations holds its first assembly",1],
  [1922,"Tutankhamun's tomb is discovered",1],
  [1933,"Hitler becomes chancellor of Germany",1],[1941,"Pearl Harbor is attacked",1],
  [1944,"The D-Day landings storm Normandy",1],[1947,"India gains independence",1],
  [1949,"NATO is founded",1],[1950,"The Korean War begins",1],
  [1962,"The Cuban Missile Crisis grips the world",1],
  [1967,"The first human heart transplant succeeds",1],
  [1973,"The first global oil crisis strikes",2],[1975,"The Vietnam War ends",1],
  [1979,"The Iranian Revolution topples the Shah",1],[1990,"Germany reunifies",1],
  [1990,"Nelson Mandela walks free from prison",1],
  [1993,"The European Union comes into being",1],
  [1999,"The euro launches as a currency",1],[2004,"The Indian Ocean tsunami strikes",1],
  [2011,"The Fukushima nuclear disaster unfolds",1],
  [1648,"The Peace of Westphalia ends the Thirty Years' War",2],
  [1683,"The Ottoman siege of Vienna is broken",2],
  [1768,"Captain Cook sets out on his first great voyage",2],
  [1799,"The Rosetta Stone is found",2],[1812,"Napoleon invades Russia",1],
  [1839,"The First Opium War begins",2],[1854,"The Crimean War begins",2],
  [1857,"The Indian Rebellion challenges British rule",2],
  [1867,"Canada becomes a confederation",2],[1868,"The Meiji Restoration transforms Japan",2],
  [1884,"European powers carve up Africa at the Berlin Conference",2],
  [1899,"The Boer War begins",2],[1904,"The Russo-Japanese War begins",2],
  [1908,"The Tunguska blast flattens a Siberian forest",2],
  [1911,"China's imperial rule ends in revolution",2],
  [1916,"The Easter Rising erupts in Dublin",2],
  [1919,"The Treaty of Versailles is signed",1],
  [1923,"The Republic of Türkiye is founded",2],
  [1931,"Japan invades Manchuria",2],[1936,"The Spanish Civil War begins",2],
  [1938,"The Munich Agreement is signed",2],[1942,"The Battle of Stalingrad begins",2],
  [1948,"The Berlin Airlift begins",2],[1956,"The Suez Crisis flares",2],
  [1960,"Seventeen African nations gain independence in a single year",2],
  [1961,"The Bay of Pigs invasion fails",2],[1964,"Tokyo hosts Asia's first Olympics",2],
  [1966,"China's Cultural Revolution begins",2],[1968,"The Prague Spring is crushed",2],
  [1972,"The Watergate break-in occurs",2],[1974,"Richard Nixon resigns",1],
  [1978,"The Camp David Accords are signed",2],[1982,"The Falklands War flares",2],
  [1985,"Live Aid raises millions for famine relief",1],
  [1987,"The Montreal Protocol moves to protect the ozone layer",2],
  [1992,"The Maastricht Treaty is signed",2],
  [1998,"The Good Friday Agreement brings peace to Northern Ireland",2],
  [2002,"The African Union is founded",2],
  [2011,"South Sudan becomes the world's newest country",1],
  [2015,"The Paris climate agreement is adopted",1],
  [1517,"Martin Luther posts his 95 Theses",1],
  [1607,"Jamestown becomes England's first lasting American colony",2],
  [1707,"England and Scotland unite as Great Britain",2],
  [1773,"The Boston Tea Party steeps the harbour",1],
  [1791,"The US Bill of Rights takes effect",2],
  [1803,"The Louisiana Purchase doubles the USA",2],
  [1810,"Mexico's independence movement begins",2],[1822,"Brazil declares independence",2],
  [1830,"The first passenger railway links two cities",2],
  [1840,"The Treaty of Waitangi is signed in New Zealand",2],
  [1849,"The California Gold Rush peaks",2],[1876,"The telephone is patented",1],
  [1886,"The Statue of Liberty is dedicated",1],
  [1896,"The first modern Olympics open in Athens",1],
];

/** [leader, realm they led, deed, tier] — deed completes "Which leader …?" */
const LEADERS: [string, string, string, Tier][] = [
  ["Julius Caesar","Rome","crossed the Rubicon and seized power in Rome",0],
  ["Augustus","Rome","became Rome's first emperor",1],
  ["Alexander the Great","Macedonia","conquered an empire stretching from Greece to India by age 30",0],
  ["Cleopatra","Ptolemaic Egypt","was the last active pharaoh of Egypt",0],
  ["Genghis Khan","the Mongol Empire","united the steppe tribes into history's largest land empire",0],
  ["Napoleon Bonaparte","France","crowned himself emperor of France in 1804",0],
  ["Winston Churchill","the United Kingdom","led Britain through the Second World War",0],
  ["Abraham Lincoln","the United States","preserved the US through its Civil War",0],
  ["George Washington","the United States","became the first US president",0],
  ["Mahatma Gandhi","India","led India's independence movement through nonviolence",0],
  ["Nelson Mandela","South Africa","became South Africa's first Black president",0],
  ["Joseph Stalin","the Soviet Union","led the Soviet Union through the Second World War",1],
  ["Vladimir Lenin","the Soviet Union","led the October Revolution of 1917",1],
  ["Mao Zedong","China","proclaimed the People's Republic of China in 1949",1],
  ["Queen Victoria","the United Kingdom","gave her name to an entire British era",0],
  ["Elizabeth I","England","reigned over England's golden Elizabethan age",0],
  ["Henry VIII","England","married six times and broke with Rome",0],
  ["Catherine the Great","Russia","expanded Russia into a great European power",1],
  ["Peter the Great","Russia","built St Petersburg and modernised Russia",1],
  ["Suleiman the Magnificent","the Ottoman Empire","took the Ottoman Empire to its peak",1],
  ["Charlemagne","the Frankish Empire","was crowned Emperor of the Romans in 800",1],
  ["William the Conqueror","England","won the English crown at Hastings in 1066",1],
  ["Joan of Arc","France","led French troops to victory at Orléans as a teenager",0],
  ["Mustafa Kemal Atatürk","Türkiye","founded the modern Turkish republic",1],
  ["Franklin D. Roosevelt","the United States","won four US presidential elections",1],
  ["Thomas Jefferson","the United States","wrote the Declaration of Independence",1],
  ["Simón Bolívar","Gran Colombia","liberated much of South America from Spanish rule",1],
  ["Giuseppe Garibaldi","Italy","fought to unify Italy",2],
  ["Otto von Bismarck","Germany","engineered German unification as the Iron Chancellor",1],
  ["Mikhail Gorbachev","the Soviet Union","introduced glasnost and perestroika",1],
  ["Margaret Thatcher","the United Kingdom","became Britain's first female prime minister",0],
  ["Indira Gandhi","India","became India's first female prime minister",1],
  ["Golda Meir","Israel","became Israel's first female prime minister",2],
  ["Angela Merkel","Germany","led Germany for sixteen years",0],
  ["Jawaharlal Nehru","India","became independent India's first prime minister",1],
  ["Ho Chi Minh","Vietnam","led Vietnam's independence movement",1],
  ["Fidel Castro","Cuba","ruled Cuba for nearly half a century",0],
  ["Josip Broz Tito","Yugoslavia","held Yugoslavia together for decades",2],
  ["Gamal Abdel Nasser","Egypt","nationalised the Suez Canal",2],
  ["Haile Selassie","Ethiopia","was Ethiopia's last emperor",2],
  ["Kwame Nkrumah","Ghana","led the first sub-Saharan colony to independence",2],
  ["Ashoka","the Maurya Empire","embraced Buddhism after the bloody Kalinga war",2],
  ["Akbar","the Mughal Empire","expanded the Mughal Empire with famed tolerance",2],
  ["Shah Jahan","the Mughal Empire","built the Taj Mahal for his wife",1],
  ["Qin Shi Huang","China","first unified China and began the Great Wall",1],
  ["Kublai Khan","Yuan-dynasty China","founded China's Yuan dynasty and hosted Marco Polo",2],
  ["Tokugawa Ieyasu","Japan","founded the shogunate that closed Japan for 250 years",2],
  ["Ramses II","ancient Egypt","built more monuments than any other pharaoh",1],
  ["Hammurabi","Babylon","carved one of the first law codes in stone",1],
  ["Cyrus the Great","Persia","founded the Persian Empire",1],
  ["Leonidas","Sparta","held Thermopylae with 300 Spartans",1],
  ["Pericles","Athens","led Athens through its golden age",2],
  ["Hannibal","Carthage","crossed the Alps with war elephants",1],
  ["Attila","the Huns","terrorised Rome as the 'Scourge of God'",1],
  ["Justinian I","the Byzantine Empire","rebuilt the Hagia Sophia and codified Roman law",2],
  ["Constantine I","Rome","became Rome's first Christian emperor",1],
  ["Saladin","the Ayyubid Sultanate","retook Jerusalem during the Crusades",1],
  ["Richard the Lionheart","England","spent his reign crusading far from England",1],
  ["Moctezuma II","the Aztec Empire","ruled the Aztecs when Cortés arrived",1],
  ["Atahualpa","the Inca Empire","was the last emperor of the Incas",2],
  ["Mansa Musa","the Mali Empire","made a gold-laden pilgrimage that dazzled the world",1],
  ["Shaka","the Zulu Kingdom","revolutionised warfare in southern Africa",2],
  ["Menelik II","Ethiopia","defeated a European army at Adwa in 1896",2],
  ["Kamehameha I","Hawaii","united the Hawaiian islands",2],
  ["Louis XIV","France","reigned as the Sun King from Versailles",0],
  ["Louis XVI","France","lost his head to the French Revolution",1],
  ["Maximilien Robespierre","revolutionary France","presided over the Reign of Terror",2],
  ["Oliver Cromwell","England","ruled England as Lord Protector without a king",1],
  ["Frederick the Great","Prussia","made Prussia a great military power",2],
  ["Maria Theresa","Austria","ruled the Habsburg lands for forty years",2],
  ["Nicholas II","Russia","was Russia's last tsar",1],
  ["Wilhelm II","Germany","was Germany's last kaiser",2],
  ["Woodrow Wilson","the United States","championed the League of Nations",2],
  ["Harry S. Truman","the United States","made the gravest decision of 1945",1],
  ["Dwight D. Eisenhower","the United States","commanded the D-Day invasion before his presidency",1],
  ["Charles de Gaulle","France","led the Free French and later founded the Fifth Republic",1],
  ["Konrad Adenauer","West Germany","became West Germany's first chancellor",2],
  ["Juan Perón","Argentina","rose with Evita at his side",1],
  ["Lech Wałęsa","Poland","led the Solidarity movement from a shipyard",2],
  ["Václav Havel","Czechoslovakia","went from dissident playwright to president",2],
  ["Lee Kuan Yew","Singapore","turned a small port city into a wealthy nation",1],
  ["Deng Xiaoping","China","opened China's economy to the world",2],
  ["Sukarno","Indonesia","became Indonesia's first president",2],
  ["Muhammad Ali Jinnah","Pakistan","founded Pakistan",1],
  ["Benazir Bhutto","Pakistan","became the first woman to lead a Muslim-majority country",1],
  ["Sirimavo Bandaranaike","Ceylon (Sri Lanka)","became the world's first female prime minister",2],
  ["Corazon Aquino","the Philippines","rose to power through the People Power Revolution",2],
];

export function buildHistory(): TriviaQuestion[] {
  const bank = new Bank("History", 14921012);

  type Dated = { year: number; label: string; tier: Tier };
  const dated: Dated[] = [
    ...EVENTS.map(([year, label, tier]) => ({ year, label, tier })),
    ...TIME_EVENTS.map((e) => ({ year: e.year, label: e.label, tier: 1 as Tier })),
  ];

  const spreads: [number, number, number] = [40, 12, 4];
  const spreadFor = (d: Dated, t: Tier) =>
    spreads[t] * (Math.abs(d.year) > 1000 && d.year < 1500 ? 3 : 1);
  const yearQ = (d: Dated, t: Tier) =>
    bank.push(t, `Which year saw this headline? “${d.label}”`, fmtYear(d.year),
      yearWrongs(bank.rng, d.year, spreadFor(d, t)),
      d.year >= 1000 ? `Think ${decadeOf(d.year)}.` : undefined);

  /* ---- year and decade questions --------------------------------------- */
  for (const d of dated) {
    yearQ(d, d.tier);
    if (d.year >= 1900) {
      bank.push(d.tier, `In which decade: “${d.label}”?`, decadeOf(d.year),
        decadeWrongs(bank.rng, d.year));
    }
  }

  /* ---- leaders, both directions ----------------------------------------- */
  for (const [person, realm, deed, t] of LEADERS) {
    const wrongPeople = bank.pickN(LEADERS, 6, (l) => l[0] !== person && l[1] !== realm).map((l) => l[0]);
    bank.push(t, `Which leader ${deed}?`, person, wrongPeople.slice(0, 3));
    const wrongRealms = [...new Set(bank.pickN(LEADERS, 8, (l) => l[1] !== realm).map((l) => l[1]))];
    bank.push(t, `${person} led which realm?`, realm, wrongRealms.slice(0, 3), undefined, `${person} ${deed}.`);
  }

  /* ---- legacy curated history rows -------------------------------------- */
  for (const [topic, q, correct, w1, w2, w3, note] of CURATED) {
    if (topic !== "History") continue;
    bank.push(1, q, correct, [w1, w2, w3], undefined, note);
  }

  /* ---- ordering + year re-ask fills per tier ------------------------------ */
  const gaps: [number, number, number] = [80, 25, 8];
  for (const t of [0, 1, 2] as Tier[]) {
    const target = TIER_TARGETS[t];
    const pool = dated.filter((d) => (t === 0 ? d.tier === 0 : d.tier <= t));

    bank.fillSuperlative(t, Math.floor(target * 0.4), pool, (d) => d.year, gaps[t], false,
      (_four, best) => ({
        q: "Which of these happened first?",
        label: (d) => d.label,
        note: `${best.label} — ${fmtYear(best.year)}.`,
      }));
    bank.fillSuperlative(t, Math.floor(target * 0.7), pool, (d) => d.year, gaps[t], true,
      (_four, best) => ({
        q: "Which of these happened most recently?",
        label: (d) => d.label,
        note: `${best.label} — ${fmtYear(best.year)}.`,
      }));

    // year re-asks with fresh wrong years (catch-all)
    bank.fill(t, target, () => yearQ(bank.one(pool), t));
  }

  return bank.qs;
}
