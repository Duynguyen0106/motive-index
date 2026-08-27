import type { CrimeCase, CountryCode } from "@/lib/types";
import { resolveCaseCountry } from "@/lib/country";

export type GeoPoint = { lat: number; lng: number };

/** Approximate coordinates for catalog cases (city-level where known). */
const SLUG_COORDS: Record<string, GeoPoint> = {
  "ted-bundy": { lat: 47.6062, lng: -122.3321 }, // Seattle — origin region
  "dennis-rader-btk": { lat: 37.6872, lng: -97.3301 }, // Wichita
  "ted-kaczynski": { lat: 46.8797, lng: -110.3626 }, // Montana wilderness
  "aileen-wuornos": { lat: 28.5383, lng: -81.3792 }, // Florida
  "zodiac-killer": { lat: 38.5816, lng: -121.4944 }, // Sacramento area
  "charles-manson": { lat: 34.0522, lng: -118.2437 }, // Los Angeles
  "harold-shipman": { lat: 53.4478, lng: -2.0809 }, // Hyde, Greater Manchester
};

/** Country centroids when city-level coords are unavailable. */
export const COUNTRY_CENTROIDS: Record<CountryCode, GeoPoint> = {
  US: { lat: 39.8283, lng: -98.5795 },
  GB: { lat: 54.5, lng: -2.5 },
  CA: { lat: 56.1304, lng: -106.3468 },
  AU: { lat: -25.2744, lng: 133.7751 },
  OTHER: { lat: 20, lng: 0 },
};

/** ISO 3166-1 alpha-2 for map region matching. */
export const COUNTRY_ISO: Record<CountryCode, string | null> = {
  US: "US",
  GB: "GB",
  CA: "CA",
  AU: "AU",
  OTHER: null,
};

/** Equirectangular projection to percentage coords on a world map viewBox. */
export function projectLatLng(
  lat: number,
  lng: number,
  width = 800,
  height = 400,
): { x: number; y: number } {
  const x = ((lng + 180) / 360) * width;
  const y = ((90 - lat) / 180) * height;
  return { x, y };
}

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
  x: number;
  y: number;
};

export function toMonitorPin(c: CrimeCase, width = 800, height = 400): MonitorCasePin | null {
  const coords = resolveCaseCoordinates(c);
  if (!coords) return null;
  const { x, y } = projectLatLng(coords.lat, coords.lng, width, height);
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
    x,
    y,
  };
}

/** Spread overlapping pins so clusters remain readable. */
export function spreadPins(pins: MonitorCasePin[], minDist = 14): MonitorCasePin[] {
  const out = pins.map((p) => ({ ...p }));
  for (let i = 0; i < out.length; i++) {
    for (let j = 0; j < i; j++) {
      const dx = out[i].x - out[j].x;
      const dy = out[i].y - out[j].y;
      const dist = Math.hypot(dx, dy);
      if (dist < minDist && dist > 0) {
        const push = (minDist - dist) / 2;
        const nx = dx / dist;
        const ny = dy / dist;
        out[i].x += nx * push;
        out[i].y += ny * push;
        out[j].x -= nx * push;
        out[j].y -= ny * push;
      }
    }
  }
  return out;
}
