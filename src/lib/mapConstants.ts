import type { CountryCode } from "@/lib/types";

/** ISO 3166-1 alpha-3 codes used in world GeoJSON boundaries. */
export const COUNTRY_ISO3: Record<CountryCode, string | null> = {
  US: "USA",
  GB: "GBR",
  CA: "CAN",
  AU: "AUS",
  OTHER: null,
};

/** Map ISO3 from GeoJSON back to our filter codes. */
export const ISO3_TO_COUNTRY: Record<string, CountryCode> = {
  USA: "US",
  GBR: "GB",
  CAN: "CA",
  AUS: "AU",
};

/** Lat/lng bounds for fly-to when a country filter is active. */
export const COUNTRY_BOUNDS: Record<
  CountryCode,
  [[number, number], [number, number]] | null
> = {
  US: [
    [24.396308, -124.848974],
    [49.384358, -66.885444],
  ],
  GB: [
    [49.8, -8.65],
    [60.95, 1.85],
  ],
  CA: [
    [41.675105, -141.00275],
    [83.23324, -52.648099],
  ],
  AU: [
    [-43.634597, 112.92111],
    [-10.668186, 153.638672],
  ],
  OTHER: null,
};

/** Natural Earth country boundaries (GeoJSON, alpha-3 id). */
export const WORLD_GEOJSON_URL =
  "https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geojson";

/** Light editorial basemap — OpenStreetMap data via CARTO. */
export const MAP_TILE_URL =
  "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

export const MAP_TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

export const DEFAULT_MAP_CENTER: [number, number] = [20, 0];
export const DEFAULT_MAP_ZOOM = 2;
export const MIN_MAP_ZOOM = 2;
export const MAX_MAP_ZOOM = 12;
