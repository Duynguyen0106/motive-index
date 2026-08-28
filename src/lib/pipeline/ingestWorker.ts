import fs from "node:fs";
import path from "node:path";
import { analyzeFromSignals } from "@/lib/analyze";
import { addUpdate, getAllCases, getCaseBySlug, upsertCase } from "@/lib/data";
import {
  applyNarrativeToCase,
  generateCaseNarrative,
  heuristicNarrativeFromSources,
} from "@/lib/narrativeGenerate";
import { isHeadlineSeenInDb, markHeadlineSeenInDb } from "@/lib/repository";
import { syncAfterCaseWrite, syncAfterUpdateWrite } from "@/lib/dbSync";
import { tryAutoPublishCase } from "@/lib/pipeline/autoPublish";
import { inferCountry } from "@/lib/country";
import { fetchLiveWorldNews } from "@/lib/worldNews";
import type { CrimeCase, CrimeCategory } from "@/lib/types";

export type FeedItem = {
  title: string;
  link?: string;
  summary: string;
  publishedAt?: string;
  source: string;
};

export type PipelineResult = {
  fetched: number;
  created: number;
  published: number;
  skipped: number;
  analyzed: number;
  narrativesGenerated: number;
  errors: string[];
  createdSlugs: string[];
  publishedSlugs: string[];
  publishBlockers: { slug: string; blockers: string[] }[];
};

const DATA_DIR = path.join(process.cwd(), ".data");
const SEEN_PATH = path.join(DATA_DIR, "seen-headlines.json");
const JOBS_PATH = path.join(DATA_DIR, "jobs.json");

const DEFAULT_FEEDS = [
  "https://news.google.com/rss/search?q=murder+trial+forensic&hl=en-US&gl=US&ceid=US:en",
  "https://news.google.com/rss/search?q=serial+killer+court&hl=en-US&gl=US&ceid=US:en",
  "https://news.google.com/rss/search?q=homicide+psychology+OR+%22mental+state%22&hl=en-US&gl=US&ceid=US:en",
];

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 70);
}

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function readSeen(): Record<string, string> {
  try {
    if (!fs.existsSync(SEEN_PATH)) return {};
    return JSON.parse(fs.readFileSync(SEEN_PATH, "utf8")) as Record<string, string>;
  } catch {
    return {};
  }
}

function writeSeen(seen: Record<string, string>) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(SEEN_PATH, JSON.stringify(seen, null, 2));
}

function logJob(entry: Record<string, unknown>) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const prev = fs.existsSync(JOBS_PATH)
    ? (JSON.parse(fs.readFileSync(JOBS_PATH, "utf8")) as unknown[])
    : [];
  const next = [{ at: new Date().toISOString(), ...entry }, ...prev].slice(0, 100);
  fs.writeFileSync(JOBS_PATH, JSON.stringify(next, null, 2));
}

function decodeXml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function parseRss(xml: string, source: string): FeedItem[] {
  const items: FeedItem[] = [];
  const blocks = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];
  for (const block of blocks) {
    const title = decodeXml(
      (block.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "").trim(),
    );
    const link = decodeXml(
      (block.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1] ?? "").trim(),
    );
    const summary = decodeXml(
      (
        block.match(/<description[^>]*>([\s\S]*?)<\/description>/i)?.[1] ??
        block.match(/<content:encoded[^>]*>([\s\S]*?)<\/content:encoded>/i)?.[1] ??
        title
      ).trim(),
    ).replace(/<[^>]+>/g, " ");
    const publishedAt = (
      block.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)?.[1] ?? ""
    ).trim();
    if (!title) continue;
    items.push({
      title,
      link: link || undefined,
      summary: summary.slice(0, 1500),
      publishedAt: publishedAt || undefined,
      source,
    });
  }
  return items;
}

function looksRelevant(item: FeedItem): boolean {
  const hay = `${item.title} ${item.summary}`.toLowerCase();
  const keys = [
    "murder",
    "homicide",
    "killing",
    "serial",
    "manslaughter",
    "trial",
    "sentenced",
    "forensic",
    "psycholog",
    "arson",
    "assault",
  ];
  return keys.some((k) => hay.includes(k));
}

