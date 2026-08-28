import { CASE_IMAGE_CATALOG } from "@/data/caseImageCatalog";
import type { CaseImage, CrimeCase } from "@/lib/types";

export function getCaseImages(slug: string): CaseImage[] {
  return CASE_IMAGE_CATALOG[slug] ?? [];
}

export function getPrimaryCaseImage(slug: string): CaseImage | undefined {
  return getCaseImages(slug)[0];
}

export function attachCaseImages<T extends Pick<CrimeCase, "slug" | "images">>(crimeCase: T): T {
  const images = crimeCase.images?.length ? crimeCase.images : getCaseImages(crimeCase.slug);
  if (!images.length) return crimeCase;
  return { ...crimeCase, images };
}
