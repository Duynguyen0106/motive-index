import type { LiveUpdate } from "@/lib/types";

/** Archive ingest/revision events — excludes RSS crime news (see worldNews feed). */
export function isArchiveActivityUpdate(update: LiveUpdate): boolean {
  return update.kind !== "world_news";
}

export function filterArchiveActivityUpdates(updates: LiveUpdate[]): LiveUpdate[] {
  return updates.filter(isArchiveActivityUpdate);
}
