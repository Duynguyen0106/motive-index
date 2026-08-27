import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-shell mt-auto border-t border-[var(--line)] py-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="brand-mark text-xl">Motive Index</p>
          <p className="mt-2 max-w-md text-sm text-[var(--muted)]">
            Live forensic-psychological archive. Behavior first. Citations
            always. Uncertainty explicit.
          </p>
        </div>
        <div className="flex gap-6 text-sm text-[var(--ink-soft)]">
          <Link href="/method">Method</Link>
          <Link href="/live">Live feed</Link>
          <Link href="/cases">Archive</Link>
        </div>
      </div>
    </footer>
  );
}
