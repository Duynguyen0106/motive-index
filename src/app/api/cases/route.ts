import { NextResponse } from "next/server";
import { getAllCases } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const cases = getAllCases().map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    status: c.status,
    analysisStatus: c.analysis.status,
    featured: Boolean(c.featured),
    tags: c.tags,
  }));
  return NextResponse.json({ cases });
}
