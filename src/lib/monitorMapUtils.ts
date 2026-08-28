import { COUNTRY_CENTROIDS, type MonitorCasePin } from "@/lib/geo";
import { COUNTRY_ISO3 } from "@/lib/mapConstants";
import type { MonitorGhostPin, MonitorNewsPin } from "@/lib/monitorMapTypes";
import { TIMELINE_YEAR_MAX, TIMELINE_YEAR_MIN } from "@/lib/monitorMapTypes";
import type { CountryCode, CrimeCategory } from "@/lib/types";
import type { WorldNewsItem } from "@/lib/worldNews";
import { CRIME_CATEGORY_LABELS } from "@/lib/types";
import { WORLD_NEWS_FEEDS } from "@/lib/worldNews";
import { inferCountry } from "@/lib/country";

const REGION_COUNTRY: Record<string, CountryCode> = Object.fromEntries(
  WORLD_NEWS_FEEDS.filter((f) => f.country).map((f) => [f.region, f.country!]),
) as Record<string, CountryCode>;

export function newsItemToPin(item: WorldNewsItem): MonitorNewsPin | null {
  const country =
    item.country ??
    (item.region ? REGION_COUNTRY[item.region] : undefined) ??
    inferCountry(`${item.headline} ${item.region ?? ""}`);
  if (!country || country === "OTHER") return null;
  const centroid = COUNTRY_CENTROIDS[country];
  if (!centroid) return null;
  const jitter = hashJitter(item.id);
  return {
    id: item.id,
    headline: item.headline,
    summary: item.summary,
    lat: centroid.lat + jitter.lat,
    lng: centroid.lng + jitter.lng,
    country,
    region: item.region ?? country,
    caseSlug: item.caseSlug,
    sourceUrl: item.sourceUrl,
    createdAt: item.createdAt,
  };
}

function hashJitter(seed: string): { lat: number; lng: number } {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const a = ((h & 0xffff) / 0xffff - 0.5) * 2.5;
  const b = (((h >> 16) & 0xffff) / 0xffff - 0.5) * 2.5;
  return { lat: a, lng: b };
}

export function ghostPinFromCase(input: {
  id: string;
  slug: string;
  name: string;
  country: CountryCode;
  reason: MonitorGhostPin["reason"];
}): MonitorGhostPin | null {
  if (input.country === "OTHER") return null;
  const c = COUNTRY_CENTROIDS[input.country];
  if (!c) return null;
  const jitter = hashJitter(input.slug);
  return {
    ...input,
    lat: c.lat + jitter.lat,
    lng: c.lng + jitter.lng,
  };
}

export function parseEraToYearRange(period: string): { min: number; max: number } | null {
  const p = period.trim().toLowerCase();
  if (!p) return null;
  const decade = p.match(/^(\d{3})0s$/);
  if (decade) {
    const d = parseInt(decade[1], 10);
    return { min: d * 10, max: d * 10 + 9 };
  }
  const century = p.match(/^(\d{1,2})(?:st|nd|rd|th)?\s*century$/);
  if (century) {
    const c = parseInt(century[1], 10);
    return { min: (c - 1) * 100 + 1, max: c * 100 };
  }
  const year = p.match(/^(\d{4})$/);
  if (year) {
    const y = parseInt(year[1], 10);
    return { min: y, max: y };
  }
  return null;
}

export function pinOverlapsYearRange(
  pin: Pick<MonitorCasePin, "yearStart" | "yearEnd">,
  minYear: number,
  maxYear: number,
): boolean {
  const end = pin.yearEnd ?? pin.yearStart;
  return end >= minYear && pin.yearStart <= maxYear;
}

export function defaultTimelineRange(period: string): { min: number; max: number } {
  const era = parseEraToYearRange(period);
  if (era) return era;
  return { min: TIMELINE_YEAR_MIN, max: TIMELINE_YEAR_MAX };
}

export function decadeMarkers(min: number, max: number): number[] {
  const start = Math.floor(min / 10) * 10;
  const out: number[] = [];
  for (let y = start; y <= max; y += 10) {
    if (y >= min - 9) out.push(y);
  }
  return out;
}

const CATEGORY_MARKER_CLASS: Record<CrimeCategory, string> = {
  serial_murder: "shape-circle",
  mass_violence: "shape-square",
  homicide: "shape-diamond",
  domestic_homicide: "shape-triangle",
  healthcare_murder: "shape-cross",
  terrorism_ideological: "shape-star",
  fraud: "shape-hex",
  arson: "shape-pentagon",
  other: "shape-circle",
};

/** Display order for map crime-type filter chips. */
export const CRIME_CATEGORY_FILTER_ORDER: CrimeCategory[] = [
  "serial_murder",
  "mass_violence",
  "homicide",
  "domestic_homicide",
  "healthcare_murder",
  "terrorism_ideological",
  "fraud",
  "arson",
  "other",
];

export function markerShapeClass(category: CrimeCategory): string {
  return CATEGORY_MARKER_CLASS[category] ?? "shape-circle";
}

export function markerCategoryClass(category: CrimeCategory): string {
  return `crime-cat-${category}`;
}

function markerStatusClass(status: MonitorCasePin["status"]): string {
  return status === "unsolved" ? "status-unsolved" : "status-closed";
}

function markerAccuracyClass(accuracy: MonitorCasePin["coordAccuracy"]): string {
  if (accuracy === "city") return "acc-city";
  if (accuracy === "centroid") return "acc-centroid";
  return "acc-country";
}

