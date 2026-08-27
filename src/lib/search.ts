import type { SearchFilters } from "@/lib/types";

export function parseSearchParams(
  params: Record<string, string | string[] | undefined>,
): SearchFilters {
  const g = (k: string) => {
    const v = params[k];
    return typeof v === "string" ? v : "";
  };

  return {
    q: g("q"),
    crimeCategory: g("crimeCategory") as SearchFilters["crimeCategory"],
    psychologicalFactor: g("psychologicalFactor") as SearchFilters["psychologicalFactor"],
    theoreticalFramework: g(
      "theoreticalFramework",
    ) as SearchFilters["theoreticalFramework"],
    diagnosis: g("diagnosis"),
    country: g("country") as SearchFilters["country"],
    location: g("location"),
    period: g("period"),
    offenderSex: g("offenderSex"),
    documentType: g("documentType") as SearchFilters["documentType"],
    status: g("status") as SearchFilters["status"],
  };
}

export function hasActiveFilters(filters: SearchFilters): boolean {
  return Object.values(filters).some(Boolean);
}

const MONITOR_FILTER_KEYS = ["q", "country", "crimeCategory", "status", "period"] as const;

export function filtersToQueryString(
  filters: SearchFilters,
  keys: readonly (keyof SearchFilters)[] = Object.keys(filters) as (keyof SearchFilters)[],
): string {
  const p = new URLSearchParams();
  for (const k of keys) {
    const v = filters[k];
    if (v) p.set(k, String(v));
  }
  return p.toString();
}

export function monitorUrlFromFilters(filters: SearchFilters, caseSlug?: string): string {
  const p = new URLSearchParams(filtersToQueryString(filters, [...MONITOR_FILTER_KEYS]));
  if (caseSlug) p.set("case", caseSlug);
  const qs = p.toString();
  return qs ? `/?${qs}` : "/";
}

export function searchUrlFromFilters(filters: SearchFilters): string {
  const qs = filtersToQueryString(filters);
  return qs ? `/search?${qs}` : "/search";
}
