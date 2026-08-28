import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { GlossaryList, type GlossaryListItem } from "@/components/GlossaryList";
import { PageHeader } from "@/components/PageHeader";
import { QuickLinks } from "@/components/ui";
import { getCaseBySlug, getCaseOfWeek, getGlossary, getTheories } from "@/lib/data";
import { FRAMEWORK_LABELS } from "@/lib/types";

export const metadata: Metadata = {
  title: "Resources",
  description: "Glossary, theories, and case of the week for forensic psychology study.",
};

export default function ResourcesPage() {
  const glossary = getGlossary();
  const theories = getTheories();
  const cotw = getCaseOfWeek();

  const glossaryItems: GlossaryListItem[] = glossary.map((g) => ({
    id: g.id,
    term: g.term,
    definition: g.definition,
    relatedCases: (g.relatedCaseSlugs ?? []).map((slug) => ({
      slug,
      name: getCaseBySlug(slug)?.name ?? slug,
    })),
  }));

  return (
    <div className="site-shell page-intro py-10 md:py-14">
      <Breadcrumbs items={[{ label: "Monitor", href: "/" }, { label: "Resources" }]} />
      <PageHeader
        className="mt-5"
        label="Resources"
        title="Educational resources"
        description="Glossary, major theoretical overviews, and a rotating case spotlight for classroom use."
      />
      <QuickLinks
        links={[
          { href: "/archive", label: "Case archive" },
          { href: "/method", label: "Method" },
          { href: "/documents", label: "Documents" },
          { href: "/contribute", label: "Contribute" },
        ]}
      />

      {cotw ? (
        <section className="featured-card mt-8">
          <div className="featured-card-accent" />
          <div className="featured-card-body">
            <p className="label">Case of the week</p>
            <h2 className="display mt-2 text-3xl">{cotw.name}</h2>
            <p className="body-copy mt-3 max-w-2xl text-[var(--ink-soft)]">
              Teaching focus: impression management and organized instrumental patterning as
              separable research questions—not media mythology.
            </p>
            <Link
              href={`/cases/${cotw.slug}?tab=analysis`}
              className="btn btn-primary mt-4 text-sm"
            >
              Open dossier analysis
            </Link>
          </div>
        </section>
      ) : null}

      <section className="mt-12">
        <h2 className="display text-3xl">Theoretical overviews</h2>
        <ul className="mt-5 grid gap-3 md:grid-cols-2">
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
        <p className="mt-2 text-sm text-[var(--muted)]">
          Link directly to a term with <code className="text-xs">/resources#term-id</code>
        </p>
        <div className="mt-5">
          <GlossaryList items={glossaryItems} />
        </div>
      </section>

      <section className="card mt-12 p-6 pb-8">
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
