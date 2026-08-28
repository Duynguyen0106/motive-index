"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readJsonResponse } from "@/lib/clientFetch";
import type { LiveUpdate } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function LiveFeedClient({ initial }: { initial: LiveUpdate[] }) {
  const [updates, setUpdates] = useState(initial);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch("/api/updates", { cache: "no-store" });
        if (!res.ok) return;
        const data = await readJsonResponse<{ updates: LiveUpdate[] }>(res);
        if (!cancelled) setUpdates(data.updates);
      } catch {
        /* ignore transient poll errors */
      }
    }

    const id = window.setInterval(poll, 20000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  return (
    <div>
      <p className="sr-only" role="status" aria-live="polite">
        Showing {updates.length} archive revision entries
      </p>
      <ul className="divide-y divide-[var(--line)]">
      {updates.map((u) => (
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
              ) : u.kind === "world_news" && u.sourceUrl ? (
                <a
                  href={u.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="display text-xl text-[var(--ink)] hover:text-[var(--accent)] md:text-2xl"
                >
                  {u.headline}
                </a>
              ) : (
                <p className="display text-xl text-[var(--ink)] md:text-2xl">{u.headline}</p>
              )}
              {u.languageLabel && u.language !== "en" ? (
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Translated from {u.languageLabel}
                  {u.originalHeadline ? ` · Original: ${u.originalHeadline}` : ""}
                </p>
              ) : null}
              <p className="body-copy mt-2 text-sm text-[var(--ink-soft)]">{u.summary}</p>
            </div>
          </div>
        </li>
      ))}
      </ul>
    </div>
  );
}
