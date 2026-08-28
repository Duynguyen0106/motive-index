"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { visibleCaseTabs } from "@/lib/case-tabs";

export function CaseTabs({
  slug,
  defaultTab = "overview",
  hasNarrative = false,
}: {
  slug: string;
  defaultTab?: string;
  hasNarrative?: boolean;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = searchParams.get("tab") ?? defaultTab;
  const tabs = visibleCaseTabs(hasNarrative);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const activeLink = nav.querySelector<HTMLAnchorElement>(`[data-tab-id="${active}"]`);
    activeLink?.scrollIntoView({ inline: "nearest", block: "nearest", behavior: "smooth" });
  }, [active]);

  return (
    <div className="dossier-tabs border-b border-[var(--line-strong)] bg-[var(--bg-subtle)]/80 backdrop-blur-sm">
      <nav
        ref={navRef}
        className="site-shell dossier-tab-scroll flex max-w-full min-w-0 gap-0 overflow-x-auto"
        aria-label="Case sections"
      >
        {tabs.map((tab) => {
          const href = `${pathname}?tab=${tab.id}`;
          const isActive = active === tab.id;
          return (
            <Link
              key={tab.id}
              href={href}
              scroll={false}
              data-tab-id={tab.id}
              aria-current={isActive ? "page" : undefined}
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
      <p className="dossier-tab-hint mobile-hide site-shell py-1.5 text-xs text-[var(--muted)]">
        <kbd className="keyboard-kbd">←</kbd> <kbd className="keyboard-kbd">→</kbd> tabs ·{" "}
        <kbd className="keyboard-kbd">j</kbd> <kbd className="keyboard-kbd">k</kbd> prev/next ·{" "}
        <kbd className="keyboard-kbd">?</kbd> shortcuts
      </p>
    </div>
  );
}
