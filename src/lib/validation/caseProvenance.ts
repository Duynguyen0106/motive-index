/**
 * Case provenance framework — prevents fabricated or unverified cases
 * from being labeled as public-record or published without evidence.
 */
import { CASE_REFERENCE_OVERRIDES } from "@/data/caseReferenceCatalog";
import type { CaseReference } from "@/lib/types";
import { isRetiredSlug } from "@/lib/validation/retiredSlugs";
import { assertReferenceAccuracy } from "@/lib/validation/referenceAccuracy";

/** How much we trust a dossier's factual grounding. */
export type CaseProvenanceTier = "verified" | "curated" | "composite" | "draft";

export const PROVENANCE_TAG = {
  verified: "provenance-verified",
  curated: "provenance-curated",
  composite: "provenance-composite",
  draft: "provenance-draft",
} as const;

export const SYNTHETIC_CITATION_MARKERS = [
  "superior court proceedings:",
  "Peer-reviewed case study literature:",
  "Official inquiry, commission report",
  "[Template]",
] as const;

export const COMPOSITE_NAME_PREFIXES = ["Archival prosecution:", "Unsolved matter:"] as const;

/** Slugs where moniker/case name intentionally differs from offender legal name. */
export const SLUG_OFFENDER_EXCEPTIONS = new Set([
  "golden-state-killer",
  "zodiac-killer",
  "mona-fandey",
  "monster-of-florence",
  "lake-bodom",
  "alcasser-girls",
]);

export function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function slugMatchesOffender(slug: string, offenderName: string): boolean {
  if (!offenderName || offenderName === "Unknown") return true;
  const parts = normalizeName(offenderName).split(" ").filter(Boolean);
  if (parts.length === 0) return true;
  const slugNorm = slug.replace(/-/g, " ");
  const last = parts[parts.length - 1]!;
  const first = parts[0]!;
  return slugNorm.includes(last) || slugNorm.includes(first);
}

export function isSyntheticReference(ref: Pick<CaseReference, "citation" | "synthetic" | "kind">): boolean {
  if (ref.synthetic) return true;
  if (ref.citation.startsWith("[Template]")) return true;
  return SYNTHETIC_CITATION_MARKERS.some((m) => ref.citation.includes(m));
}

/** Court, media, or report citation — not auto-generated academic filler. */
export function isPrimarySourceReference(
  ref: Pick<CaseReference, "citation" | "synthetic" | "kind" | "originalCitation">,
): boolean {
  if (isSyntheticReference(ref)) return false;
  if (ref.kind === "journal") return false;
  if (ref.kind === "book" && !ref.originalCitation) return false;
  return ref.kind === "court" || ref.kind === "media" || ref.kind === "report";
}

export function hasReferenceOverride(slug: string): boolean {
  return Boolean(CASE_REFERENCE_OVERRIDES[slug]?.length);
}

export function hasVerifiedReferences(refs: CaseReference[] | undefined): boolean {
  return (refs ?? []).some(isPrimarySourceReference);
}

export type ProvenanceInput = {
  slug: string;
  tags?: string[];
  references?: CaseReference[];
  offenderName?: string;
  name?: string;
  analysisStatus?: string;
};

export function isCompositeInput(c: Pick<ProvenanceInput, "tags">): boolean {
  return (
    c.tags?.includes("bulk-catalog") === true || c.tags?.includes("composite-dossier") === true
  );
}

export function isDraftInput(c: Pick<ProvenanceInput, "tags" | "analysisStatus">): boolean {
  return (
    c.tags?.includes("draft") === true ||
    c.analysisStatus === "draft" ||
    c.analysisStatus === "pending"
  );
}

/** Multilingual defs ship explicit original-language citations — treat as verified when present. */
export function isMultilingualVerified(c: Pick<ProvenanceInput, "tags" | "references">): boolean {
  if (!c.tags?.includes("multilingual-source")) return false;
  return hasVerifiedReferences(c.references);
}

