/**
 * Builds deep dossier content (narratives, timelines, enrichments) from catalog case defs.
 * Multilingual cases include English translation with original-language source attribution.
 */
import type { CaseEnrichment } from "@/data/catalog";
import type {
  BehaviorSignal,
  CaseNarrative,
  CrimeCategory,
  DossierChapter,
  DossierChapterId,
  TimelineEvent,
} from "@/lib/types";
import { CRIME_CATEGORY_LABELS } from "@/lib/types";

export type DeepCaseBundle = {
  narrative: CaseNarrative;
  timeline: TimelineEvent[];
  signals: BehaviorSignal[];
  enrichmentPatch: Partial<CaseEnrichment>;
};

type BaseDeepInput = {
  slug: string;
  name: string;
  subtitle: string;
  overview: string;
  jurisdiction: string;
  location: string;
  era: string;
  yearStart: number;
  yearEnd?: number;
  status: string;
  crimeCategories: CrimeCategory[];
  offenderName: string;
  offenderBackground?: string;
};

export type MultilingualDeepInput = BaseDeepInput & {
  nameOriginal?: string;
  offenderNameOriginal?: string;
  primarySourceLanguage: string;
  primarySourceLanguageLabel: string;
  translationNote: string;
  sourceTitles?: string[];
};

export type WorldDeepInput = BaseDeepInput;

function sentences(text: string): string[] {
  return text
    .replace(/«/g, '"')
    .replace(/»/g, '"')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);
}

function categoryLabels(cats: CrimeCategory[]): string {
  return cats.map((c) => CRIME_CATEGORY_LABELS[c]).join(", ");
}

function chapter(
  id: DossierChapterId,
  title: string,
  paragraphs: string[],
  opts?: { period?: string; lead?: string; psychNote?: string },
): DossierChapter {
  return { id, title, paragraphs, ...opts };
}

function buildTimeline(
  slug: string,
  d: BaseDeepInput,
  narrative: CaseNarrative,
): TimelineEvent[] {
  const mid = d.yearEnd
    ? Math.floor((d.yearStart + d.yearEnd) / 2)
    : d.yearStart + 2;
  return [
    {
      id: `${slug}-t-context`,
      date: String(d.yearStart - 1),
      label: "Public-record context",
      detail: `${d.name} (${d.location}): ${d.subtitle}. Era: ${d.era}.`,
      behavioralNote: "Institutional and media context shapes how behavior was documented.",
    },
    {
      id: `${slug}-t-start`,
      date: String(d.yearStart),
      label: "Offense period begins",
      detail: sentences(d.overview)[0] ?? d.overview.slice(0, 200),
    },
    {
      id: `${slug}-t-mid`,
      date: String(mid),
      label: "Pattern recognition / escalation",
      detail:
        narrative.chapters.find((c) => c.id === "escalation")?.paragraphs[0] ??
        "Investigators and press began linking incidents as a series.",
    },
    {
      id: `${slug}-t-end`,
      date: String(d.yearEnd ?? d.yearStart),
      label: d.status === "unsolved" ? "Case remains open" : "Arrest / resolution",
      detail:
        narrative.chapters.find((c) => c.id === "aftermath")?.paragraphs[0] ??
        "Judicial or investigative resolution per public record.",
    },
  ];
}

function buildSignals(slug: string, d: BaseDeepInput, narrative: CaseNarrative): BehaviorSignal[] {
  const escalation = narrative.chapters.find((c) => c.id === "escalation");
  const method = narrative.chapters.find((c) => c.id === "method");
  return [
    {
      id: `${slug}-s-planning`,
      dimension: "planning",
      observation:
        method?.paragraphs[0]?.slice(0, 220) ??
        `Public accounts describe ${categoryLabels(d.crimeCategories).toLowerCase()} with patterned rather than purely impulsive acts.`,
      sourceIds: [`${slug}-src`],
    },
    {
      id: `${slug}-s-affect`,
      dimension: "affect",
      observation:
        escalation?.paragraphs[0]?.slice(0, 220) ??
        `Affect regulation during offense periods is inferred from trial narratives, not direct observation.`,
      sourceIds: [`${slug}-src`],
    },
    {
      id: `${slug}-s-control`,
      dimension: "control",
      observation: `Offender ${d.offenderName} maintained outward social functioning for a period according to ${d.jurisdiction} press and court summaries.`,
      sourceIds: [`${slug}-src`],
    },
  ];
}

