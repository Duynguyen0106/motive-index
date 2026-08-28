"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { CASE_TABS } from "@/lib/case-tabs";

export function CaseTabs({ slug }: { slug: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = searchParams.get("tab") ?? "overview";

  return (
    <div className="dossier-tabs border-b border-[var(--line-strong)] bg-[var(--bg-subtle)]/80 backdrop-blur-sm">
      <nav
        className="site-shell flex gap-0 overflow-x-auto"
        aria-label="Case sections"
      >
        {CASE_TABS.map((tab) => {
          const href = `${pathname}?tab=${tab.id}`;
          const isActive = active === tab.id;
          return (
            <Link
              key={tab.id}
              href={href}
              scroll={false}
              className={`dossier-tab whitespace-nowrap border-b-2 px-3 py-3 text-sm transition-colors md:px-4 ${
                isActive
                  ? "border-[var(--cs-signal)] font-medium text-[var(--ink)]"
                  : "border-transparent text-[var(--muted)] hover:text-[var(--ink-soft)]"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
        <span className="sr-only">Case: {slug}</span>
      </nav>
    </div>
  );
}
