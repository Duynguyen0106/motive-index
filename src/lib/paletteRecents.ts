export type PaletteRecent = { slug: string; name: string; visitedAt: number };

const STORAGE_KEY = "motive-index-palette-recents";
const MAX_RECENTS = 8;

export function loadPaletteRecents(): PaletteRecent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PaletteRecent[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENTS) : [];
  } catch {
    return [];
  }
}

export function pushPaletteRecent(entry: { slug: string; name: string }) {
  if (typeof window === "undefined") return;
  try {
    const prev = loadPaletteRecents().filter((r) => r.slug !== entry.slug);
    const next: PaletteRecent[] = [
      { slug: entry.slug, name: entry.name, visitedAt: Date.now() },
      ...prev,
    ].slice(0, MAX_RECENTS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota errors */
  }
}
