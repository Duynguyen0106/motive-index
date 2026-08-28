import type { MonitorCasePin } from "@/lib/geo";
import { COUNTRY_LABELS } from "@/lib/country";
import type { CountryMonitorStat } from "@/lib/monitor";
import type {
  ChoroplethMetric,
  MapContentLayer,
  MapLayerMode,
  MonitorMapViewState,
  ProvenanceFilter,
} from "@/lib/monitorMapTypes";
import { TIMELINE_YEAR_MAX, TIMELINE_YEAR_MIN } from "@/lib/monitorMapTypes";
import { defaultTimelineRange } from "@/lib/monitorMapUtils";
import { CRIME_CATEGORY_LABELS, type CountryCode, type CrimeCategory } from "@/lib/types";

const CRIME_CATEGORIES = new Set<CrimeCategory>(Object.keys(CRIME_CATEGORY_LABELS) as CrimeCategory[]);

export function pinMatchesCrimeFilter(
  pin: Pick<MonitorCasePin, "crimeCategories">,
  filter: CrimeCategory[],
): boolean {
  if (!filter.length) return true;
  return pin.crimeCategories.some((c) => filter.includes(c));
}

export function pinPassesProvenance(
  pin: MonitorCasePin,
  filter: ProvenanceFilter,
): boolean {
  switch (filter) {
    case "verified":
      return pin.provenanceTier === "verified";
    case "curated":
      return pin.provenanceTier === "verified" || pin.provenanceTier === "curated";
    case "hide-composite":
      return pin.provenanceTier !== "composite";
    default:
      return true;
  }
}

export function pinInBbox(
  pin: { lat: number; lng: number },
  bbox: MonitorMapViewState["bboxFilter"],
): boolean {
  if (!bbox) return true;
  const [[south, west], [north, east]] = bbox;
  return pin.lat >= south && pin.lat <= north && pin.lng >= west && pin.lng <= east;
}

export function pinInTimeline(
  pin: Pick<MonitorCasePin, "yearStart" | "yearEnd">,
  minYear: number,
  maxYear: number,
): boolean {
  const end = pin.yearEnd ?? pin.yearStart;
  return end >= minYear && pin.yearStart <= maxYear;
}

/** Pins visible after map-layer filters (timeline, provenance, bbox). */
export function filterVisiblePins(
  pins: MonitorCasePin[],
  view: Pick<
    MonitorMapViewState,
    | "provenanceFilter"
    | "timelineMinYear"
    | "timelineMaxYear"
    | "bboxFilter"
    | "crimeCategoryFilter"
  >,
): MonitorCasePin[] {
  return pins.filter(
    (p) =>
      pinPassesProvenance(p, view.provenanceFilter) &&
      pinInTimeline(p, view.timelineMinYear, view.timelineMaxYear) &&
      pinInBbox(p, view.bboxFilter) &&
      pinMatchesCrimeFilter(p, view.crimeCategoryFilter),
  );
}

/** Country stats derived from visible map pins (timeline / provenance / bbox aware). */
export function buildCountryStatsFromPins(pins: MonitorCasePin[]): CountryMonitorStat[] {
  const byCountry = new Map<CountryCode, CountryMonitorStat>();

  for (const pin of pins) {
    const existing = byCountry.get(pin.country) ?? {
      code: pin.country,
      label: COUNTRY_LABELS[pin.country],
      caseCount: 0,
      unsolvedCount: 0,
      categories: [],
    };
    existing.caseCount += 1;
    if (pin.status === "unsolved") existing.unsolvedCount += 1;
    for (const cat of pin.crimeCategories) {
      const label = CRIME_CATEGORY_LABELS[cat];
      if (!existing.categories.includes(label)) existing.categories.push(label);
    }
    byCountry.set(pin.country, existing);
  }

  return [...byCountry.values()].sort((a, b) => b.caseCount - a.caseCount);
}

