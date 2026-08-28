import {
  getAllCases,
  getAllDocuments,
  getContributions,
  getUpdates,
} from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import {
  loadCasesFromSupabase,
  loadContributionsFromSupabase,
  loadDocumentsFromSupabase,
  loadUpdatesFromSupabase,
} from "@/lib/repository";
import type { CaseDocument, ContributionSubmission, CrimeCase, LiveUpdate } from "@/lib/types";

export function shouldReadFromSupabase(): boolean {
  return isSupabaseConfigured() && process.env.MOTIVE_INDEX_SUPABASE_READ === "1";
}

/** Prefer Supabase when MOTIVE_INDEX_SUPABASE_READ=1, else local JSON store. */
export async function getAllCasesAsync(): Promise<CrimeCase[]> {
  if (shouldReadFromSupabase()) {
    const remote = await loadCasesFromSupabase();
    if (remote.length) return remote;
  }
  return getAllCases();
}

export async function getAllDocumentsAsync(): Promise<CaseDocument[]> {
  if (shouldReadFromSupabase()) {
    const remote = await loadDocumentsFromSupabase();
    if (remote.length) return remote;
  }
  return getAllDocuments();
}

export async function getUpdatesAsync(limit = 20): Promise<LiveUpdate[]> {
  if (shouldReadFromSupabase()) {
    const remote = await loadUpdatesFromSupabase(limit);
    if (remote.length) return remote.slice(0, limit);
  }
  return getUpdates(limit);
}

export async function getContributionsAsync(): Promise<ContributionSubmission[]> {
  if (shouldReadFromSupabase()) {
    const remote = await loadContributionsFromSupabase();
    if (remote.length) return remote;
  }
  return getContributions();
}
