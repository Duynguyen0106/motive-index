import { detectHotCrimeNews, type HotCrimeNewsItem } from "@/lib/hotNewsTicker";
import type { WorldNewsItem } from "@/lib/worldNews";

export type NewsFeedFilter = "all" | "hot" | "linked" | "live";

export function parseNewsFilter(value: string | null): NewsFeedFilter {
  if (value === "hot" || value === "linked" || value === "live") return value;
  return "all";
}

export function isLiveRssItem(item: WorldNewsItem): boolean {
  return item.id.startsWith("wn-live");
}

export function isArchiveLinkedItem(item: WorldNewsItem): boolean {
  return Boolean(item.caseSlug);
}

export function buildHotNewsLookup(items: WorldNewsItem[]): Map<string, HotCrimeNewsItem> {
  return new Map(detectHotCrimeNews(items).map((h) => [h.id, h]));
}

export function filterNewsItems(
  items: WorldNewsItem[],
  filter: NewsFeedFilter,
  hotLookup: Map<string, HotCrimeNewsItem>,
): WorldNewsItem[] {
  switch (filter) {
    case "hot":
      return items.filter((item) => hotLookup.has(item.id));
    case "linked":
      return items.filter(isArchiveLinkedItem);
    case "live":
      return items.filter(isLiveRssItem);
    default:
      return items;
  }
}

/** Hot stories first, then newest. */
export function sortNewsItems(
  items: WorldNewsItem[],
  hotLookup: Map<string, HotCrimeNewsItem>,
): WorldNewsItem[] {
  return [...items].sort((a, b) => {
    const aHot = hotLookup.get(a.id);
    const bHot = hotLookup.get(b.id);
    if (aHot && bHot && bHot.score !== aHot.score) return bHot.score - aHot.score;
    if (aHot && !bHot) return -1;
    if (!aHot && bHot) return 1;
    return +new Date(b.createdAt) - +new Date(a.createdAt);
  });
}

export function newsFeedFilterCounts(
  items: WorldNewsItem[],
  hotLookup: Map<string, HotCrimeNewsItem>,
): Record<NewsFeedFilter, number> {
  return {
    all: items.length,
    hot: items.filter((i) => hotLookup.has(i.id)).length,
    linked: items.filter(isArchiveLinkedItem).length,
    live: items.filter(isLiveRssItem).length,
  };
}

export const NEWS_FILTER_LABELS: Record<NewsFeedFilter, string> = {
  all: "All",
  hot: "Hot",
  linked: "Linked",
  live: "Live RSS",
};
