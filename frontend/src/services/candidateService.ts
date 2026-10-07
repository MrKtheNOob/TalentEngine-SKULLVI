import { api } from "./api";
import type { CandidateResponse } from "../types/candidate";
import type { ProgramApplicationResponse } from "../types/application";
import type { ProgramResponse } from "../types/program";
import type { Result } from "../types/result";

export async function getProgramCandidates(programId: number): Promise<Result<CandidateResponse[]>> {
  try {
    const response = await api.get<CandidateResponse[]>(`/programs/${programId}/candidates`);
    return { data: response.data, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error : new Error("Impossible de charger les candidats.") };
  }
}


export interface CandidateDetailResponse {
  program: ProgramResponse;
  application: ProgramApplicationResponse;
}

export async function getCandidateDetail(programId: number, candidateId: number, applicationId?: number): Promise<Result<CandidateDetailResponse>> {
  try {
    const response = await api.get<CandidateDetailResponse>(`/programs/${programId}/candidates/${candidateId}`, {
      params: { application_id: applicationId },
    });
    return { data: response.data, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error : new Error("Impossible de charger la candidature.") };
  }
}
