"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/ui";
import { readJsonResponse } from "@/lib/clientFetch";
import { detectHotCrimeNews } from "@/lib/hotNewsTicker";
import type { CountryCode } from "@/lib/types";
import type { WorldNewsPayload } from "@/lib/worldNewsService";
import { formatNewsRegion, type WorldNewsItem } from "@/lib/worldNews";
import { formatDate } from "@/lib/utils";

type Props = {
  initial: WorldNewsPayload;
  countryFilter?: CountryCode | "";
  onSelectCase?: (slug: string) => void;
  compact?: boolean;
};

function NewsRow({
  item,
  onSelectCase,
  compact,
  hot,
}: {
  item: WorldNewsItem;
  onSelectCase?: (slug: string) => void;
  compact?: boolean;
  hot?: boolean;
}) {
  return (
    <li className={`monitor-news-item ${hot ? "is-hot" : ""}`}>
      <div className="flex flex-wrap items-center gap-2">
        <time className="monitor-feed-time">{formatDate(item.createdAt)}</time>
        {hot ? <span className="monitor-news-hot-badge">Hot</span> : null}
        <span className="monitor-news-region">{formatNewsRegion(item)}</span>
        {item.languageLabel && item.language !== "en" ? (
          <span className="monitor-pill monitor-pill-lang">{item.languageLabel}</span>
        ) : null}
      </div>
      {item.sourceUrl ? (
        <a
          href={item.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="monitor-news-headline"
        >
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
      {!compact ? (
        <p className="mt-1 text-xs leading-relaxed text-[var(--ink-soft)]">{item.summary}</p>
      ) : null}
      <div className="mt-2 flex flex-wrap gap-3 text-xs text-[var(--muted)]">
        {item.sourceName ? <span>{item.sourceName}</span> : null}
        {item.caseSlug ? (
          onSelectCase ? (
            <button
              type="button"
              className="text-[var(--accent)] hover:underline"
              onClick={() => onSelectCase(item.caseSlug!)}
            >
              View dossier
            </button>
          ) : (
            <Link href={`/cases/${item.caseSlug}`} className="text-[var(--accent)] hover:underline">
              View dossier
            </Link>
          )
        ) : null}
      </div>
    </li>
  );
}

export function WorldNewsFeed({ initial, countryFilter = "", onSelectCase, compact }: Props) {
  const [payload, setPayload] = useState(initial);
  const [status, setStatus] = useState<"live" | "syncing">("live");

  useEffect(() => {
    setPayload(initial);
  }, [initial]);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        setStatus("syncing");
        const qs = countryFilter ? `?country=${countryFilter}&limit=24` : "?limit=24";
        const res = await fetch(`/api/world-news${qs}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await readJsonResponse<WorldNewsPayload>(res);
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
  }, [countryFilter]);

  const hotIds = useMemo(() => {
    const hot = detectHotCrimeNews([], payload.items);
    return new Set(hot.map((h) => h.id));
  }, [payload.items]);

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs text-[var(--muted)]">
          {payload.items.length} stories
          {payload.liveCount ? ` · ${payload.liveCount} live RSS` : ""}
          {payload.seedCount ? ` · ${payload.seedCount} archive-linked` : ""}
        </p>
        <span
          className={`monitor-live-dot ${status === "syncing" ? "is-syncing" : ""}`}
          role="status"
          aria-live="polite"
          aria-label={status === "syncing" ? "Syncing news feed" : "News feed live"}
        />
      </div>
      <ul className="monitor-news-list mt-3">
        {payload.items.map((item) => (
          <NewsRow
            key={item.id}
            item={item}
            onSelectCase={onSelectCase}
            compact={compact}
            hot={hotIds.has(item.id)}
          />
        ))}
        {!payload.items.length ? (
          <li className="list-none">
            <EmptyState
              title="No stories for this filter"
              description="Try clearing the region filter or check back after the next RSS sync."
              actions={[
                { href: "/live", label: "All regions", primary: true },
                { href: "/", label: "World monitor" },
              ]}
            />
          </li>
        ) : null}
      </ul>
    </div>
  );
}
