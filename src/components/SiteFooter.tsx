import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[var(--line)] bg-[var(--bg-subtle)]">
      <div className="site-shell flex flex-col gap-4 py-10 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="brand-mark text-lg text-[var(--ink)]">Motive Index</p>
          <p className="mt-2 max-w-md text-sm text-[var(--muted)]">
            Live forensic-psychological archive. Behavior first. Citations
            always. Uncertainty explicit.
          </p>
        </div>
        <div className="flex gap-6 text-sm text-[var(--ink-soft)]">
          <Link href="/method" className="hover:text-[var(--accent)]">
            Method
          </Link>
          <Link href="/live" className="hover:text-[var(--accent)]">
            Live feed
          </Link>
          <Link href="/cases" className="hover:text-[var(--accent)]">
            Archive
          </Link>
        </div>
      </div>
    </footer>
  );
}
