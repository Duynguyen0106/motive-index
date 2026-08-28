import type {
  CaseDocument,
  CaseReference,
  ContributionSubmission,
  CrimeCase,
  CrimeCategory,
  CountryCode,
  DiagnosisNote,
  ExpertCommentary,
  ForensicAnalysis,
  GlossaryTerm,
  MotivationalFactor,
  PersonRecord,
  PsychologicalFactor,
  TheoreticalFramework,
  TheoryOverview,
  BehavioralProfile,
  LegalOutcome,
} from "@/lib/types";
import { CASE_REFERENCE_OVERRIDES } from "@/data/caseReferenceCatalog";
import { getCaseNarrative } from "@/data/narratives";
import { worldEnrichments } from "@/data/worldCases";
import { multilingualEnrichments } from "@/data/multilingualCases";
import { augmentForensicAnalysis } from "@/lib/deepAnalysis";
import { attachCaseImages } from "@/lib/caseImages";
import { inferCountry } from "@/lib/country";
import { getCatalogCoords } from "@/lib/geo";

export interface CaseEnrichment {
  aliases?: string[];
  caseNumber?: string;
  location: string;
  country?: CountryCode;
  yearStart: number;
  yearEnd?: number;
  crimeCategories: CrimeCategory[];
  psychologicalFactors: PsychologicalFactor[];
  theoreticalFrameworks: TheoreticalFramework[];
  diagnoses: DiagnosisNote[];
  offenders: PersonRecord[];
  victims: PersonRecord[];
  legalOutcome: LegalOutcome;
  behavioralProfile: BehavioralProfile;
  motivationalFactors: MotivationalFactor[];
  relatedCaseSlugs: string[];
  contentLevel?: "standard" | "restricted";
  documentIds: string[];
  references: CaseReference[];
  expertCommentary?: ExpertCommentary[];
  caseOfWeek?: boolean;
  nameOriginal?: string;
  primarySourceLanguage?: string;
  primarySourceLanguageLabel?: string;
  translationNote?: string;
}

