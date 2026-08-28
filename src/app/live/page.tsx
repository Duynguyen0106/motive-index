import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { LiveFeedClient } from "@/components/LiveFeedClient";
import { LiveRegionFilter } from "@/components/LiveRegionFilter";
import { WorldNewsFeed } from "@/components/WorldNewsFeed";
import { PageHeader } from "@/components/PageHeader";
import { QuickLinks } from "@/components/ui";
import { COUNTRY_LABELS, listCountryOptions } from "@/lib/country";
import { getAllCases, getUpdates } from "@/lib/data";
import { buildWorldNewsPayload } from "@/lib/worldNewsService";
import type { CountryCode } from "@/lib/types";

export const metadata: Metadata = {
  title: "World crime news",
  description: "Live global crime news feed with English summaries and archive-linked dossiers.",
};

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function LivePage({ searchParams }: Props) {
  const raw = await searchParams;
  const countryParam = typeof raw.country === "string" ? raw.country : "";
  const countryOptions = listCountryOptions(getAllCases());
  const country =
    countryParam && countryOptions.includes(countryParam as CountryCode)
      ? (countryParam as CountryCode)
      : "";

  const [initialNews, archiveUpdates] = await Promise.all([
    buildWorldNewsPayload({ limit: 40, country }),
    Promise.resolve(getUpdates(30)),
  ]);

  const monitorHref = country ? `/?country=${country}` : "/";

  return (
    <div className="site-shell page-intro py-10 md:py-12">
      <Breadcrumbs
        items={[{ label: "Monitor", href: "/" }, { label: "World crime news" }]}
      />
      <PageHeader
        className="mt-5"
        label="Live intelligence"
        title={country ? `World crime news · ${COUNTRY_LABELS[country]}` : "World crime news"}
        description="Regional RSS clusters translated/summarized in English, linked to Motive Index dossiers where available."
      />
      <QuickLinks
        links={[
          { href: "/", label: "World monitor" },
          { href: "/archive", label: "Archive" },
          { href: "/search", label: "Advanced search" },
        ]}
      />

      <div className="live-toolbar mt-6 flex flex-wrap items-center gap-4 border-b border-[var(--line)] pb-6">
        <Link href="/" className="text-link text-sm">
          ← Back to monitor
        </Link>
        <LiveRegionFilter country={country} countryOptions={countryOptions} />
      </div>

      {country ? (
        <p className="mt-4 text-sm text-[var(--muted)]">
          Showing news linked to {COUNTRY_LABELS[country]}.{" "}
          <Link href={monitorHref} className="text-[var(--accent)] hover:underline">
            View cases on map
          </Link>
        </p>
      ) : null}

      <section className="mt-10">
        <h2 className="display text-2xl">Global feed</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">Refreshes every 60 seconds</p>
        <div className="mt-6 card p-5">
          <WorldNewsFeed initial={initialNews} countryFilter={country} />
        </div>
      </section>

      <section className="mt-12 pb-8">
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
