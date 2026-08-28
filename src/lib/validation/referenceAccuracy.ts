/**
 * Reference accuracy framework — ensures citations, URLs, and provenance
 * tiers stay aligned so users can verify dossier claims against real sources.
 */
import type { CaseReference } from "@/lib/types";
import {
  isPrimarySourceReference,
  isSyntheticReference,
  type CaseProvenanceTier,
} from "@/lib/validation/caseProvenance";
import { isDirectSourceUrl, isHomepageOnlyUrl } from "@/lib/validation/referenceUrls";

/** How trustworthy / actionable a reference is for fact-checking. */
export type ReferenceQualityTier =
  | "primary-direct"
  | "primary-offline"
  | "secondary-scholarly"
  | "synthetic-template"
  | "invalid";

export type ReferenceAccuracyViolation = {
  level: "error" | "warning";
  code: string;
  message: string;
  slug?: string;
  refId?: string;
};

/** When a citation names a publisher, the URL should resolve there (not a unrelated host). */
export const CITATION_PUBLISHER_RULES: ReadonlyArray<{
  id: string;
  phrases: readonly string[];
  domains: readonly string[];
}> = [
  { id: "nyt", phrases: ["new york times"], domains: ["nytimes.com"] },
  { id: "wapo", phrases: ["washington post"], domains: ["washingtonpost.com"] },
  { id: "latimes", phrases: ["los angeles times"], domains: ["latimes.com"] },
  { id: "jsonline", phrases: ["journal sentinel"], domains: ["jsonline.com"] },
  { id: "bbc", phrases: ["bbc news", "bbc archive", "bbc history"], domains: ["bbc.co.uk", "bbc.com"] },
  { id: "fbi", phrases: ["fbi —", "fbi vault", "fbi /"], domains: ["fbi.gov"] },
  { id: "justice", phrases: ["u.s. department of justice", "department of justice"], domains: ["justice.gov"] },
  { id: "wikipedia", phrases: ["wikipedia"], domains: ["wikipedia.org"] },
  { id: "guardian", phrases: ["the guardian"], domains: ["theguardian.com"] },
  { id: "hurriyet", phrases: ["hürriyet", "hurriyet"], domains: ["hurriyet.com.tr"] },
  { id: "spiegel", phrases: ["der spiegel"], domains: ["spiegel.de"] },
  { id: "standard", phrases: ["der standard"], domains: ["derstandard.at"] },
];

export function classifyReferenceQuality(ref: CaseReference): ReferenceQualityTier {
  if (isSyntheticReference(ref)) return "synthetic-template";

  if (ref.url?.trim()) {
    if (isHomepageOnlyUrl(ref.url)) return "invalid";
    if (isPrimarySourceReference(ref) && isDirectSourceUrl(ref.url)) return "primary-direct";
    if (isPrimarySourceReference(ref)) return "invalid";
    return "secondary-scholarly";
  }

  if (isPrimarySourceReference(ref)) return "primary-offline";
  if (ref.kind === "book" || ref.kind === "journal") return "secondary-scholarly";
  return "primary-offline";
}

export function referenceQualityLabel(tier: ReferenceQualityTier): string {
  switch (tier) {
    case "primary-direct":
      return "Primary source";
    case "primary-offline":
      return "Primary record";
    case "secondary-scholarly":
      return "Secondary source";
    case "synthetic-template":
      return "Teaching template";
    case "invalid":
      return "Needs review";
  }
}

export function getPrimaryDirectReferences(refs: CaseReference[]): CaseReference[] {
  return refs.filter(
    (r) => classifyReferenceQuality(r) === "primary-direct",
  );
}

function citationPublisherMismatch(ref: CaseReference): string | null {
  if (!ref.url?.trim()) return null;
  const citation = ref.citation.toLowerCase();
  const url = ref.url.toLowerCase();
  for (const rule of CITATION_PUBLISHER_RULES) {
    if (!rule.phrases.some((p) => citation.includes(p))) continue;
    if (!rule.domains.some((d) => url.includes(d))) {
      return `Citation references ${rule.id} but URL is not on ${rule.domains.join(" or ")}`;
    }
  }
  return null;
}

