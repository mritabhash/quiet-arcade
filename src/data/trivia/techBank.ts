/**
 * Tech topic — companies and their founders, inventions and their years,
 * what the acronyms stand for, and programming-language origins.
 */

import { Bank, TIER_TARGETS, decadeOf, decadeWrongs, yearWrongs } from "./build";
import type { Tier, TriviaQuestion } from "./types";

/** [company, founder(s) ("" = don't ask), year, known for, tier] */
const COMPANIES: [string, string, number, string, Tier][] = [
  ["Apple","Steve Jobs and Steve Wozniak",1976,"the iPhone and the Mac",0],
  ["Microsoft","Bill Gates and Paul Allen",1975,"Windows and Office",0],
  ["Google","Larry Page and Sergey Brin",1998,"web search",0],
  ["Amazon","Jeff Bezos",1994,"the everything store",0],
  ["Meta (Facebook)","Mark Zuckerberg",2004,"the biggest social network",0],
  ["Tesla","",2003,"mass-market electric cars",0],
  ["SpaceX","Elon Musk",2002,"reusable rockets",0],
  ["Netflix","Reed Hastings and Marc Randolph",1997,"streaming — it began by mailing DVDs",1],
  ["Sony","Masaru Ibuka and Akio Morita",1946,"the Walkman and PlayStation",1],
  ["Nintendo","Fusajiro Yamauchi",1889,"games — it began with playing cards",2],
  ["IBM","",1911,"mainframe computers",1],
  ["Intel","Gordon Moore and Robert Noyce",1968,"processors",2],
  ["Nvidia","Jensen Huang and co-founders",1993,"graphics chips",1],
  ["Oracle","Larry Ellison",1977,"databases",2],
  ["Adobe","",1982,"Photoshop and PDF",1],
  ["Alibaba","Jack Ma",1999,"Chinese e-commerce",1],
  ["Tencent","Pony Ma",1998,"WeChat",2],
  ["Spotify","Daniel Ek",2006,"music streaming",1],
  ["Airbnb","Brian Chesky and co-founders",2008,"staying in strangers' homes",1],
  ["Uber","Travis Kalanick and Garrett Camp",2009,"ride hailing",1],
  ["eBay","Pierre Omidyar",1995,"online auctions",1],
  ["Yahoo","Jerry Yang and David Filo",1994,"the classic web portal",2],
  ["Wikipedia","Jimmy Wales and Larry Sanger",2001,"the free encyclopedia",1],
  ["OpenAI","",2015,"ChatGPT",0],
  ["Anthropic","",2021,"the Claude AI assistant",1],
  ["DeepMind","Demis Hassabis and co-founders",2010,"AlphaGo",2],
  ["Xerox","",1906,"copiers — and the lab that inspired the modern desktop",2],
  ["Nokia","",1865,"phones — it began as a paper mill",1],
  ["Motorola","",1928,"the first handheld mobile phone call",2],
  ["Atari","Nolan Bushnell and Ted Dabney",1972,"Pong",2],
  ["Valve","Gabe Newell and Mike Harrington",1996,"Steam",1],
  ["Epic Games","Tim Sweeney",1991,"Fortnite and Unreal",1],
  ["Mojang","Markus “Notch” Persson",2009,"Minecraft",1],
  ["Instagram","Kevin Systrom and Mike Krieger",2010,"square photos and stories",2],
  ["WhatsApp","Jan Koum and Brian Acton",2009,"green-bubble messaging",2],
  ["Zoom","Eric Yuan",2011,"video calls the world lived on in 2020",1],
  ["Slack","Stewart Butterfield",2013,"workplace chat",2],
  ["Dropbox","Drew Houston",2007,"files in the cloud",2],
  ["Dell","Michael Dell",1984,"PCs sold from a dorm room",1],
  ["Hewlett-Packard","Bill Hewlett and Dave Packard",1939,"the original garage startup",1],
  ["Huawei","Ren Zhengfei",1987,"telecom gear and phones",2],
  ["ByteDance","Zhang Yiming",2012,"TikTok",1],
  ["LinkedIn","Reid Hoffman and co-founders",2002,"the professional network",2],
  ["Samsung","Lee Byung-chul",1938,"Korea's electronics giant — it began trading groceries",2],
  ["Twitter (X)","Jack Dorsey and co-founders",2006,"posts of 140 characters",1],
  ["YouTube","three former PayPal employees",2005,"video for everyone",1],
];

