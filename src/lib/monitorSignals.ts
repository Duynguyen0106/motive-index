import { COUNTRY_LABELS } from "@/lib/country";
import { filterArchiveActivityUpdates } from "@/lib/liveUpdates";
import type { CountryMonitorStat } from "@/lib/monitor";
import type {
  CountryCode,
  CrimeCase,
  LiveUpdate,
  PsychDimension,
  SearchFilters,
} from "@/lib/types";
import { DIMENSION_LABELS } from "@/lib/types";

export type MonitorSignalKind = Exclude<LiveUpdate["kind"], "world_news">;

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
};

const ALL_KINDS: MonitorSignalKind[] = [
  "new_case",
  "analysis_ready",
  "source_added",
  "revision",
];

export function buildSignalStats(updates: LiveUpdate[]): MonitorSignalStats {
  const archiveUpdates = filterArchiveActivityUpdates(updates);
  const byKind = Object.fromEntries(ALL_KINDS.map((k) => [k, 0])) as Record<
    MonitorSignalKind,
    number
  >;
  const cutoff = Date.now() - 48 * 60 * 60 * 1000;

  let recentCount = 0;
  for (const u of archiveUpdates) {
    byKind[u.kind as MonitorSignalKind] += 1;
    if (new Date(u.createdAt).getTime() >= cutoff) recentCount += 1;
  }

  return { total: archiveUpdates.length, byKind, recentCount };
}

export function buildSignalAlerts(input: {
  updates: LiveUpdate[];
  cases: CrimeCase[];
  countryStats: CountryMonitorStat[];
  filters: SearchFilters;
}): MonitorSignalAlert[] {
  const alerts: MonitorSignalAlert[] = [];
  const { cases, countryStats, filters, updates } = input;
  const archiveUpdates = filterArchiveActivityUpdates(updates);

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

  const freshAnalysis = archiveUpdates.filter((u) => u.kind === "analysis_ready").slice(0, 3);
  if (freshAnalysis.length) {
    alerts.push({
      id: "fresh-analysis",
      severity: "info",
      title: `${freshAnalysis.length} fresh analysis signal${freshAnalysis.length === 1 ? "" : "s"}`,
      detail: "New construct scores published in the archive",
      caseSlug: freshAnalysis[0]?.caseSlug,
    });
  }

  const newCases = archiveUpdates.filter((u) => u.kind === "new_case").length;
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
  const pool =
    cases.length > 240
      ? [
          ...cases.filter((c) => c.featured),
          ...cases.filter((c) => !c.featured && !c.tags.includes("wikidata-import")).slice(0, 120),
          ...cases.filter((c) => c.tags.includes("wikidata-import")).slice(0, 40),
        ]
      : cases;

  const prioritized = [
    ...pool.filter((c) => c.featured),
    ...pool.filter((c) => !c.tags.includes("wikidata-import") && !c.featured),
    ...pool.filter((c) => c.tags.includes("wikidata-import")),
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
  const archiveUpdates = filterArchiveActivityUpdates(updates);
  if (!kind) return archiveUpdates;
  return archiveUpdates.filter((u) => u.kind === kind);
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
}): MonitorSignalsPayload {
  return {
    stats: buildSignalStats(input.updates),
    alerts: buildSignalAlerts(input),
    behaviorHighlights: buildBehaviorHighlights(input.cases),
  };
}
