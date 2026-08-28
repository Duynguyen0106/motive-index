/**
 * Generates substantive dossier context from case metadata — used by deepContentBuilder
 * to replace shallow template paragraphs across the world/multilingual catalog.
 */
import type { CrimeCategory, TimelineEvent } from "@/lib/types";
import { CRIME_CATEGORY_LABELS } from "@/lib/types";

export type CaseContextInput = {
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

export type ParsedCaseContext = CaseContextInput & {
  sentences: string[];
  categoryLabel: string;
  primaryCategory: CrimeCategory;
  spanYears: number;
  isUnsolved: boolean;
  isHistorical: boolean;
  isSerial: boolean;
  isMass: boolean;
  isIdeological: boolean;
  isHealthcare: boolean;
  isDomestic: boolean;
  offenderUnknown: boolean;
};

export function parseCaseContext(d: CaseContextInput): ParsedCaseContext {
  const sentences = d.overview
    .replace(/«/g, '"')
    .replace(/»/g, '"')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);

  const primaryCategory = d.crimeCategories[0] ?? "other";

  return {
    ...d,
    sentences,
    categoryLabel: d.crimeCategories.map((c) => CRIME_CATEGORY_LABELS[c]).join(", "),
    primaryCategory,
    spanYears: (d.yearEnd ?? d.yearStart) - d.yearStart,
    isUnsolved: d.status === "unsolved",
    isHistorical: d.status === "historical",
    isSerial: d.crimeCategories.includes("serial_murder"),
    isMass: d.crimeCategories.includes("mass_violence"),
    isIdeological: d.crimeCategories.includes("terrorism_ideological"),
    isHealthcare: d.crimeCategories.includes("healthcare_murder"),
    isDomestic: d.crimeCategories.includes("domestic_homicide"),
    offenderUnknown: d.offenderName === "Unknown" || d.offenderName.toLowerCase() === "unknown",
  };
}

function eraInstitutionNote(ctx: ParsedCaseContext): string {
  if (ctx.era.includes("1880") || ctx.yearStart < 1900) {
    return "Victorian policing relied on beat patrols and rudimentary forensic science; serial patterns were rarely recognized as linked series.";
  }
  if (ctx.yearStart < 1960) {
    return "Mid-century investigations lacked computerized databases, DNA, or cross-jurisdictional data sharing — linkage often depended on press attention.";
  }
  if (ctx.yearStart < 1990) {
    return "Cold-war through late-century policing saw improving forensics but persistent gaps in coordinating across agencies and protecting marginalized victims.";
  }
  if (ctx.yearStart < 2010) {
    return "DNA profiling, behavioral analysis units, and early digital evidence matured in this period, yet institutional blind spots toward vulnerable populations remained common.";
  }
  return "Contemporary investigations leverage genetic genealogy, digital footprints, and international cooperation — but still struggle with bias, backlog, and media distortion.";
}

export function buildExpandedOverview(ctx: ParsedCaseContext): string {
  const [s0, s1, s2] = ctx.sentences;
  const statusClause = ctx.isUnsolved
    ? "The matter remains formally unsolved; analysis targets documented behavioral evidence rather than a named offender's clinical profile."
    : ctx.offenderUnknown
      ? "Offender identity or complete attribution remains contested in public record."
      : `Public proceedings in ${ctx.jurisdiction} name ${ctx.offenderName} as the principal subject.`;

  const forensicFrame = ctx.isSerial
    ? "Forensic interest centers on series linkage, victim selection, cooling-off intervals, and what MO versus signature elements can be inferred without graphic reconstruction."
    : ctx.isMass
      ? "Researchers examine planning horizon, grievance narrative, target selection, and whether ideological or personal motives best fit pre-offense behavior."
      : ctx.isHealthcare
        ? "Professional trust exploitation and institutional failure to audit mortality patterns are central teaching themes."
        : "Behavioral patterning, institutional response, and inferential limits anchor the dossier.";

  return [
    s0 ?? ctx.overview,
    s1 ?? `${ctx.name} unfolded in ${ctx.location} during the ${ctx.era}. ${statusClause}`,
    s2 ?? forensicFrame,
    `This dossier synthesizes ${ctx.jurisdiction} court summaries, inquiry reports, and established case literature for forensic psychology study — not sensational entertainment.`,
  ]
    .filter(Boolean)
    .join(" ");
}

