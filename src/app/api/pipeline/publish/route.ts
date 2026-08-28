import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePipelineSecret } from "@/lib/pipelineAuth";
import { autoPublishReadyDrafts, tryAutoPublishCase } from "@/lib/pipeline/autoPublish";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  slug: z.string().min(1).optional(),
  retryAll: z.boolean().optional(),
});

/** Publish one slug or retry all ready drafts through integrity gates. */
export async function POST(req: Request) {
  const auth = requirePipelineSecret(req);
  if (!auth.ok) return auth.response;

  const json = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (parsed.data.retryAll) {
    const result = await autoPublishReadyDrafts();
    return NextResponse.json({ ok: true, ...result });
  }

  if (!parsed.data.slug) {
    return NextResponse.json({ error: "slug or retryAll required" }, { status: 400 });
  }

  const result = await tryAutoPublishCase(parsed.data.slug);
  if (!result.published) {
    return NextResponse.json(
      { ok: false, slug: result.slug, blockers: result.blockers, warnings: result.warnings },
      { status: 422 },
    );
  }

  return NextResponse.json({ ok: true, case: result.crimeCase });
}
