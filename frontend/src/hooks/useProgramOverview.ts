import { useEffect, useState } from "react";
import { getProgramOverview } from "../services/programService";
import type { ProgramOverviewResponse } from "../types/program";
import type { Result } from "../types/result";

export function useProgramOverview(programId: number, refreshKey = 0) {
  const [response, setResponse] = useState<{ programId: number; result: Result<ProgramOverviewResponse> }>();

  useEffect(() => {
    let active = true;
    async function load() {
      const result = await getProgramOverview(programId);
      if (!active) return;
      setResponse({ programId, result });
    }
    void load();
    return () => { active = false; };
  }, [programId, refreshKey]);

  const current = response?.programId === programId ? response.result : undefined;
  return { counts: current?.data, loading: !current, error: current?.error ?? null };
}
