import type { Metadata } from "next";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { LivePageSync } from "@/components/LivePageSync";
import { PageHeader } from "@/components/PageHeader";
import { QuickLinks } from "@/components/ui";
import { COUNTRY_LABELS, listCountryOptions } from "@/lib/country";
import { getPublicCases, getUpdates, getUpdatesTotal } from "@/lib/data";
import { buildWorldNewsPayload } from "@/lib/worldNewsService";
import { WORLD_NEWS_DISPLAY_LIMIT, WORLD_NEWS_FEED_COUNT } from "@/lib/worldNews";
import { parseNewsFilter } from "@/lib/newsFeedUtils";
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
  const newsFilter = parseNewsFilter(
    typeof raw.newsFilter === "string" ? raw.newsFilter : null,
  );
  const countryOptions = listCountryOptions(getPublicCases());
  const country =
    countryParam && countryOptions.includes(countryParam as CountryCode)
      ? (countryParam as CountryCode)
      : "";

  const [initialNews, archiveUpdates, updatesTotal] = await Promise.all([
    buildWorldNewsPayload({ limit: WORLD_NEWS_DISPLAY_LIMIT, country }),
    Promise.resolve(getUpdates(30)),
    Promise.resolve(getUpdatesTotal()),
  ]);

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
          { href: "/live?newsFilter=hot", label: "Hot news" },
        ]}
      />

      <Suspense
        fallback={
          <div className="mt-10 card p-6" role="status">
            <p className="text-sm text-[var(--muted)]">Loading live feed…</p>
          </div>
        }
      >
        <LivePageSync
          initialNews={initialNews}
          initialUpdates={archiveUpdates}
          initialUpdatesTotal={updatesTotal}
          country={country}
          countryOptions={countryOptions}
          initialNewsFilter={newsFilter}
        />
      </Suspense>
    </div>
  );
}
