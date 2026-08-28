import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-shell py-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <Link href="/" className="group">
            <p className="brand-sub flex items-center gap-2">
              <span className="monitor-live-dot inline-block shrink-0" aria-hidden />
              Forensic intelligence · live monitor
            </p>
            <p className="brand-mark text-2xl text-[var(--ink)] md:text-[2.125rem]">
              Motive Index
            </p>
          </Link>
          <SiteNav />
        </div>
      </div>
      <hr className="rule-double" />
    </header>
  );
}
