"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ShareLinkButton } from "@/components/ShareLinkButton";
import { dossierShareUrl } from "@/lib/case-tabs";
import { monitorUrlFromFilters, searchUrlFromFilters } from "@/lib/search";
import type { SearchFilters } from "@/lib/types";

type Props = {
  name: string;
  slug: string;
  searchSimilar: SearchFilters;
  country: string;
  hasNarrative?: boolean;
  siteOrigin?: string;
};

const NEXT_TAB: Record<string, { tab: string; label: string }> = {
  story: { tab: "overview", label: "Overview" },
  overview: { tab: "analysis", label: "Psychology" },
  timeline: { tab: "analysis", label: "Psychology" },
  analysis: { tab: "documents", label: "Documents" },
  documents: { tab: "references", label: "References" },
  references: { tab: "overview", label: "Overview" },
};

export function DossierActionBar({
  name,
  slug,
  searchSimilar,
  country,
  hasNarrative = false,
  siteOrigin = "",
}: Props) {
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const activeTab = searchParams.get("tab") ?? (hasNarrative ? "story" : "overview");
  const next = NEXT_TAB[activeTab] ?? NEXT_TAB.overview;

  const shareUrl = useMemo(
    () => dossierShareUrl(slug, activeTab, { hasNarrative, siteOrigin: siteOrigin || undefined }),
    [slug, activeTab, hasNarrative, siteOrigin],
  );

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
          <ShareLinkButton url={shareUrl} label="Share" />
          <Link
            href={`/cases/${slug}?tab=${next.tab}`}
            className="btn btn-primary px-2.5 py-1 text-xs"
          >
            {next.label}
          </Link>
        </div>
      </div>
    </div>
  );
}
