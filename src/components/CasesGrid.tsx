"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { CaseStatusBadge, EmptyState } from "@/components/ui";
import { CaseImagePanel } from "@/components/CaseImagePanel";
import { getPrimaryCaseImage } from "@/lib/caseImages";
import { COUNTRY_LABELS, listCountryOptions, resolveCaseCountry } from "@/lib/country";
import { monitorUrlFromFilters } from "@/lib/search";
import type { CrimeCase, CrimeCategory, CountryCode } from "@/lib/types";
import { CRIME_CATEGORY_LABELS } from "@/lib/types";

export function CasesGrid({ cases }: { cases: CrimeCase[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [q, setQ] = useState(() => searchParams.get("q") ?? "");
  const [crimeType, setCrimeType] = useState<CrimeCategory | "">(
    () => (searchParams.get("crimeCategory") as CrimeCategory | "") ?? "",
  );
  const [country, setCountry] = useState<CountryCode | "">(
    () => (searchParams.get("country") as CountryCode | "") ?? "",
  );

  const countryOptions = useMemo(() => listCountryOptions(cases), [cases]);
  const hasFilters = Boolean(country || crimeType || q.trim());

  useEffect(() => {
    setQ(searchParams.get("q") ?? "");
    setCrimeType((searchParams.get("crimeCategory") as CrimeCategory | "") ?? "");
    setCountry((searchParams.get("country") as CountryCode | "") ?? "");
  }, [searchParams]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const p = new URLSearchParams();
      if (q.trim()) p.set("q", q.trim());
      if (country) p.set("country", country);
      if (crimeType) p.set("crimeCategory", crimeType);
      const qs = p.toString();
      const next = qs ? `/archive?${qs}` : "/archive";
      const current = `${window.location.pathname}${window.location.search}`;
      if (current !== next) {
        router.replace(next, { scroll: false });
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [q, country, crimeType, router]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return cases.filter((c) => {
      if (crimeType && !c.crimeCategories.includes(crimeType)) return false;
      if (country && resolveCaseCountry(c) !== country) return false;
      if (!query) return true;
      const hay = [
        c.name,
        c.subtitle,
        c.overview,
        c.location,
        COUNTRY_LABELS[resolveCaseCountry(c)],
        ...(c.aliases ?? []),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(query);
    });
  }, [cases, q, crimeType, country]);

  function clearFilters() {
    setQ("");
    setCrimeType("");
    setCountry("");
  }

  return (
    <div>
      <form
        className="filter-toolbar mb-4 grid gap-4 p-4 md:grid-cols-[1fr_180px_180px_auto] md:items-end"
        onSubmit={(e) => e.preventDefault()}
      >
        <label className="block text-sm">
          <span className="label mb-1 block normal-case tracking-normal">Keyword</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Name, place, motif…"
            className="field mt-1"
          />
        </label>
        <label className="block text-sm">
          <span className="label mb-1 block normal-case tracking-normal">Country</span>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value as CountryCode | "")}
            className="field mt-1"
          >
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
          <select
            value={crimeType}
            onChange={(e) => setCrimeType(e.target.value as CrimeCategory | "")}
            className="field mt-1"
          >
            <option value="">All types</option>
            {(Object.keys(CRIME_CATEGORY_LABELS) as CrimeCategory[]).map((k) => (
              <option key={k} value={k}>
                {CRIME_CATEGORY_LABELS[k]}
              </option>
            ))}
          </select>
        </label>
        <button type="button" onClick={clearFilters} className="btn btn-ghost self-end">
          Clear
        </button>
      </form>

      {hasFilters ? (
        <div className="active-filters mb-4 flex flex-wrap items-center gap-2">
          {q.trim() ? <span className="filter-chip">Keyword: {q.trim()}</span> : null}
          {country ? <span className="filter-chip">{COUNTRY_LABELS[country]}</span> : null}
          {crimeType ? (
            <span className="filter-chip">{CRIME_CATEGORY_LABELS[crimeType]}</span>
          ) : null}
          <Link
            href={monitorUrlFromFilters({ country, crimeCategory: crimeType, q: q.trim() })}
            className="filter-chip filter-chip-link"
          >
            View on map →
          </Link>
        </div>
      ) : null}

      <p className="mb-3 text-sm text-[var(--muted)]">
        {filtered.length} of {cases.length} shown
      </p>

      <div className="index-table index-table-with-photos">
        <div className="index-head">
          <span className="index-head-photo" aria-hidden />
          <span>Year</span>
          <span>Case</span>
          <span className="text-right">Classification</span>
        </div>
        {filtered.map((c) => {
          const thumb = getPrimaryCaseImage(c.slug);
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
                {COUNTRY_LABELS[resolveCaseCountry(c)]}
              </span>
            </span>
            <span className="index-meta">
              {c.crimeCategories.slice(0, 2).map((x) => CRIME_CATEGORY_LABELS[x]).join(" · ")}
            </span>
          </Link>
          );
        })}
      </div>

      {!filtered.length ? (
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
    </div>
  );
}
