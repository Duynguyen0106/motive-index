import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Disclaimer } from "@/components/Disclaimer";
import { PsychMap } from "@/components/PsychMap";
import { Timeline } from "@/components/Timeline";
import { getAllCases, getCaseBySlug } from "@/lib/data";
import { DIMENSION_LABELS } from "@/lib/types";
import { formatDate } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return getAllCases().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = getCaseBySlug(slug);
  if (!c) return { title: "Case not found" };
  return {
    title: c.name,
    description: c.subtitle,
  };
}

export default async function CasePage({ params }: Props) {
  const { slug } = await params;
  const crimeCase = getCaseBySlug(slug);
  if (!crimeCase) notFound();

  const { analysis } = crimeCase;

  return (
    <article className="pb-20">
      <header className="site-shell py-12 md:py-16">
        <Link
          href="/cases"
          className="text-sm text-[var(--muted)] transition-colors hover:text-[var(--accent)]"
        >
          ← Archive
        </Link>
        <p className="mt-6 text-xs font-semibold tracking-[0.18em] text-[var(--accent)] uppercase">
          {crimeCase.era} · {crimeCase.jurisdiction} · {crimeCase.status}
        </p>
        <h1 className="display mt-4 max-w-4xl text-[clamp(2.8rem,8vw,5.5rem)]">
          {crimeCase.name}
        </h1>
        <p className="serif mt-5 max-w-2xl text-xl text-[var(--ink-soft)] md:text-2xl">
          {crimeCase.subtitle}
        </p>
        <p className="mt-6 max-w-3xl text-sm text-[var(--warning)]">
          {crimeCase.warning}
        </p>
        <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[var(--muted)]">
          <span>Analysis: {analysis.status}</span>
          <span>Model: {analysis.modelVersion}</span>
          <span>
            Review: {analysis.reviewedByHuman ? "human-reviewed" : "awaiting review"}
          </span>
          <span>Updated {formatDate(analysis.updatedAt)}</span>
        </div>
      </header>

      <section className="site-shell grid gap-10 border-t border-[var(--line)] py-12 md:grid-cols-[1.2fr_0.8fr] md:gap-16">
        <div>
          <h2 className="display text-3xl">Overview</h2>
          <p className="serif mt-4 text-lg leading-relaxed text-[var(--ink-soft)]">
            {crimeCase.overview}
          </p>
          <h2 className="display mt-12 text-3xl">Analysis summary</h2>
          <p className="serif mt-4 text-lg leading-relaxed text-[var(--ink-soft)]">
            {analysis.summary}
          </p>
        </div>
        <aside className="space-y-6">
          <div>
            <p className="text-xs tracking-[0.14em] text-[var(--muted)] uppercase">
              Tags
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {crimeCase.tags.map((t) => (
                <li
                  key={t}
                  className="border border-[var(--line)] px-3 py-1 text-sm text-[var(--ink-soft)]"
                >
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs tracking-[0.14em] text-[var(--muted)] uppercase">
              Signal dimensions present
            </p>
            <ul className="mt-3 space-y-1 text-sm text-[var(--ink-soft)]">
              {[...new Set(crimeCase.signals.map((s) => s.dimension))].map((d) => (
                <li key={d}>{DIMENSION_LABELS[d]}</li>
              ))}
              {!crimeCase.signals.length ? <li>None extracted yet</li> : null}
            </ul>
          </div>
        </aside>
      </section>

      <section className="site-shell border-t border-[var(--line)] py-12">
        <h2 className="display text-3xl md:text-4xl">Behavioral timeline</h2>
        <div className="mt-8">
          <Timeline events={crimeCase.timeline} />
        </div>
      </section>

      <section className="site-shell border-t border-[var(--line)] py-12">
        <h2 className="display text-3xl md:text-4xl">Psychological map</h2>
        <p className="serif mt-3 max-w-2xl text-[var(--ink-soft)]">
          Constructs are hypotheses grounded in public behavior—not diagnoses.
        </p>
        <div className="mt-10">
          <PsychMap constructs={analysis.constructs} />
        </div>
      </section>

      <section className="site-shell grid gap-10 border-t border-[var(--line)] py-12 md:grid-cols-2">
        <div>
          <h2 className="display text-3xl">Alternative explanations</h2>
          <ul className="mt-5 space-y-3">
            {analysis.alternativeExplanations.map((a) => (
              <li key={a} className="serif text-[var(--ink-soft)]">
                {a}
              </li>
            ))}
            {!analysis.alternativeExplanations.length ? (
              <li className="text-[var(--muted)]">Pending</li>
            ) : null}
          </ul>
        </div>
        <div>
          <h2 className="display text-3xl">What we cannot know</h2>
          <ul className="mt-5 space-y-3">
            {analysis.whatWeCannotKnow.map((a) => (
              <li key={a} className="serif text-[var(--muted)]">
                {a}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="site-shell border-t border-[var(--line)] py-12">
        <h2 className="display text-3xl">Sources</h2>
        <ul className="mt-6 space-y-3">
          {crimeCase.sources.map((s) => (
            <li key={s.title} className="flex flex-col gap-1 md:flex-row md:gap-4">
              <span className="w-24 shrink-0 text-xs tracking-[0.14em] text-[var(--muted)] uppercase">
                {s.kind}
              </span>
              {s.url ? (
                <a
                  href={s.url}
                  className="text-[var(--ink)] underline-offset-4 hover:text-[var(--accent)] hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  {s.title}
                </a>
              ) : (
                <span>{s.title}</span>
              )}
            </li>
          ))}
        </ul>
        <div className="mt-10">
          <Disclaimer compact />
        </div>
      </section>
    </article>
  );
}
