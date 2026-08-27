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
    <ul className="grid gap-3">
      {updates.map((u) => (
        <li key={u.id} className="card p-5 md:p-6">
          <div className="grid gap-2 md:grid-cols-[120px_110px_1fr] md:gap-6">
            <time className="text-sm text-[var(--muted)] tabular-nums">
              {formatDate(u.createdAt)}
            </time>
            <span className="text-xs font-semibold tracking-[0.12em] text-[var(--accent)] uppercase">
              {u.kind.replaceAll("_", " ")}
            </span>
            <div>
              {u.caseSlug ? (
                <Link
                  href={`/cases/${u.caseSlug}`}
                  className="display text-xl text-[var(--ink)] transition-colors hover:text-[var(--accent)] md:text-2xl"
                >
                  {u.headline}
                </Link>
              ) : (
                <p className="display text-xl text-[var(--ink)] md:text-2xl">
                  {u.headline}
                </p>
              )}
              <p className="body-copy mt-2 text-[var(--ink-soft)]">{u.summary}</p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
