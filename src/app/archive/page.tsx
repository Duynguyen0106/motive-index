import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PaginationScrollReset } from "@/components/PaginationScrollReset";
import { CaseImagePanel } from "@/components/CaseImagePanel";
import { CasesGrid } from "@/components/CasesGrid";
import { Disclaimer } from "@/components/Disclaimer";
import { LiveTicker } from "@/components/LiveTicker";
import { PageHeader } from "@/components/PageHeader";
import { QuickLinks, StatBar } from "@/components/ui";
import { toCaseArchiveSummary } from "@/lib/caseSummaries";
import { listCountryOptions } from "@/lib/country";
import { getPublicCases, getCaseOfWeek, getUpdates, searchCasesFrom } from "@/lib/data";
import {
  DEFAULT_ARCHIVE_PAGE_SIZE,
  paginateCases,
  parseArchiveSort,
  parseSearchParams,
  sortArchiveCases,
} from "@/lib/search";
import { getCachedArchiveStats } from "@/lib/archiveStats";

export const metadata: Metadata = {
  title: "Case archive",
  description:
    "Browse structured forensic psychology dossiers—filter by country, crime type, catalog tier, and keyword.",
};

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ArchivePage({ searchParams }: Props) {
  const raw = await searchParams;
  const filters = parseSearchParams(raw);
  const page = Math.max(1, Number(raw.page) || 1);
  const pageSize = Math.min(
    100,
    Math.max(10, Number(raw.pageSize) || DEFAULT_ARCHIVE_PAGE_SIZE),
  );

  const sort = parseArchiveSort(typeof raw.sort === "string" ? raw.sort : undefined);

  const allCases = getPublicCases();
  const filtered = sortArchiveCases(searchCasesFrom(allCases, filters), sort);
  const paginated = paginateCases(filtered, page, pageSize);
  const summaries = paginated.items.map(toCaseArchiveSummary);
  const countryOptions = listCountryOptions(allCases);
  const updates = getUpdates(4);
  const cotw = getCaseOfWeek();
  const stats = getCachedArchiveStats(allCases);

  return (
    <>
      <div className="site-shell page-intro py-10 md:py-12">
        <Breadcrumbs
          items={[{ label: "Monitor", href: "/" }, { label: "Case archive" }]}
        />
        <PageHeader
          className="mt-5"
          title="Behavioral dossiers"
          description="Structured case files, document pointers, and forensic-psychological commentary—with citations, confidence notes, and explicit unknowns."
        />
        <QuickLinks
          links={[
            { href: "/", label: "World monitor" },
            { href: "/search", label: "Advanced search" },
            { href: "/stats", label: "Archive stats" },
            { href: "/live", label: "World news" },
            { href: "/search?status=unsolved", label: "Unsolved" },
          ]}
        />
        <StatBar
          items={[
            { label: "Total dossiers", value: stats.total },
            { label: "Countries", value: stats.countries },
            { label: "Unsolved", value: stats.unsolved, highlight: true },
          ]}
        />
      </div>

      <LiveTicker updates={updates} />

      {cotw ? (
        <section className="site-shell pt-6">
          <article className="featured-card">
            <div className="featured-card-accent" />
            <div className="featured-card-body md:flex md:items-stretch md:justify-between md:gap-8">
              <div className="featured-card-copy md:flex-1">
                <p className="label">Featured dossier</p>
                <h2 className="display mt-2 text-3xl text-[var(--ink)]">{cotw.name}</h2>
                <p className="mt-2 max-w-2xl text-[var(--ink-soft)]">{cotw.subtitle}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={`/cases/${cotw.slug}`} className="btn btn-primary">
                    Read dossier
                  </Link>
                  <Link href={`/?case=${cotw.slug}`} className="btn btn-ghost">
                    Plot on map
                  </Link>
                </div>
              </div>
              {cotw.images?.[0] ? (
                <div className="featured-card-media mt-4 md:mt-0 md:w-56 md:shrink-0">
                  <CaseImagePanel image={cotw.images[0]} variant="thumb" />
                </div>
              ) : null}
            </div>
          </article>
        </section>
      ) : null}

      <section className="site-shell py-10 md:py-12">
        <Suspense fallback={null}>
          <PaginationScrollReset />
        </Suspense>
        <div className="mb-6 flex flex-col gap-1 border-b border-[var(--line)] pb-4 md:flex-row md:items-baseline md:justify-between">
          <h2 className="display text-2xl text-[var(--ink)]">Case index</h2>
          <p className="text-sm text-[var(--muted)]">
            {filtered.length.toLocaleString()} matching · paginated index
          </p>
        </div>
        <Suspense
          fallback={
            <div className="card p-6" role="status" aria-live="polite">
              <p className="text-sm text-[var(--muted)]">Loading case index…</p>
              <div className="skeleton-block mt-4 h-48" aria-hidden />
            </div>
          }
        >
          <CasesGrid
            cases={summaries}
            filters={filters}
            countryOptions={countryOptions}
            page={paginated.page}
            pageSize={paginated.pageSize}
            total={paginated.total}
            totalPages={paginated.totalPages}
            sort={sort}
          />
        </Suspense>
      </section>

      <section className="site-shell pb-16">
        <Disclaimer />
      </section>
    </>
  );
}
