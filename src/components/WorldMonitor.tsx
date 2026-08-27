"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { CaseWorldMap, MonitorCaseCard } from "@/components/CaseWorldMap";
import { COUNTRY_LABELS, resolveCaseCountry } from "@/lib/country";
import type { MonitorPayload } from "@/lib/monitor";
import type { CountryCode, CrimeCategory, CrimeCase, LiveUpdate, SearchFilters } from "@/lib/types";
import { CRIME_CATEGORY_LABELS } from "@/lib/types";
import { formatDate } from "@/lib/utils";

type Props = { initial: MonitorPayload };
type SidebarTab = "overview" | "cases" | "signals";

function filtersToQuery(filters: SearchFilters): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v) p.set(k, String(v));
  }
  return p.toString();
}

function activeFilterCount(filters: SearchFilters): number {
  return Object.values(filters).filter(Boolean).length;
}

export function WorldMonitor({ initial }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [data, setData] = useState(initial);
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [liveStatus, setLiveStatus] = useState<"live" | "syncing">("live");
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("overview");
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [keyword, setKeyword] = useState(initial.filters.q ?? "");

  const filters = data.filters;
  const countryOptions = data.countryOptions;
  const selectedPin = data.pins.find((p) => p.id === selectedCaseId);
  const unsolvedCount = useMemo(
    () => data.cases.filter((c) => c.status === "unsolved").length,
    [data.cases],
  );

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

  const clearFilter = useCallback(
    (key: keyof SearchFilters) => {
      applyFilters({ [key]: "" });
      if (key === "q") setKeyword("");
    },
    [applyFilters],
  );

  useEffect(() => {
    setData(initial);
    setKeyword(initial.filters.q ?? "");
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

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSelectedCaseId("");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="monitor-dashboard">
      <header className="monitor-hero">
        <div className="monitor-hero-main">
          <p className="label">Live intelligence · forensic archive</p>
          <h1 className="display monitor-title">World crime monitor</h1>
          <p className="monitor-lede">
            Plot cases on an official OpenStreetMap basemap. Pan, zoom, and filter by country,
            category, or period — the index and signal feed update in sync.
          </p>
        </div>
        <div className="monitor-hero-meta">
          <div className="monitor-live-badge">
            <span className={`monitor-live-dot ${liveStatus === "syncing" ? "is-syncing" : ""}`} />
            {liveStatus === "syncing" ? "Syncing" : "Live"}
          </div>
          <p className="text-xs text-[var(--muted)]">
            Updated {formatDate(data.generatedAt)}
          </p>
        </div>
      </header>

      <div className="monitor-stats">
        <div className="monitor-stat">
          <span className="monitor-stat-value">{data.filteredCount}</span>
          <span className="monitor-stat-label">Cases shown</span>
        </div>
        <div className="monitor-stat">
          <span className="monitor-stat-value">{data.pins.length}</span>
          <span className="monitor-stat-label">On map</span>
        </div>
        <div className="monitor-stat">
          <span className="monitor-stat-value">{data.countryStats.length}</span>
          <span className="monitor-stat-label">Regions</span>
        </div>
        <div className="monitor-stat monitor-stat-alert">
          <span className="monitor-stat-value">{unsolvedCount}</span>
          <span className="monitor-stat-label">Unsolved</span>
        </div>
      </div>

      {activeFilterCount(filters) > 0 ? (
        <div className="monitor-chips" aria-label="Active filters">
          {filters.q ? (
            <button type="button" className="monitor-chip" onClick={() => clearFilter("q")}>
              Keyword: {filters.q} <span aria-hidden>×</span>
            </button>
          ) : null}
          {filters.country ? (
            <button type="button" className="monitor-chip" onClick={() => clearFilter("country")}>
              {COUNTRY_LABELS[filters.country as CountryCode]} <span aria-hidden>×</span>
            </button>
          ) : null}
          {filters.crimeCategory ? (
            <button
              type="button"
              className="monitor-chip"
              onClick={() => clearFilter("crimeCategory")}
            >
              {CRIME_CATEGORY_LABELS[filters.crimeCategory as CrimeCategory]}{" "}
              <span aria-hidden>×</span>
            </button>
          ) : null}
          {filters.status ? (
            <button type="button" className="monitor-chip" onClick={() => clearFilter("status")}>
              {filters.status} <span aria-hidden>×</span>
            </button>
          ) : null}
          {filters.period ? (
            <button type="button" className="monitor-chip" onClick={() => clearFilter("period")}>
              {filters.period} <span aria-hidden>×</span>
            </button>
          ) : null}
          <Link href="/monitor" className="monitor-chip monitor-chip-clear">
            Clear all
          </Link>
        </div>
      ) : null}

      <div className="monitor-layout">
        <section className="monitor-map-panel">
          <div className="monitor-map-header">
            <h2 className="display text-lg">Global map</h2>
            <span className="text-xs text-[var(--muted)]">
              {data.pins.length ? `${data.pins.length} markers` : "No markers for current filters"}
            </span>
          </div>
          <CaseWorldMap
            pins={data.pins}
            selectedCountry={filters.country ?? ""}
            selectedCaseId={selectedCaseId}
            onSelectCountry={(code) => applyFilters({ country: code })}
            onSelectCase={(id) => {
              setSelectedCaseId(id);
              setSidebarTab("cases");
            }}
          />
          {selectedPin ? (
            <MonitorCaseCard pin={selectedPin} onClose={() => setSelectedCaseId("")} />
          ) : null}
          {!data.pins.length ? (
            <div className="monitor-map-empty">
              <p className="display text-lg">No cases to plot</p>
              <p className="mt-1 text-sm text-[var(--ink-soft)]">
                Try clearing filters or choose a different country.
              </p>
              <Link href="/monitor" className="btn btn-ghost mt-3 text-sm">
                Reset filters
              </Link>
            </div>
          ) : null}
        </section>

        <aside className="monitor-sidebar">
          <div className="monitor-tabs" role="tablist">
            {(
              [
                ["overview", "Overview"],
                ["cases", `Cases (${data.cases.length})`],
                ["signals", "Signals"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={sidebarTab === id}
                className={`monitor-tab ${sidebarTab === id ? "is-active" : ""}`}
                onClick={() => setSidebarTab(id)}
              >
                {label}
              </button>
            ))}
          </div>

          {sidebarTab === "overview" ? (
            <>
              <section className="monitor-panel">
                <button
                  type="button"
                  className="monitor-panel-toggle"
                  onClick={() => setFiltersOpen((v) => !v)}
                  aria-expanded={filtersOpen}
                >
                  <span className="display text-base">Filters</span>
                  <span className="text-xs text-[var(--muted)]">{filtersOpen ? "Hide" : "Show"}</span>
                </button>
                {filtersOpen ? (
                  <form
                    className="monitor-filters-form mt-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      applyFilters({ q: keyword });
                    }}
                  >
                    <label className="monitor-field">
                      <span>Keyword</span>
                      <input
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        placeholder="Name, place, motif…"
                        className="field"
                      />
                    </label>
                    <label className="monitor-field">
                      <span>Country</span>
                      <select
                        value={filters.country ?? ""}
                        onChange={(e) =>
                          applyFilters({ country: e.target.value as CountryCode | "" })
                        }
                        className="field"
                      >
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
                        value={filters.crimeCategory ?? ""}
                        onChange={(e) =>
                          applyFilters({ crimeCategory: e.target.value as CrimeCategory | "" })
                        }
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
                      <select
                        value={filters.status ?? ""}
                        onChange={(e) =>
                          applyFilters({ status: e.target.value as SearchFilters["status"] })
                        }
                        className="field"
                      >
                        <option value="">Any</option>
                        <option value="closed">Closed</option>
                        <option value="unsolved">Unsolved</option>
                        <option value="historical">Historical</option>
                      </select>
                    </label>
                    <label className="monitor-field">
                      <span>Period / year</span>
                      <input
                        value={filters.period ?? ""}
                        onChange={(e) => applyFilters({ period: e.target.value })}
                        placeholder="e.g. 1970s"
                        className="field"
                      />
                    </label>
                    <button type="submit" className="btn btn-primary w-full text-sm">
                      Search keyword
                    </button>
                  </form>
                ) : null}
              </section>

              <section className="monitor-panel">
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="display text-base">Country index</h2>
                  <span className="text-xs text-[var(--muted)]">by case count</span>
                </div>
                <ul className="monitor-country-index mt-3">
                  {data.countryStats.map((s) => {
                    const max = data.countryStats[0]?.caseCount ?? 1;
                    const pct = Math.round((s.caseCount / max) * 100);
                    const active = filters.country === s.code;
                    return (
                      <li key={s.code}>
                        <button
                          type="button"
                          className={`monitor-country-row ${active ? "is-active" : ""}`}
                          onClick={() =>
                            applyFilters({ country: active ? "" : s.code })
                          }
                        >
                          <span className="monitor-country-code">{s.code}</span>
                          <span className="monitor-country-body">
                            <span className="flex items-baseline justify-between gap-2">
                              <span className="text-sm font-medium">{s.label}</span>
                              <span className="monitor-country-count">{s.caseCount}</span>
                            </span>
                            <span className="monitor-country-bar" aria-hidden>
                              <span className="monitor-country-bar-fill" style={{ width: `${pct}%` }} />
                            </span>
                            <span className="text-xs text-[var(--muted)] line-clamp-1">
                              {s.categories.slice(0, 2).join(" · ") || "—"}
                              {s.unsolvedCount ? ` · ${s.unsolvedCount} unsolved` : ""}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                  {!data.countryStats.length ? (
                    <li className="text-sm text-[var(--muted)]">No regions match.</li>
                  ) : null}
                </ul>
              </section>
            </>
          ) : null}

          {sidebarTab === "cases" ? (
            <section className="monitor-panel monitor-panel-scroll">
              <h2 className="display text-base">Filtered dossiers</h2>
              <ul className="monitor-case-list mt-3">
                {data.cases.map((c: CrimeCase) => {
                  const pin = data.pins.find((p) => p.id === c.id);
                  const active = selectedCaseId === c.id;
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        className={`monitor-case-row ${active ? "is-active" : ""}`}
                        onClick={() => setSelectedCaseId(c.id)}
                      >
                        <span className="monitor-case-year">{c.yearStart}</span>
                        <span className="monitor-case-body">
                          <span className="flex items-center gap-2">
                            <span className="text-sm font-medium">{c.name}</span>
                            {c.status === "unsolved" ? (
                              <span className="monitor-pill monitor-pill-open">open</span>
                            ) : null}
                          </span>
                          <span className="text-xs text-[var(--muted)]">
                            {COUNTRY_LABELS[resolveCaseCountry(c)]} ·{" "}
                            {c.crimeCategories
                              .slice(0, 2)
                              .map((x) => CRIME_CATEGORY_LABELS[x])
                              .join(" · ")}
                          </span>
                        </span>
                        {pin ? <span className="monitor-case-pin" title="Plotted on map" /> : null}
                      </button>
                    </li>
                  );
                })}
                {!data.cases.length ? (
                  <li className="py-6 text-center text-sm text-[var(--muted)]">
                    No cases match. Adjust filters in Overview.
                  </li>
                ) : null}
              </ul>
            </section>
          ) : null}

          {sidebarTab === "signals" ? (
            <section className="monitor-panel monitor-panel-scroll">
              <h2 className="display text-base">Live signals</h2>
              <p className="mt-1 text-xs text-[var(--muted)]">Refreshes every 30 seconds</p>
              <ul className="monitor-feed mt-4">
                {data.updates.map((u: LiveUpdate) => (
                  <li key={u.id} className="monitor-feed-item">
                    <time className="monitor-feed-time">{formatDate(u.createdAt)}</time>
                    <span className="monitor-feed-kind">{u.kind.replaceAll("_", " ")}</span>
                    {u.caseSlug ? (
                      <Link href={`/cases/${u.caseSlug}`} className="monitor-feed-link">
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
          ) : null}
        </aside>
      </div>
    </div>
  );
}
