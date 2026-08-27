"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

  return (
    <nav
      className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-[var(--ink-soft)]"
      aria-label="Primary"
    >
      {links.map((l) => {
        const active = l.match(pathname);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`nav-link border-b pb-0.5 transition-colors hover:border-[var(--line-strong)] hover:text-[var(--ink)] ${
              active
                ? "is-active border-[var(--accent)] font-medium text-[var(--ink)]"
                : "border-transparent"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
      <Link
        href="/admin/moderation"
        className="nav-link border-b border-transparent pb-0.5 text-[var(--muted)] transition-colors hover:border-[var(--line-strong)] hover:text-[var(--ink)]"
      >
        Admin
      </Link>
    </nav>
  );
}