/** [invention, year, inventor ("" = don't ask), tier] */
const INVENTIONS: [string, number, string, Tier][] = [
  ["the telephone",1876,"Alexander Graham Bell",0],
  ["the practical light bulb",1879,"Thomas Edison",0],
  ["the powered airplane",1903,"the Wright brothers",0],
  ["the World Wide Web",1989,"Tim Berners-Lee",0],
  ["the printing press",1440,"Johannes Gutenberg",0],
  ["the improved steam engine",1769,"James Watt",1],
  ["the electric telegraph",1837,"Samuel Morse",1],
  ["radio transmission",1895,"Guglielmo Marconi",1],
  ["mechanical television",1926,"John Logie Baird",1],
  ["the transistor",1947,"Bell Labs",1],
  ["the integrated circuit",1958,"Jack Kilby",2],
  ["the microprocessor",1971,"Intel",1],
  ["the Macintosh",1984,"Apple",1],
  ["the iPhone",2007,"Apple",0],
  ["the iPad",2010,"Apple",1],
  ["the iPod",2001,"Apple",1],
  ["the Walkman",1979,"Sony",1],
  ["the compact disc",1982,"",1],
  ["the DVD",1996,"",2],
  ["the floppy disk",1971,"IBM",2],
  ["the hard disk drive",1956,"IBM",2],
  ["USB",1996,"",2],
  ["Bluetooth",1998,"",2],
  ["Wi-Fi",1997,"",1],
  ["email",1971,"Ray Tomlinson",1],
  ["the first website",1991,"",2],
  ["Google Search",1998,"",1],
  ["the first handheld mobile phone call",1973,"Martin Cooper at Motorola",1],
  ["the first SMS text message",1992,"",2],
  ["the camera phone",2000,"",2],
  ["the digital camera",1975,"a Kodak engineer, Steven Sasson",2],
  ["the laser",1960,"",2],
  ["the scanned barcode",1974,"",2],
  ["the QR code",1994,"Denso Wave",2],
  ["the ATM",1967,"",2],
  ["the credit card (Diners Club)",1950,"",2],
  ["the lithium-ion battery (commercial)",1991,"Sony",2],
  ["the silicon solar cell",1954,"Bell Labs",2],
  ["ENIAC, the room-sized computer",1945,"",1],
  ["Morse code",1838,"Samuel Morse",1],
  ["the ballpoint pen",1938,"László Bíró",2],
  ["Velcro",1955,"George de Mestral",2],
  ["the zipper (modern)",1913,"",2],
  ["the microwave oven",1945,"Percy Spencer",1],
  ["the television remote control",1955,"",2],
];

