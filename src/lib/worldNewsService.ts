import { WORLD_NEWS_SEED } from "@/data/worldNewsSeed";
import type { CountryCode } from "@/lib/types";
import {
  fetchLiveWorldNews,
  filterWorldNewsByCountry,
  type WorldNewsItem,
} from "@/lib/worldNews";

export type WorldNewsPayload = {
  items: WorldNewsItem[];
  generatedAt: string;
  liveCount: number;
  seedCount: number;
};

function dedupeNews(items: WorldNewsItem[]): WorldNewsItem[] {
  const seen = new Set<string>();
  const out: WorldNewsItem[] = [];
  for (const item of items) {
    const key = item.headline.toLowerCase().slice(0, 60);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

/** Merge live RSS + curated seed; prefer freshest unique headlines. */
export async function buildWorldNewsPayload(
  options?: { limit?: number; country?: CountryCode | ""; live?: boolean },
): Promise<WorldNewsPayload> {
  const limit = options?.limit ?? 30;
  let live: WorldNewsItem[] = [];

  if (options?.live !== false) {
    try {
      live = await fetchLiveWorldNews(limit);
    } catch {
      live = [];
    }
  }

  const merged = dedupeNews([...live, ...WORLD_NEWS_SEED]);
  const filtered = filterWorldNewsByCountry(merged, options?.country ?? "");

  return {
    items: filtered.slice(0, limit),
    generatedAt: new Date().toISOString(),
    liveCount: live.length,
    seedCount: WORLD_NEWS_SEED.length,
  };
}

export function getSeedWorldNews(country?: CountryCode | ""): WorldNewsItem[] {
  const items = filterWorldNewsByCountry(WORLD_NEWS_SEED, country ?? "");
  return items;
}
