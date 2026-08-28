"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { LiveFeedClient } from "@/components/LiveFeedClient";
import { LivePageHotNews } from "@/components/LivePageHotNews";
import { WorldNewsFeed } from "@/components/WorldNewsFeed";
import { readJsonResponse } from "@/lib/clientFetch";
import { filterArchiveActivityUpdates } from "@/lib/liveUpdates";
import { parseNewsFilter, type NewsFeedFilter } from "@/lib/newsFeedUtils";
import type { CountryCode, LiveUpdate } from "@/lib/types";
import type { WorldNewsPayload } from "@/lib/worldNewsService";
import { WORLD_NEWS_DISPLAY_LIMIT } from "@/lib/worldNews";

type Props = {
  initialNews: WorldNewsPayload;
  initialUpdates: LiveUpdate[];
  initialUpdatesTotal?: number;
  country?: string;
  initialNewsFilter?: NewsFeedFilter;
};

export function LivePageSync({
  initialNews,
  initialUpdates,
  initialUpdatesTotal,
  country = "",
  initialNewsFilter = "all",
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [news, setNews] = useState(initialNews);
  const [updates, setUpdates] = useState(initialUpdates);
  const [newsFilter, setNewsFilter] = useState<NewsFeedFilter>(initialNewsFilter);

  useEffect(() => {
    setNews(initialNews);
    setUpdates(initialUpdates);
  }, [initialNews, initialUpdates]);

  useEffect(() => {
    setNewsFilter(parseNewsFilter(searchParams.get("newsFilter")));
  }, [searchParams]);

  const handleNewsFilterChange = useCallback(
    (next: NewsFeedFilter) => {
      setNewsFilter(next);
      const p = new URLSearchParams(searchParams.toString());
      if (next === "all") p.delete("newsFilter");
      else p.set("newsFilter", next);
      const qs = p.toString();
      router.replace(qs ? `/live?${qs}` : "/live", { scroll: false });
    },
    [router, searchParams],
  );

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const newsQs = country
          ? `?country=${country}&limit=${WORLD_NEWS_DISPLAY_LIMIT}`
          : `?limit=${WORLD_NEWS_DISPLAY_LIMIT}`;
        const newsRes = await fetch(`/api/world-news${newsQs}`, { cache: "no-store" });
        if (!newsRes.ok) return;
        const newsJson = await readJsonResponse<WorldNewsPayload>(newsRes);
        if (!cancelled) setNews(newsJson);
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
            filter={newsFilter}
            onFilterChange={handleNewsFilterChange}
          />
        </div>
      </section>
      <section id="archive-activity" className="mt-12 pb-8">
        <h2 className="display text-2xl">Archive activity log</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Ingest events, analysis drafts, and human-reviewed revisions — not RSS crime news.
        </p>
        <div className="mt-6 border-t border-[var(--line-strong)]">
          <LiveFeedClient
            initial={archiveUpdates}
            initialTotal={initialUpdatesTotal}
            disablePolling
          />
        </div>
      </section>
    </>
  );
}
