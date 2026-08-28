import { NextResponse } from "next/server";
import { extractCaseMetadata } from "@/lib/extractCase";
import { requirePrivilegedApiAccess } from "@/lib/apiAuth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  rawText: z.string().min(40),
});

export async function POST(req: Request) {
  const auth = requirePrivilegedApiAccess(req);
  if (!auth.ok) return auth.response;

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "rawText is required (min 40 chars)" }, { status: 400 });
  }

  const result = await extractCaseMetadata(parsed.data.rawText);
  return NextResponse.json(result);
}
