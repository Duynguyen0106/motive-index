"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SiteSearch } from "@/components/SiteSearch";
import { ThemeToggle } from "@/components/ThemeToggle";

const links = [
  { href: "/", label: "Monitor", match: (p: string) => p === "/" || p.startsWith("/monitor") },
  { href: "/archive", label: "Archive", match: (p: string) => p === "/archive" || p.startsWith("/cases/") },
  { href: "/stats", label: "Stats", match: (p: string) => p.startsWith("/stats") },
  { href: "/live", label: "News", match: (p: string) => p.startsWith("/live") },
  { href: "/documents", label: "Documents", match: (p: string) => p.startsWith("/documents") },
  { href: "/method", label: "Method", match: (p: string) => p.startsWith("/method") },
];

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  );
}

export function SiteNav() {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLElement>(null);

  function closeNav() {
    setOpen(false);
    toggleRef.current?.focus();
  }

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.dataset.navOpen = "true";
    return () => {
      document.body.style.overflow = prev;
      delete document.body.dataset.navOpen;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const main = document.getElementById("main-content");
    main?.setAttribute("aria-hidden", "true");

    const nav = navRef.current;
    const focusables = nav ? getFocusableElements(nav) : [];
    focusables[0]?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        toggleRef.current?.focus();
        return;
      }
      if (e.key !== "Tab" || focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      main?.removeAttribute("aria-hidden");
    };
  }, [open]);

  return (
    <>
      <button
        ref={toggleRef}
        type="button"
        className="nav-toggle md:hidden"
        aria-expanded={open}
        aria-controls="primary-nav"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="nav-toggle-icon" aria-hidden>
          {open ? "✕" : "☰"}
        </span>
        <span>{open ? "Close" : "Menu"}</span>
      </button>

      {open ? (
        <button
          type="button"
          className="nav-overlay md:hidden"
          aria-label="Close menu"
          onClick={closeNav}
        />
      ) : null}

      <nav
        ref={navRef}
        id="primary-nav"
        className={`site-nav ${open ? "is-open" : ""}`}
        aria-label="Primary"
      >
        <div className="site-nav-drawer-head md:hidden">
          <p className="site-nav-drawer-title">Menu</p>
          <button
            type="button"
            className="site-nav-close"
            aria-label="Close menu"
            onClick={closeNav}
          >
            Close
          </button>
        </div>
        <div className="site-nav-links">
          <div className="site-nav-search md:hidden">
            <p className="label mb-2 normal-case tracking-normal">Search cases</p>
            <SiteSearch />
            <button
              type="button"
              className="nav-palette-trigger btn btn-ghost mt-2 w-full text-sm"
              onClick={() => {
                closeNav();
                window.dispatchEvent(new Event("command-palette:open"));
              }}
            >
              Quick jump
            </button>
            <Link
              href="/search"
              className="nav-advanced-search"
              onClick={closeNav}
            >
              Advanced search filters →
            </Link>
          </div>
          {links.map((l) => {
            const active = l.match(pathname);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`nav-link ${active ? "is-active" : ""}`}
                onClick={closeNav}
              >
                {l.label}
              </Link>
            );
          })}
          <Link
            href="/search"
            className="nav-link nav-link-search-desktop hidden md:inline-flex"
            aria-current={pathname.startsWith("/search") ? "page" : undefined}
          >
            Search
          </Link>
          <div className="site-nav-theme md:hidden">
            <ThemeToggle />
          </div>
        </div>
      </nav>
    </>
  );
}
