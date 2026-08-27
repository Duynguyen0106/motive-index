export const CASE_TABS = [
  { id: "story", label: "Full story" },
  { id: "overview", label: "Overview" },
  { id: "timeline", label: "Timeline" },
  { id: "analysis", label: "Psychology" },
  { id: "documents", label: "Documents" },
  { id: "references", label: "References" },
] as const;

export type CaseTabId = (typeof CASE_TABS)[number]["id"];

export function getActiveTab(tab: string | undefined, opts?: { hasNarrative?: boolean }): CaseTabId {
  const ids = CASE_TABS.map((t) => t.id);
  if (tab && ids.includes(tab as CaseTabId)) return tab as CaseTabId;
  return opts?.hasNarrative ? "story" : "overview";
}
