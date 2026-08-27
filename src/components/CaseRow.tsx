import Link from "next/link";
import type { CrimeCase } from "@/lib/types";
import { CRIME_CATEGORY_LABELS } from "@/lib/types";

export function CaseRow({ crimeCase: c }: { crimeCase: CrimeCase }) {
  return (
    <Link href={`/cases/${c.id}`} className="index-row group">
      <span className="index-year">
        {c.yearStart}
        {c.yearEnd ? `–${c.yearEnd}` : ""}
      </span>
      <span>
        <span className="index-title group-hover:text-[var(--accent)]">{c.name}</span>
        <span className="mt-1 block text-sm text-[var(--ink-soft)]">{c.subtitle}</span>
      </span>
      <span className="index-meta">
        {c.crimeCategories.map((x) => CRIME_CATEGORY_LABELS[x]).join(" · ")}
      </span>
    </Link>
  );
}