/** [acronym, correct expansion, three plausible fakes, tier] */
const ACRONYMS: [string, string, string, string, string, Tier][] = [
  ["CPU","Central Processing Unit","Computer Power Unit","Central Program Utility","Core Processing Uplink",0],
  ["RAM","Random Access Memory","Rapid Action Memory","Read And Modify","Remote Access Module",0],
  ["USB","Universal Serial Bus","United System Board","Universal Signal Base","Uniform Socket Bridge",0],
  ["WWW","World Wide Web","World Web Window","Wide Web Works","Web World Wide",0],
  ["PDF","Portable Document Format","Printed Data File","Public Document Folder","Portable Data Font",0],
  ["GPS","Global Positioning System","General Position Service","Geographic Point Scanner","Global Path Signal",0],
  ["AI","Artificial Intelligence","Automated Interface","Advanced Integration","Algorithmic Input",0],
  ["VR","Virtual Reality","Visual Rendering","Vector Resolution","Variable Response",0],
  ["FAQ","Frequently Asked Questions","Fast Answer Queue","First Aid Questions","Filed Answer Quotes",0],
  ["LOL","Laughing Out Loud","Lots Of Love — officially","Loud Online Laughter","Laugh On Line",0],
  ["URL","Uniform Resource Locator","Universal Reference Link","Unified Routing Label","User Resource Login",1],
  ["HTML","HyperText Markup Language","HighText Machine Language","Hyperlink Text Management Logic","Home Tool Markup Library",1],
  ["HTTP","HyperText Transfer Protocol","High Text Transmission Process","Hyperlink Tracking Transport Plan","Host Text Transfer Program",1],
  ["GIF","Graphics Interchange Format","General Image File","Graphic Index Frame","Grouped Image Form",1],
  ["SIM","Subscriber Identity Module","Signal Input Memory","Secure Identification Mark","System Interface Map",1],
  ["SMS","Short Message Service","Simple Mail System","Standard Messaging Signal","Small Message Stream",1],
  ["LED","Light-Emitting Diode","Low-Energy Display","Luminous Electric Device","Light-Enhancing Dial",1],
  ["LCD","Liquid Crystal Display","Light Cell Diode","Layered Colour Display","Low Current Display",1],
  ["VPN","Virtual Private Network","Verified Public Node","Variable Path Navigator","Virtual Public Network",1],
  ["ISP","Internet Service Provider","Integrated System Portal","Internet Signal Protocol","Internal Server Program",1],
  ["SSD","Solid-State Drive","Super Speed Disk","Secure Storage Device","Serial System Drive",1],
  ["HDD","Hard Disk Drive","Heavy Data Device","High-Density Drive","Hard Data Depot",1],
  ["ROM","Read-Only Memory","Remote Operating Module","Rapid Output Mode","Reserve Onboard Memory",1],
  ["PIN","Personal Identification Number","Private Internet Name","Passcode Index Number","Personal Input Code",1],
  ["LASER","Light Amplification by Stimulated Emission of Radiation","Luminous Array of Synchronised Electric Rays","Light Advancing through Sequential Energy Release","Linear Amplified Spectrum of Emitted Radiation",2],
  ["RADAR","Radio Detection and Ranging","Rapid Aerial Detection and Response","Radio Amplitude Direction and Range","Remote Airborne Detection and Reconnaissance",2],
  ["HDMI","High-Definition Multimedia Interface","High-Density Media Input","Home Digital Media Integration","High-Definition Monitor Input",2],
  ["DNS","Domain Name System","Digital Network Service","Data Node Server","Direct Name Search",2],
  ["BIOS","Basic Input/Output System","Binary Integrated Operating Software","Boot Instruction Operating Sequence","Base Internal Output Signal",2],
  ["CAPTCHA","Completely Automated Public Turing test to tell Computers and Humans Apart","Computer-Aided Program To Check Human Activity","Central Authority Protocol To Confirm Human Access","Coded Access Pattern To Catch Hostile Automation",2],
  ["API","Application Programming Interface","Automated Process Integration","Advanced Program Instruction","Applied Protocol Index",2],
  ["Wi-Fi","Nothing — it's just a brand name","Wireless Fidelity","Wide Frequency","Wireless Field",2],
];

/** [language or system, creator, year, tier] */
const LANGS: [string, string, number, Tier][] = [
  ["Python","Guido van Rossum",1991,1],
  ["JavaScript","Brendan Eich",1995,1],
  ["Linux","Linus Torvalds",1991,1],
  ["Java","James Gosling",1995,2],
  ["C","Dennis Ritchie",1972,2],
  ["C++","Bjarne Stroustrup",1985,2],
  ["Ruby","Yukihiro Matsumoto",1995,2],
  ["Fortran","John Backus's team at IBM",1957,2],
  ["COBOL","a committee inspired by Grace Hopper",1959,2],
  ["BASIC","Kemeny and Kurtz at Dartmouth",1964,2],
];

