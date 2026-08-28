"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { getActiveTab, visibleCaseTabs } from "@/lib/case-tabs";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

/** Arrow-key navigation between case dossier tabs. */
export function CaseTabKeyboardNav({ hasNarrative = false }: { hasNarrative?: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (isTypingTarget(e.target)) return;
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      if (!pathname.startsWith("/cases/")) return;

      e.preventDefault();
      const active = getActiveTab(searchParams.get("tab") ?? undefined, { hasNarrative });
      const ids = visibleCaseTabs(hasNarrative).map((t) => t.id);
      const idx = ids.indexOf(active);
      const base = idx >= 0 ? idx : 0;
      const next =
        e.key === "ArrowRight"
          ? (base + 1) % ids.length
          : (base - 1 + ids.length) % ids.length;
      const tab = ids[next];
      router.push(`${pathname}?tab=${tab}`, { scroll: false });
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pathname, router, searchParams, hasNarrative]);

  return null;
}