export function resolveProvenanceTier(c: ProvenanceInput): CaseProvenanceTier {
  if (isCompositeInput(c)) return "composite";
  if (isDraftInput(c)) return "draft";
  if (hasReferenceOverride(c.slug) || isMultilingualVerified(c)) return "verified";
  return "curated";
}

export function provenanceTagsForTier(tier: CaseProvenanceTier): string[] {
  switch (tier) {
    case "verified":
      return [PROVENANCE_TAG.verified, "public-record"];
    case "curated":
      return [PROVENANCE_TAG.curated];
    case "composite":
      return [PROVENANCE_TAG.composite];
    case "draft":
      return [PROVENANCE_TAG.draft];
  }
}

export type ProvenanceViolation = {
  level: "error" | "warning";
  code: string;
  message: string;
};

export function validateProvenance(
  c: ProvenanceInput,
  opts?: { strictSlugMatch?: boolean },
): ProvenanceViolation[] {
  const violations: ProvenanceViolation[] = [];

  if (isRetiredSlug(c.slug)) {
    violations.push({
      level: "error",
      code: "retired-slug",
      message: `Slug is retired for inaccuracy: ${c.slug}`,
    });
  }

  if (!c.slug.match(/^[a-z0-9-]+$/)) {
    violations.push({
      level: "error",
      code: "invalid-slug",
      message: `Invalid slug format: ${c.slug}`,
    });
  }

  const composite = isCompositeInput(c);
  const draft = isDraftInput(c);

  if (composite) {
    if (c.tags?.includes("public-record")) {
      violations.push({
        level: "error",
        code: "composite-public-record",
        message: `Composite case must not be tagged public-record: ${c.slug}`,
      });
    }
    return violations;
  }

  if (draft) return violations;

  const offender = c.offenderName ?? "";
  if (
    !slugMatchesOffender(c.slug, offender) &&
    !c.tags?.includes("multilingual-source") &&
    !c.tags?.includes("wikidata-import") &&
    !c.tags?.includes("wikipedia-import") &&
    !SLUG_OFFENDER_EXCEPTIONS.has(c.slug)
  ) {
    violations.push({
      level: opts?.strictSlugMatch ? "error" : "warning",
      code: "slug-offender-mismatch",
      message: `Slug/offender mismatch: ${c.slug} vs "${offender}"`,
    });
  }

  const tier = resolveProvenanceTier(c);
  const refs = c.references ?? [];

  if (c.tags?.includes("public-record") && tier !== "verified") {
    violations.push({
      level: "error",
      code: "unverified-public-record",
      message: `Case tagged public-record without verified provenance: ${c.slug}`,
    });
  }

  if (tier === "curated" && refs.length > 0 && refs.every(isSyntheticReference)) {
    violations.push({
      level: "warning",
      code: "template-only-refs",
      message: `Curated case has only template references — add CASE_REFERENCE_OVERRIDES: ${c.slug}`,
    });
  }

  for (const r of refs) {
    if (!r.synthetic && SYNTHETIC_CITATION_MARKERS.some((m) => r.citation.includes(m))) {
      violations.push({
        level: "error",
        code: "unmarked-synthetic-ref",
        message: `Reference looks synthetic but not flagged: ${c.slug} -> ${r.id}`,
      });
    }
  }

  if (
    c.name &&
    COMPOSITE_NAME_PREFIXES.some((p) => c.name!.startsWith(p)) &&
    !composite
  ) {
    violations.push({
      level: "error",
      code: "composite-name-curated",
      message: `Curated case uses composite name prefix: ${c.slug}`,
    });
  }

  return violations;
}

/** Tags applied during seed assembly from provenance tier. */
export function mergeProvenanceTags(existing: string[], tier: CaseProvenanceTier): string[] {
  const provenanceSet = new Set(Object.values(PROVENANCE_TAG));
  const base = existing.filter((t) => t !== "public-record" && !provenanceSet.has(t as typeof PROVENANCE_TAG[keyof typeof PROVENANCE_TAG]));
  return [...base, ...provenanceTagsForTier(tier)];
}

