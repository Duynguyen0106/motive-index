import type { MetadataRoute } from "next";
import { getAllCases, getTheories } from "@/lib/data";
import { getSiteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/archive`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/search`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/live`, lastModified: now, changeFrequency: "hourly", priority: 0.85 },
    { url: `${base}/documents`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/resources`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/stats`, lastModified: now, changeFrequency: "weekly", priority: 0.75 },
    { url: `${base}/analyses`, lastModified: now, changeFrequency: "weekly", priority: 0.55 },
    { url: `${base}/method`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/contribute`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ];

  const caseRoutes: MetadataRoute.Sitemap = getAllCases().map((c) => ({
    url: `${base}/cases/${c.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const theoryRoutes: MetadataRoute.Sitemap = getTheories().map((t) => ({
    url: `${base}/resources/theories/${t.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  return [...staticRoutes, ...caseRoutes, ...theoryRoutes];
}
