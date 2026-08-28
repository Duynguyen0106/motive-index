import { resolveCaseCountry } from "@/lib/country";
import type { CaseArchiveSummary, CrimeCase, MonitorCaseSummary } from "@/lib/types";
import {
  isCompositeInput,
  PROVENANCE_TAG,
  resolveProvenanceTier,
} from "@/lib/validation/caseProvenance";

export function toMonitorCaseSummary(c: CrimeCase): MonitorCaseSummary {
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    subtitle: c.subtitle,
    yearStart: c.yearStart,
    yearEnd: c.yearEnd,
    status: c.status,
    country: resolveCaseCountry(c),
    crimeCategories: c.crimeCategories,
    tags: c.tags,
  };
}

export function toCaseArchiveSummary(c: CrimeCase): CaseArchiveSummary {
  return {
    ...toMonitorCaseSummary(c),
    location: c.location,
    featured: c.featured,
  };
}

export function isCompositeCase(c: Pick<CrimeCase, "tags">): boolean {
  return isCompositeInput(c);
}

export function isVerifiedCase(c: Pick<CrimeCase, "tags">): boolean {
  return c.tags.includes(PROVENANCE_TAG.verified) || c.tags.includes("public-record");
}

export function getProvenanceTier(c: Pick<CrimeCase, "tags" | "slug" | "references" | "analysis">) {
  return resolveProvenanceTier({
    slug: c.slug,
    tags: c.tags,
    references: c.references,
    analysisStatus: c.analysis?.status,
  });
}

export function matchesCatalogTier(
  c: Pick<CrimeCase, "tags">,
  tier: string | undefined,
): boolean {
  if (!tier || tier === "all") return true;
  const composite = isCompositeCase(c);
  if (tier === "composite") return composite;
  if (tier === "curated") return !composite;
  return true;
}
