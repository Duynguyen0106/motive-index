import fs from "node:fs";
import path from "node:path";
import {
  applyEnrichment,
  documents as seedDocuments,
  glossary as seedGlossary,
  seedContributions,
  theories as seedTheories,
} from "@/data/catalog";
import { cases as seedCases, updates as seedUpdates } from "@/data/seed";
import type {
  CaseDocument,
  ContributionSubmission,
  CrimeCase,
  GlossaryTerm,
  LiveUpdate,
  SearchFilters,
  TheoryOverview,
} from "@/lib/types";
import {
  CRIME_CATEGORY_LABELS,
  DOCUMENT_TYPE_LABELS,
  FACTOR_LABELS,
  FRAMEWORK_LABELS,
} from "@/lib/types";
import { resolveCaseCountry } from "@/lib/country";
import { invalidateArchiveStatsCache } from "@/lib/archiveStats";
import { matchesCatalogTier } from "@/lib/caseSummaries";
import { assertPublishableCase } from "@/lib/validation/caseProvenance";
import { isRetiredSlug } from "@/lib/validation/retiredSlugs";
import { filterPublicCases } from "@/lib/casePublishState";
import { assertRuntimeCaseWrite, assertModerationPublishReady } from "@/lib/validation/runtimeWriteGuard";

type Store = {
  cases: CrimeCase[];
  updates: LiveUpdate[];
  documents: CaseDocument[];
  contributions: ContributionSubmission[];
};

const DATA_DIR = path.join(process.cwd(), ".data");
const STORE_PATH = path.join(DATA_DIR, "store.json");

function seedStore(): Store {
  return {
    cases: seedCases.map((c) => applyEnrichment(c)),
    updates: structuredClone(seedUpdates),
    documents: structuredClone(seedDocuments),
    contributions: structuredClone(seedContributions),
  };
}

function readStoreFromDisk(): Store | null {
  try {
    if (!fs.existsSync(STORE_PATH)) return null;
    const raw = JSON.parse(fs.readFileSync(STORE_PATH, "utf8")) as Store;
    if (!raw?.cases?.length) return null;
    return raw;
  } catch {
    return null;
  }
}

