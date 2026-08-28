import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { EmptyState, QuickLinks } from "@/components/ui";
import {
  CRIME_CATEGORY_LABELS,
  DOCUMENT_TYPE_LABELS,
  FACTOR_LABELS,
  FRAMEWORK_LABELS,
} from "@/lib/types";
import type { CrimeCategory, CountryCode, DocumentType, PsychologicalFactor, TheoreticalFramework } from "@/lib/types";
import { COUNTRY_LABELS, listCountryOptions, resolveCaseCountry } from "@/lib/country";
import { getAllCases } from "@/lib/data";
import { parseSearchParams, hasActiveFilters, monitorUrlFromFilters } from "@/lib/search";
import { runSearch } from "@/lib/searchServer";

export const metadata: Metadata = {
  title: "Search",
  description: "Advanced search across cases, psychological factors, and documents.",
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function SearchPage({ searchParams }: Props) {
  const raw = await searchParams;
  const filters = parseSearchParams(raw);
  const { cases, documents } = runSearch(filters);
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
    <div className="site-shell py-12 md:py-14">
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
        className="filter-toolbar card mt-8 grid gap-4 p-5 md:grid-cols-2 md:p-6 lg:grid-cols-3"
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

        <div className="flex items-end gap-3 md:col-span-2 lg:col-span-3">
          <button type="submit" className="btn btn-primary">
            Apply filters
          </button>
          <Link href="/search" className="btn btn-ghost">
            Reset
          </Link>
        </div>
      </form>

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
            {cases.length} cases · {documents.length} documents ·{" "}
            <Link href={monitorHref} className="text-[var(--accent)] hover:underline">
              View on map
            </Link>
          </p>

          <section className="mt-8">
            <h2 className="display text-3xl">Cases ({cases.length})</h2>
            <ul className="mt-4 grid gap-3">
              {cases.map((c) => (
                <li key={c.id}>
                  <div className="card card-hover p-5">
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
                </li>
              ))}
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
          </section>

          <section className="mt-10">
            <h2 className="display text-3xl">Documents ({documents.length})</h2>
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
          </section>
        </>
      )}
    </div>
  );
}
