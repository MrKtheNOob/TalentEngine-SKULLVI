import { useEffect, useState } from "react";
import axios from "axios";
import { getCandidateDetail, type CandidateDetailResponse } from "../services/candidateService";
import type { Result } from "../types/result";
import { toProgram } from "./usePrograms";
import { toApplication } from "./useProgramApplications";

export function useCandidateDetail(programId: string | undefined, candidateId: string | undefined, applicationId: string | null) {
  const program = Number(programId);
  const candidate = Number(candidateId);
  const application = applicationId === null ? undefined : Number(applicationId);
  const valid = [program, candidate, application ?? 1].every((id) => Number.isSafeInteger(id) && id > 0);
  const key = `${programId}/${candidateId}/${applicationId ?? ""}`;
  const [response, setResponse] = useState<{ key: string; result: Result<CandidateDetailResponse> }>();

  useEffect(() => {
    let active = true;
    if (valid) getCandidateDetail(program, candidate, application).then((result) => {
      if (active) setResponse({ key, result });
    });
    return () => { active = false; };
  }, [program, candidate, application, valid, key]);

  const result = response?.key === key ? response.result : undefined;
  const error = result?.error ?? null;
  const notFound = !valid || (axios.isAxiosError(error) && error.response?.status === 404);
  return {
    program: result?.data ? toProgram(result.data.program) : undefined,
    application: result?.data ? toApplication(result.data.application) : undefined,
    loading: valid && !result,
    error: notFound ? null : error,
    notFound,
  };
}
