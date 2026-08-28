import { NextResponse } from "next/server";
import { z } from "zod";
import { addContribution } from "@/lib/data";
import { syncAfterContributionWrite } from "@/lib/dbSync";

export const dynamic = "force-dynamic";

const schema = z.object({
  kind: z.enum(["case", "analysis", "document"]),
  title: z.string().min(3),
  submitterName: z.string().min(2),
  submitterRole: z.string().min(2),
  summary: z.string().min(10),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
  }
  const row = addContribution(parsed.data);
  await syncAfterContributionWrite(row);
  return NextResponse.json({ submission: row }, { status: 201 });
}
