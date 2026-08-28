import { isSupabaseConfigured } from "@/lib/supabaseClient";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { inferCountry } from "@/lib/country";
import type {
  CaseDocument,
  ContributionSubmission,
  CrimeCase,
  LiveUpdate,
} from "@/lib/types";

export type SyncResult = { ok: boolean; skipped?: boolean; error?: string };

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

function caseRow(crimeCase: CrimeCase) {
  return {
    id: crimeCase.id,
    slug: crimeCase.slug,
    name: crimeCase.name,
    subtitle: crimeCase.subtitle,
    jurisdiction: crimeCase.jurisdiction,
    location: crimeCase.location,
    country: crimeCase.country ?? inferCountry(crimeCase.jurisdiction, crimeCase.location),
    year_start: crimeCase.yearStart,
    year_end: crimeCase.yearEnd ?? null,
    status: crimeCase.status,
    crime_categories: crimeCase.crimeCategories,
    overview: crimeCase.overview,
    warning: crimeCase.warning,
    payload: crimeCase,
    updated_at: new Date().toISOString(),
  };
}

function updateRow(update: LiveUpdate) {
  return {
    id: update.id,
    created_at: update.createdAt,
    headline: update.headline,
    summary: update.summary,
    case_slug: update.caseSlug ?? null,
    kind: update.kind,
    status: update.status,
    country: update.country ?? null,
    region: update.region ?? null,
    source_url: update.sourceUrl ?? null,
    source_name: update.sourceName ?? null,
    language: update.language ?? null,
    language_label: update.languageLabel ?? null,
    original_headline: update.originalHeadline ?? null,
    payload: update,
  };
}

function contributionRow(row: ContributionSubmission) {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    submitter_name: row.submitterName,
    submitter_role: row.submitterRole,
    summary: row.summary,
    status: row.status,
    created_at: row.createdAt,
    payload: row,
  };
}

/** Best-effort sync of a case into Supabase `cases` table. */
export async function syncCaseToSupabase(crimeCase: CrimeCase): Promise<SyncResult> {
  if (!isSupabaseConfigured()) {
    return { ok: true, skipped: true };
  }

  try {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from("cases").upsert(caseRow(crimeCase), { onConflict: "id" });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Supabase sync failed",
    };
  }
}

export async function syncDocumentToSupabase(
  doc: CaseDocument,
  caseId: string,
): Promise<SyncResult> {
  if (!isSupabaseConfigured()) {
    return { ok: true, skipped: true };
  }

  try {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from("documents").upsert(
      {
        id: doc.id,
        case_id: caseId,
        case_slug: doc.caseSlug,
        title: doc.title,
        type: doc.type,
        date: doc.date ?? null,
        author: doc.author ?? null,
        source: doc.source,
        public_domain: doc.publicDomain,
        summary: doc.summary,
        psych_relevance: doc.psychRelevance,
        content_warning: doc.contentWarning,
        url: doc.url ?? null,
        hosted: doc.hosted,
      },
      { onConflict: "id" },
    );
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Supabase document sync failed",
    };
  }
}

export async function syncUpdateToSupabase(update: LiveUpdate): Promise<SyncResult> {
  if (!isSupabaseConfigured()) {
    return { ok: true, skipped: true };
  }

  try {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from("live_updates").upsert(updateRow(update), {
      onConflict: "id",
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Supabase live update sync failed",
    };
  }
}

export async function syncContributionToSupabase(
  row: ContributionSubmission,
): Promise<SyncResult> {
  if (!isSupabaseConfigured()) {
    return { ok: true, skipped: true };
  }

  try {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from("contributions").upsert(contributionRow(row), {
      onConflict: "id",
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Supabase contribution sync failed",
    };
  }
}

export async function markHeadlineSeenInDb(
  normalizedTitle: string,
  meta?: { source?: string; caseSlug?: string },
): Promise<SyncResult> {
  if (!isSupabaseConfigured()) {
    return { ok: true, skipped: true };
  }

  try {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from("ingest_headlines").upsert(
      {
        normalized_title: normalizedTitle,
        first_seen_at: new Date().toISOString(),
        source: meta?.source ?? null,
        case_slug: meta?.caseSlug ?? null,
      },
      { onConflict: "normalized_title" },
    );
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Ingest headline sync failed",
    };
  }
}

export async function isHeadlineSeenInDb(normalizedTitle: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("ingest_headlines")
      .select("normalized_title")
      .eq("normalized_title", normalizedTitle)
      .maybeSingle();
    if (error) return false;
    return Boolean(data);
  } catch {
    return false;
  }
}

