import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Disclaimer } from "@/components/Disclaimer";
import { PageHeader } from "@/components/PageHeader";
import { StatsExpandableChart } from "@/components/StatsExpandableChart";
import { QuickLinks, StatBar } from "@/components/ui";
import { getCachedArchiveStats } from "@/lib/archiveStats";
import { getAllCases } from "@/lib/data";

export const metadata: Metadata = {
  title: "Archive statistics",
  description: "Catalog analytics across 10,000+ forensic psychology dossiers.",
};

export default function StatsPage() {
  const stats = getCachedArchiveStats(getAllCases(), {
    country: 50,
    category: 20,
    psychFactor: 20,
    framework: 15,
  });
  const maxCountry = stats.byCountry[0]?.count ?? 1;
  const maxCategory = stats.byCategory[0]?.count ?? 1;
  const maxDecade = Math.max(...stats.byDecade.map((d) => d.count), 1);
  const maxPsych = stats.byPsychFactor[0]?.count ?? 1;
  const maxFramework = stats.byFramework[0]?.count ?? 1;

  return (
    <div className="site-shell py-10 md:py-14 pb-16">
      <Breadcrumbs items={[{ label: "Monitor", href: "/" }, { label: "Archive stats" }]} />
      <PageHeader
        className="mt-5"
        title="Archive statistics"
        description="Aggregate view of the Motive Index catalog — tap any bar to browse matching dossiers."
      />
      <QuickLinks
        links={[
          { href: "/archive", label: "Case archive" },
          { href: "/archive?catalogTier=curated", label: "Curated only" },
          { href: "/search?status=unsolved", label: "Unsolved" },
          { href: "/", label: "World monitor" },
        ]}
      />

      <div className="mt-8">
      <StatBar
        items={[
          { label: "Total dossiers", value: stats.total },
          { label: "Curated", value: stats.curated },
          { label: "Composite", value: stats.composite },
          { label: "Multilingual", value: stats.multilingual },
          { label: "Countries", value: stats.countries },
          { label: "Unsolved", value: stats.unsolved, highlight: true },
          { label: "With photos", value: stats.withPhotos },
        ]}
      />

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <StatsExpandableChart
          title="By country"
          subtitle="Jurisdictions in catalog — tap to filter archive"
          buckets={stats.byCountry}
          max={maxCountry}
          chartTitle="Cases by country"
          initialLimit={15}
          viewAllHref="/archive"
        />

        <StatsExpandableChart
          title="By crime category"
          subtitle="Primary classification tags"
          buckets={stats.byCategory}
          max={maxCategory}
          chartTitle="Cases by crime category"
          initialLimit={10}
          viewAllHref="/archive"
        />

        <section className="card p-6 md:p-8">
          <h2 className="display text-xl">By status</h2>
          <ul className="stats-bars mt-4 space-y-2" role="list" aria-label="Cases by status">
            {stats.byStatus.map((b) => (
              <li key={b.label} className="stats-bar-row">
                <Link href={b.href} className="stats-bar-link group">
                  <span className="stats-bar-label">{b.label}</span>
                  <div className="stats-bar-track" role="img" aria-label={`${b.label}: ${b.count}`}>
                    <div
                      className="stats-bar-fill"
                      style={{
                        width: `${(b.count / Math.max(...stats.byStatus.map((s) => s.count), 1)) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="stats-bar-count">{b.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-6 md:p-8">
          <h2 className="display text-xl">By decade</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Case start year distribution</p>
          <ul className="stats-bars mt-4 space-y-2" role="list" aria-label="Cases by decade">
            {stats.byDecade.map((b) => (
              <li key={b.label} className="stats-bar-row">
                <Link href={b.href} className="stats-bar-link group">
                  <span className="stats-bar-label">{b.label}</span>
                  <div className="stats-bar-track" role="img" aria-label={`${b.label}: ${b.count}`}>
                    <div
                      className="stats-bar-fill"
                      style={{ width: `${(b.count / maxDecade) * 100}%` }}
                    />
                  </div>
                  <span className="stats-bar-count">{b.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <StatsExpandableChart
          title="By psychological factor"
          subtitle="Tagged constructs — tap to search"
          buckets={stats.byPsychFactor}
          max={maxPsych}
          chartTitle="Cases by psych factor"
          initialLimit={10}
          viewAllHref="/search"
        />

        <StatsExpandableChart
          title="By theoretical framework"
          subtitle="Applied models across dossiers"
          buckets={stats.byFramework}
          max={maxFramework}
          chartTitle="Cases by framework"
          initialLimit={8}
          viewAllHref="/search"
        />
      </div>

      <section className="card mt-6 p-6 md:p-8">
        <h2 className="display text-xl">Catalog tiers</h2>
        <p className="body-copy mt-3 max-w-3xl text-[var(--ink-soft)]">
          <strong className="text-[var(--ink)]">{stats.curated.toLocaleString()}</strong> curated
          dossiers are hand-authored or world-catalog cases with public-record grounding.{" "}
          <strong className="text-[var(--ink)]">{stats.composite.toLocaleString()}</strong> composite
          dossiers are procedurally generated teaching records tagged{" "}
          <code className="text-sm">bulk-catalog</code> — use References and Overview disclaimers
          before citation.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/archive?catalogTier=curated" className="btn btn-primary text-sm">
            Browse curated
          </Link>
          <Link href="/archive?catalogTier=composite" className="btn btn-ghost text-sm">
            Browse composite
          </Link>
        </div>
      </section>

      </div>

      <div className="mt-10">
        <Disclaimer />
      </div>
    </div>
  );
}