export function mapFiltersAffectPins(
  view: Pick<
    MonitorMapViewState,
    | "provenanceFilter"
    | "timelineMinYear"
    | "timelineMaxYear"
    | "bboxFilter"
    | "crimeCategoryFilter"
  >,
): boolean {
  return (
    view.provenanceFilter !== "hide-composite" ||
    view.timelineMinYear !== TIMELINE_YEAR_MIN ||
    view.timelineMaxYear !== TIMELINE_YEAR_MAX ||
    view.bboxFilter !== null ||
    view.crimeCategoryFilter.length > 0
  );
}

export type MapViewPreset = {
  id: string;
  label: string;
  description: string;
  patch: Partial<MonitorMapViewState>;
};

export const MAP_VIEW_PRESETS: MapViewPreset[] = [
  {
    id: "unsolved-hotspots",
    label: "Unsolved hotspots",
    description: "Choropleth by open cases · hide teaching dossiers",
    patch: {
      choroplethEnabled: true,
      choroplethMetric: "unsolved",
      provenanceFilter: "hide-composite",
      layerMode: "pins",
      contentLayer: "cases",
    },
  },
  {
    id: "verified-archive",
    label: "Verified archive",
    description: "Public-record dossiers only",
    patch: {
      provenanceFilter: "verified",
      choroplethEnabled: true,
      choroplethMetric: "cases",
      layerMode: "pins",
    },
  },
  {
    id: "1970s-serial",
    label: "1970s serial era",
    description: "Timeline 1970–1979 · heatmap density",
    patch: {
      timelineMinYear: 1970,
      timelineMaxYear: 1979,
      layerMode: "heatmap",
      contentLayer: "cases",
      provenanceFilter: "hide-composite",
    },
  },
  {
    id: "live-intel",
    label: "Live intel",
    description: "Cases + regional news on map",
    patch: {
      contentLayer: "both",
      showRelatedArcs: true,
      layerMode: "pins",
    },
  },
  {
    id: "research-reset",
    label: "Reset map view",
    description: "Full timeline · all provenance tiers",
    patch: {
      timelineMinYear: TIMELINE_YEAR_MIN,
      timelineMaxYear: TIMELINE_YEAR_MAX,
      provenanceFilter: "all",
      choroplethEnabled: true,
      choroplethMetric: "cases",
      layerMode: "pins",
      contentLayer: "cases",
      bboxFilter: null,
      showGhostPins: false,
      crimeCategoryFilter: [],
    },
  },
];

const LAYER_MODES = new Set<MapLayerMode>(["pins", "heatmap"]);
const CONTENT_LAYERS = new Set<MapContentLayer>(["cases", "news", "both"]);
const PROV_FILTERS = new Set<ProvenanceFilter>(["all", "verified", "curated", "hide-composite"]);
const CHORO_METRICS = new Set<ChoroplethMetric>(["cases", "unsolved"]);

