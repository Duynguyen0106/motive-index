import type { Metadata } from "next";
import Link from "next/link";
import { getCaseOfWeek, getGlossary, getTheories } from "@/lib/data";
import { FRAMEWORK_LABELS } from "@/lib/types";

export const metadata: Metadata = {
  title: "Resources",
  description: "Glossary, theories, and case of the week for forensic psychology study.",
};

export default function ResourcesPage() {
  const glossary = getGlossary();
  const theories = getTheories();
  const cotw = getCaseOfWeek();

  return (
    <div className="site-shell py-12 md:py-14">
      <p className="text-xs font-semibold tracking-[0.16em] text-[var(--accent)] uppercase">
        Resources
      </p>
      <h1 className="display mt-3 text-4xl md:text-5xl">Educational resources</h1>
      <p className="body-copy mt-4 max-w-2xl text-lg text-[var(--ink-soft)]">
        Glossary, major theoretical overviews, and a rotating case spotlight for
        classroom use.
      </p>

      {cotw ? (
        <section className="card mt-8 border-l-4 border-l-[var(--accent)] p-6 md:p-8">
          <p className="text-xs font-semibold tracking-[0.16em] text-[var(--accent)] uppercase">
            Case of the week
          </p>
          <h2 className="display mt-2 text-3xl">{cotw.name}</h2>
          <p className="body-copy mt-3 max-w-2xl text-[var(--ink-soft)]">
            Teaching focus: impression management and organized instrumental
            patterning as separable research questions—not media mythology.
          </p>
          <Link
            href={`/cases/${cotw.slug}?tab=analysis`}
            className="mt-4 inline-block text-sm font-semibold text-[var(--accent)] hover:underline"
          >
            Open dossier analysis →
          </Link>
        </section>
      ) : null}

      <section className="mt-12">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="display text-3xl">Theoretical overviews</h2>
        </div>
        <ul className="grid gap-3 md:grid-cols-2">
          {theories.map((t) => (
            <li key={t.id}>
              <Link href={`/resources/theories/${t.slug}`} className="card card-hover block h-full p-5">
                <p className="text-xs font-semibold tracking-[0.12em] text-[var(--muted)] uppercase">
                  {FRAMEWORK_LABELS[t.framework]}
                </p>
                <h3 className="display mt-2 text-xl">{t.name}</h3>
                <p className="mt-2 text-sm text-[var(--ink-soft)]">{t.summary}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="display text-3xl">Glossary</h2>
        <ul className="mt-5 divide-y divide-[var(--line)] overflow-hidden rounded border border-[var(--line)] bg-white shadow-[var(--shadow)]">
          {glossary.map((g) => (
            <li key={g.id} className="px-5 py-4 md:px-6">
              <h3 className="font-semibold text-[var(--ink)]">{g.term}</h3>
              <p className="mt-1 text-[var(--ink-soft)]">{g.definition}</p>
              {g.relatedCaseSlugs?.length ? (
                <p className="mt-2 text-sm text-[var(--muted)]">
                  Related:{" "}
                  {g.relatedCaseSlugs.map((s, i) => (
                    <span key={s}>
                      {i > 0 ? ", " : ""}
                      <Link href={`/cases/${s}`} className="text-[var(--accent)] hover:underline">
                        {s}
                      </Link>
                    </span>
                  ))}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section className="card mt-12 p-6">
        <h2 className="display text-2xl">Further reading</h2>
        <ul className="mt-4 space-y-2 text-[var(--ink-soft)]">
          <li>Peer-reviewed forensic psychology and criminology journals (link via your library).</li>
          <li>Public inquiry reports and digitized court archives for primary material.</li>
          <li>
            Method notes: <Link href="/method" className="text-[var(--accent)] hover:underline">how Motive Index scores behavior</Link>.
          </li>
        </ul>
      </section>
    </div>
  );
}