export const enrichments: Record<string, CaseEnrichment> = {
  "ted-bundy": {
    aliases: ["Theodore Robert Bundy"],
    location: "United States (multi-state)",
    country: "US",
    yearStart: 1974,
    yearEnd: 1989,
    crimeCategories: ["serial_murder"],
    psychologicalFactors: [
      "impression_management",
      "psychopathy_traits",
      "antisocial_traits",
      "compartmentalization",
    ],
    theoreticalFrameworks: ["personality", "cognitive_behavioral", "situational"],
    diagnoses: [
      {
        label: "Psychopathy (trait hypotheses)",
        status: "hypothesized",
        note: "Often discussed in literature; not a substitute for contemporaneous clinical consensus.",
      },
    ],
    offenders: [
      {
        id: "off-bundy",
        name: "Ted Bundy",
        role: "offender",
        known: true,
        sex: "male",
        ageAtOffense: "20s–30s",
        background:
          "Born Theodore Robert Cowell in Vermont (1946); raised believing his mother was his sister until adolescence. Law student, crisis-line volunteer, and campaign worker who presented as upwardly mobile and conventionally respectable.",
      },
    ],
    victims: [
      {
        id: "vic-bundy-summary",
        name: "Multiple victims (public record)",
        role: "victim",
        known: true,
        demographicsNote:
          "Victim identities are documented in public records; this archive summarizes only at aggregate level out of respect.",
      },
    ],
    legalOutcome: {
      summary: "Convicted; sentenced to death; executed in 1989.",
      trial: "Multiple trials; courtroom self-representation episodes.",
      sentencing: "Death sentences in Florida.",
      appeals: "Appeals exhausted prior to execution.",
    },
    behavioralProfile: {
      modusOperandi:
        "Deceptive approach methods, mobility across jurisdictions, opportunistic and planned elements.",
      signature: "Control of approach context; impression management.",
      escalation: "Continued offending after custody escapes.",
      organizationLevel: "organized",
    },
    motivationalFactors: [
      { label: "Power / control", detail: "Instrumental predation with dominance themes in public analyses." },
      { label: "Sexual violence (inferred)", detail: "Widely inferred from case facts; graphic detail omitted here." },
    ],
    relatedCaseSlugs: [
      "dennis-rader-btk",
      "zodiac-killer",
      "john-wayne-gacy",
      "richard-ramirez",
      "edmund-kemper",
      "golden-state-killer",
    ],
    documentIds: ["doc-bundy-trial-summary", "doc-fbi-organized-notes"],
    references: CASE_REFERENCE_OVERRIDES["ted-bundy"] ?? [],
    expertCommentary: [
      {
        id: "ec-bundy-1",
        author: "Motive Index Editorial",
        role: "editor",
        title: "Impression management as a research lens",
        body: "Students should separate media mythology of 'charm' from observable public-record behavior: approach staging, mobility, and courtroom performance.",
        reviewed: true,
        publishedAt: "2026-08-01T12:00:00.000Z",
      },
    ],
    caseOfWeek: true,
  },
  "dennis-rader-btk": {
    aliases: ["BTK", "Bind Torture Kill"],
    location: "Wichita, Kansas, United States",
    country: "US",
    yearStart: 1974,
    yearEnd: 2005,
    crimeCategories: ["serial_murder"],
    psychologicalFactors: [
      "power_control",
      "compartmentalization",
      "narcissism",
      "psychopathy_traits",
    ],
    theoreticalFrameworks: ["personality", "psychodynamic", "cognitive_behavioral"],
    diagnoses: [
      {
        label: "Personality pathology hypotheses",
        status: "hypothesized",
        note: "Public commentary often invokes personality disorder constructs; treat as contested teaching examples.",
      },
    ],
    offenders: [
      {
        id: "off-rader",
        name: "Dennis Rader",
        role: "offender",
        known: true,
        sex: "male",
        background:
          "Kansas native (1945); married with two children; served as church council president and municipal compliance officer while maintaining the BTK persona in private writings.",
      },
    ],
    victims: [
      {
        id: "vic-rader-summary",
        name: "Multiple victims (public record)",
        role: "victim",
        known: true,
        demographicsNote: "Aggregate reference only; avoid gratuitous victim detail.",
      },
    ],
    legalOutcome: {
      summary: "Pleaded guilty; multiple life sentences.",
      trial: "Guilty plea; detailed allocution in public record.",
      sentencing: "Consecutive life terms.",
    },
    behavioralProfile: {
      modusOperandi: "Home intrusion and control-focused offenses with long dormant intervals.",
      signature: "Self-branding communications (BTK).",
      escalation: "Return to communication decades later enabling identification.",
      organizationLevel: "organized",
    },
    motivationalFactors: [
      { label: "Power / control", detail: "Dominance and authorship of fear via letters." },
      { label: "Recognition", detail: "Compulsion to communicate identity and narrative." },
    ],
    relatedCaseSlugs: ["ted-bundy", "zodiac-killer"],
    documentIds: ["doc-btk-letters-summary", "doc-rader-plea"],
    references: CASE_REFERENCE_OVERRIDES["dennis-rader-btk"] ?? [],
    expertCommentary: [
      {
        id: "ec-rader-1",
        author: "Teaching note",
        role: "expert",
        title: "Double life as compartmentalization case study",
        body: "Use this dossier to discuss how conventional social roles can coexist with covert offending—and why communication needs can defeat operational security.",
        reviewed: true,
        publishedAt: "2026-08-01T12:00:00.000Z",
      },
    ],
  },
  "ted-kaczynski": {
    aliases: ["Unabomber"],
    location: "United States",
    country: "US",
    yearStart: 1978,
    yearEnd: 1996,
    crimeCategories: ["terrorism_ideological"],
    psychologicalFactors: [
      "ideological_extremism",
      "paranoia",
      "antisocial_traits",
    ],
    theoreticalFrameworks: ["ideological", "psychodynamic", "biological", "situational"],
    diagnoses: [
      {
        label: "Schizophrenia-spectrum hypotheses vs. political extremism",
        status: "contested",
        note: "Historical evaluations conflict; teach competing frames explicitly.",
      },
    ],
    offenders: [
      {
        id: "off-kaczynski",
        name: "Ted Kaczynski",
        role: "offender",
        known: true,
        sex: "male",
        background:
          "Harvard-educated mathematician; former UC Berkeley assistant professor who abandoned academia for isolated cabin life in Montana from 1971.",
      },
    ],
    victims: [
      {
        id: "vic-kaczynski-summary",
        name: "Multiple injured and killed (public record)",
        role: "victim",
        known: true,
        demographicsNote: "Targets thematically linked to anti-technology ideology in public narrative.",
      },
    ],
    legalOutcome: {
      summary: "Guilty plea; life imprisonment without parole.",
      trial: "Competency and mental-state disputes preceded plea resolution.",
      sentencing: "Multiple life sentences.",
    },
    behavioralProfile: {
      modusOperandi: "Long-duration bombing campaign framed by manifesto publication strategy.",
      signature: "Ideological communication via violence and text.",
      organizationLevel: "organized",
    },
    motivationalFactors: [
      { label: "Ideology", detail: "Anti-technology thesis as organizing narrative." },
      { label: "Recognition of ideas", detail: "Manifesto publication as strategic goal." },
    ],
    relatedCaseSlugs: ["charles-manson"],
    documentIds: ["doc-unabomber-manifesto", "doc-kaczynski-plea"],
    references: CASE_REFERENCE_OVERRIDES["ted-kaczynski"] ?? [],
  },
  "aileen-wuornos": {
    location: "Florida, United States",
    country: "US",
    yearStart: 1989,
    yearEnd: 1990,
    crimeCategories: ["serial_murder", "homicide"],
    psychologicalFactors: ["childhood_trauma", "antisocial_traits", "empathy_deficit"],
    theoreticalFrameworks: ["attachment", "situational", "personality", "social_learning"],
    diagnoses: [
      {
        label: "Borderline / antisocial hypotheses (media & clinical commentary)",
        status: "contested",
        note: "Public narratives are polarized; keep trauma context separate from exculpation.",
      },
    ],
    offenders: [
      {
        id: "off-wuornos",
        name: "Aileen Wuornos",
        role: "offender",
        known: true,
        sex: "female",
        background:
          "Severe childhood abuse and abandonment documented in court records; years of homelessness and survival sex work along Florida highways before the 1989–1990 series.",
      },
    ],
    victims: [
      {
        id: "vic-wuornos-summary",
        name: "Multiple male victims (public record)",
        role: "victim",
        known: true,
        relationshipToOffender: "Roadside / transactional encounter contexts alleged in public accounts.",
      },
    ],
    legalOutcome: {
      summary: "Convicted on multiple counts; executed in 2002.",
      trial: "Highly publicized trials with shifting statements.",
      sentencing: "Death sentences.",
      appeals: "Appeals concluded prior to execution.",
    },
    behavioralProfile: {
      modusOperandi: "Repeated roadside encounter pattern ending in fatal violence.",
      escalation: "Series over a relatively short window.",
      organizationLevel: "mixed",
    },
    motivationalFactors: [
      { label: "Contested self-defense", detail: "Defendant claims vs. prosecution instrumental framing." },
      { label: "Survival / trauma context", detail: "Contextual factor—not a moral excuse." },
    ],
    relatedCaseSlugs: [],
    documentIds: ["doc-wuornos-trial-coverage"],
    references: CASE_REFERENCE_OVERRIDES["aileen-wuornos"] ?? [],
    contentLevel: "standard",
  },
  "zodiac-killer": {
    aliases: ["Zodiac"],
    location: "Northern California, United States",
    country: "US",
    yearStart: 1968,
    yearEnd: 1974,
    crimeCategories: ["serial_murder"],
    psychologicalFactors: ["power_control", "narcissism", "paranoia"],
    theoreticalFrameworks: ["personality", "cognitive_behavioral", "situational"],
    diagnoses: [
      {
        label: "Not applicable (unidentified)",
        status: "not_applicable",
        note: "No confirmed subject; analyze communication persona only.",
      },
    ],
    offenders: [
      {
        id: "off-zodiac",
        name: "Unidentified offender(s)",
        role: "unknown_offender",
        known: false,
        sex: "unknown",
      },
    ],
    victims: [
      {
        id: "vic-zodiac-summary",
        name: "Confirmed and suspected victims (public record)",
        role: "victim",
        known: true,
        demographicsNote: "Often couples in outdoor settings in attributed cluster.",
      },
    ],
    legalOutcome: {
      summary: "Unsolved; no conviction of a confirmed Zodiac offender.",
    },
    behavioralProfile: {
      modusOperandi: "Attacks attributed by investigation plus letter/cipher campaign.",
      signature: "Taunting communications and ciphers.",
      organizationLevel: "mixed",
    },
    motivationalFactors: [
      { label: "Terror theater", detail: "Public fear and police frustration as valued outcomes." },
      { label: "Intellectual dominance", detail: "Puzzle/cipher engagement with audience." },
    ],
    relatedCaseSlugs: ["dennis-rader-btk", "ted-bundy"],
    documentIds: ["doc-zodiac-letters"],
    references: CASE_REFERENCE_OVERRIDES["zodiac-killer"] ?? [],
  },
  "charles-manson": {
    aliases: ["Manson Family leader"],
    location: "California, United States",
    country: "US",
    yearStart: 1969,
    yearEnd: 1971,
    crimeCategories: ["homicide", "mass_violence"],
    psychologicalFactors: [
      "ideological_extremism",
      "narcissism",
      "impression_management",
    ],
    theoreticalFrameworks: ["group_influence", "psychodynamic", "social_learning", "ideological"],
    diagnoses: [
      {
        label: "Personality / influence dynamics (teaching frame)",
        status: "hypothesized",
        note: "Prioritize group process over single-label diagnosis.",
      },
    ],
    offenders: [
      {
        id: "off-manson",
        name: "Charles Manson",
        role: "offender",
        known: true,
        sex: "male",
        background:
          "Charismatic ex-convict who assembled the 'Manson Family' commune at Spahn Ranch; blended Beatles apocalyptic interpretation with total control over isolated followers.",
      },
    ],
    victims: [
      {
        id: "vic-manson-summary",
        name: "Multiple victims (Tate–LaBianca and related, public record)",
        role: "victim",
        known: true,
        demographicsNote: "Names are public; graphic crime-scene detail omitted.",
      },
    ],
    legalOutcome: {
      summary: "Convicted; death sentences later commuted to life under California law changes.",
      trial: "Highly performative courtroom events.",
      sentencing: "Initially death; later life imprisonment.",
      appeals: "Long incarceration until death in custody.",
    },
    behavioralProfile: {
      modusOperandi: "Directive influence over followers who enacted violence.",
      signature: "Apocalyptic shared narrative framing.",
      organizationLevel: "organized",
    },
    motivationalFactors: [
      { label: "Group control", detail: "Authority via dependency and interpretive monopoly." },
      { label: "Apocalyptic ideology", detail: "Helter Skelter narrative as meaning frame." },
    ],
    relatedCaseSlugs: ["ted-kaczynski"],
    documentIds: ["doc-manson-trial-summary"],
    references: CASE_REFERENCE_OVERRIDES["charles-manson"] ?? [],
  },
  "harold-shipman": {
    aliases: ["Dr. Death (press epithet — avoid sensational use)"],
    location: "England, United Kingdom",
    country: "GB",
    yearStart: 1975,
    yearEnd: 1998,
    crimeCategories: ["healthcare_murder", "homicide"],
    psychologicalFactors: ["empathy_deficit", "compartmentalization", "power_control"],
    theoreticalFrameworks: ["personality", "situational", "biological"],
    diagnoses: [
      {
        label: "Empathy deficit / personality hypotheses",
        status: "hypothesized",
        note: "System failure is as central as individual pathology for teaching.",
      },
    ],
    offenders: [
      {
        id: "off-shipman",
        name: "Harold Shipman",
        role: "offender",
        known: true,
        sex: "male",
        background:
          "Qualified GP in Hyde, Greater Manchester; mother's cancer death during his medical training frequently cited in biographical accounts; prior pethidine fraud conviction.",
      },
    ],
    victims: [
      {
        id: "vic-shipman-summary",
        name: "Primarily elderly patients (public inquiry findings)",
        role: "victim",
        known: true,
        relationshipToOffender: "Doctor–patient trust relationship.",
      },
    ],
    legalOutcome: {
      summary: "Convicted of 15 murders; inquiry suggested many more; died in custody.",
      trial: "Conviction on 15 counts.",
      sentencing: "Life imprisonment.",
    },
    behavioralProfile: {
      modusOperandi: "Lethality camouflaged inside routine care visits.",
      signature: "Trust-role exploitation.",
      escalation: "Forged will precipitated detection.",
      organizationLevel: "organized",
    },
    motivationalFactors: [
      { label: "Power over life/death (hypothesized)", detail: "Common scholarly speculation; remains inferential." },
      { label: "Concealment within profession", detail: "Opportunity structure of private clinical access." },
    ],
    relatedCaseSlugs: [],
    documentIds: ["doc-shipman-inquiry"],
    references: CASE_REFERENCE_OVERRIDES["harold-shipman"] ?? [],
  },
  "contemporary-draft-example": {
    location: "Example jurisdiction",
    country: "OTHER",
    yearStart: 2026,
    crimeCategories: ["other"],
    psychologicalFactors: [],
    theoreticalFrameworks: [],
    diagnoses: [],
    offenders: [
      {
        id: "off-draft",
        name: "Not verified",
        role: "offender",
        known: false,
      },
    ],
    victims: [],
    legalOutcome: {
      summary: "Draft stub only — not a verified legal outcome.",
    },
    behavioralProfile: {
      modusOperandi: "Awaiting extraction.",
      organizationLevel: "unknown",
    },
    motivationalFactors: [],
    relatedCaseSlugs: [],
    documentIds: [],
    references: [],
    contentLevel: "standard",
  },
  ...worldEnrichments,
  ...multilingualEnrichments,
};

