import { z } from "zod";
import {
  chatCompletionHeaders,
  getChatCompletionsUrl,
  getChatModel,
} from "@/lib/openai";
import type {
  CaseNarrative,
  DossierChapter,
  DossierChapterId,
  TimelineEvent,
} from "@/lib/types";

const chapterIds = z.enum([
  "origins",
  "formation",
  "escalation",
  "method",
  "motivation",
  "investigation",
  "aftermath",
]);

export const dossierChapterSchema = z.object({
  id: chapterIds,
  title: z.string().min(3),
  period: z.string().optional(),
  lead: z.string().optional(),
  paragraphs: z.array(z.string().min(20)).min(1).max(6),
  psychNote: z.string().optional(),
});

export const caseNarrativeSchema = z.object({
  hook: z.string().min(20).max(500),
  chapters: z.array(dossierChapterSchema).min(2).max(7),
});

export type NarrativeGenerateInput = {
  caseName: string;
  overview: string;
  subtitle?: string;
  sourceTitle?: string;
  sourceUrl?: string;
  yearStart?: number;
};

export type NarrativeGenerateResult = {
  narrative: CaseNarrative;
  provider: "openai" | "heuristic";
  note?: string;
};

const NARRATIVE_INSTRUCTIONS = `
You write educational forensic-documentary case dossiers for Motive Index.
Rules:
- Use ONLY facts present in the provided source text. Do not invent childhood events, quotes, victim names, or motives not supported by the source.
- When information is missing for a chapter, write 1–2 paragraphs that explicitly state what is unknown and what public records would be needed—do not fabricate filler biography.
- Tone: compelling documentary narration suitable for educated readers—not sensational tabloid, not clinical jargon.
- Minimize graphic violence; focus on background, behavioral pattern, alleged method at summary level, hypothesized motives (labeled as hypotheses), investigation, and aftermath.
- Include psychNote on 2–3 chapters with forensic-psychology marginalia (hypotheses, not diagnoses).
- Chapter ids must be chosen from: origins, formation, escalation, method, motivation, investigation, aftermath. Include as many as the source supports (minimum 3).
- Each chapter needs a vivid title (not just the id name) and 2–4 paragraphs when sources allow.
`.trim();

export function heuristicNarrativeFromSources(input: NarrativeGenerateInput): CaseNarrative {
  const { caseName, overview, sourceTitle, yearStart } = input;
  const year = yearStart ?? new Date().getFullYear();
  const sourceLine = sourceTitle ? `Primary ingest source: ${sourceTitle}.` : "";

  const stub = (id: DossierChapterId, title: string, body: string, psychNote?: string): DossierChapter => ({
    id,
    title,
    period: id === "origins" ? "Background" : String(year),
    lead: body.split(".")[0] + ".",
    paragraphs: [body, sourceLine].filter(Boolean),
    psychNote,
  });

  return {
    hook: `${caseName}: a draft documentary dossier assembled from public news—awaiting primary-source verification and human review.`,
    source: "heuristic",
    generatedAt: new Date().toISOString(),
    reviewNote:
      "Auto-generated skeleton from RSS/summary text. Replace with LLM or human narrative after source review.",
    chapters: [
      stub(
        "origins",
        "What we know about the background",
        `Public reporting on ${caseName} has not yet supplied verified early-life biography in this ingest. ${overview.slice(0, 280)}`,
        "Without primary records, childhood formulation remains speculative—flag for editors.",
      ),
      stub(
        "formation",
        "Path toward the alleged offenses",
        `News clusters describe circumstances leading to legal attention around ${year}. Details on adolescence, relationships, and prior contacts with institutions require court files and investigative reporting beyond this RSS excerpt.`,
      ),
      stub(
        "escalation",
        "The alleged crime period",
        overview.slice(0, 450) || "Offense timeline pending extraction from primary sources.",
        "Behavioral escalation cannot be scored until incident sequence is verified.",
      ),
      stub(
        "motivation",
        "Motives (hypotheses only)",
        `Motivation structure for ${caseName} is not established from a single news summary. Competing frames—instrumental, affective, situational—must be evaluated after trial records and expert testimony are indexed.`,
        "Label all motive language as hypothesis until human-reviewed.",
      ),
      stub(
        "investigation",
        "Detection and legal process",
        `Contemporary reporting referenced in ingest covers arrest, charges, or trial milestones where mentioned. Editors should attach court dockets and inquiry documents.`,
      ),
      stub(
        "aftermath",
        "Outcomes and open questions",
        `Sentencing, appeals, and long-term case significance remain to be filled from verified legal outcomes. This draft stays unpublished until moderation approves sources.`,
      ),
    ],
  };
}

