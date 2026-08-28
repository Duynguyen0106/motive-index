"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type KeyboardEvent as ReactKeyboardEvent,
  type RefObject,
} from "react";
import { CaseWorldMap, MonitorCaseCard } from "@/components/CaseWorldMap";
import { MonitorCountryPicker } from "@/components/MonitorCountryPicker";
import { WorldNewsFeed } from "@/components/WorldNewsFeed";
import { QuickLinks } from "@/components/ui";
import { COUNTRY_LABELS, resolveCaseCountry } from "@/lib/country";
import { searchUrlFromFilters } from "@/lib/search";
import type { MonitorPayload } from "@/lib/monitor";
import type { CountryCode, CrimeCategory, CrimeCase, LiveUpdate, SearchFilters } from "@/lib/types";
import { CRIME_CATEGORY_LABELS } from "@/lib/types";
import { formatDate } from "@/lib/utils";

type Props = { initial: MonitorPayload };
type SidebarTab = "overview" | "cases" | "news" | "signals";

const TAB_IDS: SidebarTab[] = ["overview", "cases", "news", "signals"];

function parseSidebarTab(value: string | null): SidebarTab {
  if (value && TAB_IDS.includes(value as SidebarTab)) return value as SidebarTab;
  return "overview";
}

function buildMonitorQuery(
  filters: SearchFilters,
  opts?: { caseSlug?: string; tab?: SidebarTab },
): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v) p.set(k, String(v));
  }
  if (opts?.caseSlug) p.set("case", opts.caseSlug);
  if (opts?.tab && opts.tab !== "overview") p.set("tab", opts.tab);
  return p.toString();
}

function activeFilterCount(filters: SearchFilters): number {
  return Object.values(filters).filter(Boolean).length;
}

function caseIdFromSlug(cases: CrimeCase[], slug: string): string {
  return cases.find((c) => c.slug === slug || c.id === slug)?.id ?? "";
}

