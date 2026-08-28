"use client";

import type { ChoroplethMetric } from "@/lib/monitorMapTypes";
import { choroplethFillOpacity } from "@/lib/monitorMapTypes";

type Props = {
  visibleCaseCount: number;
  totalCaseCount: number;
  unsolvedVisible: number;
  newsCount: number;
  choroplethEnabled: boolean;
  choroplethMetric: ChoroplethMetric;
  choroplethMax: number;
  timelineLabel: string;
  bboxActive: boolean;
};

export function MonitorMapOverlay({
  visibleCaseCount,
  totalCaseCount,
  unsolvedVisible,
  newsCount,
  choroplethEnabled,
  choroplethMetric,
  choroplethMax,
  timelineLabel,
  bboxActive,
}: Props) {
  const filtered = visibleCaseCount !== totalCaseCount;

  return (
    <div className="monitor-map-overlay" aria-live="polite">
      <div className="monitor-map-overlay-stats">
        <span className="monitor-overlay-stat">
          <strong>{visibleCaseCount}</strong>
          {filtered ? ` / ${totalCaseCount}` : ""} on map
        </span>
        {unsolvedVisible > 0 ? (
          <span className="monitor-overlay-stat is-alert">
            <strong>{unsolvedVisible}</strong> unsolved
          </span>
        ) : null}
        {newsCount > 0 ? (
          <span className="monitor-overlay-stat">
            <strong>{newsCount}</strong> news
          </span>
        ) : null}
        <span className="monitor-overlay-stat monitor-overlay-stat-timeline">{timelineLabel}</span>
        {bboxActive ? <span className="monitor-overlay-stat is-active">Area filter</span> : null}
      </div>

      {choroplethEnabled ? (
        <div className="monitor-choropleth-legend" aria-hidden>
          <span className="monitor-choropleth-legend-label">
            {choroplethMetric === "unsolved" ? "Unsolved count" : "Case count"}
          </span>
          <span className="monitor-choropleth-scale">
            <span className="monitor-choropleth-min">0</span>
            {Array.from({ length: 5 }, (_, i) => {
              const value = ((i + 1) / 5) * choroplethMax;
              const opacity = choroplethFillOpacity(value, choroplethMax);
              return (
                <span
                  key={i}
                  className="monitor-choropleth-swatch"
                  style={{ opacity: Math.max(0.2, opacity) }}
                />
              );
            })}
          </span>
          <span className="monitor-choropleth-max">{choroplethMax}+</span>
        </div>
      ) : null}
    </div>
  );
}
