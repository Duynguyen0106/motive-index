/**
 * Dossier-driven forensic analysis engine — produces multi-dimensional constructs,
 * cross-dimensional synthesis, and framework-linked hypotheses from public-record signals.
 */
import type {
  BehaviorSignal,
  BehavioralProfile,
  CaseNarrative,
  CaseStatus,
  CrimeCategory,
  ForensicAnalysis,
  FrameworkNote,
  MotivationalFactor,
  PsychConstruct,
  PsychDimension,
  PsychologicalFactor,
  TheoreticalFramework,
  TimelineEvent,
} from "@/lib/types";
import {
  CRIME_CATEGORY_LABELS,
  DIMENSION_LABELS,
  FACTOR_LABELS,
  FRAMEWORK_LABELS,
} from "@/lib/types";

export const DEEP_ANALYSIS_MODEL_VERSION = "rubric-v2-deep";

const ALL_DIMENSIONS: PsychDimension[] = [
  "planning",
  "affect",
  "empathy_remorse",
  "control",
  "reality_testing",
  "social_functioning",
  "stressors",
  "pattern_consistency",
];

export type DossierAnalysisInput = {
  slug: string;
  name: string;
  subtitle: string;
  overview: string;
  jurisdiction: string;
  location: string;
  era: string;
  yearStart: number;
  yearEnd?: number;
  status: CaseStatus;
  crimeCategories: CrimeCategory[];
  offenderName: string;
  signals?: BehaviorSignal[];
  narrative?: CaseNarrative;
  timeline?: TimelineEvent[];
  behavioralProfile?: BehavioralProfile;
  motivationalFactors?: MotivationalFactor[];
  psychologicalFactors?: PsychologicalFactor[];
  theoreticalFrameworks?: TheoreticalFramework[];
  primarySourceLanguageLabel?: string;
  translationNote?: string;
  /** When true, mark analysis published and human-reviewed (catalog seed). */
  published?: boolean;
  modelVersion?: string;
};

function categoryLabel(cats: CrimeCategory[]): string {
  return cats.map((c) => CRIME_CATEGORY_LABELS[c]).join(", ");
}

