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
    <article className="pb-16">
      <header className="site-shell py-10 md:py-14">
        <Link
          href="/cases"
          className="text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--accent)]"
        >
          ← Archive
        </Link>
        <p className="mt-5 text-xs font-semibold tracking-[0.16em] text-[var(--accent)] uppercase">
          {crimeCase.era} · {crimeCase.jurisdiction} · {crimeCase.status}
        </p>
        <h1 className="display mt-3 max-w-4xl text-[clamp(2.4rem,6vw,4rem)] text-[var(--ink)]">
          {crimeCase.name}
        </h1>
        <p className="body-copy mt-4 max-w-2xl text-lg text-[var(--ink-soft)] md:text-xl">
          {crimeCase.subtitle}
        </p>
        <p className="mt-5 max-w-3xl text-sm text-[var(--maroon)]">
          {crimeCase.warning}
        </p>
        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[var(--muted)]">
          <span>Analysis: {analysis.status}</span>
          <span>Model: {analysis.modelVersion}</span>
          <span>
            Review:{" "}
            {analysis.reviewedByHuman ? "human-reviewed" : "awaiting review"}
          </span>
          <span>Updated {formatDate(analysis.updatedAt)}</span>
        </div>
      </header>

      <section className="site-shell grid gap-6 pb-10 md:grid-cols-[1.25fr_0.75fr]">
        <div className="card space-y-8 p-6 md:p-8">
          <div>
            <h2 className="display text-2xl text-[var(--ink)]">Overview</h2>
            <p className="body-copy mt-3 text-[var(--ink-soft)] md:text-lg">
              {crimeCase.overview}
            </p>
          </div>
          <div className="border-t border-[var(--line)] pt-8">
            <h2 className="display text-2xl text-[var(--ink)]">
              Analysis summary
            </h2>
            <p className="body-copy mt-3 text-[var(--ink-soft)] md:text-lg">
              {analysis.summary}
            </p>
          </div>
        </div>
        <aside className="card h-fit space-y-6 p-6">
          <div>
            <p className="text-xs font-medium tracking-[0.14em] text-[var(--muted)] uppercase">
              Tags
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {crimeCase.tags.map((t) => (
                <li
                  key={t}
                  className="rounded border border-[var(--line)] bg-[var(--bg-subtle)] px-3 py-1 text-sm text-[var(--ink-soft)]"
                >
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium tracking-[0.14em] text-[var(--muted)] uppercase">
              Signal dimensions present
            </p>
            <ul className="mt-3 space-y-1 text-sm text-[var(--ink-soft)]">
              {[...new Set(crimeCase.signals.map((s) => s.dimension))].map(
                (d) => (
                  <li key={d}>{DIMENSION_LABELS[d]}</li>
                ),
              )}
              {!crimeCase.signals.length ? <li>None extracted yet</li> : null}
            </ul>
          </div>
        </aside>
      </section>

      <section className="site-shell py-8">
        <h2 className="display text-3xl text-[var(--ink)]">
          Behavioral timeline
        </h2>
        <div className="mt-5">
          <Timeline events={crimeCase.timeline} />
        </div>
      </section>

      <section className="site-shell py-8">
        <h2 className="display text-3xl text-[var(--ink)]">
          Psychological map
        </h2>
        <p className="body-copy mt-2 max-w-2xl text-[var(--ink-soft)]">
          Constructs are hypotheses grounded in public behavior—not diagnoses.
        </p>
        <div className="mt-5">
          <PsychMap constructs={analysis.constructs} />
        </div>
      </section>

      <section className="site-shell grid gap-4 py-8 md:grid-cols-2">
        <div className="card p-6">
          <h2 className="display text-2xl text-[var(--ink)]">
            Alternative explanations
          </h2>
          <ul className="mt-4 space-y-3">
            {analysis.alternativeExplanations.map((a) => (
              <li key={a} className="body-copy text-[var(--ink-soft)]">
                {a}
              </li>
            ))}
            {!analysis.alternativeExplanations.length ? (
              <li className="text-[var(--muted)]">Pending</li>
            ) : null}
          </ul>
        </div>
        <div className="card p-6">
          <h2 className="display text-2xl text-[var(--ink)]">
            What we cannot know
          </h2>
          <ul className="mt-4 space-y-3">
            {analysis.whatWeCannotKnow.map((a) => (
              <li key={a} className="body-copy text-[var(--muted)]">
                {a}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="site-shell space-y-6 py-8">
        <div className="card p-6">
          <h2 className="display text-2xl text-[var(--ink)]">Sources</h2>
          <ul className="mt-5 space-y-3">
            {crimeCase.sources.map((s) => (
              <li
                key={s.title}
                className="flex flex-col gap-1 md:flex-row md:gap-4"
              >
                <span className="w-24 shrink-0 text-xs font-medium tracking-[0.12em] text-[var(--muted)] uppercase">
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
                  <span className="text-[var(--ink-soft)]">{s.title}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
        <Disclaimer compact />
      </section>
    </article>
  );
}
