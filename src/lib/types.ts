export type CaseStatus = "closed" | "unsolved" | "historical";
export type AnalysisStatus = "published" | "draft" | "pending";

export type PsychDimension =
  | "planning"
  | "affect"
  | "empathy_remorse"
  | "control"
  | "reality_testing"
  | "social_functioning"
  | "stressors"
  | "pattern_consistency";

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
}

export interface CrimeCase {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  jurisdiction: string;
  era: string;
  status: CaseStatus;
  tags: string[];
  warning: string;
  overview: string;
  timeline: TimelineEvent[];
  signals: BehaviorSignal[];
  sources: SourceRef[];
  analysis: ForensicAnalysis;
  featured?: boolean;
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
