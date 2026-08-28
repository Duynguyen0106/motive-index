/**
 * Builds deep dossier content (narratives, timelines, enrichments) from catalog case defs.
 * Uses caseContextDepth for substantive paragraphs and caseDepthOverrides for famous cases.
 */
import { CASE_DEPTH_OVERRIDES, mergeParagraphs } from "@/data/caseDepthOverrides";
import type { CaseEnrichment } from "@/data/catalog";
import { enrichSignalsFromDossier } from "@/lib/deepAnalysis";
import { buildCaseReferences } from "@/lib/caseReferences";
import {
  buildAftermathParagraphs,
  buildDeepTimeline,
  buildEscalationParagraphs,
  buildExpandedOverview,
  buildFormationParagraphs,
  buildInvestigationParagraphs,
  buildMethodParagraphs,
  buildMotivationParagraphs,
  buildMotivationalFactors,
  buildOriginsParagraphs,
  parseCaseContext,
  victimDemographicsNote,
  type CaseContextInput,
} from "@/lib/caseContextDepth";
import type {
  BehaviorSignal,
  CaseNarrative,
  DossierChapter,
  DossierChapterId,
  TimelineEvent,
} from "@/lib/types";

export type DeepCaseBundle = {
  narrative: CaseNarrative;
  timeline: TimelineEvent[];
  signals: BehaviorSignal[];
  enrichmentPatch: Partial<CaseEnrichment>;
  expandedOverview: string;
};

type BaseDeepInput = CaseContextInput;

export type MultilingualDeepInput = BaseDeepInput & {
  nameOriginal?: string;
  offenderNameOriginal?: string;
  primarySourceLanguage: string;
  primarySourceLanguageLabel: string;
  translationNote: string;
  sourceTitles?: string[];
  references?: import("@/lib/types").CaseReference[];
};

export type WorldDeepInput = BaseDeepInput;

function chapter(
  id: DossierChapterId,
  title: string,
  paragraphs: string[],
  opts?: { period?: string; lead?: string; psychNote?: string },
): DossierChapter {
  return { id, title, paragraphs, ...opts };
}

function buildSignals(slug: string, d: BaseDeepInput, narrative: CaseNarrative): BehaviorSignal[] {
  const fromNarrative = enrichSignalsFromDossier({
    slug: d.slug,
    name: d.name,
    subtitle: d.subtitle,
    overview: d.overview,
    jurisdiction: d.jurisdiction,
    location: d.location,
    era: d.era,
    yearStart: d.yearStart,
    yearEnd: d.yearEnd,
    status: d.status as import("@/lib/types").CaseStatus,
    crimeCategories: d.crimeCategories,
    offenderName: d.offenderName,
    narrative,
    timeline: undefined,
  });
  const base = fromNarrative.map((s) => ({
    ...s,
    id: s.id.startsWith(slug) ? s.id : `${slug}-${s.id}`,
    sourceIds: s.sourceIds.length ? s.sourceIds : [`${slug}-narrative`],
  }));
  return base;
}

function buildEnrichmentPatch(
  d: BaseDeepInput,
  narrative: CaseNarrative,
  ctx: ReturnType<typeof parseCaseContext>,
  override: (typeof CASE_DEPTH_OVERRIDES)[string] | undefined,
  extra?: Partial<CaseEnrichment>,
): Partial<CaseEnrichment> {
  const methodCh = narrative.chapters.find((c) => c.id === "method");
  const motiveCh = narrative.chapters.find((c) => c.id === "motivation");
  const aftermathCh = narrative.chapters.find((c) => c.id === "aftermath");
  const investigationCh = narrative.chapters.find((c) => c.id === "investigation");

  const orgLevel = ctx.isSerial
    ? "organized"
    : ctx.isMass
      ? "mixed"
      : ctx.isHealthcare
        ? "organized"
        : "mixed";

  return {
    legalOutcome: {
      summary: aftermathCh?.paragraphs.slice(0, 2).join(" ") ?? d.overview,
      trial: investigationCh?.paragraphs[1] ?? aftermathCh?.paragraphs[0],
      sentencing:
        d.status === "closed"
          ? `See ${d.jurisdiction} court sentencing records and appeal documentation in References.`
          : undefined,
      appeals:
        d.status === "closed" && !ctx.isHistorical
          ? "Appeal history documented in jurisdiction court archives where applicable."
          : undefined,
    },
    behavioralProfile: {
      modusOperandi: methodCh?.paragraphs.join(" ") ?? d.overview,
      signature: methodCh?.paragraphs[1],
      escalation: narrative.chapters.find((c) => c.id === "escalation")?.paragraphs[1],
      organizationLevel: orgLevel,
    },
    motivationalFactors: buildMotivationalFactors(ctx, motiveCh?.paragraphs ?? []),
    offenders: [
      {
        id: `off-${d.slug}`,
        name: d.offenderName,
        role: ctx.offenderUnknown ? "unknown_offender" : "offender",
        known: !ctx.offenderUnknown,
        sex: "male",
        background:
          override?.offenderBackground ??
          d.offenderBackground ??
          narrative.chapters.find((c) => c.id === "formation")?.paragraphs[0] ??
          `Subject of ${d.jurisdiction} public record.`,
      },
    ],
    victims: [
      {
        id: `vic-${d.slug}-primary`,
        name: ctx.isSerial ? "Multiple victims (series)" : "Victims per public record",
        role: "victim",
        known: true,
        demographicsNote: override?.victimNote ?? victimDemographicsNote(ctx),
      },
    ],
    ...(extra ?? {}),
  };
}

