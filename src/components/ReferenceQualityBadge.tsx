import type { CaseReference } from "@/lib/types";
import {
  classifyReferenceQuality,
  referenceQualityLabel,
} from "@/lib/validation/referenceAccuracy";

const TIER_STYLES: Record<
  ReturnType<typeof classifyReferenceQuality>,
  string
> = {
  "primary-direct":
    "border-[color-mix(in_srgb,var(--cs-signal)_45%,var(--line))] bg-[color-mix(in_srgb,var(--cs-deep)_22%,transparent)] text-[var(--cs-fog)]",
  "primary-offline":
    "border-[var(--line-strong)] bg-[color-mix(in_srgb,var(--paper)_80%,transparent)] text-[var(--ink-soft)]",
  "secondary-scholarly":
    "border-[var(--line)] bg-transparent text-[var(--muted)]",
  "synthetic-template":
    "border-dashed border-[var(--line-strong)] bg-transparent text-[var(--muted)]",
  invalid:
    "border-[var(--warning)] bg-[color-mix(in_srgb,var(--warning)_12%,transparent)] text-[var(--warning)]",
};

export function ReferenceQualityBadge({ reference }: { reference: CaseReference }) {
  const tier = classifyReferenceQuality(reference);
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[0.625rem] font-semibold uppercase tracking-[0.08em] ${TIER_STYLES[tier]}`}
      title={
        tier === "synthetic-template"
          ? "Teaching placeholder — verify facts in primary archives before citing"
          : undefined
      }
    >
      {referenceQualityLabel(tier)}
    </span>
  );
}
