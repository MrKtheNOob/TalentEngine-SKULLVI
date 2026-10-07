import { api } from "./api";
import type { Result } from "../types/result";
import type { ProgramResponse, ProgramOverviewResponse, ProgramCreate, ProgramUpdate, ProgramSortOrder } from "../types/program";

export interface ProgramFilters {
  search?: string;
  sort?: ProgramSortOrder;
}

export async function getPrograms(filters: ProgramFilters = {}): Promise<Result<ProgramResponse[]>> {
  try {
    const response = await api.get<ProgramResponse[]>("/programs/", { params: filters });
    return { data: response.data, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error : new Error("Impossible de charger les programmes.") };
  }
}

export async function getProgram(programId: number): Promise<Result<ProgramResponse>> {
  try {
    const response = await api.get<ProgramResponse>(`/programs/${programId}`);
    return { data: response.data, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error : new Error("Impossible de charger le programme.") };
  }
}

export async function createProgram(attributes: ProgramCreate): Promise<Result<ProgramResponse>> {
  try {
    const response = await api.post<ProgramResponse>("/programs/", attributes);
    return { data: response.data, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error : new Error("Impossible de créer le programme.") };
  }
}

export async function updateProgram(programId: number, attributes: ProgramUpdate): Promise<Result<ProgramResponse>> {
  try {
    const response = await api.patch<ProgramResponse>(`/programs/${programId}`, attributes);
    return { data: response.data, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error : new Error("Impossible de modifier le programme.") };
  }
}

export async function getProgramOverview(programId: number): Promise<Result<ProgramOverviewResponse>> {
  try {
    const response = await api.get<ProgramOverviewResponse>(`/programs/${programId}/overview`);
    return { data: response.data, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error : new Error("Impossible de charger la vue d’ensemble.") };
  }
}
