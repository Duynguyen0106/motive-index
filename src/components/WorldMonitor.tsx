"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { CaseWorldMap, MonitorCaseCard } from "@/components/CaseWorldMap";
import { COUNTRY_LABELS, resolveCaseCountry } from "@/lib/country";
import type { MonitorPayload } from "@/lib/monitor";
import type { CountryCode, CrimeCategory, CrimeCase, LiveUpdate, SearchFilters } from "@/lib/types";
import { CRIME_CATEGORY_LABELS } from "@/lib/types";
import { formatDate } from "@/lib/utils";

type Props = {
  initial: MonitorPayload;
};

function filtersToQuery(filters: SearchFilters): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v) p.set(k, String(v));
  }
  return p.toString();
}

export function WorldMonitor({ initial }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [data, setData] = useState(initial);
  const [selectedCaseId, setSelectedCaseId] = useState<string>("");
  const [liveStatus, setLiveStatus] = useState<"live" | "syncing">("live");

  const filters = data.filters;
  const countryOptions = data.countryOptions;

  const selectedPin = data.pins.find((p) => p.id === selectedCaseId);

  const applyFilters = useCallback(
    (next: Partial<SearchFilters>) => {
      const merged = { ...filters, ...next };
      const qs = filtersToQuery(merged);
      startTransition(() => {
        router.replace(qs ? `/monitor?${qs}` : "/monitor", { scroll: false });
      });
    },
    [filters, router],
  );

  useEffect(() => {
    setData(initial);
  }, [initial]);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        setLiveStatus("syncing");
        const qs = searchParams.toString();
        const res = await fetch(qs ? `/api/monitor?${qs}` : "/api/monitor", {
          cache: "no-store",
        });
        if (!res.ok) return;
        const json = (await res.json()) as MonitorPayload;
        if (!cancelled) {
          setData(json);
          setLiveStatus("live");
        }
      } catch {
        if (!cancelled) setLiveStatus("live");
      }
    }

    const id = window.setInterval(poll, 30000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [searchParams]);

  return (
    <div className="monitor-dashboard">
      <header className="monitor-header">
        <div>
          <p className="label">Live monitor</p>
          <h1 className="display text-3xl text-[var(--ink)] md:text-4xl">World crime monitor</h1>
          <p className="body-copy mt-2 max-w-2xl text-[var(--ink-soft)]">
            Track forensic cases on a world map. Filters update the map, country index, and live
            signal feed — same data as the archive, plotted by jurisdiction.
          </p>
        </div>
        <div className="monitor-status">
          <span className={`monitor-live-dot ${liveStatus === "syncing" ? "is-syncing" : ""}`} />
          <span className="text-sm text-[var(--muted)]">
            {liveStatus === "syncing" ? "Syncing…" : "Live"} · {data.filteredCount} of{" "}
            {data.totalCases} cases
          </span>
        </div>
      </header>

      <div className="monitor-layout">
        <section className="monitor-map-panel">
          <CaseWorldMap
            pins={data.pins}
            selectedCountry={filters.country ?? ""}
            selectedCaseId={selectedCaseId}
            onSelectCountry={(code) => applyFilters({ country: code })}
            onSelectCase={setSelectedCaseId}
          />
          {selectedPin ? (
            <MonitorCaseCard pin={selectedPin} onClose={() => setSelectedCaseId("")} />
          ) : null}
        </section>

        <aside className="monitor-sidebar">
          <form
            className="monitor-filters"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              applyFilters({
                q: String(fd.get("q") ?? ""),
                country: String(fd.get("country") ?? "") as CountryCode | "",
                crimeCategory: String(fd.get("crimeCategory") ?? "") as CrimeCategory | "",
                status: String(fd.get("status") ?? "") as SearchFilters["status"],
                period: String(fd.get("period") ?? ""),
              });
            }}
          >
            <p className="label mb-3">Filters</p>
            <label className="monitor-field">
              <span>Keyword</span>
              <input name="q" defaultValue={filters.q} placeholder="Name, motif…" className="field" />
            </label>
            <label className="monitor-field">
              <span>Country</span>
              <select name="country" defaultValue={filters.country ?? ""} className="field">
                <option value="">All countries</option>
                {countryOptions.map((code) => (
                  <option key={code} value={code}>
                    {COUNTRY_LABELS[code]}
                  </option>
                ))}
              </select>
            </label>
            <label className="monitor-field">
              <span>Crime category</span>
              <select
                name="crimeCategory"
                defaultValue={filters.crimeCategory ?? ""}
                className="field"
              >
                <option value="">Any</option>
                {(Object.keys(CRIME_CATEGORY_LABELS) as CrimeCategory[]).map((k) => (
                  <option key={k} value={k}>
                    {CRIME_CATEGORY_LABELS[k]}
                  </option>
                ))}
              </select>
            </label>
            <label className="monitor-field">
              <span>Status</span>
              <select name="status" defaultValue={filters.status ?? ""} className="field">
                <option value="">Any</option>
                <option value="closed">Closed</option>
                <option value="unsolved">Unsolved</option>
                <option value="historical">Historical</option>
              </select>
            </label>
            <label className="monitor-field">
              <span>Period / year</span>
              <input name="period" defaultValue={filters.period} placeholder="e.g. 1970s" className="field" />
            </label>
            <div className="flex gap-2 pt-1">
              <button type="submit" className="btn btn-primary flex-1 text-sm">
                Apply
              </button>
              <Link href="/monitor" className="btn btn-ghost text-sm">
                Reset
              </Link>
            </div>
          </form>

          <section className="monitor-panel">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="display text-lg">Country index</h2>
              <span className="text-xs text-[var(--muted)]">{data.countryStats.length} regions</span>
            </div>
            <ul className="monitor-country-index mt-3">
              {data.countryStats.map((s) => (
                <li key={s.code}>
                  <button
                    type="button"
                    className={`monitor-country-row ${filters.country === s.code ? "is-active" : ""}`}
                    onClick={() =>
                      applyFilters({ country: filters.country === s.code ? "" : s.code })
                    }
                  >
                    <span className="monitor-country-code">{s.code}</span>
                    <span className="flex-1 text-left">
                      <span className="block text-sm font-medium">{s.label}</span>
                      <span className="block text-xs text-[var(--muted)] line-clamp-1">
                        {s.categories.slice(0, 2).join(" · ") || "—"}
                      </span>
                    </span>
                    <span className="monitor-country-count">{s.caseCount}</span>
                    {s.unsolvedCount ? (
                      <span className="monitor-unsolved-badge">{s.unsolvedCount} open</span>
                    ) : null}
                  </button>
                </li>
              ))}
              {!data.countryStats.length ? (
                <li className="text-sm text-[var(--muted)]">No cases match these filters.</li>
              ) : null}
            </ul>
          </section>

          <section className="monitor-panel">
            <h2 className="display text-lg">Filtered cases</h2>
            <ul className="monitor-case-list mt-3">
              {data.cases.slice(0, 8).map((c: CrimeCase) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className={`monitor-case-row ${selectedCaseId === c.id ? "is-active" : ""}`}
                    onClick={() => setSelectedCaseId(c.id)}
                  >
                    <span className="text-xs tabular-nums text-[var(--muted)]">{c.yearStart}</span>
                    <span className="flex-1 text-left">
                      <span className="block text-sm font-medium">{c.name}</span>
                      <span className="block text-xs text-[var(--muted)]">
                        {COUNTRY_LABELS[resolveCaseCountry(c)]}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="monitor-panel">
            <h2 className="display text-lg">Live signals</h2>
            <ul className="monitor-feed mt-3">
              {data.updates.map((u: LiveUpdate) => (
                <li key={u.id} className="monitor-feed-item">
                  <time className="text-xs tabular-nums text-[var(--muted)]">
                    {formatDate(u.createdAt)}
                  </time>
                  <span className="label normal-case text-[10px]">{u.kind.replaceAll("_", " ")}</span>
                  {u.caseSlug ? (
                    <Link href={`/cases/${u.caseSlug}`} className="text-link text-sm leading-snug">
                      {u.headline}
                    </Link>
                  ) : (
                    <p className="text-sm text-[var(--ink-soft)]">{u.headline}</p>
                  )}
                </li>
              ))}
              {!data.updates.length ? (
                <li className="text-sm text-[var(--muted)]">No recent updates.</li>
              ) : null}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