function markerClassesForCategoryPin(
  category: CrimeCategory,
  status: MonitorCasePin["status"],
  baseClass: string,
  accuracy: MonitorCasePin["coordAccuracy"],
  opts?: { active?: boolean; hovered?: boolean; dimmed?: boolean },
): string {
  const cat = category ?? "other";
  const parts = [
    baseClass,
    markerCategoryClass(cat),
    markerShapeClass(cat),
    markerStatusClass(status),
    markerAccuracyClass(accuracy),
  ];
  if (opts?.active) parts.push("is-active");
  else if (opts?.hovered) parts.push("is-hover");
  if (opts?.dimmed) parts.push("is-dimmed");
  return parts.join(" ");
}

export function markerClassesForPin(
  pin: Pick<MonitorCasePin, "primaryCategory" | "status" | "coordAccuracy">,
  opts?: { active?: boolean; hovered?: boolean; dimmed?: boolean },
): string {
  return markerClassesForCategoryPin(
    pin.primaryCategory ?? "other",
    pin.status,
    "monitor-leaflet-marker",
    pin.coordAccuracy ?? "city",
    opts,
  );
}

export function sidebarPinClasses(
  category: CrimeCategory,
  status: MonitorCasePin["status"],
  accuracy: MonitorCasePin["coordAccuracy"] = "city",
): string {
  return markerClassesForCategoryPin(category, status, "monitor-case-pin", accuracy);
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildRichPopupHtml(pin: {
  name: string;
  subtitle: string;
  yearStart: number;
  yearEnd?: number;
  country: CountryCode;
  crimeCategories: CrimeCategory[];
  status: string;
  provenanceTier: string;
  coordAccuracy: string;
  imageUrl?: string;
  slug: string;
}): string {
  const cats = pin.crimeCategories.map((c) => CRIME_CATEGORY_LABELS[c]).join(" · ");
  const img = pin.imageUrl
    ? `<img src="${escapeHtml(pin.imageUrl)}" alt="" class="monitor-popup-img" loading="lazy" />`
    : "";
  const tierLabel =
    pin.provenanceTier === "verified"
      ? "Verified"
      : pin.provenanceTier === "curated"
        ? "Curated"
        : pin.provenanceTier === "composite"
          ? "Teaching"
          : "Draft";
  const accLabel =
    pin.coordAccuracy === "city"
      ? "City-level pin"
      : pin.coordAccuracy === "centroid"
        ? "Country estimate"
        : "Regional estimate";
  return `<div class="monitor-popup">
    ${img}
    <strong>${escapeHtml(pin.name)}</strong>
    <p class="monitor-popup-sub">${escapeHtml(pin.subtitle)}</p>
    <p class="monitor-popup-meta">${pin.yearStart}${pin.yearEnd ? `–${pin.yearEnd}` : ""} · ${escapeHtml(cats)}</p>
    <p class="monitor-popup-badges">
      <span class="monitor-popup-badge">${escapeHtml(tierLabel)}</span>
      <span class="monitor-popup-badge">${escapeHtml(accLabel)}</span>
      ${pin.status === "unsolved" ? '<span class="monitor-popup-badge is-open">Unsolved</span>' : ""}
    </p>
    <a href="/cases/${escapeHtml(pin.slug)}" class="monitor-popup-link">Open dossier →</a>
  </div>`;
}

export function iso3ForCountry(code: CountryCode): string | null {
  return COUNTRY_ISO3[code];
}

export function exportCasesCsv(
  rows: Array<{
    name: string;
    slug: string;
    country: string;
    yearStart: number;
    status: string;
    lat?: number;
    lng?: number;
  }>,
): string {
  const header = "name,slug,country,yearStart,status,lat,lng";
  const lines = rows.map((r) =>
    [
      `"${r.name.replace(/"/g, '""')}"`,
      r.slug,
      r.country,
      r.yearStart,
      r.status,
      r.lat ?? "",
      r.lng ?? "",
    ].join(","),
  );
  return [header, ...lines].join("\n");
}

/** Summary popup HTML for a marker cluster. */
export function buildClusterPopupHtml(
  pins: Array<
    Pick<
      MonitorCasePin,
      "name" | "slug" | "status" | "primaryCategory" | "yearStart" | "crimeCategories"
    >
  >,
): string {
  const count = pins.length;
  const unsolved = pins.filter((p) => p.status === "unsolved").length;
  const byCategory = new Map<CrimeCategory, number>();
  for (const pin of pins) {
    const cat = pin.primaryCategory ?? "other";
    byCategory.set(cat, (byCategory.get(cat) ?? 0) + 1);
  }
  const topCats = [...byCategory.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([cat, n]) => `${CRIME_CATEGORY_LABELS[cat]} (${n})`)
    .join(" · ");

  const sample = pins
    .slice(0, 5)
    .map(
      (p) =>
        `<li><a href="/cases/${escapeHtml(p.slug)}">${escapeHtml(p.name)}</a> <span class="monitor-cluster-year">${p.yearStart}</span></li>`,
    )
    .join("");

  return `<div class="monitor-cluster-popup">
    <strong>${count} dossiers</strong>
    ${unsolved ? `<p class="monitor-cluster-meta">${unsolved} unsolved</p>` : ""}
    ${topCats ? `<p class="monitor-cluster-meta">${escapeHtml(topCats)}</p>` : ""}
    <ul class="monitor-cluster-list">${sample}</ul>
    ${count > 5 ? `<p class="monitor-cluster-more">+ ${count - 5} more — zoom in</p>` : ""}
  </div>`;
}
