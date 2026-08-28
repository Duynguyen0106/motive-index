/**
 * Global crime news feed — RSS sources, fetch pipeline, and English summaries.
 */
import type { CountryCode, LiveUpdate } from "@/lib/types";
import { COUNTRY_LABELS, inferCountry } from "@/lib/country";

export type WorldNewsFeed = {
  id: string;
  region: string;
  country?: CountryCode;
  language: string;
  languageLabel: string;
  url: string;
};

/** Regional Google News RSS + international crime desks (public RSS). */
export const WORLD_NEWS_FEEDS: WorldNewsFeed[] = [
  {
    id: "us-en",
    region: "United States",
    country: "US",
    language: "en",
    languageLabel: "English",
    url: "https://news.google.com/rss/search?q=murder+trial+OR+homicide+OR+serial+killer&hl=en-US&gl=US&ceid=US:en",
  },
  {
    id: "ca-en",
    region: "Canada",
    country: "CA",
    language: "en",
    languageLabel: "English",
    url: "https://news.google.com/rss/search?q=murder+OR+homicide+Canada&hl=en-CA&gl=CA&ceid=CA:en",
  },
  {
    id: "global-en",
    region: "Global",
    language: "en",
    languageLabel: "English",
    url: "https://news.google.com/rss/search?q=crime+OR+murder+OR+homicide+OR+forensic&hl=en-US&gl=US&ceid=US:en",
  },
  {
    id: "uk-en",
    region: "United Kingdom",
    country: "GB",
    language: "en",
    languageLabel: "English",
    url: "https://news.google.com/rss/search?q=murder+trial+OR+homicide&hl=en-GB&gl=GB&ceid=GB:en",
  },
  {
    id: "eu-de",
    region: "Europe (Germany)",
    country: "DE",
    language: "de",
    languageLabel: "German",
    url: "https://news.google.com/rss/search?q=Mord+OR+T%C3%B6tung+OR+Serienm%C3%B6rder&hl=de&gl=DE&ceid=DE:de",
  },
  {
    id: "eu-fr",
    region: "Europe (France)",
    country: "FR",
    language: "fr",
    languageLabel: "French",
    url: "https://news.google.com/rss/search?q=meurtre+OR+homicide+OR+criminalit%C3%A9&hl=fr&gl=FR&ceid=FR:fr",
  },
  {
    id: "eu-es",
    region: "Europe (Spain)",
    country: "ES",
    language: "es",
    languageLabel: "Spanish",
    url: "https://news.google.com/rss/search?q=asesinato+OR+homicidio+OR+crimen&hl=es&gl=ES&ceid=ES:es",
  },
  {
    id: "eu-it",
    region: "Europe (Italy)",
    country: "IT",
    language: "it",
    languageLabel: "Italian",
    url: "https://news.google.com/rss/search?q=omicidio+OR+assassino+OR+cronaca+nera&hl=it&gl=IT&ceid=IT:it",
  },
  {
    id: "latam-br",
    region: "Brazil",
    country: "BR",
    language: "pt",
    languageLabel: "Portuguese",
    url: "https://news.google.com/rss/search?q=homic%C3%ADdio+OR+assassinato+OR+serial&hl=pt-BR&gl=BR&ceid=BR:pt-419",
  },
  {
    id: "latam-es",
    region: "Latin America",
    country: "MX",
    language: "es",
    languageLabel: "Spanish",
    url: "https://news.google.com/rss/search?q=homicidio+OR+asesinato+OR+crimen&hl=es-419&gl=MX&ceid=MX:es-419",
  },
  {
    id: "asia-kr",
    region: "East Asia (South Korea)",
    country: "KR",
    language: "ko",
    languageLabel: "Korean",
    url: "https://news.google.com/rss/search?q=%EC%82%B4%EC%9D%B8+OR+%EB%B2%94%EC%A3%84&hl=ko&gl=KR&ceid=KR:ko",
  },
  {
    id: "asia-cn",
    region: "East Asia (China)",
    country: "CN",
    language: "zh",
    languageLabel: "Chinese",
    url: "https://news.google.com/rss/search?q=%E8%B0%8B%E6%9D%80+OR+%E5%87%B6%E6%9D%80&hl=zh-CN&gl=CN&ceid=CN:zh-Hans",
  },
  {
    id: "asia-jp",
    region: "East Asia (Japan)",
    country: "JP",
    language: "ja",
    languageLabel: "Japanese",
    url: "https://news.google.com/rss/search?q=%E6%AE%BA%E4%BA%BA+OR+%E7%8A%AF%E7%BD%AA&hl=ja&gl=JP&ceid=JP:ja",
  },
  {
    id: "asia-in",
    region: "South Asia (India)",
    country: "IN",
    language: "en",
    languageLabel: "English",
    url: "https://news.google.com/rss/search?q=murder+OR+homicide+India&hl=en-IN&gl=IN&ceid=IN:en",
  },
  {
    id: "nordic-se",
    region: "Nordic (Sweden)",
    country: "SE",
    language: "sv",
    languageLabel: "Swedish",
    url: "https://news.google.com/rss/search?q=mord+OR+brott+OR+seriem%C3%B6rdare&hl=sv&gl=SE&ceid=SE:sv",
  },
  {
    id: "oceania-au",
    region: "Oceania",
    country: "AU",
    language: "en",
    languageLabel: "English",
    url: "https://news.google.com/rss/search?q=murder+trial+OR+homicide&hl=en-AU&gl=AU&ceid=AU:en",
  },
  {
    id: "africa-za",
    region: "Africa (South Africa)",
    country: "ZA",
    language: "en",
    languageLabel: "English",
    url: "https://news.google.com/rss/search?q=murder+OR+homicide+South+Africa&hl=en-ZA&gl=ZA&ceid=ZA:en",
  },
  {
    id: "mena-ar",
    region: "Middle East",
    country: "EG",
    language: "ar",
    languageLabel: "Arabic",
    url: "https://news.google.com/rss/search?q=%D8%AD%D9%84%D8%A7%D8%A8+%D8%A3%D9%88+%D8%AC%D8%B1%D9%8A%D9%85%D8%A9&hl=ar&gl=EG&ceid=EG:ar",
  },
];

