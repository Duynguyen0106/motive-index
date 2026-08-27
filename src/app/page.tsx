import Link from "next/link";
import { Disclaimer } from "@/components/Disclaimer";
import { LiveTicker } from "@/components/LiveTicker";
import { getFeaturedCases, getUpdates } from "@/lib/data";

export default function HomePage() {
  const featured = getFeaturedCases().slice(0, 4);
  const updates = getUpdates(4);

  return (
    <>
      <section className="relative overflow-hidden border-b border-[var(--line)] pb-16 pt-10 md:pb-24 md:pt-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_78%_42%,rgba(31,92,77,0.22),transparent_42%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_12%_0%,rgba(158,176,192,0.35),transparent_40%)]" />
          <svg
            className="absolute top-8 right-[-4%] hidden h-[120%] w-[58%] opacity-[0.55] md:block"
            viewBox="0 0 640 640"
            fill="none"
          >
            <circle cx="320" cy="320" r="260" stroke="rgba(18,23,28,0.14)" strokeWidth="1" />
            <circle cx="320" cy="320" r="190" stroke="rgba(18,23,28,0.12)" strokeWidth="1" />
            <circle cx="320" cy="320" r="120" stroke="rgba(31,92,77,0.35)" strokeWidth="1.5" />
            <path
              d="M320 60 L320 580 M60 320 L580 320 M120 120 L520 520 M520 120 L120 520"
              stroke="rgba(18,23,28,0.08)"
              strokeWidth="1"
            />
            <path
              className="draw-line"
              d="M320 150 L455 250 L420 400 L250 430 L180 280 Z"
              stroke="rgba(31,92,77,0.75)"
              strokeWidth="2"
              fill="rgba(31,92,77,0.12)"
            />
            <circle cx="320" cy="150" r="5" fill="#1f5c4d" />
            <circle cx="455" cy="250" r="5" fill="#1f5c4d" />
            <circle cx="420" cy="400" r="5" fill="#1f5c4d" />
            <circle cx="250" cy="430" r="5" fill="#1f5c4d" />
            <circle cx="180" cy="280" r="5" fill="#1f5c4d" />
          </svg>
        </div>

        <div className="site-shell relative">
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