function writeStore(store: Store): void {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const tmp = `${STORE_PATH}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(store, null, 2));
    fs.renameSync(tmp, STORE_PATH);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to write store";
    if (process.env.NODE_ENV === "production") {
      console.error(`[data] persist failed: ${message}`);
    }
    throw new Error(`Failed to persist store: ${message}`);
  }
}

export function invalidateStoreCache(): void {
  const g = globalThis as unknown as { __motiveIndexStore?: Store };
  g.__motiveIndexStore = undefined;
  invalidateArchiveStatsCache();
}

export function getStoreSnapshot(): Store {
  return structuredClone(getStore());
}

function getStore(): Store {
  const g = globalThis as unknown as { __motiveIndexStore?: Store };
  if (!g.__motiveIndexStore) {
    g.__motiveIndexStore = readStoreFromDisk() ?? seedStore();
  }
  return g.__motiveIndexStore;
}

function persist(): void {
  writeStore(getStore());
  invalidateArchiveStatsCache();
}

export function getAllCases(): CrimeCase[] {
  return getStore()
    .cases.slice()
    .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
}

/** Published catalog excluding moderation/live-ingest drafts. */
export function getPublicCases(): CrimeCase[] {
  return filterPublicCases(getAllCases());
}

export function getPublishedCases(): CrimeCase[] {
  return getAllCases().filter((c) => c.analysis.status === "published");
}

export function getFeaturedCases(): CrimeCase[] {
  return getAllCases().filter(
    (c) => c.featured && c.analysis.status === "published",
  );
}

export function getCaseOfWeek(): CrimeCase | undefined {
  return getAllCases().find((c) => c.caseOfWeek) ?? getFeaturedCases()[0];
}

export function getCaseBySlug(slug: string): CrimeCase | undefined {
  return getStore().cases.find((c) => c.slug === slug);
}

export function getUpdates(limit = 20): LiveUpdate[] {
  return getStore()
    .updates.slice()
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, limit);
}

export function getUpdatesTotal(): number {
  return getStore().updates.length;
}

export function getAllDocuments(): CaseDocument[] {
  return getStore().documents.slice();
}

export function getDocumentsForCase(slug: string): CaseDocument[] {
  return getStore().documents.filter((d) => d.caseSlug === slug);
}

export function getDocumentById(id: string): CaseDocument | undefined {
  return getStore().documents.find((d) => d.id === id);
}

export function getGlossary(): GlossaryTerm[] {
  return seedGlossary.slice().sort((a, b) => a.term.localeCompare(b.term));
}

export function getTheories(): TheoryOverview[] {
  return seedTheories.slice();
}

export function getTheoryBySlug(slug: string): TheoryOverview | undefined {
  return seedTheories.find((t) => t.slug === slug);
}

export function getContributions(): ContributionSubmission[] {
  return getStore()
    .contributions.slice()
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export function addContribution(
  input: Omit<ContributionSubmission, "id" | "createdAt" | "status">,
): ContributionSubmission {
  const store = getStore();
  const row: ContributionSubmission = {
    ...input,
    id: `sub-${Date.now()}`,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  store.contributions = [row, ...store.contributions];
  persist();
  return row;
}

export function getAnalyses() {
  return getAllCases()
    .filter((c) => c.analysis.status === "published")
    .flatMap((c) =>
      (c.analysis.expertCommentary ?? []).map((comment) => ({
        caseSlug: c.slug,
        caseName: c.name,
        comment,
      })),
    );
}

export function searchCases(filters: SearchFilters): CrimeCase[] {
  return searchCasesFrom(getPublicCases(), filters);
}

export type SearchCasesOpts = { includeModerationDrafts?: boolean };

export function searchCasesFrom(
  cases: CrimeCase[],
  filters: SearchFilters,
  opts?: SearchCasesOpts,
): CrimeCase[] {
  const pool =
    opts?.includeModerationDrafts === true ? cases : filterPublicCases(cases);
  const q = filters.q?.trim().toLowerCase() ?? "";

  return pool.filter((c) => {
    if (filters.crimeCategory && !c.crimeCategories.includes(filters.crimeCategory)) {
      return false;
    }
    if (
      filters.psychologicalFactor &&
      !c.psychologicalFactors.includes(filters.psychologicalFactor)
    ) {
      return false;
    }
    if (
      filters.theoreticalFramework &&
      !c.theoreticalFrameworks.includes(filters.theoreticalFramework)
    ) {
      return false;
    }
    if (filters.status && c.status !== filters.status) return false;
    if (!matchesCatalogTier(c, filters.catalogTier)) return false;
    if (filters.country && resolveCaseCountry(c) !== filters.country) return false;
    if (filters.location) {
      const loc = filters.location.toLowerCase();
      if (
        !c.location.toLowerCase().includes(loc) &&
        !c.jurisdiction.toLowerCase().includes(loc)
      ) {
        return false;
      }
    }
    if (filters.period) {
      const year = Number(filters.period);
      if (!Number.isNaN(year)) {
        const end = c.yearEnd ?? c.yearStart;
        if (year < c.yearStart || year > end) return false;
      } else if (!c.era.toLowerCase().includes(filters.period.toLowerCase())) {
        return false;
      }
    }
    if (filters.offenderSex && filters.offenderSex !== "any") {
      const hit = c.offenders.some(
        (o) => o.known && (o.sex ?? "unknown") === filters.offenderSex,
      );
      if (!hit) return false;
    }
    if (filters.diagnosis) {
      const d = filters.diagnosis.toLowerCase();
      if (!c.diagnoses.some((x) => x.label.toLowerCase().includes(d))) {
        return false;
      }
    }
    if (filters.documentType) {
      const docs = getDocumentsForCase(c.slug);
      if (!docs.some((doc) => doc.type === filters.documentType)) return false;
    }
    if (!q) return true;

    const hay = [
      c.name,
      c.subtitle,
      c.overview,
      c.location,
      ...(c.aliases ?? []),
      ...c.tags,
      ...c.crimeCategories.map((x) => CRIME_CATEGORY_LABELS[x]),
      ...c.psychologicalFactors.map((x) => FACTOR_LABELS[x]),
      ...c.theoreticalFrameworks.map((x) => FRAMEWORK_LABELS[x]),
      ...c.diagnoses.map((x) => x.label),
      c.analysis.summary,
    ]
      .join(" ")
      .toLowerCase();

    return hay.includes(q);
  });
}

export function searchDocuments(filters: SearchFilters): CaseDocument[] {
  const q = filters.q?.trim().toLowerCase() ?? "";
  return getAllDocuments().filter((d) => {
    if (filters.documentType && d.type !== filters.documentType) return false;
    if (!q) return true;
    const hay = [
      d.title,
      d.summary,
      d.psychRelevance,
      d.source,
      DOCUMENT_TYPE_LABELS[d.type],
      d.caseSlug,
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

export function upsertCase(
  next: CrimeCase,
  opts?: { bypassPublishGate?: boolean },
): CrimeCase {
  if (isRetiredSlug(next.slug)) {
    throw new Error(`Cannot upsert retired slug: ${next.slug}`);
  }
  const store = getStore();
  const idx = store.cases.findIndex((c) => c.id === next.id || c.slug === next.slug);
  const existing = idx >= 0 ? store.cases[idx] : undefined;
  if (!opts?.bypassPublishGate) {
    assertRuntimeCaseWrite(existing, next);
  }
  if (idx >= 0) store.cases[idx] = next;
  else store.cases = [next, ...store.cases];
  persist();
  return next;
}

export function upsertDocument(doc: CaseDocument, caseId?: string): CaseDocument {
  const store = getStore();
  const idx = store.documents.findIndex((d) => d.id === doc.id);
  if (idx >= 0) store.documents[idx] = doc;
  else store.documents = [doc, ...store.documents];

  if (caseId) {
    const caseIdx = store.cases.findIndex((c) => c.id === caseId);
    if (caseIdx >= 0) {
      const ids = store.cases[caseIdx].documentIds ?? [];
      if (!ids.includes(doc.id)) {
        store.cases[caseIdx] = {
          ...store.cases[caseIdx],
          documentIds: [doc.id, ...ids],
        };
      }
    }
  }

  persist();
  return doc;
}

export function getModerationQueue(): CrimeCase[] {
  return getAllCases().filter((c) => {
    const awaiting =
      c.tags.includes("awaiting-moderation") ||
      c.tags.includes("live-ingest") ||
      c.tags.includes("admin-created") ||
      c.analysis.status === "draft" ||
      c.analysis.status === "pending";
    const rejected = c.tags.includes("rejected");
    return awaiting && !rejected && c.analysis.status !== "published";
  });
}

export function publishCase(
  slug: string,
  reviewerEmail: string,
  options?: { viaPipeline?: boolean },
): CrimeCase | undefined {
  const existing = getCaseBySlug(slug);
  if (!existing) return undefined;

  assertModerationPublishReady({
    slug: existing.slug,
    tags: existing.tags.filter(
      (t) =>
        !["awaiting-moderation", "draft", "rejected", "narrative-draft", "narrative-pending"].includes(
          t,
        ),
    ),
    references: existing.references,
    offenderName: existing.offenders?.[0]?.name,
    name: existing.name,
    analysisStatus: "published",
  });

  assertPublishableCase({
    slug: existing.slug,
    tags: existing.tags.filter(
      (t) =>
        !["awaiting-moderation", "draft", "rejected", "narrative-draft", "narrative-pending"].includes(
          t,
        ),
    ),
    references: existing.references,
    offenderName: existing.offenders?.[0]?.name,
    name: existing.name,
    analysisStatus: "published",
  });

  const tags = existing.tags.filter(
    (t) =>
      !["awaiting-moderation", "draft", "rejected", "narrative-draft", "narrative-pending"].includes(
        t,
      ),
  );
  if (!tags.includes("published")) tags.push("published");
  const viaPipeline = options?.viaPipeline === true;

  return upsertCase(
    {
      ...existing,
      tags,
      narrative: existing.narrative
        ? {
            ...existing.narrative,
            reviewNote: viaPipeline
              ? "AI pipeline narrative — verify against primary sources before citing."
              : undefined,
            source: viaPipeline ? existing.narrative.source : ("human" as const),
          }
        : undefined,
      analysis: {
        ...existing.analysis,
        status: "published",
        reviewedByHuman: !viaPipeline,
        updatedAt: new Date().toISOString(),
        expertCommentary: [
          ...(existing.analysis.expertCommentary ?? []),
          {
            id: `mod-${Date.now()}`,
            author: reviewerEmail,
            role: "editor",
            title: viaPipeline ? "Pipeline auto-publish" : "Moderation approval",
            body: viaPipeline
              ? "Auto-published after passing provenance and reference integrity gates. AI-generated content — not human-verified."
              : "Approved for educational publication after human review of public-source draft and narrative.",
            reviewed: !viaPipeline,
            publishedAt: new Date().toISOString(),
          },
        ],
      },
    },
    { bypassPublishGate: true },
  );
}

export function rejectCase(
  slug: string,
  reviewerEmail: string,
  note?: string,
): CrimeCase | undefined {
  const existing = getCaseBySlug(slug);
  if (!existing) return undefined;
  const tags = Array.from(
    new Set([
      ...existing.tags.filter((t) => t !== "awaiting-moderation"),
      "rejected",
      "draft",
    ]),
  );

  return upsertCase({
    ...existing,
    tags,
    analysis: {
      ...existing.analysis,
      status: "draft",
      reviewedByHuman: false,
      updatedAt: new Date().toISOString(),
      summary: `${existing.analysis.summary}\n\n[Rejected by ${reviewerEmail}] ${note ?? ""}`.trim(),
    },
  });
}

export function addUpdate(update: LiveUpdate): LiveUpdate {
  const store = getStore();
  store.updates = [update, ...store.updates];
  persist();
  return update;
}

export function resetStore(): void {
  invalidateStoreCache();
  const g = globalThis as unknown as { __motiveIndexStore?: Store };
  g.__motiveIndexStore = seedStore();
  persist();
}
