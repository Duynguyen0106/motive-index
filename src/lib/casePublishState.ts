/**
 * Publication state helpers — keep draft/moderation content out of indexes
 * and block upsertCase from bypassing the publishCase() provenance gate.
 */
import type { CrimeCase } from "@/lib/types";

/** Live-ingest stubs awaiting integrity gate review. */
export function isModerationDraftCase(
  c: Pick<CrimeCase, "tags" | "analysis">,
): boolean {
  if (c.tags.includes("rejected")) return true;
  return (
    c.tags.includes("draft") ||
    c.tags.includes("awaiting-moderation") ||
    (c.tags.includes("live-ingest") && c.analysis.status !== "published") ||
    (c.tags.includes("admin-created") && c.analysis.status !== "published")
  );
}

/** Cases safe for sitemap / public SEO indexing. */
export function shouldIndexCase(c: CrimeCase): boolean {
  if (c.tags.includes("rejected")) return false;
  return !isModerationDraftCase(c);
}

/** Wikipedia/Wikidata bulk imports — encyclopedic, not human-reviewed. */
export function isEncyclopedicImportCase(c: Pick<CrimeCase, "tags">): boolean {
  return c.tags.includes("wikidata-import") || c.tags.includes("wikipedia-sourced");
}

/** Catalog entries visible in archive, monitor, search, and public APIs. */
export function isPublicCatalogCase(c: Pick<CrimeCase, "tags" | "analysis">): boolean {
  return !isModerationDraftCase(c);
}

export function filterPublicCases(cases: CrimeCase[]): CrimeCase[] {
  return cases.filter(isPublicCatalogCase);
}

/** Procedurally expanded catalog narrative (not hand-authored or LLM). */
export function isProceduralNarrativeCase(
  c: Pick<CrimeCase, "tags" | "narrative">,
): boolean {
  if (!c.narrative) return false;
  if (c.narrative.source === "human") return false;
  return c.tags.includes("deep-dossier") || c.narrative.source === "heuristic";
}

export function assertNoDirectPublish(
  existing: CrimeCase | undefined,
  next: CrimeCase,
): void {
  const wasPublished = existing?.analysis.status === "published";
  const nowPublished = next.analysis.status === "published";

  if (!wasPublished && nowPublished) {
    throw new Error(
      "Cannot set analysis.status to published via upsertCase — use publishCase() after pipeline gates pass",
    );
  }

  const wasReviewed = existing?.analysis.reviewedByHuman === true;
  const nowReviewed = next.analysis.reviewedByHuman === true;

  if (!wasReviewed && nowReviewed && nowPublished) {
    throw new Error(
      "Cannot mark reviewedByHuman on a published analysis via upsertCase — use publishCase()",
    );
  }

  const hadPublishedTag = existing?.tags.includes("published") === true;
  const hasPublishedTag = next.tags.includes("published");

  if (!hadPublishedTag && hasPublishedTag) {
    throw new Error("Cannot add published tag via upsertCase — use publishCase()");
  }
}
