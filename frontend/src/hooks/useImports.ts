import { useEffect, useState } from "react";
import * as jobService from "../services/jobService";
import type { ImportJob, ScoringJob } from "../types/job";

export function useImports() {
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [scoringJobs, setScoringJobs] = useState<ScoringJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const [checkVersion, setCheckVersion] = useState(0);

  useEffect(() => {
    let active = true;
    let pending = false;
    let timer: ReturnType<typeof setTimeout>;
    async function poll() {
      const [imports, scoring] = await Promise.all([jobService.getImports(), jobService.getScoringJobs()]);
      if (!active) return;
      if (imports.data) setJobs(imports.data);
      if (scoring.data) setScoringJobs(scoring.data);
      setError(imports.error ?? scoring.error);
      setLoading(false);
      if (!imports.error && !scoring.error) {
        pending = [...imports.data, ...scoring.data].some(
          (job) => job.status === "pending" || job.status === "running",
        );
      }
      if (pending) timer = setTimeout(poll, 3000);
    }
    void poll();
    return () => { active = false; clearTimeout(timer); };
  }, [checkVersion]);

  async function createImport(programId: number, file: File, autoScore: boolean) {
    const result = await jobService.createImport(programId, file, autoScore);
    if (result.data) {
      setJobs((previous) => [result.data, ...previous.filter((job) => job.id !== result.data.id)]);
      setCheckVersion((previous) => previous + 1);
    }
    return result;
  }

  return { jobs, scoringJobs, loading, error, createImport };
}
