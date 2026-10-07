// Frontend draft shape. Backend persistence contract is still to be agreed.
export type CriterionType = "number" | "text" | "select" | "multiselect";
export type PriorityTier = "low" | "medium" | "high";

export interface ScoringOption {
  id: string;
  label: string;
  scoreTier: PriorityTier;
}

export interface ScoringRange {
  id: string;
  min: number | null;
  max: number | null;
  scoreTier: PriorityTier;
}

export interface ScoringCriterion {
  id: string;
  name: string;
  type: CriterionType;
  priority: PriorityTier;
  guidance: string;
  options: ScoringOption[];
  ranges: ScoringRange[];
  unit: string;
}

export interface ProgramConfiguration {
  programId: number;
  criteria: ScoringCriterion[];
}
