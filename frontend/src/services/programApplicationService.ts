import { api } from "./api";
import type { ProcessingStatus, ProgramApplicationResponse } from "../types/application";
import type { ProgramResponse } from "../types/program";
import type { Result } from "../types/result";

export interface ApplicationFilters {
  search?: string;
  status?: ProcessingStatus | "all";
  sort?: "score" | "recent";
}

export async function getProgramApplications(
  programId: number,
  filters: ApplicationFilters = {},
): Promise<Result<ProgramApplicationResponse[]>> {
  try {
    const response = await api.get<ProgramApplicationResponse[]>(`/programs/${programId}/applications`, {
      params: filters,
    });
    return { data: response.data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error("Impossible de charger les candidatures."),
    };
  }
}

export async function getProgramApplication(
  programId: number,
  applicationId: number,
): Promise<Result<ProgramApplicationResponse>> {
  try {
    const response = await api.get<ProgramApplicationResponse>(`/programs/${programId}/applications/${applicationId}`);
    return { data: response.data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error("Impossible de charger la candidature."),
    };
  }
}

export interface ApplicationDetailResponse {
  program: ProgramResponse;
  application: ProgramApplicationResponse;
}

export async function getApplicationDetail(programId: number, applicationId: number): Promise<Result<ApplicationDetailResponse>> {
  try {
    const response = await api.get<ApplicationDetailResponse>(`/programs/${programId}/applications/${applicationId}/detail`);
    return { data: response.data, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error : new Error("Impossible de charger la candidature.") };
  }
}
