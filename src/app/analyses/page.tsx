import type { Metadata } from "next";
import Link from "next/link";
import { getAnalyses } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Analyses",
  description: "Expert and student psychological commentaries across the archive.",
};

export default function AnalysesPage() {
  const items = getAnalyses();

  return (
    <div className="site-shell py-12 md:py-14">
      <p className="text-xs font-semibold tracking-[0.16em] text-[var(--accent)] uppercase">
        Analyses
      </p>
      <h1 className="display mt-3 text-4xl md:text-5xl">
        Psychological commentary
      </h1>
      <p className="body-copy mt-4 max-w-2xl text-lg text-[var(--ink-soft)]">
        Expert editorials and reviewed student notes—clearly labeled, never
        presented as clinical diagnoses.
      </p>
      <p className="mt-3 text-sm">
        <Link href="/contribute" className="font-medium text-[var(--accent)] hover:underline">
          Submit an analysis for peer review
        </Link>
      </p>
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
        {!items.length ? (
          <li className="text-[var(--muted)]">No published commentaries yet.</li>
        ) : null}
      </ul>
    </div>
  );
}
