import { getAllCases, getUpdates, searchCases } from "@/lib/data";
import { COUNTRY_LABELS, listCountryOptions, resolveCaseCountry } from "@/lib/country";
import { spreadPins, toMonitorPin } from "@/lib/geo";
import { parseSearchParams } from "@/lib/search";
import type { CountryCode, CrimeCase, LiveUpdate, SearchFilters } from "@/lib/types";
import { CRIME_CATEGORY_LABELS } from "@/lib/types";

export type CountryMonitorStat = {
  code: CountryCode;
  label: string;
  caseCount: number;
  unsolvedCount: number;
  categories: string[];
};

export type UnplottedCase = {
  id: string;
  slug: string;
  name: string;
  country: CountryCode;
  reason: "no_coordinates" | "unknown_region";
};

export type MonitorPayload = {
  generatedAt: string;
  filters: SearchFilters;
  totalCases: number;
  filteredCount: number;
  plottedCount: number;
  unplottedCases: UnplottedCase[];
  countryOptions: CountryCode[];
  countryStats: CountryMonitorStat[];
  pins: ReturnType<typeof spreadPins>;
  cases: CrimeCase[];
  updates: LiveUpdate[];
};

function buildCountryStats(cases: CrimeCase[]): CountryMonitorStat[] {
  const byCountry = new Map<CountryCode, CountryMonitorStat>();

  for (const c of cases) {
    const code = resolveCaseCountry(c);
    const existing = byCountry.get(code) ?? {
      code,
      label: COUNTRY_LABELS[code],
      caseCount: 0,
      unsolvedCount: 0,
      categories: [],
    };
    existing.caseCount += 1;
    if (c.status === "unsolved") existing.unsolvedCount += 1;
    for (const cat of c.crimeCategories) {
      const label = CRIME_CATEGORY_LABELS[cat];
      if (!existing.categories.includes(label)) existing.categories.push(label);
    }
    byCountry.set(code, existing);
  }

  const order = listCountryOptions(getAllCases());
  return order
    .map((code) => byCountry.get(code))
    .filter((s): s is CountryMonitorStat => Boolean(s))
    .sort((a, b) => b.caseCount - a.caseCount);
}

export function buildMonitorPayload(
  params: Record<string, string | string[] | undefined>,
  updateLimit = 12,
): MonitorPayload {
  const filters = parseSearchParams(params);
  const all = getAllCases();
  const cases = searchCases(filters);
  const rawPins = cases
    .map((c) => toMonitorPin(c))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));
  const plottedIds = new Set(rawPins.map((p) => p.id));
  const unplottedCases = cases
    .filter((c) => !plottedIds.has(c.id))
    .map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      country: resolveCaseCountry(c),
      reason:
        resolveCaseCountry(c) === "OTHER"
          ? ("unknown_region" as const)
          : ("no_coordinates" as const),
    }));

  return {
    generatedAt: new Date().toISOString(),
    filters,
    totalCases: all.length,
    filteredCount: cases.length,
    plottedCount: rawPins.length,
    unplottedCases,
    countryOptions: listCountryOptions(all),
    countryStats: buildCountryStats(cases),
    pins: spreadPins(rawPins),
    cases,
    updates: getUpdates(updateLimit),
  };
}
