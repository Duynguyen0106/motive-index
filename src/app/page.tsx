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
      <section className="border-b border-[var(--line)] bg-white py-10 md:py-12">
        <div className="site-shell">
          <p className="text-xs font-semibold tracking-[0.18em] text-[var(--accent)] uppercase">
            Forensic psychological research archive
          </p>
          <h1 className="display mt-3 text-[clamp(2.5rem,6vw,4rem)] text-[var(--ink)]">
            Motive Index
          </h1>
          <p className="body-copy mt-4 max-w-2xl text-lg text-[var(--ink-soft)]">
            Browse all case dossiers below. Search by keyword and filter by crime
            type. Each card opens the full record and linked documents.
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-sm">
            <Link href="/admin/cases/new" className="font-medium text-[var(--accent)] hover:underline">
              Admin: create case
            </Link>
            <Link href="/admin/upload" className="font-medium text-[var(--accent)] hover:underline">
              Admin: upload document
            </Link>
            <Link href="/search" className="font-medium text-[var(--ink-soft)] hover:text-[var(--accent)]">
              Advanced filters
            </Link>
          </div>
        </div>
      </section>

      <LiveTicker updates={updates} />

      {cotw ? (
        <section className="site-shell pt-8">
          <div className="card border-l-4 border-l-[var(--accent)] p-5 md:flex md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] text-[var(--accent)] uppercase">
                Case of the week
              </p>
              <h2 className="display mt-1 text-2xl">{cotw.name}</h2>
              <p className="text-sm text-[var(--ink-soft)]">{cotw.subtitle}</p>
            </div>
            <Link
              href={`/cases/${cotw.id}`}
              className="mt-3 text-sm font-semibold text-[var(--accent)] hover:underline md:mt-0"
            >
              Open record →
            </Link>
          </div>
        </section>
      ) : null}

      <section className="site-shell py-10">
        <h2 className="display mb-4 text-3xl">All cases</h2>
        <CasesGrid cases={cases} />
      </section>

      <section className="site-shell pb-16">
        <Disclaimer />
      </section>
    </>
  );
}
