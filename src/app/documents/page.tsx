import type { Metadata } from "next";
import Link from "next/link";
import { ContentWarning } from "@/components/ContentWarning";
import { getAllDocuments } from "@/lib/data";
import { DOCUMENT_TYPE_LABELS } from "@/lib/types";

export const metadata: Metadata = {
  title: "Documents",
  description: "Library of primary-source pointers tagged for forensic psychological study.",
};

export default function DocumentsPage() {
  const docs = getAllDocuments();

  return (
    <div className="site-shell py-12 md:py-14">
      <p className="text-xs font-semibold tracking-[0.16em] text-[var(--accent)] uppercase">
        Documents
      </p>
      <h1 className="display mt-3 text-4xl md:text-5xl">Document library</h1>
      <p className="body-copy mt-4 max-w-2xl text-lg text-[var(--ink-soft)]">
        Court summaries, inquiry reports, letters, and manifesto link-outs—tagged
        by type, date, and psychological relevance. Copyrighted works are cited
        or linked, not republished.
      </p>
      <div className="mt-6 max-w-3xl">
        <ContentWarning text="Some documents discuss violent crime, extremist ideology, or medical murder at a summary level." />
      </div>
      <ul className="mt-8 grid gap-3">
        {docs.map((d) => (
          <li key={d.id} className="card p-5 md:p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-xs font-semibold tracking-[0.12em] text-[var(--accent)] uppercase">
                {DOCUMENT_TYPE_LABELS[d.type]}
              </p>
              <p className="text-xs text-[var(--muted)]">
                {d.date ?? "Date n/a"} · {d.publicDomain ? "public domain" : "citation / link-out"}
              </p>
            </div>
            <h2 className="display mt-2 text-2xl">{d.title}</h2>
            <p className="mt-2 text-[var(--ink-soft)]">{d.summary}</p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Relevance: {d.psychRelevance}
            </p>
            <p className="mt-2 text-sm text-[var(--maroon)]">{d.contentWarning}</p>
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <Link
                href={`/cases/${d.caseSlug}?tab=documents`}
                className="font-medium text-[var(--accent)] hover:underline"
              >
                Open case dossier
              </Link>
              {d.url ? (
                <a
                  href={d.url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-[var(--ink-soft)] hover:text-[var(--accent)]"
                >
                  External source
                </a>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
