// Frontend display shape adapted from the program API.
export type ProgramSortOrder = "updated" | "name" | "candidates";

export interface Program {
  id: number;
  name: string;
  description: string;
  candidates: number;
  updatedAt: string;
}

// Backend response shapes; keep field names aligned with programs/schemas.py.
export interface ProgramResponse {
  id: number;
  name: string;
  description: string | null;
  updated_at: string;
  candidates_count: number;
}

export interface ProgramOverviewResponse {
  total: number;
  review: number;
  processing: number;
  failed: number;
}

export interface ProgramCreate {
  name: string;
  description?: string | null;
}

export interface ProgramUpdate {
  name?: string;
  description?: string | null;
}
