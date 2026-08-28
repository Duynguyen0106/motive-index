"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type RefObject } from "react";
import { COUNTRY_LABELS } from "@/lib/country";
import type { MonitorCasePin } from "@/lib/geo";
import { getLeaflet, getLeafletWithCluster } from "@/lib/leafletClient";
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
import type { CountryCode } from "@/lib/types";
import { CRIME_CATEGORY_LABELS } from "@/lib/types";
import type { GeoJSON as GeoJSONType, FeatureGroup, Layer, Map as LeafletMap, Path } from "leaflet";

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

async function fetchCountryGeoJson(): Promise<GeoJSON.FeatureCollection> {
  for (const url of [WORLD_GEOJSON_LOCAL, WORLD_GEOJSON_FALLBACK]) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      return (await res.json()) as GeoJSON.FeatureCollection;
    } catch {
      /* try next source */
    }
  }
  throw new Error("Country boundaries unavailable");
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
  const clusterRef = useRef<FeatureGroup | null>(null);
  const highlightRef = useRef<Layer | null>(null);
  const geoJsonRef = useRef<GeoJSONType | null>(null);
  const onSelectCountryRef = useRef(onSelectCountry);
  const onSelectCaseRef = useRef(onSelectCase);
  const selectedCountryRef = useRef(selectedCountry);
  const [ready, setReady] = useState(false);
  const [hint, setHint] = useState("Loading map…");
  const [clusterCount, setClusterCount] = useState(0);

  useEffect(() => {
    onSelectCountryRef.current = onSelectCountry;
    onSelectCaseRef.current = onSelectCase;
    selectedCountryRef.current = selectedCountry;
  }, [onSelectCountry, onSelectCase, selectedCountry]);

  // Init Leaflet map once
  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;
    if (!container) return;

    (async () => {
      try {
        const L = await getLeafletWithCluster();

        if (cancelled || !containerRef.current) return;

        const el = containerRef.current;
        const stamped = el as HTMLDivElement & { _leaflet_id?: number };
        if (stamped._leaflet_id) {
          delete stamped._leaflet_id;
        }

        const map = L.map(el, {
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
          maxZoom: MAX_MAP_ZOOM,
        }).addTo(map);

        const cluster = L.markerClusterGroup({
          showCoverageOnHover: false,
          maxClusterRadius: 52,
          spiderfyOnMaxZoom: true,
          disableClusteringAtZoom: 8,
          iconCreateFunction: (group: {
            getChildCount: () => number;
            getAllChildMarkers: () => L.Marker[];
          }) => {
            const count = group.getChildCount();
            const hasUnsolved = group
              .getAllChildMarkers()
              .some((m: L.Marker) => (m.options as { unsolved?: boolean }).unsolved);
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

        mapRef.current = map;
        setReady(true);
        setHint("Drag to pan · Scroll or pinch to zoom · Click clusters to expand");

        requestAnimationFrame(() => {
          map.invalidateSize();
        });

        try {
          const data = await fetchCountryGeoJson();
          if (cancelled || !mapRef.current) return;

          const layer = L.geoJSON(data, {
            style: (feature?: GeoJSON.Feature) => {
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
            onEachFeature: (feature: GeoJSON.Feature, featureLayer: Layer) => {
              const iso3 = featureIso3(feature);
              const code = iso3 ? ISO3_TO_COUNTRY[iso3] : undefined;
              if (!code) return;
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
      mapRef.current?.remove();
      mapRef.current = null;
      geoJsonRef.current = null;
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init once
  }, []);

  // Sync markers when pins / selection change
  useEffect(() => {
    if (!ready || !mapRef.current || !clusterRef.current) return;

    (async () => {
      const L = await getLeaflet();
      const cluster = clusterRef.current!;

      cluster.clearLayers();

      for (const pin of pins) {
        const active = selectedCaseId === pin.id;
        const unsolved = pin.status === "unsolved";
        const marker = L.marker([pin.lat, pin.lng], {
          unsolved,
          icon: L.divIcon({
            className: "monitor-leaflet-icon",
            html: markerHtml(active, unsolved),
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          }),
        } as L.MarkerOptions & { unsolved?: boolean });

        marker.bindTooltip(
          `<strong>${pin.name}</strong><br/>${pin.yearStart}${pin.yearEnd ? `–${pin.yearEnd}` : ""} · ${COUNTRY_LABELS[pin.country]}`,
          {
            direction: "top",
            offset: [0, -8],
            opacity: 0.95,
          },
        );

        marker.on("click", () => {
          onSelectCaseRef.current?.(pin.id);
          mapRef.current?.flyTo([pin.lat, pin.lng], Math.max(mapRef.current.getZoom(), 6), {
            duration: 0.6,
          });
        });

        cluster.addLayer(marker);
      }

      setClusterCount(cluster.getLayers().length);
    })();
  }, [pins, ready, selectedCaseId]);

  // Highlight country + fly to bounds
  useEffect(() => {
    if (!ready || !geoJsonRef.current) return;

    (async () => {
      const L = await getLeaflet();
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
      } else if (pins.length && clusterRef.current) {
        const bounds = clusterRef.current.getBounds();
        if (bounds.isValid()) {
          map.flyToBounds(bounds, { padding: [32, 32], duration: 0.8, maxZoom: 4 });
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
      const L = await getLeaflet();
      if (!mapRef.current) return;
      if (clusterRef.current && clusterRef.current.getLayers().length) {
        const bounds = clusterRef.current.getBounds();
        if (bounds.isValid()) {
          mapRef.current.fitBounds(bounds, { padding: [32, 32], maxZoom: 4 });
          return;
        }
      }
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
        <span className="monitor-legend-meta">
          {pins.length} cases · {clusterCount} markers · Esri dark canvas
        </span>
      </div>
    </div>
  );
}

/** Pin tooltip card shown beside map when a case is selected. */
export function MonitorCaseCard({
  pin,
  onClose,
  cardRef,
}: {
  pin: MonitorCasePin;
  onClose?: () => void;
  cardRef?: RefObject<HTMLDivElement | null>;
}) {
  const unsolved = pin.status === "unsolved";
  return (
    <div
      ref={cardRef}
      className="monitor-case-card"
      role="dialog"
      aria-modal="true"
      aria-label={`Case: ${pin.name}`}
    >
      <div className="monitor-case-card-accent" data-status={pin.status} />
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="label mb-0">
            {pin.yearStart}
            {pin.yearEnd ? `–${pin.yearEnd}` : ""}
          </p>
          {unsolved ? <span className="monitor-pill monitor-pill-open">unsolved</span> : null}
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="monitor-case-close"
            aria-label="Close"
          >
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
      <p className="mt-1 font-mono text-[10px] text-[var(--muted)]">
        {pin.lat.toFixed(2)}°, {pin.lng.toFixed(2)}°
      </p>
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
