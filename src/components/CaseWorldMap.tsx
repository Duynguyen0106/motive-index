"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { COUNTRY_LABELS } from "@/lib/country";
import type { MonitorCasePin } from "@/lib/geo";
import {
  COUNTRY_BOUNDS,
  COUNTRY_ISO3,
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  ISO3_TO_COUNTRY,
  MAP_TILE_ATTRIBUTION,
  MAP_TILE_URL,
  MAX_MAP_ZOOM,
  MIN_MAP_ZOOM,
  WORLD_GEOJSON_URL,
} from "@/lib/mapConstants";
import type { CountryCode } from "@/lib/types";
import { CRIME_CATEGORY_LABELS } from "@/lib/types";
import type { GeoJSON as GeoJSONType, Layer, Map as LeafletMap, Path } from "leaflet";

type Props = {
  pins: MonitorCasePin[];
  selectedCountry?: CountryCode | "";
  selectedCaseId?: string;
  onSelectCountry?: (code: CountryCode | "") => void;
  onSelectCase?: (id: string) => void;
};

function featureIso3(feature: GeoJSON.Feature | undefined): string | undefined {
  if (!feature || feature.type !== "Feature") return undefined;
  const id = feature.id;
  return typeof id === "string" ? id : undefined;
}

function layerFeature(layer: Layer): GeoJSON.Feature | undefined {
  return (layer as Layer & { feature?: GeoJSON.Feature }).feature;
}

function markerHtml(active: boolean, unsolved: boolean): string {
  const size = active ? 14 : 10;
  const color = unsolved ? "var(--maroon)" : "var(--accent)";
  const ring = active
    ? `<span style="position:absolute;inset:-6px;border:2px solid var(--accent);border-radius:50%;opacity:0.55"></span>`
    : "";
  return `<span class="monitor-leaflet-marker" style="width:${size}px;height:${size}px;background:${color}">${ring}</span>`;
}

