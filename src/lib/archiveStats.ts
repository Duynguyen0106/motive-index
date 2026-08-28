import { isCompositeCase } from "@/lib/caseSummaries";
import { catalogImageCoverage } from "@/lib/caseImages";
import { COUNTRY_LABELS, resolveCaseCountry } from "@/lib/country";
import type { CrimeCase } from "@/lib/types";
import { CRIME_CATEGORY_LABELS } from "@/lib/types";

export type ArchiveStatBucket = { label: string; count: number };

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
};

function decadeLabel(year: number): string {
  const d = Math.floor(year / 10) * 10;
  return `${d}s`;
}

export function buildArchiveStats(cases: CrimeCase[]): ArchiveStats {
  const imageCoverage = catalogImageCoverage();
  const countryMap = new Map<string, number>();
  const categoryMap = new Map<string, number>();
  const statusMap = new Map<string, number>();
  const decadeMap = new Map<string, number>();

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
      const label = CRIME_CATEGORY_LABELS[cat];
      categoryMap.set(label, (categoryMap.get(label) ?? 0) + 1);
    }

    statusMap.set(c.status, (statusMap.get(c.status) ?? 0) + 1);

    const decade = decadeLabel(c.yearStart);
    decadeMap.set(decade, (decadeMap.get(decade) ?? 0) + 1);
  }

  const sortBuckets = (m: Map<string, number>) =>
    [...m.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => ({ label, count }));

  return {
    total: cases.length,
    curated,
    composite,
    multilingual,
    unsolved,
    countries: countryMap.size,
    withPhotos: imageCoverage.withImages,
    byCountry: sortBuckets(
      new Map(
        [...countryMap.entries()].map(([code, count]) => [COUNTRY_LABELS[code as keyof typeof COUNTRY_LABELS] ?? code, count]),
      ),
    ).slice(0, 15),
    byCategory: sortBuckets(categoryMap).slice(0, 10),
    byStatus: sortBuckets(statusMap),
    byDecade: sortBuckets(decadeMap).sort((a, b) => a.label.localeCompare(b.label)),
  };
}
