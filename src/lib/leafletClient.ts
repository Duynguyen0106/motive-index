import type L from "leaflet";

let leafletPromise: Promise<typeof L> | null = null;
let clusterReady = false;

/** Cached Leaflet namespace (side-effect: loads CSS once). */
export async function getLeaflet(): Promise<typeof L> {
  if (!leafletPromise) {
    leafletPromise = (async () => {
      await import("leaflet/dist/leaflet.css");
      const mod = await import("leaflet");
      return mod.default;
    })();
  }
  return leafletPromise;
}

/** Leaflet with markercluster plugin registered. */
export async function getLeafletWithCluster(): Promise<typeof L> {
  if (!clusterReady) {
    await Promise.all([
      import("leaflet.markercluster/dist/MarkerCluster.css"),
      import("leaflet.markercluster/dist/MarkerCluster.Default.css"),
      import("leaflet.markercluster"),
    ]);
    clusterReady = true;
  }
  return getLeaflet();
}
