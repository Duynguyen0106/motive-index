import Link from "next/link";
import { COUNTRY_LABELS } from "@/lib/country";
import { archiveUrlFromFilters, monitorUrlFromFilters } from "@/lib/search";
import type { SearchFilters } from "@/lib/types";
import { CRIME_CATEGORY_LABELS } from "@/lib/types";

function withoutFilter(filters: SearchFilters, key: keyof SearchFilters): string {
  const next = { ...filters, [key]: key === "catalogTier" ? "all" : "" };
  return archiveUrlFromFilters(next);
}

const CATALOG_LABELS: Record<string, string> = {
  curated: "Curated only",
  composite: "Composite archive",
};

export function ArchiveFilterChips({ filters }: { filters: SearchFilters }) {
  const chips: { label: string; href: string }[] = [];

  if (filters.q?.trim()) {
    chips.push({ label: `"${filters.q.trim()}"`, href: withoutFilter(filters, "q") });
  }
  if (filters.country) {
    chips.push({
      label: COUNTRY_LABELS[filters.country],
      href: withoutFilter(filters, "country"),
    });
  }
  if (filters.crimeCategory) {
    chips.push({
      label: CRIME_CATEGORY_LABELS[filters.crimeCategory],
      href: withoutFilter(filters, "crimeCategory"),
    });
  }
  if (filters.status) {
    chips.push({
      label: filters.status.charAt(0).toUpperCase() + filters.status.slice(1),
      href: withoutFilter(filters, "status"),
    });
  }
  if (filters.period?.trim()) {
    chips.push({ label: filters.period.trim(), href: withoutFilter(filters, "period") });
  }
  if (filters.catalogTier && filters.catalogTier !== "all") {
    chips.push({
      label: CATALOG_LABELS[filters.catalogTier] ?? filters.catalogTier,
      href: withoutFilter(filters, "catalogTier"),
    });
  }

  if (!chips.length) return null;

  return (
    <div className="active-filters mb-4 flex flex-wrap items-center gap-2" aria-label="Active filters">
      <span className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">Filters</span>
      {chips.map((chip) => (
        <Link key={chip.label} href={chip.href} className="filter-chip filter-chip-removable">
          {chip.label}
          <span aria-hidden> ×</span>
        </Link>
      ))}
      <Link href={monitorUrlFromFilters(filters)} className="filter-chip filter-chip-link">
        View on map →
      </Link>
      <Link href="/archive" className="filter-chip filter-chip-clear">
        Clear all
      </Link>
    </div>
  );
}