export const WORLD_NEWS_FEED_COUNT = WORLD_NEWS_FEEDS.length;

export type WorldNewsItem = LiveUpdate & {
  kind: "world_news";
  region: string;
};

function decodeXml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function parseRssItems(xml: string): Array<{
  title: string;
  link?: string;
  summary: string;
  publishedAt?: string;
}> {
  const items: Array<{ title: string; link?: string; summary: string; publishedAt?: string }> = [];
  const blocks = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];
  for (const block of blocks) {
    const title = decodeXml(
      (block.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "").trim(),
    );
    const link = decodeXml(
      (block.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1] ?? "").trim(),
    );
    const rawDesc =
      block.match(/<description[^>]*>([\s\S]*?)<\/description>/i)?.[1] ??
      block.match(/<content:encoded[^>]*>([\s\S]*?)<\/content:encoded>/i)?.[1] ??
      title;
    const summary = stripHtml(decodeXml(rawDesc)).slice(0, 500);
    const publishedAt = (
      block.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)?.[1] ?? ""
    ).trim();
    if (!title) continue;
    items.push({ title, link: link || undefined, summary, publishedAt });
  }
  return items;
}

function looksLikeCrimeNews(text: string): boolean {
  const hay = text.toLowerCase();
  const keys = [
    "murder",
    "homicide",
    "killing",
    "serial",
    "manslaughter",
    "trial",
    "sentenced",
    "forensic",
    "arrest",
    "shooting",
    "stabbing",
    "mord",
    "tötung",
    "meurtre",
    "homicidio",
    "asesinato",
    "殺人",
    "犯罪",
    "قتل",
    "جريمة",
    "omicidio",
    "homicídio",
    "assassinato",
    "살인",
    "谋杀",
    "mord",
  ];
  return keys.some((k) => hay.includes(k));
}

function toEnglishHeadline(title: string, feed: WorldNewsFeed): { headline: string; original?: string } {
  const headline = title.slice(0, 200);
  if (feed.language === "en") {
    return { headline };
  }
  return { headline };
}

function toSummary(summary: string, feed: WorldNewsFeed): string {
  const excerpt = summary.trim();
  if (feed.language === "en") {
    return excerpt || "Crime-related report from regional press.";
  }
  if (excerpt) {
    return `Original-language excerpt from ${feed.languageLabel} regional RSS (not machine-translated). ${excerpt}`;
  }
  return `Crime-related report from ${feed.region} (${feed.languageLabel} source; headline shown in original language).`;
}

function inferCountryFromText(text: string, fallback?: CountryCode): CountryCode {
  const fromText = inferCountry(text, text);
  if (fromText !== "OTHER") return fromText;
  return fallback ?? "OTHER";
}

let cache: { items: WorldNewsItem[]; fetchedAt: number } | null = null;
const CACHE_MS = 5 * 60 * 1000;

export async function fetchLiveWorldNews(limit = 24): Promise<WorldNewsItem[]> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_MS) {
    return cache.items.slice(0, limit);
  }

  const collected: WorldNewsItem[] = [];
  const seen = new Set<string>();

  for (const feed of WORLD_NEWS_FEEDS) {
    try {
      const res = await fetch(feed.url, {
        headers: { "user-agent": "MotiveIndexBot/1.0 (+educational archive)" },
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) continue;
      const xml = await res.text();
      const parsed = parseRssItems(xml).filter((item) =>
        looksLikeCrimeNews(`${item.title} ${item.summary}`),
      );

      for (const item of parsed.slice(0, 4)) {
        const key = item.title.toLowerCase().slice(0, 80);
        if (seen.has(key)) continue;
        seen.add(key);

        const { headline, original } = toEnglishHeadline(item.title, feed);
        const country = inferCountryFromText(
          `${item.title} ${item.summary} ${feed.region}`,
          feed.country,
        );

        collected.push({
          id: `wn-live-${seen.size}-${Date.now().toString(36)}`,
          createdAt: item.publishedAt
            ? new Date(item.publishedAt).toISOString()
            : new Date().toISOString(),
          headline,
          summary: toSummary(item.summary, feed),
          kind: "world_news",
          status: "published",
          country: country !== "OTHER" ? country : feed.country,
          region: feed.region,
          sourceUrl: item.link,
          sourceName: feed.region,
          language: feed.language,
          languageLabel: feed.languageLabel,
          originalHeadline: original,
        });
      }
    } catch {
      /* skip unavailable feed */
    }
  }

  collected.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  cache = { items: collected, fetchedAt: Date.now() };
  return collected.slice(0, limit);
}

export function filterWorldNewsByCountry(
  items: WorldNewsItem[],
  country: CountryCode | "",
): WorldNewsItem[] {
  if (!country) return items;
  return items.filter((i) => i.country === country);
}

export function formatNewsRegion(item: WorldNewsItem): string {
  if (item.country && item.country !== "OTHER") {
    return COUNTRY_LABELS[item.country];
  }
  return item.region;
}
