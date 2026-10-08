import { useEffect, useState } from "react";
import { getProgramApplications, type ApplicationFilters } from "../services/programApplicationService";
import type { Application, ProgramApplicationResponse } from "../types/application";
import type { Result } from "../types/result";

export function toApplication(response: ProgramApplicationResponse): Application {
  return {
    id: response.id, programId: response.program_id,
    name: response.name, email: response.email,
    score: response.score, status: response.status, appliedAt: response.created_at,
    cvUrl: response.resume_url, portfolioUrl: response.portfolio_url, rank: response.rank,
    warnings: [
      ...(response.normalization_metadata?.warnings ?? []),
      ...(response.normalization_metadata?.scoring_warnings ?? []),
      ...(response.normalization_metadata?.scoring_error ? [response.normalization_metadata.scoring_error] : []),
    ],
  };
}

export function useProgramApplications(programId: number, filters: ApplicationFilters = {}, refreshKey = 0) {
  const { search, status, sort } = filters;
  const key = JSON.stringify([programId, search, status, sort]);
  const [response, setResponse] = useState<{ key: string; result: Result<Application[]> }>();

  useEffect(() => {
    let active = true;
    async function load() {
      const result = await getProgramApplications(programId, { search, status, sort });
      if (!active) return;
      setResponse({ key, result: result.error
        ? { data: null, error: result.error }
        : { data: result.data.map(toApplication), error: null } });
    }
    void load();
    return () => { active = false; };
  }, [programId, search, status, sort, key, refreshKey]);

  const current = response?.key === key ? response.result : undefined;
  return { applications: current?.data ?? [], loading: !current, error: current?.error ?? null };
}
