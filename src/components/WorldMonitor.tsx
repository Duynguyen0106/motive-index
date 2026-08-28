"use client";

import Link from "next/link";
import { OpenDossierLink } from "@/components/OpenDossierLink";
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
import { HotNewsTicker } from "@/components/HotNewsTicker";
import { MonitorComparePanel } from "@/components/MonitorComparePanel";
import { MonitorMapControls } from "@/components/MonitorMapControls";
import { MonitorSignalsPanel } from "@/components/MonitorSignalsPanel";
import { WorldNewsFeed } from "@/components/WorldNewsFeed";
import { EmptyState, QuickLinks } from "@/components/ui";
import { COUNTRY_LABELS, resolveCaseCountry } from "@/lib/country";
import { searchUrlFromFilters, paginateCases, DEFAULT_ARCHIVE_PAGE_SIZE } from "@/lib/search";
import { filterArchiveActivityUpdates } from "@/lib/liveUpdates";
import { parseNewsFilter, type NewsFeedFilter } from "@/lib/newsFeedUtils";
import type { MonitorDeltaPayload, MonitorPayload } from "@/lib/monitor";
import type { MonitorMapViewState, RegionPreset } from "@/lib/monitorMapTypes";
import { TIMELINE_YEAR_MAX, TIMELINE_YEAR_MIN } from "@/lib/monitorMapTypes";
import { exportCasesCsv, sidebarPinClasses } from "@/lib/monitorMapUtils";
import {
  buildCountryStatsFromPins,
  defaultMapViewFilters,
  filterVisiblePins,
  mapFiltersAffectPins,
  mapViewToSearchParams,
  parseMapViewFromSearchParams,
  type MapViewPreset,
} from "@/lib/monitorMapFilters";
import type { MonitorCaseSummary } from "@/lib/types";
import {
  CRIME_CATEGORY_LABELS,
  type CountryCode,
  type CrimeCategory,
  type SearchFilters,
} from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { WORLD_NEWS_FEED_COUNT } from "@/lib/worldNews";

type Props = { initial: MonitorPayload };
type SidebarTab = "overview" | "cases" | "news" | "signals";

const TAB_IDS: SidebarTab[] = ["overview", "cases", "news", "signals"];

function parseSidebarTab(value: string | null): SidebarTab {
  if (value && TAB_IDS.includes(value as SidebarTab)) return value as SidebarTab;
  return "overview";
}

function buildMonitorQuery(
  filters: SearchFilters,
  mapView: MonitorMapViewState,
  opts?: { caseSlug?: string; tab?: SidebarTab; newsFilter?: string; casesPage?: number },
): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v) p.set(k, String(v));
  }
  if (opts?.caseSlug) p.set("case", opts.caseSlug);
  if (opts?.tab && opts.tab !== "overview") p.set("tab", opts.tab);
  if (opts?.newsFilter && opts.newsFilter !== "all") p.set("newsFilter", opts.newsFilter);
  if (opts?.casesPage && opts.casesPage > 1) p.set("casesPage", String(opts.casesPage));
  return mapViewToSearchParams(mapView, p).toString();
}

function activeFilterCount(filters: SearchFilters): number {
  return Object.values(filters).filter(Boolean).length;
}

function caseIdFromSlug(cases: MonitorCaseSummary[], slug: string): string {
  return cases.find((c) => c.slug === slug || c.id === slug)?.id ?? "";
}

const MONITOR_CASES_PAGE_SIZE = DEFAULT_ARCHIVE_PAGE_SIZE;

