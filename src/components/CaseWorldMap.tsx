"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type RefObject } from "react";
import { COUNTRY_LABELS } from "@/lib/country";
import type { MonitorCasePin } from "@/lib/geo";
import { MonitorMapOverlay } from "@/components/MonitorMapOverlay";
import { getLeaflet, getLeafletWithCluster } from "@/lib/leafletClient";
import { filterVisiblePins } from "@/lib/monitorMapFilters";
import type { CountryMonitorStat } from "@/lib/monitor";
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
  WORLD_GEOJSON_FALLBACK,
  WORLD_GEOJSON_LOCAL,
} from "@/lib/mapConstants";
import type {
  ChoroplethMetric,
  MonitorGhostPin,
  MonitorMapViewState,
  MonitorNewsPin,
  RegionPreset,
} from "@/lib/monitorMapTypes";
import { choroplethFillOpacity, choroplethValue } from "@/lib/monitorMapTypes";
import {
  buildRichPopupHtml,
  escapeHtml,
  markerShapeClass,
} from "@/lib/monitorMapUtils";
import type { CountryCode } from "@/lib/types";
import { CRIME_CATEGORY_LABELS } from "@/lib/types";
import type { GeoJSON as GeoJSONType, FeatureGroup, Layer, LayerGroup, Map as LeafletMap, Path } from "leaflet";

type Props = {
  pins: MonitorCasePin[];
  ghostPins?: MonitorGhostPin[];
  newsPins?: MonitorNewsPin[];
  countryStats?: CountryMonitorStat[];
  pinIndex?: Record<string, { lat: number; lng: number; slug: string }>;
  selectedCountry?: CountryCode | "";
  selectedCaseId?: string;
  hoveredCaseId?: string;
  view: MonitorMapViewState;
  onSelectCountry?: (code: CountryCode | "") => void;
  onSelectCase?: (id: string) => void;
  onHoverCase?: (id: string) => void;
  onRegionPreset?: (preset: RegionPreset) => void;
  onBboxChange?: (bbox: MonitorMapViewState["bboxFilter"]) => void;
  regionFlyRequest?: RegionPreset | null;
  isDrawingBbox?: boolean;
  cardRef?: RefObject<HTMLDivElement | null>;
};

function featureIso3(feature: GeoJSON.Feature | undefined): string | undefined {
  if (!feature || feature.type !== "Feature") return undefined;
  const id = feature.id;
  return typeof id === "string" ? id : undefined;
}

function layerFeature(layer: Layer): GeoJSON.Feature | undefined {
  return (layer as Layer & { feature?: GeoJSON.Feature }).feature;
}

function markerHtml(
  pin: MonitorCasePin,
  active: boolean,
  hovered: boolean,
  provenanceDimmed: boolean,
): string {
  const size = active || hovered ? 14 : 10;
  const unsolved = pin.status === "unsolved";
  const color = unsolved ? "var(--maroon)" : "var(--accent)";
  const opacity = provenanceDimmed ? 0.35 : 1;
  const shape = markerShapeClass(pin.primaryCategory);
  const ring = active
    ? `<span class="monitor-marker-ring"></span>`
    : hovered
      ? `<span class="monitor-marker-ring is-hover"></span>`
      : "";
  return `<span class="monitor-leaflet-marker ${shape}" style="width:${size}px;height:${size}px;background:${color};opacity:${opacity}">${ring}</span>`;
}

function newsMarkerHtml(): string {
  return `<span class="monitor-news-marker">◆</span>`;
}

function ghostMarkerHtml(): string {
  return `<span class="monitor-ghost-marker">?</span>`;
}

async function fetchCountryGeoJson(): Promise<GeoJSON.FeatureCollection> {
  for (const url of [WORLD_GEOJSON_LOCAL, WORLD_GEOJSON_FALLBACK]) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      return (await res.json()) as GeoJSON.FeatureCollection;
    } catch {
      /* try next */
    }
  }
  throw new Error("Country boundaries unavailable");
}