export const documents: CaseDocument[] = [
  {
    id: "doc-bundy-trial-summary",
    caseSlug: "ted-bundy",
    title: "Florida trial proceedings — public summary pointers",
    type: "court_transcript",
    date: "1979",
    source: "Public court reporting",
    publicDomain: false,
    hosted: false,
    summary:
      "Pointers to public trial coverage useful for studying courtroom impression management.",
    psychRelevance: "Self-presentation and legal strategy as behavioral data.",
    contentWarning: "Discusses homicide proceedings; no graphic imagery.",
  },
  {
    id: "doc-fbi-organized-notes",
    caseSlug: "ted-bundy",
    title: "Organized offender typology — teaching abstract",
    type: "academic_study",
    source: "Behavioral analysis teaching literature (summary)",
    publicDomain: false,
    hosted: false,
    summary: "High-level typology notes for classroom comparison—not operational instruction.",
    psychRelevance: "Planning, mobility, and social skill constructs.",
    contentWarning: "Academic discussion of violent offending patterns.",
  },
  {
    id: "doc-btk-letters-summary",
    caseSlug: "dennis-rader-btk",
    title: "BTK communications — catalog summary",
    type: "letter",
    date: "1970s–2000s",
    source: "Contemporaneous press archives",
    publicDomain: false,
    hosted: false,
    summary: "Index of known public communications emphasizing narrative control themes.",
    psychRelevance: "Narcissistic supply, dominance, and detection risk.",
    contentWarning: "Taunting content regarding violence; excerpts minimized.",
  },
  {
    id: "doc-rader-plea",
    caseSlug: "dennis-rader-btk",
    title: "Plea and allocution — public record summary",
    type: "court_transcript",
    date: "2005",
    source: "Kansas courts / press pool",
    publicDomain: false,
    hosted: false,
    summary: "Structured summary of plea proceedings for behavioral chronology.",
    psychRelevance: "Admission style and self-narrative.",
    contentWarning: "Descriptions of offenses at summary level.",
  },
  {
    id: "doc-unabomber-manifesto",
    caseSlug: "ted-kaczynski",
    title: "Industrial Society and Its Future",
    type: "manifesto",
    date: "1995",
    source: "Publicly circulated manifesto text",
    publicDomain: false,
    hosted: false,
    url: "https://www.washingtonpost.com/wp-srv/national/longterm/unabomber/manifesto.text.htm",
    summary: "Link-out to public text used for ideology analysis; bomb-making detail out of scope.",
    psychRelevance: "Belief encapsulation, instrumental violence justification.",
    contentWarning: "Extremist ideology; educational framing required.",
  },
  {
    id: "doc-kaczynski-plea",
    caseSlug: "ted-kaczynski",
    title: "Federal plea history summary",
    type: "court_transcript",
    date: "1998",
    source: "Federal case reporting",
    publicDomain: false,
    hosted: false,
    summary: "Outcome summary for legal-status teaching module.",
    psychRelevance: "Competency debates vs. political framing.",
    contentWarning: "Violence campaign context.",
  },
  {
    id: "doc-wuornos-trial-coverage",
    caseSlug: "aileen-wuornos",
    title: "Florida trial coverage index",
    type: "newspaper",
    date: "1992",
    source: "Press archives",
    publicDomain: false,
    hosted: false,
    summary: "Media index illustrating contested motive narratives.",
    psychRelevance: "Self-defense vs. instrumental frames; statement instability.",
    contentWarning: "Homicide case; trauma themes.",
  },
  {
    id: "doc-zodiac-letters",
    caseSlug: "zodiac-killer",
    title: "Zodiac letters & ciphers — archive index",
    type: "letter",
    date: "1969+",
    source: "Newspaper archives",
    publicDomain: false,
    hosted: false,
    summary: "Catalog of public letters for communication analysis (authenticity debates noted).",
    psychRelevance: "Terror-as-communication; audience control.",
    contentWarning: "Taunting violent content; minimize reproduction.",
  },
  {
    id: "doc-manson-trial-summary",
    caseSlug: "charles-manson",
    title: "Manson trial — public proceedings summary",
    type: "court_transcript",
    date: "1970–1971",
    source: "California trial record summaries",
    publicDomain: false,
    hosted: false,
    summary: "Group influence and courtroom performance notes.",
    psychRelevance: "Charismatic control; shared delusion dynamics.",
    contentWarning: "Multiple homicide case; no crime-scene imagery.",
  },
  {
    id: "doc-shipman-inquiry",
    caseSlug: "harold-shipman",
    title: "Shipman Inquiry reports",
    type: "inquiry_report",
    date: "2002–2005",
    source: "UK public inquiry",
    publicDomain: true,
    hosted: false,
    summary: "Public inquiry volumes on detection failure and scale estimates.",
    psychRelevance: "Trust-role camouflage; system monitoring gaps.",
    contentWarning: "Medical murder; patient deaths discussed at pattern level.",
  },
];

