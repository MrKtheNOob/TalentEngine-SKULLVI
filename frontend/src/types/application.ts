// Frontend demo shape, not yet a backend contract.
// needs_review concerns extraction quality only; scores never trigger rejection.
export type ProcessingStatus = "received" | "processing" | "ready" | "needs_review" | "failed";

export interface Candidate {
  id: number;
  name: string;
  email: string | null;
}

export interface Application {
  id: number;
  programId: number;
  candidate: Candidate;
  score: number | null;
  status: ProcessingStatus;
  appliedAt: string;
  cvUrl: string | null;
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

// Current backend response; extraction and assessment detail are not persisted yet.
export interface ProgramApplicationResponse {
  id: number;
  program_id: number;
  candidate_id: number;
  candidate: import("./candidate").CandidateResponse;
  status: ProcessingStatus;
  score: number | null;
  rank: number | null;
  created_at: string;
}
