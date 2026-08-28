import { searchCasesFrom } from "@/lib/data";
import { getAllCasesAsync, getUpdatesAsync } from "@/lib/dataServer";
import { toMonitorCaseSummary, getProvenanceTier } from "@/lib/caseSummaries";
import { getPrimaryCaseImage } from "@/lib/caseImages";
import { COUNTRY_LABELS, listCountryOptions, resolveCaseCountry } from "@/lib/country";
import { spreadPins, toMonitorPin } from "@/lib/geo";
import { ghostPinFromCase, newsItemToPin } from "@/lib/monitorMapUtils";
import type { MonitorGhostPin, MonitorNewsPin } from "@/lib/monitorMapTypes";
import { parseSearchParams } from "@/lib/search";
import type { CountryCode, LiveUpdate, MonitorCaseSummary, SearchFilters } from "@/lib/types";
import { CRIME_CATEGORY_LABELS } from "@/lib/types";
import type { CrimeCase } from "@/lib/types";
import { buildWorldNewsPayload, type WorldNewsPayload } from "@/lib/worldNewsService";

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
  cases: MonitorCaseSummary[];
  updates: LiveUpdate[];
  worldNews: WorldNewsPayload;
  featuredCase?: MonitorCaseSummary;
  newsPins: MonitorNewsPin[];
  ghostPins: MonitorGhostPin[];
  pinIndex: Record<string, { lat: number; lng: number; slug: string }>;
};

function buildCountryStats(cases: CrimeCase[], allCases: CrimeCase[]): CountryMonitorStat[] {
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

  const order = listCountryOptions(allCases);
  return order
    .map((code) => byCountry.get(code))
    .filter((s): s is CountryMonitorStat => Boolean(s))
    .sort((a, b) => b.caseCount - a.caseCount);
}

export async function buildMonitorPayload(
  params: Record<string, string | string[] | undefined>,
  updateLimit = 12,
): Promise<MonitorPayload> {
  const filters = parseSearchParams(params);
  const all = await getAllCasesAsync();
  const cases = searchCasesFrom(all, filters);
  const rawPins = cases
    .map((c) => {
      const img = getPrimaryCaseImage(c.slug);
      return toMonitorPin(c, {
        provenanceTier: getProvenanceTier(c),
        imageUrl: img?.url,
      });
    })
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

  const ghostPins = unplottedCases
    .map((u) => ghostPinFromCase(u))
    .filter((g): g is MonitorGhostPin => Boolean(g));

  const worldNews = await buildWorldNewsPayload({
    limit: 24,
    country: filters.country ?? "",
  });

  const newsPins = worldNews.items
    .map(newsItemToPin)
    .filter((p): p is MonitorNewsPin => Boolean(p));

  const pinIndex: Record<string, { lat: number; lng: number; slug: string }> = {};
  for (const p of rawPins) {
    pinIndex[p.id] = { lat: p.lat, lng: p.lng, slug: p.slug };
    pinIndex[p.slug] = { lat: p.lat, lng: p.lng, slug: p.slug };
  }

  return {
    generatedAt: new Date().toISOString(),
    filters,
    totalCases: all.length,
    filteredCount: cases.length,
    plottedCount: rawPins.length,
    unplottedCases,
    countryOptions: listCountryOptions(all),
    countryStats: buildCountryStats(cases, all),
    pins: spreadPins(rawPins),
    cases: cases.map(toMonitorCaseSummary),
    updates: await getUpdatesAsync(updateLimit),
    worldNews,
    newsPins,
    ghostPins,
    pinIndex,
    featuredCase: (() => {
      const featured =
        all.find((c) => c.caseOfWeek) ??
        all.find((c) => c.featured && c.analysis.status === "published");
      return featured ? toMonitorCaseSummary(featured) : undefined;
    })(),
  };
}