export function buildOriginsParagraphs(ctx: ParsedCaseContext): string[] {
  const [s0] = ctx.sentences;
  return [
    `${ctx.location} in the ${ctx.era} provided the institutional backdrop for ${ctx.name}. ${s0 ?? ctx.subtitle} Before the first attributed offense, ${ctx.jurisdiction} media and policing operated under constraints that would later shape how the case was documented and remembered.`,
    eraInstitutionNote(ctx),
    ctx.isSerial
      ? `Serial ${ctx.categoryLabel.toLowerCase()} cases from this period often went unrecognized for years because victims were drawn from populations with limited political voice — sex workers, migrants, runaways, or institutionalized persons. Delayed linkage is itself a forensic variable: it affects evidence preservation, witness memory, and whether a behavioral series can be reconstructed.`
      : ctx.isMass
        ? `Mass-casualty events in the ${ctx.era} frequently triggered commission inquiries into planning failures, weapon access, and whether warning signs were visible in public-record behavior before the attack.`
        : `Cases involving ${ctx.categoryLabel.toLowerCase()} in ${ctx.jurisdiction} test how communities assign meaning to violence — through moral panic, reform movements, or procedural change.`,
    `Students should read Origins as social context, not as deterministic childhood causation for any named offender.`,
  ];
}

export function buildFormationParagraphs(ctx: ParsedCaseContext): string[] {
  const [, s1, s2] = ctx.sentences;
  if (ctx.offenderUnknown) {
    return [
      `Because offender identity remains unknown or disputed, Formation focuses on the behavioral persona evident in crime-scene and communicative evidence rather than biographical narrative.`,
      s1 ?? `Public record describes approach patterns, victim demographics, and post-offense conduct consistent with ${ctx.categoryLabel.toLowerCase()} across the attributed series.`,
      `Retrospective profiling after identification — when it occurs — often reconstructs a 'double life' arc; that narrative must be treated skeptically when sources are post-arrest.`,
    ];
  }
  return [
    ctx.offenderBackground ??
      `${ctx.offenderName} appears in ${ctx.jurisdiction} archives as a figure who maintained localized credibility — employment, family ties, or community roles — before investigative attention converged.`,
    s1 ??
      `Biographical reporting describes a gap between public presentation and concealed offense behavior. ${s2 ?? "Whether early warning signs were visible to contemporaries, versus invented after the fact, is a core epistemic problem in forensic biography."}`,
    ctx.isHealthcare
      ? `Professional licensing and hospital hierarchies can shield trusted practitioners from scrutiny; colleagues' reluctance to challenge authority is a recurring institutional theme.`
      : ctx.isDomestic
        ? `Domestic and familial settings complicate formation narratives: abuse may be normalized within the household long before lethal violence enters public record.`
        : `Formation inferences rely heavily on post-offense interviews and third-party accounts — sources vulnerable to hindsight bias and media myth-making.`,
    `Psychologically, this chapter asks what observable pre-offense behaviors (substance use, grievance talk, boundary violations) appear in sourced material — not what we wish had been noticed.`,
  ];
}

export function buildEscalationParagraphs(ctx: ParsedCaseContext): string[] {
  const [s0, s1, s2] = ctx.sentences;
  const span = ctx.yearEnd ?? ctx.yearStart;
  return [
    s0 ?? `The documented offense period for ${ctx.name} begins around ${ctx.yearStart} in ${ctx.location}.`,
    s1 ??
      (ctx.spanYears > 5
        ? `Over ${ctx.spanYears} years (${ctx.yearStart}–${span}), incidents accumulated before investigators or journalists linked them as a series. Long spans raise questions about cooling-off intervals, geographic mobility, and adaptive learning.`
        : `Between ${ctx.yearStart} and ${span}, authorities documented ${ctx.categoryLabel.toLowerCase()} with accelerating public attention.`),
    s2 ??
      (ctx.isUnsolved
        ? `The case remains open. Escalation analysis therefore describes attributed acts and communicative behavior — not a convicted offender's verified biography.`
        : `Identification of ${ctx.offenderName} followed investigative milestones detailed in the Investigation chapter; until that point, escalation often appeared as unrelated tragedies.`),
    ctx.isIdeological
      ? `Ideological cases may show rhetorical escalation in manifestos or public statements parallel to behavioral escalation — treat both as hypotheses requiring source linkage.`
      : `Victim selection patterns during escalation — age, sex, vulnerability, setting — are among the strongest public-record signals for motive hypotheses.`,
  ];
}

