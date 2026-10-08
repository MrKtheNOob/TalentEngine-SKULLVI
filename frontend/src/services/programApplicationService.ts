import { api } from "./api";
import axios from "axios";
import type { ProcessingStatus, ProgramApplicationResponse } from "../types/application";
import type { ProgramResponse } from "../types/program";
import type { Result } from "../types/result";

export interface ApplicationFilters {
  search?: string;
  status?: ProcessingStatus | "all";
  sort?: "score" | "recent";
}

export async function deleteApplication(programId: number, applicationId: number): Promise<Result<boolean>> {
  try {
    await api.delete(`/programs/${programId}/applications/${applicationId}`);
    return { data: true, error: null };
  } catch (error) {
    // Display the backend's explanation when deletion is blocked by running work.
    if (axios.isAxiosError<{ detail?: string }>(error) && typeof error.response?.data.detail === "string") {
      error.message = error.response.data.detail;
    }
    return { data: null, error: error instanceof Error ? error : new Error("Impossible de supprimer la candidature.") };
  }
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
