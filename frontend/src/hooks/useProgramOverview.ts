import { useEffect, useState } from "react";
import { getProgramOverview } from "../services/programService";
import type { ProgramOverviewResponse } from "../types/program";
import type { Result } from "../types/result";

export function useProgramOverview(programId: number) {
  const [response, setResponse] = useState<{ programId: number; result: Result<ProgramOverviewResponse> }>();

  useEffect(() => {
    let active = true;
    getProgramOverview(programId).then((result) => {
      if (active) setResponse({ programId, result });
    });
    return () => { active = false; };
  }, [programId]);

  const current = response?.programId === programId ? response.result : undefined;
  return { counts: current?.data, loading: !current, error: current?.error ?? null };
}
