"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/ui";
import { readJsonResponse } from "@/lib/clientFetch";
import type { HotCrimeNewsItem } from "@/lib/hotNewsTicker";
import {
  NEWS_FILTER_LABELS,
  buildHotNewsLookup,
  filterNewsItems,
  isLiveRssItem,
  newsFeedFilterCounts,
  sortNewsItems,
  type NewsFeedFilter,
} from "@/lib/newsFeedUtils";
import type { CountryCode } from "@/lib/types";
import type { WorldNewsPayload } from "@/lib/worldNewsService";
import { formatNewsRegion, type WorldNewsItem } from "@/lib/worldNews";
import { formatDate, formatNewsAge } from "@/lib/utils";

type Props = {
  initial: WorldNewsPayload;
  countryFilter?: CountryCode | "";
  updates?: import("@/lib/types").LiveUpdate[];
  onSelectCase?: (slug: string) => void;
  onPlotOnMap?: (slug: string) => void;
  onShowNewsLayer?: () => void;
  compact?: boolean;
  caseNames?: Record<string, string>;
  showFilters?: boolean;
  showFullPageLink?: boolean;
};

function NewsCard({
  item,
  hot,
  onSelectCase,
  onPlotOnMap,
  compact,
  caseName,
}: {
  item: WorldNewsItem;
  hot?: HotCrimeNewsItem;
  onSelectCase?: (slug: string) => void;
  onPlotOnMap?: (slug: string) => void;
  compact?: boolean;
  caseName?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const isBreaking = hot?.isBreaking;
  const longSummary = item.summary.length > 140;

  return (
    <li
      className={`monitor-news-card ${hot ? "is-hot" : ""} ${isBreaking ? "is-breaking" : ""} ${isLiveRssItem(item) ? "is-live-rss" : ""}`}
    >
      <div className="monitor-news-card-head">
        <div className="monitor-news-card-meta">
          <time className="monitor-news-age" dateTime={item.createdAt} title={formatDate(item.createdAt)}>
            {formatNewsAge(item.createdAt)}
          </time>
          {isBreaking ? (
            <span className="monitor-news-hot-badge is-breaking">Breaking</span>
          ) : hot ? (
            <span className="monitor-news-hot-badge">Hot</span>
          ) : null}
          {isLiveRssItem(item) ? <span className="monitor-news-live-badge">RSS</span> : null}
          <span className="monitor-news-region">{formatNewsRegion(item)}</span>
          {item.languageLabel && item.language !== "en" ? (
            <span className="monitor-pill monitor-pill-lang">{item.languageLabel}</span>
          ) : null}
        </div>
        {item.sourceName ? <span className="monitor-news-source">{item.sourceName}</span> : null}
      </div>

      {item.sourceUrl ? (
        <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="monitor-news-headline">
          {item.headline}
        </a>
      ) : (
        <p className="monitor-news-headline">{item.headline}</p>
      )}

      {item.originalHeadline ? (
        <p className="monitor-news-original" lang={item.language}>
          Original: {item.originalHeadline}
        </p>
      ) : null}

      {!compact && item.summary ? (
        <div className="monitor-news-summary-wrap">
          <p className={`monitor-news-summary ${expanded ? "is-expanded" : ""}`}>{item.summary}</p>
          {longSummary ? (
            <button
              type="button"
              className="monitor-news-expand"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
            >
              {expanded ? "Less" : "More"}
            </button>
          ) : null}
        </div>
      ) : null}

      {item.caseSlug ? (
        <p className="monitor-news-linked">
          Archive link:{" "}
          <span className="monitor-news-linked-name">{caseName ?? item.caseSlug}</span>
        </p>
      ) : null}

      <div className="monitor-news-actions">
        {item.sourceUrl ? (
          <a
            href={item.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="monitor-news-action"
          >
            Read source
          </a>
        ) : null}
        {item.caseSlug && onSelectCase ? (
          <button
            type="button"
            className="monitor-news-action"
            onClick={() => onSelectCase(item.caseSlug!)}
          >
            View dossier
          </button>
        ) : item.caseSlug ? (
          <Link href={`/cases/${item.caseSlug}`} className="monitor-news-action">
            View dossier
          </Link>
        ) : null}
        {item.caseSlug && onPlotOnMap ? (
          <button
            type="button"
            className="monitor-news-action"
            onClick={() => onPlotOnMap(item.caseSlug!)}
          >
            Plot on map
          </button>
        ) : null}
      </div>
    </li>
  );
}

export function WorldNewsFeed({
  initial,
  countryFilter = "",
  updates = [],
  onSelectCase,
  onPlotOnMap,
  onShowNewsLayer,
  compact,
  caseNames,
  showFilters = true,
  showFullPageLink = false,
}: Props) {
  const [payload, setPayload] = useState(initial);
  const [status, setStatus] = useState<"live" | "syncing">("live");
  const [filter, setFilter] = useState<NewsFeedFilter>("all");

  useEffect(() => {
    setPayload(initial);
  }, [initial]);

  const fetchNews = useCallback(async () => {
    setStatus("syncing");
    const qs = countryFilter ? `?country=${countryFilter}&limit=24` : "?limit=24";
    const res = await fetch(`/api/world-news${qs}`, { cache: "no-store" });
    if (!res.ok) throw new Error("News fetch failed");
    return readJsonResponse<WorldNewsPayload>(res);
  }, [countryFilter]);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const data = await fetchNews();
        if (!cancelled) {
          setPayload(data);
          setStatus("live");
        }
      } catch {
        if (!cancelled) setStatus("live");
      }
    }

    const id = window.setInterval(poll, 60000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [fetchNews]);

  const hotLookup = useMemo(
    () => buildHotNewsLookup(updates, payload.items),
    [updates, payload.items],
  );

  const filterCounts = useMemo(
    () => newsFeedFilterCounts(payload.items, hotLookup),
    [payload.items, hotLookup],
  );

  const visibleItems = useMemo(() => {
    const filtered = filterNewsItems(payload.items, filter, hotLookup);
    return filter === "all" ? sortNewsItems(filtered, hotLookup) : filtered;
  }, [payload.items, filter, hotLookup]);

  async function handleRefresh() {
    try {
      const data = await fetchNews();
      setPayload(data);
      setStatus("live");
    } catch {
      setStatus("live");
    }
  }

  return (
    <div className="monitor-news-feed">
      <div className="monitor-news-feed-toolbar">
        <div className="monitor-news-feed-status">
          <span
            className={`monitor-live-dot ${status === "syncing" ? "is-syncing" : ""}`}
            role="status"
            aria-live="polite"
            aria-label={status === "syncing" ? "Syncing news feed" : "News feed live"}
          />
          <p className="text-xs text-[var(--muted)]">
            {visibleItems.length} shown
            {filterCounts.hot ? ` · ${filterCounts.hot} hot` : ""}
            {payload.liveCount ? ` · ${payload.liveCount} RSS` : ""}
          </p>
        </div>
        <div className="monitor-news-feed-actions">
          {onShowNewsLayer ? (
            <button type="button" className="monitor-news-toolbar-btn" onClick={onShowNewsLayer}>
              Show on map
            </button>
          ) : null}
          <button
            type="button"
            className="monitor-news-toolbar-btn"
            onClick={() => void handleRefresh()}
            disabled={status === "syncing"}
          >
            {status === "syncing" ? "Syncing…" : "Refresh"}
          </button>
          {showFullPageLink ? (
            <Link href="/live" className="monitor-news-toolbar-btn">
              Full feed
            </Link>
          ) : null}
        </div>
      </div>

      {showFilters ? (
        <div className="monitor-news-filters" role="toolbar" aria-label="Filter news">
          {(Object.keys(NEWS_FILTER_LABELS) as NewsFeedFilter[]).map((key) => {
            const count = filterCounts[key];
            if (!count && filter !== key) return null;
            return (
              <button
                key={key}
                type="button"
                className={`monitor-news-filter ${filter === key ? "is-active" : ""} ${key === "hot" && count ? "has-hot" : ""}`}
                onClick={() => setFilter(key)}
              >
                {NEWS_FILTER_LABELS[key]}
                <span className="monitor-news-filter-count">{count}</span>
              </button>
            );
          })}
        </div>
      ) : null}

      <ul className="monitor-news-list">
        {visibleItems.map((item) => (
          <NewsCard
            key={item.id}
            item={item}
            hot={hotLookup.get(item.id)}
            onSelectCase={onSelectCase}
            onPlotOnMap={onPlotOnMap}
            compact={compact}
            caseName={item.caseSlug ? caseNames?.[item.caseSlug] : undefined}
          />
        ))}
        {!visibleItems.length ? (
          <li className="list-none">
            <EmptyState
              title={filter === "all" ? "No stories for this filter" : `No ${NEWS_FILTER_LABELS[filter].toLowerCase()} stories`}
              description={
                filter === "hot"
                  ? "Hot stories are scored from live RSS keywords, freshness, and dossier links."
                  : filter !== "all"
                    ? "Try the All filter or refresh after the next RSS sync."
                    : "Try clearing the region filter or check back after the next RSS sync."
              }
              actions={[
                { href: "/live", label: "All regions", primary: true },
                { href: "/", label: "World monitor" },
              ]}
            />
            {filter !== "all" ? (
              <button
                type="button"
                className="monitor-news-filter-reset btn btn-ghost mt-3 text-xs"
                onClick={() => setFilter("all")}
              >
                Show all stories
              </button>
            ) : null}
          </li>
        ) : null}
      </ul>
    </div>
  );
}
