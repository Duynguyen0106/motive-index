/**
 * Runtime validation on case writes — complements CI catalog checks.
 * Draft/moderation stubs skip full provenance; non-draft upserts must pass error-level rules.
 */
import type { CrimeCase } from "@/lib/types";
import { assertNoDirectPublish } from "@/lib/casePublishState";
import {
  isDraftInput,
  isSyntheticReference,
  validateProvenance,
  type ProvenanceInput,
} from "@/lib/validation/caseProvenance";

export function assertRuntimeCaseWrite(
  existing: CrimeCase | undefined,
  next: CrimeCase,
): void {
  assertNoDirectPublish(existing, next);

  if (
    isDraftInput({
      tags: next.tags,
      analysisStatus: next.analysis.status,
    })
  ) {
    return;
  }

  const violations = validateProvenance(
    {
      slug: next.slug,
      tags: next.tags,
      references: next.references,
      offenderName: next.offenders?.[0]?.name,
      name: next.name,
      analysisStatus: next.analysis.status,
    },
    { strictSlugMatch: false },
  ).filter((v) => v.level === "error");

  if (violations.length > 0) {
    throw new Error(
      `Case write failed provenance check: ${violations.map((v) => v.message).join("; ")}`,
    );
  }
}

/** Ingest/admin stubs must cite at least one non-template source before moderation approve. */
export function assertModerationPublishReady(c: ProvenanceInput): void {
  const fromPipeline =
    c.tags?.includes("live-ingest") === true ||
    c.tags?.includes("admin-created") === true;
  if (!fromPipeline) return;

  const refs = c.references ?? [];
  const hasVerifiable = refs.some(
    (r) => !isSyntheticReference(r) && (Boolean(r.url?.trim()) || r.kind === "court" || r.kind === "report"),
  );

  if (!hasVerifiable) {
    throw new Error(
      `Moderation publish requires ≥1 verifiable non-template reference for ${c.slug}`,
    );
  }
}
