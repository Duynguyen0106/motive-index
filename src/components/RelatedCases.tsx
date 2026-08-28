import Link from "next/link";
import { COUNTRY_LABELS, resolveCaseCountry } from "@/lib/country";
import { findRelatedCasesWithReasons } from "@/lib/relatedCases";
import { searchUrlFromFilters } from "@/lib/search";
import type { CrimeCase } from "@/lib/types";
import { CRIME_CATEGORY_LABELS } from "@/lib/types";
import { CaseStatusBadge } from "@/components/ui";

function similarSearchUrl(crimeCase: CrimeCase): string {
  return searchUrlFromFilters({
    country: resolveCaseCountry(crimeCase),
    crimeCategory: crimeCase.crimeCategories[0] ?? "",
    psychologicalFactor: crimeCase.psychologicalFactors[0] ?? "",
    theoreticalFramework: crimeCase.theoreticalFrameworks[0] ?? "",
    status: crimeCase.status === "unsolved" ? "unsolved" : "",
  });
}

export function RelatedCases({
  crimeCase,
  allCases,
  compact,
}: {
  crimeCase: CrimeCase;
  allCases: CrimeCase[];
  compact?: boolean;
}) {
  const related = findRelatedCasesWithReasons(crimeCase, allCases, compact ? 4 : 6);
  if (!related.length) return null;

  return (
    <section className={compact ? "" : "mt-10"}>
      {!compact ? (
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="display text-2xl text-[var(--ink)]">Related dossiers</h2>
          <Link href={similarSearchUrl(crimeCase)} className="text-sm text-[var(--accent)] hover:underline">
            View all similar →
          </Link>
        </div>
      ) : (
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-xs font-semibold tracking-[0.14em] text-[var(--muted)] uppercase">
            Related dossiers
          </h3>
          <Link href={similarSearchUrl(crimeCase)} className="text-xs text-[var(--accent)] hover:underline">
            All similar
          </Link>
        </div>
      )}
      <ul className={`grid gap-3 ${compact ? "mt-3" : "mt-4 md:grid-cols-2"}`}>
        {related.map(({ case: c, reasons }) => (
          <li key={c.slug}>
            <Link href={`/cases/${c.slug}`} className="related-case-card card card-hover block p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-[var(--muted)]">
                  {COUNTRY_LABELS[resolveCaseCountry(c)]} · {c.yearStart}
                </span>
                {c.status === "unsolved" ? <CaseStatusBadge status={c.status} /> : null}
              </div>
              <p className="mt-1 font-medium text-[var(--ink)]">{c.name}</p>
              <p className="mt-1 text-sm text-[var(--ink-soft)] line-clamp-2">{c.subtitle}</p>
              {reasons.length ? (
                <p className="mt-2 flex flex-wrap gap-1.5">
                  {reasons.map((reason) => (
                    <span key={reason} className="related-case-reason">
                      {reason}
                    </span>
                  ))}
                </p>
              ) : (
                <p className="mt-2 text-xs text-[var(--muted)]">
                  {c.crimeCategories.slice(0, 2).map((x) => CRIME_CATEGORY_LABELS[x]).join(" · ")}
                </p>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
