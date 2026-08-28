import {
  analysisProviderLabel,
  narrativeSourceLabel,
  reviewStatusLabel,
} from "@/lib/aiProvenance";
import type { CaseNarrative, CrimeCase, ForensicAnalysis } from "@/lib/types";

function Badge({
  children,
  tone = "muted",
}: {
  children: React.ReactNode;
  tone?: "accent" | "muted" | "warn";
}) {
  const cls =
    tone === "accent"
      ? "bg-[color-mix(in_srgb,var(--accent)_12%,var(--paper))] text-[var(--accent)]"
      : tone === "warn"
        ? "bg-[color-mix(in_srgb,var(--maroon)_8%,var(--paper))] text-[var(--maroon)]"
        : "bg-[var(--surface)] text-[var(--muted)]";
  return (
    <span
      className={`inline-flex rounded px-2 py-0.5 text-xs font-semibold tracking-wide uppercase ${cls}`}
    >
      {children}
    </span>
  );
}

export function DossierAiProvenance({ crimeCase }: { crimeCase: CrimeCase }) {
  const { narrative, analysis } = crimeCase;
  return (
    <div className="flex flex-wrap gap-2">
      {narrative ? (
        <Badge tone={narrative.source === "llm" ? "accent" : "muted"}>
          {narrativeSourceLabel(narrative.source)}
        </Badge>
      ) : null}
      <Badge tone={analysis.constructs.length ? "accent" : "muted"}>
        {analysisProviderLabel(analysis)}
      </Badge>
      {!analysis.reviewedByHuman ? (
        <Badge tone="warn">{reviewStatusLabel(crimeCase)}</Badge>
      ) : (
        <Badge tone="muted">Human-reviewed</Badge>
      )}
    </div>
  );
}

export function NarrativeSourceBadge({ narrative }: { narrative: CaseNarrative }) {
  return (
    <Badge tone={narrative.source === "llm" ? "accent" : "muted"}>
      {narrativeSourceLabel(narrative.source)}
    </Badge>
  );
}

export function AnalysisProviderBadge({ analysis }: { analysis: ForensicAnalysis }) {
  return <Badge tone="muted">{analysisProviderLabel(analysis)}</Badge>;
}
