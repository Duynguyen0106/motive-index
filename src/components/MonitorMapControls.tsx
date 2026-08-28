"use client";

import { useEffect, useState } from "react";
import type {
  ChoroplethMetric,
  CoordAccuracyFilter,
  MapBasemap,
  MapContentLayer,
  MapLayerMode,
  MonitorMapViewState,
  ProvenanceFilter,
  RegionPreset,
} from "@/lib/monitorMapTypes";
import { REGION_PRESETS, TIMELINE_YEAR_MAX, TIMELINE_YEAR_MIN } from "@/lib/monitorMapTypes";
import { MAP_VIEW_PRESETS, type MapViewPreset } from "@/lib/monitorMapFilters";
import { decadeMarkers, CRIME_CATEGORY_FILTER_ORDER, markerCategoryClass, markerShapeClass } from "@/lib/monitorMapUtils";
import { CRIME_CATEGORY_LABELS, type CrimeCategory } from "@/lib/types";

type Props = {
  view: MonitorMapViewState;
  onChange: (patch: Partial<MonitorMapViewState>) => void;
  caseCount: number;
  visibleCount: number;
  newsCount: number;
  isFullscreen: boolean;
  isDrawingBbox: boolean;
  compareMode?: boolean;
  compareCaseName?: string;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  onExplore: () => void;
  onFullscreen: () => void;
  onDrawBbox: () => void;
  onClearBbox: () => void;
  onExport: () => void;
  onShareView: () => void;
  onApplyPreset: (preset: MapViewPreset) => void;
  onRegionPreset: (preset: RegionPreset) => void;
  onPlayTimeline?: () => void;
  isPlayingTimeline?: boolean;
  shareCopied?: boolean;
  mapFiltersActive?: boolean;
  onClearMapFilters?: () => void;
};

