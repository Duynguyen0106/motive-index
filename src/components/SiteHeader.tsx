import Link from "next/link";

const links = [
  { href: "/", label: "Cases" },
  { href: "/search", label: "Search" },
  { href: "/documents", label: "Documents" },
  { href: "/analyses", label: "Analyses" },
  { href: "/resources", label: "Resources" },
  { href: "/admin/upload", label: "Admin" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-[var(--line)] bg-white">
      <div className="site-shell flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
        <Link href="/" className="brand-mark text-xl text-[var(--ink)] md:text-2xl">
          Motive Index
        </Link>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium text-[var(--ink-soft)] md:gap-x-5">
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