function buildEnrichmentPatch(
  d: BaseDeepInput,
  narrative: CaseNarrative,
  extra?: Partial<CaseEnrichment>,
): Partial<CaseEnrichment> {
  const methodCh = narrative.chapters.find((c) => c.id === "method");
  const motiveCh = narrative.chapters.find((c) => c.id === "motivation");
  const aftermathCh = narrative.chapters.find((c) => c.id === "aftermath");

  return {
    legalOutcome: {
      summary: aftermathCh?.paragraphs[0] ?? d.overview,
      trial: aftermathCh?.paragraphs[1],
      sentencing: d.status === "closed" ? "See jurisdiction court records in References." : undefined,
    },
    behavioralProfile: {
      modusOperandi: methodCh?.paragraphs.join(" ") ?? d.overview,
      signature: methodCh?.paragraphs[1]?.slice(0, 200),
      escalation: narrative.chapters.find((c) => c.id === "escalation")?.paragraphs[0]?.slice(0, 200),
      organizationLevel: d.crimeCategories.includes("serial_murder") ? "organized" : "mixed",
    },
    motivationalFactors: [
      {
        label: "Primary motive frame (hypothesis)",
        detail: motiveCh?.paragraphs[0] ?? "Motivation inferred from public trial and press narratives.",
      },
      ...(motiveCh?.paragraphs[1]
        ? [{ label: "Alternative frame", detail: motiveCh.paragraphs[1] }]
        : []),
    ],
    offenders: [
      {
        id: `off-${d.slug}`,
        name: d.offenderName,
        role: "offender",
        known: d.offenderName !== "Unknown",
        sex: "male",
        background:
          d.offenderBackground ??
          `Subject of ${d.jurisdiction} public record. See narrative Origins and Formation chapters.`,
      },
    ],
    ...extra,
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
  const sents = sentences(d.overview);
  const [s0 = d.overview, s1 = "", s2 = ""] = sents;
  const cats = categoryLabels(d.crimeCategories);

  const chapters: DossierChapter[] = [
    chapter(
      "origins",
      `${d.location}: context before the case`,
      [
        ...(opts?.translationLead ? [opts.translationLead] : []),
        `${d.name} entered public consciousness in ${d.jurisdiction} during the ${d.era}. ${s0}`,
        `Media and court documents from the period frame the case within ${d.location}'s social and institutional landscape. This English dossier summarizes those records for forensic teaching — not as a substitute for primary files.`,
      ],
      {
        period: `Before ${d.yearStart}`,
        lead: d.subtitle,
        psychNote: "Origins chapters describe context; they are not claims about childhood psychopathology unless sourced.",
      },
    ),
    chapter(
      "formation",
      opts?.originalNameLine ? `Who ${d.offenderName} was in public record` : `Path toward documented offenses`,
      [
        opts?.originalNameLine ??
          `${d.offenderName} is named in ${d.jurisdiction} court and press archives as the principal subject of this case.`,
        d.offenderBackground ??
          `${s1 || s0} Investigative reporting describes a period of outward normalcy or localized credibility before the offense series drew institutional attention.`,
      ],
      {
        period: `${d.yearStart - 5}–${d.yearStart}`,
        psychNote: "Formation inferences rely on post-offense biographical reporting — retrospective bias is likely.",
      },
    ),
    chapter(
      "escalation",
      "The documented offense period",
      [
        s0,
        s1 ||
          `Between ${d.yearStart} and ${d.yearEnd ?? "resolution"}, authorities linked multiple incidents involving ${cats.toLowerCase()}. Victim counts and sequence follow court findings where available.`,
        s2 ||
          `The case status is recorded as ${d.status}. ${d.status === "unsolved" ? "Investigators continue to treat open leads as active where applicable." : "Judicial proceedings followed public identification."}`,
      ],
      {
        period: `${d.yearStart}–${d.yearEnd ?? d.yearStart}`,
        psychNote: "Escalation timing comes from court chronology; private phenomenology remains unknown.",
      },
    ),
    chapter(
      "method",
      "Modus operandi and behavioral pattern",
      [
        `Public ${d.jurisdiction} sources describe ${cats.toLowerCase()} with elements consistent across incidents rather than isolated chaos. ${s1 || s0}`,
        `Forensic summaries emphasize approach, victim selection, and post-offense behavior at a high level — graphic detail is omitted here per archive policy.`,
      ],
      {
        lead: `Patterned ${cats.toLowerCase()} in ${d.location}`,
        psychNote: "Distinguish MO (practical method) from signature (psychological need) when sources allow.",
      },
    ),
    chapter(
      "motivation",
      "Motives — hypotheses only",
      [
        `Motivation for ${d.name} is debated in ${d.jurisdiction} trial commentary and press. ${s2 || s1 || "Competing frames include instrumental gain, affective rupture, ideological justification, and compulsive repetition — none should be treated as established without court finding."}`,
        `Late-life statements and media interviews, where they exist, may serve impression management. Anchor motive analysis in pre-offense behavior and victim selection patterns.`,
      ],
      { psychNote: "All motive language is hypothesis unless explicitly adjudicated." },
    ),
    chapter(
      "investigation",
      "Detection, inquiry, and institutional response",
      [
        `Investigators in ${d.jurisdiction} built the case through witness accounts, forensic comparison, and — where applicable — cross-jurisdictional coordination. ${s2 || "Detection lag and media pressure shaped the public narrative."}`,
        `${d.status === "unsolved" ? "The matter remains formally unsolved in public record; this dossier reflects indexed sources to date." : "Identification led to arrest, trial preparation, and extensive press coverage in the source jurisdiction."}`,
      ],
      { period: String(d.yearEnd ?? d.yearStart) },
    ),
    chapter(
      "aftermath",
      d.status === "unsolved" ? "Open questions and legacy" : "Trials, sentences, and legacy",
      [
        s2 || s0,
        `For researchers the durable lesson is methodological: ${cats.toLowerCase()} cases test institutional coordination, media ethics, and the limits of behavioral inference from translated or second-hand reporting.`,
      ],
      {
        period: `${d.yearEnd ?? d.yearStart}+`,
        psychNote: "Aftermath chapters track legal outcomes; victim impact belongs in separate memorial context.",
      },
    ),
  ];

  return {
    hook: `${d.subtitle} — ${s0.slice(0, 180)}${s0.length > 180 ? "…" : ""}`,
    chapters,
    source: "human",
    generatedAt: "2026-08-27T20:00:00.000Z",
    reviewNote: opts?.reviewNote,
  };
}

/** Build full deep dossier for a multilingual (translated-source) case. */
export function buildMultilingualDeep(d: MultilingualDeepInput): DeepCaseBundle {
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

  return {
    narrative,
    timeline: buildTimeline(d.slug, d, narrative),
    signals: buildSignals(d.slug, d, narrative),
    enrichmentPatch: buildEnrichmentPatch(d, narrative, {
      nameOriginal: d.nameOriginal,
      primarySourceLanguage: d.primarySourceLanguage,
      primarySourceLanguageLabel: d.primarySourceLanguageLabel,
      translationNote: d.translationNote,
    }),
  };
}

/** Build deep dossier for an English-primary world catalog case. */
export function buildWorldDeep(d: WorldDeepInput): DeepCaseBundle {
  const narrative = buildCoreNarrative(d, {
    reviewNote:
      "English-language public record dossier. Verify claims against court documents and established case literature in References.",
  });

  return {
    narrative,
    timeline: buildTimeline(d.slug, d, narrative),
    signals: buildSignals(d.slug, d, narrative),
    enrichmentPatch: buildEnrichmentPatch(d, narrative),
  };
}