export function buildMethodParagraphs(ctx: ParsedCaseContext): string[] {
  const [, s1] = ctx.sentences;
  return [
    `Modus operandi (MO) describes practical methods: approach, control, disposal, and risk management. Signature describes psychologically driven behaviors not required to complete the crime — staging, trophy-taking, communicative taunts.`,
    s1 ??
      `${ctx.jurisdiction} sources describe ${ctx.categoryLabel.toLowerCase()} with recurring MO elements across incidents rather than isolated chaos. Graphic operational detail is omitted per archive policy; the forensic focus is pattern stability and adaptation.`,
    ctx.isSerial
      ? `Serial cases often show MO refinement over time — shorter approaches, improved concealment, or geographic expansion — while signature elements (humiliation, control displays, communicative acts) may remain stable.`
      : ctx.isMass
        ? `Mass-violence MO typically includes target reconnaissance, material preparation, and exit or suicide planning; signature may appear in manifesto language or symbolic target choice.`
        : `Distinguish one-off situational violence from patterned behavior using consistency across settings and victims.`,
    `Post-offense behavior — flight, return to daily routine, media engagement, or confession — belongs in MO analysis when documented.`,
  ];
}

export function buildMotivationParagraphs(ctx: ParsedCaseContext): string[] {
  const [, , s2] = ctx.sentences;
  const frames: string[] = [];
  if (ctx.isIdeological) frames.push("ideological encapsulation and moral entitlement");
  if (ctx.isSerial) frames.push("compulsive sexualized dominance", "instrumental thrill-seeking");
  frames.push("situational rupture", "financial or status gain", "revenge against symbolic targets");

  return [
    `Motivation for ${ctx.name} is not adjudicated here unless a court explicitly found it. Competing public frames include ${frames.slice(0, 4).join(", ")}.`,
    s2 ??
      `Trial commentary and press narratives often simplify motive into a single story. Forensic psychology instead scores observable goal-directed behavior: victim choice, preparation level, and post-offense conduct.`,
    `Late-stage statements — interviews, letters, courtroom allocutions — may serve impression management. Weight pre-offense actions more heavily than post-arrest rhetoric.`,
    ctx.offenderUnknown
      ? `For unidentified offenders, motive inference relies on victimology and communicative content attributed to the series persona.`
      : `Any diagnosis or motive label applied to ${ctx.offenderName} in popular media should be cross-checked against contemporaneous clinical evaluations when they exist.`,
  ];
}

export function buildInvestigationParagraphs(ctx: ParsedCaseContext): string[] {
  const [, , s2] = ctx.sentences;
  return [
    `Investigators in ${ctx.jurisdiction} assembled the case through witness interviews, forensic comparison, media appeals, and — where applicable — interstate or international coordination. ${eraInstitutionNote(ctx)}`,
    s2 ?? `Detection lag, tunnel vision on early suspects, and sensational press coverage frequently distorted the investigative picture in ${ctx.name}.`,
    ctx.isUnsolved
      ? `Open-case investigations face ongoing challenges: degraded evidence, witness mortality, and the distorting effect of amateur sleuths and false confessions. This dossier reflects sourced material to date, not live investigative theory.`
      : `Breakthroughs in ${ctx.name} often combined mundane police work (traffic stop, tip line, forensic match) with institutional persistence rather than profiler theatrics.`,
    `Institutional failures — ignored complaints, marginalized victims, evidence mishandling — are documented in many parallel cases and should be weighed when ${ctx.jurisdiction} sources allege them here.`,
  ];
}

export function buildAftermathParagraphs(ctx: ParsedCaseContext): string[] {
  const [s0, , s2] = ctx.sentences;
  return [
    s2 ?? s0 ?? `Legal and social aftermath for ${ctx.name} reshaped public discourse in ${ctx.jurisdiction}.`,
    ctx.isUnsolved
      ? `Unsolved legacy includes continued victim advocacy, revised investigative techniques applied cold, and cautionary lessons about evidence preservation. Speculative identification must be labeled hypothesis.`
      : ctx.isHistorical
        ? `Historical cases like ${ctx.name} are reconstructed through archives with gaps; sentencing and moral panics of the period may not map to modern standards.`
        : `Trials, sentencing, appeals, and parliamentary or commission inquiries (where they occurred) are summarized in Legal outcome; this chapter addresses cultural memory and reform pressure.`,
    `For researchers, ${ctx.name} tests how ${ctx.categoryLabel.toLowerCase()} cases expose limits of behavioral inference, media ethics, and victim dignity in public storytelling.`,
    `Victim impact and memorial contexts are acknowledged but not exploited for spectacle; see References for inquiry documents centering harm.`,
  ];
}