export function CaseWorldMap({
  pins,
  ghostPins = [],
  newsPins = [],
  countryStats = [],
  pinIndex = {},
  selectedCountry = "",
  selectedCaseId = "",
  hoveredCaseId = "",
  view,
  onSelectCountry,
  onSelectCase,
  onHoverCase,
  regionFlyRequest,
  isDrawingBbox = false,
  onBboxChange,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const clusterRef = useRef<FeatureGroup | null>(null);
  const newsLayerRef = useRef<LayerGroup | null>(null);
  const ghostLayerRef = useRef<LayerGroup | null>(null);
  const heatLayerRef = useRef<Layer | null>(null);
  const arcsLayerRef = useRef<LayerGroup | null>(null);
  const highlightRef = useRef<Layer | null>(null);
  const geoJsonRef = useRef<GeoJSONType | null>(null);
  const drawStartRef = useRef<{ lat: number; lng: number } | null>(null);
  const drawRectRef = useRef<Layer | null>(null);
  const onSelectCountryRef = useRef(onSelectCountry);
  const onSelectCaseRef = useRef(onSelectCase);
  const onHoverCaseRef = useRef(onHoverCase);
  const onBboxChangeRef = useRef(onBboxChange);
  const selectedCountryRef = useRef(selectedCountry);
  const [ready, setReady] = useState(false);
  const [hint, setHint] = useState("Loading map…");
  const [clusterCount, setClusterCount] = useState(0);

  useEffect(() => {
    onSelectCountryRef.current = onSelectCountry;
    onSelectCaseRef.current = onSelectCase;
    onHoverCaseRef.current = onHoverCase;
    onBboxChangeRef.current = onBboxChange;
    selectedCountryRef.current = selectedCountry;
  }, [onSelectCountry, onSelectCase, onHoverCase, onBboxChange, selectedCountry]);

  const filteredPins = filterVisiblePins(pins, view);
  const unsolvedVisible = filteredPins.filter((p) => p.status === "unsolved").length;

  const statsByCode = useMemoMap(countryStats);
  const choroplethMax = Math.max(
    1,
    ...countryStats.map((s) => choroplethValue(s, view.choroplethMetric)),
  );

  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;
    if (!container) return;

    (async () => {
      try {
        const L = await getLeafletWithCluster();
        await import("leaflet.heat");

        if (cancelled || !containerRef.current) return;

        const el = containerRef.current;
        const stamped = el as HTMLDivElement & { _leaflet_id?: number };
        if (stamped._leaflet_id) delete stamped._leaflet_id;

        const isTouch =
          typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

        const map = L.map(el, {
          center: DEFAULT_MAP_CENTER,
          zoom: DEFAULT_MAP_ZOOM,
          minZoom: MIN_MAP_ZOOM,
          maxZoom: MAX_MAP_ZOOM,
          worldCopyJump: true,
          scrollWheelZoom: !isTouch,
          zoomControl: true,
        });

        L.tileLayer(MAP_TILE_URL, {
          attribution: MAP_TILE_ATTRIBUTION,
          maxZoom: MAX_MAP_ZOOM,
        }).addTo(map);

        const cluster = L.markerClusterGroup({
          showCoverageOnHover: false,
          maxClusterRadius: 52,
          spiderfyOnMaxZoom: true,
          disableClusteringAtZoom: 8,
          iconCreateFunction: (group) => {
            const count = group.getChildCount();
            const hasUnsolved = group
              .getAllChildMarkers()
              .some((m) => (m.options as { unsolved?: boolean }).unsolved);
            const size = count < 10 ? 36 : count < 25 ? 42 : 48;
            return L.divIcon({
              html: `<span class="monitor-cluster ${hasUnsolved ? "has-unsolved" : ""}">${count}</span>`,
              className: "monitor-cluster-icon",
              iconSize: [size, size],
            });
          },
        });
        cluster.addTo(map);
        clusterRef.current = cluster;

        const newsLayer = L.layerGroup().addTo(map);
        newsLayerRef.current = newsLayer;

        const ghostLayer = L.layerGroup().addTo(map);
        ghostLayerRef.current = ghostLayer;

        const arcsLayer = L.layerGroup().addTo(map);
        arcsLayerRef.current = arcsLayer;

        mapRef.current = map;
        setReady(true);
        setHint(
          isTouch
            ? "Pinch to zoom · Tap markers and clusters"
            : "Drag to pan · Scroll to zoom · Draw area filter in controls",
        );

        requestAnimationFrame(() => map.invalidateSize());

        try {
          const data = await fetchCountryGeoJson();
          if (cancelled || !mapRef.current) return;

          const layer = L.geoJSON(data, {
            style: (feature?: GeoJSON.Feature) => {
              const iso3 = featureIso3(feature);
              const code = iso3 ? ISO3_TO_COUNTRY[iso3] : undefined;
              const active = selectedCountry && code === selectedCountry;
              const stat = code ? statsByCode.get(code) : undefined;
              const val = view.choroplethEnabled
                ? choroplethValue(stat, view.choroplethMetric)
                : 0;
              const fillOpacity = view.choroplethEnabled
                ? choroplethFillOpacity(val, choroplethMax)
                : active
                  ? 0.12
                  : 0.03;
              return {
                color: active ? "var(--accent)" : "var(--line-strong)",
                weight: active ? 2 : 0.6,
                fillColor: view.choroplethEnabled && val > 0 ? "var(--accent)" : "var(--line)",
                fillOpacity,
              };
            },
            onEachFeature: (feature: GeoJSON.Feature, featureLayer: Layer) => {
              const iso3 = featureIso3(feature);
              const code = iso3 ? ISO3_TO_COUNTRY[iso3] : undefined;
              if (!code) return;
              const stat = statsByCode.get(code);
              const label = stat
                ? `${COUNTRY_LABELS[code]}: ${stat.caseCount} cases${stat.unsolvedCount ? `, ${stat.unsolvedCount} unsolved` : ""}`
                : COUNTRY_LABELS[code];
              featureLayer.bindTooltip(label, { sticky: true, opacity: 0.92 });
              featureLayer.on({
                click: () => {
                  const current = selectedCountryRef.current;
                  onSelectCountryRef.current?.(current === code ? "" : code);
                },
              });
            },
          });
          layer.addTo(map);
          geoJsonRef.current = layer;
        } catch {
          setHint("Map loaded · country boundaries unavailable");
        }
      } catch {
        setHint("Map failed to load — refresh the page");
      }
    })();

    return () => {
      cancelled = true;
      clusterRef.current = null;
      newsLayerRef.current = null;
      ghostLayerRef.current = null;
      heatLayerRef.current = null;
      arcsLayerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
      geoJsonRef.current = null;
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init once
  }, []);

  // Case markers / heatmap
  useEffect(() => {
    if (!ready || !mapRef.current || !clusterRef.current) return;

    (async () => {
      const L = await getLeaflet();
      const map = mapRef.current!;
      const cluster = clusterRef.current!;

      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }

      cluster.clearLayers();

      const showCases = view.contentLayer === "cases" || view.contentLayer === "both";

      if (view.layerMode === "heatmap" && showCases && filteredPins.length) {
        cluster.clearLayers();
        const points = filteredPins.map((p) => [p.lat, p.lng, p.status === "unsolved" ? 1.2 : 0.8] as [number, number, number]);
        const heat = (L as typeof L & { heatLayer: (latlngs: [number, number, number][], opts: object) => Layer }).heatLayer(
          points,
          { radius: 28, blur: 22, maxZoom: 8, minOpacity: 0.35, gradient: { 0.2: "#2a1520", 0.5: "#8b2942", 0.8: "#c94b6a", 1: "#f0a0b8" } },
        );
        heat.addTo(map);
        heatLayerRef.current = heat;
      } else if (showCases) {
        for (const pin of filteredPins) {
          const active = selectedCaseId === pin.id;
          const hovered = hoveredCaseId === pin.id;
          const marker = L.marker([pin.lat, pin.lng], {
            unsolved: pin.status === "unsolved",
            caseId: pin.id,
            icon: L.divIcon({
              className: "monitor-leaflet-icon",
              html: markerHtml(pin, active, hovered, false),
              iconSize: [20, 20],
              iconAnchor: [10, 10],
            }),
          } as L.MarkerOptions & { unsolved?: boolean; caseId?: string });

          marker.bindPopup(buildRichPopupHtml(pin), { maxWidth: 280, className: "monitor-leaflet-popup" });

          marker.on("click", () => {
            onSelectCaseRef.current?.(pin.id);
            map.flyTo([pin.lat, pin.lng], Math.max(map.getZoom(), 6), { duration: 0.6 });
          });
          marker.on("mouseover", () => onHoverCaseRef.current?.(pin.id));
          marker.on("mouseout", () => onHoverCaseRef.current?.(""));

          cluster.addLayer(marker);
        }
      }

      setClusterCount(cluster.getLayers().length);
    })();
  }, [filteredPins, ready, selectedCaseId, hoveredCaseId, view.contentLayer, view.layerMode]);

  // News markers
  useEffect(() => {
    if (!ready || !newsLayerRef.current) return;
    void (async () => {
      const L = await getLeaflet();
      const layer = newsLayerRef.current!;
      layer.clearLayers();
      const showNews = view.contentLayer === "news" || view.contentLayer === "both";
      if (!showNews) return;
      for (const item of newsPins) {
        const marker = L.marker([item.lat, item.lng], {
          icon: L.divIcon({
            className: "monitor-leaflet-icon",
            html: newsMarkerHtml(),
            iconSize: [18, 18],
            iconAnchor: [9, 9],
          }),
        });
        const link = item.caseSlug
          ? `<a href="/?case=${escapeHtml(item.caseSlug)}">Linked dossier</a>`
          : "";
        marker.bindPopup(
          `<div class="monitor-popup"><strong>${escapeHtml(item.headline)}</strong><p class="monitor-popup-sub">${escapeHtml(item.summary.slice(0, 160))}…</p><p class="monitor-popup-meta">${escapeHtml(item.region)}</p>${link}</div>`,
          { maxWidth: 280 },
        );
        layer.addLayer(marker);
      }
    })();
  }, [newsPins, ready, view.contentLayer]);

  // Ghost markers
  useEffect(() => {
    if (!ready || !ghostLayerRef.current) return;
    void (async () => {
      const L = await getLeaflet();
      const layer = ghostLayerRef.current!;
      layer.clearLayers();
      if (!view.showGhostPins) return;
      for (const g of ghostPins) {
        const marker = L.marker([g.lat, g.lng], {
          icon: L.divIcon({
            className: "monitor-leaflet-icon",
            html: ghostMarkerHtml(),
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          }),
        });
        marker.bindTooltip(`${g.name} — estimated country pin (no city coords)`, { direction: "top" });
        marker.on("click", () => onSelectCaseRef.current?.(g.id));
        layer.addLayer(marker);
      }
    })();
  }, [ghostPins, ready, view.showGhostPins]);

  // Related arcs
  useEffect(() => {
    if (!ready || !arcsLayerRef.current) return;
    void (async () => {
      const L = await getLeaflet();
      const layer = arcsLayerRef.current!;
      layer.clearLayers();
      if (!view.showRelatedArcs || !selectedCaseId) return;
      const origin = filteredPins.find((p) => p.id === selectedCaseId);
      if (!origin) return;
      for (const slug of origin.relatedCaseSlugs) {
        const target = pinIndex[slug] ?? filteredPins.find((p) => p.slug === slug);
        if (!target) continue;
        const latlngs: [number, number][] = [
          [origin.lat, origin.lng],
          [target.lat, target.lng],
        ];
        const arc = L.polyline(latlngs, {
          color: "var(--accent)",
          weight: 1.5,
          opacity: 0.55,
          dashArray: "6 8",
        });
        layer.addLayer(arc);
      }
    })();
  }, [filteredPins, pinIndex, ready, selectedCaseId, view.showRelatedArcs]);

  // Choropleth + country highlight
  useEffect(() => {
    if (!ready || !geoJsonRef.current) return;
    void (async () => {
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
        const stat = code ? statsByCode.get(code) : undefined;
        const val = view.choroplethEnabled ? choroplethValue(stat, view.choroplethMetric) : 0;
        const fillOpacity = view.choroplethEnabled
          ? choroplethFillOpacity(val, choroplethMax)
          : active
            ? 0.15
            : 0.03;
        (layer as Path).setStyle({
          color: active ? "var(--accent)" : "var(--line-strong)",
          weight: active ? 2 : 0.6,
          fillColor: view.choroplethEnabled && val > 0 ? "var(--accent)" : "var(--line)",
          fillOpacity,
        });
      });

      if (selectedCountry) {
        const iso3 = COUNTRY_ISO3[selectedCountry];
        if (iso3 && geoJsonRef.current) {
          const match = geoJsonRef.current.getLayers().find((l) => featureIso3(layerFeature(l)) === iso3);
          if (match) highlightRef.current = match;
        }
        const bounds = COUNTRY_BOUNDS[selectedCountry];
        if (bounds) map.flyToBounds(bounds, { padding: [24, 24], duration: 0.8, maxZoom: 5 });
      } else if (filteredPins.length && clusterRef.current && view.layerMode === "pins") {
        const bounds = clusterRef.current.getBounds();
        if (bounds.isValid()) map.flyToBounds(bounds, { padding: [32, 32], duration: 0.8, maxZoom: 4 });
      }
    })();
  }, [
    selectedCountry,
    ready,
    filteredPins.length,
    view.choroplethEnabled,
    view.choroplethMetric,
    view.layerMode,
    countryStats,
    choroplethMax,
    statsByCode,
  ]);

  // Fly to selected case
  useEffect(() => {
    if (!ready || !selectedCaseId || !mapRef.current) return;
    const pin = filteredPins.find((p) => p.id === selectedCaseId);
    if (pin) {
      mapRef.current.flyTo([pin.lat, pin.lng], Math.max(mapRef.current.getZoom(), 6), { duration: 0.6 });
    }
  }, [selectedCaseId, filteredPins, ready]);

  // Region preset fly
  useEffect(() => {
    if (!ready || !regionFlyRequest || !mapRef.current) return;
    mapRef.current.flyToBounds(regionFlyRequest.bounds, { padding: [24, 24], duration: 0.9, maxZoom: 4 });
  }, [regionFlyRequest, ready]);

  // Bbox drawing
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const map = mapRef.current;

    if (!isDrawingBbox) {
      map.getContainer().style.cursor = "";
      map.dragging.enable();
      map.doubleClickZoom.enable();
      return;
    }

    map.dragging.disable();
    map.doubleClickZoom.disable();
    map.getContainer().style.cursor = "crosshair";
    let start: { lat: number; lng: number } | null = null;
    let rect: Layer | null = null;

    const onDown = (e: { latlng: { lat: number; lng: number } }) => {
      start = e.latlng;
      drawStartRef.current = { lat: e.latlng.lat, lng: e.latlng.lng };
    };

    const onMove = (e: { latlng: { lat: number; lng: number } }) => {
      if (!start) return;
      void getLeaflet().then((L) => {
        if (rect) map.removeLayer(rect);
        const bounds = L.latLngBounds([start!, e.latlng]);
        rect = L.rectangle(bounds, { color: "var(--accent)", weight: 1.5, fillOpacity: 0.08 });
        rect.addTo(map);
        drawRectRef.current = rect;
      });
    };

    const onUp = (e: { latlng: { lat: number; lng: number } }) => {
      if (!start) return;
      const south = Math.min(start.lat, e.latlng.lat);
      const north = Math.max(start.lat, e.latlng.lat);
      const west = Math.min(start.lng, e.latlng.lng);
      const east = Math.max(start.lng, e.latlng.lng);
      onBboxChangeRef.current?.([
        [south, west],
        [north, east],
      ]);
      start = null;
      map.getContainer().style.cursor = "";
    };

    map.on("mousedown", onDown);
    map.on("mousemove", onMove);
    map.on("mouseup", onUp);

    return () => {
      map.off("mousedown", onDown);
      map.off("mousemove", onMove);
      map.off("mouseup", onUp);
      map.getContainer().style.cursor = "";
      map.dragging.enable();
      map.doubleClickZoom.enable();
      if (rect) map.removeLayer(rect);
    };
  }, [isDrawingBbox, ready]);

  function resetView() {
    if (!mapRef.current) return;
    void (async () => {
      const L = await getLeaflet();
      if (!mapRef.current) return;
      if (clusterRef.current?.getLayers().length) {
        const bounds = clusterRef.current.getBounds();
        if (bounds.isValid()) {
          mapRef.current.fitBounds(bounds, { padding: [32, 32], maxZoom: 4 });
          return;
        }
      }
      if (filteredPins.length) {
        const latLngs = filteredPins.map((p) => [p.lat, p.lng] as [number, number]);
        if (latLngs.length === 1) mapRef.current.setView(latLngs[0], 3);
        else mapRef.current.fitBounds(L.latLngBounds(latLngs), { padding: [32, 32], maxZoom: 4 });
      } else {
        mapRef.current.setView(DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM);
      }
    })();
  }

  return (
    <div className="monitor-map-wrap">
      <div ref={containerRef} className="monitor-leaflet-map" aria-label="Interactive world map" />
      <MonitorMapOverlay
        visibleCaseCount={filteredPins.length}
        totalCaseCount={pins.length}
        unsolvedVisible={unsolvedVisible}
        newsCount={
          view.contentLayer === "news" || view.contentLayer === "both" ? newsPins.length : 0
        }
        choroplethEnabled={view.choroplethEnabled}
        choroplethMetric={view.choroplethMetric}
        choroplethMax={choroplethMax}
        timelineLabel={`${view.timelineMinYear}–${view.timelineMaxYear}`}
        bboxActive={Boolean(view.bboxFilter)}
      />
      <div className="monitor-map-float-controls">
        <button type="button" className="monitor-map-btn" onClick={resetView} title="Reset view">
          ⟲
        </button>
      </div>
      <div className="monitor-map-toolbar">
        <span className="monitor-map-hint">{hint}</span>
      </div>
      <div className="monitor-map-legend">
        <span className="monitor-legend-item">
          <span className="monitor-dot monitor-dot-closed" /> Closed / historical
        </span>
        <span className="monitor-legend-item">
          <span className="monitor-dot monitor-dot-unsolved" /> Unsolved
        </span>
        <span className="monitor-legend-item">
          <span className="monitor-news-marker monitor-legend-news">◆</span> News
        </span>
        {view.choroplethEnabled ? (
          <span className="monitor-legend-item">Choropleth: {view.choroplethMetric}</span>
        ) : null}
        <span className="monitor-legend-meta">
          {filteredPins.length} cases · {clusterCount} markers · {view.timelineMinYear}–{view.timelineMaxYear}
        </span>
      </div>
    </div>
  );
}

