// Frontend display shape; not yet an agreed backend API contract.
export type ProgramStatus = "Active" | "Closed";
export type ProgramStatusFilter = ProgramStatus | "all";
export type ProgramSortOrder = "updated" | "name" | "candidates";

export interface Program {
  id: number;
  name: string;
  description: string;
  status: ProgramStatus;
  candidates: number;
  updatedAt: string;
}
