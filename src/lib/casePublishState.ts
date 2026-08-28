/**
 * Publication state helpers — keep draft/moderation content out of indexes
 * and block upsertCase from bypassing the publishCase() provenance gate.
 */
import type { CrimeCase } from "@/lib/types";

/** Live-ingest or admin stubs awaiting human review. */
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

export function assertNoDirectPublish(
  existing: CrimeCase | undefined,
  next: CrimeCase,
): void {
  const wasPublished = existing?.analysis.status === "published";
  const nowPublished = next.analysis.status === "published";

  if (!wasPublished && nowPublished) {
    throw new Error(
      "Cannot set analysis.status to published via upsertCase — use publishCase() after moderation",
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
