export type JobStatus = "pending" | "running" | "completed" | "failed";

export interface ImportJob {
  id: number;
  program_id: number;
  filename: string;
  status: JobStatus;
  total: number;
  processed: number;
  successful: number;
  failed: number;
  auto_score: boolean;
  row_errors: { row: number; error: string }[];
  error: string | null;
  created_at: string;
  finished_at: string | null;
}

export interface ScoringJob {
  id: number;
  program_id: number;
  application_id: number;
  status: JobStatus;
  error: string | null;
  created_at: string;
  finished_at: string | null;
}