export const glossary: GlossaryTerm[] = [
  {
    id: "g-mo",
    term: "Modus operandi (MO)",
    definition:
      "The practical method an offender uses to commit a crime—often adaptive and may change with learning or circumstance.",
    relatedCaseSlugs: ["ted-bundy", "harold-shipman"],
  },
  {
    id: "g-signature",
    term: "Signature",
    definition:
      "Behavioral elements that fulfill psychological needs and are not required to complete the crime (distinct from MO).",
    relatedCaseSlugs: ["dennis-rader-btk", "zodiac-killer"],
  },
  {
    id: "g-psychopathy",
    term: "Psychopathy (traits)",
    definition:
      "A personality construct associated with shallow affect, lack of empathy, manipulativeness, and antisocial behavior. Not identical to a single DSM diagnosis; treat checklist scores cautiously when public.",
    relatedCaseSlugs: ["ted-bundy"],
  },
  {
    id: "g-pcl",
    term: "PCL-R",
    definition:
      "Hare Psychopathy Checklist–Revised: a structured clinical rating tool. Publish scores only when publicly documented; never invent scores.",
  },
  {
    id: "g-attachment",
    term: "Attachment theory",
    definition:
      "Framework describing how early caregiver bonds shape later relationship patterns, threat response, and intimacy regulation—useful as context, not destiny.",
    relatedCaseSlugs: ["aileen-wuornos"],
  },
  {
    id: "g-cognitive-distortion",
    term: "Cognitive distortion",
    definition:
      "Biased thinking patterns (e.g., entitlement, minimization, victim blame) that can support harmful behavior.",
    relatedCaseSlugs: ["ted-kaczynski", "dennis-rader-btk"],
  },
  {
    id: "g-organized",
    term: "Organized / disorganized typology",
    definition:
      "Classic investigative teaching typology describing offense scene and offender planning characteristics. Heuristic, not a diagnosis.",
    relatedCaseSlugs: ["ted-bundy", "harold-shipman"],
  },
  {
    id: "g-group",
    term: "High-control group influence",
    definition:
      "Social processes—isolation, leader idealization, moral disengagement—that can enable delegated violence.",
    relatedCaseSlugs: ["charles-manson"],
  },
];

