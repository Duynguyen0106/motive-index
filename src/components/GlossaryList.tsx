"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export type GlossaryListItem = {
  id: string;
  term: string;
  definition: string;
  relatedCases: { slug: string; name: string }[];
};

export function GlossaryList({ items }: { items: GlossaryListItem[] }) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;
    const match = items.find((item) => item.id === hash);
    if (match) {
      requestAnimationFrame(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.term.toLowerCase().includes(q) ||
        item.definition.toLowerCase().includes(q) ||
        item.relatedCases.some((c) => c.name.toLowerCase().includes(q)),
    );
  }, [items, query]);

  return (
    <div>
      <label className="block text-sm">
        <span className="sr-only">Filter glossary</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter terms…"
          className="field max-w-md"
        />
      </label>
      <p className="mt-2 text-sm text-[var(--muted)]">
        {filtered.length} of {items.length} terms
      </p>
      <ul className="glossary-list mt-4 divide-y divide-[var(--line)] overflow-hidden rounded border border-[var(--line)]">
        {filtered.map((g) => (
          <li key={g.id} id={g.id} className="glossary-item scroll-mt-24 px-5 py-4 md:px-6">
            <h3 className="font-semibold text-[var(--ink)]">{g.term}</h3>
            <p className="mt-1 text-[var(--ink-soft)]">{g.definition}</p>
            {g.relatedCases.length ? (
              <p className="mt-2 text-sm text-[var(--muted)]">
                Related:{" "}
                {g.relatedCases.map((c, i) => (
                  <span key={c.slug}>
                    {i > 0 ? ", " : ""}
                    <Link href={`/cases/${c.slug}`} className="text-[var(--accent)] hover:underline">
                      {c.name}
                    </Link>
                  </span>
                ))}
              </p>
            ) : null}
          </li>
        ))}
        {!filtered.length ? (
          <li className="px-5 py-8 text-center text-sm text-[var(--muted)]">
            No terms match &ldquo;{query.trim()}&rdquo;.
          </li>
        ) : null}
      </ul>
    </div>
  );
}