export function WorldMonitor({ initial }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [data, setData] = useState(initial);
  const [selectedCaseId, setSelectedCaseId] = useState(() => {
    const slug = searchParams.get("case") ?? "";
    return caseIdFromSlug(initial.cases, slug);
  });
  const [liveStatus, setLiveStatus] = useState<"live" | "syncing" | "stale">("live");
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>(() =>
    parseSidebarTab(searchParams.get("tab")),
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobileLayout, setIsMobileLayout] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showAllCountries, setShowAllCountries] = useState(false);
  const [keyword, setKeyword] = useState(initial.filters.q ?? "");
  const [mapView, setMapView] = useState<MonitorMapViewState>(() =>
    parseMapViewFromSearchParams(searchParams, initial.filters.period ?? ""),
  );
  const [controlsCollapsed, setControlsCollapsed] = useState(true);
  const [shareCopied, setShareCopied] = useState(false);
  const [hoveredCaseId, setHoveredCaseId] = useState("");
  const [compareCaseId, setCompareCaseId] = useState("");
  const [compareMode, setCompareMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDrawingBbox, setIsDrawingBbox] = useState(false);
  const [regionFlyRequest, setRegionFlyRequest] = useState<RegionPreset | null>(null);
  const [isPlayingTimeline, setIsPlayingTimeline] = useState(false);
  const [casesMapVisibleOnly, setCasesMapVisibleOnly] = useState(false);
  const [casesPage, setCasesPage] = useState(() => {
    const raw = searchParams.get("casesPage");
    const n = raw ? parseInt(raw, 10) : 1;
    return Number.isFinite(n) && n > 0 ? n : 1;
  });
  const [newsFilter, setNewsFilter] = useState<NewsFeedFilter>(() =>
    parseNewsFilter(searchParams.get("newsFilter")),
  );
  const [mountedAt] = useState(() => Date.now());
  const caseCardRef = useRef<HTMLDivElement>(null);
  const caseRowRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const sidebarRef = useRef<HTMLElement>(null);
  const keywordDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const viewportDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filters = data.filters;
  const countryOptions = data.countryOptions;
  const selectedPin = data.pins.find((p) => p.id === selectedCaseId);
  const selectedCase = data.cases.find((c) => c.id === selectedCaseId);
  const comparePin = compareCaseId ? data.pins.find((p) => p.id === compareCaseId) : undefined;
  const visiblePins = useMemo(
    () => filterVisiblePins(data.pins, mapView),
    [data.pins, mapView],
  );
  const visibleUnsolved = useMemo(
    () => visiblePins.filter((p) => p.status === "unsolved").length,
    [visiblePins],
  );
  const visibleCaseIds = useMemo(
    () => new Set(visiblePins.map((p) => p.id)),
    [visiblePins],
  );
  const mapFiltersActive = useMemo(
    () => mapFiltersAffectPins(mapView) || visiblePins.length !== data.pins.length,
    [mapView, visiblePins.length, data.pins.length],
  );
  const choroplethStats = useMemo(
    () => (mapFiltersActive ? buildCountryStatsFromPins(visiblePins) : data.countryStats),
    [mapFiltersActive, visiblePins, data.countryStats],
  );
  const displayCases = useMemo(
    () =>
      casesMapVisibleOnly
        ? data.cases.filter((c) => visibleCaseIds.has(c.id))
        : data.cases,
    [casesMapVisibleOnly, data.cases, visibleCaseIds],
  );
  const paginatedCases = useMemo(
    () => paginateCases(displayCases, casesPage, MONITOR_CASES_PAGE_SIZE),
    [displayCases, casesPage],
  );
  const archiveActivityUpdates = useMemo(
    () => filterArchiveActivityUpdates(data.updates),
    [data.updates],
  );
  const pinsByCaseId = useMemo(
    () => new Map(data.pins.map((p) => [p.id, p])),
    [data.pins],
  );
  const slugToName = useMemo(
    () => Object.fromEntries(data.cases.map((c) => [c.slug, c.name])),
    [data.cases],
  );
  const unsolvedCount = useMemo(
    () => data.cases.filter((c) => c.status === "unsolved").length,
    [data.cases],
  );
  const unplottedCount = data.unplottedCases.length;
  const topCountries = data.countryStats.slice(0, 5);
  const visibleCountryStats = showAllCountries
    ? data.countryStats
    : data.countryStats.slice(0, 8);

  const syncUrl = useCallback(
    (
      nextFilters: SearchFilters,
      nextMapView: MonitorMapViewState,
      opts?: { caseSlug?: string; tab?: SidebarTab; newsFilter?: NewsFeedFilter; casesPage?: number },
    ) => {
      const qs = buildMonitorQuery(nextFilters, nextMapView, {
        caseSlug: opts?.caseSlug,
        tab: opts?.tab,
        newsFilter: opts?.newsFilter ?? newsFilter,
        casesPage: opts?.casesPage ?? casesPage,
      });
      startTransition(() => {
        router.replace(qs ? `/?${qs}` : "/", { scroll: false });
      });
    },
    [router, newsFilter, casesPage],
  );

  const updateMapView = useCallback(
    (patch: Partial<MonitorMapViewState>, opts?: { syncUrl?: boolean }) => {
      if (
        isPlayingTimeline &&
        (patch.timelineMinYear !== undefined || patch.timelineMaxYear !== undefined)
      ) {
        setIsPlayingTimeline(false);
      }
      const next = { ...mapView, ...patch };
      setMapView(next);
      if (opts?.syncUrl === false) return;
      const slug = selectedCaseId
        ? data.cases.find((c) => c.id === selectedCaseId)?.slug
        : undefined;
      syncUrl(filters, next, { caseSlug: slug, tab: sidebarTab });
    },
    [mapView, filters, selectedCaseId, sidebarTab, data.cases, syncUrl, isPlayingTimeline],
  );

  const applyFilters = useCallback(
    (next: Partial<SearchFilters>, caseId?: string) => {
      const merged = { ...filters, ...next };
      const slug = caseId
        ? data.cases.find((c) => c.id === caseId)?.slug ?? caseId
        : selectedCaseId
          ? data.cases.find((c) => c.id === selectedCaseId)?.slug
          : undefined;
      setCasesPage(1);
      syncUrl(merged, mapView, { caseSlug: slug, tab: sidebarTab, casesPage: 1 });
    },
    [filters, mapView, selectedCaseId, sidebarTab, data.cases, syncUrl],
  );

  const goToCasesPage = useCallback(
    (page: number) => {
      const slug = selectedCaseId
        ? data.cases.find((c) => c.id === selectedCaseId)?.slug
        : undefined;
      setCasesPage(page);
      syncUrl(filters, mapView, { caseSlug: slug, tab: sidebarTab, casesPage: page });
    },
    [selectedCaseId, data.cases, filters, mapView, sidebarTab, syncUrl],
  );

  const handleNewsFilterChange = useCallback(
    (next: NewsFeedFilter) => {
      setNewsFilter(next);
      const slug = selectedCaseId
        ? data.cases.find((c) => c.id === selectedCaseId)?.slug
        : undefined;
      syncUrl(filters, mapView, { caseSlug: slug, tab: sidebarTab, newsFilter: next });
    },
    [selectedCaseId, data.cases, filters, mapView, sidebarTab, syncUrl],
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
      syncUrl(filters, mapView, { caseSlug: slug, tab });
    },
    [data.cases, filters, mapView, selectedCaseId, sidebarTab, syncUrl],
  );

  const selectTab = useCallback(
    (tab: SidebarTab) => {
      if (isMobileLayout && tab === sidebarTab && sidebarOpen) {
        setSidebarOpen(false);
        return;
      }
      setSidebarTab(tab);
      if (isMobileLayout) {
        setSidebarOpen(true);
        requestAnimationFrame(() => {
          sidebarRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
      syncMonitorUrl({ tab });
    },
    [isMobileLayout, sidebarOpen, sidebarTab, syncMonitorUrl],
  );

  const selectCase = useCallback(
    (id: string, opts?: { switchTab?: boolean; syncUrl?: boolean; forCompare?: boolean }) => {
      if (compareMode && id && id !== selectedCaseId) {
        setCompareCaseId(id);
        setCompareMode(false);
        return;
      }
      setSelectedCaseId(id);
      const nextTab = opts?.switchTab !== false ? ("cases" as SidebarTab) : sidebarTab;
      if (opts?.switchTab !== false) {
        setSidebarTab("cases");
        if (isMobileLayout) setSidebarOpen(true);
      }
      if (opts?.syncUrl !== false && id) {
        const slug = data.cases.find((c) => c.id === id)?.slug;
        if (slug) {
          syncUrl(filters, mapView, { caseSlug: slug, tab: nextTab });
        }
      }
      if (!id) {
        syncUrl(filters, mapView, { tab: sidebarTab });
      }
    },
    [compareMode, selectedCaseId, sidebarTab, isMobileLayout, data.cases, filters, mapView, syncUrl],
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
    setMapView(parseMapViewFromSearchParams(searchParams, initial.filters.period ?? ""));
    const slug = searchParams.get("case") ?? "";
    if (slug) {
      const id = caseIdFromSlug(initial.cases, slug);
      if (id) setSelectedCaseId(id);
    }
    setSidebarTab(parseSidebarTab(searchParams.get("tab")));
    setNewsFilter(parseNewsFilter(searchParams.get("newsFilter")));
    const pageRaw = searchParams.get("casesPage");
    const pageNum = pageRaw ? parseInt(pageRaw, 10) : 1;
    const totalPages = Math.max(
      1,
      Math.ceil(initial.cases.length / MONITOR_CASES_PAGE_SIZE),
    );
    const safePage = Math.min(
      Math.max(1, Number.isFinite(pageNum) && pageNum > 0 ? pageNum : 1),
      totalPages,
    );
    setCasesPage(safePage);
  }, [initial, searchParams]);

  useEffect(() => {
    const totalPages = Math.max(
      1,
      Math.ceil(displayCases.length / MONITOR_CASES_PAGE_SIZE),
    );
    if (casesPage > totalPages) {
      goToCasesPage(totalPages);
    }
  }, [displayCases.length, casesPage, goToCasesPage]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const update = () => {
      const mobile = mq.matches;
      setIsMobileLayout(mobile);
      if (!mobile) setSidebarOpen(true);
      setControlsCollapsed(mobile);
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
        const pollQs = qs ? `${qs}&mode=delta` : "mode=delta";
        const res = await fetch(`/api/monitor?${pollQs}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          if (!cancelled) setLiveStatus("stale");
          return;
        }
        const json = (await res.json()) as MonitorDeltaPayload;
        if (!cancelled) {
          setData((prev) => ({
            ...prev,
            generatedAt: json.generatedAt,
            updates: json.updates,
            worldNews: json.worldNews,
            newsPins: json.newsPins,
            signals: json.signals,
          }));
          setLiveStatus("live");
        }
      } catch {
        if (!cancelled) setLiveStatus("stale");
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

  const exploreRandom = useCallback(() => {
    if (!data.pins.length) return;
    const pick = data.pins[Math.floor(Math.random() * data.pins.length)];
    selectCase(pick.id, { switchTab: true, syncUrl: true });
  }, [data.pins, selectCase]);

  const cycleCase = useCallback(
    (dir: 1 | -1) => {
      const list = data.cases.filter((c) => data.pins.some((p) => p.id === c.id));
      if (!list.length) return;
      const idx = list.findIndex((c) => c.id === selectedCaseId);
      const next = list[(idx + dir + list.length) % list.length];
      selectCase(next.id, { switchTab: true, syncUrl: true });
    },
    [data.cases, data.pins, selectedCaseId, selectCase],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "Escape") {
        selectCase("");
        setCompareCaseId("");
        setCompareMode(false);
        setIsDrawingBbox(false);
        if (isFullscreen) setIsFullscreen(false);
        return;
      }
      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        setIsFullscreen((v) => !v);
        return;
      }
      if (e.key === "e" || e.key === "E") {
        e.preventDefault();
        exploreRandom();
        return;
      }
      if (e.key === "n" || e.key === "N" || e.key === "p" || e.key === "P") {
        e.preventDefault();
        cycleCase(e.key.toLowerCase() === "n" ? 1 : -1);
        return;
      }
      if (e.key === "[" || e.key === "]") {
        e.preventDefault();
        const idx = TAB_IDS.indexOf(sidebarTab);
        const next =
          e.key === "]"
            ? (idx + 1) % TAB_IDS.length
            : (idx - 1 + TAB_IDS.length) % TAB_IDS.length;
        selectTab(TAB_IDS[next]);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectCase, isFullscreen, exploreRandom, cycleCase, sidebarTab, selectTab]);

  useEffect(() => {
    if (!isPlayingTimeline) return;
    const decades = [1970, 1980, 1990, 2000, 2010, 2020];
    let i = 0;
    const id = window.setInterval(() => {
      const start = decades[i % decades.length];
      const patch = { timelineMinYear: start, timelineMaxYear: start + 9 };
      if (i % 2 === 0) {
        updateMapView(patch);
      } else {
        updateMapView(patch, { syncUrl: false });
      }
      i += 1;
      if (i >= decades.length * 2) {
        setIsPlayingTimeline(false);
      }
    }, 1200);
    return () => window.clearInterval(id);
  }, [isPlayingTimeline, updateMapView]);

  function handleExportCsv() {
    const rows = visiblePins.map((p) => ({
      name: p.name,
      slug: p.slug,
      country: p.country,
      yearStart: p.yearStart,
      status: p.status,
      lat: p.lat,
      lng: p.lng,
    }));
    const csv = exportCasesCsv(rows);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "motive-index-map-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function shareMapView() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  function applyMapPreset(preset: MapViewPreset) {
    updateMapView(preset.patch);
  }

  const clearMapFilters = useCallback(() => {
    updateMapView(defaultMapViewFilters());
  }, [updateMapView]);

  const handleMapViewportChange = useCallback(
    (lat: number, lng: number, zoom: number) => {
      if (viewportDebounceRef.current) clearTimeout(viewportDebounceRef.current);
      viewportDebounceRef.current = setTimeout(() => {
        updateMapView(
          { viewportLat: lat, viewportLng: lng, viewportZoom: zoom },
          { syncUrl: true },
        );
      }, 900);
    },
    [updateMapView],
  );

  // Scroll case card into view on mobile when selected
  useEffect(() => {
    if (!selectedCaseId || !caseCardRef.current) return;
    if (window.matchMedia("(max-width: 1023px)").matches) {
      caseCardRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selectedCaseId]);

  // Scroll case list row into view when selected from map (mobile)
  useEffect(() => {
    if (!selectedCaseId || !isMobileLayout) return;
    if (sidebarTab !== "cases") return;
    requestAnimationFrame(() => {
      caseRowRefs.current.get(selectedCaseId)?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    });
  }, [selectedCaseId, isMobileLayout, sidebarTab]);

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
    cases: mapFiltersActive
      ? `Cases (${visiblePins.length}/${data.cases.length})`
      : `Cases (${data.cases.length})`,
    news: `News (${data.worldNews.items.length})`,
    signals: "Signals",
  };

  const sidebarTabShortLabels: Record<SidebarTab, string> = {
    overview: "Overview",
    cases: "Cases",
    news: "News",
    signals: "Signals",
  };

  return (
    <>
      <HotNewsTicker
        worldNewsItems={data.worldNews.items}
        onOpenNews={() => selectTab("news")}
        onSelectCase={(slug) => {
          const id = caseIdFromSlug(data.cases, slug);
          if (id) selectCase(id, { switchTab: true, syncUrl: true });
        }}
      />
    <div
      className={`monitor-dashboard ${isMobileLayout ? "is-mobile" : ""} ${isPending ? "is-loading" : ""} ${isFullscreen ? "is-map-fullscreen" : ""}`}
    >
      <div className="monitor-top">
      <header className="monitor-hero">
        <div className="monitor-hero-main">
          <p className="label monitor-desktop-only">Live intelligence · forensic archive</p>
          <div className="monitor-hero-title-row">
            <h1 className="display monitor-title">World crime monitor</h1>
            <div className="monitor-live-badge monitor-mobile-only">
              <span
                className={`monitor-live-dot ${liveStatus === "syncing" ? "is-syncing" : ""} ${liveStatus === "stale" ? "is-stale" : ""}`}
              />
              {liveStatus === "syncing" ? "Syncing" : liveStatus === "stale" ? "Stale" : "Live"}
            </div>
          </div>
          <p className="monitor-lede monitor-desktop-only">
            Live global crime map with {data.totalCases} archived dossiers, regional news feeds in
            English, and forensic filters — click clusters to drill down.
          </p>
          <p className="monitor-lede-compact monitor-mobile-only">
            {data.filteredCount.toLocaleString()} cases · {visiblePins.length.toLocaleString()} on
            map · {visibleUnsolved || unsolvedCount} unsolved
          </p>
        </div>
        <div className="monitor-hero-meta monitor-desktop-only">
          <div className="monitor-live-badge">
            <span
              className={`monitor-live-dot ${liveStatus === "syncing" ? "is-syncing" : ""} ${liveStatus === "stale" ? "is-stale" : ""}`}
            />
            {liveStatus === "syncing" ? "Syncing" : liveStatus === "stale" ? "Stale" : "Live"}
          </div>
          <p className="text-xs text-[var(--muted)]">
            {liveStatus === "stale" ? "Last updated" : "Updated"} {formatDate(data.generatedAt)}
          </p>
        </div>
      </header>

      {data.featuredCase ? (
        <div className="monitor-discovery monitor-desktop-only">
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

      <div className="monitor-stats monitor-desktop-only">
        <div className="monitor-stat">
          <span className="monitor-stat-value">{data.filteredCount}</span>
          <span className="monitor-stat-label">Cases shown</span>
        </div>
        <div className="monitor-stat">
          <span className="monitor-stat-value">{visiblePins.length}</span>
          <span className="monitor-stat-label">Visible on map</span>
        </div>
        <div className="monitor-stat">
          <span className="monitor-stat-value">{data.plottedCount}</span>
          <span className="monitor-stat-label">Plotted total</span>
        </div>
        <div className="monitor-stat">
          <span className="monitor-stat-value">{data.countryStats.length}</span>
          <span className="monitor-stat-label">Regions</span>
        </div>
        <div className="monitor-stat monitor-stat-alert">
          <span className="monitor-stat-value">{visibleUnsolved || unsolvedCount}</span>
          <span className="monitor-stat-label">Unsolved{visibleUnsolved ? " (visible)" : ""}</span>
        </div>
      </div>

      <QuickLinks
        className="monitor-quick-links monitor-desktop-only"
        links={[
          { href: "/archive", label: "Full archive" },
          { href: "/search", label: "Advanced search" },
          { href: "/stats", label: "Archive stats" },
          { href: "/live", label: "World news" },
          { href: "/search?status=unsolved", label: "Unsolved dossiers" },
        ]}
      />

      <div className="monitor-stats-mobile monitor-mobile-only" aria-label="Monitor summary">
        <span className="monitor-stat-mobile">
          <strong>{visiblePins.length.toLocaleString()}</strong> on map
        </span>
        <span className="monitor-stat-mobile">
          <strong>{data.filteredCount.toLocaleString()}</strong> cases
        </span>
        <span className="monitor-stat-mobile monitor-stat-mobile-alert">
          <strong>{(visibleUnsolved || unsolvedCount).toLocaleString()}</strong> unsolved
        </span>
      </div>

      <QuickLinks
        className="monitor-quick-links-mobile monitor-mobile-only"
        links={[
          { href: "/archive", label: "Archive" },
          { href: "/search", label: "Search" },
          { href: "/stats", label: "Stats" },
          { href: "/live", label: "News" },
        ]}
      />

      {unplottedCount > 0 ? (
        <>
          <div className="monitor-notice monitor-notice-mobile monitor-mobile-only" role="status">
            <p className="text-xs text-[var(--ink-soft)]">
              <strong>{unplottedCount.toLocaleString()}</strong> filtered cases lack coordinates
              {" · "}
              <button
                type="button"
                className="text-[var(--accent)] hover:underline"
                onClick={() => updateMapView({ showGhostPins: true })}
              >
                Show estimates
              </button>
            </p>
          </div>
          <div className="monitor-notice monitor-desktop-only" role="status">
            <p className="text-sm text-[var(--ink-soft)]">
              <strong>{unplottedCount}</strong> filtered{" "}
              {unplottedCount === 1 ? "case lacks" : "cases lack"} map coordinates
              {unplottedCount <= 4
                ? `: ${data.unplottedCases.map((c) => c.name).join(", ")}`
                : ""}
              .{" "}
              <button
                type="button"
                className="text-[var(--accent)] hover:underline"
                onClick={() => updateMapView({ showGhostPins: true })}
              >
                Show country estimates on map
              </button>
              {" · "}
              <Link href="/search" className="text-[var(--accent)] hover:underline">
                Search full archive
              </Link>
            </p>
          </div>
        </>
      ) : null}

      {activeFilterCount(filters) > 0 ||
      mapView.bboxFilter ||
      mapView.crimeCategoryFilter.length > 0 ||
      mapView.coordAccuracyFilter !== "all" ||
      mapView.timelineMinYear !== TIMELINE_YEAR_MIN ||
      mapView.timelineMaxYear !== TIMELINE_YEAR_MAX ? (
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
          {mapView.crimeCategoryFilter.map((cat) => (
            <button
              key={cat}
              type="button"
              className="monitor-chip"
              onClick={() =>
                updateMapView({
                  crimeCategoryFilter: mapView.crimeCategoryFilter.filter((c) => c !== cat),
                })
              }
            >
              Map type: {CRIME_CATEGORY_LABELS[cat]} <span aria-hidden>×</span>
            </button>
          ))}
          {mapView.bboxFilter ? (
            <button
              type="button"
              className="monitor-chip"
              onClick={() => updateMapView({ bboxFilter: null })}
            >
              Map area filter <span aria-hidden>×</span>
            </button>
          ) : null}
          {mapView.coordAccuracyFilter !== "all" ? (
            <button
              type="button"
              className="monitor-chip"
              onClick={() => updateMapView({ coordAccuracyFilter: "all" })}
            >
              {mapView.coordAccuracyFilter === "city-only" ? "City pins only" : "Hide estimates"}{" "}
              <span aria-hidden>×</span>
            </button>
          ) : null}
          {(mapView.timelineMinYear !== TIMELINE_YEAR_MIN ||
            mapView.timelineMaxYear !== TIMELINE_YEAR_MAX) ? (
            <button
              type="button"
              className="monitor-chip"
              onClick={() =>
                updateMapView({
                  timelineMinYear: TIMELINE_YEAR_MIN,
                  timelineMaxYear: TIMELINE_YEAR_MAX,
                })
              }
            >
              Timeline: {mapView.timelineMinYear}–{mapView.timelineMaxYear}{" "}
              <span aria-hidden>×</span>
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
            <span className="monitor-map-header-meta text-xs text-[var(--muted)]">
              {visiblePins.length ? (
                <>
                  <strong className="text-[var(--ink)]">{visiblePins.length.toLocaleString()}</strong>
                  {visiblePins.length !== data.pins.length
                    ? ` of ${data.pins.length.toLocaleString()} plotted`
                    : " cases plotted"}
                  {mapFiltersActive ? " · filters active" : ""}
                </>
              ) : (
                "No markers — adjust map filters below"
              )}
            </span>
          </div>
          <MonitorMapControls
            view={mapView}
            onChange={updateMapView}
            caseCount={data.pins.length}
            visibleCount={visiblePins.length}
            newsCount={data.newsPins.length}
            collapsed={controlsCollapsed}
            onToggleCollapsed={() => setControlsCollapsed((v) => !v)}
            isFullscreen={isFullscreen}
            isDrawingBbox={isDrawingBbox}
            compareMode={compareMode}
            compareCaseName={comparePin ? data.cases.find((c) => c.id === compareCaseId)?.name : undefined}
            shareCopied={shareCopied}
            onExplore={exploreRandom}
            onFullscreen={() => setIsFullscreen((v) => !v)}
            onDrawBbox={() => setIsDrawingBbox((v) => !v)}
            onClearBbox={() => updateMapView({ bboxFilter: null })}
            onExport={handleExportCsv}
            onShareView={() => void shareMapView()}
            onApplyPreset={applyMapPreset}
            onRegionPreset={(p) => {
              setRegionFlyRequest(p);
              window.setTimeout(() => setRegionFlyRequest(null), 1200);
            }}
            onPlayTimeline={() => setIsPlayingTimeline((v) => !v)}
            isPlayingTimeline={isPlayingTimeline}
            onClearMapFilters={clearMapFilters}
            mapFiltersActive={mapFiltersActive}
          />
          {compareMode ? (
            <div className="monitor-compare-banner" role="status">
              <span>
                Select a second case on the map or list to compare with{" "}
                <strong>{selectedCase?.name ?? "the selected dossier"}</strong>
              </span>
              <button type="button" className="monitor-compare-banner-cancel" onClick={() => setCompareMode(false)}>
                Cancel
              </button>
            </div>
          ) : null}
          {isDrawingBbox ? (
            <div className="monitor-draw-banner" role="status">
              <span>Drag on the map to draw an area filter · press Esc to cancel</span>
              <button
                type="button"
                className="monitor-compare-banner-cancel"
                onClick={() => setIsDrawingBbox(false)}
              >
                Cancel
              </button>
            </div>
          ) : null}
          <CaseWorldMap
            pins={data.pins}
            ghostPins={data.ghostPins}
            newsPins={data.newsPins}
            countryStats={choroplethStats}
            pinIndex={data.pinIndex}
            selectedCountry={filters.country ?? ""}
            selectedCaseId={selectedCaseId}
            compareCaseId={compareCaseId}
            hoveredCaseId={hoveredCaseId}
            view={mapView}
            isDrawingBbox={isDrawingBbox}
            isFullscreen={isFullscreen}
            regionFlyRequest={regionFlyRequest}
            onSelectCountry={(code) => applyFilters({ country: code })}
            onSelectCase={(id) => selectCase(id)}
            onHoverCase={setHoveredCaseId}
            onBboxChange={(bbox) => {
              updateMapView({ bboxFilter: bbox });
              setIsDrawingBbox(false);
            }}
            onViewportChange={handleMapViewportChange}
            onClearMapFilters={clearMapFilters}
          />
          {!isMobileLayout ? (
            <div className="monitor-map-interactive-layer">
              {selectedPin && comparePin ? (
                <MonitorComparePanel
                  pinA={selectedPin}
                  pinB={comparePin}
                  onClose={() => setCompareCaseId("")}
                />
              ) : null}
              {selectedPin && !comparePin ? (
                <MonitorCaseCard
                  pin={selectedPin}
                  onClose={() => {
                    selectCase("");
                    setCompareCaseId("");
                  }}
                  cardRef={caseCardRef as RefObject<HTMLDivElement | null>}
                />
              ) : null}
              {selectedPin && !comparePin ? (
                <button
                  type="button"
                  className="monitor-compare-btn btn btn-ghost text-xs"
                  onClick={() => setCompareMode(true)}
                >
                  {compareMode ? "Select second case on map…" : "Compare with another case"}
                </button>
              ) : null}
            </div>
          ) : null}
          {isMobileLayout && selectedPin && !comparePin ? (
            <MonitorCaseCard
              pin={selectedPin}
              onClose={() => {
                selectCase("");
                setCompareCaseId("");
              }}
              cardRef={caseCardRef as RefObject<HTMLDivElement | null>}
            />
          ) : null}
          {isMobileLayout && selectedPin && comparePin ? (
            <MonitorComparePanel
              pinA={selectedPin}
              pinB={comparePin}
              onClose={() => setCompareCaseId("")}
            />
          ) : null}
          {isMobileLayout && selectedPin && !comparePin ? (
            <button
              type="button"
              className="monitor-compare-btn monitor-compare-btn-mobile btn btn-ghost text-xs"
              onClick={() => setCompareMode(true)}
            >
              {compareMode ? "Select second case on map…" : "Compare with another case"}
            </button>
          ) : null}
          {!visiblePins.length && data.pins.length > 0 ? (
            <div className="monitor-map-empty">
              <p className="display text-lg">No cases match map filters</p>
              <p className="mt-1 text-sm text-[var(--ink-soft)]">
                {data.pins.length.toLocaleString()} cases are plotted, but timeline, crime-type, or
                area filters hide them all.
              </p>
              <button
                type="button"
                className="btn btn-primary mt-3 text-sm"
                onClick={clearMapFilters}
              >
                Clear map filters
              </button>
            </div>
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
            {sidebarOpen ? "Hide panels" : `Show ${sidebarTabShortLabels[sidebarTab]}`}
          </button>
        ) : null}

        <aside
          id="monitor-sidebar"
          ref={sidebarRef}
          className={`monitor-sidebar ${isMobileLayout && !sidebarOpen ? "is-collapsed" : ""}`}
        >
          {isMobileLayout && sidebarOpen ? (
            <button
              type="button"
              className="monitor-sidebar-back monitor-mobile-only"
              onClick={() => setSidebarOpen(false)}
            >
              ← Back to map
            </button>
          ) : null}
          <div className="monitor-tabs" role="tablist" aria-label="Monitor panels">
            {TAB_IDS.map((id) => (
              <button
                key={id}
                type="button"
                role="tab"
                id={`monitor-tab-${id}`}
                aria-selected={sidebarTab === id}
                aria-controls={`monitor-panel-${id}`}
                aria-label={sidebarTabLabels[id]}
                tabIndex={sidebarTab === id ? 0 : -1}
                className={`monitor-tab ${sidebarTab === id ? "is-active" : ""}`}
                onClick={() => selectTab(id)}
                onKeyDown={(e) => handleTabKey(e, id)}
              >
                <span className="monitor-tab-short">{sidebarTabShortLabels[id]}</span>
                <span className="monitor-tab-long">{sidebarTabLabels[id]}</span>
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
              {displayCases.length > 0 ? (
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Showing {(paginatedCases.page - 1) * paginatedCases.pageSize + 1}–
                  {Math.min(paginatedCases.page * paginatedCases.pageSize, paginatedCases.total)} of{" "}
                  {paginatedCases.total.toLocaleString()}
                </p>
              ) : null}
              {mapFiltersActive ? (
                <div className="monitor-cases-toolbar mt-2">
                  <p className="text-xs text-[var(--muted)]">
                    {visiblePins.length} of {data.pins.length} plotted cases visible on map
                  </p>
                  <button
                    type="button"
                    className={`monitor-map-toggle text-xs ${casesMapVisibleOnly ? "is-active" : ""}`}
                    onClick={() => {
                      setCasesMapVisibleOnly((v) => !v);
                      goToCasesPage(1);
                    }}
                  >
                    {casesMapVisibleOnly ? "Showing map-visible only" : "Map-visible only"}
                  </button>
                </div>
              ) : null}
              <ul className="monitor-case-list mt-3">
                {paginatedCases.items.map((c) => {
                  const pin = pinsByCaseId.get(c.id);
                  const mapVisible = pin ? visibleCaseIds.has(c.id) : false;
                  const active = selectedCaseId === c.id;
                  const isTranslated = c.tags.includes("translated-en");
                  const country = c.country ?? "OTHER";
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        ref={(el) => {
                          if (el) caseRowRefs.current.set(c.id, el);
                          else caseRowRefs.current.delete(c.id);
                        }}
                        className={`monitor-case-row ${active ? "is-active" : ""} ${hoveredCaseId === c.id ? "is-hovered" : ""} ${pin && !mapVisible ? "is-map-hidden" : ""}`}
                        onClick={() => selectCase(c.id, { syncUrl: true })}
                        onMouseEnter={() => setHoveredCaseId(c.id)}
                        onMouseLeave={() => setHoveredCaseId("")}
                      >
                        <span className="monitor-case-year">{c.yearStart}</span>
                        <span className="monitor-case-body">
                          <span className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium">{c.name}</span>
                            {c.status === "unsolved" ? (
                              <span className="monitor-pill monitor-pill-open">open</span>
                            ) : null}
                            {pin && !mapVisible ? (
                              <span className="monitor-pill monitor-pill-hidden">hidden on map</span>
                            ) : null}
                            {isTranslated ? (
                              <span className="monitor-pill monitor-pill-lang">translated</span>
                            ) : null}
                          </span>
                          <span className="text-xs text-[var(--muted)]">
                            {COUNTRY_LABELS[country]} ·{" "}
                            {c.crimeCategories
                              .slice(0, 2)
                              .map((x) => CRIME_CATEGORY_LABELS[x])
                              .join(" · ")}
                          </span>
                        </span>
                        {pin ? (
                          <span
                            className={sidebarPinClasses(
                              pin.primaryCategory ?? c.crimeCategories[0] ?? "other",
                              c.status,
                              pin.coordAccuracy,
                            )}
                            title={
                              c.status === "unsolved"
                                ? "Unsolved · plotted on map"
                                : "Closed / historical · plotted on map"
                            }
                          />
                        ) : (
                          <span className="monitor-case-pin monitor-case-pin-off" title="No coordinates" />
                        )}
                      </button>
                      {active ? (
                        <OpenDossierLink slug={c.slug} className="monitor-case-dossier-link">
                          Open dossier →
                        </OpenDossierLink>
                      ) : null}
                    </li>
                  );
                })}
                {!paginatedCases.items.length ? (
                  <li className="list-none py-2">
                    <EmptyState
                      title={
                        casesMapVisibleOnly && data.cases.length
                          ? "No map-visible cases"
                          : "No cases match"
                      }
                      description={
                        casesMapVisibleOnly && data.cases.length
                          ? "Toggle off “Map visible only” or adjust filters in Overview."
                          : "Adjust filters in the Overview tab or clear active chips."
                      }
                      actions={[
                        { href: "/archive", label: "Browse archive", primary: true },
                        { href: "/search", label: "Advanced search" },
                      ]}
                    />
                  </li>
                ) : null}
              </ul>
              {paginatedCases.totalPages > 1 ? (
                <nav
                  className="monitor-cases-pagination archive-pagination mt-4 flex flex-wrap items-center justify-between gap-4"
                  aria-label="Cases pages"
                >
                  <div className="flex flex-wrap gap-2">
                    {paginatedCases.page > 1 ? (
                      <button
                        type="button"
                        className="btn btn-ghost text-xs"
                        onClick={() => goToCasesPage(paginatedCases.page - 1)}
                      >
                        ← Previous
                      </button>
                    ) : (
                      <span className="btn btn-ghost text-xs opacity-40 pointer-events-none">
                        ← Previous
                      </span>
                    )}
                    {paginatedCases.page < paginatedCases.totalPages ? (
                      <button
                        type="button"
                        className="btn btn-ghost text-xs"
                        onClick={() => goToCasesPage(paginatedCases.page + 1)}
                      >
                        Next →
                      </button>
                    ) : (
                      <span className="btn btn-ghost text-xs opacity-40 pointer-events-none">
                        Next →
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--muted)]">
                    Page {paginatedCases.page} of {paginatedCases.totalPages}
                  </p>
                </nav>
              ) : null}
              {selectedCase && !selectedPin ? (
                <div className="monitor-unplotted-card mt-4">
                  <p className="text-sm font-medium text-[var(--ink)]">{selectedCase.name}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    This case has no map coordinates.{" "}
                    <OpenDossierLink slug={selectedCase.slug} className="text-[var(--accent)] hover:underline">
                      Open dossier
                    </OpenDossierLink>
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
                AI-scored hot alerts · {WORLD_NEWS_FEED_COUNT} regional RSS feeds · dossier links
              </p>
              <WorldNewsFeed
                initial={data.worldNews}
                countryFilter={filters.country ?? ""}
                caseNames={slugToName}
                showFullPageLink
                disablePolling
                filter={newsFilter}
                onFilterChange={handleNewsFilterChange}
                onShowNewsLayer={() => updateMapView({ contentLayer: "both" })}
                onPlotOnMap={(slug) => {
                  const id = caseIdFromSlug(data.cases, slug);
                  if (id) selectCase(id, { switchTab: false, syncUrl: true });
                }}
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
              <MonitorSignalsPanel
                updates={archiveActivityUpdates}
                stats={data.signals.stats}
                alerts={data.signals.alerts}
                behaviorHighlights={data.signals.behaviorHighlights}
                onSelectCase={(slug) => {
                  const id = caseIdFromSlug(data.cases, slug);
                  if (id) selectCase(id, { switchTab: true, syncUrl: true });
                  else window.open(`/cases/${slug}`, "_blank");
                }}
                onSelectCountry={(code) => {
                  if (!code) return;
                  applyFilters({ country: code });
                  setSidebarTab("overview");
                }}
              />
            </section>
          ) : null}
        </aside>
      </div>
      </div>

      {isMobileLayout ? (
        <nav className="monitor-bottom-tabs" aria-label="Monitor panels">
          {TAB_IDS.map((id) => (
            <button
              key={id}
              type="button"
              className={`monitor-bottom-tab ${sidebarTab === id ? "is-active" : ""}`}
              aria-current={sidebarTab === id ? "page" : undefined}
              onClick={() => selectTab(id)}
            >
              <span>{sidebarTabShortLabels[id]}</span>
              {id === "cases" ? (
                <span className="monitor-bottom-tab-count">{data.cases.length}</span>
              ) : null}
              {id === "signals" ? (
                <span className="monitor-bottom-tab-count">{data.signals.stats.total}</span>
              ) : null}
              {id === "news" ? (
                <span className="monitor-bottom-tab-count">{data.worldNews.items.length}</span>
              ) : null}
            </button>
          ))}
        </nav>
      ) : null}
    </div>
    </>
  );
}
