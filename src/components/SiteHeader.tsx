import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { SiteSearch } from "@/components/SiteSearch";
import { ThemeToggle } from "@/components/ThemeToggle";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-shell flex items-center justify-between gap-3 py-3 md:gap-4 md:py-5">
        <Link href="/" className="group min-w-0">
          <p className="brand-sub mobile-hide flex items-center gap-2">
            <span className="monitor-live-dot inline-block shrink-0" aria-hidden />
            Forensic intelligence · live monitor
          </p>
          <p className="brand-mark text-xl text-[var(--ink)] md:text-[2.125rem]">
            Motive Index
          </p>
        </Link>
        <div className="header-tools shrink-0">
          <SiteSearch />
          <span className="mobile-hide">
            <ThemeToggle />
          </span>
          <SiteNav />
        </div>
      </div>
      <hr className="rule-double" />
    </header>
  );
}
