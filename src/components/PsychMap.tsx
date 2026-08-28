import { AnalysisProviderBadge } from "@/components/AiProvenanceBadge";
import type { ForensicAnalysis, FrameworkNote, PsychConstruct } from "@/lib/types";
import { DIMENSION_LABELS, FRAMEWORK_LABELS } from "@/lib/types";
import { formatConfidence } from "@/lib/utils";

export function ConfidenceLabel({ value }: { value: number }) {
  return (
    <span className="confidence" title={`Confidence ${formatConfidence(value)}`}>
      Confidence {formatConfidence(value)}
    </span>
  );
}

export function DimensionCoverage({ constructs }: { constructs: PsychConstruct[] }) {
  const covered = new Set(constructs.map((c) => c.dimension));
  const total = 8;
  return (
    <p className="text-sm text-[var(--muted)]">
      {`Rubric coverage: ${covered.size}/${total} dimensions scored`}
    </p>
  );
}

export function AnalysisSynthesis({ text }: { text?: string }) {
  if (!text) return null;
  return (
    <section className="card p-6 md:p-8">
      <h2 className="display text-2xl">Integrated synthesis</h2>
      <p className="body-copy mt-4 text-[var(--ink-soft)] md:text-lg">{text}</p>
    </section>
  );
}

export function FrameworkNotes({ notes }: { notes?: FrameworkNote[] }) {
  if (!notes?.length) return null;
  return (
    <section className="mt-8">
      <h2 className="display text-2xl">Theoretical framework tests</h2>
      <p className="body-copy mt-2 max-w-3xl text-[var(--ink-soft)]">
        Each framework yields a testable prediction against public evidence — not a verdict.
      </p>
      <ul className="mt-5 grid gap-3">
        {notes.map((n) => (
          <li key={n.framework} className="framework-note card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold text-[var(--ink)]">
                {FRAMEWORK_LABELS[n.framework]}
              </h3>
              <ConfidenceLabel value={n.confidence} />
            </div>
            <p className="mt-3 text-sm text-[var(--ink-soft)]">
              <span className="font-medium text-[var(--ink)]">Prediction: </span>
              {n.prediction}
            </p>
            <p className="mt-2 text-sm text-[var(--muted)]">{n.assessment}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function PsychMap({ constructs }: { constructs: PsychConstruct[] }) {
  if (!constructs.length) {
    return (
      <p className="body-copy text-[var(--muted)]">
        No constructs scored yet. Analysis pending review.
      </p>
    );
  }

  return (
    <div className="divide-y divide-[var(--line)] border-y border-[var(--line-strong)]">
      {constructs.map((c) => (
        <article key={c.id} className="py-6 md:py-8">
          <div className="grid gap-6 md:grid-cols-[11rem_1fr]">
            <div>
              <p className="label">{DIMENSION_LABELS[c.dimension]}</p>
              <h3 className="display mt-2 text-xl text-[var(--ink)] md:text-2xl">{c.label}</h3>
              <div className="mt-3">
                <ConfidenceLabel value={c.confidence} />
              </div>
            </div>
            <div className="space-y-5">
              <p className="body-copy text-[var(--ink-soft)] md:text-[1.0625rem]">
                {c.hypothesis}
              </p>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <p className="label mb-2">Supporting evidence</p>
                  <ul className="space-y-2 text-sm text-[var(--ink-soft)]">
                    {c.evidence.map((e) => (
                      <li key={e} className="pl-3" style={{ borderLeft: "2px solid var(--line-strong)" }}>
                        {e}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="label mb-2">Counter-evidence</p>
                  <ul className="space-y-2 text-sm text-[var(--muted)]">
                    {c.counterEvidence.map((e) => (
                      <li key={e} className="pl-3" style={{ borderLeft: "2px solid var(--line)" }}>
                        {e}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              {c.clinicalCaveat ? (
                <p className="text-sm text-[var(--maroon)]">{c.clinicalCaveat}</p>
              ) : null}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export function ForensicAnalysisView({ analysis }: { analysis: ForensicAnalysis }) {
  return (
    <div className="space-y-8">
      <AnalysisSynthesis text={analysis.synthesis} />
      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="display text-3xl">Psychological map</h2>
          <div className="flex flex-col items-end gap-1">
            <AnalysisProviderBadge analysis={analysis} />
            <DimensionCoverage constructs={analysis.constructs} />
          </div>
        </div>
        <p className="body-copy mt-2 text-[var(--ink-soft)]">
          Constructs are hypotheses grounded in public behavior — not diagnoses. Each dimension
          includes supporting and counter-evidence.
        </p>
        <div className="mt-5">
          <PsychMap constructs={analysis.constructs} />
        </div>
      </section>
      <FrameworkNotes notes={analysis.frameworkNotes} />
    </div>
  );
}
