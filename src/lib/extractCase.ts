import { z } from "zod";
import { chatCompletionHeaders, getChatCompletionsUrl, getChatModel } from "@/lib/openai";
import type { CrimeCategory, CaseStatus } from "@/lib/types";

export const extractedCaseSchema = z.object({
  name: z.string(),
  subtitle: z.string(),
  jurisdiction: z.string(),
  location: z.string(),
  yearStart: z.number().int().optional(),
  yearEnd: z.number().int().nullable().optional(),
  status: z.enum(["closed", "unsolved", "historical"]),
  crimeCategories: z.array(z.string()),
  overview: z.string(),
  warning: z.string(),
  offenderName: z.string().optional(),
  motivationalFactors: z.array(z.string()).optional(),
  psychologicalFactors: z.array(z.string()).optional(),
});

export type ExtractedCaseMetadata = z.infer<typeof extractedCaseSchema>;

const CRIME_MAP: Record<string, CrimeCategory> = {
  serial_murder: "serial_murder",
  homicide: "homicide",
  healthcare_murder: "healthcare_murder",
  terrorism_ideological: "terrorism_ideological",
  fraud: "fraud",
  arson: "arson",
  mass_violence: "mass_violence",
  other: "other",
};

export function normalizeCrimeCategories(raw: string[]): CrimeCategory[] {
  const out: CrimeCategory[] = [];
  for (const c of raw) {
    const key = c.toLowerCase().replace(/\s+/g, "_");
    const mapped = CRIME_MAP[key];
    if (mapped && !out.includes(mapped)) out.push(mapped);
  }
  return out.length ? out : ["homicide"];
}

export function heuristicExtractCase(rawText: string): ExtractedCaseMetadata {
  const firstLine = rawText.split("\n").map((l) => l.trim()).find(Boolean) ?? "Untitled case";
  const yearMatch = rawText.match(/\b(19|20)\d{2}\b/);
  const yearStart = yearMatch ? Number(yearMatch[0]) : new Date().getFullYear();
  const lower = rawText.toLowerCase();
  const crimeCategories: string[] = [];
  if (lower.includes("serial")) crimeCategories.push("serial_murder");
  if (lower.includes("bomb") || lower.includes("ideolog")) crimeCategories.push("terrorism_ideological");
  if (lower.includes("doctor") || lower.includes("patient")) crimeCategories.push("healthcare_murder");
  if (lower.includes("arson")) crimeCategories.push("arson");
  if (!crimeCategories.length) crimeCategories.push("homicide");

  const status: CaseStatus =
    lower.includes("unsolved") || lower.includes("unknown killer") ? "unsolved" : "closed";

  return {
    name: firstLine.slice(0, 120),
    subtitle: "Extracted from public news cluster",
    jurisdiction: "Unspecified (from news feed)",
    location: "Unspecified",
    yearStart,
    yearEnd: null,
    status,
    crimeCategories,
    overview: rawText.slice(0, 1500),
    warning:
      "Automatically extracted from public RSS. Not verified. Not a clinical or legal determination.",
    offenderName: undefined,
    motivationalFactors: [],
    psychologicalFactors: [],
  };
}

export async function extractCaseMetadata(rawText: string): Promise<{
  extracted: ExtractedCaseMetadata;
  provider: "openai" | "heuristic" | "heuristic-fallback";
  note?: string;
}> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      extracted: heuristicExtractCase(rawText),
      provider: "heuristic",
      note: "OPENAI_API_KEY not set — used deterministic extraction.",
    };
  }

  try {
    const res = await fetch(getChatCompletionsUrl(), {
      method: "POST",
      headers: chatCompletionHeaders(apiKey),
      body: JSON.stringify({
        model: getChatModel(),
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Extract structured forensic case metadata from educational public-source text. Return JSON only. Do not invent private facts. crimeCategories must use snake_case values like serial_murder, homicide, healthcare_murder, terrorism_ideological, fraud, arson, other.",
          },
          {
            role: "user",
            content: JSON.stringify({
              rawText,
              schemaKeys: Object.keys(extractedCaseSchema.shape),
            }),
          },
        ],
      }),
    });

    if (!res.ok) {
      return {
        extracted: heuristicExtractCase(rawText),
        provider: "heuristic-fallback",
        note: `OpenAI error ${res.status}`,
      };
    }

    const data = await res.json();
    const raw = JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
    const checked = extractedCaseSchema.safeParse(raw);
    if (!checked.success) {
      return {
        extracted: heuristicExtractCase(rawText),
        provider: "heuristic-fallback",
        note: "Model JSON failed validation",
      };
    }

    return { extracted: checked.data, provider: "openai" };
  } catch {
    return {
      extracted: heuristicExtractCase(rawText),
      provider: "heuristic-fallback",
      note: "OpenAI request failed",
    };
  }
}
