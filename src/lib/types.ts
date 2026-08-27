export type CaseStatus = "closed" | "unsolved" | "historical";
export type AnalysisStatus = "published" | "draft" | "pending";
export type ContributionStatus = "pending" | "in_review" | "accepted" | "rejected";

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

export interface ForensicAnalysis {
  status: AnalysisStatus;
  summary: string;
  constructs: PsychConstruct[];
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

export interface CaseReference {
  id: string;
  citation: string;
  kind: "book" | "journal" | "report" | "media" | "court";
  url?: string;
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
  /** Full documentary narrative (childhood → crime → motive → aftermath). */
  narrative?: CaseNarrative;
  timeline: TimelineEvent[];
  signals: BehaviorSignal[];
  documentIds: string[];
  references: CaseReference[];
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
  kind: "new_case" | "analysis_ready" | "source_added" | "revision";
  status: "published" | "draft";
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
  location?: string;
  period?: string;
  offenderSex?: string;
  documentType?: DocumentType | "";
  status?: CaseStatus | "";
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
