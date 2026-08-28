import { NextResponse } from "next/server";
import { searchDocuments } from "@/lib/data";
import { DOCUMENT_TYPE_LABELS } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 8), 1), 20);

  if (!q) {
    return NextResponse.json({ documents: [] });
  }

  const hits = searchDocuments({
    q,
    crimeCategory: "",
    psychologicalFactor: "",
    theoreticalFramework: "",
    diagnosis: "",
    country: "",
    location: "",
    period: "",
    offenderSex: "",
    documentType: "",
    status: "",
    catalogTier: "",
  })
    .slice(0, limit)
    .map((d) => ({
      id: d.id,
      title: d.title,
      type: d.type,
      typeLabel: DOCUMENT_TYPE_LABELS[d.type],
      caseSlug: d.caseSlug,
      summary: d.summary.slice(0, 100),
    }));

  return NextResponse.json({ documents: hits });
}
