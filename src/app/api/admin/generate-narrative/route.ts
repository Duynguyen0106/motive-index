import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth";
import { addUpdate, getCaseBySlug, upsertCase } from "@/lib/data";
import {
  applyNarrativeToCase,
  generateCaseNarrative,
} from "@/lib/narrativeGenerate";
import { syncCaseToSupabase } from "@/lib/repository";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const bodySchema = z.object({
  slug: z.string().min(1),
});

/** Regenerate documentary narrative for a draft case (admin). */
export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
    await syncCaseToSupabase(updated);

    addUpdate({
      id: `upd-${Date.now()}`,
      createdAt: new Date().toISOString(),
      headline: `Narrative regenerated: ${updated.name}`,
      summary: `Provider: ${narrativeResult.provider}. ${narrativeResult.note ?? "Review before publish."}`,
      caseSlug: updated.slug,
      kind: "revision",
      status: "draft",
    });

    return NextResponse.json({
      case: updated,
      provider: narrativeResult.provider,
      note: narrativeResult.note,
      chapterCount: updated.narrative?.chapters.length ?? 0,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Narrative generation failed" },
      { status: 500 },
    );
  }
}
