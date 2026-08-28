"use client";

import Link from "next/link";
import { useState } from "react";
import type { ArchiveStatBucket } from "@/lib/archiveStats";

type Props = {
  title: string;
  subtitle?: string;
  buckets: ArchiveStatBucket[];
  max: number;
  chartTitle: string;
  initialLimit?: number;
  viewAllHref?: string;
  viewAllLabel?: string;
};

export function StatsExpandableChart({
  title,
  subtitle,
  buckets,
  max,
  chartTitle,
  initialLimit = 10,
  viewAllHref,
  viewAllLabel = "Show all",
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? buckets : buckets.slice(0, initialLimit);
  const canExpand = buckets.length > initialLimit;

  return (
    <section className="card p-6 md:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="display text-xl">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-[var(--muted)]">{subtitle}</p> : null}
        </div>
        {canExpand ? (
          <button
            type="button"
            className="text-sm text-[var(--accent)] hover:underline"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? "Show less" : `${viewAllLabel} (${buckets.length})`}
          </button>
        ) : null}
      </div>
      <ul className="stats-bars mt-4 space-y-2" role="list" aria-label={chartTitle}>
        {visible.map((b) => (
          <li key={b.label} className="stats-bar-row">
            <Link href={b.href} className="stats-bar-link group">
              <span className="stats-bar-label" title={b.label}>
                {b.label}
              </span>
              <div
                className="stats-bar-track"
                role="img"
                aria-label={`${b.label}: ${b.count} dossiers`}
              >
                <div
                  className="stats-bar-fill"
                  style={{ width: max ? `${(b.count / max) * 100}%` : "0%" }}
                />
              </div>
              <span className="stats-bar-count">{b.count}</span>
            </Link>
          </li>
        ))}
      </ul>
      {viewAllHref ? (
        <p className="mt-4">
          <Link href={viewAllHref} className="text-sm text-[var(--accent)] hover:underline">
            Browse in archive →
          </Link>
        </p>
      ) : null}
    </section>
  );
}
