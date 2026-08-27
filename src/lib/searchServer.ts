import { searchCases, searchDocuments } from "@/lib/data";
import type { SearchFilters } from "@/lib/types";

export function runSearch(filters: SearchFilters) {
  return {
    cases: searchCases(filters),
    documents: searchDocuments(filters),
  };
}
