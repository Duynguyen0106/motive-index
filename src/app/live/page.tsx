import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { WorldNewsFeed } from "@/components/WorldNewsFeed";
import { QuickLinks } from "@/components/ui";
import { LiveFeedClient } from "@/components/LiveFeedClient";
import { PageHeader } from "@/components/PageHeader";
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
    <div className="py-12 md:py-14">
      <div className="site-shell">
        <Breadcrumbs
          items={[{ label: "Monitor", href: "/" }, { label: "World crime news" }]}
        />
      </div>
      <PageHeader
        label="Live intelligence"
        title={country ? `World crime news · ${COUNTRY_LABELS[country]}` : "World crime news"}
        description="Regional RSS clusters translated/summarized in English, linked to Motive Index dossiers where available."
      />
      <div className="site-shell mt-6">
        <QuickLinks
          links={[
            { href: "/", label: "World monitor" },
            { href: "/archive", label: "Archive" },
            { href: "/search", label: "Advanced search" },
          ]}
        />
      </div>
      <div className="site-shell mt-4 flex flex-wrap items-center gap-4">
        <Link href="/" className="text-link text-sm">
          ← Back to monitor
        </Link>
        <form action="/live" method="get" className="flex flex-wrap items-center gap-2 text-sm">
          <label className="flex items-center gap-2">
            <span className="text-[var(--muted)]">Region</span>
            <select
              name="country"
              defaultValue={country}
              className="field py-1.5 text-sm"
            >
              <option value="">All regions</option>
              {countryOptions.map((code) => (
                <option key={code} value={code}>
                  {COUNTRY_LABELS[code]}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="btn btn-ghost text-xs">
            Apply
          </button>
          {country ? (
            <Link href="/live" className="text-link text-xs">
              Clear filter
            </Link>
          ) : null}
        </form>
      </div>

      {country ? (
        <p className="site-shell mt-4 text-sm text-[var(--muted)]">
          Showing news linked to {COUNTRY_LABELS[country]}.{" "}
          <Link href={monitorHref} className="text-[var(--accent)] hover:underline">
            View cases on map
          </Link>
        </p>
      ) : null}

      <section className="site-shell mt-10">
        <h2 className="display text-2xl">Global feed</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">Refreshes every 60 seconds</p>
        <div className="mt-6 card p-5">
          <WorldNewsFeed initial={initialNews} countryFilter={country} />
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
