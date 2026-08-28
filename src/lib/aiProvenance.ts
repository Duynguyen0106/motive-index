import type { CaseNarrative, CrimeCase, ForensicAnalysis } from "@/lib/types";
import { PIPELINE_REVIEWER } from "@/lib/pipeline/autoPublish";

export function narrativeSourceLabel(source?: CaseNarrative["source"]): string {
  switch (source) {
    case "llm":
      return "AI-generated narrative";
    case "heuristic":
      return "Template narrative";
    case "human":
      return "Human-edited narrative";
    default:
      return "Narrative source unknown";
  }
}

export function analysisProviderLabel(analysis: ForensicAnalysis): string {
  if (analysis.modelVersion.includes("llm")) {
    return "AI rubric analysis";
  }
  if (analysis.modelVersion.includes("deep") || analysis.modelVersion.includes("rubric")) {
    return "Algorithmic rubric analysis";
  }
  return `Analysis (${analysis.modelVersion})`;
}

export function reviewStatusLabel(crimeCase: CrimeCase): string {
  const { analysis } = crimeCase;
  if (analysis.reviewedByHuman) return "Human-reviewed";
  const pipelineNote = analysis.expertCommentary?.some(
    (c) => c.author === PIPELINE_REVIEWER || c.title === "Pipeline auto-publish",
  );
  if (pipelineNote || crimeCase.tags.includes("ai-pipeline")) {
    return "Automated integrity review (AI-generated, not human-verified)";
  }
  if (crimeCase.tags.includes("ai-enriched")) {
    return "AI-enriched draft";
  }
  return "Awaiting review";
}

export function isAiEnrichedCase(crimeCase: CrimeCase): boolean {
  return (
    crimeCase.tags.includes("ai-enriched") ||
    crimeCase.narrative?.source === "llm" ||
    crimeCase.analysis.expertCommentary?.some((c) => c.author === PIPELINE_REVIEWER) === true
  );
}
