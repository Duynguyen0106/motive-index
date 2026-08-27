import type { CrimeCase, CountryCode } from "@/lib/types";
import { resolveCaseCountry } from "@/lib/country";

export type GeoPoint = { lat: number; lng: number };

/** Approximate coordinates for catalog cases (city-level where known). */
const SLUG_COORDS: Record<string, GeoPoint> = {
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
  US: { lat: 39.8283, lng: -98.5795 },
  GB: { lat: 54.5, lng: -2.5 },
  CA: { lat: 56.1304, lng: -106.3468 },
  AU: { lat: -25.2744, lng: 133.7751 },
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
