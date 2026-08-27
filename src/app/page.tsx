import Link from "next/link";
import { Disclaimer } from "@/components/Disclaimer";
import { LiveTicker } from "@/components/LiveTicker";
import { getFeaturedCases, getUpdates } from "@/lib/data";

export default function HomePage() {
  const featured = getFeaturedCases().slice(0, 4);
  const updates = getUpdates(4);

  return (
    <>
      <section className="site-shell relative overflow-hidden pb-16 pt-10 md:pb-24 md:pt-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-[-8%] hidden w-[55%] md:block"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(31,92,77,0.28),transparent_68%)]" />
          <div className="absolute inset-[12%] border border-[var(--line)] opacity-70" />
          <div className="absolute inset-[22%] border border-[var(--accent)]/25" />
          <div className="draw-line absolute top-1/2 left-[8%] h-px w-[84%] bg-[var(--ink)]/20" />
        </div>

        <p className="fade-up text-xs font-semibold tracking-[0.22em] text-[var(--accent)] uppercase">
          Forensic psychological archive
        </p>
        <h1 className="fade-up display mt-5 max-w-4xl text-[clamp(3.4rem,11vw,7.5rem)] text-[var(--ink)]">
          Motive Index
        </h1>
        <p className="fade-up-delay serif mt-6 max-w-xl text-xl leading-relaxed text-[var(--ink-soft)] md:text-2xl">
          Famous cases, live updates, and structured analysis of the psychology
          behind criminal behavior—evidence-bound, never sensational.
        </p>
        <div className="fade-up-delay-2 mt-10 flex flex-wrap items-center gap-4">
          <Link
            href="/cases"
            className="bg-[var(--ink)] px-6 py-3 text-sm font-semibold tracking-wide text-[var(--bg)] transition-opacity hover:opacity-90"
          >
            Enter the archive
          </Link>
          <Link
            href="/method"
            className="border border-[var(--ink)]/20 px-6 py-3 text-sm font-semibold tracking-wide text-[var(--ink)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            How analysis works
          </Link>
        </div>
      </section>

      <LiveTicker updates={updates} />

      <section className="site-shell py-16 md:py-20">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 className="display text-4xl md:text-5xl">Featured dossiers</h2>
          <Link href="/cases" className="text-sm text-[var(--accent)] hover:underline">
            All cases
          </Link>
        </div>
        <ul className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
          {featured.map((c) => (
            <li key={c.id}>
              <Link
                href={`/cases/${c.slug}`}
                className="group grid gap-3 py-7 md:grid-cols-[1fr_1.4fr] md:gap-12"
              >
                <div>
                  <p className="text-xs tracking-[0.16em] text-[var(--muted)] uppercase">
                    {c.jurisdiction}
                  </p>
                  <h3 className="display mt-2 text-3xl transition-colors group-hover:text-[var(--accent)] md:text-4xl">
                    {c.name}
                  </h3>
                </div>
                <p className="serif text-lg text-[var(--ink-soft)] md:pt-5">
                  {c.subtitle}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="site-shell pb-20">
        <Disclaimer />
      </section>
    </>
  );
}
