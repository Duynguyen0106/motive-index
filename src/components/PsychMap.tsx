import type { PsychConstruct } from "@/lib/types";
import { DIMENSION_LABELS } from "@/lib/types";
import { formatConfidence } from "@/lib/utils";

export function ConfidenceLabel({ value }: { value: number }) {
  return (
    <span className="confidence" title={`Confidence ${formatConfidence(value)}`}>
      Confidence {formatConfidence(value)}
    </span>
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
