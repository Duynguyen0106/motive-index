export type CaseStatus = "closed" | "unsolved" | "historical";
export type AnalysisStatus = "published" | "draft" | "pending";
export type ContributionStatus = "pending" | "in_review" | "accepted" | "rejected";

/** ISO 3166-1 alpha-2 country codes represented in the case catalog. */
export type CountryCode =
  | "AR"
  | "AT"
  | "AU"
  | "BE"
  | "BR"
  | "CA"
  | "CH"
  | "CL"
  | "CN"
  | "CO"
  | "CZ"
  | "DE"
  | "DK"
  | "EG"
  | "ES"
  | "FI"
  | "FR"
  | "GB"
  | "GR"
  | "HU"
  | "ID"
  | "IE"
  | "IL"
  | "IN"
  | "IQ"
  | "IR"
  | "IT"
  | "JP"
  | "KE"
  | "KR"
  | "MX"
  | "MY"
  | "NG"
  | "NL"
  | "NO"
  | "NZ"
  | "PE"
  | "PH"
  | "PK"
  | "PL"
  | "PT"
  | "RO"
  | "RU"
  | "SE"
  | "SG"
  | "TH"
  | "TR"
  | "TW"
  | "UA"
  | "US"
  | "VN"
  | "ZA"
  | "BD"
  | "LV"
  | "ET"
  | "SA"
  | "RS"
  | "BG"
  | "SK"
  | "UZ"
  | "OTHER";

export type CrimeCategory =
  | "serial_murder"
  | "mass_violence"
  | "homicide"
  | "domestic_homicide"
  | "healthcare_murder"
  | "terrorism_ideological"
  | "fraud"
  | "arson"
  | "other";

export type PsychDimension =
  | "planning"
  | "affect"
  | "empathy_remorse"
  | "control"
  | "reality_testing"
  | "social_functioning"
  | "stressors"
  | "pattern_consistency";

export type DocumentType =
  | "court_transcript"
  | "police_report"
  | "psychological_evaluation"
  | "letter"
  | "diary"
  | "manifesto"
  | "autopsy_summary"
  | "newspaper"
  | "academic_study"
  | "inquiry_report";

export type TheoreticalFramework =
  | "psychodynamic"
  | "cognitive_behavioral"
  | "social_learning"
  | "attachment"
  | "biological"
  | "personality"
  | "ideological"
  | "situational"
  | "group_influence";

export type PsychologicalFactor =
  | "narcissism"
  | "paranoia"
  | "childhood_trauma"
  | "antisocial_traits"
  | "psychopathy_traits"
  | "compartmentalization"
  | "ideological_extremism"
  | "impression_management"
  | "power_control"
  | "empathy_deficit";

export interface SourceRef {
  title: string;
  /** Title in the original publication language, when translated for display. */
  originalTitle?: string;
  /** ISO 639-1 language code of the primary source (e.g. ja, de, ar). */
  language?: string;
  /** Human-readable language name for UI. */
  languageLabel?: string;
  url?: string;
  kind: "court" | "news" | "academic" | "biography" | "primary";
}

export interface TimelineEvent {
  id: string;
  date: string;
  label: string;
  detail: string;
  behavioralNote?: string;
}

export interface BehaviorSignal {
  id: string;
  dimension: PsychDimension;
  observation: string;
  sourceIds: string[];
}

export interface PsychConstruct {
  id: string;
  label: string;
  dimension: PsychDimension;
  hypothesis: string;
  evidence: string[];
  counterEvidence: string[];
  confidence: number;
  clinicalCaveat?: string;
}

export interface FrameworkNote {
  framework: TheoreticalFramework;
  prediction: string;
  assessment: string;
  confidence: number;
}

export interface ForensicAnalysis {
  status: AnalysisStatus;
  summary: string;
  /** Cross-dimensional integration of top constructs. */
  synthesis?: string;
  constructs: PsychConstruct[];
  /** Testable predictions from theoretical frameworks on the dossier. */
  frameworkNotes?: FrameworkNote[];
  alternativeExplanations: string[];
  whatWeCannotKnow: string[];
  modelVersion: string;
  reviewedByHuman: boolean;
  updatedAt: string;
  /** Expert or student commentary block */
  expertCommentary?: ExpertCommentary[];
}

export interface ExpertCommentary {
  id: string;
  author: string;
  role: "expert" | "student" | "editor";
  title: string;
  body: string;
  reviewed: boolean;
  publishedAt: string;
}

