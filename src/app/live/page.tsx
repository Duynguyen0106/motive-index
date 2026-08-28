import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { LivePageSync } from "@/components/LivePageSync";
import { LiveRegionFilter } from "@/components/LiveRegionFilter";
import { PageHeader } from "@/components/PageHeader";
import { QuickLinks } from "@/components/ui";
import { COUNTRY_LABELS, listCountryOptions } from "@/lib/country";
import { getAllCases, getUpdates } from "@/lib/data";
import { buildWorldNewsPayload } from "@/lib/worldNewsService";
import { WORLD_NEWS_FEED_COUNT } from "@/lib/worldNews";
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

  const monitorHref = country ? `/?country=${country}&tab=news` : "/?tab=news";
  const monitorCasesHref = country ? `/?country=${country}` : "/";

  return (
    <div className="site-shell page-intro page-scroll-safe py-10 md:py-12">
      <Breadcrumbs
        items={[{ label: "Monitor", href: "/" }, { label: "World crime news" }]}
      />
      <PageHeader
        className="mt-5"
        label="Live intelligence"
        title={country ? `World crime news · ${COUNTRY_LABELS[country]}` : "World crime news"}
        description={`${WORLD_NEWS_FEED_COUNT} regional RSS clusters with English where available; non-English headlines shown in original language with source labels, linked to Motive Index dossiers where available.`}
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
            View on monitor (news tab)
          </Link>
          {" · "}
          <Link href={monitorCasesHref} className="text-[var(--accent)] hover:underline">
            Cases on map
          </Link>
        </p>
      ) : null}

      <LivePageSync
        initialNews={initialNews}
        initialUpdates={archiveUpdates}
        country={country}
      />
    </div>
  );
}
