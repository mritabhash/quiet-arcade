/** Cities for Map Drop, with latitude/longitude, plus stylised continent outlines. */

export interface City {
  name: string;
  country: string;
  lat: number;
  lon: number;
}

export const CITIES: City[] = [
  { name: "Cairo", country: "Egypt", lat: 30.04, lon: 31.24 },
  { name: "Paris", country: "France", lat: 48.85, lon: 2.35 },
  { name: "New York", country: "United States", lat: 40.71, lon: -74.01 },
  { name: "Tokyo", country: "Japan", lat: 35.68, lon: 139.69 },
  { name: "Sydney", country: "Australia", lat: -33.87, lon: 151.21 },
  { name: "Rio de Janeiro", country: "Brazil", lat: -22.91, lon: -43.17 },
  { name: "Cape Town", country: "South Africa", lat: -33.92, lon: 18.42 },
  { name: "Moscow", country: "Russia", lat: 55.76, lon: 37.62 },
  { name: "Beijing", country: "China", lat: 39.9, lon: 116.4 },
  { name: "Mumbai", country: "India", lat: 19.08, lon: 72.88 },
  { name: "Mexico City", country: "Mexico", lat: 19.43, lon: -99.13 },
  { name: "Lima", country: "Peru", lat: -12.05, lon: -77.04 },
  { name: "Toronto", country: "Canada", lat: 43.65, lon: -79.38 },
  { name: "London", country: "United Kingdom", lat: 51.51, lon: -0.13 },
  { name: "Madrid", country: "Spain", lat: 40.42, lon: -3.7 },
  { name: "Rome", country: "Italy", lat: 41.9, lon: 12.5 },
  { name: "Berlin", country: "Germany", lat: 52.52, lon: 13.4 },
  { name: "Athens", country: "Greece", lat: 37.98, lon: 23.73 },
  { name: "Istanbul", country: "Türkiye", lat: 41.01, lon: 28.98 },
  { name: "Dubai", country: "United Arab Emirates", lat: 25.2, lon: 55.27 },
  { name: "Nairobi", country: "Kenya", lat: -1.29, lon: 36.82 },
  { name: "Lagos", country: "Nigeria", lat: 6.46, lon: 3.39 },
  { name: "Casablanca", country: "Morocco", lat: 33.57, lon: -7.59 },
  { name: "Bangkok", country: "Thailand", lat: 13.76, lon: 100.5 },
  { name: "Singapore", country: "Singapore", lat: 1.35, lon: 103.82 },
  { name: "Jakarta", country: "Indonesia", lat: -6.21, lon: 106.85 },
  { name: "Seoul", country: "South Korea", lat: 37.57, lon: 126.98 },
  { name: "Buenos Aires", country: "Argentina", lat: -34.6, lon: -58.38 },
  { name: "Santiago", country: "Chile", lat: -33.45, lon: -70.67 },
  { name: "Bogotá", country: "Colombia", lat: 4.71, lon: -74.07 },
  { name: "Vancouver", country: "Canada", lat: 49.28, lon: -123.12 },
  { name: "San Francisco", country: "United States", lat: 37.77, lon: -122.42 },
  { name: "Anchorage", country: "United States", lat: 61.22, lon: -149.9 },
  { name: "Honolulu", country: "United States", lat: 21.31, lon: -157.86 },
  { name: "Reykjavik", country: "Iceland", lat: 64.15, lon: -21.94 },
  { name: "Oslo", country: "Norway", lat: 59.91, lon: 10.75 },
  { name: "Helsinki", country: "Finland", lat: 60.17, lon: 24.94 },
  { name: "Auckland", country: "New Zealand", lat: -36.85, lon: 174.76 },
  { name: "Perth", country: "Australia", lat: -31.95, lon: 115.86 },
  { name: "Kathmandu", country: "Nepal", lat: 27.7, lon: 85.32 },
  { name: "Havana", country: "Cuba", lat: 23.11, lon: -82.37 },
  { name: "Lisbon", country: "Portugal", lat: 38.72, lon: -9.14 },
];

/**
 * Deliberately low-poly continent outlines as [lon, lat] rings.
 * They are stylised - the map is a piece of the Quiet Arcade world,
 * not a survey document.
 */
