"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { getActiveTab, visibleCaseTabs } from "@/lib/case-tabs";
import { pushPaletteRecent } from "@/lib/paletteRecents";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

type Props = {
  hasNarrative?: boolean;
  prevCase?: { slug: string; name: string };
  nextCase?: { slug: string; name: string };
  storyChapterIds?: string[];
};

/** Keyboard navigation for dossier tabs, neighbors, and story chapters. */
export function CaseTabKeyboardNav({
  hasNarrative = false,
  prevCase,
  nextCase,
  storyChapterIds = [],
}: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (isTypingTarget(e.target)) return;
      if (!pathname.startsWith("/cases/")) return;

      const activeTab = getActiveTab(searchParams.get("tab") ?? undefined, { hasNarrative });

      if (e.key === "j" && prevCase && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        pushPaletteRecent(prevCase);
        const tab = searchParams.get("tab");
        router.push(tab ? `/cases/${prevCase.slug}?tab=${tab}` : `/cases/${prevCase.slug}`);
        return;
      }

      if (e.key === "k" && nextCase && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        pushPaletteRecent(nextCase);
        const tab = searchParams.get("tab");
        router.push(tab ? `/cases/${nextCase.slug}?tab=${tab}` : `/cases/${nextCase.slug}`);
        return;
      }

      if (
        activeTab === "story" &&
        storyChapterIds.length > 1 &&
        (e.key === "[" || e.key === "]")
      ) {
        const hash = window.location.hash.replace("#", "");
        const currentId = hash.startsWith("chapter-")
          ? hash.replace("chapter-", "")
          : storyChapterIds[0];
        const idx = storyChapterIds.indexOf(currentId);
        const base = idx >= 0 ? idx : 0;
        const nextIdx =
          e.key === "]"
            ? (base + 1) % storyChapterIds.length
            : (base - 1 + storyChapterIds.length) % storyChapterIds.length;
        const chapterId = storyChapterIds[nextIdx];
        e.preventDefault();
        window.location.hash = `chapter-${chapterId}`;
        document.getElementById(`chapter-${chapterId}`)?.scrollIntoView({ behavior: "smooth" });
        return;
      }

      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;

      e.preventDefault();
      const active = getActiveTab(searchParams.get("tab") ?? undefined, { hasNarrative });
      const ids = visibleCaseTabs(hasNarrative).map((t) => t.id);
      const tabIdx = ids.indexOf(active);
      const base = tabIdx >= 0 ? tabIdx : 0;
      const next =
        e.key === "ArrowRight"
          ? (base + 1) % ids.length
          : (base - 1 + ids.length) % ids.length;
      const tab = ids[next];
      router.push(`${pathname}?tab=${tab}`, { scroll: false });
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pathname, router, searchParams, hasNarrative, prevCase, nextCase, storyChapterIds]);

  return null;
}
