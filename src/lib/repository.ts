import { isSupabaseConfigured } from "@/lib/supabaseClient";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { inferCountry } from "@/lib/country";
import type { CaseDocument, CrimeCase } from "@/lib/types";

/** Best-effort sync of a case into Supabase `cases` table. */
export async function syncCaseToSupabase(crimeCase: CrimeCase): Promise<{
  ok: boolean;
  skipped?: boolean;
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return { ok: true, skipped: true };
  }

  try {
    const supabase = getSupabaseServerClient();
    const row = {
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
    const { error } = await supabase.from("cases").upsert(row, { onConflict: "id" });
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
): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
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
