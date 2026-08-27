"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { CrimeCase, CrimeCategory } from "@/lib/types";
import { CRIME_CATEGORY_LABELS } from "@/lib/types";

export function CasesGrid({ cases }: { cases: CrimeCase[] }) {
  const [q, setQ] = useState("");
  const [crimeType, setCrimeType] = useState<CrimeCategory | "">("");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return cases.filter((c) => {
      if (crimeType && !c.crimeCategories.includes(crimeType)) return false;
      if (!query) return true;
      const hay = [c.name, c.subtitle, c.overview, c.location, ...(c.aliases ?? [])]
        .join(" ")
        .toLowerCase();
      return hay.includes(query);
    });
  }, [cases, q, crimeType]);

  return (
    <div>
      <form
        className="mb-8 grid gap-4 border border-[var(--line)] bg-[var(--paper)] p-4 md:grid-cols-[1fr_220px_auto] md:items-end"
        onSubmit={(e) => e.preventDefault()}
      >
        <label className="block text-sm">
          <span className="label mb-1 block normal-case tracking-normal">Keyword</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Name, place, motif…"
            className="field mt-1"
          />
        </label>
        <label className="block text-sm">
          <span className="label mb-1 block normal-case tracking-normal">Crime type</span>
          <select
            value={crimeType}
            onChange={(e) => setCrimeType(e.target.value as CrimeCategory | "")}
            className="field mt-1"
          >
            <option value="">All types</option>
            {(Object.keys(CRIME_CATEGORY_LABELS) as CrimeCategory[]).map((k) => (
              <option key={k} value={k}>
                {CRIME_CATEGORY_LABELS[k]}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => {
            setQ("");
            setCrimeType("");
          }}
          className="btn btn-ghost"
        >
          Clear
        </button>
      </form>

      <p className="mb-3 text-sm text-[var(--muted)]">
        {filtered.length} of {cases.length} shown
      </p>

      <div className="index-table">
        <div className="index-head">
          <span>Year</span>
          <span>Case</span>
          <span className="text-right">Classification</span>
        </div>
        {filtered.map((c) => (
          <Link key={c.id} href={`/cases/${c.id}`} className="index-row group">
            <span className="index-year">
              {c.yearStart}
              {c.yearEnd ? `–${c.yearEnd}` : ""}
            </span>
            <span>
              <span className="index-title group-hover:text-[var(--accent)]">{c.name}</span>
              <span className="mt-1 block text-sm text-[var(--ink-soft)] line-clamp-2">
                {c.subtitle}
              </span>
            </span>
            <span className="index-meta">
              {c.crimeCategories.slice(0, 2).map((x) => CRIME_CATEGORY_LABELS[x]).join(" · ")}
            </span>
          </Link>
        ))}
      </div>

      {!filtered.length ? (
        <p className="mt-8 text-[var(--muted)]">No records match this filter.</p>
      ) : null}
    </div>
  );
}