function inferCategories(text: string): CrimeCategory[] {
  const lower = text.toLowerCase();
  const out: CrimeCategory[] = [];
  if (lower.includes("serial")) out.push("serial_murder");
  if (lower.includes("arson")) out.push("arson");
  if (lower.includes("fraud")) out.push("fraud");
  if (lower.includes("bomb") || lower.includes("terror")) out.push("terrorism_ideological");
  if (lower.includes("doctor") || lower.includes("nurse") || lower.includes("patient")) {
    out.push("healthcare_murder");
  }
  if (!out.length) out.push("homicide");
  return out;
}

async function fetchFeed(url: string): Promise<FeedItem[]> {
  const res = await fetch(url, {
    headers: { "user-agent": "MotiveIndexBot/1.0 (+educational archive)" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Feed ${url} -> ${res.status}`);
  const xml = await res.text();
  return parseRss(xml, url);
}

function draftCaseFromItem(item: FeedItem): CrimeCase {
  let slug = slugify(item.title);
  if (getCaseBySlug(slug)) slug = `${slug}-${Date.now().toString(36)}`;
  const year = item.publishedAt
    ? new Date(item.publishedAt).getFullYear() || new Date().getFullYear()
    : new Date().getFullYear();
  const categories = inferCategories(`${item.title} ${item.summary}`);
  const id = `case-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const signals = [
    {
      id: `${id}-s1`,
      dimension: "planning" as const,
      observation:
        "Public reporting mentions alleged offense circumstances; planning level not yet verified from primary records.",
      sourceIds: ["rss"],
    },
  ];

  return {
    id,
    slug,
    name: item.title.slice(0, 120),
    subtitle: "Live-ingest draft from public news cluster",
    jurisdiction: "Unspecified (from news feed)",
    location: "Unspecified",
    country: inferCountry("Unspecified (from news feed)", "Unspecified"),
    yearStart: year,
    era: String(year),
    status: "closed",
    crimeCategories: categories,
    tags: ["live-ingest", "draft", "awaiting-moderation", "ai-pipeline"],
    psychologicalFactors: [],
    theoreticalFrameworks: [],
    diagnoses: [],
    offenders: [
      {
        id: `${id}-off`,
        name: "Not verified",
        role: "offender",
        known: false,
      },
    ],
    victims: [],
    legalOutcome: { summary: "Draft only — legal outcome not verified." },
    behavioralProfile: {
      modusOperandi: "Awaiting primary-source extraction.",
      organizationLevel: "unknown",
    },
    motivationalFactors: [],
    relatedCaseSlugs: [],
    warning:
      "Automatically ingested draft from public RSS. Not verified. Not a clinical or legal determination.",
    contentLevel: "standard",
    overview: `${item.summary}\n\nSource: ${item.source}${item.link ? `\nLink: ${item.link}` : ""}`,
    timeline: [
      {
        id: `${id}-evt`,
        date: new Date().toISOString().slice(0, 10),
        label: "Ingested by live-update worker",
        detail: item.title,
        behavioralNote: "Pending integrity gate review by AI pipeline.",
      },
    ],
    signals,
    documentIds: [],
    references: item.link
      ? [
          {
            id: `${id}-ref`,
            citation: item.title,
            kind: "media",
            url: item.link,
          },
        ]
      : [],
    sources: [
      {
        title: item.title,
        url: item.link,
        kind: "news",
      },
    ],
    analysis: {
      ...analyzeFromSignals(signals, item.title.slice(0, 80)),
      status: "draft",
      reviewedByHuman: false,
      expertCommentary: [],
    },
    featured: false,
  };
}

export async function runLiveUpdatePipeline(options?: {
  feeds?: string[];
  limit?: number;
  analyze?: boolean;
  generateNarrative?: boolean;
  /** When false (default), uses fast template narratives — LLM only if true. */
  llmNarrative?: boolean;
}): Promise<PipelineResult> {
  const feeds =
    options?.feeds ??
    (process.env.LIVE_UPDATE_FEEDS
      ? process.env.LIVE_UPDATE_FEEDS.split(",").map((s) => s.trim()).filter(Boolean)
      : DEFAULT_FEEDS);
  const limit = options?.limit ?? Number(process.env.LIVE_UPDATE_LIMIT ?? 8);
  const analyze = options?.analyze ?? true;
  const generateNarrative = options?.generateNarrative ?? true;
  const llmNarrative = options?.llmNarrative ?? false;

  const result: PipelineResult = {
    fetched: 0,
    created: 0,
    published: 0,
    skipped: 0,
    analyzed: 0,
    narrativesGenerated: 0,
    errors: [],
    createdSlugs: [],
    publishedSlugs: [],
    publishBlockers: [],
  };

  const seen = readSeen();
  const existingTitles = new Set(
    getAllCases().map((c) => normalizeTitle(c.name)),
  );

  const collected: FeedItem[] = [];
  for (const feed of feeds) {
    try {
      const items = await fetchFeed(feed);
      collected.push(...items);
    } catch (err) {
      result.errors.push(err instanceof Error ? err.message : String(err));
    }
  }

  result.fetched = collected.length;
  const candidates = collected.filter(looksRelevant).slice(0, limit * 3);

  for (const item of candidates) {
    if (result.created >= limit) break;
    const key = normalizeTitle(item.title);
    if (!key) {
      result.skipped += 1;
      continue;
    }
    if (seen[key] || existingTitles.has(key) || (await isHeadlineSeenInDb(key))) {
      result.skipped += 1;
      continue;
    }

    try {
      let draft = draftCaseFromItem(item);
      if (!analyze) {
        draft.analysis.status = "pending";
        draft.analysis.constructs = [];
      } else {
        result.analyzed += 1;
      }

      if (generateNarrative) {
        try {
          const narrativeResult = llmNarrative
            ? await generateCaseNarrative({
                caseName: draft.name,
                overview: item.summary,
                subtitle: draft.subtitle,
                sourceTitle: item.title,
                sourceUrl: item.link,
                yearStart: draft.yearStart,
              })
            : {
                narrative: heuristicNarrativeFromSources({
                  caseName: draft.name,
                  overview: item.summary,
                  subtitle: draft.subtitle,
                  sourceTitle: item.title,
                  sourceUrl: item.link,
                  yearStart: draft.yearStart,
                }),
                provider: "heuristic" as const,
                note: "Fast template narrative — use Regenerate story for LLM.",
              };
          draft = applyNarrativeToCase(draft, narrativeResult, item.title);
          result.narrativesGenerated += 1;
        } catch (err) {
          result.errors.push(
            `Narrative ${draft.slug}: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }

      upsertCase(draft);
      await syncAfterCaseWrite(draft);

      const publishResult = await tryAutoPublishCase(draft.slug);
      if (publishResult.published) {
        result.published += 1;
        result.publishedSlugs.push(draft.slug);
        const update = addUpdate({
          id: `upd-${Date.now()}-${result.created}`,
          createdAt: new Date().toISOString(),
          headline: `Live case published: ${draft.name.slice(0, 80)}`,
          summary: "Auto-published by secured AI pipeline after integrity gates passed.",
          caseSlug: draft.slug,
          kind: "new_case",
          status: "published",
        });
        await syncAfterUpdateWrite(update);
      } else {
        result.publishBlockers.push({
          slug: draft.slug,
          blockers: publishResult.blockers,
        });
        const update = addUpdate({
          id: `upd-${Date.now()}-${result.created}`,
          createdAt: new Date().toISOString(),
          headline: `Live draft ingested: ${draft.name.slice(0, 80)}`,
          summary: `Awaiting integrity gates: ${publishResult.blockers.join(" ")}`,
          caseSlug: draft.slug,
          kind: "new_case",
          status: "draft",
        });
        await syncAfterUpdateWrite(update);
      }

      seen[key] = draft.id;
      await markHeadlineSeenInDb(key, { source: item.source, caseSlug: draft.slug });
      existingTitles.add(key);
      result.created += 1;
      result.createdSlugs.push(draft.slug);
    } catch (err) {
      result.errors.push(err instanceof Error ? err.message : String(err));
    }
  }

  writeSeen(seen);
  logJob({
    type: "live-update",
    ...result,
  });
  return result;
}

export function getRecentJobs(limit = 20) {
  try {
    if (!fs.existsSync(JOBS_PATH)) return [];
    const jobs = JSON.parse(fs.readFileSync(JOBS_PATH, "utf8")) as unknown[];
    return jobs.slice(0, limit);
  } catch {
    return [];
  }
}

/** Warm the live RSS cache — crime news is served via worldNews payload, not updates. */
export async function runWorldNewsPipeline(limit = 12): Promise<{
  fetched: number;
  cached: number;
  skipped: number;
}> {
  const items = await fetchLiveWorldNews(limit * 2);
  const cached = Math.min(items.length, limit);
  logJob({ type: "world-news", fetched: items.length, cached, skipped: 0 });
  return { fetched: items.length, cached, skipped: 0 };
}