export async function loadCasesFromSupabase(): Promise<CrimeCase[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("cases")
    .select("payload")
    .order("updated_at", { ascending: false });

  if (error || !data?.length) return [];

  return data
    .map((row) => row.payload as CrimeCase)
    .filter((c) => c?.id && c?.slug);
}

export async function loadDocumentsFromSupabase(): Promise<CaseDocument[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("documents").select("*").order("created_at", {
    ascending: false,
  });

  if (error || !data?.length) return [];

  return data.map((row) => ({
    id: row.id,
    caseSlug: row.case_slug ?? "",
    title: row.title,
    type: row.type,
    date: row.date ?? undefined,
    author: row.author ?? undefined,
    source: row.source ?? "",
    publicDomain: Boolean(row.public_domain),
    summary: row.summary ?? "",
    psychRelevance: row.psych_relevance ?? "",
    contentWarning: row.content_warning ?? "",
    url: row.url ?? undefined,
    hosted: Boolean(row.hosted),
  }));
}

export async function loadUpdatesFromSupabase(limit = 50): Promise<LiveUpdate[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("live_updates")
    .select("payload")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data?.length) return [];

  return data.map((row) => row.payload as LiveUpdate).filter((u) => u?.id);
}

export async function loadContributionsFromSupabase(): Promise<ContributionSubmission[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("contributions")
    .select("payload")
    .order("created_at", { ascending: false });

  if (error || !data?.length) return [];

  return data.map((row) => row.payload as ContributionSubmission).filter((c) => c?.id);
}

export async function syncFullStoreToSupabase(store: {
  cases: CrimeCase[];
  documents: CaseDocument[];
  updates: LiveUpdate[];
  contributions: ContributionSubmission[];
}): Promise<{
  cases: number;
  documents: number;
  updates: number;
  contributions: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let cases = 0;
  let documents = 0;
  let updates = 0;
  let contributions = 0;

  if (!isSupabaseConfigured()) {
    return { cases: 0, documents: 0, updates: 0, contributions: 0, errors: ["Supabase not configured"] };
  }

  const supabase = getSupabaseServerClient();

  for (const batch of chunk(store.cases, 25)) {
    const { error } = await supabase
      .from("cases")
      .upsert(batch.map(caseRow), { onConflict: "id" });
    if (error) {
      for (const c of batch) errors.push(`case batch ${c.id}: ${error.message}`);
    } else {
      cases += batch.length;
    }
  }

  for (const batch of chunk(store.documents, 25)) {
    const rows = batch
      .map((d) => {
        const crimeCase = store.cases.find((c) => c.slug === d.caseSlug);
        if (!crimeCase) return null;
        return {
          id: d.id,
          case_id: crimeCase.id,
          case_slug: d.caseSlug,
          title: d.title,
          type: d.type,
          date: d.date ?? null,
          author: d.author ?? null,
          source: d.source,
          public_domain: d.publicDomain,
          summary: d.summary,
          psych_relevance: d.psychRelevance,
          content_warning: d.contentWarning,
          url: d.url ?? null,
          hosted: d.hosted,
        };
      })
      .filter(Boolean) as Record<string, unknown>[];
    if (!rows.length) continue;
    const { error } = await supabase.from("documents").upsert(rows, { onConflict: "id" });
    if (error) {
      errors.push(`document batch: ${error.message}`);
    } else {
      documents += rows.length;
    }
  }

  for (const batch of chunk(store.updates, 25)) {
    const { error } = await supabase
      .from("live_updates")
      .upsert(batch.map(updateRow), { onConflict: "id" });
    if (error) errors.push(`update batch: ${error.message}`);
    else updates += batch.length;
  }

  for (const batch of chunk(store.contributions, 25)) {
    const { error } = await supabase
      .from("contributions")
      .upsert(batch.map(contributionRow), { onConflict: "id" });
    if (error) errors.push(`contribution batch: ${error.message}`);
    else contributions += batch.length;
  }

  return { cases, documents, updates, contributions, errors };
}