function useMemoMap(stats: CountryMonitorStat[]): Map<CountryCode, CountryMonitorStat> {
  const ref = useRef<Map<CountryCode, CountryMonitorStat>>(new Map());
  const key = stats.map((s) => `${s.code}:${s.caseCount}:${s.unsolvedCount}`).join("|");
  const prevKey = useRef("");
  if (prevKey.current !== key) {
    ref.current = new Map(stats.map((s) => [s.code, s]));
    prevKey.current = key;
  }
  return ref.current;
}

/** Pin tooltip card shown beside map when a case is selected. */
export function MonitorCaseCard({
  pin,
  onClose,
  cardRef,
  comparePin,
}: {
  pin: MonitorCasePin;
  onClose?: () => void;
  cardRef?: RefObject<HTMLDivElement | null>;
  comparePin?: MonitorCasePin | null;
}) {
  const unsolved = pin.status === "unsolved";
  const accLabel =
    pin.coordAccuracy === "city"
      ? "City-level pin"
      : pin.coordAccuracy === "centroid"
        ? "Country estimate"
        : "Regional estimate";
  const tierLabel =
    pin.provenanceTier === "verified"
      ? "Verified source"
      : pin.provenanceTier === "curated"
        ? "Curated dossier"
        : pin.provenanceTier === "composite"
          ? "Teaching template"
          : "Draft";

  return (
    <div
      ref={cardRef}
      className="monitor-case-card"
      role="dialog"
      aria-modal="true"
      aria-label={`Case: ${pin.name}`}
    >
      <div className="monitor-case-card-accent" data-status={pin.status} />
      {pin.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={pin.imageUrl} alt="" className="monitor-case-card-img" loading="lazy" />
      ) : null}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="label mb-0">
            {pin.yearStart}
            {pin.yearEnd ? `–${pin.yearEnd}` : ""}
          </p>
          {unsolved ? <span className="monitor-pill monitor-pill-open">unsolved</span> : null}
          <span className="monitor-pill monitor-pill-lang">{tierLabel}</span>
        </div>
        {onClose ? (
          <button type="button" onClick={onClose} className="monitor-case-close" aria-label="Close">
            ×
          </button>
        ) : null}
      </div>
      <h3 className="display mt-2 text-xl leading-tight">{pin.name}</h3>
      <p className="mt-1.5 text-sm leading-snug text-[var(--ink-soft)]">{pin.subtitle}</p>
      <p className="mt-3 text-xs text-[var(--muted)]">
        {COUNTRY_LABELS[pin.country]} ·{" "}
        {pin.crimeCategories.map((c) => CRIME_CATEGORY_LABELS[c]).join(" · ")}
      </p>
      <p className="mt-1 text-xs text-[var(--muted)]">
        {accLabel} · {pin.lat.toFixed(2)}°, {pin.lng.toFixed(2)}°
      </p>
      {comparePin ? (
        <p className="mt-2 text-xs text-[var(--accent)]">
          Compare with: {comparePin.name} ({comparePin.yearStart})
        </p>
      ) : null}
      <div className="mt-4 flex flex-col gap-2">
        <Link href={`/cases/${pin.slug}`} className="btn btn-primary block text-center text-sm">
          Open dossier →
        </Link>
        <ShareMonitorLink slug={pin.slug} />
      </div>
    </div>
  );
}

function ShareMonitorLink({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    const url = `${window.location.origin}/?case=${encodeURIComponent(slug)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <button type="button" onClick={() => void copyLink()} className="btn btn-ghost text-sm">
      {copied ? "Link copied" : "Copy map link"}
    </button>
  );
}
