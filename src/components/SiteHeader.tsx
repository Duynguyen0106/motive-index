import Link from "next/link";

const links = [
  { href: "/cases", label: "Archive" },
  { href: "/live", label: "Live" },
  { href: "/method", label: "Method" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-[var(--line)] bg-white">
      <div className="site-shell flex items-center justify-between gap-6 py-4">
        <Link href="/" className="brand-mark text-xl text-[var(--ink)] md:text-2xl">
          Motive Index
        </Link>
        <nav className="flex items-center gap-5 text-sm font-medium text-[var(--ink-soft)] md:gap-8">
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
      </div>
    </header>
  );
}
