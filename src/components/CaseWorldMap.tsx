"use client";

import Link from "next/link";
import { useMemo } from "react";
import { COUNTRY_LABELS } from "@/lib/country";
import type { MonitorCasePin } from "@/lib/geo";
import type { CountryCode } from "@/lib/types";
import { CRIME_CATEGORY_LABELS } from "@/lib/types";

type Props = {
  pins: MonitorCasePin[];
  selectedCountry?: CountryCode | "";
  selectedCaseId?: string;
  onSelectCountry?: (code: CountryCode | "") => void;
  onSelectCase?: (id: string) => void;
};

const MAP_W = 800;
const MAP_H = 400;

/** Simplified equirectangular landmass paths (approximate, for backdrop). */
const LAND_PATHS = [
  "M 120,120 L 200,100 L 260,130 L 280,180 L 240,220 L 160,210 Z", // North America
  "M 380,110 L 480,95 L 540,120 L 520,170 L 430,185 L 370,150 Z", // Europe
  "M 430,180 L 520,170 L 560,220 L 540,280 L 460,270 L 420,220 Z", // Africa
  "M 540,120 L 720,110 L 760,160 L 740,220 L 620,210 L 560,160 Z", // Asia
  "M 620,260 L 740,250 L 760,320 L 700,350 L 640,330 Z", // Australia
  "M 260,280 L 320,270 L 340,320 L 300,350 L 250,330 Z", // South America
];

const COUNTRY_ZONES: Partial<
  Record<CountryCode, { x: number; y: number; w: number; h: number; label: string }>
> = {
  US: { x: 95, y: 95, w: 210, h: 130, label: "US" },
  GB: { x: 395, y: 95, w: 45, h: 55, label: "GB" },
  CA: { x: 95, y: 55, w: 210, h: 50, label: "CA" },
  AU: { x: 620, y: 255, w: 130, h: 95, label: "AU" },
};

export function CaseWorldMap({
  pins,
  selectedCountry = "",
  selectedCaseId,
  onSelectCountry,
  onSelectCase,
}: Props) {
  const countsByCountry = useMemo(() => {
    const m = new Map<CountryCode, number>();
    for (const p of pins) {
      m.set(p.country, (m.get(p.country) ?? 0) + 1);
    }
    return m;
  }, [pins]);

  return (
    <div className="monitor-map-wrap">
      <svg
        viewBox={`0 0 ${MAP_W} ${MAP_H}`}
        className="monitor-map-svg"
        role="img"
        aria-label="World map showing forensic case locations"
      >
        <defs>
          <pattern id="monitor-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="var(--line)"
              strokeWidth="0.5"
              opacity="0.35"
            />
          </pattern>
        </defs>

        <rect width={MAP_W} height={MAP_H} fill="url(#monitor-grid)" />
        <rect width={MAP_W} height={MAP_H} fill="var(--bg-subtle)" opacity="0.85" />

        {LAND_PATHS.map((d, i) => (
          <path key={i} d={d} fill="var(--line)" opacity="0.45" stroke="var(--line-strong)" strokeWidth="1" />
        ))}

        {(Object.entries(COUNTRY_ZONES) as [CountryCode, NonNullable<(typeof COUNTRY_ZONES)[CountryCode]>][]).map(
          ([code, zone]) => {
            const count = countsByCountry.get(code) ?? 0;
            const active = selectedCountry === code;
            if (!count && !active) return null;
            return (
              <g key={code}>
                <rect
                  x={zone.x}
                  y={zone.y}
                  width={zone.w}
                  height={zone.h}
                  rx={2}
                  fill={active ? "var(--accent-soft)" : "var(--paper)"}
                  stroke={active ? "var(--accent)" : "var(--line)"}
                  strokeWidth={active ? 2 : 1}
                  opacity={count ? 0.9 : 0.4}
                  className="cursor-pointer transition-opacity hover:opacity-100"
                  onClick={() => onSelectCountry?.(active ? "" : code)}
                />
                <text
                  x={zone.x + zone.w / 2}
                  y={zone.y + zone.h / 2 - 4}
                  textAnchor="middle"
                  className="monitor-map-zone-label"
                >
                  {COUNTRY_LABELS[code]}
                </text>
                <text
                  x={zone.x + zone.w / 2}
                  y={zone.y + zone.h / 2 + 14}
                  textAnchor="middle"
                  className="monitor-map-zone-count"
                >
                  {count} case{count === 1 ? "" : "s"}
                </text>
              </g>
            );
          },
        )}

        {pins.map((pin) => {
          const active = selectedCaseId === pin.id;
          const unsolved = pin.status === "unsolved";
          return (
            <g
              key={pin.id}
              transform={`translate(${pin.x}, ${pin.y})`}
              className="cursor-pointer"
              onClick={() => onSelectCase?.(pin.id)}
            >
              {active ? (
                <circle r={14} fill="none" stroke="var(--accent)" strokeWidth={2} opacity={0.6} />
              ) : null}
              <circle
                r={active ? 7 : 5}
                fill={unsolved ? "var(--maroon)" : "var(--accent)"}
                stroke="var(--paper)"
                strokeWidth={2}
              />
              <title>
                {pin.name} — {COUNTRY_LABELS[pin.country]}
              </title>
            </g>
          );
        })}
      </svg>

      <div className="monitor-map-legend">
        <span className="monitor-legend-item">
          <span className="monitor-dot monitor-dot-closed" /> Closed / historical
        </span>
        <span className="monitor-legend-item">
          <span className="monitor-dot monitor-dot-unsolved" /> Unsolved
        </span>
        <span className="monitor-legend-meta">{pins.length} plotted</span>
      </div>
    </div>
  );
}

/** Pin tooltip card shown beside map when a case is selected. */
export function MonitorCaseCard({
  pin,
  onClose,
}: {
  pin: MonitorCasePin;
  onClose?: () => void;
}) {
  return (
    <div className="monitor-case-card">
      <div className="flex items-start justify-between gap-2">
        <p className="label">{pin.status.replaceAll("_", " ")} · {pin.yearStart}{pin.yearEnd ? `–${pin.yearEnd}` : ""}</p>
        {onClose ? (
          <button type="button" onClick={onClose} className="text-xs text-[var(--muted)] hover:text-[var(--ink)]">
            ×
          </button>
        ) : null}
      </div>
      <h3 className="display mt-1 text-xl">{pin.name}</h3>
      <p className="mt-1 text-sm text-[var(--ink-soft)]">{pin.subtitle}</p>
      <p className="mt-2 text-xs text-[var(--muted)]">
        {COUNTRY_LABELS[pin.country]} · {pin.crimeCategories.map((c) => CRIME_CATEGORY_LABELS[c]).join(" · ")}
      </p>
      <Link href={`/cases/${pin.slug}`} className="btn btn-primary mt-3 inline-block text-sm">
        Open dossier
      </Link>
    </div>
  );
}