export function validateSingleReference(
  ref: CaseReference,
  ctx: { slug: string },
): ReferenceAccuracyViolation[] {
  const violations: ReferenceAccuracyViolation[] = [];
  const refId = ref.id;

  if (!ref.id?.trim()) {
    violations.push({
      level: "error",
      code: "missing-ref-id",
      message: "Reference missing id",
      slug: ctx.slug,
    });
  }

  if (!ref.citation?.trim()) {
    violations.push({
      level: "error",
      code: "missing-citation",
      message: `Empty citation: ${ctx.slug} -> ${refId}`,
      slug: ctx.slug,
      refId,
    });
  }

  if (ref.synthetic && !isSyntheticReference(ref)) {
    violations.push({
      level: "warning",
      code: "synthetic-flag-without-marker",
      message: `Reference marked synthetic but citation lacks [Template] marker: ${ctx.slug} -> ${refId}`,
      slug: ctx.slug,
      refId,
    });
  }

  if (!ref.synthetic && isSyntheticReference(ref)) {
    violations.push({
      level: "error",
      code: "unmarked-synthetic",
      message: `Synthetic citation not flagged synthetic: ${ctx.slug} -> ${refId}`,
      slug: ctx.slug,
      refId,
    });
  }

  if (ref.url?.trim()) {
    try {
      new URL(ref.url);
    } catch {
      violations.push({
        level: "error",
        code: "invalid-url",
        message: `Malformed URL: ${ctx.slug} -> ${refId}`,
        slug: ctx.slug,
        refId,
      });
    }

    if (isHomepageOnlyUrl(ref.url)) {
      violations.push({
        level: "error",
        code: "homepage-only-url",
        message: `Homepage-only URL (not case-specific): ${ctx.slug} -> ${refId} (${ref.url})`,
        slug: ctx.slug,
        refId,
      });
    }

    const publisherMismatch = citationPublisherMismatch(ref);
    if (publisherMismatch) {
      violations.push({
        level: "warning",
        code: "citation-url-mismatch",
        message: `${publisherMismatch}: ${ctx.slug} -> ${refId}`,
        slug: ctx.slug,
        refId,
      });
    }
  }

  const quality = classifyReferenceQuality(ref);
  if (quality === "invalid" && ref.url?.trim() && !isSyntheticReference(ref)) {
    violations.push({
      level: "error",
      code: "invalid-primary-url",
      message: `Primary reference URL fails direct-source check: ${ctx.slug} -> ${refId}`,
      slug: ctx.slug,
      refId,
    });
  }

  if (
    isPrimarySourceReference(ref) &&
    !ref.synthetic &&
    !ref.note?.trim()
  ) {
    violations.push({
      level: "warning",
      code: "missing-forensic-note",
      message: `Primary reference lacks forensic relevance note: ${ctx.slug} -> ${refId}`,
      slug: ctx.slug,
      refId,
    });
  }

  if (ref.year && !/^\d{4}(–\d{4})?$/.test(ref.year) && !/^\d{4}$/.test(ref.year)) {
    violations.push({
      level: "warning",
      code: "unusual-year-format",
      message: `Unusual year format "${ref.year}": ${ctx.slug} -> ${refId}`,
      slug: ctx.slug,
      refId,
    });
  }

  return violations;
}

export function validateCaseReferenceSet(input: {
  slug: string;
  references: CaseReference[];
  provenanceTier: CaseProvenanceTier;
  multilingual?: boolean;
}): ReferenceAccuracyViolation[] {
  const violations: ReferenceAccuracyViolation[] = [];
  const refs = input.references ?? [];

  for (const ref of refs) {
    violations.push(...validateSingleReference(ref, { slug: input.slug }));
  }

  const urlSeen = new Map<string, string>();
  for (const ref of refs) {
    if (!ref.url?.trim()) continue;
    const prev = urlSeen.get(ref.url);
    if (prev) {
      violations.push({
        level: "warning",
        code: "duplicate-url",
        message: `Duplicate URL in ${input.slug}: ${prev} and ${ref.id}`,
        slug: input.slug,
        refId: ref.id,
      });
    } else {
      urlSeen.set(ref.url, ref.id);
    }
  }

  const primaryDirect = getPrimaryDirectReferences(refs);
  const syntheticCount = refs.filter(isSyntheticReference).length;

  if (input.provenanceTier === "verified") {
    if (primaryDirect.length === 0) {
      violations.push({
        level: "error",
        code: "verified-no-primary-url",
        message: `Verified case requires ≥1 primary source with a direct URL: ${input.slug}`,
        slug: input.slug,
      });
    }

    if (syntheticCount > 0) {
      violations.push({
        level: "error",
        code: "verified-has-synthetic",
        message: `Verified case must not include teaching templates: ${input.slug}`,
        slug: input.slug,
      });
    }

    if (input.multilingual) {
      const primaryWithOriginal = refs
        .filter(isPrimarySourceReference)
        .filter((r) => r.originalCitation?.trim());
      if (primaryWithOriginal.length === 0) {
        violations.push({
          level: "error",
          code: "multilingual-no-original-citation",
          message: `Multilingual verified case needs originalCitation on a primary ref: ${input.slug}`,
          slug: input.slug,
        });
      }
    }
  }

  if (input.provenanceTier === "curated" && refs.length > 0 && refs.every(isSyntheticReference)) {
    violations.push({
      level: "warning",
      code: "curated-template-only",
      message: `Curated case has only template references — add CASE_REFERENCE_OVERRIDES: ${input.slug}`,
      slug: input.slug,
    });
  }

  if (input.provenanceTier === "composite" && primaryDirect.length > 0) {
    violations.push({
      level: "warning",
      code: "composite-with-primary-url",
      message: `Composite dossier unexpectedly has direct primary URLs: ${input.slug}`,
      slug: input.slug,
    });
  }

  return violations;
}

export function assertReferenceAccuracy(input: {
  slug: string;
  references: CaseReference[];
  provenanceTier: CaseProvenanceTier;
  multilingual?: boolean;
}): void {
  const errors = validateCaseReferenceSet(input).filter((v) => v.level === "error");
  if (errors.length === 0) return;
  throw new Error(
    `Reference accuracy gate failed for ${input.slug}: ${errors.map((e) => e.message).join("; ")}`,
  );
}