export interface PersonRecord {
  id: string;
  name: string;
  role: "offender" | "victim" | "unknown_offender";
  known: boolean;
  sex?: "male" | "female" | "unknown";
  ageAtOffense?: string;
  background?: string;
  relationshipToOffender?: string;
  demographicsNote?: string;
}

export interface LegalOutcome {
  summary: string;
  trial?: string;
  sentencing?: string;
  appeals?: string;
}

export interface BehavioralProfile {
  modusOperandi: string;
  signature?: string;
  escalation?: string;
  organizationLevel?: "organized" | "disorganized" | "mixed" | "unknown";
}

export interface MotivationalFactor {
  label: string;
  detail: string;
}

export interface DiagnosisNote {
  label: string;
  status: "documented" | "hypothesized" | "contested" | "not_applicable";
  note: string;
}

export interface CaseDocument {
  id: string;
  caseSlug: string;
  title: string;
  type: DocumentType;
  date?: string;
  author?: string;
  source: string;
  publicDomain: boolean;
  summary: string;
  psychRelevance: string;
  contentWarning: string;
  url?: string;
  hosted: boolean;
}

/** Editorial photograph attached to a dossier (Wikimedia / public archive). */
export type CaseImageKind = "context" | "location" | "portrait";

export interface CaseImage {
  id: string;
  url: string;
  alt: string;
  caption: string;
  kind: CaseImageKind;
  source: string;
  attribution: string;
  license?: string;
  /** Mugshots and arrest photos require click-to-reveal in the UI. */
  sensitive?: boolean;
}

export interface CaseReference {
  id: string;
  citation: string;
  /** Citation text in the original source language. */
  originalCitation?: string;
  /** ISO 639-1 language code. */
  language?: string;
  languageLabel?: string;
  kind: "book" | "journal" | "report" | "media" | "court";
  url?: string;
  /** Publication or decision year when known. */
  year?: string;
  /** Why this source matters for forensic reading of the dossier. */
  note?: string;
}

export type DossierChapterId =
  | "origins"
  | "formation"
  | "escalation"
  | "method"
  | "motivation"
  | "investigation"
  | "aftermath";

/** Documentary-style chapter in a case dossier. */
export interface DossierChapter {
  id: DossierChapterId;
  title: string;
  period?: string;
  /** Opening line for the chapter — documentary hook. */
  lead?: string;
  paragraphs: string[];
  /** Forensic-psychology marginalia (hypothesis, not diagnosis). */
  psychNote?: string;
}

export interface CaseNarrative {
  /** One-sentence documentary cold open. */
  hook: string;
  chapters: DossierChapter[];
  /** How the narrative was produced. */
  source?: "llm" | "heuristic" | "human";
  generatedAt?: string;
  /** Shown on draft narratives awaiting moderation. */
  reviewNote?: string;
}

export interface CrimeCase {
  id: string;
  slug: string;
  name: string;
  aliases?: string[];
  subtitle: string;
  caseNumber?: string;
  jurisdiction: string;
  location: string;
  /** Normalized country for filtering (ISO-style code). */
  country?: CountryCode;
  /** Optional map coordinates (degrees). */
  lat?: number;
  lng?: number;
  yearStart: number;
  yearEnd?: number;
  era: string;
  status: CaseStatus;
  crimeCategories: CrimeCategory[];
  tags: string[];
  psychologicalFactors: PsychologicalFactor[];
  theoreticalFrameworks: TheoreticalFramework[];
  diagnoses: DiagnosisNote[];
  offenders: PersonRecord[];
  victims: PersonRecord[];
  legalOutcome: LegalOutcome;
  behavioralProfile: BehavioralProfile;
  motivationalFactors: MotivationalFactor[];
  relatedCaseSlugs: string[];
  warning: string;
  contentLevel: "standard" | "restricted";
  overview: string;
  /** Offender or case name in the primary source language. */
  nameOriginal?: string;
  /** ISO 639-1 code of the main non-English source language, if any. */
  primarySourceLanguage?: string;
  primarySourceLanguageLabel?: string;
  /** How English text was produced and what to verify in originals. */
  translationNote?: string;
  /** Full documentary narrative (childhood → crime → motive → aftermath). */
  narrative?: CaseNarrative;
  timeline: TimelineEvent[];
  signals: BehaviorSignal[];
  documentIds: string[];
  references: CaseReference[];
  /** Optional documentary or contextual photograph (see editorial policy on /about). */
  images?: CaseImage[];
  sources: SourceRef[];
  analysis: ForensicAnalysis;
  featured?: boolean;
  caseOfWeek?: boolean;
}

