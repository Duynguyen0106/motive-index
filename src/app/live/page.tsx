import type { Metadata } from "next";
import Link from "next/link";
import { WorldNewsFeed } from "@/components/WorldNewsFeed";
import { LiveFeedClient } from "@/components/LiveFeedClient";
import { PageHeader } from "@/components/PageHeader";
import { getUpdates } from "@/lib/data";
import { buildWorldNewsPayload } from "@/lib/worldNewsService";

export const metadata: Metadata = {
  title: "World crime news",
  description: "Live global crime news feed with English summaries and archive-linked dossiers.",
};

export const dynamic = "force-dynamic";

export default async function LivePage() {
  const [initialNews, archiveUpdates] = await Promise.all([
    buildWorldNewsPayload({ limit: 40 }),
    Promise.resolve(getUpdates(30)),
  ]);

  return (
    <div className="py-12 md:py-14">
      <PageHeader
        label="Live intelligence"
        title="World crime news"
        description="Regional RSS clusters translated/summarized in English, linked to Motive Index dossiers where available."
      />
      <div className="site-shell mt-6">
        <Link href="/" className="text-link text-sm">
          ← Back to monitor
        </Link>
      </div>

      <section className="site-shell mt-10">
        <h2 className="display text-2xl">Global feed</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">Refreshes every 60 seconds</p>
        <div className="mt-6 border border-[var(--line)] bg-[var(--paper)] p-5">
          <WorldNewsFeed initial={initialNews} />
        </div>
      </section>

      <section className="site-shell mt-12">
        <h2 className="display text-2xl">Archive revision log</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Ingest events, analysis drafts, and human-reviewed revisions.
        </p>
        <div className="mt-6 border-t border-[var(--line-strong)]">
          <LiveFeedClient initial={archiveUpdates} />
        </div>
      </section>
    </div>
  );
}
