import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ContentWarning } from "@/components/ContentWarning";
import { EmptyState } from "@/components/ui";
import { PageHeader } from "@/components/PageHeader";
import { QuickLinks, StatBar } from "@/components/ui";
import { getAllDocuments, searchDocuments } from "@/lib/data";
import {
  DEFAULT_DOC_PAGE_SIZE,
  documentsUrlFromParams,
  paginateCases,
} from "@/lib/search";
import type { DocumentType } from "@/lib/types";
import { DOCUMENT_TYPE_LABELS } from "@/lib/types";

export const metadata: Metadata = {
  title: "Documents",
  description: "Library of primary-source pointers tagged for forensic psychological study.",
};

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function DocumentsPage({ searchParams }: Props) {
  const raw = await searchParams;
  const q = typeof raw.q === "string" ? raw.q : "";
  const typeParam = typeof raw.type === "string" ? raw.type : "";
  const page = Math.max(1, Number(raw.page) || 1);
  const pageSize = Math.min(
    100,
    Math.max(10, Number(raw.pageSize) || DEFAULT_DOC_PAGE_SIZE),
  );

  const allDocs = getAllDocuments();
  const types = new Set(allDocs.map((d) => d.type)).size;
  const publicDomain = allDocs.filter((d) => d.publicDomain).length;

  const filtered = searchDocuments({
    q,
    documentType: typeParam as DocumentType,
    crimeCategory: "",
    psychologicalFactor: "",
    theoreticalFramework: "",
    diagnosis: "",
    country: "",
    location: "",
    period: "",
    offenderSex: "",
    status: "",
    catalogTier: "",
  });
  const paginated = paginateCases(filtered, page, pageSize);
  const docs = paginated.items;
  const hasFilters = Boolean(q.trim() || typeParam);

  return (
    <div className="site-shell page-intro py-10 md:py-12">
      <Breadcrumbs
        items={[{ label: "Monitor", href: "/" }, { label: "Document library" }]}
      />
      <PageHeader
        className="mt-5"
        label="Documents"
        title="Document library"
        description="Court summaries, inquiry reports, letters, and manifesto link-outs—tagged by type, date, and psychological relevance. Copyrighted works are cited or linked, not republished."
      />
      <QuickLinks
        links={[
          { href: "/archive", label: "Case archive" },
          { href: "/documents?type=manifesto", label: "Manifestos" },
          { href: "/search?documentType=manifesto", label: "Search manifestos" },
          { href: "/method", label: "Method" },
        ]}
      />
      <StatBar
        items={[
          { label: "Documents", value: allDocs.length },
          { label: "Types", value: types },
          { label: "Public domain", value: publicDomain },
        ]}
      />
      <div className="mt-8 max-w-3xl">
        <ContentWarning text="Some documents discuss violent crime, extremist ideology, or medical murder at a summary level." />
      </div>

      <form
        action="/documents"
        method="get"
        className="filter-toolbar documents-form card mt-8 grid gap-4 p-4 md:grid-cols-[1fr_180px_140px_auto] md:p-5"
      >
        <label className="block text-sm">
          <span className="label mb-1 block normal-case tracking-normal">Keyword</span>
          <input
            name="q"
            defaultValue={q}
            placeholder="Title, summary, relevance…"
            className="field mt-1"
          />
        </label>
        <label className="block text-sm">
          <span className="label mb-1 block normal-case tracking-normal">Document type</span>
          <select name="type" defaultValue={typeParam} className="field mt-1">
            <option value="">All types</option>
            {(Object.keys(DOCUMENT_TYPE_LABELS) as DocumentType[]).map((k) => (
              <option key={k} value={k}>
                {DOCUMENT_TYPE_LABELS[k]}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="label mb-1 block normal-case tracking-normal">Per page</span>
          <select name="pageSize" defaultValue={String(pageSize)} className="field mt-1">
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </label>
        <div className="flex items-end gap-2">
          <button type="submit" className="btn btn-primary">
            Apply
          </button>
          <Link href="/documents" className="btn btn-ghost">
            Clear
          </Link>
        </div>
      </form>

      <p className="mt-6 text-sm text-[var(--muted)]">
        {hasFilters
          ? `${paginated.total.toLocaleString()} matching of ${allDocs.length.toLocaleString()} total`
          : `${allDocs.length.toLocaleString()} documents in library`}
        {paginated.totalPages > 1
          ? ` · page ${paginated.page} of ${paginated.totalPages}`
          : ""}
      </p>

      <ul className="mt-6 grid gap-3 pb-8">
        {docs.map((d) => (
          <li key={d.id} className="card card-hover p-5 md:p-6">
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
                  External source ↗
                </a>
              ) : null}
            </div>
          </li>
        ))}
        {!docs.length ? (
          <li>
            <EmptyState
              title="No documents match"
              description="Try clearing filters or browse by document type."
              actions={[
                { href: "/documents", label: "Clear filters", primary: true },
                { href: "/documents?type=manifesto", label: "Manifestos" },
              ]}
            />
          </li>
        ) : null}
      </ul>

      {paginated.totalPages > 1 ? (
        <nav
          className="archive-pagination mb-8 flex flex-wrap items-center justify-between gap-4"
          aria-label="Document library pages"
        >
          <div className="flex flex-wrap gap-2">
            {paginated.page > 1 ? (
              <Link
                href={documentsUrlFromParams({ q, type: typeParam, page: paginated.page - 1, pageSize })}
                className="btn btn-ghost text-sm"
              >
                ← Previous
              </Link>
            ) : (
              <span className="btn btn-ghost text-sm opacity-40 pointer-events-none">← Previous</span>
            )}
            {paginated.page < paginated.totalPages ? (
              <Link
                href={documentsUrlFromParams({ q, type: typeParam, page: paginated.page + 1, pageSize })}
                className="btn btn-ghost text-sm"
              >
                Next →
              </Link>
            ) : (
              <span className="btn btn-ghost text-sm opacity-40 pointer-events-none">Next →</span>
            )}
          </div>
          <p className="text-sm text-[var(--muted)]">
            Showing {(paginated.page - 1) * paginated.pageSize + 1}–
            {Math.min(paginated.page * paginated.pageSize, paginated.total)} of{" "}
            {paginated.total.toLocaleString()}
          </p>
        </nav>
      ) : null}
    </div>
  );
}
