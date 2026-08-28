import { NextResponse } from "next/server";
import { z } from "zod";
import { addUpdate, getCaseBySlug, upsertCase } from "@/lib/data";
import { syncAfterCaseWrite } from "@/lib/dbSync";
import {
  applyNarrativeToCase,
  generateCaseNarrative,
} from "@/lib/narrativeGenerate";
import { requirePipelineSecret } from "@/lib/pipelineAuth";
import { tryAutoPublishCase } from "@/lib/pipeline/autoPublish";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const bodySchema = z.object({
  slug: z.string().min(1),
  autoPublish: z.boolean().optional(),
});

/** Regenerate documentary narrative for a draft case (secured pipeline). */
export async function POST(req: Request) {
  const auth = requirePipelineSecret(req);
  if (!auth.ok) return auth.response;

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "slug required" }, { status: 400 });
  }

  const existing = getCaseBySlug(parsed.data.slug);
  if (!existing) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  try {
    const sourceTitle = existing.sources[0]?.title ?? existing.name;
    const narrativeResult = await generateCaseNarrative({
      caseName: existing.name,
      overview: existing.overview,
      subtitle: existing.subtitle,
      sourceTitle,
      sourceUrl: existing.sources[0]?.url,
      yearStart: existing.yearStart,
    });

    const updated = applyNarrativeToCase(existing, narrativeResult, sourceTitle);
    upsertCase(updated);
    await syncAfterCaseWrite(updated);

    addUpdate({
      id: `upd-${Date.now()}`,
      createdAt: new Date().toISOString(),
      headline: `Narrative regenerated: ${updated.name}`,
      summary: `Provider: ${narrativeResult.provider}. ${narrativeResult.note ?? "Integrity gates apply before publish."}`,
      caseSlug: updated.slug,
      kind: "revision",
      status: "draft",
    });

    let publishResult = null;
    if (parsed.data.autoPublish !== false) {
      publishResult = await tryAutoPublishCase(updated.slug);
    }

    return NextResponse.json({
      case: publishResult?.published ? publishResult.crimeCase : updated,
      provider: narrativeResult.provider,
      note: narrativeResult.note,
      chapterCount: updated.narrative?.chapters.length ?? 0,
      publish: publishResult,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Narrative generation failed" },
      { status: 500 },
    );
  }
}
