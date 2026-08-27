"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { CASE_TABS } from "@/lib/case-tabs";

export function CaseTabs({ slug }: { slug: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = searchParams.get("tab") ?? "overview";

  return (
    <div className="border-b border-[var(--line)]">
      <nav
        className="site-shell flex gap-1 overflow-x-auto py-0"
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
              className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition-colors md:px-4 ${
                isActive
                  ? "border-[var(--accent)] text-[var(--accent)]"
                  : "border-transparent text-[var(--ink-soft)] hover:text-[var(--ink)]"
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