function clip(text: string, max = 240): string {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

function uniqueByDimension(signals: BehaviorSignal[]): BehaviorSignal[] {
  const seen = new Set<PsychDimension>();
  const out: BehaviorSignal[] = [];
  for (const s of signals) {
    if (seen.has(s.dimension)) continue;
    seen.add(s.dimension);
    out.push(s);
  }
  return out;
}

/** Mine narrative chapters, timeline, and behavioral profile for dimension-tagged signals. */
export function enrichSignalsFromDossier(ctx: DossierAnalysisInput): BehaviorSignal[] {
  const { slug, narrative, timeline, behavioralProfile, motivationalFactors } = ctx;
  const extracted: BehaviorSignal[] = [];

  const chapter = (id: string) => narrative?.chapters.find((c) => c.id === id);
  const origins = chapter("origins");
  const formation = chapter("formation");
  const escalation = chapter("escalation");
  const method = chapter("method");
  const motivation = chapter("motivation");
  const investigation = chapter("investigation");
  const aftermath = chapter("aftermath");

  if (method?.paragraphs[0]) {
    extracted.push({
      id: `${slug}-ex-planning`,
      dimension: "planning",
      observation: clip(method.paragraphs[0]),
      sourceIds: [`${slug}-narrative-method`],
    });
  }

  if (escalation?.paragraphs[0]) {
    extracted.push({
      id: `${slug}-ex-affect`,
      dimension: "affect",
      observation: clip(
        escalation.psychNote ??
          escalation.paragraphs[0] ??
          "Affect during offense periods is inferred from trial and press narratives.",
      ),
      sourceIds: [`${slug}-narrative-escalation`],
    });
  }

  if (aftermath?.paragraphs[0] || motivation?.paragraphs[1]) {
    extracted.push({
      id: `${slug}-ex-empathy`,
      dimension: "empathy_remorse",
      observation: clip(
        motivation?.paragraphs[1] ??
          aftermath?.paragraphs[0] ??
          "Public conduct after identification is weighed for victim-centered versus self-protective framing.",
      ),
      sourceIds: [`${slug}-narrative-aftermath`],
    });
  }

  if (behavioralProfile?.modusOperandi || method?.paragraphs[1]) {
    extracted.push({
      id: `${slug}-ex-control`,
      dimension: "control",
      observation: clip(
        behavioralProfile?.signature ??
          method?.paragraphs[1] ??
          `Documented ${categoryLabel(ctx.crimeCategories).toLowerCase()} pattern suggests dominance and situational control goals.`,
      ),
      sourceIds: [`${slug}-profile-mo`],
    });
  }

  if (motivation?.paragraphs[0]) {
    extracted.push({
      id: `${slug}-ex-reality`,
      dimension: "reality_testing",
      observation: clip(motivation.paragraphs[0]),
      sourceIds: [`${slug}-narrative-motivation`],
    });
  }

  if (formation?.paragraphs[0]) {
    extracted.push({
      id: `${slug}-ex-social`,
      dimension: "social_functioning",
      observation: clip(formation.paragraphs[0]),
      sourceIds: [`${slug}-narrative-formation`],
    });
  }

  if (origins?.paragraphs[0] || motivationalFactors?.[0]?.detail) {
    extracted.push({
      id: `${slug}-ex-stressors`,
      dimension: "stressors",
      observation: clip(
        motivationalFactors?.[0]?.detail ??
          origins?.paragraphs[0] ??
          `Institutional and social context in ${ctx.location} during the ${ctx.era} frames situational pressure — not deterministic causation.`,
      ),
      sourceIds: [`${slug}-narrative-origins`],
    });
  }

  const timelineNote = timeline?.find((t) => t.behavioralNote)?.behavioralNote;
  if (behavioralProfile?.escalation || timelineNote) {
    extracted.push({
      id: `${slug}-ex-pattern`,
      dimension: "pattern_consistency",
      observation: clip(
        behavioralProfile?.escalation ??
          timelineNote ??
          `Offense series across ${ctx.yearStart}–${ctx.yearEnd ?? ctx.yearStart} shows recurring behavioral themes in public record.`,
      ),
      sourceIds: [`${slug}-timeline`],
    });
  }

  if (investigation?.paragraphs[0] && ctx.status === "unsolved") {
    extracted.push({
      id: `${slug}-ex-communicative`,
      dimension: "control",
      observation: clip(
        `Unsolved status limits offender-specific inference; communicative or taunting elements in public record are analyzed as behavioral persona hypotheses.`,
      ),
      sourceIds: [`${slug}-narrative-investigation`],
    });
  }

  return uniqueByDimension(extracted);
}

function mergeSignals(ctx: DossierAnalysisInput): Map<PsychDimension, BehaviorSignal[]> {
  const combined = [...(ctx.signals ?? []), ...enrichSignalsFromDossier(ctx)];
  const byDim = new Map<PsychDimension, BehaviorSignal[]>();
  for (const s of combined) {
    const list = byDim.get(s.dimension) ?? [];
    list.push(s);
    byDim.set(s.dimension, list);
  }
  return byDim;
}

type DimTemplate = {
  label: string;
  hypothesis: (ctx: DossierAnalysisInput) => string;
  counterEvidence: (ctx: DossierAnalysisInput) => string[];
  clinicalCaveat?: string;
};

const DIMENSION_TEMPLATES: Record<PsychDimension, DimTemplate> = {
  planning: {
    label: "Premeditation and operational planning",
    hypothesis: (ctx) =>
      `Public ${ctx.jurisdiction} sources on ${ctx.name} describe ${categoryLabel(ctx.crimeCategories).toLowerCase()} with elements of preparation, staging, or sustained concealment rather than purely impulsive acts. Planning here refers to offense behavior — not IQ or social success.`,
    counterEvidence: (ctx) => [
      `Some incidents in ${ctx.name} may include opportunistic or stress-triggered deviations from the dominant pattern`,
      "Media summaries can overstate consistency of premeditation across the full series",
      ctx.status === "unsolved"
        ? "Without identified offender, planning inferences rely on crime-scene and communicative evidence only"
        : "Defense narratives sometimes frame acts as situational loss of control",
    ],
    clinicalCaveat: "Organized offense behavior ≠ global life functioning or diagnosis.",
  },
  affect: {
    label: "Affect regulation during offense periods",
    hypothesis: (ctx) =>
      `Affect during ${ctx.name} is reconstructed from trial testimony, witness accounts, and post-offense conduct in ${ctx.location}. The pattern may show emotional flatness, agitation, or performative emotion — each implying different regulatory strategies.`,
    counterEvidence: () => [
      "Witness affect descriptions are retrospective and may be contaminated by shock",
      "Substance use or sleep deprivation could modulate presentation without trait inference",
      "Courtroom emotion may reflect legal strategy rather than offense-period state",
    ],
    clinicalCaveat: "Affect in public record is behavior under observation, not private phenomenology.",
  },
  empathy_remorse: {
    label: "Victim-centered versus self-protective conduct",
    hypothesis: (ctx) =>
      `Statements and conduct attributed to ${ctx.offenderName} in ${ctx.jurisdiction} proceedings are scored for whether they center victim harm, accept responsibility, or prioritize image and legal advantage. ${ctx.status === "unsolved" ? "For unsolved cases, communicative content is scored as persona behavior." : "Late-stage remorse displays require skepticism when they coincide with sentencing."}`,
    counterEvidence: () => [
      "Private remorse cannot be ruled out from public sources alone",
      "Cultural norms shape acceptable expressions of grief and guilt",
      "Coerced or coached statements may mimic remorse without authentic restructuring",
    ],
    clinicalCaveat: "Absence of public remorse is not diagnostic proof of psychopathy or empathy deficit.",
  },
  control: {
    label: "Dominance, coercion, and narrative control",
    hypothesis: (ctx) =>
      `${ctx.name} involves behavioral themes of controlling victims, investigators, or public narrative — common in ${categoryLabel(ctx.crimeCategories).toLowerCase()} cases where terror, humiliation, or communicative taunting extend beyond instrumental need.`,
    counterEvidence: () => [
      "Instrumental crimes may show control behavior without psychological 'need' for dominance",
      "Media amplification can inflate perceived communicative intent",
      "Copycat or hoax elements may mimic control signatures",
    ],
  },
  reality_testing: {
    label: "Ideological encapsulation versus instrumental goals",
    hypothesis: (ctx) =>
      `Motivation narratives for ${ctx.name} must separate encapsulated belief systems (where ideology filters evidence) from organized instrumental offending (where ideology is post-hoc justification). Public statements from ${ctx.offenderName} are weighed against pre-offense behavior and victim selection.`,
    counterEvidence: (ctx) => [
      "Sincere ideological belief and manipulative rhetoric are difficult to distinguish post hoc",
      ctx.crimeCategories.includes("terrorism_ideological")
        ? "State and movement narratives may over-attribute unified ideology"
        : "Non-ideological cases can still produce manifesto-like communications for other reasons",
      "Mental state at offense time may differ from later courtroom articulation",
    ],
    clinicalCaveat: "Reality-testing constructs describe belief-behavior fit — not psychosis diagnosis.",
  },
  social_functioning: {
    label: "Double life and impression management",
    hypothesis: (ctx) =>
      `Biographical reporting on ${ctx.offenderName} often describes a gap between public role (employment, family, community standing in ${ctx.location}) and concealed offense behavior — a pattern relevant to compartmentalization and social masking hypotheses.`,
    counterEvidence: () => [
      "Post-offense biographies are retrospective and may construct a 'double life' arc",
      "Social competence in one domain does not predict violence in another",
      "Neighbors' shock is not independent forensic evidence",
    ],
    clinicalCaveat: "Social functioning describes observed roles — not validated personality assessment.",
  },
  stressors: {
    label: "Situational stressors and precipitating context",
    hypothesis: (ctx) =>
      `The ${ctx.era} context in ${ctx.jurisdiction} — institutional pressure, status threat, loss events, or marginalization documented in ${ctx.name} sources — may lower behavioral inhibition or channel grievance without requiring trait pathology as sole explanation.`,
    counterEvidence: () => [
      "Many people experience similar stressors without violent acting out",
      "Stressor narratives can be defense-constructed or media-simplified",
      "Correlation in biography does not establish causal weight",
    ],
    clinicalCaveat: "Stressors provide context; they do not excuse or fully explain offending.",
  },
  pattern_consistency: {
    label: "Cross-incident behavioral consistency",
    hypothesis: (ctx) =>
      `Across ${ctx.yearStart}–${ctx.yearEnd ?? "resolution"}, ${ctx.name} shows recurring themes in approach, victim selection, post-offense behavior, or communicative style — supporting a stable behavioral script hypothesis rather than unrelated one-off events.`,
    counterEvidence: (ctx) => [
      "Linkage across incidents may reflect investigator confirmation bias",
      ctx.status === "unsolved" ? "Attribution of unsolved acts to one offender remains contested" : "Evolution and de-escalation within a series are often under-documented",
      "Geographic and temporal clustering can mimic pattern where coincidence exists",
    ],
  },
};

function confidenceForConstruct(
  dimSignals: BehaviorSignal[],
  evidence: string[],
  inferred: boolean,
): number {
  let score = 0.5 + dimSignals.length * 0.06 + evidence.length * 0.04;
  if (inferred) score -= 0.12;
  if (evidence.some((e) => e.length > 80)) score += 0.04;
  return Math.min(Math.max(score, 0.42), inferred ? 0.68 : 0.84);
}

function buildConstruct(
  dimension: PsychDimension,
  dimSignals: BehaviorSignal[],
  ctx: DossierAnalysisInput,
  index: number,
): PsychConstruct {
  const template = DIMENSION_TEMPLATES[dimension];
  const evidence = dimSignals.length
    ? dimSignals.map((s) => s.observation)
    : [
        `Inferred from ${categoryLabel(ctx.crimeCategories).toLowerCase()} case type and ${ctx.jurisdiction} public-record framing for ${ctx.name}`,
      ];
  const inferred = dimSignals.length === 0;

  return {
    id: `${ctx.slug}-${dimension}-${index}`,
    label: template.label,
    dimension,
    hypothesis: template.hypothesis(ctx),
    evidence,
    counterEvidence: template.counterEvidence(ctx),
    confidence: confidenceForConstruct(dimSignals, evidence, inferred),
    clinicalCaveat: template.clinicalCaveat,
  };
}

function buildFrameworkNotes(ctx: DossierAnalysisInput): FrameworkNote[] {
  const frameworks = ctx.theoreticalFrameworks ?? ["personality", "situational"];
  const factors = ctx.psychologicalFactors ?? [];

  return frameworks.map((framework) => {
    const factorText = factors.length
      ? factors.map((f) => FACTOR_LABELS[f]).join(", ")
      : "documented behavioral themes";

    const predictions: Record<TheoreticalFramework, string> = {
      personality: `Stable trait patterns (${factorText}) would predict similar behavioral signatures across settings and relationships in ${ctx.name}.`,
      cognitive_behavioral: `Offense cycles would show learned reinforcement — escalation where consequences were absent and inhibition where risk increased.`,
      social_learning: `Modeling and vicarious reinforcement in ${ctx.location} during the ${ctx.era} could shape method selection and rationalization scripts.`,
      attachment: `Relational rupture, abandonment, or insecure bonding themes would appear in pre-offense relationships if attachment drives are primary.`,
      biological: `Neurological or substance factors would show temporal correlation with offense periods if biological drivers are salient.`,
      psychodynamic: `Unconscious conflict and defensive operations would manifest in symbolic offense choices and repetitive relational patterns.`,
      ideological: `Belief encapsulation would predict filtering of disconfirming evidence and offense rationalization as morally mandated.`,
      situational: `Opportunity structure and acute stress in ${ctx.jurisdiction} would predict offense timing without requiring deep trait pathology.`,
      group_influence: `Group norms, authority, or contagion would predict coordinated or mirrored behavior if collective dynamics are primary.`,
    };

    const supportLevel =
      framework === "situational" || framework === "personality" ? 0.62 : 0.55;

    return {
      framework,
      prediction: predictions[framework],
      assessment: `For ${ctx.name}, public evidence partially supports a ${FRAMEWORK_LABELS[framework].toLowerCase()} read when paired with ${factorText.toLowerCase()}. Competing frameworks remain viable; this is a teaching hypothesis, not adjudicated truth.`,
      confidence: supportLevel,
    };
  });
}

function buildSynthesis(constructs: PsychConstruct[], ctx: DossierAnalysisInput): string {
  const top = [...constructs].sort((a, b) => b.confidence - a.confidence).slice(0, 3);
  const dimList = top.map((c) => DIMENSION_LABELS[c.dimension].toLowerCase()).join(", ");
  const statusNote =
    ctx.status === "unsolved"
      ? "Because the offender identity or complete series attribution remains contested, inferences describe the behavioral persona evident in public record rather than a named individual's clinical profile."
      : `Integrated reading of ${ctx.offenderName} emphasizes behavior observable in ${ctx.jurisdiction} court and press archives.`;

  return `${ctx.name} (${ctx.subtitle}): ${statusNote} The strongest convergent signals cluster around ${dimList}. ${top[0]?.hypothesis.split(".")[0] ?? "Pattern analysis pending"}. Cross-dimensional synthesis treats planning, social presentation, and remorse signals as interacting variables — impression management can mask empathy deficits while sustained planning suggests instrumental rather than purely affective drivers. ${ctx.primarySourceLanguageLabel ? `Analysts working from English summaries should verify nuance in ${ctx.primarySourceLanguageLabel} originals before clinical or legal citation.` : "All constructs remain hypotheses subject to primary-source verification."}`;
}

function buildAlternatives(ctx: DossierAnalysisInput): string[] {
  const base = [
    `Situational opportunity and acute stress in ${ctx.jurisdiction} may explain specific incidents without a unified trait narrative`,
    "Investigative linkage and media selection bias can create false behavioral consistency across the series",
    "Substance use, sleep disruption, or medical factors may be under-documented in press summaries",
  ];
  if (ctx.crimeCategories.includes("terrorism_ideological")) {
    base.push(
      "Political grievance may be sincere rather than performative — ideological framework should not be collapsed into personality pathology alone",
    );
  }
  if (ctx.status === "unsolved") {
    base.push(
      "Multiple offenders, copycat acts, or hoax communications could explain part of the attributed pattern",
    );
  }
  if (ctx.primarySourceLanguageLabel) {
    base.push(
      `Translation and cross-cultural reporting gaps may distort motive and affect inferences from ${ctx.primarySourceLanguageLabel} sources`,
    );
  }
  return base;
}

function buildUnknowns(ctx: DossierAnalysisInput): string[] {
  const base = [
    "Private subjective experience and undocumented offense episodes",
    "Definitive clinical diagnosis from open sources alone",
    "Exact weighting of competing motives across the full offense series",
  ];
  if (ctx.status === "unsolved") {
    base.unshift("Offender identity and complete attribution of attributed acts");
  }
  if (ctx.offenderName === "Unknown") {
    base.unshift("Any inference about individual psychopathology without identified subject");
  }
  return base;
}

function buildSummary(constructs: PsychConstruct[], ctx: DossierAnalysisInput): string {
  const dims = new Set(constructs.map((c) => c.dimension));
  const avg =
    constructs.reduce((s, c) => s + c.confidence, 0) / Math.max(constructs.length, 1);
  const langNote = ctx.primarySourceLanguageLabel
    ? ` Primary sources: ${ctx.primarySourceLanguageLabel}. ${ctx.translationNote ?? ""}`
    : "";

  return `${ctx.name}: ${ctx.subtitle}. Multi-dimensional forensic read across ${dims.size} rubric dimensions (mean confidence ${avg.toFixed(2)}) integrating ${categoryLabel(ctx.crimeCategories).toLowerCase()} patterns in ${ctx.location} (${ctx.era}). ${ctx.status === "unsolved" ? "Unsolved status limits offender-specific claims — analysis targets documented behavioral persona." : `Focus remains on observable conduct attributed to ${ctx.offenderName}, not sensational speculation.`}${langNote}`;
}

/** Build a deep forensic analysis from dossier context and behavioral signals. */
export function buildDeepForensicAnalysis(ctx: DossierAnalysisInput): ForensicAnalysis {
  const byDim = mergeSignals(ctx);
  const constructs: PsychConstruct[] = ALL_DIMENSIONS.map((dimension, i) => {
    const dimSignals = byDim.get(dimension) ?? [];
    return buildConstruct(dimension, dimSignals, ctx, i);
  });

  const frameworkNotes = buildFrameworkNotes(ctx);
  const synthesis = buildSynthesis(constructs, ctx);

  return {
    status: ctx.published ? "published" : "draft",
    summary: buildSummary(constructs, ctx),
    synthesis,
    constructs,
    frameworkNotes,
    alternativeExplanations: buildAlternatives(ctx),
    whatWeCannotKnow: buildUnknowns(ctx),
    modelVersion: ctx.modelVersion ?? DEEP_ANALYSIS_MODEL_VERSION,
    reviewedByHuman: ctx.published ?? false,
    updatedAt: new Date().toISOString(),
  };
}

export function analysisDepthScore(analysis: ForensicAnalysis): number {
  const dimCoverage = new Set(analysis.constructs.map((c) => c.dimension)).size;
  const evidenceDepth = analysis.constructs.reduce((s, c) => s + c.evidence.length, 0);
  const hasSynthesis = analysis.synthesis ? 1 : 0;
  const hasFramework = analysis.frameworkNotes?.length ? 1 : 0;
  return dimCoverage * 2 + evidenceDepth + hasSynthesis * 4 + hasFramework * 3;
}

/** Add synthesis and framework notes to hand-authored analyses that lack them. */
export function augmentForensicAnalysis(
  ctx: DossierAnalysisInput,
  analysis: ForensicAnalysis,
): ForensicAnalysis {
  if (analysis.synthesis && analysis.frameworkNotes?.length) return analysis;
  const constructs = analysis.constructs;
  return {
    ...analysis,
    synthesis: analysis.synthesis ?? buildSynthesis(constructs, ctx),
    frameworkNotes: analysis.frameworkNotes ?? buildFrameworkNotes(ctx),
  };
}
