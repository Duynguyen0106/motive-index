import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState, QuickLinks } from "@/components/ui";
import { getAnalyses } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Analyses",
  description: "Expert and student psychological commentaries across the archive.",
};

export default function AnalysesPage() {
  const items = getAnalyses();

  return (
    <div className="site-shell py-10 md:py-14 pb-16">
      <Breadcrumbs items={[{ label: "Monitor", href: "/" }, { label: "Commentary" }]} />
      <PageHeader
        className="mt-5"
        label="Analyses"
        title="Psychological commentary"
        description="Expert editorials and reviewed student notes—clearly labeled, never presented as clinical diagnoses."
      />
      <QuickLinks
        links={[
          { href: "/contribute", label: "Submit analysis" },
          { href: "/archive", label: "Case archive" },
          { href: "/method", label: "Method" },
        ]}
      />
      <p className="mt-4 text-sm">
        <Link href="/contribute" className="font-medium text-[var(--accent)] hover:underline">
          Submit an analysis for peer review →
        </Link>
      </p>

      {items.length ? (
        <ul className="mt-8 grid gap-4">
          {items.map(({ caseSlug, caseName, comment }) => (
            <li key={comment.id} className="card p-6">
              <p className="text-xs font-semibold tracking-[0.14em] text-[var(--accent)] uppercase">
                {comment.role} · {comment.reviewed ? "reviewed" : "unreviewed"}
              </p>
              <h2 className="display mt-2 text-2xl">{comment.title}</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {comment.author} · {formatDate(comment.publishedAt)} · Case:{" "}
                <Link href={`/cases/${caseSlug}?tab=analysis`} className="text-[var(--accent)] hover:underline">
                  {caseName}
                </Link>
              </p>
              <p className="body-copy mt-3 text-[var(--ink-soft)]">{comment.body}</p>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-8">
          <EmptyState
            title="No published commentaries yet"
            description="Expert and student analyses appear here after review. Browse dossier Psychology tabs or submit your own."
            actions={[
              { href: "/contribute", label: "Contribute", primary: true },
              { href: "/archive", label: "Browse archive" },
            ]}
          />
        </div>
      )}
    </div>
  );
}
