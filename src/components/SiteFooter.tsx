import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[var(--line)] bg-[var(--bg-subtle)]">
      <div className="site-shell flex flex-col gap-6 py-10 md:flex-row md:justify-between">
        <div>
          <p className="brand-mark text-lg text-[var(--ink)]">Motive Index</p>
          <p className="mt-2 max-w-md text-sm text-[var(--muted)]">
            Educational repository for historical crime case files and forensic
            psychological analysis. Not clinical or legal advice.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm text-[var(--ink-soft)]">
          <Link href="/cases" className="hover:text-[var(--accent)]">
            Browse cases
          </Link>
          <Link href="/search" className="hover:text-[var(--accent)]">
            Advanced search
          </Link>
          <Link href="/documents" className="hover:text-[var(--accent)]">
            Document library
          </Link>
          <Link href="/resources" className="hover:text-[var(--accent)]">
            Educational resources
          </Link>
          <Link href="/contribute" className="hover:text-[var(--accent)]">
            Contribute
          </Link>
          <Link href="/about" className="hover:text-[var(--accent)]">
            Ethics & about
          </Link>
          <Link href="/method" className="hover:text-[var(--accent)]">
            Method
          </Link>
          <Link href="/live" className="hover:text-[var(--accent)]">
            Live feed
          </Link>
        </div>
      </div>
    </footer>
  );
}
