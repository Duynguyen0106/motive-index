import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CasesGrid } from "@/components/CasesGrid";
import { Disclaimer } from "@/components/Disclaimer";
import { LiveTicker } from "@/components/LiveTicker";
import { PageHeader } from "@/components/PageHeader";
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
        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <Link href="/search" className="text-[var(--ink-soft)] hover:text-[var(--ink)]">
            Advanced search
          </Link>
          <Link href="/live" className="text-[var(--ink-soft)] hover:text-[var(--ink)]">
            World news
          </Link>
          <Link href="/method" className="text-[var(--ink-soft)] hover:text-[var(--ink)]">
            How we analyze
          </Link>
        </div>
      </div>

      <LiveTicker updates={updates} />

      {cotw ? (
        <section className="site-shell pt-6">
          <div className="border-y border-[var(--line-strong)] py-6 md:flex md:items-end md:justify-between md:gap-8">
            <div>
              <p className="label">Featured dossier</p>
              <h2 className="display mt-2 text-3xl text-[var(--ink)]">{cotw.name}</h2>
              <p className="mt-2 text-[var(--ink-soft)]">{cotw.subtitle}</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 md:mt-0">
              <Link href={`/cases/${cotw.slug}`} className="btn btn-primary">
                Read dossier
              </Link>
              <Link href={`/?case=${cotw.slug}`} className="btn btn-ghost">
                Plot on map
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      <section className="site-shell py-10 md:py-12">
        <div className="mb-6 flex flex-col gap-1 border-b border-[var(--line)] pb-4 md:flex-row md:items-baseline md:justify-between">
          <h2 className="display text-2xl text-[var(--ink)]">Case index</h2>
          <p className="text-sm text-[var(--muted)]">{cases.length} records in catalog</p>
        </div>
        <Suspense fallback={<p className="text-[var(--muted)]">Loading index…</p>}>
          <CasesGrid cases={cases} />
        </Suspense>
      </section>

      <section className="site-shell pb-16">
        <Disclaimer />
      </section>
    </>
  );
}
