import { COUNTRY_LABELS } from "@/lib/country";
import { detectHotCrimeNews } from "@/lib/hotNewsTicker";
import type { CountryMonitorStat } from "@/lib/monitor";
import type {
  CountryCode,
  CrimeCase,
  LiveUpdate,
  PsychDimension,
  SearchFilters,
} from "@/lib/types";
import { DIMENSION_LABELS } from "@/lib/types";
import type { WorldNewsItem } from "@/lib/worldNews";

export type MonitorSignalKind = LiveUpdate["kind"];

export type MonitorSignalStats = {
  total: number;
  byKind: Record<MonitorSignalKind, number>;
  recentCount: number;
};

export type MonitorSignalAlert = {
  id: string;
  severity: "info" | "watch" | "hot";
  title: string;
  detail: string;
  caseSlug?: string;
  country?: CountryCode;
};

export type BehaviorSignalHighlight = {
  id: string;
  caseSlug: string;
  caseName: string;
  dimension: PsychDimension;
  dimensionLabel: string;
  observation: string;
};

export const SIGNAL_KIND_META: Record<
  MonitorSignalKind,
  { label: string; shortLabel: string; icon: string }
> = {
  new_case: { label: "New dossier", shortLabel: "New", icon: "◆" },
  analysis_ready: { label: "Analysis ready", shortLabel: "Analysis", icon: "◎" },
  source_added: { label: "Source added", shortLabel: "Source", icon: "▣" },
  revision: { label: "Revision", shortLabel: "Revision", icon: "↻" },
  world_news: { label: "World news", shortLabel: "News", icon: "◈" },
};

const ALL_KINDS: MonitorSignalKind[] = [
  "new_case",
  "analysis_ready",
  "source_added",
  "revision",
  "world_news",
];

export function buildSignalStats(updates: LiveUpdate[]): MonitorSignalStats {
  const byKind = Object.fromEntries(ALL_KINDS.map((k) => [k, 0])) as Record<
    MonitorSignalKind,
    number
  >;
  const cutoff = Date.now() - 48 * 60 * 60 * 1000;

  let recentCount = 0;
  for (const u of updates) {
    byKind[u.kind] += 1;
    if (new Date(u.createdAt).getTime() >= cutoff) recentCount += 1;
  }

  return { total: updates.length, byKind, recentCount };
}

export function buildSignalAlerts(input: {
  updates: LiveUpdate[];
  cases: CrimeCase[];
  countryStats: CountryMonitorStat[];
  filters: SearchFilters;
  worldNewsItems?: WorldNewsItem[];
}): MonitorSignalAlert[] {
  const alerts: MonitorSignalAlert[] = [];
  const { cases, countryStats, filters, updates, worldNewsItems = [] } = input;

  const hotNews = detectHotCrimeNews(updates, worldNewsItems, 3);
  for (const item of hotNews) {
    alerts.push({
      id: `hot-news-${item.id}`,
      severity: item.isBreaking ? "hot" : "watch",
      title: item.isBreaking ? "Breaking crime news" : "Hot crime news",
      detail: item.headline,
      caseSlug: item.caseSlug,
      country: item.country,
    });
  }

  const unsolvedInFilter = cases.filter((c) => c.status === "unsolved").length;
  if (unsolvedInFilter > 0) {
    alerts.push({
      id: "unsolved-filter",
      severity: "watch",
      title: `${unsolvedInFilter} unsolved dossier${unsolvedInFilter === 1 ? "" : "s"}`,
      detail: filters.country
        ? `In current filter for ${COUNTRY_LABELS[filters.country as CountryCode]}`
        : "Matching current monitor filters",
    });
  }

  const hotspot = [...countryStats]
    .filter((s) => s.unsolvedCount > 0)
    .sort((a, b) => b.unsolvedCount - a.unsolvedCount)[0];

  if (hotspot && hotspot.unsolvedCount >= 3 && hotspot.code !== filters.country) {
    alerts.push({
      id: `hotspot-${hotspot.code}`,
      severity: "hot",
      title: `${hotspot.label} open-case cluster`,
      detail: `${hotspot.unsolvedCount} unsolved dossiers in region`,
      country: hotspot.code,
    });
  }

  const freshAnalysis = updates.filter((u) => u.kind === "analysis_ready").slice(0, 3);
  if (freshAnalysis.length) {
    alerts.push({
      id: "fresh-analysis",
      severity: "info",
      title: `${freshAnalysis.length} fresh analysis signal${freshAnalysis.length === 1 ? "" : "s"}`,
      detail: "New construct scores published in the archive",
      caseSlug: freshAnalysis[0]?.caseSlug,
    });
  }

  const newCases = updates.filter((u) => u.kind === "new_case").length;
  if (newCases > 0) {
    alerts.push({
      id: "new-ingest",
      severity: "info",
      title: `${newCases} new dossier signal${newCases === 1 ? "" : "s"}`,
      detail: "Archive ingest or draft pipeline activity",
    });
  }

  return alerts.slice(0, 6);
}

export function buildBehaviorHighlights(
  cases: CrimeCase[],
  limit = 8,
): BehaviorSignalHighlight[] {
  const prioritized = [
    ...cases.filter((c) => c.featured),
    ...cases.filter((c) => !c.tags.includes("wikidata-import") && !c.featured),
    ...cases.filter((c) => c.tags.includes("wikidata-import")),
  ];

  const seen = new Set<string>();
  const out: BehaviorSignalHighlight[] = [];

  for (const c of prioritized) {
    if (seen.has(c.slug)) continue;
    const signal = c.signals?.find((s) => s.observation.trim().length > 24);
    if (!signal) continue;
    seen.add(c.slug);
    out.push({
      id: `${c.slug}-${signal.id}`,
      caseSlug: c.slug,
      caseName: c.name,
      dimension: signal.dimension,
      dimensionLabel: DIMENSION_LABELS[signal.dimension],
      observation: signal.observation,
    });
    if (out.length >= limit) break;
  }

  return out;
}

export function filterUpdatesByKind(
  updates: LiveUpdate[],
  kind: MonitorSignalKind | "",
): LiveUpdate[] {
  if (!kind) return updates;
  return updates.filter((u) => u.kind === kind);
}

export type MonitorSignalsPayload = {
  stats: MonitorSignalStats;
  alerts: MonitorSignalAlert[];
  behaviorHighlights: BehaviorSignalHighlight[];
};

export function buildMonitorSignals(input: {
  updates: LiveUpdate[];
  cases: CrimeCase[];
  countryStats: CountryMonitorStat[];
  filters: SearchFilters;
  worldNewsItems?: WorldNewsItem[];
}): MonitorSignalsPayload {
  return {
    stats: buildSignalStats(input.updates),
    alerts: buildSignalAlerts(input),
    behaviorHighlights: buildBehaviorHighlights(input.cases),
  };
}
