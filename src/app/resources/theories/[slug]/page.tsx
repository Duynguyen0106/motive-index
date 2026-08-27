import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTheories, getTheoryBySlug } from "@/lib/data";
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

  return (
    <div className="site-shell py-12 md:py-14">
      <Link href="/resources" className="text-sm text-[var(--muted)] hover:text-[var(--accent)]">
        ← Resources
      </Link>
      <p className="mt-5 text-xs font-semibold tracking-[0.16em] text-[var(--accent)] uppercase">
        {FRAMEWORK_LABELS[theory.framework]}
      </p>
      <h1 className="display mt-3 max-w-3xl text-4xl md:text-5xl">{theory.name}</h1>
      <p className="body-copy mt-5 max-w-2xl text-lg text-[var(--ink-soft)]">
        {theory.summary}
      </p>

      <section className="card mt-8 p-6">
        <h2 className="display text-2xl">Key ideas</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-[var(--ink-soft)]">
          {theory.keyIdeas.map((k) => (
            <li key={k}>{k}</li>
          ))}
        </ul>
      </section>

      <section className="card mt-4 p-6">
        <h2 className="display text-2xl">Relevance to this archive</h2>
        <p className="body-copy mt-3 text-[var(--ink-soft)]">{theory.relevance}</p>
      </section>

      <section className="mt-8">
        <h2 className="display text-2xl">Related cases</h2>
        <ul className="mt-4 flex flex-wrap gap-3">
          {theory.relatedCaseSlugs.map((s) => (
            <li key={s}>
              <Link
                href={`/cases/${s}?tab=analysis`}
                className="rounded border border-[var(--line)] bg-white px-3 py-2 text-sm shadow-[var(--shadow)] hover:border-[var(--accent)]"
              >
                {s}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
