import type { CrimeCase } from "@/lib/types";
import { isSyntheticReference } from "@/lib/validation/caseProvenance";

export type PublishReadiness = {
  ready: boolean;
  blockers: string[];
  warnings: string[];
};

function hasVerifiableReference(c: CrimeCase): boolean {
  return (c.references ?? []).some(
    (r) =>
      !isSyntheticReference(r) &&
      (Boolean(r.url?.trim()) || r.kind === "court" || r.kind === "report"),
  );
}

function isPipelineStub(c: CrimeCase): boolean {
  return c.tags.includes("live-ingest") || c.tags.includes("admin-created");
}

/** UI + admin hints before moderation approve. Mirrors publishCase() gates. */
export function getPublishReadiness(c: CrimeCase): PublishReadiness {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (isPipelineStub(c) && !hasVerifiableReference(c)) {
    blockers.push(
      "Add at least one verifiable reference (direct URL or court/report citation) before publish.",
    );
  }

  if (!c.narrative?.chapters?.length) {
    warnings.push("No full story narrative — regenerate story or approve overview-only.");
  } else if (c.narrative.source === "llm" || c.narrative.source === "heuristic") {
    warnings.push("Narrative is AI/heuristic — verify facts against primary sources.");
  }

  if (c.analysis.status === "pending" && !(c.analysis.constructs?.length ?? 0)) {
    warnings.push("Forensic analysis is still pending.");
  } else if (c.analysis.status === "draft" && !c.analysis.reviewedByHuman) {
    warnings.push("Analysis is draft-only — human review required before citing constructs.");
  }

  const offender = c.offenders[0]?.name ?? "";
  if (
    offender === "Not verified" ||
    offender === "Not specified" ||
    offender.toLowerCase() === "unknown"
  ) {
    warnings.push("Offender identity is not verified in this stub.");
  }

  if (c.tags.includes("rejected")) {
    blockers.push("Case was rejected — edit and re-queue before publishing.");
  }

  return {
    ready: blockers.length === 0,
    blockers,
    warnings,
  };
}