export type MinimalCaseDef = {
  slug: string;
  name: string;
  offenderName: string;
  yearStart: number;
  yearEnd?: number;
  overview: string;
  tags?: string[];
  references?: CaseReference[];
  sources?: { title: string; originalTitle?: string; language: string }[];
};

export function validateCaseDef(def: MinimalCaseDef, opts?: { multilingual?: boolean }): ProvenanceViolation[] {
  const violations = validateProvenance(
    {
      slug: def.slug,
      tags: def.tags,
      references: def.references,
      offenderName: def.offenderName,
      name: def.name,
    },
    { strictSlugMatch: !SLUG_OFFENDER_EXCEPTIONS.has(def.slug) && !def.tags?.includes("wikidata-import") && !def.tags?.includes("wikipedia-import") },
  );

  if (def.yearStart < 1700 || def.yearStart > 2026) {
    violations.push({
      level: "error",
      code: "year-out-of-range",
      message: `yearStart out of range: ${def.slug} (${def.yearStart})`,
    });
  }
  if (def.yearEnd != null && def.yearEnd < def.yearStart) {
    violations.push({
      level: "error",
      code: "year-end-before-start",
      message: `yearEnd before yearStart: ${def.slug}`,
    });
  }

  if (opts?.multilingual) {
    if (!def.sources?.length) {
      violations.push({
        level: "error",
        code: "missing-sources",
        message: `Multilingual case requires sources[]: ${def.slug}`,
      });
    }
    const overrideRefs = CASE_REFERENCE_OVERRIDES[def.slug];
    const effectiveRefs =
      overrideRefs?.length ? overrideRefs : (def.references ?? []);
    if (!effectiveRefs.length) {
      violations.push({
        level: "error",
        code: "missing-references",
        message: `Multilingual case requires references[]: ${def.slug}`,
      });
    } else if (!overrideRefs?.length) {
      const refs = def.references ?? [];
      const withOriginal = refs.filter((r) => r.originalCitation?.trim());
      if (withOriginal.length === 0) {
        violations.push({
          level: "error",
          code: "missing-original-citation",
          message: `Multilingual case needs ≥1 reference with originalCitation: ${def.slug}`,
        });
      }
      const primary = refs.filter(isPrimarySourceReference);
      if (primary.length === 0) {
        violations.push({
          level: "error",
          code: "no-primary-source",
          message: `Multilingual case needs ≥1 court/media/report reference: ${def.slug}`,
        });
      }
    }
    for (const s of def.sources ?? []) {
      if (!s.originalTitle?.trim() && !s.title?.trim()) {
        violations.push({
          level: "error",
          code: "empty-source-title",
          message: `Multilingual source missing title: ${def.slug}`,
        });
      }
    }
  } else if (!isCompositeInput(def) && !hasReferenceOverride(def.slug)) {
    violations.push({
      level: "warning",
      code: "no-reference-override",
      message: `World case lacks CASE_REFERENCE_OVERRIDES entry: ${def.slug}`,
    });
  }

  if (def.overview.length < 40) {
    violations.push({
      level: "warning",
      code: "short-overview",
      message: `Overview suspiciously short: ${def.slug}`,
    });
  }

  return violations;
}

export function assertPublishableCase(c: ProvenanceInput): void {
  const violations = validateProvenance(c).filter((v) => v.level === "error");
  if (violations.length > 0) {
    const msg = violations.map((v) => v.message).join("; ");
    throw new Error(`Case failed provenance gate: ${msg}`);
  }

  const tier = resolveProvenanceTier(c);
  if (tier === "verified" || tier === "curated") {
    assertReferenceAccuracy({
      slug: c.slug,
      references: c.references ?? [],
      provenanceTier: tier,
      multilingual: c.tags?.includes("multilingual-source"),
    });
  }
}
