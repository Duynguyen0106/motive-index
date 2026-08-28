import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth";
import {
  addUpdate,
  getCaseBySlug,
  getModerationQueue,
  publishCase,
  rejectCase,
} from "@/lib/data";
import { syncAfterCaseWrite, syncAfterUpdateWrite } from "@/lib/dbSync";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  slug: z.string().min(1),
  action: z.enum(["approve", "reject"]),
  note: z.string().optional(),
});

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ queue: getModerationQueue() });
}

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const existing = getCaseBySlug(parsed.data.slug);
  if (!existing) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  if (parsed.data.action === "approve") {
    try {
      const published = publishCase(parsed.data.slug, session.email);
      if (!published) {
        return NextResponse.json({ error: "Publish failed" }, { status: 500 });
      }
      await syncAfterCaseWrite(published);
      const update = addUpdate({
        id: `upd-${Date.now()}`,
        createdAt: new Date().toISOString(),
        headline: `Published after moderation: ${published.name}`,
        summary: parsed.data.note || `Approved by ${session.email}`,
        caseSlug: published.slug,
        kind: "analysis_ready",
        status: "published",
      });
      await syncAfterUpdateWrite(update);
      return NextResponse.json({ case: published, action: "approve" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Publish validation failed";
      return NextResponse.json({ error: message }, { status: 422 });
    }
  }

  const rejected = rejectCase(parsed.data.slug, session.email, parsed.data.note);
  if (!rejected) {
    return NextResponse.json({ error: "Reject failed" }, { status: 500 });
  }
  await syncAfterCaseWrite(rejected);
  const update = addUpdate({
    id: `upd-${Date.now()}`,
    createdAt: new Date().toISOString(),
    headline: `Draft rejected: ${rejected.name}`,
    summary: parsed.data.note || `Rejected by ${session.email}`,
    caseSlug: rejected.slug,
    kind: "revision",
    status: "draft",
  });
  await syncAfterUpdateWrite(update);
  return NextResponse.json({ case: rejected, action: "reject" });
}
