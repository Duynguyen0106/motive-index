import type { CountryMonitorStat } from "@/lib/monitor";
import type { CountryCode, CrimeCategory } from "@/lib/types";
import type { CaseProvenanceTier } from "@/lib/validation/caseProvenance";

export type ChoroplethMetric = "cases" | "unsolved";

export type MapLayerMode = "pins" | "heatmap";

export type MapContentLayer = "cases" | "news" | "both";

export type ProvenanceFilter = "all" | "verified" | "curated" | "hide-composite";

export type CoordAccuracy = "city" | "centroid" | "country";

export type MonitorMapViewState = {
  choroplethEnabled: boolean;
  choroplethMetric: ChoroplethMetric;
  layerMode: MapLayerMode;
  contentLayer: MapContentLayer;
  provenanceFilter: ProvenanceFilter;
  showGhostPins: boolean;
  showRelatedArcs: boolean;
  timelineMinYear: number;
  timelineMaxYear: number;
  bboxFilter: [[number, number], [number, number]] | null;
  /** Empty = all crime types; otherwise show pins matching any listed category. */
  crimeCategoryFilter: CrimeCategory[];
};

export type MonitorNewsPin = {
  id: string;
  headline: string;
  summary: string;
  lat: number;
  lng: number;
  country?: CountryCode;
  region: string;
  caseSlug?: string;
  sourceUrl?: string;
  createdAt: string;
};

export type MonitorGhostPin = {
  id: string;
  slug: string;
  name: string;
  country: CountryCode;
  lat: number;
  lng: number;
  reason: "no_coordinates" | "unknown_region";
};

export type RegionPreset = {
  id: string;
  label: string;
  bounds: [[number, number], [number, number]];
};

export const REGION_PRESETS: RegionPreset[] = [
  { id: "world", label: "World", bounds: [[-55, -170], [72, 180]] },
  { id: "americas", label: "Americas", bounds: [[-55, -130], [72, -30]] },
  { id: "europe", label: "Europe", bounds: [[35, -12], [72, 45]] },
  { id: "africa-me", label: "Africa & ME", bounds: [[-35, -18], [38, 55]] },
  { id: "asia-pacific", label: "Asia–Pacific", bounds: [[-45, 60], [55, 155]] },
];

export const TIMELINE_YEAR_MIN = 1700;
export const TIMELINE_YEAR_MAX = 2026;

export type EnhancedMonitorPin = {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  country: CountryCode;
  status: "closed" | "unsolved" | "historical" | "open";
  crimeCategories: CrimeCategory[];
  primaryCategory: CrimeCategory;
  yearStart: number;
  yearEnd?: number;
  lat: number;
  lng: number;
  provenanceTier: CaseProvenanceTier;
  coordAccuracy: CoordAccuracy;
  relatedCaseSlugs: string[];
  imageUrl?: string;
  tags: string[];
};

export function choroplethValue(
  stat: CountryMonitorStat | undefined,
  metric: ChoroplethMetric,
): number {
  if (!stat) return 0;
  return metric === "unsolved" ? stat.unsolvedCount : stat.caseCount;
}

export function choroplethFillOpacity(value: number, max: number): number {
  if (max <= 0 || value <= 0) return 0.03;
  return 0.08 + (value / max) * 0.42;
}
