/**
 * Categories for the redesigned Higher or Lower chain.
 * Values are widely published approximate figures.
 */

export interface ComparisonItem {
  name: string;
  detail: string;
  value: number;
}

export interface ComparisonCategory {
  id: string;
  label: string;
  unit: string;
  question: string;
  items: ComparisonItem[];
}

export const COMPARISON_CATEGORIES: ComparisonCategory[] = [
  {
    id: "population",
    label: "Country population",
    unit: "million people",
    question: "Which country holds more people?",
    items: [
      { name: "Japan", detail: "East Asia", value: 124 },
      { name: "Mexico", detail: "North America", value: 128 },
      { name: "Vietnam", detail: "Southeast Asia", value: 99 },
      { name: "Germany", detail: "Central Europe", value: 84 },
      { name: "Turkiye", detail: "Anatolia", value: 85 },
      { name: "France", detail: "Western Europe", value: 68 },
      { name: "Italy", detail: "Southern Europe", value: 59 },
      { name: "Kenya", detail: "East Africa", value: 55 },
      { name: "Spain", detail: "Iberian Peninsula", value: 48 },
      { name: "Canada", detail: "North America", value: 40 },
      { name: "Australia", detail: "Oceania", value: 26 },
      { name: "Netherlands", detail: "Western Europe", value: 18 },
      { name: "Portugal", detail: "Iberian Peninsula", value: 10 },
      { name: "New Zealand", detail: "Oceania", value: 5 },
      { name: "Iceland", detail: "North Atlantic", value: 0.4 },
    ],
  },
  {
    id: "heights",
    label: "Height above ground",
    unit: "metres",
    question: "Which one rises higher?",
    items: [
      { name: "Mount Everest", detail: "Himalayas", value: 8849 },
      { name: "Denali", detail: "Alaska", value: 6190 },
      { name: "Kilimanjaro", detail: "Tanzania", value: 5895 },
      { name: "Mont Blanc", detail: "Alps", value: 4808 },
      { name: "Mount Fuji", detail: "Japan", value: 3776 },
      { name: "Angel Falls", detail: "Venezuela, tallest waterfall", value: 979 },
      { name: "Burj Khalifa", detail: "Dubai skyscraper", value: 828 },
      { name: "Shanghai Tower", detail: "Chinese skyscraper", value: 632 },
      { name: "CN Tower", detail: "Toronto", value: 553 },
      { name: "Eiffel Tower", detail: "Paris", value: 330 },
      { name: "Great Pyramid of Giza", detail: "Egypt", value: 139 },
      { name: "Statue of Liberty", detail: "New York, with pedestal", value: 93 },
      { name: "Leaning Tower of Pisa", detail: "Italy", value: 57 },
    ],
  },
  {
    id: "rivers",
    label: "River length",
    unit: "kilometres",
    question: "Which river runs longer?",
    items: [
      { name: "Nile", detail: "Northeast Africa", value: 6650 },
      { name: "Amazon", detail: "South America", value: 6400 },
      { name: "Yangtze", detail: "China", value: 6300 },
      { name: "Mississippi", detail: "United States", value: 3766 },
      { name: "Volga", detail: "Russia", value: 3531 },
      { name: "Danube", detail: "Central Europe", value: 2850 },
      { name: "Ganges", detail: "South Asia", value: 2525 },
      { name: "Colorado", detail: "North America", value: 2330 },
      { name: "Rhine", detail: "Western Europe", value: 1230 },
      { name: "Seine", detail: "France", value: 777 },
      { name: "Thames", detail: "England", value: 346 },
      { name: "Mekong", detail: "Southeast Asia", value: 4350 },
    ],
  },
  {
    id: "lifespans",
    label: "Typical lifespan",
    unit: "years",
    question: "Which creature usually lives longer?",
    items: [
      { name: "Bowhead whale", detail: "Arctic seas", value: 200 },
      { name: "Galapagos tortoise", detail: "Island giant", value: 100 },
      { name: "African elephant", detail: "Savannah", value: 65 },
      { name: "Macaw", detail: "Rainforest parrot", value: 50 },
      { name: "Koi carp", detail: "Ornamental pond fish", value: 40 },
      { name: "Horse", detail: "Domesticated", value: 27 },
      { name: "Brown bear", detail: "Forests and mountains", value: 25 },
      { name: "Cat", detail: "Domesticated", value: 15 },
      { name: "Dog", detail: "Domesticated", value: 13 },
      { name: "Rabbit", detail: "Domesticated", value: 9 },
      { name: "Octopus", detail: "Common species", value: 2 },
    ],
  },
  {
    id: "inventions",
    label: "Year it arrived",
    unit: "",
    question: "Which came along later?",
    items: [
      { name: "Printing press", detail: "Movable type in Europe", value: 1440 },
      { name: "Telescope", detail: "First patent application", value: 1608 },
      { name: "Piano", detail: "The first fortepiano", value: 1700 },
      { name: "Steam engine", detail: "First practical engine", value: 1712 },
      { name: "Hot-air balloon flight", detail: "First crewed flight", value: 1783 },
      { name: "Photography", detail: "Oldest surviving photograph", value: 1826 },
      { name: "Telephone", detail: "First patent", value: 1876 },
      { name: "Radio transmission", detail: "First long-distance signals", value: 1895 },
      { name: "Television", detail: "First working demonstration", value: 1926 },
      { name: "Microwave oven", detail: "First commercial model", value: 1946 },
      { name: "ARPANET", detail: "Ancestor of the internet", value: 1969 },
      { name: "World Wide Web", detail: "Proposal at CERN", value: 1989 },
    ],
  },
  {
    id: "speeds",
    label: "Top speed",
    unit: "km/h",
    question: "Which one moves faster at full tilt?",
    items: [
      { name: "Peregrine falcon", detail: "In a hunting dive", value: 390 },
      { name: "Cheetah", detail: "Fastest land sprinter", value: 120 },
      { name: "Sailfish", detail: "Fastest fish", value: 110 },
      { name: "Greyhound", detail: "Racing dog", value: 72 },
      { name: "Horse", detail: "At full gallop", value: 70 },
      { name: "Hare", detail: "Zig-zag escape artist", value: 60 },
      { name: "House cat", detail: "Short bursts", value: 48 },
      { name: "African elephant", detail: "Surprisingly quick charge", value: 40 },
      { name: "Human sprinter", detail: "World-record pace", value: 37 },
      { name: "Honeybee", detail: "Cruising flight", value: 24 },
      { name: "Giant tortoise", detail: "Steady as ever", value: 0.3 },
    ],
  },
];
