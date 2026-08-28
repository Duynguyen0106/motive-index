import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth";
import { addUpdate, getCaseBySlug, upsertCase } from "@/lib/data";
import { syncAfterCaseWrite, syncAfterUpdateWrite } from "@/lib/dbSync";
import { inferCountry } from "@/lib/country";
import type { CrimeCase, CrimeCategory } from "@/lib/types";

export const dynamic = "force-dynamic";

const referenceSchema = z.object({
  citation: z.string().min(3),
  url: z.union([z.string().url(), z.literal("")]).optional(),
  kind: z.enum(["court", "media", "report", "book", "journal"]).default("media"),
  note: z.string().optional(),
});

const bodySchema = z.object({
  name: z.string().min(2),
  subtitle: z.string().default(""),
  jurisdiction: z.string().default("Unspecified"),
  location: z.string().default("Unspecified"),
  yearStart: z.number().int().optional(),
  yearEnd: z.number().int().nullable().optional(),
  status: z.enum(["closed", "unsolved", "historical"]).default("closed"),
  crimeCategories: z.array(z.string()).default(["other"]),
  overview: z.string().min(10),
  warning: z.string().default("Draft case created in admin."),
  offenderName: z.string().optional(),
  references: z.array(referenceSchema).optional(),
});

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid case payload" }, { status: 400 });
  }

  const data = parsed.data;
  let slug = slugify(data.name);
  if (getCaseBySlug(slug)) slug = `${slug}-${Date.now().toString(36)}`;
  const id = `case-${Date.now()}`;
  const year = data.yearStart ?? new Date().getFullYear();
  const references = (data.references ?? []).map((r, i) => ({
    id: `ref-${slug}-${i}`,
    citation: r.citation,
    kind: r.kind,
    url: r.url?.trim() || undefined,
    note: r.note,
  }));

  const crimeCase: CrimeCase = {
    id,
    slug,
    name: data.name,
    subtitle: data.subtitle || "Admin-created case",
    jurisdiction: data.jurisdiction,
    location: data.location,
    country: inferCountry(data.jurisdiction, data.location),
    yearStart: year,
    yearEnd: data.yearEnd ?? undefined,
    era: String(year),
    status: data.status,
    crimeCategories: data.crimeCategories as CrimeCategory[],
    tags: ["admin-created", "awaiting-moderation", "draft"],
    psychologicalFactors: [],
    theoreticalFrameworks: [],
    diagnoses: [],
    offenders: [
      {
        id: `off-${Date.now()}`,
        name: data.offenderName || "Not specified",
        role: "offender",
        known: Boolean(data.offenderName),
      },
    ],
    victims: [],
    legalOutcome: { summary: "Pending verification." },
    behavioralProfile: {
      modusOperandi: "Pending analysis.",
      organizationLevel: "unknown",
    },
    motivationalFactors: [],
    relatedCaseSlugs: [],
    warning: data.warning,
    contentLevel: "standard",
    overview: data.overview,
    timeline: [
      {
        id: `evt-${Date.now()}`,
        date: new Date().toISOString().slice(0, 10),
        label: "Case created in admin",
        detail: `Created by ${session.email}`,
      },
    ],
    signals: [],
    documentIds: [],
    references,
    sources: [
      { title: "Admin creation form", kind: "primary" },
      ...references.slice(0, 2).map((r) => ({
        title: r.citation.slice(0, 120),
        url: r.url,
        kind: "news" as const,
      })),
    ],
    analysis: {
      status: "pending",
      summary: "Awaiting forensic analysis.",
      constructs: [],
      alternativeExplanations: [],
      whatWeCannotKnow: ["Full evidentiary record"],
      modelVersion: "admin-create",
      reviewedByHuman: false,
      updatedAt: new Date().toISOString(),
      expertCommentary: [],
    },
    featured: false,
  };

  upsertCase(crimeCase);
  const sync = await syncAfterCaseWrite(crimeCase);
  if (!sync.ok) {
    return NextResponse.json(
      { error: `Local save ok, Supabase sync failed: ${sync.error}` },
      { status: 207 },
    );
  }
  const update = addUpdate({
    id: `upd-${Date.now()}`,
    createdAt: new Date().toISOString(),
    headline: `Admin created case: ${crimeCase.name}`,
    summary: crimeCase.subtitle,
    caseSlug: crimeCase.slug,
    kind: "new_case",
    status: "draft",
  });
  await syncAfterUpdateWrite(update);

  return NextResponse.json({ case: crimeCase, supabaseSynced: !sync.skipped }, { status: 201 });
}
