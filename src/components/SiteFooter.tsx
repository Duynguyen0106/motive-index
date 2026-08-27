import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[var(--line-strong)] bg-[var(--bg-subtle)]">
      <div className="site-shell py-10">
        <div className="grid gap-8 md:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="brand-mark text-lg text-[var(--ink)]">Motive Index</p>
            <p className="body-copy mt-3 max-w-md text-sm text-[var(--muted)]">
              A working repository for historical case files and forensic
              psychological commentary. For education and research—not clinical
              or legal advice.
            </p>
            <p className="label mt-6">Colophon</p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Public-source citations · Human-reviewed analysis · Content warnings
              on sensitive dossiers
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-[var(--ink-soft)]">
            <Link href="/" className="text-link">
              World monitor
            </Link>
            <Link href="/archive" className="text-link">
              Case archive
            </Link>
            <Link href="/search" className="text-link">
              Advanced search
            </Link>
            <Link href="/live" className="text-link">
              World news
            </Link>
            <Link href="/resources" className="text-link">
              Glossary & theories
            </Link>
            <Link href="/contribute" className="text-link">
              Contribute
            </Link>
            <Link href="/method" className="text-link">
              Method
            </Link>
            <Link href="/about" className="text-link">
              Ethics
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