export const theories: TheoryOverview[] = [
  {
    id: "th-personality",
    slug: "personality-psychology",
    name: "Personality psychology & trait models",
    framework: "personality",
    summary:
      "Examines stable patterns such as callousness, narcissism, and impulsivity as probabilistic risk factors—not deterministic labels.",
    keyIdeas: [
      "Traits are dimensional, not binary",
      "Public behavior ≠ full personality assessment",
      "Comorbidity and context matter",
    ],
    relevance:
      "Useful for organizing observations about impression management, empathy signals, and long-term consistency.",
    relatedCaseSlugs: ["ted-bundy", "dennis-rader-btk", "harold-shipman"],
  },
  {
    id: "th-social-learning",
    slug: "social-learning",
    name: "Social learning theory",
    framework: "social_learning",
    summary:
      "Behavior is acquired and maintained through modeling, reinforcement, and cognitive expectations.",
    keyIdeas: [
      "Observation and imitation",
      "Reinforcement schedules",
      "Moral disengagement mechanisms",
    ],
    relevance: "Helps analyze follower compliance and learned coercive scripts.",
    relatedCaseSlugs: ["charles-manson", "aileen-wuornos"],
  },
  {
    id: "th-attachment",
    slug: "attachment-theory",
    name: "Attachment theory",
    framework: "attachment",
    summary:
      "Early relational patterns may shape threat sensitivity and intimacy—context for formulation, never a complete explanation.",
    keyIdeas: [
      "Secure vs insecure patterns",
      "Hyperactivation / deactivation of attachment systems",
      "Trauma as amplifier, not destiny",
    ],
    relevance: "Often discussed in cases with severe adversity histories.",
    relatedCaseSlugs: ["aileen-wuornos"],
  },
  {
    id: "th-ideological",
    slug: "ideological-radicalization",
    name: "Ideological radicalization frameworks",
    framework: "ideological",
    summary:
      "Maps how grievance, networks, and meaning-making can couple with instrumental violence.",
    keyIdeas: [
      "Belief encapsulation",
      "Identity fusion",
      "Propaganda / manifesto as strategy",
    ],
    relevance: "Central when violence is subordinated to a written worldview.",
    relatedCaseSlugs: ["ted-kaczynski", "charles-manson"],
  },
  {
    id: "th-situational",
    slug: "situational-opportunity",
    name: "Situational & opportunity theories",
    framework: "situational",
    summary:
      "Emphasizes access, guardianship, and environmental affordances that enable offending.",
    keyIdeas: [
      "Routine activity elements",
      "Trust-role access",
      "Detection gaps",
    ],
    relevance: "Critical in healthcare and professional-trust predation cases.",
    relatedCaseSlugs: ["harold-shipman", "ted-bundy"],
  },
  {
    id: "th-group",
    slug: "group-influence",
    name: "Group influence & obedience",
    framework: "group_influence",
    summary:
      "Explains how authority, conformity, and diffusion of responsibility reshape individual moral constraints.",
    keyIdeas: [
      "Charismatic authority",
      "Isolation from outside reality-testing",
      "Delegated violence",
    ],
    relevance: "Primary lens for cultic or cell-based offending.",
    relatedCaseSlugs: ["charles-manson"],
  },
];

