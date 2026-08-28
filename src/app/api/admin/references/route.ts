import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth";
import { getCaseBySlug, upsertCase } from "@/lib/data";
import { syncAfterCaseWrite } from "@/lib/dbSync";
import type { CaseReference, ExpertCommentary } from "@/lib/types";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  slug: z.string().min(1),
  citation: z.string().min(3),
  url: z.union([z.string().url(), z.literal("")]).optional(),
  kind: z.enum(["court", "media", "report", "book", "journal"]).default("media"),
  note: z.string().optional(),
});

const deleteSchema = z.object({
  slug: z.string().min(1),
  refId: z.string().min(1),
});

function appendAuditCommentary(
  existing: ExpertCommentary[] | undefined,
  session: { email: string },
  body: string,
): ExpertCommentary[] {
  const entry: ExpertCommentary = {
    id: `audit-${Date.now().toString(36)}`,
    author: session.email,
    role: "editor",
    title: "Reference edit",
    body,
    reviewed: true,
    publishedAt: new Date().toISOString(),
  };
  return [entry, ...(existing ?? [])];
}

/** Add a verifiable reference to any case (draft or published). */
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
    note: parsed.data.note?.trim() || `Added by ${session.email}`,
  };

  try {
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
      analysis: {
        ...existing.analysis,
        expertCommentary: appendAuditCommentary(
          existing.analysis.expertCommentary,
          session,
          `Added reference: ${ref.citation.slice(0, 120)}`,
        ),
        updatedAt: new Date().toISOString(),
      },
    });

    await syncAfterCaseWrite(updated);
    return NextResponse.json({ case: updated, reference: ref });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Reference write failed";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}

/** Remove a reference from a case (admin editorial correction). */
export async function DELETE(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = deleteSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const existing = getCaseBySlug(parsed.data.slug);
  if (!existing) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  const removed = (existing.references ?? []).find((r) => r.id === parsed.data.refId);
  if (!removed) {
    return NextResponse.json({ error: "Reference not found" }, { status: 404 });
  }

  try {
    const updated = upsertCase({
      ...existing,
      references: (existing.references ?? []).filter((r) => r.id !== parsed.data.refId),
      analysis: {
        ...existing.analysis,
        expertCommentary: appendAuditCommentary(
          existing.analysis.expertCommentary,
          session,
          `Removed reference: ${removed.citation.slice(0, 120)}`,
        ),
        updatedAt: new Date().toISOString(),
      },
    });

    await syncAfterCaseWrite(updated);
    return NextResponse.json({ case: updated, removedId: parsed.data.refId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Reference removal failed";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
