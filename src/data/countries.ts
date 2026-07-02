/** Countries for Globe Hunt. Five clues each, revealed in order. */

export interface Country {
  name: string;
  clues: [string, string, string, string, string];
}

function c(
  name: string,
  continent: string,
  size: string,
  fact: string,
  people: string,
  flag: string,
  capital: string,
): Country {
  return {
    name,
    clues: [
      `${continent} - ${size}.`,
      fact,
      people,
      `Its flag shows ${flag}.`,
      `Its capital is ${capital}.`,
    ],
  };
}

export const COUNTRIES: Country[] = [
  c("Japan", "East Asia", "an island archipelago", "Home to bullet trains, onsen towns, and a famous snow-capped volcano.", "Around 124 million people live here.", "a single crimson disc on white", "Tokyo"),
  c("Egypt", "North Africa", "a large, mostly desert country", "A single great river valley has fed its civilisations for 5,000 years.", "Over 100 million people, most living along one river.", "red, white, and black bands with a golden eagle", "Cairo"),
  c("Brazil", "South America", "the continent's largest country", "It holds most of the world's largest rainforest and loves football deeply.", "More than 210 million people.", "a green field, a yellow diamond, and a starry blue globe", "Brasilia"),
  c("Australia", "Oceania", "a continent-sized country", "Famous for a giant red monolith and animals found nowhere else.", "About 26 million people, mostly along the coasts.", "a blue field with the Southern Cross and a large seven-pointed star", "Canberra"),
  c("Canada", "North America", "the world's second-largest country", "Known for maple syrup, vast boreal forests, and very polite winters.", "About 40 million people, most within 200 km of one border.", "a red maple leaf between two red bands", "Ottawa"),
  c("India", "South Asia", "a vast subcontinent", "Home to a marble mausoleum built for an empress, and to a billion cups of chai a day.", "The world's most populous country.", "saffron, white, and green with a navy wheel", "New Delhi"),
  c("Iceland", "Northern Europe", "a small island nation", "Volcanoes, geysers, and glaciers share this island near the Arctic Circle.", "Fewer than half a million people.", "a red-and-white cross on deep blue", "Reykjavik"),
  c("Morocco", "North Africa", "a medium-sized kingdom", "Blue-washed towns, mint tea, and a famous square full of storytellers.", "About 37 million people.", "a green five-pointed star on red", "Rabat"),
  c("Peru", "South America", "a medium-large Andean country", "A lost stone citadel sits high in its misty mountains.", "Around 34 million people.", "red and white vertical bands", "Lima"),
  c("New Zealand", "Oceania", "two main islands and many small ones", "Fjords, glowworm caves, and more sheep than people.", "About 5 million people.", "a blue field with four red stars of the Southern Cross", "Wellington"),
  c("Greece", "Southern Europe", "a peninsula with thousands of islands", "Philosophy, olives, and white-washed villages above a wine-dark sea.", "Around 10 million people.", "nine blue-and-white stripes with a cross", "Athens"),
  c("Kenya", "East Africa", "a medium-sized country on the equator", "Great herds cross its savannahs in one of Earth's largest migrations.", "About 55 million people.", "black, red, and green with a Maasai shield", "Nairobi"),
  c("Norway", "Northern Europe", "a long, narrow country", "Deep fjords, midnight sun, and a large sovereign wealth fund.", "About 5.5 million people.", "a blue cross outlined in white on red", "Oslo"),
  c("Mexico", "North America", "a large country bridging two continents' cultures", "Ancient pyramids, mariachi, and eleven UNESCO-listed cuisines' worth of flavour.", "Nearly 130 million people.", "green, white, and red with an eagle on a cactus", "Mexico City"),
  c("Vietnam", "Southeast Asia", "a long S-shaped country", "Limestone karsts rise from an emerald bay in its north.", "Nearly 100 million people.", "a single gold star on red", "Hanoi"),
  c("Portugal", "Southern Europe", "a small Atlantic-facing country", "Azulejo tiles, melancholy fado music, and a golden age of navigators.", "About 10 million people.", "green and red with an armillary sphere", "Lisbon"),
  c("Jordan", "Western Asia", "a small desert kingdom", "A rose-red city carved into cliffs hides in its southern desert.", "About 11 million people.", "black, white, and green bands with a red triangle and star", "Amman"),
  c("Argentina", "South America", "the continent's second-largest country", "Tango, gauchos, and glaciers that calve into milky lakes.", "About 46 million people.", "sky-blue and white bands with a golden sun", "Buenos Aires"),
  c("Finland", "Northern Europe", "a forested northern country", "Saunas outnumber cars, and its lakes number in the hundreds of thousands.", "About 5.5 million people.", "a blue cross on white", "Helsinki"),
  c("Türkiye", "straddling Europe and Asia", "a large peninsula nation", "Fairy chimneys, a grand covered bazaar, and hot-air balloons at dawn.", "About 85 million people.", "a white crescent and star on red", "Ankara"),
  c("South Africa", "Southern Africa", "a large country with three capitals", "A flat-topped mountain watches over its most famous harbour city.", "About 60 million people.", "six colours in a sideways Y", "Pretoria"),
  c("Ireland", "Northern Europe", "a small green island", "Dramatic sea cliffs, round towers, and a literary capital of storytellers.", "Just over 5 million people.", "green, white, and orange vertical bands", "Dublin"),
  c("Thailand", "Southeast Asia", "a medium-sized kingdom", "Golden temples, floating markets, and islands of limestone towers.", "About 72 million people.", "red, white, and blue horizontal stripes", "Bangkok"),
  c("Switzerland", "Central Europe", "a small landlocked country", "Alpine peaks, precise clocks, and four national languages.", "About 9 million people.", "a white cross on a square red field", "Bern"),
];
