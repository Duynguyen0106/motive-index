import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CaseImagePanel } from "@/components/CaseImagePanel";
import { EmptyState, QuickLinks } from "@/components/ui";
import { getPrimaryCaseImage } from "@/lib/caseImages";
import { SearchFilterChips } from "@/components/SearchFilterChips";
import {
  CRIME_CATEGORY_LABELS,
  DOCUMENT_TYPE_LABELS,
  FACTOR_LABELS,
  FRAMEWORK_LABELS,
} from "@/lib/types";
import type { CrimeCategory, CountryCode, DocumentType, PsychologicalFactor, TheoreticalFramework } from "@/lib/types";
import { COUNTRY_LABELS, listCountryOptions, resolveCaseCountry } from "@/lib/country";
import { getAllCases } from "@/lib/data";
import {
  DEFAULT_ARCHIVE_PAGE_SIZE,
  DEFAULT_DOC_PAGE_SIZE,
  paginateCases,
  parseArchiveSort,
  parseSearchParams,
  hasActiveFilters,
  monitorUrlFromFilters,
  searchUrlFromFilters,
  sortArchiveCases,
} from "@/lib/search";
import { runSearch } from "@/lib/searchServer";

export const metadata: Metadata = {
  title: "Search",
  description: "Advanced search across cases, psychological factors, and documents.",
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function SearchPage({ searchParams }: Props) {
  const raw = await searchParams;
  const filters = parseSearchParams(raw);
  const { cases: allMatchingCases, documents: allDocuments } = runSearch(filters);
  const sort = parseArchiveSort(typeof raw.sort === "string" ? raw.sort : undefined);
  const sortedCases = sortArchiveCases(allMatchingCases, sort);
  const page = Math.max(1, Number(raw.page) || 1);
  const pageSize = Math.min(
    100,
    Math.max(10, Number(raw.pageSize) || DEFAULT_ARCHIVE_PAGE_SIZE),
  );
  const docPage = Math.max(1, Number(raw.docPage) || 1);
  const docPageSize = Math.min(
    100,
    Math.max(10, Number(raw.docPageSize) || DEFAULT_DOC_PAGE_SIZE),
  );
  const paginated = paginateCases(sortedCases, page, pageSize);
  const paginatedDocs = paginateCases(allDocuments, docPage, docPageSize);
  const cases = paginated.items;
  const documents = paginatedDocs.items;
  const searchOpts = { pageSize, sort, docPage, docPageSize };
  const countryOptions = listCountryOptions(getAllCases());
  const hasQuery = hasActiveFilters(filters);
  const focusSearch = raw.focus === "1" || raw.focus === "true";
  const monitorHref = monitorUrlFromFilters({
    q: filters.q,
    country: filters.country,
    crimeCategory: filters.crimeCategory,
    status: filters.status,
    period: filters.period,
  });

  return (
    <div className="site-shell page-scroll-safe py-12 md:py-14">
      <Breadcrumbs
        items={[{ label: "Monitor", href: "/" }, { label: "Advanced search" }]}
      />
      <p className="text-xs font-semibold tracking-[0.16em] text-[var(--accent)] uppercase mt-5">
        Search
      </p>
      <h1 className="display mt-3 text-4xl text-[var(--ink)] md:text-5xl">
        Advanced search & filtering
      </h1>
      <p className="body-copy mt-4 max-w-2xl text-lg text-[var(--ink-soft)]">
        Filter the repository by psychological factor, crime category, theory,
        country, period, location, and document type.
      </p>

      <QuickLinks
        links={[
          { href: "/", label: "World monitor" },
          { href: "/archive", label: "Archive" },
          { href: "/search?status=unsolved", label: "Unsolved" },
          { href: "/search?country=US", label: "United States" },
        ]}
      />

      <form
        action="/search"
        method="get"
        className="filter-toolbar search-form card mt-8 grid gap-4 p-5 md:grid-cols-2 md:p-6 lg:grid-cols-3"
      >
        <label className="block text-sm md:col-span-2 lg:col-span-3">
          <span className="font-medium text-[var(--ink)]">Full-text query</span>
          <input
            name="q"
            defaultValue={filters.q}
            autoFocus={focusSearch}
            placeholder="e.g. compartmentalization, manifesto, trust"
            className="field mt-1"
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium">Crime category</span>
          <select
            name="crimeCategory"
            defaultValue={filters.crimeCategory ?? ""}
            className="field mt-1"
          >
            <option value="">Any</option>
            {(Object.keys(CRIME_CATEGORY_LABELS) as CrimeCategory[]).map((k) => (
              <option key={k} value={k}>
                {CRIME_CATEGORY_LABELS[k]}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="font-medium">Country</span>
          <select
            name="country"
            defaultValue={filters.country ?? ""}
            className="field mt-1"
          >
            <option value="">Any</option>
            {countryOptions.map((code) => (
              <option key={code} value={code}>
                {COUNTRY_LABELS[code]}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="font-medium">Case status</span>
          <select
            name="status"
            defaultValue={filters.status ?? ""}
            className="field mt-1"
          >
            <option value="">Any</option>
            <option value="closed">Closed</option>
            <option value="unsolved">Unsolved</option>
            <option value="historical">Historical</option>
          </select>
        </label>

        <details className="search-more-filters md:col-span-2 lg:col-span-3">
          <summary className="search-more-filters-summary">More filters</summary>
          <div className="search-more-filters-grid mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <label className="block text-sm">
          <span className="font-medium">Psychological factor</span>
          <select
            name="psychologicalFactor"
            defaultValue={filters.psychologicalFactor ?? ""}
            className="field mt-1"
          >
            <option value="">Any</option>
            {(Object.keys(FACTOR_LABELS) as PsychologicalFactor[]).map((k) => (
              <option key={k} value={k}>
                {FACTOR_LABELS[k]}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="font-medium">Theoretical model</span>
          <select
            name="theoreticalFramework"
            defaultValue={filters.theoreticalFramework ?? ""}
            className="field mt-1"
          >
            <option value="">Any</option>
            {(Object.keys(FRAMEWORK_LABELS) as TheoreticalFramework[]).map((k) => (
              <option key={k} value={k}>
                {FRAMEWORK_LABELS[k]}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="font-medium">Diagnosis contains</span>
          <input
            name="diagnosis"
            defaultValue={filters.diagnosis}
            placeholder="e.g. psychopathy"
            className="field mt-1"
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium">Location</span>
          <input
            name="location"
            defaultValue={filters.location}
            placeholder="e.g. California"
            className="field mt-1"
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium">Time period / year</span>
          <input
            name="period"
            defaultValue={filters.period}
            placeholder="e.g. 1974 or 1970s"
            className="field mt-1"
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium">Offender sex</span>
          <select
            name="offenderSex"
            defaultValue={filters.offenderSex ?? ""}
            className="field mt-1"
          >
            <option value="">Any</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="unknown">Unknown</option>
          </select>
        </label>

        <label className="block text-sm">
          <span className="font-medium">Document type</span>
          <select
            name="documentType"
            defaultValue={filters.documentType ?? ""}
            className="field mt-1"
          >
            <option value="">Any</option>
            {(Object.keys(DOCUMENT_TYPE_LABELS) as DocumentType[]).map((k) => (
              <option key={k} value={k}>
                {DOCUMENT_TYPE_LABELS[k]}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="font-medium">Catalog tier</span>
          <select
            name="catalogTier"
            defaultValue={filters.catalogTier || "all"}
            className="field mt-1"
          >
            <option value="all">All dossiers</option>
            <option value="curated">Curated only</option>
            <option value="composite">Composite archive</option>
          </select>
        </label>

        <label className="block text-sm">
          <span className="font-medium">Sort results</span>
          <select name="sort" defaultValue={sort} className="field mt-1">
            <option value="featured">Featured first</option>
            <option value="year-desc">Newest year</option>
            <option value="year-asc">Oldest year</option>
            <option value="name-asc">Name A–Z</option>
          </select>
        </label>

        <label className="block text-sm">
          <span className="font-medium">Cases per page</span>
          <select name="pageSize" defaultValue={String(pageSize)} className="field mt-1">
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </label>

          </div>
        </details>

        <div className="search-form-actions flex items-end gap-3 md:col-span-2 lg:col-span-3">
          <button type="submit" className="btn btn-primary">
            Apply filters
          </button>
          <Link href="/search" className="btn btn-ghost">
            Reset
          </Link>
        </div>
      </form>

      {hasQuery ? <SearchFilterChips filters={filters} /> : null}

      {!hasQuery ? (
        <section className="card mt-10 p-8 text-center">
          <h2 className="display text-2xl">Start with a filter</h2>
          <p className="body-copy mt-3 text-[var(--ink-soft)]">
            Advanced search covers psychological factors, theories, diagnosis, and document types
            beyond the monitor. Or explore the map-first view.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/" className="btn btn-primary text-sm">
              Open world monitor
            </Link>
            <Link href="/search?status=unsolved" className="btn btn-ghost text-sm">
              Unsolved cases
            </Link>
            <Link href="/search?country=US" className="btn btn-ghost text-sm">
              United States
            </Link>
            <Link href="/search?psychologicalFactor=psychopathy_traits" className="btn btn-ghost text-sm">
              Psychopathy traits
            </Link>
          </div>
        </section>
      ) : (
        <>
          <p className="mt-6 text-sm text-[var(--muted)]">
            {paginated.total.toLocaleString()} cases · {paginatedDocs.total.toLocaleString()} documents ·{" "}
            <Link href={monitorHref} className="text-[var(--accent)] hover:underline">
              View on map
            </Link>
          </p>

          {(paginated.total > 0 || paginatedDocs.total > 0) ? (
            <nav className="search-result-jumps mt-4 flex flex-wrap gap-2" aria-label="Jump to result sections">
              {paginated.total > 0 ? (
                <a href="#search-cases" className="filter-chip">
                  Cases ({paginated.total.toLocaleString()})
                </a>
              ) : null}
              {paginatedDocs.total > 0 ? (
                <a href="#search-documents" className="filter-chip">
                  Documents ({paginatedDocs.total.toLocaleString()})
                </a>
              ) : null}
            </nav>
          ) : null}

          <section id="search-cases" className="mt-8 scroll-mt-24">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="display text-3xl">Cases ({paginated.total.toLocaleString()})</h2>
              {paginated.totalPages > 1 ? (
                <p className="text-sm text-[var(--muted)]">
                  Page {paginated.page} of {paginated.totalPages}
                </p>
              ) : null}
            </div>
            <ul className="mt-4 grid gap-3">
              {cases.map((c) => {
                const thumb = getPrimaryCaseImage(c.slug);
                return (
                <li key={c.id}>
                  <div className="search-result-card card card-hover p-5">
                    <div className="search-result-body flex gap-4">
                      {thumb ? (
                        <Link href={`/cases/${c.slug}`} className="search-result-thumb shrink-0">
                          <CaseImagePanel image={thumb} variant="index" hideCaption />
                        </Link>
                      ) : null}
                      <div className="min-w-0 flex-1">
                    <Link href={`/cases/${c.slug}`} className="block">
                      <p className="text-xs text-[var(--muted)] uppercase tracking-[0.12em]">
                        {COUNTRY_LABELS[resolveCaseCountry(c)]} · {c.location} · {c.yearStart}
                        {c.yearEnd ? `–${c.yearEnd}` : ""}
                      </p>
                      <h3 className="display mt-1 text-2xl">{c.name}</h3>
                      <p className="mt-2 text-[var(--ink-soft)]">{c.subtitle}</p>
                      <p className="mt-2 text-sm text-[var(--muted)]">
                        {c.crimeCategories.map((x) => CRIME_CATEGORY_LABELS[x]).join(" · ")}
                      </p>
                    </Link>
                    <Link
                      href={monitorUrlFromFilters({}, c.slug)}
                      className="mt-3 inline-block text-sm font-medium text-[var(--accent)] hover:underline"
                    >
                      Plot on map
                    </Link>
                      </div>
                    </div>
                  </div>
                </li>
              );
              })}
          {!cases.length ? (
            <li>
              <EmptyState
                title="No cases match"
                description="Broaden your filters or try the monitor map view."
                actions={[
                  { href: monitorHref, label: "View on map", primary: true },
                  { href: "/search", label: "Clear filters" },
                ]}
              />
            </li>
          ) : null}
            </ul>
            {paginated.totalPages > 1 ? (
              <nav
                className="archive-pagination mt-8 flex flex-wrap items-center justify-between gap-4"
                aria-label="Search result pages"
              >
                <div className="flex flex-wrap gap-2">
                  {paginated.page > 1 ? (
                    <Link
                      href={searchUrlFromFilters(filters, { ...searchOpts, page: paginated.page - 1 })}
                      className="btn btn-ghost text-sm"
                    >
                      ← Previous
                    </Link>
                  ) : (
                    <span className="btn btn-ghost text-sm opacity-40 pointer-events-none">
                      ← Previous
                    </span>
                  )}
                  {paginated.page < paginated.totalPages ? (
                    <Link
                      href={searchUrlFromFilters(filters, { ...searchOpts, page: paginated.page + 1 })}
                      className="btn btn-ghost text-sm"
                    >
                      Next →
                    </Link>
                  ) : (
                    <span className="btn btn-ghost text-sm opacity-40 pointer-events-none">
                      Next →
                    </span>
                  )}
                </div>
                <p className="text-sm text-[var(--muted)]">
                  Showing {(paginated.page - 1) * paginated.pageSize + 1}–
                  {Math.min(paginated.page * paginated.pageSize, paginated.total)} of{" "}
                  {paginated.total.toLocaleString()}
                </p>
              </nav>
            ) : null}
          </section>

          <section id="search-documents" className="mt-10 scroll-mt-24">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="display text-3xl">Documents ({paginatedDocs.total.toLocaleString()})</h2>
              {paginatedDocs.totalPages > 1 ? (
                <p className="text-sm text-[var(--muted)]">
                  Page {paginatedDocs.page} of {paginatedDocs.totalPages}
                </p>
              ) : null}
            </div>
            <ul className="mt-4 grid gap-3">
              {documents.map((d) => (
                <li key={d.id} className="card p-5">
                  <p className="text-xs font-semibold text-[var(--accent)] uppercase tracking-[0.12em]">
                    {DOCUMENT_TYPE_LABELS[d.type]}
                  </p>
                  <h3 className="display mt-1 text-xl">{d.title}</h3>
                  <p className="mt-2 text-sm text-[var(--ink-soft)]">{d.summary}</p>
                  <Link
                    href={`/cases/${d.caseSlug}?tab=documents`}
                    className="mt-3 inline-block text-sm font-medium text-[var(--accent)] hover:underline"
                  >
                    View in case
                  </Link>
                </li>
              ))}
              {!documents.length ? (
                <li className="text-[var(--muted)]">No documents match these filters.</li>
              ) : null}
            </ul>
            {paginatedDocs.totalPages > 1 ? (
              <nav
                className="archive-pagination mt-8 flex flex-wrap items-center justify-between gap-4"
                aria-label="Document result pages"
              >
                <div className="flex flex-wrap gap-2">
                  {paginatedDocs.page > 1 ? (
                    <Link
                      href={searchUrlFromFilters(filters, {
                        ...searchOpts,
                        docPage: paginatedDocs.page - 1,
                      })}
                      className="btn btn-ghost text-sm"
                    >
                      ← Previous
                    </Link>
                  ) : (
                    <span className="btn btn-ghost text-sm opacity-40 pointer-events-none">
                      ← Previous
                    </span>
                  )}
                  {paginatedDocs.page < paginatedDocs.totalPages ? (
                    <Link
                      href={searchUrlFromFilters(filters, {
                        ...searchOpts,
                        docPage: paginatedDocs.page + 1,
                      })}
                      className="btn btn-ghost text-sm"
                    >
                      Next →
                    </Link>
                  ) : (
                    <span className="btn btn-ghost text-sm opacity-40 pointer-events-none">
                      Next →
                    </span>
                  )}
                </div>
                <p className="text-sm text-[var(--muted)]">
                  Showing {(paginatedDocs.page - 1) * paginatedDocs.pageSize + 1}–
                  {Math.min(paginatedDocs.page * paginatedDocs.pageSize, paginatedDocs.total)} of{" "}
                  {paginatedDocs.total.toLocaleString()}
                </p>
              </nav>
            ) : null}
          </section>
        </>
      )}
    </div>
  );
}
