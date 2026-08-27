import type { CrimeCase, CountryCode } from "@/lib/types";
import { MULTILINGUAL_CASE_COORDS } from "@/data/multilingualCases";
import { WORLD_CASE_COORDS } from "@/data/worldCases";
import { resolveCaseCountry } from "@/lib/country";

export type GeoPoint = { lat: number; lng: number };

/** Approximate coordinates for catalog cases (city-level where known). */
const SLUG_COORDS: Record<string, GeoPoint> = {
  ...WORLD_CASE_COORDS,
  ...MULTILINGUAL_CASE_COORDS,
  "ted-bundy": { lat: 47.6062, lng: -122.3321 },
  "dennis-rader-btk": { lat: 37.6872, lng: -97.3301 },
  "ted-kaczynski": { lat: 46.8797, lng: -110.3626 },
  "aileen-wuornos": { lat: 28.5383, lng: -81.3792 },
  "zodiac-killer": { lat: 38.5816, lng: -121.4944 },
  "charles-manson": { lat: 34.0522, lng: -118.2437 },
  "harold-shipman": { lat: 53.4478, lng: -2.0809 },
};

/** Country centroids when city-level coords are unavailable. */
export const COUNTRY_CENTROIDS: Record<CountryCode, GeoPoint> = {
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
  UZ: { lat: 41.3775, lng: 64.5853 },
  OTHER: { lat: 20, lng: 0 },
};

export function resolveCaseCoordinates(
  c: Pick<CrimeCase, "slug" | "location" | "jurisdiction" | "country" | "lat" | "lng">,
): GeoPoint | null {
  if (typeof c.lat === "number" && typeof c.lng === "number") {
    return { lat: c.lat, lng: c.lng };
  }
  const slugPoint = SLUG_COORDS[c.slug];
  if (slugPoint) return slugPoint;

  const country = resolveCaseCountry(c);
  if (country === "OTHER") return null;

  const text = `${c.location} ${c.jurisdiction}`.toLowerCase();
  if (/\bkansas\b/.test(text)) return { lat: 37.6872, lng: -97.3301 };
  if (/\bflorida\b/.test(text)) return { lat: 27.9944, lng: -81.7603 };
  if (/\bcalifornia\b|san francisco|northern california/.test(text)) {
    return { lat: 37.7749, lng: -122.4194 };
  }
  if (/\bengland|manchester|united kingdom/.test(text)) {
    return { lat: 53.4478, lng: -2.0809 };
  }

  return COUNTRY_CENTROIDS[country];
}

export type MonitorCasePin = {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  country: CountryCode;
  status: CrimeCase["status"];
  crimeCategories: CrimeCase["crimeCategories"];
  yearStart: number;
  yearEnd?: number;
  lat: number;
  lng: number;
};

export function toMonitorPin(c: CrimeCase): MonitorCasePin | null {
  const coords = resolveCaseCoordinates(c);
  if (!coords) return null;
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    subtitle: c.subtitle,
    country: resolveCaseCountry(c),
    status: c.status,
    crimeCategories: c.crimeCategories,
    yearStart: c.yearStart,
    yearEnd: c.yearEnd,
    lat: coords.lat,
    lng: coords.lng,
  };
}

/** Offset overlapping pins in geographic space so clusters stay readable when zoomed in. */
export function spreadPins(pins: MonitorCasePin[], minDistDeg = 0.35): MonitorCasePin[] {
  const out = pins.map((p) => ({ ...p }));
  for (let i = 0; i < out.length; i++) {
    for (let j = 0; j < i; j++) {
      const dLat = out[i].lat - out[j].lat;
      const dLng = out[i].lng - out[j].lng;
      const dist = Math.hypot(dLat, dLng);
      if (dist < minDistDeg && dist > 0) {
        const push = (minDistDeg - dist) / 2;
        const nx = dLat / dist;
        const ny = dLng / dist;
        out[i].lat += nx * push;
        out[i].lng += ny * push;
        out[j].lat -= nx * push;
        out[j].lng -= ny * push;
      }
    }
  }
  return out;
}
