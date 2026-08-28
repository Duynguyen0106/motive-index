"use client";

import type {
  ChoroplethMetric,
  MapContentLayer,
  MapLayerMode,
  MonitorMapViewState,
  ProvenanceFilter,
  RegionPreset,
} from "@/lib/monitorMapTypes";
import { REGION_PRESETS, TIMELINE_YEAR_MAX, TIMELINE_YEAR_MIN } from "@/lib/monitorMapTypes";
import { decadeMarkers } from "@/lib/monitorMapUtils";

type Props = {
  view: MonitorMapViewState;
  onChange: (patch: Partial<MonitorMapViewState>) => void;
  caseCount: number;
  newsCount: number;
  isFullscreen: boolean;
  isDrawingBbox: boolean;
  compareSlug?: string;
  onExplore: () => void;
  onFullscreen: () => void;
  onDrawBbox: () => void;
  onClearBbox: () => void;
  onExport: () => void;
  onRegionPreset: (preset: RegionPreset) => void;
  onPlayTimeline?: () => void;
  isPlayingTimeline?: boolean;
};

export function MonitorMapControls({
  view,
  onChange,
  caseCount,
  newsCount,
  isFullscreen,
  isDrawingBbox,
  compareSlug,
  onExplore,
  onFullscreen,
  onDrawBbox,
  onClearBbox,
  onExport,
  onRegionPreset,
  onPlayTimeline,
  isPlayingTimeline,
}: Props) {
  const decades = decadeMarkers(view.timelineMinYear, view.timelineMaxYear);

  return (
    <div className="monitor-map-controls">
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
              {layer === "cases" ? `Cases (${caseCount})` : layer === "news" ? `News (${newsCount})` : "Both"}
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
            {(["cases", "unsolved"] as ChoroplethMetric[]).map((m) => (
              <button
                key={m}
                type="button"
                className={`monitor-map-toggle ${view.choroplethMetric === m ? "is-active" : ""}`}
                onClick={() => onChange({ choroplethMetric: m })}
              >
                {m === "cases" ? "Case count" : "Unsolved"}
              </button>
            ))}
          </div>
        ) : null}
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

      <div className="monitor-map-controls-row monitor-timeline-row">
        <span className="monitor-map-controls-label">Timeline</span>
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

      <div className="monitor-map-controls-row">
        <span className="monitor-map-controls-label">Regions</span>
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

      {compareSlug ? (
        <p className="monitor-compare-hint text-xs text-[var(--muted)]">
          Compare mode: second selection is <strong>{compareSlug}</strong> — select another pin to compare.
        </p>
      ) : null}

      <p className="monitor-keyboard-hint text-xs text-[var(--muted)]">
        Keyboard: <kbd>N</kbd>/<kbd>P</kbd> next/prev case · <kbd>E</kbd> explore · <kbd>F</kbd> fullscreen ·{" "}
        <kbd>Esc</kbd> clear
      </p>
    </div>
  );
}
