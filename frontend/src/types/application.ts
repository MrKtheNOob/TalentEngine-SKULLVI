// Frontend display shape adapted from the application API.
// needs_review concerns extraction quality only; scores never trigger rejection.
export type ProcessingStatus = "received" | "processing" | "ready" | "needs_review" | "failed";

export interface Application {
  id: number;
  programId: number;
  name: string;
  email: string | null;
  score: number | null;
  status: ProcessingStatus;
  appliedAt: string;
  cvUrl: string | null;
  portfolioUrl: string | null;
  warnings?: string[];
  rank?: number | null;
}

export interface NormalizedApplication {
  location: string | null;
  education: string | null;
  skills: string[];
  experience: string | null;
  portfolioUrl: string | null;
  availability: string | null;
  motivation: string | null;
}

export interface CriterionAssessment {
  criterionId: string;
  label: string;
  points: number;
  maxPoints: number;
  explanation: string;
}

export interface ApplicationDetail {
  normalized: NormalizedApplication | null;
  source: string;
  normalization: string;
  evaluationSummary: string | null;
  breakdown: CriterionAssessment[];
}

// Backend application identity and processing data live in the same record.
export interface ProgramApplicationResponse {
  id: number;
  program_id: number;
  name: string;
  email: string | null;
  phone_number: string | null;
  resume_url: string | null;
  portfolio_url: string | null;
  status: ProcessingStatus;
  score: number | null;
  rank: number | null;
  created_at: string;
  normalized_data: Record<string, unknown> | null;
  normalization_metadata: {
    source?: string;
    confidence?: number;
    warnings?: string[];
    scoring_warnings?: string[];
    scoring_error?: string;
  } | null;
  score_breakdown: {
    criterion_id: string;
    name: string;
    score: number;
    weight: number;
    reason: string;
    value: unknown;
  }[] | null;
}
