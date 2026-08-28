import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth";
import { getContributions, updateContribution } from "@/lib/data";
import { syncAfterContributionWrite } from "@/lib/dbSync";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  id: z.string().min(1),
  action: z.enum(["accept", "reject", "review"]),
  note: z.string().optional(),
});

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ contributions: getContributions() });
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

  const statusMap = {
    accept: "accepted",
    reject: "rejected",
    review: "in_review",
  } as const;

  const updated = updateContribution(parsed.data.id, {
    status: statusMap[parsed.data.action],
  });
  if (!updated) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  await syncAfterContributionWrite(updated);
  return NextResponse.json({
    contribution: updated,
    note: parsed.data.note,
    reviewedBy: session.email,
  });
}
