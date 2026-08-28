"use client";

import Link from "next/link";
import { ArchiveFilterChips } from "@/components/ArchiveFilterChips";
import { CaseStatusBadge, EmptyState } from "@/components/ui";
import { CaseImagePanel } from "@/components/CaseImagePanel";
import { getPrimaryCaseImage } from "@/lib/caseImages";
import { COUNTRY_LABELS, type CountryCode } from "@/lib/country";
import { archiveUrlFromFilters } from "@/lib/search";
import type { CaseArchiveSummary, CrimeCategory, SearchFilters } from "@/lib/types";
import { CRIME_CATEGORY_LABELS } from "@/lib/types";

type Props = {
  cases: CaseArchiveSummary[];
  filters: SearchFilters;
  countryOptions: CountryCode[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export function CasesGrid({
  cases,
  filters,
  countryOptions,
  page,
  pageSize,
  total,
  totalPages,
}: Props) {
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);
  const hasFilters = Boolean(
    filters.q?.trim() ||
      filters.country ||
      filters.crimeCategory ||
      filters.status ||
      filters.period ||
      (filters.catalogTier && filters.catalogTier !== "all"),
  );

  function pageHref(p: number) {
    return archiveUrlFromFilters(filters, { page: p, pageSize });
  }

  return (
    <div>
      <form
        action="/archive"
        method="get"
        className="filter-toolbar archive-form card mb-4 grid gap-4 p-4 md:grid-cols-2 md:p-5 lg:grid-cols-[1fr_140px_140px_140px_auto]"
      >
        <label className="block text-sm md:col-span-2 lg:col-span-1">
          <span className="label mb-1 block normal-case tracking-normal">Keyword</span>
          <input
            name="q"
            defaultValue={filters.q ?? ""}
            placeholder="Name, place, motif…"
            className="field mt-1"
          />
        </label>
        <label className="block text-sm">
          <span className="label mb-1 block normal-case tracking-normal">Country</span>
          <select name="country" defaultValue={filters.country ?? ""} className="field mt-1">
            <option value="">All countries</option>
            {countryOptions.map((code) => (
              <option key={code} value={code}>
                {COUNTRY_LABELS[code]}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="label mb-1 block normal-case tracking-normal">Crime type</span>
          <select name="crimeCategory" defaultValue={filters.crimeCategory ?? ""} className="field mt-1">
            <option value="">All types</option>
            {(Object.keys(CRIME_CATEGORY_LABELS) as CrimeCategory[]).map((k) => (
              <option key={k} value={k}>
                {CRIME_CATEGORY_LABELS[k]}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="label mb-1 block normal-case tracking-normal">Status</span>
          <select name="status" defaultValue={filters.status ?? ""} className="field mt-1">
            <option value="">Any status</option>
            <option value="closed">Closed</option>
            <option value="unsolved">Unsolved</option>
            <option value="historical">Historical</option>
          </select>
        </label>

        <label className="mobile-hide block text-sm lg:col-span-1">
          <span className="label mb-1 block normal-case tracking-normal">Catalog tier</span>
          <select name="catalogTier" defaultValue={filters.catalogTier ?? "all"} className="field mt-1">
            <option value="all">All dossiers</option>
            <option value="curated">Curated only</option>
            <option value="composite">Composite archive</option>
          </select>
        </label>

        <details className="archive-more-filters md:hidden md:col-span-2 lg:col-span-4">
          <summary className="archive-more-filters-summary">More filters</summary>
          <label className="mt-4 block text-sm">
            <span className="label mb-1 block normal-case tracking-normal">Catalog tier</span>
            <select name="catalogTier" defaultValue={filters.catalogTier ?? "all"} className="field mt-1">
              <option value="all">All dossiers</option>
              <option value="curated">Curated only</option>
              <option value="composite">Composite archive</option>
            </select>
          </label>
        </details>

        <div className="search-form-actions archive-form-actions flex gap-2 self-end md:col-span-2 lg:col-span-4">
          <button type="submit" className="btn btn-primary">
            Apply filters
          </button>
          <Link href="/archive" className="btn btn-ghost">
            Clear
          </Link>
        </div>
      </form>

      {hasFilters ? <ArchiveFilterChips filters={filters} /> : null}

      <p className="mb-3 text-sm text-[var(--muted)]">
        {total === 0
          ? "No matching dossiers"
          : `Showing ${rangeStart}–${rangeEnd} of ${total.toLocaleString()}`}
      </p>

      <div className="index-table index-table-with-photos">
        <div className="index-head">
          <span className="index-head-photo" aria-hidden />
          <span>Year</span>
          <span>Case</span>
          <span className="text-right">Classification</span>
        </div>
        {cases.map((c) => {
          const thumb = getPrimaryCaseImage(c.slug);
          const country = c.country ?? "OTHER";
          return (
            <Link key={c.id} href={`/cases/${c.slug}`} className="index-row group">
              <span className="index-photo">
                {thumb ? (
                  <CaseImagePanel image={thumb} variant="index" hideCaption />
                ) : (
                  <span className="index-photo-placeholder" aria-hidden />
                )}
              </span>
              <span className="index-year">
                {c.yearStart}
                {c.yearEnd ? `–${c.yearEnd}` : ""}
              </span>
              <span>
                <span className="flex flex-wrap items-center gap-2">
                  <span className="index-title group-hover:text-[var(--accent)]">{c.name}</span>
                  {c.status === "unsolved" ? <CaseStatusBadge status={c.status} /> : null}
                </span>
                <span className="mt-1 block text-sm text-[var(--ink-soft)] line-clamp-2">
                  {c.subtitle}
                </span>
                <span className="mt-1 block text-xs text-[var(--muted)]">
                  {COUNTRY_LABELS[country]}
                </span>
              </span>
              <span className="index-meta">
                {c.crimeCategories.slice(0, 2).map((x) => CRIME_CATEGORY_LABELS[x]).join(" · ")}
              </span>
            </Link>
          );
        })}
      </div>

      {!cases.length ? (
        <EmptyState
          title="No matching dossiers"
          description="Try clearing filters or searching with a broader keyword."
          actions={[
            { href: "/archive", label: "Clear filters", primary: true },
            { href: "/search", label: "Advanced search" },
            { href: "/search?status=unsolved", label: "Unsolved cases" },
          ]}
        />
      ) : null}

      {totalPages > 1 ? (
        <nav
          className="archive-pagination mt-8 flex flex-wrap items-center justify-between gap-4"
          aria-label="Archive pages"
        >
          <div className="flex flex-wrap gap-2">
            {page > 1 ? (
              <Link href={pageHref(page - 1)} className="btn btn-ghost text-sm">
                ← Previous
              </Link>
            ) : (
              <span className="btn btn-ghost text-sm opacity-40 pointer-events-none">← Previous</span>
            )}
            {page < totalPages ? (
              <Link href={pageHref(page + 1)} className="btn btn-ghost text-sm">
                Next →
              </Link>
            ) : (
              <span className="btn btn-ghost text-sm opacity-40 pointer-events-none">Next →</span>
            )}
          </div>
          <p className="text-sm text-[var(--muted)]">
            Page {page} of {totalPages}
          </p>
        </nav>
      ) : null}
    </div>
  );
}