export const seedContributions: ContributionSubmission[] = [
  {
    id: "sub-1",
    kind: "analysis",
    title: "Student note: communication compulsion in BTK letters",
    submitterName: "A. Rivera",
    submitterRole: "Graduate student — forensic psychology",
    summary:
      "Draft comparing recognition motives vs. operational security across three letter phases.",
    status: "in_review",
    createdAt: "2026-08-20T10:00:00.000Z",
  },
  {
    id: "sub-2",
    kind: "document",
    title: "Link submission: Shipman Inquiry volume index",
    submitterName: "Dr. H. Cole",
    submitterRole: "Academic",
    summary: "Open report index for trust-camouflage seminar module.",
    status: "accepted",
    createdAt: "2026-08-18T09:00:00.000Z",
  },
  {
    id: "sub-3",
    kind: "case",
    title: "Proposed historical case: Mary Ann Cotton (draft)",
    submitterName: "Seminar cohort B",
    submitterRole: "Undergraduate seminar",
    summary: "Metadata-only proposal pending source verification.",
    status: "pending",
    createdAt: "2026-08-25T15:30:00.000Z",
  },
];

function analysisContextFromCase(
  base: Pick<
    CrimeCase,
    | "slug"
    | "name"
    | "subtitle"
    | "overview"
    | "jurisdiction"
    | "location"
    | "era"
    | "yearStart"
    | "yearEnd"
    | "status"
    | "crimeCategories"
    | "offenders"
    | "psychologicalFactors"
    | "theoreticalFrameworks"
    | "primarySourceLanguageLabel"
    | "translationNote"
    | "signals"
    | "timeline"
    | "behavioralProfile"
    | "motivationalFactors"
  >,
) {
  return {
    slug: base.slug,
    name: base.name,
    subtitle: base.subtitle,
    overview: base.overview,
    jurisdiction: base.jurisdiction,
    location: base.location ?? base.jurisdiction,
    era: base.era,
    yearStart: base.yearStart,
    yearEnd: base.yearEnd,
    status: base.status,
    crimeCategories: base.crimeCategories,
    offenderName: base.offenders?.[0]?.name ?? "Unknown",
    signals: base.signals,
    timeline: base.timeline,
    behavioralProfile: base.behavioralProfile,
    motivationalFactors: base.motivationalFactors,
    psychologicalFactors: base.psychologicalFactors,
    theoreticalFrameworks: base.theoreticalFrameworks,
    primarySourceLanguageLabel: base.primarySourceLanguageLabel,
    translationNote: base.translationNote,
  };
}