export interface LiveUpdate {
  id: string;
  createdAt: string;
  headline: string;
  summary: string;
  caseSlug?: string;
  kind: "new_case" | "analysis_ready" | "source_added" | "revision" | "world_news";
  status: "published" | "draft";
  /** ISO country when the story is region-tagged. */
  country?: CountryCode;
  /** Human region label, e.g. "East Asia", "Latin America". */
  region?: string;
  sourceUrl?: string;
  sourceName?: string;
  /** ISO 639-1 when headline was translated for display. */
  language?: string;
  languageLabel?: string;
  /** Headline in original publication language. */
  originalHeadline?: string;
}

export interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  relatedCaseSlugs?: string[];
}

export interface TheoryOverview {
  id: string;
  slug: string;
  name: string;
  framework: TheoreticalFramework;
  summary: string;
  keyIdeas: string[];
  relevance: string;
  relatedCaseSlugs: string[];
}

export interface ContributionSubmission {
  id: string;
  kind: "case" | "analysis" | "document";
  title: string;
  submitterName: string;
  submitterRole: string;
  summary: string;
  status: ContributionStatus;
  createdAt: string;
}

export interface SearchFilters {
  q?: string;
  crimeCategory?: CrimeCategory | "";
  psychologicalFactor?: PsychologicalFactor | "";
  theoreticalFramework?: TheoreticalFramework | "";
  diagnosis?: string;
  country?: CountryCode | "";
  location?: string;
  period?: string;
  offenderSex?: string;
  documentType?: DocumentType | "";
  status?: CaseStatus | "";
  /** Archive/monitor filter: curated (no bulk-catalog tag), composite, or all. */
  catalogTier?: CatalogTier | "";
}

export type CatalogTier = "curated" | "composite" | "all";

/** Lightweight case row for monitor sidebar and map context. */
export interface MonitorCaseSummary {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  yearStart: number;
  yearEnd?: number;
  status: CaseStatus;
  country?: CountryCode;
  crimeCategories: CrimeCategory[];
  tags: string[];
}

/** Lightweight case row for archive index (avoids shipping full dossiers). */
export interface CaseArchiveSummary extends MonitorCaseSummary {
  location: string;
  featured?: boolean;
}

export const DIMENSION_LABELS: Record<PsychDimension, string> = {
  planning: "Planning",
  affect: "Affect",
  empathy_remorse: "Empathy / remorse signals",
  control: "Control & dominance",
  reality_testing: "Reality testing",
  social_functioning: "Social functioning",
  stressors: "Situational stressors",
  pattern_consistency: "Pattern consistency",
};

export const CRIME_CATEGORY_LABELS: Record<CrimeCategory, string> = {
  serial_murder: "Serial murder",
  mass_violence: "Mass violence",
  homicide: "Homicide",
  domestic_homicide: "Domestic homicide",
  healthcare_murder: "Healthcare murder",
  terrorism_ideological: "Ideological / terror",
  fraud: "Fraud",
  arson: "Arson",
  other: "Other",
};

export const FACTOR_LABELS: Record<PsychologicalFactor, string> = {
  narcissism: "Narcissism",
  paranoia: "Paranoia",
  childhood_trauma: "Childhood trauma",
  antisocial_traits: "Antisocial traits",
  psychopathy_traits: "Psychopathy traits",
  compartmentalization: "Compartmentalization",
  ideological_extremism: "Ideological extremism",
  impression_management: "Impression management",
  power_control: "Power / control",
  empathy_deficit: "Empathy deficit",
};

export const FRAMEWORK_LABELS: Record<TheoreticalFramework, string> = {
  psychodynamic: "Psychodynamic",
  cognitive_behavioral: "Cognitive-behavioral",
  social_learning: "Social learning",
  attachment: "Attachment theory",
  biological: "Biological",
  personality: "Personality psychology",
  ideological: "Ideological radicalization",
  situational: "Situational / opportunity",
  group_influence: "Group influence",
};

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  court_transcript: "Court transcript",
  police_report: "Police report",
  psychological_evaluation: "Psychological evaluation",
  letter: "Letter",
  diary: "Diary",
  manifesto: "Manifesto",
  autopsy_summary: "Autopsy summary (sanitized)",
  newspaper: "Newspaper archive",
  academic_study: "Academic study",
  inquiry_report: "Public inquiry report",
};
