import type { SearchFilters } from "@/lib/types";
import { searchCases, searchDocuments } from "@/lib/data";

export function parseSearchParams(
  params: Record<string, string | string[] | undefined>,
): SearchFilters {
  const g = (k: string) => {
    const v = params[k];
    return typeof v === "string" ? v : "";
  };

  return {
    q: g("q"),
    crimeCategory: g("crimeCategory") as SearchFilters["crimeCategory"],
    psychologicalFactor: g("psychologicalFactor") as SearchFilters["psychologicalFactor"],
    theoreticalFramework: g(
      "theoreticalFramework",
    ) as SearchFilters["theoreticalFramework"],
    diagnosis: g("diagnosis"),
    location: g("location"),
    period: g("period"),
    offenderSex: g("offenderSex"),
    documentType: g("documentType") as SearchFilters["documentType"],
    status: g("status") as SearchFilters["status"],
  };
}

export function runSearch(filters: SearchFilters) {
  return {
    cases: searchCases(filters),
    documents: searchDocuments(filters),
  };
}
