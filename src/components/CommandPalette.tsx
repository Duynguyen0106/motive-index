"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { COUNTRY_LABELS } from "@/lib/country";
import { loadPaletteRecents, pushPaletteRecent, type PaletteRecent } from "@/lib/paletteRecents";

type CaseHit = {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  country?: string;
  status: string;
};

type DocumentHit = {
  id: string;
  title: string;
  type: string;
  typeLabel: string;
  caseSlug: string;
  summary: string;
};

type PaletteItem = {
  type: "route" | "filter" | "recent" | "case" | "document";
  href: string;
  label: string;
  hint?: string;
  slug?: string;
};

const ROUTES = [
  { href: "/", label: "World monitor", hint: "Map & filters" },
  { href: "/?tab=news", label: "Monitor · News tab", hint: "Crime RSS feed" },
  { href: "/?tab=signals", label: "Monitor · Signals tab", hint: "Archive activity" },
  { href: "/archive", label: "Case archive", hint: "Browse dossiers" },
  { href: "/search", label: "Advanced search", hint: "Deep filters" },
  { href: "/analyses", label: "Commentary", hint: "Expert analyses" },
  { href: "/stats", label: "Archive stats", hint: "Catalog analytics" },
  { href: "/live", label: "World news", hint: "Regional RSS" },
  { href: "/documents", label: "Documents", hint: "Primary sources" },
  { href: "/resources", label: "Resources", hint: "Glossary & theories" },
  { href: "/contribute", label: "Contribute", hint: "Submit for review" },
  { href: "/about", label: "About & ethics", hint: "Purpose and guidelines" },
  { href: "/method", label: "Method", hint: "Analysis rubric" },
];

const FILTER_SHORTCUTS = [
  { href: "/search?status=unsolved", label: "Unsolved cases", hint: "Open cases filter" },
  { href: "/archive?catalogTier=curated", label: "Curated dossiers", hint: "Hand-authored records" },
  { href: "/archive?catalogTier=composite", label: "Composite archive", hint: "Bulk catalog tier" },
  { href: "/search?country=US", label: "United States", hint: "Country filter" },
  { href: "/search?psychologicalFactor=psychopathy_traits", label: "Psychopathy traits", hint: "Psych factor filter" },
  { href: "/archive?crimeCategory=serial_murder", label: "Serial murder", hint: "Crime type filter" },
  { href: "/search?documentType=manifesto", label: "Manifestos", hint: "Document type filter" },
];

const TYPE_LABELS: Record<PaletteItem["type"], string> = {
  route: "Page",
  filter: "Filter",
  recent: "Recent",
  case: "Dossier",
  document: "Document",
};

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
  const [documents, setDocuments] = useState<DocumentHit[]>([]);
  const [recents, setRecents] = useState<PaletteRecent[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setCases([]);
    setDocuments([]);
    setActiveIdx(0);
  }, []);

  const openPalette = useCallback(() => {
    setOpen(true);
    setQuery("");
    setCases([]);
    setDocuments([]);
    setRecents(loadPaletteRecents());
    setActiveIdx(0);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => {
          if (!v) {
            setQuery("");
            setCases([]);
            setDocuments([]);
            setRecents(loadPaletteRecents());
            setActiveIdx(0);
          }
          return !v;
        });
        return;
      }
      if (open && e.key === "Escape") {
        e.preventDefault();
        close();
      }
    }
    function onOpenRequest() {
      openPalette();
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("command-palette:open", onOpenRequest);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("command-palette:open", onOpenRequest);
    };
  }, [open, close, openPalette]);

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
        setDocuments([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const [casesRes, docsRes] = await Promise.all([
          fetch(`/api/cases?q=${encodeURIComponent(q)}&limit=10`),
          fetch(`/api/documents?q=${encodeURIComponent(q)}&limit=6`),
        ]);
        const casesData = (await casesRes.json()) as { cases: CaseHit[] };
        const docsData = docsRes.ok
          ? ((await docsRes.json()) as { documents: DocumentHit[] })
          : { documents: [] };
        setCases(casesData.cases ?? []);
        setDocuments(docsData.documents ?? []);
        setActiveIdx(0);
      } catch {
        setCases([]);
        setDocuments([]);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, open]);

  const q = query.trim().toLowerCase();
  const routeMatches = q
    ? ROUTES.filter((r) => r.label.toLowerCase().includes(q))
    : ROUTES;
  const filterMatches = q
    ? FILTER_SHORTCUTS.filter(
        (f) => f.label.toLowerCase().includes(q) || f.hint.toLowerCase().includes(q),
      )
    : FILTER_SHORTCUTS;
  const recentMatches = q
    ? recents.filter((r) => r.name.toLowerCase().includes(q))
    : recents;

  const items: PaletteItem[] = [
    ...recentMatches.map((r) => ({
      type: "recent" as const,
      href: `/cases/${r.slug}`,
      label: r.name,
      hint: "Recently visited",
      slug: r.slug,
    })),
    ...routeMatches.map((r) => ({ type: "route" as const, ...r })),
    ...filterMatches.map((f) => ({ type: "filter" as const, ...f })),
    ...cases.map((c) => ({
      type: "case" as const,
      href: `/cases/${c.slug}`,
      label: c.name,
      hint: `${c.subtitle.slice(0, 60)}${c.country ? ` · ${COUNTRY_LABELS[c.country as keyof typeof COUNTRY_LABELS] ?? c.country}` : ""}`,
      slug: c.slug,
    })),
    ...documents.map((d) => ({
      type: "document" as const,
      href: `/cases/${d.caseSlug}?tab=documents`,
      label: d.title,
      hint: `${d.typeLabel} · ${d.summary}`,
    })),
  ];

  function go(item: PaletteItem) {
    if (item.slug && (item.type === "case" || item.type === "recent")) {
      pushPaletteRecent({ slug: item.slug, name: item.label });
    }
    close();
    router.push(item.href);
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
      go(items[activeIdx]);
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
          placeholder="Jump to dossier, document, or page…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onInputKeyDown}
          aria-autocomplete="list"
        />
        <ul className="command-palette-list" role="listbox">
          {items.length === 0 && !loading ? (
            <li className="command-palette-empty">
              {q
                ? "No matches — try a dossier name, document title, or filter shortcut"
                : "Type to search dossiers & documents, or pick a page"}
            </li>
          ) : null}
          {items.map((item, idx) => (
            <li key={`${item.type}-${item.href}-${item.label}`}>
              <button
                type="button"
                role="option"
                aria-selected={idx === activeIdx}
                className={`command-palette-item ${idx === activeIdx ? "is-active" : ""}`}
                onMouseEnter={() => setActiveIdx(idx)}
                onClick={() => go(item)}
              >
                <span className="command-palette-item-main">
                  <span className="command-palette-type">{TYPE_LABELS[item.type]}</span>
                  <span className="command-palette-label">{item.label}</span>
                </span>
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

export function CommandPaletteHost() {
  return <CommandPalette />;
}
