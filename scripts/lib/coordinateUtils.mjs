/** Shared coordinate helpers for import/fix scripts (mirrors src/lib/geo.ts). */

export const COUNTRY_CENTROIDS = {
  AR: { lat: -38.4161, lng: -63.6167 },
  AT: { lat: 47.5162, lng: 14.5501 },
  AU: { lat: -25.2744, lng: 133.7751 },
  BE: { lat: 50.5039, lng: 4.4699 },
  BR: { lat: -14.235, lng: -51.9253 },
  CA: { lat: 56.1304, lng: -106.3468 },
  CH: { lat: 46.8182, lng: 8.2275 },
  CL: { lat: -35.6751, lng: -71.543 },
  CN: { lat: 35.8617, lng: 104.1954 },
  CO: { lat: 4.5709, lng: -74.2973 },
  CZ: { lat: 49.8175, lng: 15.473 },
  DE: { lat: 51.1657, lng: 10.4515 },
  DK: { lat: 56.2639, lng: 9.5018 },
  EG: { lat: 26.8206, lng: 30.8025 },
  ES: { lat: 40.4637, lng: -3.7492 },
  FI: { lat: 61.9241, lng: 25.7482 },
  FR: { lat: 46.2276, lng: 2.2137 },
  GB: { lat: 54.5, lng: -2.5 },
  GR: { lat: 39.0742, lng: 21.8243 },
  HU: { lat: 47.1625, lng: 19.5033 },
  ID: { lat: -0.7893, lng: 113.9213 },
  IE: { lat: 53.4129, lng: -8.2439 },
  IL: { lat: 31.0461, lng: 34.8516 },
  IN: { lat: 20.5937, lng: 78.9629 },
  IR: { lat: 32.4279, lng: 53.688 },
  IT: { lat: 41.8719, lng: 12.5674 },
  JP: { lat: 36.2048, lng: 138.2529 },
  KE: { lat: -0.0236, lng: 37.9062 },
  KR: { lat: 35.9078, lng: 127.7669 },
  MX: { lat: 23.6345, lng: -102.5528 },
  MY: { lat: 4.2105, lng: 101.9758 },
  NG: { lat: 9.082, lng: 8.6753 },
  NL: { lat: 52.1326, lng: 5.2913 },
  NO: { lat: 60.472, lng: 8.4689 },
  NZ: { lat: -40.9006, lng: 174.886 },
  PE: { lat: -9.19, lng: -75.0152 },
  PH: { lat: 12.8797, lng: 121.774 },
  PK: { lat: 30.3753, lng: 69.3451 },
  PL: { lat: 51.9194, lng: 19.1451 },
  PT: { lat: 39.3999, lng: -8.2245 },
  RO: { lat: 45.9432, lng: 24.9668 },
  RU: { lat: 61.524, lng: 105.3188 },
  SE: { lat: 60.1282, lng: 18.6435 },
  SG: { lat: 1.3521, lng: 103.8198 },
  TH: { lat: 15.87, lng: 100.9925 },
  TR: { lat: 38.9637, lng: 35.2433 },
  TW: { lat: 23.6978, lng: 120.9605 },
  UA: { lat: 48.3794, lng: 31.1656 },
  US: { lat: 39.8283, lng: -98.5795 },
  VN: { lat: 14.0583, lng: 108.2772 },
  ZA: { lat: -30.5595, lng: 22.9375 },
  IQ: { lat: 33.2232, lng: 43.6793 },
  BD: { lat: 23.685, lng: 90.3563 },
  LV: { lat: 56.8796, lng: 24.6032 },
  ET: { lat: 9.145, lng: 40.4897 },
  SA: { lat: 23.8859, lng: 45.0792 },
  RS: { lat: 44.0165, lng: 21.0059 },
  BG: { lat: 42.7339, lng: 25.4858 },
  SK: { lat: 48.669, lng: 19.699 },
  MK: { lat: 41.5124, lng: 21.7453 },
  UZ: { lat: 41.3775, lng: 64.5853 },
  OTHER: { lat: 20, lng: 0 },
};

