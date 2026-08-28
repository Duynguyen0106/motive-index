"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { monitorUrlFromFilters, searchUrlFromFilters } from "@/lib/search";
import type { SearchFilters } from "@/lib/types";

type Props = {
  name: string;
  slug: string;
  searchSimilar: SearchFilters;
  country: string;
};

export function DossierActionBar({ name, slug, searchSimilar, country }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 400);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="dossier-action-bar" role="region" aria-label="Quick case actions">
      <div className="site-shell flex items-center justify-between gap-3 py-2.5">
        <p className="truncate text-sm font-medium text-[var(--ink)]">{name}</p>
        <div className="dossier-action-buttons flex shrink-0 flex-wrap justify-end gap-1.5">
          <Link href={monitorUrlFromFilters({}, slug)} className="btn btn-ghost px-2.5 py-1 text-xs">
            Map
          </Link>
          <Link
            href={searchUrlFromFilters(searchSimilar)}
            className="btn btn-ghost dossier-action-secondary px-2.5 py-1 text-xs"
          >
            Similar
          </Link>
          <Link
            href={`/live?country=${country}`}
            className="btn btn-ghost dossier-action-secondary px-2.5 py-1 text-xs"
          >
            News
          </Link>
          <Link href={`/cases/${slug}?tab=analysis`} className="btn btn-primary px-2.5 py-1 text-xs">
            Analysis
          </Link>
        </div>
      </div>
    </div>
  );
}
