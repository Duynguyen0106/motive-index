"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "@/components/ui";
import { readJsonResponse } from "@/lib/clientFetch";
import { filterArchiveActivityUpdates } from "@/lib/liveUpdates";
import type { LiveUpdate } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const LOAD_MORE_STEP = 20;
const INITIAL_LIMIT = 30;

type Props = {
  initial: LiveUpdate[];
  initialTotal?: number;
  disablePolling?: boolean;
};

export function LiveFeedClient({
  initial,
  initialTotal,
  disablePolling = false,
}: Props) {
  const [updates, setUpdates] = useState(initial);
  const [limit, setLimit] = useState(Math.max(initial.length, INITIAL_LIMIT));
  const [total, setTotal] = useState(initialTotal ?? initial.length);
  const [loadingMore, setLoadingMore] = useState(false);
  const archiveUpdates = filterArchiveActivityUpdates(updates);

  useEffect(() => {
    setUpdates(initial);
    setLimit(Math.max(initial.length, INITIAL_LIMIT));
    if (initialTotal != null) setTotal(initialTotal);
  }, [initial, initialTotal]);

  useEffect(() => {
    if (disablePolling) return;
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(`/api/updates?limit=${limit}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await readJsonResponse<{ updates: LiveUpdate[]; total: number }>(res);
        if (!cancelled) {
          setUpdates(data.updates);
          setTotal(data.total);
        }
      } catch {
        /* ignore transient poll errors */
      }
    }

    const id = window.setInterval(poll, 20000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [disablePolling, limit]);

  const loadMore = useCallback(async () => {
    const nextLimit = limit + LOAD_MORE_STEP;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/updates?limit=${nextLimit}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await readJsonResponse<{ updates: LiveUpdate[]; total: number }>(res);
      setUpdates(data.updates);
      setTotal(data.total);
      setLimit(nextLimit);
    } catch {
      /* ignore */
    } finally {
      setLoadingMore(false);
    }
  }, [limit]);

  const canLoadMore = archiveUpdates.length < total;

  return (
    <div>
      <p className="sr-only" role="status" aria-live="polite">
        Showing {archiveUpdates.length} archive revision entries
      </p>
      <ul className="divide-y divide-[var(--line)]">
      {archiveUpdates.map((u) => (
        <li key={u.id} className="py-5 md:py-6">
          <div className="grid gap-2 md:grid-cols-[7rem_6rem_1fr] md:gap-6 md:items-baseline">
            <time className="text-xs tabular-nums text-[var(--muted)]">
              {formatDate(u.createdAt)}
            </time>
            <span className="label normal-case">{u.kind.replaceAll("_", " ")}</span>
            <div>
              {u.caseSlug ? (
                <Link href={`/cases/${u.caseSlug}`} className="text-link display text-xl md:text-2xl">
                  {u.headline}
                </Link>
              ) : (
                <p className="display text-xl text-[var(--ink)] md:text-2xl">{u.headline}</p>
              )}
              <p className="body-copy mt-2 text-sm text-[var(--ink-soft)]">{u.summary}</p>
            </div>
          </div>
        </li>
      ))}
      {!archiveUpdates.length ? (
        <li className="list-none py-4">
          <EmptyState
            title="No archive activity yet"
            description="Ingest events and analysis revisions will appear here as the catalog grows."
            actions={[
              { href: "/archive", label: "Browse archive", primary: true },
              { href: "/", label: "World monitor" },
            ]}
          />
        </li>
      ) : null}
      </ul>
      {canLoadMore ? (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            className="btn btn-ghost text-sm"
            onClick={() => void loadMore()}
            disabled={loadingMore}
          >
            {loadingMore ? "Loading…" : `Load more (${archiveUpdates.length} of ${total})`}
          </button>
        </div>
      ) : null}
    </div>
  );
}