function finalizeAnalysis(
  base: Parameters<typeof analysisContextFromCase>[0],
  analysis: ForensicAnalysis,
): ForensicAnalysis {
  return augmentForensicAnalysis(analysisContextFromCase(base), analysis);
}

function withCatalogCoords<T extends CrimeCase>(c: T): T {
  if (typeof c.lat === "number" && typeof c.lng === "number") return c;
  const coords = getCatalogCoords(c.slug);
  if (!coords) return c;
  return { ...c, lat: coords.lat, lng: coords.lng };
}

export function applyEnrichment(
  base: Omit<
    CrimeCase,
    | "aliases"
    | "caseNumber"
    | "location"
    | "country"
    | "yearStart"
    | "yearEnd"
    | "crimeCategories"
    | "psychologicalFactors"
    | "theoreticalFrameworks"
    | "diagnoses"
    | "offenders"
    | "victims"
    | "legalOutcome"
    | "behavioralProfile"
    | "motivationalFactors"
    | "relatedCaseSlugs"
    | "contentLevel"
    | "documentIds"
    | "references"
  > &
    Partial<CrimeCase>,
): CrimeCase {
  const e = enrichments[base.slug];
  if (!e) {
    const location = base.location ?? base.jurisdiction;
    return withCatalogCoords(attachCaseImages({
      ...base,
      location,
      country: base.country ?? inferCountry(base.jurisdiction, location),
      yearStart: base.yearStart ?? (Number(base.era) || 1900),
      crimeCategories: base.crimeCategories ?? ["other"],
      psychologicalFactors: base.psychologicalFactors ?? [],
      theoreticalFrameworks: base.theoreticalFrameworks ?? [],
      diagnoses: base.diagnoses ?? [],
      offenders: base.offenders ?? [],
      victims: base.victims ?? [],
      legalOutcome: base.legalOutcome ?? { summary: "See overview." },
      behavioralProfile: base.behavioralProfile ?? {
        modusOperandi: "See analysis.",
        organizationLevel: "unknown",
      },
      motivationalFactors: base.motivationalFactors ?? [],
      relatedCaseSlugs: base.relatedCaseSlugs ?? [],
      contentLevel: base.contentLevel ?? "standard",
      documentIds: base.documentIds ?? [],
      references: base.references ?? [],
      narrative: getCaseNarrative(base.slug),
      analysis: finalizeAnalysis(
        {
          ...base,
          location,
          yearStart: base.yearStart ?? (Number(base.era) || 1900),
          crimeCategories: base.crimeCategories ?? ["other"],
          psychologicalFactors: base.psychologicalFactors ?? [],
          theoreticalFrameworks: base.theoreticalFrameworks ?? [],
          offenders: base.offenders ?? [],
          timeline: base.timeline,
          behavioralProfile: base.behavioralProfile ?? {
            modusOperandi: "See analysis.",
            organizationLevel: "unknown",
          },
          motivationalFactors: base.motivationalFactors ?? [],
        },
        {
          ...base.analysis,
          expertCommentary: base.analysis.expertCommentary ?? [],
        },
      ),
    } as CrimeCase));
  }

  return withCatalogCoords(attachCaseImages({
    ...base,
    aliases: e.aliases,
    caseNumber: e.caseNumber,
    location: e.location,
    country: e.country ?? inferCountry(base.jurisdiction, e.location),
    yearStart: e.yearStart,
    yearEnd: e.yearEnd,
    crimeCategories: e.crimeCategories,
    psychologicalFactors: e.psychologicalFactors,
    theoreticalFrameworks: e.theoreticalFrameworks,
    diagnoses: e.diagnoses,
    offenders: e.offenders,
    victims: e.victims,
    legalOutcome: e.legalOutcome,
    behavioralProfile: e.behavioralProfile,
    motivationalFactors: e.motivationalFactors,
    relatedCaseSlugs: e.relatedCaseSlugs,
    contentLevel: e.contentLevel ?? "standard",
    documentIds: e.documentIds,
    references: e.references,
    caseOfWeek: e.caseOfWeek,
    nameOriginal: e.nameOriginal ?? base.nameOriginal,
    primarySourceLanguage: e.primarySourceLanguage ?? base.primarySourceLanguage,
    primarySourceLanguageLabel:
      e.primarySourceLanguageLabel ?? base.primarySourceLanguageLabel,
    translationNote: e.translationNote ?? base.translationNote,
    narrative: getCaseNarrative(base.slug),
    analysis: finalizeAnalysis(
      {
        ...base,
        location: e.location,
        yearStart: e.yearStart,
        yearEnd: e.yearEnd,
        crimeCategories: e.crimeCategories,
        psychologicalFactors: e.psychologicalFactors,
        theoreticalFrameworks: e.theoreticalFrameworks,
        offenders: e.offenders,
        timeline: base.timeline,
        behavioralProfile: e.behavioralProfile,
        motivationalFactors: e.motivationalFactors,
      },
      {
        ...base.analysis,
        expertCommentary: e.expertCommentary ?? [],
      },
    ),
  } as CrimeCase));
}
