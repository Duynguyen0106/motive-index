import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { ThemeToggle } from "@/components/ThemeToggle";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-shell flex items-center justify-between gap-4 py-4 md:py-5">
        <Link href="/" className="group min-w-0">
          <p className="brand-sub flex items-center gap-2">
            <span className="monitor-live-dot inline-block shrink-0" aria-hidden />
            Forensic intelligence · live monitor
          </p>
          <p className="brand-mark text-2xl text-[var(--ink)] md:text-[2.125rem]">
            Motive Index
          </p>
        </Link>
        <div className="header-tools shrink-0">
          <ThemeToggle />
          <SiteNav />
        </div>
      </div>
      <hr className="rule-double" />
    </header>
  );
}
