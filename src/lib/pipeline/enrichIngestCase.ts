import { analyzeWithOptionalLLM } from "@/lib/analyze";
import { extractCaseMetadata, normalizeCrimeCategories } from "@/lib/extractCase";
import {
  applyNarrativeToCase,
  generateCaseNarrative,
  heuristicNarrativeFromSources,
} from "@/lib/narrativeGenerate";
import { extractSignalsFromText } from "@/lib/pipeline/extractSignals";
import type { CrimeCase } from "@/lib/types";

export type EnrichmentResult = {
  crimeCase: CrimeCase;
  providers: {
    extract: string;
    signals: string;
    analysis: string;
    narrative: string;
  };
};

export function isLlmEnabled(options?: { useLlm?: boolean }): boolean {
  if (options?.useLlm === false) return false;
  if (options?.useLlm === true) return Boolean(process.env.OPENAI_API_KEY);
  return Boolean(process.env.OPENAI_API_KEY);
}

/** AI/heuristic enrichment for live-ingest drafts — extract, signals, analysis, narrative. */
export async function enrichIngestCase(
  draft: CrimeCase,
  source: { title: string; summary: string; link?: string },
  options?: { useLlm?: boolean },
): Promise<EnrichmentResult> {
  const useLlm = isLlmEnabled(options);
  const rawText = `${source.title}\n\n${source.summary}${source.link ? `\n\nSource: ${source.link}` : ""}`;

  const extractResult = await extractCaseMetadata(rawText);
  const meta = extractResult.extracted;

  const signalResult = await extractSignalsFromText({
    caseId: draft.id,
    title: source.title,
    summary: source.summary,
    sourceId: "rss",
  });

  let crimeCase: CrimeCase = {
    ...draft,
    name: meta.name.slice(0, 120) || draft.name,
    subtitle: meta.subtitle || draft.subtitle,
    jurisdiction: meta.jurisdiction || draft.jurisdiction,
    location: meta.location || draft.location,
    yearStart: meta.yearStart ?? draft.yearStart,
    yearEnd: meta.yearEnd ?? undefined,
    status: meta.status,
    crimeCategories: normalizeCrimeCategories(meta.crimeCategories),
    overview: meta.overview || draft.overview,
    warning: meta.warning,
    signals: signalResult.signals,
    offenders:
      meta.offenderName && meta.offenderName !== "Not verified"
        ? [
            {
              id: draft.offenders[0]?.id ?? `${draft.id}-off`,
              name: meta.offenderName,
              role: "offender" as const,
              known: true,
            },
          ]
        : draft.offenders,
    tags: Array.from(new Set([...draft.tags, useLlm ? "ai-enriched" : "heuristic-enriched"])),
  };

  const analysis = await analyzeWithOptionalLLM({
    caseName: crimeCase.name,
    overview: crimeCase.overview,
    signals: crimeCase.signals,
    slug: crimeCase.slug,
    subtitle: crimeCase.subtitle,
    jurisdiction: crimeCase.jurisdiction,
    location: crimeCase.location,
    yearStart: crimeCase.yearStart,
    status: crimeCase.status,
    crimeCategories: crimeCase.crimeCategories,
    offenderName: crimeCase.offenders[0]?.name,
  });

  crimeCase = {
    ...crimeCase,
    analysis: {
      ...analysis,
      status: "draft",
      reviewedByHuman: false,
    },
  };

  const narrativeResult = useLlm
    ? await generateCaseNarrative({
        caseName: crimeCase.name,
        overview: source.summary,
        subtitle: crimeCase.subtitle,
        sourceTitle: source.title,
        sourceUrl: source.link,
        yearStart: crimeCase.yearStart,
      })
    : {
        narrative: heuristicNarrativeFromSources({
          caseName: crimeCase.name,
          overview: source.summary,
          subtitle: crimeCase.subtitle,
          sourceTitle: source.title,
          sourceUrl: source.link,
          yearStart: crimeCase.yearStart,
        }),
        provider: "heuristic" as const,
        note: "Heuristic template — set OPENAI_API_KEY for LLM narratives.",
      };

  crimeCase = applyNarrativeToCase(crimeCase, narrativeResult, source.title);

  return {
    crimeCase,
    providers: {
      extract: extractResult.provider,
      signals: signalResult.provider,
      analysis: useLlm && process.env.OPENAI_API_KEY ? "openai" : analysis.modelVersion,
      narrative: narrativeResult.provider,
    },
  };
}
