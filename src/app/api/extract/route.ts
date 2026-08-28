import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePrivilegedApiAccess } from "@/lib/apiAuth";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  rawText: z.string().min(40),
});

const extractedSchema = z.object({
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

function heuristicExtract(rawText: string) {
  const firstLine = rawText.split("\n").map((l) => l.trim()).find(Boolean) ?? "Untitled case";
  const yearMatch = rawText.match(/\b(19|20)\d{2}\b/);
  const yearStart = yearMatch ? Number(yearMatch[0]) : new Date().getFullYear();
  const lower = rawText.toLowerCase();
  const crimeCategories: string[] = [];
  if (lower.includes("serial")) crimeCategories.push("serial_murder");
  if (lower.includes("bomb") || lower.includes("ideolog")) crimeCategories.push("terrorism_ideological");
  if (lower.includes("doctor") || lower.includes("patient")) crimeCategories.push("healthcare_murder");
  if (!crimeCategories.length) crimeCategories.push("homicide");

  return {
    name: firstLine.slice(0, 80),
    subtitle: "Extracted draft — review before publishing",
    jurisdiction: "Unspecified",
    location: "Unspecified",
    yearStart,
    yearEnd: null,
    status: "closed" as const,
    crimeCategories,
    overview: rawText.slice(0, 1200),
    warning: "AI/heuristic extraction from raw text. Verify against public sources.",
    offenderName: undefined,
    motivationalFactors: [],
    psychologicalFactors: [],
  };
}

export async function POST(req: Request) {
  const auth = await requirePrivilegedApiAccess(req);
  if (!auth.ok) return auth.response;

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "rawText is required (min 40 chars)" }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const extracted = heuristicExtract(parsed.data.rawText);
    return NextResponse.json({
      extracted,
      provider: "heuristic",
      note: "OPENAI_API_KEY not set — used deterministic extraction.",
    });
  }

  try {
    const { chatCompletionHeaders, getChatCompletionsUrl, getChatModel } = await import(
      "@/lib/openai"
    );
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
              rawText: parsed.data.rawText,
              schemaKeys: Object.keys(extractedSchema.shape),
            }),
          },
        ],
      }),
    });

    if (!res.ok) {
      const extracted = heuristicExtract(parsed.data.rawText);
      return NextResponse.json({
        extracted,
        provider: "heuristic-fallback",
        note: `OpenAI error ${res.status}`,
      });
    }

    const data = await res.json();
    const raw = JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
    const checked = extractedSchema.safeParse(raw);
    if (!checked.success) {
      const extracted = heuristicExtract(parsed.data.rawText);
      return NextResponse.json({
        extracted,
        provider: "heuristic-fallback",
        note: "Model JSON failed validation",
      });
    }

    return NextResponse.json({ extracted: checked.data, provider: "openai" });
  } catch {
    const extracted = heuristicExtract(parsed.data.rawText);
    return NextResponse.json({
      extracted,
      provider: "heuristic-fallback",
      note: "OpenAI request failed",
    });
  }
}
