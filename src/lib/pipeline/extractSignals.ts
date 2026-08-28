import { z } from "zod";
import { chatCompletionHeaders, getChatCompletionsUrl, getChatModel } from "@/lib/openai";
import type { BehaviorSignal, PsychDimension } from "@/lib/types";

const signalSchema = z.object({
  dimension: z.enum([
    "planning",
    "affect",
    "empathy_remorse",
    "control",
    "reality_testing",
    "social_functioning",
    "stressors",
    "pattern_consistency",
  ]),
  observation: z.string().min(10),
});

const HEURISTIC_PATTERNS: { dimension: PsychDimension; keys: string[] }[] = [
  { dimension: "planning", keys: ["planned", "premeditat", "staged", "prepared", "methodical"] },
  { dimension: "affect", keys: ["emotion", "remorse", "cold", "calm", "distress", "rage"] },
  { dimension: "empathy_remorse", keys: ["remorse", "apolog", "victim", "sorry", "regret"] },
  { dimension: "control", keys: ["control", "dominat", "threat", "coerc", "power"] },
  { dimension: "reality_testing", keys: ["delusion", "paranoid", "belief", "ideolog", "fantasy"] },
  { dimension: "social_functioning", keys: ["neighbor", "colleague", "family", "community", "charm"] },
  { dimension: "stressors", keys: ["job loss", "divorce", "bankrupt", "stress", "unemploy"] },
  { dimension: "pattern_consistency", keys: ["pattern", "series", "repeat", "similar", "escalat"] },
];

function heuristicSignals(
  caseId: string,
  title: string,
  summary: string,
  sourceId: string,
): BehaviorSignal[] {
  const hay = `${title} ${summary}`.toLowerCase();
  const sentences = summary.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 20);
  const signals: BehaviorSignal[] = [];

  for (const { dimension, keys } of HEURISTIC_PATTERNS) {
    if (!keys.some((k) => hay.includes(k))) continue;
    const sentence =
      sentences.find((s) => keys.some((k) => s.toLowerCase().includes(k))) ??
      `Public reporting on ${title} mentions ${dimension.replace("_", " ")}-relevant conduct; verify in primary sources.`;
    signals.push({
      id: `${caseId}-sig-${dimension}`,
      dimension,
      observation: sentence.slice(0, 400),
      sourceIds: [sourceId],
    });
    if (signals.length >= 4) break;
  }

  if (!signals.length) {
    signals.push({
      id: `${caseId}-sig-planning`,
      dimension: "planning",
      observation:
        "Public reporting describes alleged offense circumstances; planning level not yet verified from primary records.",
      sourceIds: [sourceId],
    });
  }

  return signals;
}

export async function extractSignalsFromText(input: {
  caseId: string;
  title: string;
  summary: string;
  sourceId?: string;
}): Promise<{ signals: BehaviorSignal[]; provider: "openai" | "heuristic" | "heuristic-fallback" }> {
  const sourceId = input.sourceId ?? "rss";
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      signals: heuristicSignals(input.caseId, input.title, input.summary, sourceId),
      provider: "heuristic",
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
              "Extract 2–5 behavioral signals from public news text for forensic psychology education. Return JSON { signals: [{ dimension, observation }] }. Only cite facts present in the text. No invented motives or private history.",
          },
          {
            role: "user",
            content: JSON.stringify({
              title: input.title,
              summary: input.summary,
              dimensions: signalSchema.shape.dimension.options,
            }),
          },
        ],
      }),
    });

    if (!res.ok) {
      return {
        signals: heuristicSignals(input.caseId, input.title, input.summary, sourceId),
        provider: "heuristic-fallback",
      };
    }

    const data = await res.json();
    const raw = JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
    const list = z.array(signalSchema).safeParse(raw.signals ?? raw);
    if (!list.success || !list.data.length) {
      return {
        signals: heuristicSignals(input.caseId, input.title, input.summary, sourceId),
        provider: "heuristic-fallback",
      };
    }

    return {
      signals: list.data.slice(0, 5).map((s, i) => ({
        id: `${input.caseId}-sig-${i}`,
        dimension: s.dimension,
        observation: s.observation,
        sourceIds: [sourceId],
      })),
      provider: "openai",
    };
  } catch {
    return {
      signals: heuristicSignals(input.caseId, input.title, input.summary, sourceId),
      provider: "heuristic-fallback",
    };
  }
}
