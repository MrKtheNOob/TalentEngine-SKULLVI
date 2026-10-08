import { useEffect, useState } from "react";
import axios from "axios";
import { getApplicationDetail, type ApplicationDetailResponse } from "../services/programApplicationService";
import type { Result } from "../types/result";
import { useProgramJobs } from "./useProgramJobs";
import { toProgram } from "./usePrograms";
import { toApplication } from "./useProgramApplications";

export function useApplicationDetail(programId: string | undefined, applicationId: string | undefined) {
  const program = Number(programId);
  const application = Number(applicationId);
  const valid = Number.isSafeInteger(program) && program > 0 && Number.isSafeInteger(application) && application > 0;
  const { refreshKey } = useProgramJobs(program);
  const key = `${programId}/${applicationId}`;
  const [response, setResponse] = useState<{ key: string; result: Result<ApplicationDetailResponse> }>();

  useEffect(() => {
    let active = true;
    async function load() {
      if (!valid) return;
      const result = await getApplicationDetail(program, application);
      if (!active) return;
      setResponse({ key, result });
    }
    void load();
    return () => { active = false; };
  }, [program, application, valid, key, refreshKey]);

  const result = response?.key === key ? response.result : undefined;
  const error = result?.error ?? null;
  const notFound = !valid || (axios.isAxiosError(error) && error.response?.status === 404);
  return {
    program: result?.data ? toProgram(result.data.program) : undefined,
    application: result?.data ? toApplication(result.data.application) : undefined,
    processing: result?.data?.application,
    loading: valid && !result,
    error: notFound ? null : error,
  };
}