export function CaseWorldMap({
  pins,
  selectedCountry = "",
  selectedCaseId,
  onSelectCountry,
  onSelectCase,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Layer[]>([]);
  const highlightRef = useRef<Layer | null>(null);
  const geoJsonRef = useRef<GeoJSONType | null>(null);
  const onSelectCountryRef = useRef(onSelectCountry);
  const selectedCountryRef = useRef(selectedCountry);
  const [ready, setReady] = useState(false);
  const [hint, setHint] = useState("Loading map…");

  useEffect(() => {
    onSelectCountryRef.current = onSelectCountry;
    selectedCountryRef.current = selectedCountry;
  }, [onSelectCountry, selectedCountry]);

  // Init Leaflet map once
  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      if (cancelled || !containerRef.current) return;

      const map = L.map(containerRef.current, {
        center: DEFAULT_MAP_CENTER,
        zoom: DEFAULT_MAP_ZOOM,
        minZoom: MIN_MAP_ZOOM,
        maxZoom: MAX_MAP_ZOOM,
        worldCopyJump: true,
        scrollWheelZoom: true,
        zoomControl: true,
      });

      L.tileLayer(MAP_TILE_URL, {
        attribution: MAP_TILE_ATTRIBUTION,
        subdomains: "abcd",
        maxZoom: MAX_MAP_ZOOM,
      }).addTo(map);

      mapRef.current = map;
      setReady(true);
      setHint("Drag to pan · Scroll or pinch to zoom");

      // Load official country boundaries
      try {
        const res = await fetch(WORLD_GEOJSON_URL);
        const data = await res.json();
        if (cancelled || !mapRef.current) return;

        const layer = L.geoJSON(data, {
          style: (feature) => {
            const iso3 = featureIso3(feature);
            const code = iso3 ? ISO3_TO_COUNTRY[iso3] : undefined;
            const active = selectedCountry && code === selectedCountry;
            return {
              color: active ? "var(--accent)" : "var(--line-strong)",
              weight: active ? 2 : 0.6,
              fillColor: active ? "var(--accent)" : "var(--line)",
              fillOpacity: active ? 0.12 : 0.03,
            };
          },
          onEachFeature: (feature, featureLayer) => {
            const iso3 = featureIso3(feature);
            const code = iso3 ? ISO3_TO_COUNTRY[iso3] : undefined;
            if (!code) return;
            featureLayer.on({
              click: () => {
                onSelectCountry?.(selectedCountry === code ? "" : code);
              },
            });
          },
        });
        layer.addTo(map);
        geoJsonRef.current = layer;
      } catch {
        setHint("Map loaded · country boundaries unavailable");
      }
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      geoJsonRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init once
  }, []);

  // Sync markers when pins / selection change
  useEffect(() => {
    if (!ready || !mapRef.current) return;

    (async () => {
      const L = (await import("leaflet")).default;
      const map = mapRef.current!;

      for (const layer of markersRef.current) {
        map.removeLayer(layer);
      }
      markersRef.current = [];

      for (const pin of pins) {
        const active = selectedCaseId === pin.id;
        const unsolved = pin.status === "unsolved";
        const marker = L.marker([pin.lat, pin.lng], {
          icon: L.divIcon({
            className: "monitor-leaflet-icon",
            html: markerHtml(active, unsolved),
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          }),
        });

        marker.bindTooltip(pin.name, {
          direction: "top",
          offset: [0, -8],
          opacity: 0.95,
        });

        marker.on("click", () => {
          onSelectCase?.(pin.id);
          map.flyTo([pin.lat, pin.lng], Math.max(map.getZoom(), 5), { duration: 0.6 });
        });

        marker.addTo(map);
        markersRef.current.push(marker);
      }
    })();
  }, [pins, ready, selectedCaseId, onSelectCase]);

  // Highlight country + fly to bounds
  useEffect(() => {
    if (!ready || !geoJsonRef.current) return;

    (async () => {
      const L = (await import("leaflet")).default;
      const map = mapRef.current!;

      if (highlightRef.current) {
        map.removeLayer(highlightRef.current);
        highlightRef.current = null;
      }

      geoJsonRef.current?.eachLayer((layer) => {
        const feature = layerFeature(layer);
        const iso3 = featureIso3(feature);
        const code = iso3 ? ISO3_TO_COUNTRY[iso3] : undefined;
        const active = selectedCountry && code === selectedCountry;
        (layer as Path).setStyle({
          color: active ? "var(--accent)" : "var(--line-strong)",
          weight: active ? 2 : 0.6,
          fillColor: active ? "var(--accent)" : "var(--line)",
          fillOpacity: active ? 0.15 : 0.03,
        });
      });

      if (selectedCountry) {
        const iso3 = COUNTRY_ISO3[selectedCountry];
        if (iso3 && geoJsonRef.current) {
          const match = geoJsonRef.current.getLayers().find((l) => {
            return featureIso3(layerFeature(l)) === iso3;
          });
          if (match) {
            highlightRef.current = match;
          }
        }
        const bounds = COUNTRY_BOUNDS[selectedCountry];
        if (bounds) {
          map.flyToBounds(bounds, { padding: [24, 24], duration: 0.8, maxZoom: 5 });
        }
      } else if (pins.length) {
        const latLngs = pins.map((p) => [p.lat, p.lng] as [number, number]);
        if (latLngs.length === 1) {
          map.flyTo(latLngs[0], 4, { duration: 0.6 });
        } else {
          map.flyToBounds(L.latLngBounds(latLngs), { padding: [32, 32], duration: 0.8, maxZoom: 4 });
        }
      }
    })();
  }, [selectedCountry, ready, pins]);

  // Fly to selected case
  useEffect(() => {
    if (!ready || !selectedCaseId || !mapRef.current) return;
    const pin = pins.find((p) => p.id === selectedCaseId);
    if (pin) {
      mapRef.current.flyTo([pin.lat, pin.lng], Math.max(mapRef.current.getZoom(), 6), {
        duration: 0.6,
      });
    }
  }, [selectedCaseId, pins, ready]);

  function resetView() {
    if (!mapRef.current) return;
    void (async () => {
      const L = (await import("leaflet")).default;
      if (!mapRef.current) return;
      if (pins.length) {
        const latLngs = pins.map((p) => [p.lat, p.lng] as [number, number]);
        if (latLngs.length === 1) {
          mapRef.current.setView(latLngs[0], 3);
        } else {
          mapRef.current.fitBounds(L.latLngBounds(latLngs), {
            padding: [32, 32],
            maxZoom: 4,
          });
        }
      } else {
        mapRef.current.setView(DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM);
      }
    })();
  }

  return (
    <div className="monitor-map-wrap">
      <div ref={containerRef} className="monitor-leaflet-map" aria-label="Interactive world map" />
      <div className="monitor-map-toolbar">
        <span className="monitor-map-hint">{hint}</span>
        <button type="button" className="btn btn-ghost text-xs" onClick={resetView}>
          Reset view
        </button>
      </div>
      <div className="monitor-map-legend">
        <span className="monitor-legend-item">
          <span className="monitor-dot monitor-dot-closed" /> Closed / historical
        </span>
        <span className="monitor-legend-item">
          <span className="monitor-dot monitor-dot-unsolved" /> Unsolved
        </span>
        <span className="monitor-legend-meta">
          {pins.length} plotted · OpenStreetMap
        </span>
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
        <p className="label">
          {pin.status.replaceAll("_", " ")} · {pin.yearStart}
          {pin.yearEnd ? `–${pin.yearEnd}` : ""}
        </p>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-[var(--muted)] hover:text-[var(--ink)]"
          >
            ×
          </button>
        ) : null}
      </div>
      <h3 className="display mt-1 text-xl">{pin.name}</h3>
      <p className="mt-1 text-sm text-[var(--ink-soft)]">{pin.subtitle}</p>
      <p className="mt-2 text-xs text-[var(--muted)]">
        {COUNTRY_LABELS[pin.country]} ·{" "}
        {pin.crimeCategories.map((c) => CRIME_CATEGORY_LABELS[c]).join(" · ")}
      </p>
      <p className="mt-1 text-xs tabular-nums text-[var(--muted)]">
        {pin.lat.toFixed(2)}°, {pin.lng.toFixed(2)}°
      </p>
      <Link href={`/cases/${pin.slug}`} className="btn btn-primary mt-3 inline-block text-sm">
        Open dossier
      </Link>
    </div>
  );
}
