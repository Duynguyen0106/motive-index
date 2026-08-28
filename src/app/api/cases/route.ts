import { NextResponse } from "next/server";
import { getAllCases, searchCasesFrom } from "@/lib/data";
import { resolveCaseCountry } from "@/lib/country";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 20), 1), 50);

  const all = getAllCases();

  if (q) {
    const hits = searchCasesFrom(all, { q }).slice(0, limit).map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      subtitle: c.subtitle,
      country: resolveCaseCountry(c),
      status: c.status,
      tags: c.tags,
    }));
    return NextResponse.json({ cases: hits });
  }

  const cases = all.slice(0, limit).map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    status: c.status,
    analysisStatus: c.analysis.status,
    featured: Boolean(c.featured),
    tags: c.tags,
  }));
  return NextResponse.json({ cases, total: all.length });
}