export function buildTech(): TriviaQuestion[] {
  const bank = new Bank("Tech", 19760401);

  /* ---- companies ----------------------------------------------------------- */
  for (const [company, founders, year, knownFor, t] of COMPANIES) {
    if (founders) {
      const wrongFounders = [...new Set(bank.pickN(COMPANIES, 8, (c) => !!c[1] && c[1] !== founders).map((c) => c[1]))];
      bank.push(t, `Who founded ${company}?`, founders, wrongFounders.slice(0, 3),
        `Think ${decadeOf(year)}.`);
      const wrongCompanies = bank.pickN(COMPANIES, 6, (c) => c[0] !== company).map((c) => c[0]);
      bank.push(t, `${founders} founded which company?`, company, wrongCompanies.slice(0, 3));
    }
    const wrongCos = bank.pickN(COMPANIES, 6, (c) => c[0] !== company).map((c) => c[0]);
    bank.push(t, `Which company is best known for ${knownFor}?`, company, wrongCos.slice(0, 3));
  }

  /* ---- inventions ------------------------------------------------------------ */
  for (const [invention, year, inventor, t] of INVENTIONS) {
    if (inventor) {
      const wrongInventors = [...new Set(bank.pickN(INVENTIONS, 8, (i) => !!i[2] && i[2] !== inventor).map((i) => i[2]))];
      bank.push(t, `Who gave the world ${invention}?`, inventor, wrongInventors.slice(0, 3),
        `Think ${decadeOf(year)}.`);
    }
    bank.push(t, `In which decade did ${invention} arrive?`, decadeOf(year),
      decadeWrongs(bank.rng, year), undefined, `${capitalise(invention)} — ${year}.`);
    bank.push(2, `In which year did ${invention} arrive?`, String(year),
      yearWrongs(bank.rng, year, 5).map((s) => s.replace(" BC", "")));
  }

  /* ---- acronyms ---------------------------------------------------------------- */
  for (const [acronym, correct, f1, f2, f3, t] of ACRONYMS) {
    bank.push(t, `What does ${acronym} stand for?`, correct, [f1, f2, f3]);
  }

  /* ---- languages ------------------------------------------------------------------ */
  for (const [lang, creator, year, t] of LANGS) {
    const wrongCreators = bank.pickN(LANGS, 6, (l) => l[1] !== creator).map((l) => l[1]);
    bank.push(t, `Who created ${lang}?`, creator, wrongCreators.slice(0, 3), `Think ${decadeOf(year)}.`);
    const wrongLangs = bank.pickN(LANGS, 6, (l) => l[0] !== lang).map((l) => l[0]);
    bank.push(t, `${creator} created which of these?`, lang, wrongLangs.slice(0, 3));
  }

  /* ---- fills per tier ---------------------------------------------------------------- */
  type Dated = { label: string; year: number; tier: Tier };
  const dated: Dated[] = [
    ...INVENTIONS.map(([label, year, , tier]) => ({ label, year, tier })),
    ...COMPANIES.map(([company, , year, , tier]) => ({ label: `the founding of ${company}`, year, tier })),
    ...LANGS.map(([lang, , year, tier]) => ({ label: `the release of ${lang}`, year, tier })),
  ];
  const gaps: [number, number, number] = [25, 9, 3];

  for (const t of [0, 1, 2] as Tier[]) {
    const target = TIER_TARGETS[t];
    const pool = dated.filter((d) => (t === 0 ? d.tier === 0 : d.tier <= t));

    bank.fillSuperlative(t, Math.floor(target * 0.35), pool, (d) => d.year, gaps[t], false,
      (_four, best) => ({
        q: "Which of these came first?",
        label: (d) => capitalise(d.label),
        note: `${capitalise(best.label)} — ${best.year}.`,
      }));
    bank.fillSuperlative(t, Math.floor(target * 0.6), pool, (d) => d.year, gaps[t], true,
      (_four, best) => ({
        q: "Which of these is the most recent?",
        label: (d) => capitalise(d.label),
        note: `${capitalise(best.label)} — ${best.year}.`,
      }));

    // known-for re-asks with fresh line-ups (catch-all)
    const coPool = COMPANIES.filter((c) => (t === 0 ? c[4] === 0 : c[4] <= t));
    bank.fill(t, target, () => {
      const c = bank.one(coPool);
      const wrongs = bank.pickN(COMPANIES, 6, (x) => x[0] !== c[0]).map((x) => x[0]);
      bank.push(t, `Which company is best known for ${c[3]}?`, c[0], wrongs.slice(0, 3));
    });
  }

  return bank.qs;
}

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
