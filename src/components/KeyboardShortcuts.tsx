"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const SHORTCUTS = [
  { keys: "⌘ K", action: "Open command palette — jump to dossier or page" },
  { keys: "?", action: "Show this help overlay" },
  { keys: "/", action: "Jump to advanced search" },
  { keys: "g m", action: "Go to world monitor (home)" },
  { keys: "g a", action: "Go to case archive" },
  { keys: "g n", action: "Go to world crime news" },
  { keys: "g s", action: "Go to advanced search" },
  { keys: "Esc", action: "Close overlay / deselect map case" },
  { keys: "← →", action: "Cycle case tabs (on dossier pages)" },
] as const;

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

export function KeyboardShortcuts() {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);
  const [pendingG, setPendingG] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  useEffect(() => {
    let gTimer: ReturnType<typeof setTimeout> | undefined;

    function onKeyDown(e: KeyboardEvent) {
      if (isTypingTarget(e.target)) return;

      if (open && e.key === "Escape") return;

      if (e.key === "?" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }

      if (open) return;

      if (e.key === "/" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        router.push("/search?focus=1");
        return;
      }

      if (e.key === "g" && !e.metaKey && !e.ctrlKey) {
        setPendingG(true);
        if (gTimer) clearTimeout(gTimer);
        gTimer = setTimeout(() => setPendingG(false), 900);
        return;
      }

      if (pendingG) {
        setPendingG(false);
        if (gTimer) clearTimeout(gTimer);
        const dest =
          e.key === "m"
            ? "/"
            : e.key === "a"
              ? "/archive"
              : e.key === "n"
                ? "/live"
                : e.key === "s"
                  ? "/search"
                  : null;
        if (dest) {
          e.preventDefault();
          router.push(dest);
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (gTimer) clearTimeout(gTimer);
    };
  }, [open, pendingG, router, pathname]);

  return (
    <>
      <button
        type="button"
        className="keyboard-help-fab"
        aria-label="Keyboard shortcuts"
        title="Keyboard shortcuts (?)"
        onClick={() => setOpen(true)}
      >
        ?
      </button>

      {open ? (
        <div
          className="keyboard-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="keyboard-shortcuts-title"
          onClick={close}
        >
          <div className="keyboard-panel" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="label mb-0">Reference</p>
                <h2 id="keyboard-shortcuts-title" className="display mt-1 text-2xl">
                  Keyboard shortcuts
                </h2>
              </div>
              <button type="button" className="monitor-case-close" onClick={close} aria-label="Close">
                ×
              </button>
            </div>
            <ul className="keyboard-list mt-6">
              {SHORTCUTS.map((s) => (
                <li key={s.keys} className="keyboard-row">
                  <kbd className="keyboard-kbd">{s.keys}</kbd>
                  <span>{s.action}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-xs text-[var(--muted)]">
              Shortcuts are disabled while typing in form fields. On the monitor,{" "}
              <kbd className="keyboard-kbd inline">Esc</kbd> clears the selected map case.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/" className="btn btn-ghost text-sm" onClick={close}>
                Monitor
              </Link>
              <Link href="/archive" className="btn btn-ghost text-sm" onClick={close}>
                Archive
              </Link>
              <Link href="/search" className="btn btn-ghost text-sm" onClick={close}>
                Search
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
