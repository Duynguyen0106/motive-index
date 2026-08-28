"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  { href: "/", label: "Monitor", match: (p: string) => p === "/" || p.startsWith("/monitor") },
  { href: "/archive", label: "Archive", match: (p: string) => p === "/archive" || p.startsWith("/cases/") },
  { href: "/search", label: "Search", match: (p: string) => p.startsWith("/search") },
  { href: "/live", label: "News", match: (p: string) => p.startsWith("/live") },
  { href: "/documents", label: "Documents", match: (p: string) => p.startsWith("/documents") },
  { href: "/method", label: "Method", match: (p: string) => p.startsWith("/method") },
];

export function SiteNav() {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
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
          onClick={() => setOpen(false)}
        />
      ) : null}

      <nav
        id="primary-nav"
        className={`site-nav ${open ? "is-open" : ""}`}
        aria-label="Primary"
      >
        <div className="site-nav-links">
          {links.map((l) => {
            const active = l.match(pathname);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`nav-link ${active ? "is-active" : ""}`}
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            );
          })}
          <Link
            href="/admin/moderation"
            className="nav-link nav-link-muted"
            onClick={() => setOpen(false)}
          >
            Admin
          </Link>
        </div>
      </nav>
    </>
  );
}