export const CITY_FROM_TEXT = [
  [/\bsadr city\b/, { lat: 33.3803, lng: 44.395 }],
  [/\bodesa\b|\bodessa\b/, { lat: 46.4825, lng: 30.7233 }],
  [/\bbaghdad\b/, { lat: 33.3152, lng: 44.3661 }],
  [/\bkabul\b/, { lat: 34.5553, lng: 69.2075 }],
  [/\b(fez|fes)\b/, { lat: 34.0181, lng: -5.0078 }],
  [/\b(new york|nyc|manhattan|brooklyn|bronx)\b/, { lat: 40.7128, lng: -74.006 }],
  [/\blos angeles\b/, { lat: 34.0522, lng: -118.2437 }],
  [/\bsan francisco\b/, { lat: 37.7749, lng: -122.4194 }],
  [/\bchicago\b/, { lat: 41.8781, lng: -87.6298 }],
  [/\bboston\b/, { lat: 42.3601, lng: -71.0589 }],
  [/\bnew orleans\b/, { lat: 29.9511, lng: -90.0715 }],
  [/\blas vegas\b/, { lat: 36.1699, lng: -115.1398 }],
  [/\bseattle\b/, { lat: 47.6062, lng: -122.3321 }],
  [/\blondon\b/, { lat: 51.5074, lng: -0.1278 }],
  [/\bparis\b/, { lat: 48.8566, lng: 2.3522 }],
  [/\bberlin\b/, { lat: 52.52, lng: 13.405 }],
  [/\bmoscow\b/, { lat: 55.7558, lng: 37.6173 }],
  [/\b(kyiv|kiev)\b/, { lat: 50.4501, lng: 30.5234 }],
  [/\bbeirut\b/, { lat: 33.8938, lng: 35.5018 }],
  [/\bjerusalem\b/, { lat: 31.7683, lng: 35.2137 }],
  [/\btokyo\b/, { lat: 35.6762, lng: 139.6503 }],
  [/\bsydney\b/, { lat: -33.8688, lng: 151.2093 }],
  [/\bmelbourne\b/, { lat: -37.8136, lng: 144.9631 }],
  [/\b(columbine|littleton)\b/, { lat: 39.6133, lng: -105.0166 }],
  [/\boklahoma city\b/, { lat: 35.4676, lng: -97.5164 }],
  [/\bwhitechapel\b/, { lat: 51.5154, lng: -0.0606 }],
];

export function isInvalidMapCoord(lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return true;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return true;
  if (Math.abs(lat) < 0.05 && Math.abs(lng) < 0.05) return true;
  if (Math.abs(lat - 20) < 0.05 && Math.abs(lng) < 0.05) return true;
  return false;
}

export function inferCityFromText(text) {
  const lower = text.toLowerCase();
  for (const [pattern, point] of CITY_FROM_TEXT) {
    if (pattern.test(lower)) return point;
  }
  return null;
}

export function resolveImportedCaseGeo(c) {
  const text = `${c.name} ${c.location} ${c.jurisdiction}`;
  if (typeof c.lat === "number" && typeof c.lng === "number" && !isInvalidMapCoord(c.lat, c.lng)) {
    return { point: { lat: c.lat, lng: c.lng }, accuracy: "city" };
  }
  const city = inferCityFromText(text);
  if (city) return { point: city, accuracy: "city" };
  let country = c.country ?? "OTHER";
  if (country === "OTHER") {
    country = inferCountryFromText(text);
  }
  if (country !== "OTHER" && COUNTRY_CENTROIDS[country]) {
    return { point: COUNTRY_CENTROIDS[country], accuracy: "centroid" };
  }
  return null;
}

const COUNTRY_TEXT_PATTERNS = [
  [/\b(iraq|baghdad)\b/, "IQ"],
  [/\b(ukraine|ukrainian|kyiv|kiev)\b/, "UA"],
  [/\b(russia|russian|moscow)\b/, "RU"],
  [/\b(united states|u\.s\.|usa\b)/, "US"],
  [/\b(united kingdom|england|scotland|wales| london\b)/, "GB"],
  [/\bgermany|german\b/, "DE"],
  [/\bfrance|french\b/, "FR"],
  [/\bitaly|italian\b/, "IT"],
  [/\bspain|spanish\b/, "ES"],
  [/\bcanada\b/, "CA"],
  [/\baustralia\b/, "AU"],
  [/\bjapan|japanese\b/, "JP"],
  [/\bchina|chinese\b/, "CN"],
  [/\bindia|indian\b/, "IN"],
  [/\b(israel|israeli|jerusalem)\b/, "IL"],
  [/\b(pakistan|pakistani)\b/, "PK"],
  [/\b(nigeria|nigerian)\b/, "NG"],
  [/\b(mexico|mexican)\b/, "MX"],
  [/\b(colombia|colombian)\b/, "CO"],
  [/\b(turkey|turkish)\b/, "TR"],
  [/\b(poland|polish)\b/, "PL"],
  [/\b(iran|iranian)\b/, "IR"],
  [/\b(south africa|south african)\b/, "ZA"],
  [/\b(mongols|delhi sultanate)\b/, "IN"],
];

function inferCountryFromText(text) {
  const lower = text.toLowerCase();
  for (const [pattern, code] of COUNTRY_TEXT_PATTERNS) {
    if (pattern.test(lower)) return code;
  }
  return "OTHER";
}

export function parseWikidataCoord(wkt) {
  if (!wkt || typeof wkt !== "string") return null;
  const m = wkt.match(/Point\(([-\d.]+)\s+([-\d.]+)\)/);
  if (!m) return null;
  const lng = Number(m[1]);
  const lat = Number(m[2]);
  if (isInvalidMapCoord(lat, lng)) return null;
  return { lat, lng };
}

export function defaultCoords(country) {
  return COUNTRY_CENTROIDS[country] ?? COUNTRY_CENTROIDS.OTHER;
}