export function MonitorMapControls({
  view,
  onChange,
  caseCount,
  visibleCount,
  newsCount,
  isFullscreen,
  isDrawingBbox,
  compareMode,
  compareCaseName,
  collapsed = false,
  onToggleCollapsed,
  onExplore,
  onFullscreen,
  onDrawBbox,
  onClearBbox,
  onExport,
  onShareView,
  onApplyPreset,
  onRegionPreset,
  onPlayTimeline,
  isPlayingTimeline,
  shareCopied,
  mapFiltersActive = false,
  onClearMapFilters,
}: Props) {
  const decades = decadeMarkers(view.timelineMinYear, view.timelineMaxYear);
  const filtered = visibleCount !== caseCount;
  const [coarsePointer, setCoarsePointer] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const update = () => setCoarsePointer(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  function toggleCrimeCategory(cat: CrimeCategory) {
    const filter = view.crimeCategoryFilter;
    if (filter.length === 0) {
      onChange({ crimeCategoryFilter: [cat] });
      return;
    }
    if (filter.includes(cat)) {
      onChange({ crimeCategoryFilter: filter.filter((c) => c !== cat) });
      return;
    }
    onChange({ crimeCategoryFilter: [...filter, cat] });
  }

  function crimeChipClass(cat: CrimeCategory): string {
    const filter = view.crimeCategoryFilter;
    if (filter.length === 0) return "is-neutral";
    return filter.includes(cat) ? "is-filtered" : "is-excluded";
  }

  return (
    <div className={`monitor-map-controls ${collapsed ? "is-collapsed" : ""}`}>
      <div className="monitor-map-controls-head">
        <button
          type="button"
          className="monitor-map-controls-toggle"
          onClick={onToggleCollapsed}
          aria-expanded={!collapsed}
        >
          <span className="display text-sm">Map layers & filters</span>
          <span className="text-xs text-[var(--muted)]">
            {visibleCount}
            {filtered ? ` / ${caseCount}` : ""} visible · {collapsed ? "Show" : "Hide"}
          </span>
        </button>
        <button type="button" className="monitor-map-toggle" onClick={onShareView} title="Copy map view link">
          {shareCopied ? "Link copied" : "Share view"}
        </button>
      </div>

      {collapsed ? (
        <div className="monitor-map-quick-bar" role="toolbar" aria-label="Quick map actions">
          <button type="button" className="monitor-map-quick-btn" onClick={onToggleCollapsed}>
            Layers
          </button>
          <button
            type="button"
            className={`monitor-map-quick-btn ${view.layerMode === "heatmap" ? "is-active" : ""}`}
            onClick={() => onChange({ layerMode: view.layerMode === "heatmap" ? "pins" : "heatmap" })}
          >
            {view.layerMode === "heatmap" ? "Heatmap" : "Pins"}
          </button>
          <button type="button" className="monitor-map-quick-btn" onClick={() => onRegionPreset(REGION_PRESETS[0])}>
            Reset view
          </button>
          <button type="button" className="monitor-map-quick-btn" onClick={onExplore}>
            Explore
          </button>
          {mapFiltersActive && onClearMapFilters ? (
            <button type="button" className="monitor-map-quick-btn is-active" onClick={onClearMapFilters}>
              Clear filters
            </button>
          ) : null}
          <button type="button" className="monitor-map-quick-btn" onClick={onFullscreen}>
            {isFullscreen ? "Exit" : "Full"}
          </button>
        </div>
      ) : null}

      {collapsed ? (
        <p className="monitor-keyboard-hint monitor-keyboard-hint-collapsed text-xs text-[var(--muted)]">
          <kbd>[</kbd>/<kbd>]</kbd> panels · <kbd>N</kbd>/<kbd>P</kbd> cycle · <kbd>E</kbd> explore · <kbd>F</kbd> fullscreen
        </p>
      ) : null}

      {collapsed && coarsePointer ? (
        <details className="monitor-mobile-regions">
          <summary className="monitor-mobile-regions-summary">Jump to region</summary>
          <div className="monitor-mobile-regions-grid" role="group" aria-label="Map region presets">
            {REGION_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                className="monitor-map-quick-btn"
                onClick={() => onRegionPreset(p)}
              >
                {p.label}
              </button>
            ))}
          </div>
          <p className="monitor-mobile-regions-hint text-xs text-[var(--muted)]">
            Drag one finger on the map to draw an area filter, or use region jumps below.
          </p>
        </details>
      ) : null}

      {!collapsed ? (
        <>
          <div className="monitor-map-presets">
            <span className="monitor-map-controls-label">Quick views</span>
            <div className="monitor-map-toggle-group">
              {MAP_VIEW_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className="monitor-map-toggle"
                  title={preset.description}
                  onClick={() => onApplyPreset(preset)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="monitor-map-controls-row">
            <span className="monitor-map-controls-label">Layers</span>
            <div className="monitor-map-toggle-group">
              {(["pins", "heatmap"] as MapLayerMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={`monitor-map-toggle ${view.layerMode === mode ? "is-active" : ""}`}
                  onClick={() => onChange({ layerMode: mode })}
                >
                  {mode === "pins" ? "Pins" : "Heatmap"}
                </button>
              ))}
            </div>
            <div className="monitor-map-toggle-group">
              {(["cases", "news", "both"] as MapContentLayer[]).map((layer) => (
                <button
                  key={layer}
                  type="button"
                  className={`monitor-map-toggle ${view.contentLayer === layer ? "is-active" : ""}`}
                  onClick={() => onChange({ contentLayer: layer })}
                >
                  {layer === "cases"
                    ? `Cases (${caseCount})`
                    : layer === "news"
                      ? `News (${newsCount})`
                      : "Both"}
                </button>
              ))}
            </div>
          </div>

          <div className="monitor-map-controls-row">
            <span className="monitor-map-controls-label">Choropleth</span>
            <button
              type="button"
              className={`monitor-map-toggle ${view.choroplethEnabled ? "is-active" : ""}`}
              onClick={() => onChange({ choroplethEnabled: !view.choroplethEnabled })}
            >
              {view.choroplethEnabled ? "On" : "Off"}
            </button>
            {view.choroplethEnabled ? (
              <div className="monitor-map-toggle-group">
                {(["cases", "unsolved", "unsolved_rate"] as ChoroplethMetric[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={`monitor-map-toggle ${view.choroplethMetric === m ? "is-active" : ""}`}
                    onClick={() => onChange({ choroplethMetric: m })}
                  >
                    {m === "cases" ? "Case count" : m === "unsolved" ? "Unsolved" : "Unsolved %"}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="monitor-map-controls-row">
            <span className="monitor-map-controls-label">Pin accuracy</span>
            <select
              className="monitor-map-select field"
              value={view.coordAccuracyFilter}
              onChange={(e) =>
                onChange({ coordAccuracyFilter: e.target.value as CoordAccuracyFilter })
              }
            >
              <option value="all">All pins</option>
              <option value="city-only">City-level only</option>
              <option value="hide-estimates">Hide estimates</option>
            </select>
            <div className="monitor-map-toggle-group">
              {(["dark", "light"] as MapBasemap[]).map((b) => (
                <button
                  key={b}
                  type="button"
                  className={`monitor-map-toggle ${view.basemap === b ? "is-active" : ""}`}
                  onClick={() => onChange({ basemap: b })}
                >
                  {b === "dark" ? "Dark map" : "Light map"}
                </button>
              ))}
            </div>
          </div>

          <div className="monitor-map-controls-row">
            <span className="monitor-map-controls-label">Provenance</span>
            <select
              className="monitor-map-select field"
              value={view.provenanceFilter}
              onChange={(e) => onChange({ provenanceFilter: e.target.value as ProvenanceFilter })}
            >
              <option value="all">All dossiers</option>
              <option value="verified">Verified only</option>
              <option value="curated">Curated + verified</option>
              <option value="hide-composite">Hide teaching (CS-####)</option>
            </select>
            <label className="monitor-map-check">
              <input
                type="checkbox"
                checked={view.showGhostPins}
                onChange={(e) => onChange({ showGhostPins: e.target.checked })}
              />
              Unplotted estimates
            </label>
            <label className="monitor-map-check">
              <input
                type="checkbox"
                checked={view.showRelatedArcs}
                onChange={(e) => onChange({ showRelatedArcs: e.target.checked })}
              />
              Related arcs
            </label>
          </div>

          <div className="monitor-map-controls-row monitor-crime-filter-row">
            <span className="monitor-map-controls-label">Crime type</span>
            <div className="monitor-crime-filter-chips">
              {CRIME_CATEGORY_FILTER_ORDER.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`monitor-crime-chip ${crimeChipClass(cat)}`}
                  title={CRIME_CATEGORY_LABELS[cat]}
                  onClick={() => toggleCrimeCategory(cat)}
                >
                  <span
                    className={`monitor-crime-chip-icon ${markerCategoryClass(cat)} ${markerShapeClass(cat)}`}
                    aria-hidden
                  />
                  <span className="monitor-crime-chip-label">{CRIME_CATEGORY_LABELS[cat]}</span>
                </button>
              ))}
              {view.crimeCategoryFilter.length ? (
                <button
                  type="button"
                  className="monitor-map-toggle monitor-crime-chip-clear"
                  onClick={() => onChange({ crimeCategoryFilter: [] })}
                >
                  All types
                </button>
              ) : null}
            </div>
          </div>

          <details className="monitor-controls-section">
            <summary className="monitor-controls-section-summary">Timeline</summary>
            <div className="monitor-controls-section-body">
              <div className="monitor-map-controls-row monitor-timeline-row">
                <span className="monitor-timeline-range">
                  {view.timelineMinYear}–{view.timelineMaxYear}
                </span>
                {onPlayTimeline ? (
                  <button type="button" className="monitor-map-toggle" onClick={onPlayTimeline}>
                    {isPlayingTimeline ? "Pause" : "Play decades"}
                  </button>
                ) : null}
              </div>
              <div className="monitor-timeline-sliders">
                <input
                  type="range"
                  min={TIMELINE_YEAR_MIN}
                  max={TIMELINE_YEAR_MAX}
                  value={view.timelineMinYear}
                  onChange={(e) =>
                    onChange({
                      timelineMinYear: Math.min(parseInt(e.target.value, 10), view.timelineMaxYear - 1),
                    })
                  }
                  aria-label="Timeline start year"
                />
                <input
                  type="range"
                  min={TIMELINE_YEAR_MIN}
                  max={TIMELINE_YEAR_MAX}
                  value={view.timelineMaxYear}
                  onChange={(e) =>
                    onChange({
                      timelineMaxYear: Math.max(parseInt(e.target.value, 10), view.timelineMinYear + 1),
                    })
                  }
                  aria-label="Timeline end year"
                />
              </div>
              <div className="monitor-timeline-decades">
                {decades.slice(0, 8).map((d) => (
                  <button
                    key={d}
                    type="button"
                    className="monitor-map-toggle monitor-decade-btn"
                    onClick={() => onChange({ timelineMinYear: d, timelineMaxYear: d + 9 })}
                  >
                    {d}s
                  </button>
                ))}
              </div>
            </div>
          </details>

          <details className="monitor-controls-section">
            <summary className="monitor-controls-section-summary">Regions</summary>
            <div className="monitor-controls-section-body">
              <div className="monitor-map-toggle-group monitor-region-presets">
                {REGION_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="monitor-map-toggle"
                    onClick={() => onRegionPreset(p)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </details>

          <details className="monitor-controls-section" open>
            <summary className="monitor-controls-section-summary">Actions</summary>
            <div className="monitor-controls-section-body">
              <div className="monitor-map-controls-row monitor-map-actions">
                <button type="button" className="monitor-map-toggle" onClick={onExplore} title="Random case">
                  Explore
                </button>
                <button type="button" className="monitor-map-toggle" onClick={onFullscreen}>
                  {isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                </button>
                <button
                  type="button"
                  className={`monitor-map-toggle ${isDrawingBbox ? "is-active" : ""}`}
                  onClick={onDrawBbox}
                  title="Draw a rectangle on the map to filter by area"
                >
                  {isDrawingBbox ? "Drawing…" : "Draw area filter"}
                </button>
                {view.bboxFilter ? (
                  <button type="button" className="monitor-map-toggle" onClick={onClearBbox}>
                    Clear area
                  </button>
                ) : null}
                <button type="button" className="monitor-map-toggle" onClick={onExport}>
                  Export CSV
                </button>
              </div>
            </div>
          </details>

          {compareMode ? (
            <p className="monitor-compare-hint text-xs text-[var(--muted)]">
              Compare mode: click a second case on the map or list.
            </p>
          ) : compareCaseName ? (
            <p className="monitor-compare-hint text-xs text-[var(--muted)]">
              Comparing with <strong>{compareCaseName}</strong>
            </p>
          ) : null}

          <p className="monitor-keyboard-hint text-xs text-[var(--muted)]">
            Keyboard: <kbd>N</kbd>/<kbd>P</kbd> next/prev · <kbd>E</kbd> explore · <kbd>F</kbd> fullscreen ·{" "}
            <kbd>Esc</kbd> clear
          </p>
        </>
      ) : null}
    </div>
  );
}
