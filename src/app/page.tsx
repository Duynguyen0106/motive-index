import Link from "next/link";
import { Disclaimer } from "@/components/Disclaimer";
import { LiveTicker } from "@/components/LiveTicker";
import { getFeaturedCases, getUpdates } from "@/lib/data";

export default function HomePage() {
  const featured = getFeaturedCases().slice(0, 4);
  const updates = getUpdates(4);

  return (
    <>
      <section className="border-b border-[var(--line)] bg-white pb-14 pt-12 md:pb-20 md:pt-16">
        <div className="site-shell relative">
          <div className="grid items-center gap-10 md:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="fade-up text-xs font-semibold tracking-[0.18em] text-[var(--accent)] uppercase">
                Forensic psychological archive
              </p>
              <h1 className="fade-up display mt-4 max-w-3xl text-[clamp(2.75rem,7vw,4.75rem)] text-[var(--ink)]">
                Motive Index
              </h1>
              <p className="fade-up-delay body-copy mt-5 max-w-xl text-lg text-[var(--ink-soft)] md:text-xl">
                Famous cases, live updates, and structured analysis of the
                psychology behind criminal behavior—evidence-bound, never
                sensational.
              </p>
              <div className="fade-up-delay-2 mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/cases"
                  className="rounded bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  Enter the archive
                </Link>
                <Link
                  href="/method"
                  className="rounded border border-[var(--line)] bg-white px-5 py-2.5 text-sm font-semibold text-[var(--ink)] shadow-[var(--shadow)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                  How analysis works
                </Link>
              </div>
            </div>

            <div
              aria-hidden
              className="card fade-up-delay mx-auto flex aspect-square max-w-[340px] items-center justify-center p-6 md:max-w-none"
            >
              <svg viewBox="0 0 640 640" fill="none" className="h-full w-full">
                <circle cx="320" cy="320" r="260" stroke="#e2e6ea" strokeWidth="1.5" />
                <circle cx="320" cy="320" r="190" stroke="#e2e6ea" strokeWidth="1.5" />
                <circle cx="320" cy="320" r="120" stroke="#1e3a5f" strokeWidth="1.5" strokeOpacity="0.35" />
                <path
                  d="M320 60 L320 580 M60 320 L580 320 M120 120 L520 520 M520 120 L120 520"
                  stroke="#e2e6ea"
                  strokeWidth="1"
                />
                <path
                  className="draw-line"
                  d="M320 150 L455 250 L420 400 L250 430 L180 280 Z"
                  stroke="#1e3a5f"
                  strokeWidth="2"
                  fill="rgba(30, 58, 95, 0.08)"
                />
                <circle cx="320" cy="150" r="4.5" fill="#1e3a5f" />
                <circle cx="455" cy="250" r="4.5" fill="#1e3a5f" />
                <circle cx="420" cy="400" r="4.5" fill="#1e3a5f" />
                <circle cx="250" cy="430" r="4.5" fill="#1e3a5f" />
                <circle cx="180" cy="280" r="4.5" fill="#1e3a5f" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      <LiveTicker updates={updates} />

      <section className="site-shell py-14 md:py-16">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="display text-3xl text-[var(--ink)] md:text-4xl">
            Featured dossiers
          </h2>
          <Link
            href="/cases"
            className="text-sm font-medium text-[var(--accent)] hover:underline"
          >
            All cases
          </Link>
        </div>
        <ul className="grid gap-4 md:grid-cols-2">
          {featured.map((c) => (
            <li key={c.id}>
              <Link
                href={`/cases/${c.slug}`}
                className="card card-hover group block h-full p-5 md:p-6"
              >
                <p className="text-xs font-medium tracking-[0.14em] text-[var(--muted)] uppercase">
                  {c.jurisdiction}
                </p>
                <h3 className="display mt-2 text-2xl text-[var(--ink)] transition-colors group-hover:text-[var(--accent)] md:text-3xl">
                  {c.name}
                </h3>
                <p className="body-copy mt-3 text-[var(--ink-soft)]">{c.subtitle}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="site-shell pb-16">
        <Disclaimer />
      </section>
    </>
  );
}