export function WorldMonitor({ initial }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [data, setData] = useState(initial);
  const [selectedCaseId, setSelectedCaseId] = useState(() => {
    const slug = searchParams.get("case") ?? "";
    return caseIdFromSlug(initial.cases, slug);
  });
  const [liveStatus, setLiveStatus] = useState<"live" | "syncing">("live");
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>(() =>
    parseSidebarTab(searchParams.get("tab")),
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobileLayout, setIsMobileLayout] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [showAllCountries, setShowAllCountries] = useState(false);
  const [keyword, setKeyword] = useState(initial.filters.q ?? "");
  const [mountedAt] = useState(() => Date.now());
  const caseCardRef = useRef<HTMLDivElement>(null);
  const keywordDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filters = data.filters;
  const countryOptions = data.countryOptions;
  const selectedPin = data.pins.find((p) => p.id === selectedCaseId);
  const selectedCase = data.cases.find((c) => c.id === selectedCaseId);
  const unsolvedCount = useMemo(
    () => data.cases.filter((c) => c.status === "unsolved").length,
    [data.cases],
  );
  const unplottedCount = data.unplottedCases.length;
  const topCountries = data.countryStats.slice(0, 5);
  const visibleCountryStats = showAllCountries
    ? data.countryStats
    : data.countryStats.slice(0, 8);

  const applyFilters = useCallback(
    (next: Partial<SearchFilters>, caseId?: string) => {
      const merged = { ...filters, ...next };
      const slug = caseId
        ? data.cases.find((c) => c.id === caseId)?.slug ?? caseId
        : selectedCaseId
          ? data.cases.find((c) => c.id === selectedCaseId)?.slug
          : undefined;
      const qs = buildMonitorQuery(merged, { caseSlug: slug, tab: sidebarTab });
      startTransition(() => {
        router.replace(qs ? `/?${qs}` : "/", { scroll: false });
      });
    },
    [filters, router, selectedCaseId, sidebarTab, data.cases],
  );

  const syncMonitorUrl = useCallback(
    (opts?: { caseId?: string; tab?: SidebarTab; clearCase?: boolean }) => {
      const slug = opts?.clearCase
        ? undefined
        : opts?.caseId
          ? data.cases.find((c) => c.id === opts.caseId)?.slug
          : selectedCaseId
            ? data.cases.find((c) => c.id === selectedCaseId)?.slug
            : undefined;
      const tab = opts?.tab ?? sidebarTab;
      const qs = buildMonitorQuery(filters, { caseSlug: slug, tab });
      startTransition(() => {
        router.replace(qs ? `/?${qs}` : "/", { scroll: false });
      });
    },
    [data.cases, filters, router, selectedCaseId, sidebarTab],
  );

  const selectTab = useCallback(
    (tab: SidebarTab) => {
      setSidebarTab(tab);
      if (isMobileLayout) setSidebarOpen(true);
      syncMonitorUrl({ tab });
    },
    [isMobileLayout, syncMonitorUrl],
  );

  const selectCase = useCallback(
    (id: string, opts?: { switchTab?: boolean; syncUrl?: boolean }) => {
      setSelectedCaseId(id);
      const nextTab = opts?.switchTab !== false ? ("cases" as SidebarTab) : sidebarTab;
      if (opts?.switchTab !== false) {
        setSidebarTab("cases");
        if (isMobileLayout) setSidebarOpen(true);
      }
      if (opts?.syncUrl !== false && id) {
        const slug = data.cases.find((c) => c.id === id)?.slug;
        if (slug) {
          const qs = buildMonitorQuery(filters, { caseSlug: slug, tab: nextTab });
          startTransition(() => {
            router.replace(`/?${qs}`, { scroll: false });
          });
        }
      }
      if (!id) {
        const qs = buildMonitorQuery(filters, { tab: sidebarTab });
        startTransition(() => {
          router.replace(qs ? `/?${qs}` : "/", { scroll: false });
        });
      }
    },
    [data.cases, filters, router, sidebarTab, isMobileLayout],
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
    const slug = searchParams.get("case") ?? "";
    if (slug) {
      const id = caseIdFromSlug(initial.cases, slug);
      if (id) setSelectedCaseId(id);
    }
    setSidebarTab(parseSidebarTab(searchParams.get("tab")));
  }, [initial, searchParams]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const update = () => {
      const mobile = mq.matches;
      setIsMobileLayout(mobile);
      if (!mobile) setSidebarOpen(true);
    };
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Debounced keyword search
  useEffect(() => {
    if (keyword === (filters.q ?? "")) return;
    if (keywordDebounceRef.current) clearTimeout(keywordDebounceRef.current);
    keywordDebounceRef.current = setTimeout(() => {
      applyFilters({ q: keyword });
    }, 400);
    return () => {
      if (keywordDebounceRef.current) clearTimeout(keywordDebounceRef.current);
    };
  }, [keyword, filters.q, applyFilters]);

  // Poll for updates — skip first tick if SSR data is fresh
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

    const ageMs = Date.now() - mountedAt;
    const initialDelay = ageMs < 25000 ? 30000 - ageMs : 0;
    let intervalId: number | undefined;

    const timeoutId = window.setTimeout(() => {
      void poll();
      intervalId = window.setInterval(poll, 30000);
    }, initialDelay);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [searchParams, mountedAt]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") selectCase("");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectCase]);

  // Scroll case card into view on mobile when selected
  useEffect(() => {
    if (!selectedCaseId || !caseCardRef.current) return;
    if (window.matchMedia("(max-width: 1023px)").matches) {
      caseCardRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selectedCaseId]);

  function handleTabKey(e: ReactKeyboardEvent<HTMLButtonElement>, tab: SidebarTab) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const idx = TAB_IDS.indexOf(tab);
    const next =
      e.key === "ArrowRight"
        ? (idx + 1) % TAB_IDS.length
        : (idx - 1 + TAB_IDS.length) % TAB_IDS.length;
    selectTab(TAB_IDS[next]);
  }

  const sidebarTabLabels: Record<SidebarTab, string> = {
    overview: "Overview",
    cases: `Cases (${data.cases.length})`,
    news: `News (${data.worldNews.items.length})`,
    signals: "Signals",
  };

  return (
    <div className={`monitor-dashboard ${isPending ? "is-loading" : ""}`}>
      <div className="monitor-top">
      <header className="monitor-hero">
        <div className="monitor-hero-main">
          <p className="label">Live intelligence · forensic archive</p>
          <h1 className="display monitor-title">World crime monitor</h1>
          <p className="monitor-lede">
            Live global crime map with {data.totalCases} archived dossiers, regional news feeds in
            English, and forensic filters — click clusters to drill down.
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

      {data.featuredCase ? (
        <div className="monitor-discovery">
          <p className="label mb-0">Featured dossier</p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <div>
              <Link
                href={`/cases/${data.featuredCase.slug}`}
                className="display text-lg text-[var(--ink)] hover:text-[var(--accent)]"
              >
                {data.featuredCase.name}
              </Link>
              <p className="mt-1 text-sm text-[var(--muted)] line-clamp-1">
                {data.featuredCase.subtitle}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              <Link href={`/?case=${data.featuredCase.slug}`} className="btn btn-ghost text-xs">
                Plot on map
              </Link>
              <Link href="/archive" className="btn btn-ghost text-xs">
                Full archive
              </Link>
              <Link href="/live" className="btn btn-ghost text-xs">
                World news
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      <div className="monitor-stats">
        <div className="monitor-stat">
          <span className="monitor-stat-value">{data.filteredCount}</span>
          <span className="monitor-stat-label">Cases shown</span>
        </div>
        <div className="monitor-stat">
          <span className="monitor-stat-value">{data.plottedCount}</span>
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

      <QuickLinks
        className="monitor-quick-links"
        links={[
          { href: "/archive", label: "Full archive" },
          { href: "/search", label: "Advanced search" },
          { href: "/live", label: "World news" },
          { href: "/search?status=unsolved", label: "Unsolved dossiers" },
        ]}
      />

      {unplottedCount > 0 ? (
        <div className="monitor-notice" role="status">
          <p className="text-sm text-[var(--ink-soft)]">
            <strong>{unplottedCount}</strong> filtered{" "}
            {unplottedCount === 1 ? "case lacks" : "cases lack"} map coordinates
            {unplottedCount <= 4
              ? `: ${data.unplottedCases.map((c) => c.name).join(", ")}`
              : ""}
            .{" "}
            <Link href="/search" className="text-[var(--accent)] hover:underline">
              Search full archive
            </Link>
          </p>
        </div>
      ) : null}

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
          <Link href="/" className="monitor-chip monitor-chip-clear">
            Clear all
          </Link>
        </div>
      ) : null}
      </div>

      <div className="monitor-workspace">
      <div className="monitor-layout">
        <section className="monitor-map-panel">
          {isPending ? <div className="monitor-map-loading" aria-hidden /> : null}
          <div className="monitor-map-header">
            <h2 className="display text-lg">Global map</h2>
            <span className="text-xs text-[var(--muted)]">
              {data.pins.length
                ? `${data.pins.length} cases · zoom in to expand clusters`
                : "No markers for current filters"}
            </span>
          </div>
          <CaseWorldMap
            pins={data.pins}
            selectedCountry={filters.country ?? ""}
            selectedCaseId={selectedCaseId}
            onSelectCountry={(code) => applyFilters({ country: code })}
            onSelectCase={(id) => selectCase(id)}
          />
          {selectedPin ? (
            <MonitorCaseCard
              pin={selectedPin}
              onClose={() => selectCase("")}
              cardRef={caseCardRef as RefObject<HTMLDivElement | null>}
            />
          ) : null}
          {!data.pins.length ? (
            <div className="monitor-map-empty">
              <p className="display text-lg">No cases to plot</p>
              <p className="mt-1 text-sm text-[var(--ink-soft)]">
                Try clearing filters or choose a different country.
              </p>
              <Link href="/" className="btn btn-ghost mt-3 text-sm">
                Reset filters
              </Link>
            </div>
          ) : null}
        </section>

        {isMobileLayout ? (
          <button
            type="button"
            className="monitor-sidebar-fab"
            aria-expanded={sidebarOpen}
            aria-controls="monitor-sidebar"
            onClick={() => setSidebarOpen((open) => !open)}
          >
            {sidebarOpen ? "Hide panels" : `Show ${sidebarTabLabels[sidebarTab]}`}
          </button>
        ) : null}

        <aside
          id="monitor-sidebar"
          className={`monitor-sidebar ${isMobileLayout && !sidebarOpen ? "is-collapsed" : ""}`}
        >
          <div className="monitor-tabs" role="tablist" aria-label="Monitor panels">
            {TAB_IDS.map((id) => (
              <button
                key={id}
                type="button"
                role="tab"
                id={`monitor-tab-${id}`}
                aria-selected={sidebarTab === id}
                aria-controls={`monitor-panel-${id}`}
                tabIndex={sidebarTab === id ? 0 : -1}
                className={`monitor-tab ${sidebarTab === id ? "is-active" : ""}`}
                onClick={() => selectTab(id)}
                onKeyDown={(e) => handleTabKey(e, id)}
              >
                {sidebarTabLabels[id]}
              </button>
            ))}
          </div>

          {sidebarTab === "overview" ? (
            <div
              id="monitor-panel-overview"
              role="tabpanel"
              aria-labelledby="monitor-tab-overview"
              className="monitor-panel monitor-panel-scroll monitor-overview-panel"
            >
              <section className="monitor-panel-section">
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
                  <div className="monitor-filters-form mt-3">
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
                      <MonitorCountryPicker
                        value={(filters.country as CountryCode) ?? ""}
                        options={countryOptions}
                        onChange={(code) => applyFilters({ country: code })}
                      />
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
                    <p className="text-xs text-[var(--muted)]">
                      Keyword search updates as you type.{" "}
                      <Link
                        href={searchUrlFromFilters(filters)}
                        className="text-[var(--accent)] hover:underline"
                      >
                        Advanced filters →
                      </Link>
                    </p>
                  </div>
                ) : null}
                <div className="monitor-quick-filters mt-4 border-t border-[var(--line)] pt-4">
                  <p className="text-xs font-semibold tracking-[0.08em] text-[var(--muted)] uppercase">
                    Quick filters
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="monitor-chip"
                      onClick={() => applyFilters({ status: "unsolved", country: "", crimeCategory: "" })}
                    >
                      Unsolved
                    </button>
                    {topCountries.map((s) => (
                      <button
                        key={s.code}
                        type="button"
                        className={`monitor-chip ${filters.country === s.code ? "is-active" : ""}`}
                        onClick={() =>
                          applyFilters({
                            country: filters.country === s.code ? "" : s.code,
                            status: "",
                            crimeCategory: "",
                          })
                        }
                      >
                        {s.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="monitor-chip"
                      onClick={() =>
                        applyFilters({ crimeCategory: "serial_murder", status: "", country: "" })
                      }
                    >
                      Serial murder
                    </button>
                    <button type="button" className="monitor-chip" onClick={() => selectTab("news")}>
                      Live news
                    </button>
                  </div>
                </div>
              </section>

              <section className="monitor-panel-section">
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="display text-base">Top regions</h2>
                  <span className="text-xs text-[var(--muted)]">by case count</span>
                </div>
                <ul className="monitor-country-index mt-3">
                  {visibleCountryStats.map((s) => {
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
                {data.countryStats.length > 8 ? (
                  <button
                    type="button"
                    className="monitor-show-more mt-3 text-xs font-medium text-[var(--accent)] hover:underline"
                    onClick={() => setShowAllCountries((v) => !v)}
                  >
                    {showAllCountries
                      ? "Show fewer regions"
                      : `Show all ${data.countryStats.length} regions`}
                  </button>
                ) : null}
              </section>
            </div>
          ) : null}

          {sidebarTab === "cases" ? (
            <section
              id="monitor-panel-cases"
              role="tabpanel"
              aria-labelledby="monitor-tab-cases"
              className="monitor-panel monitor-panel-scroll"
            >
              <h2 className="display text-base">Filtered dossiers</h2>
              <ul className="monitor-case-list mt-3">
                {data.cases.map((c: CrimeCase) => {
                  const pin = data.pins.find((p) => p.id === c.id);
                  const active = selectedCaseId === c.id;
                  const isTranslated = c.tags.includes("translated-en");
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        className={`monitor-case-row ${active ? "is-active" : ""}`}
                        onClick={() => selectCase(c.id, { syncUrl: true })}
                      >
                        <span className="monitor-case-year">{c.yearStart}</span>
                        <span className="monitor-case-body">
                          <span className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium">{c.name}</span>
                            {c.status === "unsolved" ? (
                              <span className="monitor-pill monitor-pill-open">open</span>
                            ) : null}
                            {isTranslated ? (
                              <span className="monitor-pill monitor-pill-lang">translated</span>
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
                        {pin ? (
                          <span className="monitor-case-pin" title="Plotted on map" />
                        ) : (
                          <span className="monitor-case-pin monitor-case-pin-off" title="No coordinates" />
                        )}
                      </button>
                      {active ? (
                        <Link
                          href={`/cases/${c.slug}`}
                          className="monitor-case-dossier-link"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Open dossier →
                        </Link>
                      ) : null}
                    </li>
                  );
                })}
                {!data.cases.length ? (
                  <li className="py-6 text-center text-sm text-[var(--muted)]">
                    No cases match. Adjust filters in Overview.
                  </li>
                ) : null}
              </ul>
              {selectedCase && !selectedPin ? (
                <div className="monitor-unplotted-card mt-4">
                  <p className="text-sm font-medium text-[var(--ink)]">{selectedCase.name}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    This case has no map coordinates.{" "}
                    <Link href={`/cases/${selectedCase.slug}`} className="text-[var(--accent)] hover:underline">
                      Open dossier
                    </Link>
                  </p>
                </div>
              ) : null}
            </section>
          ) : null}

          {sidebarTab === "news" ? (
            <section
              id="monitor-panel-news"
              role="tabpanel"
              aria-labelledby="monitor-tab-news"
              className="monitor-panel monitor-panel-scroll"
            >
              <h2 className="display text-base">World crime news</h2>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Live RSS from 17 regions · English summaries · original headlines preserved
              </p>
              <WorldNewsFeed
                initial={data.worldNews}
                countryFilter={filters.country ?? ""}
                onSelectCase={(slug) => {
                  const id = caseIdFromSlug(data.cases, slug);
                  if (id) selectCase(id, { switchTab: true });
                  else window.open(`/cases/${slug}`, "_blank");
                }}
              />
            </section>
          ) : null}

          {sidebarTab === "signals" ? (
            <section
              id="monitor-panel-signals"
              role="tabpanel"
              aria-labelledby="monitor-tab-signals"
              className="monitor-panel monitor-panel-scroll"
            >
              <h2 className="display text-base">Live signals</h2>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Refreshes every 30 seconds ·{" "}
                <Link href="/live" className="text-[var(--accent)] hover:underline">
                  Full feed
                </Link>
              </p>
              <ul className="monitor-feed mt-4">
                {data.updates.map((u: LiveUpdate) => (
                  <li key={u.id} className="monitor-feed-item">
                    <time className="monitor-feed-time">{formatDate(u.createdAt)}</time>
                    <span className="monitor-feed-kind">{u.kind.replaceAll("_", " ")}</span>
                    {u.caseSlug ? (
                      <Link
                        href={`/?case=${u.caseSlug}`}
                        className="monitor-feed-link"
                        onClick={() => {
                          const id = caseIdFromSlug(data.cases, u.caseSlug!);
                          if (id) selectCase(id, { switchTab: true, syncUrl: false });
                        }}
                      >
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
    </div>
  );
}
