import { resolveCaseCountry } from "@/lib/country";
import type { CrimeCase } from "@/lib/types";
import { CRIME_CATEGORY_LABELS, FACTOR_LABELS } from "@/lib/types";

export type RelatedCaseMatch = {
  case: CrimeCase;
  reasons: string[];
};

function buildMatchReasons(current: CrimeCase, candidate: CrimeCase): string[] {
  const reasons: string[] = [];

  if ((current.relatedCaseSlugs ?? []).includes(candidate.slug)) {
    reasons.push("Curated link");
  }

  if (resolveCaseCountry(current) === resolveCaseCountry(candidate)) {
    reasons.push("Same country");
  }

  const sharedCats = candidate.crimeCategories.filter((c) =>
    current.crimeCategories.includes(c),
  );
  if (sharedCats.length) {
    reasons.push(`Shared type: ${CRIME_CATEGORY_LABELS[sharedCats[0]]}`);
  }

  const sharedFactors = candidate.psychologicalFactors.filter((f) =>
    current.psychologicalFactors.includes(f),
  );
  if (sharedFactors.length) {
    reasons.push(`Shared factor: ${FACTOR_LABELS[sharedFactors[0]]}`);
  }

  if (candidate.status === current.status && current.status === "unsolved") {
    reasons.push("Also unsolved");
  }

  return reasons.slice(0, 2);
}

function scoreRelated(current: CrimeCase, candidate: CrimeCase): number {
  if (current.slug === candidate.slug) return 0;

  let score = 0;
  const country = resolveCaseCountry(current);
  if (resolveCaseCountry(candidate) === country) score += 3;

  for (const cat of candidate.crimeCategories) {
    if (current.crimeCategories.includes(cat)) score += 2;
  }

  for (const factor of candidate.psychologicalFactors) {
    if (current.psychologicalFactors.includes(factor)) score += 1;
  }

  for (const framework of candidate.theoreticalFrameworks) {
    if (current.theoreticalFrameworks.includes(framework)) score += 1;
  }

  if (candidate.status === current.status) score += 0.5;
  if (candidate.analysis.status === "published") score += 0.5;

  return score;
}

/** Curated slugs first, then auto-ranked similar dossiers with match reasons. */
export function findRelatedCasesWithReasons(
  current: CrimeCase,
  all: CrimeCase[],
  limit = 6,
): RelatedCaseMatch[] {
  const bySlug = new Map(all.map((c) => [c.slug, c]));
  const picked: RelatedCaseMatch[] = [];
  const seen = new Set<string>();

  for (const slug of current.relatedCaseSlugs ?? []) {
    const c = bySlug.get(slug);
    if (c && !seen.has(c.slug)) {
      picked.push({ case: c, reasons: buildMatchReasons(current, c) });
      seen.add(c.slug);
    }
  }

  const auto = all
    .map((c) => ({ c, score: scoreRelated(current, c) }))
    .filter((x) => x.score > 0 && !seen.has(x.c.slug))
    .sort((a, b) => b.score - a.score || a.c.name.localeCompare(b.c.name));

  for (const { c } of auto) {
    if (picked.length >= limit) break;
    picked.push({ case: c, reasons: buildMatchReasons(current, c) });
    seen.add(c.slug);
  }

  return picked.slice(0, limit);
}

export function findRelatedCases(
  current: CrimeCase,
  all: CrimeCase[],
  limit = 6,
): CrimeCase[] {
  return findRelatedCasesWithReasons(current, all, limit).map((m) => m.case);
}
