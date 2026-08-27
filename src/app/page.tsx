import Link from "next/link";
import { CasesGrid } from "@/components/CasesGrid";
import { Disclaimer } from "@/components/Disclaimer";
import { LiveTicker } from "@/components/LiveTicker";
import { getAllCases, getCaseOfWeek, getUpdates } from "@/lib/data";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const cases = getAllCases();
  const updates = getUpdates(4);
  const cotw = getCaseOfWeek();

  return (
    <>
      <section className="bg-[var(--paper)] py-12 md:py-16">
        <div className="site-shell">
          <div className="max-w-3xl">
            <p className="label">Vol. I · Working archive</p>
            <h1 className="display mt-3 text-[clamp(2.75rem,7vw,4.5rem)] leading-[1.05] text-[var(--ink)]">
              Behavioral dossiers from the public record
            </h1>
            <p className="lede mt-5 text-[1.2rem]">
              Structured case files, document pointers, and forensic-psychological
              commentary—with citations, confidence notes, and explicit unknowns.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <Link href="/search" className="text-link font-medium">
              Search &amp; filter
            </Link>
            <Link href="/method" className="text-[var(--ink-soft)] hover:text-[var(--ink)]">
              How we analyze
            </Link>
            <Link href="/admin/cases/new" className="text-[var(--muted)] hover:text-[var(--ink)]">
              Admin: new case
            </Link>
          </div>
        </div>
      </section>

      <LiveTicker updates={updates} />

      {cotw ? (
        <section className="site-shell pt-10">
          <div className="border-y border-[var(--line-strong)] py-6 md:flex md:items-end md:justify-between md:gap-8">
            <div>
              <p className="label">Featured dossier</p>
              <h2 className="display mt-2 text-3xl text-[var(--ink)]">{cotw.name}</h2>
              <p className="mt-2 text-[var(--ink-soft)]">{cotw.subtitle}</p>
            </div>
            <Link href={`/cases/${cotw.id}`} className="btn btn-primary mt-4 md:mt-0">
              Read dossier
            </Link>
          </div>
        </section>
      ) : null}

      <section className="site-shell py-10 md:py-12">
        <div className="mb-6 flex flex-col gap-1 border-b border-[var(--line)] pb-4 md:flex-row md:items-baseline md:justify-between">
          <h2 className="display text-2xl text-[var(--ink)]">Case index</h2>
          <p className="text-sm text-[var(--muted)]">{cases.length} records in catalog</p>
        </div>
        <CasesGrid cases={cases} />
      </section>

      <section className="site-shell pb-16">
        <Disclaimer />
      </section>
    </>
  );
}
