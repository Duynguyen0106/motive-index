import type { Metadata } from "next";
import Link from "next/link";
import { LiveFeedClient } from "@/components/LiveFeedClient";
import { getUpdates } from "@/lib/data";

export const metadata: Metadata = {
  title: "Live",
  description: "Live ingest and analysis updates across the Motive Index archive.",
};

export default function LivePage() {
  const initial = getUpdates(30);

  return (
    <div className="site-shell py-12 md:py-14">
      <div className="flex items-center gap-3">
        <span className="pulse-live inline-block h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
        <p className="text-xs font-semibold tracking-[0.16em] text-[var(--accent)] uppercase">
          Live feed
        </p>
      </div>
      <h1 className="display mt-3 text-4xl text-[var(--ink)] md:text-5xl">
        What just changed
      </h1>
      <p className="body-copy mt-4 max-w-2xl text-lg text-[var(--ink-soft)]">
        New public-source ingest events, analysis drafts, and human revisions.
        The feed polls every 20 seconds in this MVP.
      </p>
      <p className="mt-3 text-sm text-[var(--muted)]">
        Want to simulate an ingest?{" "}
        <Link href="/api/ingest" className="font-medium text-[var(--accent)] hover:underline">
          POST /api/ingest
        </Link>
      </p>
      <div className="mt-8">
        <LiveFeedClient initial={initial} />
      </div>
    </div>
  );
}
