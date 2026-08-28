import type { CaseDocument, ContributionSubmission, CrimeCase, LiveUpdate } from "@/lib/types";
import {
  syncCaseToSupabase,
  syncContributionToSupabase,
  syncDocumentToSupabase,
  syncUpdateToSupabase,
  type SyncResult,
} from "@/lib/repository";

/** Fire-and-forget Supabase sync after local writes. Logs errors in development. */
export async function syncAfterCaseWrite(crimeCase: CrimeCase): Promise<SyncResult> {
  const result = await syncCaseToSupabase(crimeCase);
  logSyncError("case", crimeCase.id, result);
  return result;
}

export async function syncAfterDocumentWrite(
  doc: CaseDocument,
  caseId: string,
): Promise<SyncResult> {
  const result = await syncDocumentToSupabase(doc, caseId);
  logSyncError("document", doc.id, result);
  return result;
}

export async function syncAfterUpdateWrite(update: LiveUpdate): Promise<SyncResult> {
  const result = await syncUpdateToSupabase(update);
  logSyncError("update", update.id, result);
  return result;
}

export async function syncAfterContributionWrite(
  row: ContributionSubmission,
): Promise<SyncResult> {
  const result = await syncContributionToSupabase(row);
  logSyncError("contribution", row.id, result);
  return result;
}

function logSyncError(entity: string, id: string, result: SyncResult) {
  if (result.ok || result.skipped) return;
  if (process.env.NODE_ENV === "development") {
    console.warn(`[dbSync] ${entity} ${id}: ${result.error}`);
  }
}
