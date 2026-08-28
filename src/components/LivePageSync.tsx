"use client";

import { useEffect, useState } from "react";
import { LiveFeedClient } from "@/components/LiveFeedClient";
import { LivePageHotNews } from "@/components/LivePageHotNews";
import { WorldNewsFeed } from "@/components/WorldNewsFeed";
import { readJsonResponse } from "@/lib/clientFetch";
import { filterArchiveActivityUpdates } from "@/lib/liveUpdates";
import type { CountryCode, LiveUpdate } from "@/lib/types";
import type { WorldNewsPayload } from "@/lib/worldNewsService";

type Props = {
  initialNews: WorldNewsPayload;
  initialUpdates: LiveUpdate[];
  country?: string;
};

export function LivePageSync({ initialNews, initialUpdates, country = "" }: Props) {
  const [news, setNews] = useState(initialNews);
  const [updates, setUpdates] = useState(initialUpdates);

  useEffect(() => {
    setNews(initialNews);
    setUpdates(initialUpdates);
  }, [initialNews, initialUpdates]);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const newsQs = country ? `?country=${country}&limit=40` : "?limit=40";
        const [newsRes, updatesRes] = await Promise.all([
          fetch(`/api/world-news${newsQs}`, { cache: "no-store" }),
          fetch("/api/updates", { cache: "no-store" }),
        ]);
        if (!newsRes.ok || !updatesRes.ok) return;
        const [newsJson, updatesJson] = await Promise.all([
          readJsonResponse<WorldNewsPayload>(newsRes),
          readJsonResponse<{ updates: LiveUpdate[] }>(updatesRes),
        ]);
        if (!cancelled) {
          setNews(newsJson);
          setUpdates(updatesJson.updates);
        }
      } catch {
        /* ignore transient poll errors */
      }
    }

    const id = window.setInterval(poll, 30000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [country]);

  const archiveUpdates = filterArchiveActivityUpdates(updates);

  return (
    <>
      <LivePageHotNews worldNewsItems={news.items} country={country || undefined} />
      <section className="mt-10">
        <h2 className="display text-2xl">Global feed</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Refreshes every 30 seconds · synced with monitor news
        </p>
        <div className="mt-6 card p-5">
          <WorldNewsFeed
            initial={news}
            countryFilter={(country as CountryCode) || ""}
            showFullPageLink={false}
            disablePolling
          />
        </div>
      </section>
      <section id="archive-activity" className="mt-12 pb-8">
        <h2 className="display text-2xl">Archive activity log</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Ingest events, analysis drafts, and human-reviewed revisions — not RSS crime news.
        </p>
        <div className="mt-6 border-t border-[var(--line-strong)]">
          <LiveFeedClient initial={archiveUpdates} disablePolling />
        </div>
      </section>
    </>
  );
}
