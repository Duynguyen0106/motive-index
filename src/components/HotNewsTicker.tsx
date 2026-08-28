"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  detectHotCrimeNews,
  hotNewsTickerLabel,
  type HotCrimeNewsItem,
} from "@/lib/hotNewsTicker";
import type { WorldNewsItem } from "@/lib/worldNews";

type Props = {
  worldNewsItems: WorldNewsItem[];
  onOpenNews?: () => void;
  onSelectCase?: (slug: string) => void;
};

const DISMISS_KEY = "motive-hot-news-dismissed";

function readDismissedIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = sessionStorage.getItem(DISMISS_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function writeDismissedIds(ids: Set<string>) {
  sessionStorage.setItem(DISMISS_KEY, JSON.stringify([...ids]));
}

export function HotNewsTicker({ worldNewsItems, onOpenNews, onSelectCase }: Props) {
  const [mounted, setMounted] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => new Set());
  const [pulse, setPulse] = useState(false);
  const prevTopId = useRef<string | null>(null);

  const hotItems = useMemo(
    () => detectHotCrimeNews(worldNewsItems),
    [worldNewsItems],
  );

  const visibleItems = useMemo(
    () => hotItems.filter((item) => !dismissedIds.has(item.id)),
    [hotItems, dismissedIds],
  );

  useEffect(() => {
    setMounted(true);
    setDismissedIds(readDismissedIds());
  }, []);

  useEffect(() => {
    const top = visibleItems[0];
    if (top && top.id !== prevTopId.current) {
      prevTopId.current = top.id;
      setPulse(true);
      const id = window.setTimeout(() => setPulse(false), 2400);
      return () => window.clearTimeout(id);
    }
    if (!top) prevTopId.current = null;
  }, [visibleItems]);

  useEffect(() => {
    if (!mounted) return;
    document.body.classList.toggle("has-hot-news-ticker", visibleItems.length > 0);
    return () => document.body.classList.remove("has-hot-news-ticker");
  }, [mounted, visibleItems.length]);

  const dismissAll = useCallback(() => {
    setDismissedIds((prev) => {
      const next = new Set(prev);
      for (const item of visibleItems) next.add(item.id);
      writeDismissedIds(next);
      return next;
    });
  }, [visibleItems]);

  const handleItemClick = useCallback(
    (item: HotCrimeNewsItem) => {
      if (item.caseSlug && onSelectCase) {
        onSelectCase(item.caseSlug);
        return;
      }
      if (item.sourceUrl) {
        window.open(item.sourceUrl, "_blank", "noopener,noreferrer");
        return;
      }
      onOpenNews?.();
    },
    [onOpenNews, onSelectCase],
  );

  if (!mounted || !visibleItems.length) return null;

  const tickerLine = visibleItems.map((item) => hotNewsTickerLabel(item)).join("   ◆   ");
  const hasBreaking = visibleItems.some((item) => item.isBreaking);

  return createPortal(
    <div
      className={`hot-news-ticker ${pulse ? "is-pulse" : ""} ${hasBreaking ? "is-breaking" : ""}`}
      role="region"
      aria-label="Hot crime news alert"
    >
      <div className="hot-news-ticker-inner">
        <span className="hot-news-ticker-badge">{hasBreaking ? "Breaking" : "Hot alert"}</span>
        <div className="hot-news-ticker-track" aria-live="polite">
          <div className="hot-news-ticker-marquee">
            {[0, 1].map((copy) => (
              <span key={copy} className="hot-news-ticker-line" aria-hidden={copy === 1 ? true : undefined}>
                {visibleItems.map((item, idx) => (
                  <button
                    key={`${copy}-${item.id}`}
                    type="button"
                    className="hot-news-ticker-item"
                    onClick={() => handleItemClick(item)}
                  >
                    <span className="hot-news-ticker-region">{item.region}</span>
                    <span className="hot-news-ticker-headline">{item.headline}</span>
                    {idx < visibleItems.length - 1 ? (
                      <span className="hot-news-ticker-sep" aria-hidden>
                        ◆
                      </span>
                    ) : null}
                  </button>
                ))}
                <span className="hot-news-ticker-sep" aria-hidden>
                  ◆
                </span>
              </span>
            ))}
          </div>
        </div>
        <button type="button" className="hot-news-ticker-open" onClick={onOpenNews}>
          News
        </button>
        <button
          type="button"
          className="hot-news-ticker-dismiss"
          onClick={dismissAll}
          aria-label="Dismiss hot news ticker"
        >
          ×
        </button>
      </div>
      <span className="sr-only">{tickerLine}</span>
    </div>,
    document.body,
  );
}
