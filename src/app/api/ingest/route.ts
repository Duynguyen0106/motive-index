import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeFromSignals } from "@/lib/analyze";
import { requirePrivilegedApiAccess } from "@/lib/apiAuth";
import { addUpdate, getCaseBySlug, upsertCase } from "@/lib/data";
import { syncAfterCaseWrite, syncAfterUpdateWrite } from "@/lib/dbSync";
import { applyNarrativeToCase, generateCaseNarrative } from "@/lib/narrativeGenerate";
import { tryAutoPublishCase } from "@/lib/pipeline/autoPublish";
import type { CrimeCase } from "@/lib/types";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  headline: z.string().min(3),
  summary: z.string().min(3),
  jurisdiction: z.string().default("Unspecified"),
  name: z.string().optional(),
  sourceUrl: z.string().url().optional(),
});

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

export async function POST(req: Request) {
  const auth = requirePrivilegedApiAccess(req);
  if (!auth.ok) return auth.response;

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const name = parsed.data.name ?? parsed.data.headline;
  let slug = slugify(name);
  if (getCaseBySlug(slug)) slug = `${slug}-${Date.now().toString(36)}`;

  const year = new Date().getFullYear();
  const analysis = analyzeFromSignals([], name);

  let crimeCase: CrimeCase = {
    id: `case-${Date.now()}`,
    slug,
    name,
    subtitle: "Newly ingested public-source stub",
    jurisdiction: parsed.data.jurisdiction,
    location: parsed.data.jurisdiction,
    yearStart: year,
    era: String(year),
    status: "closed",
    crimeCategories: ["other"],
    tags: ["live-ingest", "draft", "awaiting-moderation", "ai-pipeline"],
    psychologicalFactors: [],
    theoreticalFrameworks: [],
    diagnoses: [],
    offenders: [{ id: `off-${Date.now()}`, name: "Not verified", role: "offender", known: false }],
    victims: [],
    legalOutcome: { summary: "Draft stub — legal outcome not verified." },
    behavioralProfile: {
      modusOperandi: "Awaiting extraction.",
      organizationLevel: "unknown",
    },
    motivationalFactors: [],
    relatedCaseSlugs: [],
    warning:
      "Draft stub from public ingest. Not verified. No psychological constructs published yet.",
    contentLevel: "standard",
    overview: parsed.data.summary,
    timeline: [
      {
        id: `evt-${Date.now()}`,
        date: new Date().toISOString().slice(0, 10),
        label: "Ingested from public source cluster",
        detail: parsed.data.headline,
        behavioralNote: "Awaiting signal extraction.",
      },
    ],
    signals: [],
    documentIds: [],
    references: parsed.data.sourceUrl
      ? [
          {
            id: `ref-${slug}`,
            citation: parsed.data.headline,
            kind: "media" as const,
            url: parsed.data.sourceUrl,
          },
        ]
      : [],
    sources: [
      {
        title: parsed.data.headline,
        url: parsed.data.sourceUrl,
        kind: "news" as const,
      },
    ],
    analysis,
    featured: false,
  };

  const narrativeResult = await generateCaseNarrative({
    caseName: name,
    overview: parsed.data.summary,
    subtitle: crimeCase.subtitle,
    sourceTitle: parsed.data.headline,
    yearStart: year,
  });
  crimeCase = applyNarrativeToCase(crimeCase, narrativeResult, parsed.data.headline);

  upsertCase(crimeCase);
  await syncAfterCaseWrite(crimeCase);

  const publishResult = await tryAutoPublishCase(slug);
  if (publishResult.published) {
    const update = addUpdate({
      id: `upd-${Date.now()}`,
      createdAt: new Date().toISOString(),
      headline: `New case published: ${name}`,
      summary: parsed.data.summary.slice(0, 200),
      caseSlug: slug,
      kind: "new_case",
      status: "published",
    });
    await syncAfterUpdateWrite(update);
    return NextResponse.json(
      { case: publishResult.crimeCase, update, published: true },
      { status: 201 },
    );
  }

  const update = addUpdate({
    id: `upd-${Date.now()}`,
    createdAt: new Date().toISOString(),
    headline: `New draft stub: ${name}`,
    summary: parsed.data.summary.slice(0, 200),
    caseSlug: slug,
    kind: "new_case",
    status: "draft",
  });
  await syncAfterUpdateWrite(update);

  return NextResponse.json(
    { case: crimeCase, update, published: false, blockers: publishResult.blockers },
    { status: 201 },
  );
}

export async function GET() {
  return NextResponse.json({
    usage: {
      method: "POST",
      body: {
        headline: "string",
        summary: "string",
        jurisdiction: "optional string",
        name: "optional string",
      },
    },
  });
}
