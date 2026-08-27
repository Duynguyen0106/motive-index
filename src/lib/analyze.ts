import { z } from "zod";
import type {
  BehaviorSignal,
  ForensicAnalysis,
  PsychConstruct,
  PsychDimension,
} from "@/lib/types";
import { DIMENSION_LABELS } from "@/lib/types";

export const ANALYSIS_MODEL_VERSION = "rubric-v1";

export const psychConstructSchema = z.object({
  id: z.string(),
  label: z.string(),
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
  hypothesis: z.string(),
  evidence: z.array(z.string()).min(1),
  counterEvidence: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  clinicalCaveat: z.string().optional(),
});

export const forensicAnalysisSchema = z.object({
  status: z.enum(["published", "draft", "pending"]),
  summary: z.string(),
  constructs: z.array(psychConstructSchema),
  alternativeExplanations: z.array(z.string()),
  whatWeCannotKnow: z.array(z.string()),
  modelVersion: z.string(),
  reviewedByHuman: z.boolean(),
  updatedAt: z.string(),
});

export const RUBRIC_INSTRUCTIONS = `
You are a forensic psychology analyst for an educational archive.
Rules:
- Only use provided behavioral signals and source excerpts.
- Prefer behavioral description over clinical diagnosis labels.
- If you use clinical terms, mark them as hypotheses with caveats.
- Always include competing explanations and explicit unknowns.
- Never invent private childhood facts, motives, or quotes.
- Never provide operational advice for committing or concealing crime.
- Minimize graphic detail; focus on psychological pattern.
`.trim();

function avgConfidence(constructs: PsychConstruct[]): number {
  if (!constructs.length) return 0;
  return constructs.reduce((s, c) => s + c.confidence, 0) / constructs.length;
}

/** Deterministic rubric filler for MVP when no LLM key is present. */
export function analyzeFromSignals(
  signals: BehaviorSignal[],
  caseName: string,
): ForensicAnalysis {
  if (!signals.length) {
    return {
      status: "pending",
      summary: `Insufficient extracted signals to score ${caseName}. Awaiting primary sources.`,
      constructs: [],
      alternativeExplanations: [
        "Media framing may distort early behavioral picture",
      ],
      whatWeCannotKnow: [
        "Motive structure",
        "Personality pattern",
        "Situational triggers",
      ],
      modelVersion: ANALYSIS_MODEL_VERSION,
      reviewedByHuman: false,
      updatedAt: new Date().toISOString(),
    };
  }

  const byDim = new Map<PsychDimension, BehaviorSignal[]>();
  for (const s of signals) {
    const list = byDim.get(s.dimension) ?? [];
    list.push(s);
    byDim.set(s.dimension, list);
  }

  const constructs: PsychConstruct[] = [...byDim.entries()].map(
    ([dimension, dimSignals], i) => {
      const evidence = dimSignals.map((s) => s.observation);
      const confidence = Math.min(0.45 + dimSignals.length * 0.12, 0.78);
      return {
        id: `auto-${dimension}-${i}`,
        label: `${DIMENSION_LABELS[dimension]} pattern hypothesis`,
        dimension,
        hypothesis: `Public behavioral signals suggest a noteworthy pattern on ${DIMENSION_LABELS[dimension].toLowerCase()}. This is an automated draft for human review—not a clinical finding.`,
        evidence,
        counterEvidence: [
          "Automated extraction may overweight sensational sources",
          "Missing counter-evidence until fuller dossier review",
        ],
        confidence,
        clinicalCaveat:
          "Draft construct from signal clustering only; requires expert review before publish.",
      };
    },
  );

  return {
    status: "draft",
    summary: `Automated draft for ${caseName} across ${constructs.length} dimensions (mean confidence ${avgConfidence(constructs).toFixed(2)}). Publish only after human review and source verification.`,
    constructs,
    alternativeExplanations: [
      "Situational stressors may explain parts of the pattern without trait pathology",
      "Investigative and media selection bias can create false consistency",
      "Substance or group influence may be under-documented in early sources",
    ],
    whatWeCannotKnow: [
      "Private subjective experience",
      "Undocumented offenses or aborted acts",
      "Definitive clinical diagnosis from open sources",
    ],
    modelVersion: ANALYSIS_MODEL_VERSION,
    reviewedByHuman: false,
    updatedAt: new Date().toISOString(),
  };
}

export async function analyzeWithOptionalLLM(input: {
  caseName: string;
  overview: string;
  signals: BehaviorSignal[];
}): Promise<ForensicAnalysis> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return analyzeFromSignals(input.signals, input.caseName);
  }

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: RUBRIC_INSTRUCTIONS },
          {
            role: "user",
            content: JSON.stringify({
              task: "Fill forensicAnalysisSchema fields",
              caseName: input.caseName,
              overview: input.overview,
              signals: input.signals,
              requiredKeys: [
                "summary",
                "constructs",
                "alternativeExplanations",
                "whatWeCannotKnow",
              ],
            }),
          },
        ],
      }),
    });

    if (!res.ok) {
      return analyzeFromSignals(input.signals, input.caseName);
    }

    const data = await res.json();
    const raw = JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
    const parsed = forensicAnalysisSchema.safeParse({
      ...raw,
      status: "draft",
      modelVersion: ANALYSIS_MODEL_VERSION,
      reviewedByHuman: false,
      updatedAt: new Date().toISOString(),
    });

    if (!parsed.success) {
      return analyzeFromSignals(input.signals, input.caseName);
    }
    return parsed.data;
  } catch {
    return analyzeFromSignals(input.signals, input.caseName);
  }
}
