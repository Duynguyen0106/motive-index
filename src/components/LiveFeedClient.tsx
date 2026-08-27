"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
        const data = (await res.json()) as { updates: LiveUpdate[] };
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
    <ul className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
      {updates.map((u, i) => (
        <li
          key={u.id}
          className="grid gap-2 py-6 md:grid-cols-[140px_100px_1fr] md:gap-8"
          style={{ animationDelay: `${Math.min(i, 6) * 40}ms` }}
        >
          <time className="text-sm text-[var(--muted)] tabular-nums">
            {formatDate(u.createdAt)}
          </time>
          <span className="text-xs tracking-[0.14em] text-[var(--accent)] uppercase">
            {u.kind.replaceAll("_", " ")}
          </span>
          <div>
            {u.caseSlug ? (
              <Link
                href={`/cases/${u.caseSlug}`}
                className="display text-2xl transition-colors hover:text-[var(--accent)]"
              >
                {u.headline}
              </Link>
            ) : (
              <p className="display text-2xl">{u.headline}</p>
            )}
            <p className="serif mt-2 text-[var(--ink-soft)]">{u.summary}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
