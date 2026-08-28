import { isCompositeCase } from "@/lib/caseSummaries";
import { catalogImageCoverage } from "@/lib/caseImages";
import { COUNTRY_LABELS, resolveCaseCountry } from "@/lib/country";
import type { CrimeCase, CrimeCategory, CountryCode, PsychologicalFactor, TheoreticalFramework } from "@/lib/types";
import { CRIME_CATEGORY_LABELS, FACTOR_LABELS, FRAMEWORK_LABELS } from "@/lib/types";

export type ArchiveStatBucket = { label: string; count: number; href: string };

export type ArchiveStats = {
  total: number;
  curated: number;
  composite: number;
  multilingual: number;
  unsolved: number;
  countries: number;
  withPhotos: number;
  byCountry: ArchiveStatBucket[];
  byCategory: ArchiveStatBucket[];
  byStatus: ArchiveStatBucket[];
  byDecade: ArchiveStatBucket[];
  byPsychFactor: ArchiveStatBucket[];
  byFramework: ArchiveStatBucket[];
};

function decadeLabel(year: number): string {
  const d = Math.floor(year / 10) * 10;
  return `${d}s`;
}

function sortByCount<T extends { count: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.count - a.count);
}

export type ArchiveStatsLimits = {
  country?: number;
  category?: number;
  psychFactor?: number;
  framework?: number;
};

const DEFAULT_LIMITS: Required<ArchiveStatsLimits> = {
  country: 15,
  category: 10,
  psychFactor: 10,
  framework: 8,
};

let cachedStats: { signature: string; stats: ArchiveStats } | null = null;

export function invalidateArchiveStatsCache(): void {
  cachedStats = null;
}

export function getCachedArchiveStats(
  cases: CrimeCase[],
  limits: ArchiveStatsLimits = {},
): ArchiveStats {
  const merged = { ...DEFAULT_LIMITS, ...limits };
  const signature = `${cases.length}:${merged.country}:${merged.category}:${merged.psychFactor}:${merged.framework}`;
  if (cachedStats?.signature === signature) return cachedStats.stats;
  const stats = buildArchiveStats(cases, merged);
  cachedStats = { signature, stats };
  return stats;
}

export function buildArchiveStats(
  cases: CrimeCase[],
  limits: ArchiveStatsLimits = {},
): ArchiveStats {
  const lim = { ...DEFAULT_LIMITS, ...limits };
  const imageCoverage = catalogImageCoverage();
  const countryMap = new Map<CountryCode, number>();
  const categoryMap = new Map<CrimeCategory, number>();
  const statusMap = new Map<string, number>();
  const decadeMap = new Map<string, number>();
  const factorMap = new Map<PsychologicalFactor, number>();
  const frameworkMap = new Map<TheoreticalFramework, number>();

  let curated = 0;
  let composite = 0;
  let multilingual = 0;
  let unsolved = 0;

  for (const c of cases) {
    if (isCompositeCase(c)) composite += 1;
    else curated += 1;
    if (c.tags.includes("multilingual-source")) multilingual += 1;
    if (c.status === "unsolved") unsolved += 1;

    const country = resolveCaseCountry(c);
    countryMap.set(country, (countryMap.get(country) ?? 0) + 1);

    for (const cat of c.crimeCategories) {
      categoryMap.set(cat, (categoryMap.get(cat) ?? 0) + 1);
    }

    for (const factor of c.psychologicalFactors) {
      factorMap.set(factor, (factorMap.get(factor) ?? 0) + 1);
    }

    for (const framework of c.theoreticalFrameworks) {
      frameworkMap.set(framework, (frameworkMap.get(framework) ?? 0) + 1);
    }

    statusMap.set(c.status, (statusMap.get(c.status) ?? 0) + 1);

    const decade = decadeLabel(c.yearStart);
    decadeMap.set(decade, (decadeMap.get(decade) ?? 0) + 1);
  }

  return {
    total: cases.length,
    curated,
    composite,
    multilingual,
    unsolved,
    countries: countryMap.size,
    withPhotos: imageCoverage.withImages,
    byCountry: sortByCount(
      [...countryMap.entries()].map(([code, count]) => ({
        label: COUNTRY_LABELS[code] ?? code,
        count,
        href: `/archive?country=${code}`,
      })),
    ).slice(0, lim.country),
    byCategory: sortByCount(
      [...categoryMap.entries()].map(([cat, count]) => ({
        label: CRIME_CATEGORY_LABELS[cat],
        count,
        href: `/archive?crimeCategory=${cat}`,
      })),
    ).slice(0, lim.category),
    byStatus: sortByCount(
      [...statusMap.entries()].map(([status, count]) => ({
        label: status.charAt(0).toUpperCase() + status.slice(1),
        count,
        href: `/archive?status=${status}`,
      })),
    ),
    byDecade: sortByCount(
      [...decadeMap.entries()].map(([decade, count]) => ({
        label: decade,
        count,
        href: `/archive?period=${encodeURIComponent(decade.replace("s", ""))}`,
      })),
    ).sort((a, b) => a.label.localeCompare(b.label)),
    byPsychFactor: sortByCount(
      [...factorMap.entries()].map(([factor, count]) => ({
        label: FACTOR_LABELS[factor],
        count,
        href: `/search?psychologicalFactor=${factor}`,
      })),
    ).slice(0, lim.psychFactor),
    byFramework: sortByCount(
      [...frameworkMap.entries()].map(([framework, count]) => ({
        label: FRAMEWORK_LABELS[framework],
        count,
        href: `/search?theoreticalFramework=${framework}`,
      })),
    ).slice(0, lim.framework),
  };
}
