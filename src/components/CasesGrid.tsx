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
        className="card mb-6 grid gap-3 p-4 md:grid-cols-[1fr_220px_auto] md:items-end"
        onSubmit={(e) => e.preventDefault()}
      >
        <label className="block text-sm">
          <span className="font-medium text-[var(--ink)]">Search cases</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Name, location, keyword…"
            className="mt-1 w-full rounded border border-[var(--line)] px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-[var(--ink)]">Crime type</span>
          <select
            value={crimeType}
            onChange={(e) => setCrimeType(e.target.value as CrimeCategory | "")}
            className="mt-1 w-full rounded border border-[var(--line)] px-3 py-2"
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
          className="rounded border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--ink-soft)]"
        >
          Reset
        </button>
      </form>

      <p className="mb-4 text-sm text-[var(--muted)]">
        Showing {filtered.length} of {cases.length} cases
      </p>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => (
          <li key={c.id}>
            <Link href={`/cases/${c.id}`} className="card card-hover block h-full p-5">
              <p className="text-xs font-medium tracking-[0.12em] text-[var(--muted)] uppercase">
                {c.yearStart}
                {c.yearEnd ? `–${c.yearEnd}` : ""} · {c.status}
              </p>
              <h2 className="display mt-2 text-2xl text-[var(--ink)]">{c.name}</h2>
              <p className="mt-2 text-sm text-[var(--ink-soft)] line-clamp-3">{c.subtitle}</p>
              <p className="mt-3 text-xs text-[var(--muted)]">
                {c.crimeCategories.map((x) => CRIME_CATEGORY_LABELS[x]).join(" · ")}
              </p>
            </Link>
          </li>
        ))}
      </ul>

      {!filtered.length ? (
        <p className="mt-6 text-[var(--muted)]">No cases match this search.</p>
      ) : null}
    </div>
  );
}
