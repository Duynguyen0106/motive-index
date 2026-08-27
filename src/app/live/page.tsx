import type { Metadata } from "next";
import Link from "next/link";
import { LiveFeedClient } from "@/components/LiveFeedClient";
import { PageHeader } from "@/components/PageHeader";
import { getUpdates } from "@/lib/data";

export const metadata: Metadata = {
  title: "Updates",
  description: "Ingest and revision log for the Motive Index archive.",
};

export default function LivePage() {
  const initial = getUpdates(30);

  return (
    <div className="py-12 md:py-14">
      <PageHeader
        label="Revision log"
        title="What changed"
        description="New public-source ingest events, analysis drafts, and human-reviewed revisions."
      />
      <div className="site-shell mt-6">
        <p className="text-sm text-[var(--muted)]">
          Simulate ingest:{" "}
          <Link href="/api/ingest" className="text-link">
            POST /api/ingest
          </Link>
        </p>
        <div className="mt-8 border-t border-[var(--line-strong)]">
          <LiveFeedClient initial={initial} />
        </div>
      </div>
    </div>
  );
}
