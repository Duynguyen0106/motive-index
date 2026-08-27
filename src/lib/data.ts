import { cases as seedCases, updates as seedUpdates } from "@/data/seed";
import type { CrimeCase, LiveUpdate } from "@/lib/types";

/** In-memory store for MVP. Swap for Postgres later. */
let casesStore: CrimeCase[] = structuredClone(seedCases);
let updatesStore: LiveUpdate[] = structuredClone(seedUpdates);

export function getAllCases(): CrimeCase[] {
  return casesStore
    .slice()
    .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
}

export function getPublishedCases(): CrimeCase[] {
  return getAllCases().filter((c) => c.analysis.status === "published");
}

export function getFeaturedCases(): CrimeCase[] {
  return getAllCases().filter((c) => c.featured && c.analysis.status === "published");
}

export function getCaseBySlug(slug: string): CrimeCase | undefined {
  return casesStore.find((c) => c.slug === slug);
}

export function getUpdates(limit = 20): LiveUpdate[] {
  return updatesStore
    .slice()
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, limit);
}

export function upsertCase(next: CrimeCase): CrimeCase {
  const idx = casesStore.findIndex((c) => c.id === next.id || c.slug === next.slug);
  if (idx >= 0) {
    casesStore[idx] = next;
  } else {
    casesStore = [next, ...casesStore];
  }
  return next;
}

export function addUpdate(update: LiveUpdate): LiveUpdate {
  updatesStore = [update, ...updatesStore];
  return update;
}

export function resetStore(): void {
  casesStore = structuredClone(seedCases);
  updatesStore = structuredClone(seedUpdates);
}
