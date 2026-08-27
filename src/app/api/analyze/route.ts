import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeWithOptionalLLM } from "@/lib/analyze";
import { getCaseBySlug, upsertCase, addUpdate } from "@/lib/data";
import type { BehaviorSignal } from "@/lib/types";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  slug: z.string().min(1),
  force: z.boolean().optional(),
  signals: z
    .array(
      z.object({
        id: z.string(),
        dimension: z.enum([
          "planning",
          "affect",
          "empathy_remorse",
          "control",
          "reality_testing",
          "social_functioning",
          "stressors",
          "pattern_consistency",
        ]),
        observation: z.string().min(1),
        sourceIds: z.array(z.string()),
      }),
    )
    .optional(),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const existing = getCaseBySlug(parsed.data.slug);
  if (!existing) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  if (
    existing.analysis.status === "published" &&
    existing.analysis.reviewedByHuman &&
    !parsed.data.force
  ) {
    return NextResponse.json(
      {
        error:
          "Refusing to overwrite a human-reviewed published analysis. Pass force:true to replace with a draft.",
      },
      { status: 409 },
    );
  }

  const signals =
    (parsed.data.signals as BehaviorSignal[] | undefined) ?? existing.signals;
  const analysis = await analyzeWithOptionalLLM({
    caseName: existing.name,
    overview: existing.overview,
    signals,
  });

  const updated = upsertCase({
    ...existing,
    signals,
    analysis: {
      ...analysis,
      status: analysis.constructs.length ? "draft" : "pending",
      expertCommentary: existing.analysis.expertCommentary,
    },
  });

  addUpdate({
    id: `upd-${Date.now()}`,
    createdAt: new Date().toISOString(),
    headline: `Analysis draft regenerated for ${existing.name}`,
    summary: analysis.summary.slice(0, 180),
    caseSlug: existing.slug,
    kind: "analysis_ready",
    status: "draft",
  });

  return NextResponse.json({ case: updated });
}
