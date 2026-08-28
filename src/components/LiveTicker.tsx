import Link from "next/link";
import { filterArchiveActivityUpdates } from "@/lib/liveUpdates";
import type { LiveUpdate } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function LiveTicker({ updates }: { updates: LiveUpdate[] }) {
  const latest = filterArchiveActivityUpdates(updates).slice(0, 4);

  if (!latest.length) return null;

  return (
    <section aria-label="Recent archive activity" className="border-b border-[var(--line)] bg-[var(--bg-subtle)]">
      <div className="site-shell py-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:gap-8">
          <p className="label shrink-0 pt-0.5 md:w-28">Recent edits</p>
          <ul className="flex flex-1 flex-col gap-2">
            {latest.map((u) => (
              <li
                key={u.id}
                className="grid gap-1 md:grid-cols-[7rem_1fr] md:items-baseline md:gap-4"
              >
                <time className="text-xs tabular-nums text-[var(--muted)]">
                  {formatDate(u.createdAt)}
                </time>
                {u.caseSlug ? (
                  <Link href={`/cases/${u.caseSlug}`} className="text-link text-sm leading-snug">
                    {u.headline}
                  </Link>
                ) : (
                  <span className="text-sm text-[var(--ink-soft)]">{u.headline}</span>
                )}
              </li>
            ))}
          </ul>
          <Link href="/live#archive-activity" className="text-link shrink-0 text-sm">
            Activity log
          </Link>
        </div>
      </div>
    </section>
  );
}
