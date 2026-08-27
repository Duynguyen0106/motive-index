import Link from "next/link";
import type { LiveUpdate } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function LiveTicker({ updates }: { updates: LiveUpdate[] }) {
  const latest = updates.slice(0, 4);

  return (
    <section
      aria-label="Live updates"
      className="border-b border-[var(--line)] bg-[var(--bg-subtle)] py-5"
    >
      <div className="site-shell flex flex-col gap-3 md:flex-row md:items-start md:gap-10">
        <div className="flex shrink-0 items-center gap-2 pt-1 text-xs font-semibold tracking-[0.16em] text-[var(--accent)] uppercase">
          <span className="pulse-live inline-block h-2 w-2 rounded-full bg-[var(--accent)]" />
          Live
        </div>
        <ul className="flex flex-1 flex-col gap-2">
          {latest.map((u) => (
            <li
              key={u.id}
              className="flex flex-col gap-0.5 md:flex-row md:items-baseline md:gap-4"
            >
              <time className="shrink-0 text-xs text-[var(--muted)] tabular-nums">
                {formatDate(u.createdAt)}
              </time>
              {u.caseSlug ? (
                <Link
                  href={`/cases/${u.caseSlug}`}
                  className="body-copy text-[var(--ink)] transition-colors hover:text-[var(--accent)]"
                >
                  {u.headline}
                </Link>
              ) : (
                <span className="body-copy text-[var(--ink)]">{u.headline}</span>
              )}
            </li>
          ))}
        </ul>
        <Link
          href="/live"
          className="shrink-0 text-sm font-medium text-[var(--accent)] underline-offset-4 hover:underline"
        >
          Full feed
        </Link>
      </div>
    </section>
  );
}
