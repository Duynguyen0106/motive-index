"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { COUNTRY_LABELS } from "@/lib/country";

type CaseHit = {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  country?: string;
  status: string;
};

const ROUTES = [
  { href: "/", label: "World monitor", hint: "Map & filters" },
  { href: "/archive", label: "Case archive", hint: "Browse dossiers" },
  { href: "/search", label: "Advanced search", hint: "Deep filters" },
  { href: "/stats", label: "Archive stats", hint: "Catalog analytics" },
  { href: "/live", label: "World news", hint: "Regional RSS" },
  { href: "/documents", label: "Documents", hint: "Primary sources" },
  { href: "/method", label: "Method", hint: "Analysis rubric" },
];

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cases, setCases] = useState<CaseHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setCases([]);
    setActiveIdx(0);
  }, []);

  const openPalette = useCallback(() => {
    setOpen(true);
    setQuery("");
    setCases([]);
    setActiveIdx(0);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
        if (!open) {
          setQuery("");
          setCases([]);
          setActiveIdx(0);
        }
        return;
      }
      if (open && e.key === "Escape") {
        e.preventDefault();
        close();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const q = query.trim();
      if (!q) {
        setCases([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/cases?q=${encodeURIComponent(q)}&limit=12`);
        const data = (await res.json()) as { cases: CaseHit[] };
        setCases(data.cases ?? []);
        setActiveIdx(0);
      } catch {
        setCases([]);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, open]);

  const routeMatches = query.trim()
    ? ROUTES.filter((r) => r.label.toLowerCase().includes(query.trim().toLowerCase()))
    : ROUTES;

  const items: { type: "route" | "case"; href: string; label: string; hint?: string }[] = [
    ...routeMatches.map((r) => ({ type: "route" as const, ...r })),
    ...cases.map((c) => ({
      type: "case" as const,
      href: `/cases/${c.slug}`,
      label: c.name,
      hint: `${c.subtitle.slice(0, 60)}${c.country ? ` · ${COUNTRY_LABELS[c.country as keyof typeof COUNTRY_LABELS] ?? c.country}` : ""}`,
    })),
  ];

  function go(href: string) {
    close();
    router.push(href);
  }

  function onInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && items[activeIdx]) {
      e.preventDefault();
      go(items[activeIdx].href);
    }
  }

  if (!open) return null;

  return (
    <div
      className="command-palette-overlay"
      role="presentation"
      onClick={close}
    >
      <div
        className="command-palette"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          type="search"
          className="command-palette-input field"
          placeholder="Jump to dossier or page…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onInputKeyDown}
          aria-autocomplete="list"
        />
        <ul className="command-palette-list" role="listbox">
          {items.length === 0 && !loading ? (
            <li className="command-palette-empty">Type to search 10,000+ dossiers or pick a page</li>
          ) : null}
          {items.map((item, idx) => (
            <li key={`${item.type}-${item.href}`}>
              <button
                type="button"
                role="option"
                aria-selected={idx === activeIdx}
                className={`command-palette-item ${idx === activeIdx ? "is-active" : ""}`}
                onMouseEnter={() => setActiveIdx(idx)}
                onClick={() => go(item.href)}
              >
                <span className="command-palette-label">{item.label}</span>
                {item.hint ? (
                  <span className="command-palette-hint">{item.hint}</span>
                ) : null}
              </button>
            </li>
          ))}
          {loading ? <li className="command-palette-empty">Searching…</li> : null}
        </ul>
        <p className="command-palette-footer">
          <kbd className="keyboard-kbd">↑↓</kbd> navigate ·{" "}
          <kbd className="keyboard-kbd">Enter</kbd> open ·{" "}
          <kbd className="keyboard-kbd">Esc</kbd> close
        </p>
      </div>
    </div>
  );
}

/** Registers Cmd+K without rendering when closed — export open helper via custom event if needed. */
export function CommandPaletteHost() {
  return <CommandPalette />;
}
