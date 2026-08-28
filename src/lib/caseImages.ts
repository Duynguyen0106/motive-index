import { CASE_IMAGE_CATALOG } from "@/data/caseImageCatalog";
import { CASE_IMAGE_CATALOG_EXTENDED } from "@/data/caseImageCatalogExtended";
import type { CaseImage, CrimeCase } from "@/lib/types";

function mergeCatalogs(): Record<string, CaseImage[]> {
  const merged: Record<string, CaseImage[]> = {};

  for (const [slug, images] of Object.entries(CASE_IMAGE_CATALOG_EXTENDED)) {
    merged[slug] = images;
  }

  for (const [slug, images] of Object.entries(CASE_IMAGE_CATALOG)) {
    const existing = merged[slug] ?? [];
    const seen = new Set(existing.map((i) => i.id));
    merged[slug] = [...existing, ...images.filter((i) => !seen.has(i.id))];
  }

  return merged;
}

const FULL_CATALOG = mergeCatalogs();

export function getCaseImages(slug: string): CaseImage[] {
  return FULL_CATALOG[slug] ?? [];
}

export function getPrimaryCaseImage(slug: string): CaseImage | undefined {
  return getCaseImages(slug)[0];
}

export function attachCaseImages<T extends Pick<CrimeCase, "slug" | "images">>(crimeCase: T): T {
  const images = crimeCase.images?.length ? crimeCase.images : getCaseImages(crimeCase.slug);
  if (!images.length) return crimeCase;
  return { ...crimeCase, images };
}

export function catalogImageCoverage(): { total: number; withImages: number } {
  return {
    total: Object.keys(FULL_CATALOG).length,
    withImages: Object.values(FULL_CATALOG).filter((imgs) => imgs.length > 0).length,
  };
}
