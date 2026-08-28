import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CasesGrid } from "@/components/CasesGrid";
import { Disclaimer } from "@/components/Disclaimer";
import { LiveTicker } from "@/components/LiveTicker";
import { PageHeader } from "@/components/PageHeader";
import { QuickLinks, StatBar } from "@/components/ui";
import { resolveCaseCountry } from "@/lib/country";
import { getAllCases, getCaseOfWeek, getUpdates } from "@/lib/data";

export const metadata: Metadata = {
  title: "Case archive",
  description:
    "Browse structured forensic psychology dossiers—filter by country, crime type, and keyword.",
};

export const dynamic = "force-dynamic";

export default function ArchivePage() {
  const cases = getAllCases();
  const updates = getUpdates(4);
  const cotw = getCaseOfWeek();
  const unsolved = cases.filter((c) => c.status === "unsolved").length;
  const countries = new Set(cases.map((c) => resolveCaseCountry(c))).size;

  return (
    <>
      <div className="site-shell py-10 md:py-12">
        <Breadcrumbs
          items={[{ label: "Monitor", href: "/" }, { label: "Case archive" }]}
        />
        <PageHeader
          label="Case archive"
          title="Behavioral dossiers"
          description="Structured case files, document pointers, and forensic-psychological commentary—with citations, confidence notes, and explicit unknowns."
        />
        <QuickLinks
          links={[
            { href: "/", label: "World monitor" },
            { href: "/search", label: "Advanced search" },
            { href: "/live", label: "World news" },
            { href: "/search?status=unsolved", label: "Unsolved" },
          ]}
        />
        <StatBar
          items={[
            { label: "Total dossiers", value: cases.length },
            { label: "Countries", value: countries },
            { label: "Unsolved", value: unsolved, highlight: true },
          ]}
        />
      </div>

      <LiveTicker updates={updates} />

      {cotw ? (
        <section className="site-shell pt-6">
          <article className="featured-card">
            <div className="featured-card-accent" />
            <div className="featured-card-body md:flex md:items-end md:justify-between md:gap-8">
              <div>
                <p className="label">Featured dossier</p>
                <h2 className="display mt-2 text-3xl text-[var(--ink)]">{cotw.name}</h2>
                <p className="mt-2 max-w-2xl text-[var(--ink-soft)]">{cotw.subtitle}</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 md:mt-0 md:shrink-0">
                <Link href={`/cases/${cotw.slug}`} className="btn btn-primary">
                  Read dossier
                </Link>
                <Link href={`/?case=${cotw.slug}`} className="btn btn-ghost">
                  Plot on map
                </Link>
              </div>
            </div>
          </article>
        </section>
      ) : null}

      <section className="site-shell py-10 md:py-12">
        <div className="mb-6 flex flex-col gap-1 border-b border-[var(--line)] pb-4 md:flex-row md:items-baseline md:justify-between">
          <h2 className="display text-2xl text-[var(--ink)]">Case index</h2>
          <p className="text-sm text-[var(--muted)]">Filter by keyword, country, or crime type</p>
        </div>
        <Suspense fallback={<div className="skeleton-block h-48" aria-hidden />}>
          <CasesGrid cases={cases} />
        </Suspense>
      </section>

      <section className="site-shell pb-16">
        <Disclaimer />
      </section>
    </>
  );
}