export function buildDeepTimeline(
  slug: string,
  ctx: ParsedCaseContext,
  narrativeParagraphs: Record<string, string[]>,
): TimelineEvent[] {
  const end = ctx.yearEnd ?? ctx.yearStart;
  const q1 = ctx.yearStart + Math.floor(ctx.spanYears * 0.25);
  const mid = ctx.yearStart + Math.floor(ctx.spanYears * 0.5);
  const q3 = ctx.yearStart + Math.floor(ctx.spanYears * 0.75);

  const events: TimelineEvent[] = [
    {
      id: `${slug}-t-ctx`,
      date: String(ctx.yearStart - 1),
      label: "Institutional & social context",
      detail: `${ctx.name} (${ctx.location}): ${ctx.subtitle}. Era: ${ctx.era}.`,
      behavioralNote: eraInstitutionNote(ctx),
    },
    {
      id: `${slug}-t-onset`,
      date: String(ctx.yearStart),
      label: "Attributed offense period begins",
      detail: narrativeParagraphs.escalation?.[0] ?? ctx.sentences[0] ?? ctx.overview.slice(0, 280),
    },
  ];

  if (ctx.spanYears >= 2) {
    events.push({
      id: `${slug}-t-pattern`,
      date: String(q1),
      label: "Early incidents / diffuse recognition",
      detail:
        narrativeParagraphs.escalation?.[1] ??
        `Initial incidents in ${ctx.jurisdiction} were not yet linked as a unified series.`,
      behavioralNote: "Linkage delay affects reconstructable MO stability.",
    });
  }

  events.push({
    id: `${slug}-t-escalate`,
    date: String(mid),
    label: ctx.isSerial ? "Series linkage / escalation" : "Critical incident phase",
    detail:
      narrativeParagraphs.method?.[0] ??
      `Investigators and press began connecting ${ctx.categoryLabel.toLowerCase()} incidents.`,
    behavioralNote: ctx.isSerial ? "Escalation may include geographic or MO adaptation." : undefined,
  });

  if (ctx.spanYears >= 4) {
    events.push({
      id: `${slug}-t-pressure`,
      date: String(q3),
      label: "Investigative pressure intensifies",
      detail:
        narrativeParagraphs.investigation?.[0] ??
        `Public and institutional pressure mounted in ${ctx.jurisdiction}.`,
    });
  }

  events.push({
    id: `${slug}-t-turn`,
    date: String(end),
    label: ctx.isUnsolved ? "Case remains open" : "Identification / major breakthrough",
    detail:
      narrativeParagraphs.investigation?.[1] ??
      (ctx.isUnsolved
        ? "No definitive resolution in public record; leads may remain active."
        : `Resolution phase: identification, arrest, or death of subject per ${ctx.jurisdiction} records.`),
    behavioralNote: ctx.isUnsolved ? "Analyze communicative offender persona where applicable." : undefined,
  });

  events.push({
    id: `${slug}-t-after`,
    date: `${end}+`,
    label: ctx.isUnsolved ? "Ongoing legacy" : "Trials, inquiries, reform",
    detail: narrativeParagraphs.aftermath?.[0] ?? `Aftermath and legacy for ${ctx.name} in ${ctx.jurisdiction}.`,
    behavioralNote: "Legal outcomes do not equal psychological 'closure' for communities.",
  });

  return events;
}

export function victimDemographicsNote(ctx: ParsedCaseContext): string {
  if (ctx.isHealthcare) {
    return "Elderly or dependent patients in professional care settings; trust exploitation central to case.";
  }
  if (ctx.isDomestic) {
    return "Family members or intimate partners; coercive control context documented in inquiry material.";
  }
  if (ctx.isSerial) {
    return "Multiple victims across offense series; demographics vary by case — see jurisdiction inquiry for victim-centered accounts.";
  }
  if (ctx.isMass) {
    return "Groups targeted in public or semi-public settings; mass-casualty inquiry reports document victim impact.";
  }
  return "Victims documented in public record; consult primary sources for names and demographics where published.";
}

export function buildMotivationalFactors(
  ctx: ParsedCaseContext,
  motiveParagraphs: string[],
): { label: string; detail: string }[] {
  const factors = [
    {
      label: "Primary motive frame (hypothesis)",
      detail: motiveParagraphs[0] ?? `Motivation inferred from ${ctx.jurisdiction} trial and press narratives.`,
    },
    {
      label: "Instrumental vs expressive tension",
      detail:
        motiveParagraphs[1] ??
        "Whether offenses served practical goals (gain, concealment) or psychological needs (dominance, humiliation) remains debated.",
    },
    {
      label: "Situational stressor context",
      detail: `Loss, status threat, or institutional grievance in ${ctx.era} ${ctx.location} may have lowered inhibition — correlation does not establish causation.`,
    },
  ];
  if (ctx.isIdeological) {
    factors.push({
      label: "Ideological encapsulation (hypothesis)",
      detail:
        "Belief systems may filter disconfirming evidence and frame violence as morally mandated — distinguish sincere belief from manipulative rhetoric.",
    });
  }
  return factors;
}
