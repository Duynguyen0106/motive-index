import Link from "next/link";

const links = [
  { href: "/cases", label: "Archive" },
  { href: "/live", label: "Live" },
  { href: "/method", label: "Method" },
];

export function SiteHeader() {
  return (
    <header className="site-shell flex items-center justify-between gap-6 py-6">
      <Link href="/" className="brand-mark text-2xl text-[var(--ink)] md:text-[1.75rem]">
        Motive Index
      </Link>
      <nav className="flex items-center gap-5 text-sm text-[var(--ink-soft)] md:gap-8">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="transition-colors hover:text-[var(--accent)]"
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