function parseIntParam(value: string | null, fallback: number, min: number, max: number): number {
  if (!value) return fallback;
  const n = parseInt(value, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

/** Parse compact map-view params from URL searchParams. */
export function parseMapViewFromSearchParams(
  params: URLSearchParams,
  periodFallback = "",
): MonitorMapViewState {
  const era = defaultTimelineRange(periodFallback);
  const ym = parseIntParam(params.get("ym"), era.min, TIMELINE_YEAR_MIN, TIMELINE_YEAR_MAX);
  const yx = parseIntParam(params.get("yx"), era.max, TIMELINE_YEAR_MIN, TIMELINE_YEAR_MAX);

  const layerRaw = params.get("mlayer") ?? "";
  const contentRaw = params.get("mcontent") ?? "";
  const provRaw = params.get("mprov") ?? "";
  const choroRaw = params.get("mchoro") ?? "";
  const chmRaw = params.get("mchm") ?? "";

  let bboxFilter: MonitorMapViewState["bboxFilter"] = null;
  const bboxRaw = params.get("mbbox");
  if (bboxRaw) {
    const parts = bboxRaw.split(",").map(Number);
    if (parts.length === 4 && parts.every((n) => !Number.isNaN(n))) {
      bboxFilter = [
        [parts[0], parts[1]],
        [parts[2], parts[3]],
      ];
    }
  }

  let crimeCategoryFilter: CrimeCategory[] = [];
  const mcatRaw = params.get("mcat");
  if (mcatRaw) {
    crimeCategoryFilter = mcatRaw
      .split(",")
      .filter((c): c is CrimeCategory => CRIME_CATEGORIES.has(c as CrimeCategory));
  }

  return {
    choroplethEnabled: choroRaw !== "0",
    choroplethMetric: CHORO_METRICS.has(chmRaw as ChoroplethMetric)
      ? (chmRaw as ChoroplethMetric)
      : "cases",
    layerMode: LAYER_MODES.has(layerRaw as MapLayerMode) ? (layerRaw as MapLayerMode) : "pins",
    contentLayer: CONTENT_LAYERS.has(contentRaw as MapContentLayer)
      ? (contentRaw as MapContentLayer)
      : "cases",
    provenanceFilter: PROV_FILTERS.has(provRaw as ProvenanceFilter)
      ? (provRaw as ProvenanceFilter)
      : "hide-composite",
    showGhostPins: params.get("mghost") === "1",
    showRelatedArcs: params.get("marcs") !== "0",
    timelineMinYear: Math.min(ym, yx - 1),
    timelineMaxYear: Math.max(yx, ym + 1),
    bboxFilter,
    crimeCategoryFilter,
  };
}

/** Serialize non-default map view fields into URL params. */
export function mapViewToSearchParams(
  view: MonitorMapViewState,
  base: URLSearchParams,
): URLSearchParams {
  const p = new URLSearchParams(base.toString());

  const defaults: MonitorMapViewState = {
    choroplethEnabled: true,
    choroplethMetric: "cases",
    layerMode: "pins",
    contentLayer: "cases",
    provenanceFilter: "hide-composite",
    showGhostPins: false,
    showRelatedArcs: true,
    timelineMinYear: TIMELINE_YEAR_MIN,
    timelineMaxYear: TIMELINE_YEAR_MAX,
    bboxFilter: null,
    crimeCategoryFilter: [],
  };

  const keys = ["ym", "yx", "mlayer", "mcontent", "mprov", "mchoro", "mchm", "mghost", "marcs", "mbbox", "mcat"] as const;
  for (const k of keys) p.delete(k);

  if (view.timelineMinYear !== defaults.timelineMinYear) p.set("ym", String(view.timelineMinYear));
  if (view.timelineMaxYear !== defaults.timelineMaxYear) p.set("yx", String(view.timelineMaxYear));
  if (view.layerMode !== defaults.layerMode) p.set("mlayer", view.layerMode);
  if (view.contentLayer !== defaults.contentLayer) p.set("mcontent", view.contentLayer);
  if (view.provenanceFilter !== defaults.provenanceFilter) p.set("mprov", view.provenanceFilter);
  if (!view.choroplethEnabled) p.set("mchoro", "0");
  if (view.choroplethMetric !== defaults.choroplethMetric) p.set("mchm", view.choroplethMetric);
  if (view.showGhostPins) p.set("mghost", "1");
  if (!view.showRelatedArcs) p.set("marcs", "0");
  if (view.bboxFilter) {
    const [[s, w], [n, e]] = view.bboxFilter;
    p.set("mbbox", [s, w, n, e].map((v) => v.toFixed(2)).join(","));
  }
  if (view.crimeCategoryFilter.length) {
    p.set("mcat", view.crimeCategoryFilter.join(","));
  }

  return p;
}

export function isDefaultTimeline(min: number, max: number): boolean {
  return min === TIMELINE_YEAR_MIN && max === TIMELINE_YEAR_MAX;
}

// Re-export timeline defaults for filters module consumers
export { TIMELINE_YEAR_MIN, TIMELINE_YEAR_MAX };
