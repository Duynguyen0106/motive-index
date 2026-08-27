import Link from "next/link";

const links = [
  { href: "/", label: "Archive" },
  { href: "/search", label: "Search" },
  { href: "/documents", label: "Documents" },
  { href: "/live", label: "Updates" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-[var(--line-strong)] bg-[var(--paper)]">
      <div className="site-shell py-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <Link href="/" className="group">
            <p className="brand-sub">Forensic case archive</p>
            <p className="brand-mark text-2xl text-[var(--ink)] md:text-[2.125rem]">
              Motive Index
            </p>
          </Link>
          <nav
            className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-[var(--ink-soft)]"
            aria-label="Primary"
          >
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="border-b border-transparent pb-0.5 transition-colors hover:border-[var(--line-strong)] hover:text-[var(--ink)]"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/admin/moderation"
              className="border-b border-transparent pb-0.5 text-[var(--muted)] transition-colors hover:border-[var(--line-strong)] hover:text-[var(--ink)]"
            >
              Admin
            </Link>
          </nav>
        </div>
      </div>
      <hr className="rule-double" />
    </header>
  );
}
