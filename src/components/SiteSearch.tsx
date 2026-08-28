"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { pushPaletteRecent } from "@/lib/paletteRecents";

type CaseHit = {
  slug: string;
  name: string;
  subtitle: string;
};

export function SiteSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<CaseHit[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const goSearch = useCallback(
    (query: string) => {
      const trimmed = query.trim();
      setOpen(false);
      setHits([]);
      setActiveIdx(-1);
      router.push(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/search");
    },
    [router],
  );

  const goCase = useCallback(
    (hit: CaseHit) => {
      pushPaletteRecent({ slug: hit.slug, name: hit.name });
      setOpen(false);
      setQ("");
      setHits([]);
      router.push(`/cases/${hit.slug}`);
    },
    [router],
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setHits([]);
      setLoading(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/cases?q=${encodeURIComponent(trimmed)}&limit=6`);
        const data = (await res.json()) as { cases: CaseHit[] };
        setHits(data.cases ?? []);
        setActiveIdx(-1);
        setOpen(true);
      } catch {
        setHits([]);
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [q]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (activeIdx >= 0 && hits[activeIdx]) {
      goCase(hits[activeIdx]);
      return;
    }
    goSearch(q);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || !hits.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, hits.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="site-search-wrap" ref={wrapRef}>
      <form className="site-search" onSubmit={submit} role="search">
        <label className="sr-only" htmlFor="site-search-input">
          Search dossiers
        </label>
        <input
          id="site-search-input"
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            if (e.target.value.trim().length >= 2) setOpen(true);
          }}
          onFocus={() => {
            if (hits.length) setOpen(true);
          }}
          onKeyDown={onKeyDown}
          placeholder="Search cases…"
          className="site-search-input field"
          autoComplete="off"
          aria-expanded={open && hits.length > 0}
          aria-controls="site-search-suggestions"
          aria-autocomplete="list"
        />
        <button type="submit" className="site-search-btn" aria-label="Search">
          ⌕
        </button>
      </form>
      {open && (hits.length > 0 || loading) ? (
        <ul id="site-search-suggestions" className="site-search-suggestions" role="listbox">
          {loading && !hits.length ? (
            <li className="site-search-suggestion-empty">Searching…</li>
          ) : null}
          {hits.map((hit, idx) => (
            <li key={hit.slug}>
              <button
                type="button"
                role="option"
                aria-selected={idx === activeIdx}
                className={`site-search-suggestion ${idx === activeIdx ? "is-active" : ""}`}
                onMouseEnter={() => setActiveIdx(idx)}
                onClick={() => goCase(hit)}
              >
                <span className="site-search-suggestion-name">{hit.name}</span>
                <span className="site-search-suggestion-sub">{hit.subtitle.slice(0, 72)}</span>
              </button>
            </li>
          ))}
          <li className="site-search-suggestion-footer">
            <Link
              href={`/search?q=${encodeURIComponent(q.trim())}`}
              className="site-search-advanced-link"
              onClick={() => setOpen(false)}
            >
              Advanced search for &ldquo;{q.trim()}&rdquo; →
            </Link>
          </li>
        </ul>
      ) : null}
    </div>
  );
}
