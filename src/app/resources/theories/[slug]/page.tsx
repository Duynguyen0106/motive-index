import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PageHeader } from "@/components/PageHeader";
import { QuickLinks } from "@/components/ui";
import { getCaseBySlug, getTheories, getTheoryBySlug } from "@/lib/data";
import { FRAMEWORK_LABELS } from "@/lib/types";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return getTheories().map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const t = getTheoryBySlug(slug);
  return { title: t?.name ?? "Theory" };
}

export default async function TheoryPage({ params }: Props) {
  const { slug } = await params;
  const theory = getTheoryBySlug(slug);
  if (!theory) notFound();

  const relatedCases = theory.relatedCaseSlugs.map((s) => ({
    slug: s,
    name: getCaseBySlug(s)?.name ?? s,
  }));

  return (
    <div className="site-shell py-10 md:py-14 pb-16">
      <Breadcrumbs
        items={[
          { label: "Monitor", href: "/" },
          { label: "Resources", href: "/resources" },
          { label: theory.name },
        ]}
      />
      <PageHeader
        className="mt-5"
        label={FRAMEWORK_LABELS[theory.framework]}
        title={theory.name}
        description={theory.summary}
      />
      <QuickLinks
        links={[
          { href: "/resources", label: "All resources" },
          { href: "/archive", label: "Case archive" },
          { href: "/method", label: "Method" },
        ]}
      />

      <section className="card mt-8 p-6 md:p-8">
        <h2 className="display text-2xl">Key ideas</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-[var(--ink-soft)]">
          {theory.keyIdeas.map((k) => (
            <li key={k}>{k}</li>
          ))}
        </ul>
      </section>

      <section className="card mt-4 p-6 md:p-8">
        <h2 className="display text-2xl">Relevance to this archive</h2>
        <p className="body-copy mt-3 text-[var(--ink-soft)]">{theory.relevance}</p>
      </section>

      <section className="mt-8">
        <h2 className="display text-2xl">Related cases</h2>
        <ul className="mt-4 flex flex-wrap gap-3">
          {relatedCases.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/cases/${c.slug}?tab=analysis`}
                className="rounded border border-[var(--line)] bg-[var(--bg-subtle)] px-3 py-2 text-sm hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