function buildCoreNarrative(
  d: BaseDeepInput,
  opts?: {
    reviewNote?: string;
    originalNameLine?: string;
    translationLead?: string;
  },
): CaseNarrative {
  const ctx = parseCaseContext(d);
  const override = CASE_DEPTH_OVERRIDES[d.slug];

  const origins = mergeParagraphs(buildOriginsParagraphs(ctx), override?.origins);
  const formation = mergeParagraphs(buildFormationParagraphs(ctx), override?.formation);
  const escalation = mergeParagraphs(buildEscalationParagraphs(ctx), override?.escalation);
  const method = mergeParagraphs(buildMethodParagraphs(ctx), override?.method);
  const motivation = mergeParagraphs(buildMotivationParagraphs(ctx), override?.motivation);
  const investigation = mergeParagraphs(
    buildInvestigationParagraphs(ctx),
    override?.investigation,
  );
  const aftermath = mergeParagraphs(buildAftermathParagraphs(ctx), override?.aftermath);

  const chapters: DossierChapter[] = [
    chapter(
      "origins",
      `${d.location}: context before the case`,
      [
        ...(opts?.translationLead ? [opts.translationLead] : []),
        ...origins,
      ],
      {
        period: `Before ${d.yearStart}`,
        lead: d.subtitle,
        psychNote:
          "Origins describe institutional and social context — not deterministic childhood causation unless explicitly sourced.",
      },
    ),
    chapter(
      "formation",
      opts?.originalNameLine
        ? `Who ${d.offenderName} was in public record`
        : `Path toward documented offenses`,
      [opts?.originalNameLine, ...formation].filter(Boolean) as string[],
      {
        period: `${d.yearStart - 5}–${d.yearStart}`,
        psychNote:
          "Formation relies on post-offense biographical reporting; hindsight bias and media myth-making are likely.",
      },
    ),
    chapter("escalation", "The documented offense period", escalation, {
      period: `${d.yearStart}–${d.yearEnd ?? d.yearStart}`,
      psychNote: "Escalation timing from court chronology; private phenomenology remains unknown.",
    }),
    chapter("method", "Modus operandi and behavioral pattern", method, {
      lead: `Patterned offending in ${d.location}`,
      psychNote: "Distinguish MO (practical method) from signature (psychological need).",
    }),
    chapter("motivation", "Motives — hypotheses only", motivation, {
      psychNote: "All motive language is hypothesis unless explicitly adjudicated.",
    }),
    chapter("investigation", "Detection, inquiry, and institutional response", investigation, {
      period: String(d.yearEnd ?? d.yearStart),
    }),
    chapter(
      "aftermath",
      d.status === "unsolved" ? "Open questions and legacy" : "Trials, sentences, and legacy",
      aftermath,
      {
        period: `${d.yearEnd ?? d.yearStart}+`,
        psychNote: "Aftermath tracks legal outcomes; victim memorial context is separate.",
      },
    ),
  ];

  const expandedOverview = buildExpandedOverview(ctx);
  const hookSent = ctx.sentences[0] ?? expandedOverview;

  return {
    hook: `${d.subtitle} — ${hookSent.slice(0, 220)}${hookSent.length > 220 ? "…" : ""}`,
    chapters,
    source: "human",
    generatedAt: new Date().toISOString(),
    reviewNote: opts?.reviewNote,
  };
}

