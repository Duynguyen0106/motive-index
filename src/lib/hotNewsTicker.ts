import { COUNTRY_LABELS } from "@/lib/country";
import type { CountryCode, LiveUpdate } from "@/lib/types";
import type { WorldNewsItem } from "@/lib/worldNews";
import { formatNewsRegion } from "@/lib/worldNews";

export type HotCrimeNewsItem = {
  id: string;
  headline: string;
  summary: string;
  createdAt: string;
  region: string;
  country?: CountryCode;
  caseSlug?: string;
  sourceUrl?: string;
  sourceName?: string;
  score: number;
  isBreaking: boolean;
};

const HOT_KEYWORDS = [
  "breaking",
  "urgent",
  "manhunt",
  "serial killer",
  "serial murder",
  "mass shooting",
  "active shooter",
  "school shooting",
  "convicted",
  "sentenced",
  "life in prison",
  "death penalty",
  "charged with murder",
  "murder charge",
  "found guilty",
  "cold case",
  "breakthrough",
  "identification",
  "body found",
  "homicide investigation",
  "fatal shooting",
  "fatal stabbing",
];

const BREAKING_KEYWORDS = [
  "breaking",
  "urgent",
  "active shooter",
  "mass shooting",
  "manhunt",
  "school shooting",
];

const MAX_AGE_MS = 48 * 60 * 60 * 1000;

function newsCandidates(
  updates: LiveUpdate[],
  worldNewsItems: WorldNewsItem[],
): Array<LiveUpdate | WorldNewsItem> {
  const byId = new Map<string, LiveUpdate | WorldNewsItem>();
  for (const item of worldNewsItems) byId.set(item.id, item);
  for (const item of updates) {
    if (item.kind === "world_news") byId.set(item.id, item);
  }
  return [...byId.values()];
}

function scoreNewsItem(item: LiveUpdate | WorldNewsItem): number {
  if (item.kind !== "world_news") return 0;

  const ageMs = Date.now() - new Date(item.createdAt).getTime();
  if (Number.isNaN(ageMs) || ageMs > MAX_AGE_MS) return 0;

  const text = `${item.headline} ${item.summary}`.toLowerCase();
  let score = 0;

  if (ageMs < 2 * 60 * 60 * 1000) score += 4;
  else if (ageMs < 6 * 60 * 60 * 1000) score += 3;
  else if (ageMs < 24 * 60 * 60 * 1000) score += 2;
  else score += 1;

  for (const kw of HOT_KEYWORDS) {
    if (text.includes(kw)) score += 2;
  }
  for (const kw of BREAKING_KEYWORDS) {
    if (text.includes(kw)) score += 3;
  }
  if (item.caseSlug) score += 5;
  if (item.id.startsWith("wn-live")) score += 2;
  if (item.sourceUrl) score += 1;

  return score;
}

function isBreakingHeadline(item: LiveUpdate | WorldNewsItem): boolean {
  const text = `${item.headline} ${item.summary}`.toLowerCase();
  return BREAKING_KEYWORDS.some((kw) => text.includes(kw));
}

function toHotItem(item: LiveUpdate | WorldNewsItem, score: number): HotCrimeNewsItem {
  const region =
    "region" in item && item.region
      ? item.region
      : item.country
        ? COUNTRY_LABELS[item.country]
        : "Global";

  return {
    id: item.id,
    headline: item.headline,
    summary: item.summary,
    createdAt: item.createdAt,
    region: "region" in item && item.region ? formatNewsRegion(item as WorldNewsItem) : region,
    country: item.country,
    caseSlug: item.caseSlug,
    sourceUrl: item.sourceUrl,
    sourceName: item.sourceName,
    score,
    isBreaking: isBreakingHeadline(item) || score >= 10,
  };
}

/** Rank live + archive news for the AI auto-update hot ticker (score ≥ 6). */
export function detectHotCrimeNews(
  updates: LiveUpdate[],
  worldNewsItems: WorldNewsItem[],
  limit = 6,
): HotCrimeNewsItem[] {
  return newsCandidates(updates, worldNewsItems)
    .map((item) => ({ item, score: scoreNewsItem(item) }))
    .filter(({ score }) => score >= 6)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return +new Date(b.item.createdAt) - +new Date(a.item.createdAt);
    })
    .slice(0, limit)
    .map(({ item, score }) => toHotItem(item, score));
}

export function hotNewsTickerLabel(item: HotCrimeNewsItem): string {
  const prefix = item.isBreaking ? "BREAKING" : "HOT";
  return `${prefix} · ${item.region} · ${item.headline}`;
}
