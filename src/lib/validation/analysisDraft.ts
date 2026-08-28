/**
 * Post-parse checks for LLM/heuristic forensic analysis drafts.
 */
import type { ForensicAnalysis } from "@/lib/types";

const MIN_UNKNOWN_ITEMS = 2;

export function normalizeAnalysisDraft(
  analysis: ForensicAnalysis,
  modelVersion: string,
): ForensicAnalysis {
  const constructs = (analysis.constructs ?? []).map((c) => ({
    ...c,
    confidence: Math.min(0.9, Math.max(0.35, c.confidence)),
    counterEvidence: c.counterEvidence?.length
      ? c.counterEvidence
      : ["Competing public narratives may explain the same surface behavior."],
    clinicalCaveat:
      c.clinicalCaveat ??
      "Construct-level hypothesis from public record — not a clinical diagnosis.",
  }));

  const whatWeCannotKnow =
    (analysis.whatWeCannotKnow?.length ?? 0) >= MIN_UNKNOWN_ITEMS
      ? analysis.whatWeCannotKnow
      : [
          ...(analysis.whatWeCannotKnow ?? []),
          "Private mental states and undisclosed pre-offense history",
          "Full evidentiary record beyond public summaries",
        ].slice(0, 6);

  const alternativeExplanations =
    analysis.alternativeExplanations?.length > 0
      ? analysis.alternativeExplanations
      : ["Media framing may overstate personality pathology relative to situational factors."];

  return {
    ...analysis,
    status: "draft",
    reviewedByHuman: false,
    modelVersion,
    updatedAt: new Date().toISOString(),
    constructs,
    whatWeCannotKnow,
    alternativeExplanations,
    summary: analysis.summary?.trim() || "Draft analysis pending human review.",
  };
}
