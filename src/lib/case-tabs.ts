export const CASE_TABS = [
  { id: "story", label: "Full story" },
  { id: "overview", label: "Overview" },
  { id: "timeline", label: "Timeline" },
  { id: "analysis", label: "Psychology" },
  { id: "documents", label: "Documents" },
  { id: "references", label: "References" },
] as const;

export type CaseTabId = (typeof CASE_TABS)[number]["id"];

export function getActiveTab(tab: string | undefined): CaseTabId {
  const ids = CASE_TABS.map((t) => t.id);
  return ids.includes(tab as CaseTabId) ? (tab as CaseTabId) : "story";
}
