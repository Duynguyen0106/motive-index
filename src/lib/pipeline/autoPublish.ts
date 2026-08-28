import { addUpdate, getCaseBySlug, getModerationQueue, publishCase } from "@/lib/data";
import { syncAfterCaseWrite, syncAfterUpdateWrite } from "@/lib/dbSync";
import { getPublishReadiness } from "@/lib/moderationPublish";
import type { CrimeCase } from "@/lib/types";

export const PIPELINE_REVIEWER = "ai-pipeline@motive-index";

export type AutoPublishResult =
  | { published: true; slug: string; crimeCase: CrimeCase }
  | { published: false; slug: string; blockers: string[]; warnings: string[] };

/** Attempt publish only when integrity gates pass — same rules as manual approve. */
export async function tryAutoPublishCase(slug: string): Promise<AutoPublishResult> {
  const existing = getCaseBySlug(slug);
  if (!existing) {
    return { published: false, slug, blockers: ["Case not found"], warnings: [] };
  }

  if (existing.analysis.status === "published") {
    return { published: true, slug, crimeCase: existing };
  }

  const readiness = getPublishReadiness(existing);
  if (!readiness.ready) {
    return {
      published: false,
      slug,
      blockers: readiness.blockers,
      warnings: readiness.warnings,
    };
  }

  try {
    const published = publishCase(slug, PIPELINE_REVIEWER, { viaPipeline: true });
    if (!published) {
      return {
        published: false,
        slug,
        blockers: ["Publish failed"],
        warnings: readiness.warnings,
      };
    }

    await syncAfterCaseWrite(published);
    const update = addUpdate({
      id: `upd-${Date.now()}-${slug.slice(0, 12)}`,
      createdAt: new Date().toISOString(),
      headline: `Auto-published: ${published.name.slice(0, 80)}`,
      summary:
        "Published by secured AI pipeline after provenance and reference gates passed. Narrative may be AI-generated — verify against primary sources.",
      caseSlug: published.slug,
      kind: "analysis_ready",
      status: "published",
    });
    await syncAfterUpdateWrite(update);

    return { published: true, slug, crimeCase: published };
  } catch (err) {
    return {
      published: false,
      slug,
      blockers: [err instanceof Error ? err.message : "Publish validation failed"],
      warnings: readiness.warnings,
    };
  }
}

export async function autoPublishReadyDrafts(): Promise<{
  attempted: number;
  published: string[];
  skipped: { slug: string; blockers: string[] }[];
}> {
  const drafts = getModerationQueue();
  const published: string[] = [];
  const skipped: { slug: string; blockers: string[] }[] = [];

  for (const draft of drafts) {
    const result = await tryAutoPublishCase(draft.slug);
    if (result.published) {
      published.push(result.slug);
    } else if (!result.published) {
      skipped.push({ slug: result.slug, blockers: result.blockers });
    }
  }

  return { attempted: drafts.length, published, skipped };
}
