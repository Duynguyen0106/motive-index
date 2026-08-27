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
              ) : (
                <p className="display text-xl text-[var(--ink)] md:text-2xl">{u.headline}</p>
              )}
              <p className="body-copy mt-2 text-sm text-[var(--ink-soft)]">{u.summary}</p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
