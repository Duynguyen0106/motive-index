export const CASE_TABS = [
  { id: "story", label: "Full story" },
  { id: "overview", label: "Overview" },
  { id: "timeline", label: "Timeline" },
  { id: "analysis", label: "Psychology" },
  { id: "documents", label: "Documents" },
  { id: "references", label: "References" },
] as const;

export type CaseTabId = (typeof CASE_TABS)[number]["id"];

export function visibleCaseTabs(hasNarrative = false) {
  return hasNarrative ? CASE_TABS : CASE_TABS.filter((t) => t.id !== "story");
}

export function getActiveTab(tab: string | undefined, opts?: { hasNarrative?: boolean }): CaseTabId {
  const ids = visibleCaseTabs(opts?.hasNarrative).map((t) => t.id);
  if (tab && ids.includes(tab as CaseTabId)) return tab as CaseTabId;
  return opts?.hasNarrative ? "story" : "overview";
}

export function dossierShareUrl(
  slug: string,
  tab: string,
  opts?: { hasNarrative?: boolean; siteOrigin?: string },
): string {
  const defaultTab = opts?.hasNarrative ? "story" : "overview";
  const path = `/cases/${slug}`;
  const withTab = tab && tab !== defaultTab ? `${path}?tab=${encodeURIComponent(tab)}` : path;
  return opts?.siteOrigin ? `${opts.siteOrigin}${withTab}` : withTab;
}
