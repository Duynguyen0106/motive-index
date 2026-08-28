"use client";

import { useRouter } from "next/navigation";
import { HotNewsTicker } from "@/components/HotNewsTicker";
import type { WorldNewsItem } from "@/lib/worldNews";

type Props = {
  worldNewsItems: WorldNewsItem[];
  country?: string;
};

export function LivePageHotNews({ worldNewsItems, country }: Props) {
  const router = useRouter();
  const newsHref = country ? `/?country=${country}&tab=news` : "/?tab=news";

  return (
    <HotNewsTicker
      worldNewsItems={worldNewsItems}
      onOpenNews={() => router.push(newsHref)}
      onSelectCase={(slug) => router.push(`/?case=${slug}&tab=cases`)}
    />
  );
}
