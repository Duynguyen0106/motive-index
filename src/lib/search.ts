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
    catalogTier: (g("catalogTier") || "") as SearchFilters["catalogTier"],
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

export function searchUrlFromFilters(
  filters: SearchFilters,
  opts?: { page?: number; pageSize?: number },
): string {
  const p = new URLSearchParams(filtersToQueryString(filters));
  if (opts?.page && opts.page > 1) p.set("page", String(opts.page));
  if (opts?.pageSize && opts.pageSize !== DEFAULT_ARCHIVE_PAGE_SIZE) {
    p.set("pageSize", String(opts.pageSize));
  }
  const qs = p.toString();
  return qs ? `/search?${qs}` : "/search";
}

export const DEFAULT_ARCHIVE_PAGE_SIZE = 50;

export function paginateCases<T>(
  items: T[],
  page: number,
  pageSize: number = DEFAULT_ARCHIVE_PAGE_SIZE,
) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page: safePage,
    pageSize,
    total,
    totalPages,
  };
}

export function archiveUrlFromFilters(
  filters: SearchFilters,
  opts?: { page?: number; pageSize?: number },
): string {
  const p = new URLSearchParams(filtersToQueryString(filters));
  if (opts?.page && opts.page > 1) p.set("page", String(opts.page));
  if (opts?.pageSize && opts.pageSize !== DEFAULT_ARCHIVE_PAGE_SIZE) {
    p.set("pageSize", String(opts.pageSize));
  }
  const qs = p.toString();
  return qs ? `/archive?${qs}` : "/archive";
}
