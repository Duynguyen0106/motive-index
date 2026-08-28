"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/ui";
import { COUNTRY_LABELS } from "@/lib/country";
import {
  filterUpdatesByKind,
  SIGNAL_KIND_META,
  type BehaviorSignalHighlight,
  type MonitorSignalAlert,
  type MonitorSignalKind,
  type MonitorSignalStats,
} from "@/lib/monitorSignals";
import type { LiveUpdate } from "@/lib/types";
import { formatDate } from "@/lib/utils";

type Props = {
  updates: LiveUpdate[];
  stats: MonitorSignalStats;
  alerts: MonitorSignalAlert[];
  behaviorHighlights: BehaviorSignalHighlight[];
  onSelectCase?: (slug: string) => void;
  onSelectCountry?: (code: MonitorSignalAlert["country"]) => void;
};

const KIND_ORDER: MonitorSignalKind[] = [
  "analysis_ready",
  "new_case",
  "source_added",
  "revision",
];

function severityClass(severity: MonitorSignalAlert["severity"]): string {
  if (severity === "hot") return "is-hot";
  if (severity === "watch") return "is-watch";
  return "is-info";
}

export function MonitorSignalsPanel({
  updates,
  stats,
  alerts,
  behaviorHighlights,
  onSelectCase,
  onSelectCountry,
}: Props) {
  const [kindFilter, setKindFilter] = useState<MonitorSignalKind | "">("");

  const visibleUpdates = useMemo(
    () => filterUpdatesByKind(updates, kindFilter),
    [updates, kindFilter],
  );

  return (
    <div className="monitor-signals">
      <div className="monitor-signals-head">
        <div>
          <h2 className="display text-base">Live signals</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Archive ingest & revisions · behavioral highlights ·{" "}
            <Link href="/live#archive-activity" className="text-[var(--accent)] hover:underline">
              Activity log
            </Link>
            {" · "}
            <Link href="/live" className="text-[var(--accent)] hover:underline">
              Crime news
            </Link>
          </p>
        </div>
        <div className="monitor-signals-stats" aria-label="Signal counts">
          <span className="monitor-signals-stat">
            <strong>{stats.total}</strong> archive events
          </span>
          {stats.recentCount ? (
            <span className="monitor-signals-stat monitor-signals-stat-recent">
              <strong>{stats.recentCount}</strong> last 48h
            </span>
          ) : null}
        </div>
      </div>

      <div className="monitor-signals-kind-row" role="toolbar" aria-label="Filter by signal type">
        <button
          type="button"
          className={`monitor-signals-kind ${kindFilter === "" ? "is-active" : ""}`}
          onClick={() => setKindFilter("")}
        >
          All <span className="monitor-signals-kind-count">{stats.total}</span>
        </button>
        {KIND_ORDER.map((kind) => {
          const count = stats.byKind[kind];
          if (!count && kindFilter !== kind) return null;
          const meta = SIGNAL_KIND_META[kind];
          return (
            <button
              key={kind}
              type="button"
              className={`monitor-signals-kind monitor-signals-kind-${kind} ${kindFilter === kind ? "is-active" : ""}`}
              onClick={() => setKindFilter(kindFilter === kind ? "" : kind)}
              title={meta.label}
            >
              <span className="monitor-signals-kind-icon" aria-hidden>
                {meta.icon}
              </span>
              {meta.shortLabel}
              <span className="monitor-signals-kind-count">{count}</span>
            </button>
          );
        })}
      </div>

      {alerts.length ? (
        <ul className="monitor-signals-alerts" aria-label="Signal alerts">
          {alerts.map((alert) => (
            <li key={alert.id}>
              <div className={`monitor-signals-alert ${severityClass(alert.severity)}`}>
                <div className="monitor-signals-alert-body">
                  <p className="monitor-signals-alert-title">{alert.title}</p>
                  <p className="monitor-signals-alert-detail">{alert.detail}</p>
                </div>
                {alert.caseSlug && onSelectCase ? (
                  <button
                    type="button"
                    className="monitor-signals-alert-action"
                    onClick={() => onSelectCase(alert.caseSlug!)}
                  >
                    View
                  </button>
                ) : alert.country && onSelectCountry ? (
                  <button
                    type="button"
                    className="monitor-signals-alert-action"
                    onClick={() => onSelectCountry(alert.country!)}
                  >
                    {COUNTRY_LABELS[alert.country]}
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {behaviorHighlights.length ? (
        <section className="monitor-signals-behavior" aria-labelledby="monitor-behavior-heading">
          <h3 id="monitor-behavior-heading" className="monitor-signals-section-title">
            Behavioral signal highlights
          </h3>
          <p className="monitor-signals-section-sub">
            Observable public-record signals from filtered dossiers
          </p>
          <ul className="monitor-signals-behavior-list">
            {behaviorHighlights.map((item) => (
              <li key={item.id} className="monitor-signals-behavior-item">
                <span className={`monitor-signals-dimension monitor-signals-dimension-${item.dimension}`}>
                  {item.dimensionLabel}
                </span>
                <p className="monitor-signals-behavior-text">{item.observation}</p>
                <button
                  type="button"
                  className="monitor-signals-behavior-case"
                  onClick={() => onSelectCase?.(item.caseSlug)}
                >
                  {item.caseName} →
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="monitor-signals-feed" aria-labelledby="monitor-signal-feed-heading">
        <h3 id="monitor-signal-feed-heading" className="monitor-signals-section-title">
          Activity feed
          {kindFilter ? (
            <span className="monitor-signals-feed-filter">
              · {SIGNAL_KIND_META[kindFilter].label}
            </span>
          ) : null}
        </h3>
        <ul className="monitor-signals-feed-list">
          {visibleUpdates.map((u) => {
            const meta = SIGNAL_KIND_META[u.kind as MonitorSignalKind];
            return (
              <li key={u.id} className={`monitor-signals-feed-item monitor-signals-feed-${u.kind}`}>
                <div className="monitor-signals-feed-icon" aria-hidden>
                  {meta.icon}
                </div>
                <div className="monitor-signals-feed-body">
                  <div className="monitor-signals-feed-meta">
                    <time className="monitor-signals-feed-time">{formatDate(u.createdAt)}</time>
                    <span className="monitor-signals-feed-kind">{meta.label}</span>
                    {u.region ? (
                      <span className="monitor-signals-feed-region">{u.region}</span>
                    ) : u.country ? (
                      <span className="monitor-signals-feed-region">
                        {COUNTRY_LABELS[u.country]}
                      </span>
                    ) : null}
                  </div>
                  {u.caseSlug ? (
                    <button
                      type="button"
                      className="monitor-signals-feed-headline"
                      onClick={() => onSelectCase?.(u.caseSlug!)}
                    >
                      {u.headline}
                    </button>
                  ) : (
                    <p className="monitor-signals-feed-headline">{u.headline}</p>
                  )}
                  {u.summary ? (
                    <p className="monitor-signals-feed-summary">{u.summary}</p>
                  ) : null}
                  {u.sourceName ? (
                    <p className="monitor-signals-feed-source">{u.sourceName}</p>
                  ) : null}
                </div>
              </li>
            );
          })}
          {!visibleUpdates.length ? (
            <li className="monitor-signals-feed-empty list-none">
              <EmptyState
                title={kindFilter ? `No ${SIGNAL_KIND_META[kindFilter].label.toLowerCase()} signals` : "No archive activity yet"}
                description={
                  kindFilter
                    ? "Try another signal type or open the full activity log."
                    : "Ingest events and revisions appear here. Crime news lives in the News tab."
                }
                actions={[
                  { href: "/live#archive-activity", label: "Activity log", primary: true },
                  { href: "/?tab=news", label: "Crime news" },
                ]}
              />
              {kindFilter ? (
                <button
                  type="button"
                  className="btn btn-ghost mt-3 text-xs"
                  onClick={() => setKindFilter("")}
                >
                  Show all signal types
                </button>
              ) : null}
            </li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