function buildTimeline(
  slug: string,
  d: BaseDeepInput,
  narrative: CaseNarrative,
  override: (typeof CASE_DEPTH_OVERRIDES)[string] | undefined,
): TimelineEvent[] {
  const ctx = parseCaseContext(d);
  const paragraphMap = Object.fromEntries(
    narrative.chapters.map((c) => [c.id, c.paragraphs]),
  ) as Record<string, string[]>;

  const generated = buildDeepTimeline(slug, ctx, {
    escalation: paragraphMap.escalation,
    method: paragraphMap.method,
    investigation: paragraphMap.investigation,
    aftermath: paragraphMap.aftermath,
  });

  if (override?.timeline?.length) {
    return [...override.timeline, ...generated.filter((g) => !override.timeline!.some((o) => o.label === g.label))];
  }
  return generated;
}

function assembleBundle(
  d: BaseDeepInput,
  narrative: CaseNarrative,
  opts?: { extra?: Partial<CaseEnrichment>; existingReferences?: import("@/lib/types").CaseReference[] },
): DeepCaseBundle {
  const ctx = parseCaseContext(d);
  const override = CASE_DEPTH_OVERRIDES[d.slug];
  const timeline = buildTimeline(d.slug, d, narrative, override);

  return {
    narrative,
    timeline,
    signals: buildSignals(d.slug, { ...d, overview: buildExpandedOverview(ctx) }, narrative),
    enrichmentPatch: {
      ...buildEnrichmentPatch(d, narrative, ctx, override, opts?.extra),
      references: buildCaseReferences(ctx, { existing: opts?.existingReferences }),
    },
    expandedOverview: buildExpandedOverview(ctx),
  };
}

/** Build deep dossier for an English-primary world catalog case. */
const worldDeepCache = new Map<string, DeepCaseBundle>();

export function buildWorldDeep(d: WorldDeepInput): DeepCaseBundle {
  const cached = worldDeepCache.get(d.slug);
  if (cached) return cached;
  const narrative = buildCoreNarrative(d, {
    reviewNote:
      "English-language public record dossier with expanded contextual narrative. Verify claims against court documents and established case literature in References.",
  });
  const bundle = assembleBundle(d, narrative);
  worldDeepCache.set(d.slug, bundle);
  return bundle;
}

const multilingualDeepCache = new Map<string, DeepCaseBundle>();

/** Build full deep dossier for a multilingual (translated-source) case. */
export function buildMultilingualDeep(d: MultilingualDeepInput): DeepCaseBundle {
  const cached = multilingualDeepCache.get(d.slug);
  if (cached) return cached;
  const originalNameLine = d.offenderNameOriginal
    ? `In ${d.primarySourceLanguageLabel} sources the offender is recorded as ${d.offenderNameOriginal} (${d.offenderName}).`
    : d.nameOriginal
      ? `The case is known in ${d.primarySourceLanguageLabel} as ${d.nameOriginal}.`
      : undefined;

  const sourceLine = d.sourceTitles?.length
    ? `Primary ${d.primarySourceLanguageLabel} sources include: ${d.sourceTitles.join("; ")}.`
    : `Primary sources are in ${d.primarySourceLanguageLabel}; see References for original-language citations.`;

  const narrative = buildCoreNarrative(d, {
    originalNameLine,
    translationLead: `[Translation from ${d.primarySourceLanguageLabel}] ${sourceLine} ${d.translationNote}`,
    reviewNote: `English dossier translated/synthesized from ${d.primarySourceLanguageLabel} public records. ${d.translationNote} Consult original-language citations before citing in academic work.`,
  });

  const bundle = assembleBundle(d, narrative, {
    extra: {
      nameOriginal: d.nameOriginal,
      primarySourceLanguage: d.primarySourceLanguage,
      primarySourceLanguageLabel: d.primarySourceLanguageLabel,
      translationNote: d.translationNote,
    },
    existingReferences: d.references,
  });
  multilingualDeepCache.set(d.slug, bundle);
  return bundle;
}

/** Re-export for seed pipeline */
export { buildExpandedOverview, parseCaseContext };
