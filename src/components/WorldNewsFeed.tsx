"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { COUNTRY_LABELS } from "@/lib/country";
import { readJsonResponse } from "@/lib/clientFetch";
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
}: {
  item: WorldNewsItem;
  onSelectCase?: (slug: string) => void;
  compact?: boolean;
}) {
  return (
    <li className="monitor-news-item">
      <div className="flex flex-wrap items-center gap-2">
        <time className="monitor-feed-time">{formatDate(item.createdAt)}</time>
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
        {item.country && item.country !== "OTHER" ? (
          <span>{COUNTRY_LABELS[item.country]}</span>
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

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs text-[var(--muted)]">
          {payload.items.length} stories
          {payload.liveCount ? ` · ${payload.liveCount} live RSS` : ""}
          {payload.seedCount ? ` · ${payload.seedCount} archive-linked` : ""}
        </p>
        <span className={`monitor-live-dot ${status === "syncing" ? "is-syncing" : ""}`} title={status} />
      </div>
      <ul className="monitor-news-list mt-3">
        {payload.items.map((item) => (
          <NewsRow key={item.id} item={item} onSelectCase={onSelectCase} compact={compact} />
        ))}
        {!payload.items.length ? (
          <li className="py-6 text-center text-sm text-[var(--muted)]">
            No news for current filters.
          </li>
        ) : null}
      </ul>
    </div>
  );
}
