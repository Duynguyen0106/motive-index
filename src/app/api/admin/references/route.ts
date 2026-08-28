import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth";
import { getCaseBySlug, upsertCase } from "@/lib/data";
import { syncAfterCaseWrite } from "@/lib/dbSync";
import type { CaseReference } from "@/lib/types";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  slug: z.string().min(1),
  citation: z.string().min(3),
  url: z.union([z.string().url(), z.literal("")]).optional(),
  kind: z.enum(["court", "media", "report", "book", "journal"]).default("media"),
  note: z.string().optional(),
});

/** Add a verifiable reference to a draft/moderation case so publish gates can pass. */
export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  const ref: CaseReference = {
    id: `ref-${existing.slug}-${Date.now().toString(36)}`,
    citation: parsed.data.citation.trim(),
    kind: parsed.data.kind,
    url: parsed.data.url?.trim() || undefined,
    note: parsed.data.note?.trim() || `Added by ${session.email} during moderation`,
  };

  const updated = upsertCase({
    ...existing,
    references: [ref, ...(existing.references ?? [])],
    sources: [
      {
        title: ref.citation.slice(0, 120),
        url: ref.url,
        kind: "news",
      },
      ...(existing.sources ?? []),
    ],
  });

  await syncAfterCaseWrite(updated);
  return NextResponse.json({ case: updated, reference: ref });
}