export async function generateCaseNarrative(
  input: NarrativeGenerateInput,
): Promise<NarrativeGenerateResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      narrative: heuristicNarrativeFromSources(input),
      provider: "heuristic",
      note: "OPENAI_API_KEY not set — used template narrative.",
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
          { role: "system", content: NARRATIVE_INSTRUCTIONS },
          {
            role: "user",
            content: JSON.stringify({
              task: "Return JSON matching { hook, chapters[] }",
              caseName: input.caseName,
              subtitle: input.subtitle,
              yearStart: input.yearStart,
              overview: input.overview,
              sourceTitle: input.sourceTitle,
              sourceUrl: input.sourceUrl,
              chapterSchema: {
                id: "origins|formation|escalation|method|motivation|investigation|aftermath",
                title: "string",
                period: "optional string",
                lead: "optional string",
                paragraphs: "string[]",
                psychNote: "optional string",
              },
            }),
          },
        ],
      }),
    });

    if (!res.ok) {
      return {
        narrative: heuristicNarrativeFromSources(input),
        provider: "heuristic",
        note: `LLM error ${res.status}`,
      };
    }

    const data = await res.json();
    const raw = JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
    const checked = caseNarrativeSchema.safeParse(raw);
    if (!checked.success) {
      return {
        narrative: heuristicNarrativeFromSources(input),
        provider: "heuristic",
        note: "LLM JSON failed validation",
      };
    }

    return {
      narrative: {
        ...checked.data,
        source: "llm",
        generatedAt: new Date().toISOString(),
        reviewNote:
          "AI-generated from public-source summary. Human editor must verify facts before publish.",
      },
      provider: "openai",
    };
  } catch {
    return {
      narrative: heuristicNarrativeFromSources(input),
      provider: "heuristic",
      note: "LLM request failed",
    };
  }
}

/** Build timeline rows from narrative chapters for the Timeline tab. */
export function timelineFromNarrative(
  narrative: CaseNarrative,
  caseId: string,
  keepIngestEvent?: TimelineEvent,
): TimelineEvent[] {
  const fromChapters: TimelineEvent[] = narrative.chapters.map((ch, i) => ({
    id: `${caseId}-nar-${ch.id}-${i}`,
    date: ch.period ?? "—",
    label: ch.title,
    detail: ch.lead ?? ch.paragraphs[0] ?? "",
    behavioralNote: ch.psychNote,
  }));
  if (keepIngestEvent) {
    return [keepIngestEvent, ...fromChapters];
  }
  return fromChapters;
}

/** Apply narrative to a draft case (overview hook, timeline, tags). */
export function applyNarrativeToCase<T extends {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  overview: string;
  timeline: TimelineEvent[];
  tags: string[];
  narrative?: CaseNarrative;
  motivationalFactors: { label: string; detail: string }[];
}>(
  draft: T,
  result: NarrativeGenerateResult,
  sourceTitle?: string,
): T {
  const ingestEvent = draft.timeline.find((e) => e.label.toLowerCase().includes("ingest"));
  const narrative = result.narrative;
  const timeline = timelineFromNarrative(narrative, draft.id, ingestEvent);

  const motivationChapter = narrative.chapters.find((c) => c.id === "motivation");
  const motivationalFactors =
    motivationChapter && draft.motivationalFactors.length === 0
      ? [
          {
            label: "Draft motive frame (AI/heuristic)",
            detail: motivationChapter.paragraphs[0] ?? "Pending review.",
          },
        ]
      : draft.motivationalFactors;

  const tags = Array.from(
    new Set([...draft.tags.filter((t) => t !== "narrative-pending"), "narrative-draft"]),
  );

  return {
    ...draft,
    subtitle:
      draft.subtitle.includes("Live-ingest") || draft.subtitle.includes("stub")
        ? narrative.hook.slice(0, 120)
        : draft.subtitle,
    overview: sourceTitle
      ? `${narrative.hook}\n\n---\n\nSource material: ${sourceTitle}\n\n${draft.overview}`
      : `${narrative.hook}\n\n---\n\n${draft.overview}`,
    narrative,
    timeline,
    motivationalFactors,
    tags,
  };
}
