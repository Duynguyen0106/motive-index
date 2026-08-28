"use client";

import { useRouter } from "next/navigation";
import { HotNewsTicker } from "@/components/HotNewsTicker";
import type { LiveUpdate } from "@/lib/types";
import type { WorldNewsItem } from "@/lib/worldNews";

type Props = {
  updates: LiveUpdate[];
  worldNewsItems: WorldNewsItem[];
  country?: string;
};

export function LivePageHotNews({ updates, worldNewsItems, country }: Props) {
  const router = useRouter();
  const newsHref = country ? `/?country=${country}&tab=news` : "/?tab=news";

  return (
    <HotNewsTicker
      updates={updates}
      worldNewsItems={worldNewsItems}
      onOpenNews={() => router.push(newsHref)}
      onSelectCase={(slug) => router.push(`/?case=${slug}&tab=cases`)}
    />
  );
}
