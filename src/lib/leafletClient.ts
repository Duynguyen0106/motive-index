import type L from "leaflet";

let leafletPromise: Promise<typeof L> | null = null;
let clusterPromise: Promise<typeof L> | null = null;

/** Cached Leaflet namespace (side-effect: loads CSS once). */
export async function getLeaflet(): Promise<typeof L> {
  if (!leafletPromise) {
    leafletPromise = (async () => {
      await import("leaflet/dist/leaflet.css");
      const mod = await import("leaflet");
      const L = mod.default;
      if (typeof window !== "undefined") {
        (window as unknown as { L: typeof L }).L = L;
      }
      return L;
    })();
  }
  return leafletPromise;
}

/** Leaflet with markercluster plugin registered (must load base Leaflet first). */
export async function getLeafletWithCluster(): Promise<typeof L> {
  if (!clusterPromise) {
    clusterPromise = (async () => {
      const L = await getLeaflet();
      await Promise.all([
        import("leaflet.markercluster/dist/MarkerCluster.css"),
        import("leaflet.markercluster/dist/MarkerCluster.Default.css"),
      ]);
      // UMD build expects global L — set before importing the plugin script.
      await import("leaflet.markercluster");
      if (typeof L.markerClusterGroup !== "function") {
        throw new Error("leaflet.markercluster failed to register on Leaflet");
      }
      return L;
    })();
  }
  return clusterPromise;
}