export const CONTINENTS: [number, number][][] = [
  // North America
  [
    [-168, 66], [-158, 71], [-140, 70], [-124, 71], [-110, 73], [-96, 72], [-85, 70],
    [-76, 63], [-60, 60], [-55, 52], [-65, 45], [-70, 42], [-75, 35], [-81, 31],
    [-80, 25], [-84, 30], [-90, 29], [-97, 26], [-97, 21], [-94, 18], [-83, 9],
    [-80, 8], [-92, 14], [-105, 20], [-110, 23], [-114, 30], [-121, 34], [-124, 40],
    [-125, 49], [-132, 55], [-140, 59], [-152, 58], [-165, 54], [-168, 60],
  ],
  // Greenland
  [
    [-58, 76], [-40, 83], [-20, 82], [-22, 70], [-30, 68], [-42, 60], [-48, 61], [-53, 66], [-60, 70],
  ],
  // South America
  [
    [-77, 8], [-70, 11], [-60, 9], [-52, 5], [-44, -2], [-35, -7], [-39, -13],
    [-40, -20], [-48, -25], [-53, -33], [-58, -34], [-62, -39], [-65, -41],
    [-65, -47], [-69, -52], [-74, -53], [-75, -46], [-73, -37], [-71, -30],
    [-70, -18], [-77, -12], [-81, -5], [-80, 0], [-77, 8],
  ],
  // Africa
  [
    [-17, 15], [-16, 22], [-10, 29], [-6, 35], [0, 37], [10, 37], [20, 32],
    [32, 31], [34, 28], [37, 21], [43, 12], [51, 12], [46, 2], [41, -2],
    [40, -10], [35, -20], [33, -26], [27, -33], [20, -35], [17, -30], [12, -18],
    [13, -10], [9, -1], [8, 4], [-4, 5], [-8, 5], [-13, 9], [-17, 15],
  ],
  // Europe
  [
    [-9, 37], [-9, 43], [-2, 44], [-5, 48], [-2, 49], [2, 51], [8, 54], [8, 57],
    [5, 58], [5, 62], [12, 65], [15, 69], [26, 71], [30, 70], [30, 60], [24, 57],
    [21, 55], [30, 55], [34, 46], [28, 41], [23, 37], [18, 40], [16, 38], [15, 40],
    [12, 44], [6, 43], [3, 40], [0, 39], [-2, 36], [-5, 36], [-9, 37],
  ],
  // Asia
  [
    [30, 70], [40, 68], [55, 71], [70, 73], [90, 76], [105, 77], [120, 73],
    [140, 72], [160, 70], [179, 66], [170, 60], [162, 59], [156, 51], [142, 54],
    [140, 48], [135, 43], [127, 40], [121, 39], [121, 31], [116, 23], [108, 18],
    [105, 9], [103, 1], [100, 7], [98, 12], [94, 18], [90, 22], [85, 19],
    [80, 15], [80, 8], [76, 8], [72, 20], [66, 25], [61, 25], [57, 26],
    [56, 24], [58, 22], [55, 17], [52, 13], [43, 12], [37, 21], [34, 28],
    [32, 31], [36, 36], [30, 41], [34, 46], [30, 55], [30, 70],
  ],
  // Australia
  [
    [114, -22], [118, -20], [122, -17], [131, -12], [136, -12], [140, -17],
    [143, -11], [146, -19], [149, -21], [153, -27], [152, -32], [150, -37],
    [146, -39], [140, -38], [135, -35], [131, -32], [124, -33], [118, -35],
    [115, -34], [113, -26], [114, -22],
  ],
  // Southeast Asian islands (stylised)
  [
    [95, 5], [99, 2], [104, -3], [106, -6], [102, -4], [96, 2], [95, 5],
  ],
  [
    [105, -6], [114, -7], [114, -8], [106, -8], [105, -6],
  ],
  [
    [109, 1], [114, 4], [118, 5], [117, 0], [113, -3], [109, -1], [109, 1],
  ],
  [
    [131, -1], [138, -2], [146, -7], [143, -9], [135, -4], [131, -2], [131, -1],
  ],
  // Japan (stylised arc)
  [
    [140, 45], [143, 44], [141, 41], [140, 37], [137, 35], [132, 34], [130, 32],
    [131, 34], [135, 36], [139, 40], [140, 45],
  ],
  // British Isles
  [
    [-5, 50], [-3, 53], [-5, 55], [-4, 58], [-2, 57], [0, 53], [1, 51], [-5, 50],
  ],
  [
    [-10, 52], [-8, 55], [-6, 54], [-6, 52], [-10, 52],
  ],
  // Madagascar
  [
    [44, -16], [50, -16], [49, -22], [45, -25], [43, -21], [44, -16],
  ],
  // New Zealand
  [
    [173, -35], [176, -38], [178, -38], [175, -41], [173, -39], [173, -35],
  ],
  [
    [172, -41], [174, -42], [171, -46], [167, -46], [170, -42], [172, -41],
  ],
];

/** Haversine distance in km between two lat/lon points. */
export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
