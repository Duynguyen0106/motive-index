import { resolveCaseCountry } from "@/lib/country";
import type { CrimeCase } from "@/lib/types";

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

/** Curated slugs first, then auto-ranked similar dossiers. */
export function findRelatedCases(
  current: CrimeCase,
  all: CrimeCase[],
  limit = 6,
): CrimeCase[] {
  const bySlug = new Map(all.map((c) => [c.slug, c]));
  const picked: CrimeCase[] = [];
  const seen = new Set<string>();

  for (const slug of current.relatedCaseSlugs ?? []) {
    const c = bySlug.get(slug);
    if (c && !seen.has(c.slug)) {
      picked.push(c);
      seen.add(c.slug);
    }
  }

  const auto = all
    .map((c) => ({ c, score: scoreRelated(current, c) }))
    .filter((x) => x.score > 0 && !seen.has(x.c.slug))
    .sort((a, b) => b.score - a.score || a.c.name.localeCompare(b.c.name));

  for (const { c } of auto) {
    if (picked.length >= limit) break;
    picked.push(c);
    seen.add(c.slug);
  }

  return picked.slice(0, limit);
}
