import { useEffect, useState } from "react";
import { getProgramApplications, type ApplicationFilters } from "../services/programApplicationService";
import type { Application, ProgramApplicationResponse } from "../types/application";
import type { Result } from "../types/result";

export function toApplication(response: ProgramApplicationResponse): Application {
  return {
    id: response.id, programId: response.program_id,
    candidate: { id: response.candidate.id, name: response.candidate.name, email: response.candidate.email },
    score: response.score, status: response.status, appliedAt: response.created_at,
    cvUrl: response.candidate.resume_url, rank: response.rank,
  };
}

export function useProgramApplications(programId: number, filters: ApplicationFilters = {}) {
  const { search, status, sort } = filters;
  const key = JSON.stringify([programId, search, status, sort]);
  const [response, setResponse] = useState<{ key: string; result: Result<Application[]> }>();

  useEffect(() => {
    let active = true;
    getProgramApplications(programId, { search, status, sort }).then((result) => {
      if (!active) return;
      setResponse({ key, result: result.error
        ? { data: null, error: result.error }
        : { data: result.data.map(toApplication), error: null } });
    });
    return () => { active = false; };
  }, [programId, search, status, sort, key]);

  const current = response?.key === key ? response.result : undefined;
  return { applications: current?.data ?? [], loading: !current, error: current?.error ?? null };
}
