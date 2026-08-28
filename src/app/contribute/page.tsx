import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ContributeForm } from "@/components/ContributeForm";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState, QuickLinks } from "@/components/ui";
import { getContributions } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contribute",
  description: "Submit cases, analyses, or document pointers for automated integrity review.",
};

export default function ContributePage() {
  const queue = getContributions();

  return (
    <div className="site-shell py-10 md:py-14 pb-16">
      <Breadcrumbs items={[{ label: "Monitor", href: "/" }, { label: "Contribute" }]} />
      <PageHeader
        className="mt-5"
        label="Contribute"
        title="User contributions & peer review"
        description="Researchers and students can propose new cases, analyses, or document pointers. Submissions enter the secured AI pipeline for integrity review before publication."
      />
      <QuickLinks
        links={[
          { href: "/method", label: "Method" },
          { href: "/analyses", label: "Commentary" },
          { href: "/archive", label: "Archive" },
        ]}
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <ContributeForm />
        <section>
          <h2 className="display text-2xl">Submission queue</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {queue.length} submission{queue.length === 1 ? "" : "s"} awaiting review
          </p>
          {queue.length ? (
            <ul className="mt-4 space-y-3">
              {queue.map((s) => (
                <li key={s.id} className="card p-4">
                  <p className="text-xs font-semibold tracking-[0.12em] text-[var(--accent)] uppercase">
                    {s.kind} · {s.status.replaceAll("_", " ")}
                  </p>
                  <h3 className="mt-1 font-semibold text-[var(--ink)]">{s.title}</h3>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {s.submitterName} ({s.submitterRole}) · {formatDate(s.createdAt)}
                  </p>
                  <p className="mt-2 text-sm text-[var(--ink-soft)]">{s.summary}</p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-4">
              <EmptyState
                title="Queue is empty"
                description="Your submission will appear here after you submit the form."
                actions={[{ href: "/archive", label: "Browse archive" }]}
              />
            </div>
          )}
        </section>
      </div>
      <p className="mt-8 text-sm text-[var(--muted)]">
        New cases from RSS and ingest APIs are processed by the secured AI pipeline — provenance
        and reference gates must pass before a dossier appears in the public catalog.
      </p>
    </div>
  );
}
