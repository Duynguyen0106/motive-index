import { z } from "zod";
import { buildDeepForensicAnalysis } from "@/lib/deepAnalysis";
import { normalizeAnalysisDraft } from "@/lib/validation/analysisDraft";
import type {
  BehaviorSignal,
  ForensicAnalysis,
} from "@/lib/types";

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
  synthesis: z.string().optional(),
  constructs: z.array(psychConstructSchema),
  frameworkNotes: z
    .array(
      z.object({
        framework: z.enum([
          "psychodynamic",
          "cognitive_behavioral",
          "social_learning",
          "attachment",
          "biological",
          "personality",
          "ideological",
          "situational",
          "group_influence",
        ]),
        prediction: z.string(),
        assessment: z.string(),
        confidence: z.number().min(0).max(1),
      }),
    )
    .optional(),
  alternativeExplanations: z.array(z.string()),
  whatWeCannotKnow: z.array(z.string()),
  modelVersion: z.string(),
  reviewedByHuman: z.boolean(),
  updatedAt: z.string(),
});

export const RUBRIC_INSTRUCTIONS = `
You are a senior forensic psychology analyst for an educational archive.
Rules:
- Only use provided behavioral signals, dossier excerpts, and timeline facts.
- Produce 3–6 constructs spanning at least 3 distinct PsychDimension values.
- Each construct needs: specific evidence (quote or paraphrase dossier facts), counter-evidence, confidence 0.4–0.9, and clinicalCaveat when using clinical language.
- Write a synthesis paragraph integrating how planning, affect, empathy/remorse, and control interact.
- For each theoreticalFramework listed, add a frameworkNote with a testable prediction and assessment against public evidence.
- Prefer behavioral description over clinical diagnosis labels.
- Always include competing explanations and explicit unknowns.
- Never invent private childhood facts, motives, or quotes.
- Never provide operational advice for committing or concealing crime.
- Minimize graphic detail; focus on psychological pattern.
`.trim();

/** Deterministic rubric analysis — delegates to deep dossier engine. */
export function analyzeFromSignals(
  signals: BehaviorSignal[],
  caseName: string,
  overview = "",
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

  const slug = caseName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return buildDeepForensicAnalysis({
    slug: slug || "case",
    name: caseName,
    subtitle: "Automated dossier analysis",
    overview: overview || `Public-record analysis for ${caseName}.`,
    jurisdiction: "See dossier",
    location: "See dossier",
    era: "See dossier",
    yearStart: 1900,
    status: "closed",
    crimeCategories: ["other"],
    offenderName: "See dossier",
    signals,
    published: false,
    modelVersion: ANALYSIS_MODEL_VERSION,
  });
}

export async function analyzeWithOptionalLLM(input: {
  caseName: string;
  overview: string;
  signals: BehaviorSignal[];
  slug?: string;
  subtitle?: string;
  jurisdiction?: string;
  location?: string;
  era?: string;
  yearStart?: number;
  yearEnd?: number;
  status?: import("@/lib/types").CaseStatus;
  crimeCategories?: import("@/lib/types").CrimeCategory[];
  offenderName?: string;
  narrative?: import("@/lib/types").CaseNarrative;
  timeline?: import("@/lib/types").TimelineEvent[];
  behavioralProfile?: import("@/lib/types").BehavioralProfile;
  motivationalFactors?: import("@/lib/types").MotivationalFactor[];
  psychologicalFactors?: import("@/lib/types").PsychologicalFactor[];
  theoreticalFrameworks?: import("@/lib/types").TheoreticalFramework[];
}): Promise<ForensicAnalysis> {
  const fallback = () =>
    buildDeepForensicAnalysis({
      slug: input.slug ?? "case",
      name: input.caseName,
      subtitle: input.subtitle ?? "Forensic dossier",
      overview: input.overview,
      jurisdiction: input.jurisdiction ?? "See dossier",
      location: input.location ?? input.jurisdiction ?? "See dossier",
      era: input.era ?? "See dossier",
      yearStart: input.yearStart ?? 1900,
      yearEnd: input.yearEnd,
      status: input.status ?? "closed",
      crimeCategories: input.crimeCategories ?? ["other"],
      offenderName: input.offenderName ?? "See dossier",
      signals: input.signals,
      narrative: input.narrative,
      timeline: input.timeline,
      behavioralProfile: input.behavioralProfile,
      motivationalFactors: input.motivationalFactors,
      psychologicalFactors: input.psychologicalFactors,
      theoreticalFrameworks: input.theoreticalFrameworks,
      published: false,
    });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return fallback();
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
          { role: "system", content: RUBRIC_INSTRUCTIONS },
          {
            role: "user",
            content: JSON.stringify({
              task: "Fill forensicAnalysisSchema fields",
              caseName: input.caseName,
              overview: input.overview,
              signals: input.signals,
              dossier: {
                subtitle: input.subtitle,
                jurisdiction: input.jurisdiction,
                timeline: input.timeline?.slice(0, 6),
                behavioralProfile: input.behavioralProfile,
                motivationalFactors: input.motivationalFactors,
                psychologicalFactors: input.psychologicalFactors,
                theoreticalFrameworks: input.theoreticalFrameworks,
              },
              requiredKeys: [
                "summary",
                "synthesis",
                "constructs",
                "frameworkNotes",
                "alternativeExplanations",
                "whatWeCannotKnow",
              ],
            }),
          },
        ],
      }),
    });

    if (!res.ok) {
      return fallback();
    }

    const data = await res.json();
    const raw = JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
    const parsed = forensicAnalysisSchema.safeParse({
      ...raw,
      status: "draft",
      modelVersion: `${ANALYSIS_MODEL_VERSION}-llm`,
      reviewedByHuman: false,
      updatedAt: new Date().toISOString(),
    });

    if (!parsed.success) {
      return fallback();
    }
    return normalizeAnalysisDraft(parsed.data, ANALYSIS_MODEL_VERSION);
  } catch {
    return fallback();
  }
}
