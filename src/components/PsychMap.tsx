import type { PsychConstruct } from "@/lib/types";
import { DIMENSION_LABELS } from "@/lib/types";
import { formatConfidence } from "@/lib/utils";

export function ConfidenceBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--line)]">
        <div
          className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-700"
          style={{ width: `${Math.round(value * 100)}%` }}
        />
      </div>
      <span className="w-10 text-right text-xs tabular-nums text-[var(--muted)]">
        {formatConfidence(value)}
      </span>
    </div>
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
    <div className="grid gap-4">
      {constructs.map((c) => (
        <article key={c.id} className="card p-5 md:p-6">
          <div className="grid gap-4 md:grid-cols-[200px_1fr]">
            <div>
              <p className="text-xs font-medium tracking-[0.14em] text-[var(--muted)] uppercase">
                {DIMENSION_LABELS[c.dimension]}
              </p>
              <h3 className="display mt-2 text-xl text-[var(--ink)] md:text-2xl">
                {c.label}
              </h3>
              <div className="mt-4">
                <ConfidenceBar value={c.confidence} />
              </div>
            </div>
            <div className="space-y-4">
              <p className="body-copy text-[var(--ink-soft)] md:text-lg">
                {c.hypothesis}
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs font-semibold tracking-[0.14em] text-[var(--accent)] uppercase">
                    Evidence
                  </p>
                  <ul className="space-y-2 text-sm text-[var(--ink-soft)]">
                    {c.evidence.map((e) => (
                      <li
                        key={e}
                        className="border-l-2 border-[var(--accent)] pl-3"
                      >
                        {e}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold tracking-[0.14em] text-[var(--muted)] uppercase">
                    Counter-evidence
                  </p>
                  <ul className="space-y-2 text-sm text-[var(--muted)]">
                    {c.counterEvidence.map((e) => (
                      <li key={e} className="border-l-2 border-[var(--line)] pl-3">
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
