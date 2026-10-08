import { useEffect, useState } from "react";
import { getImports, getScoringJobs } from "../services/jobService";

export function useProgramJobs(programId: number) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [checkVersion, setCheckVersion] = useState(0);

  useEffect(() => {
    let active = true;
    let pending = false;
    let timer: ReturnType<typeof setTimeout>;

    async function checkJobs(refreshData = false) {
      if (!Number.isSafeInteger(programId) || programId <= 0) return;
      const [imports, scoring] = await Promise.all([
        getImports(programId), getScoringJobs(programId),
      ]);
      if (!active) return;
      if (imports.error || scoring.error) {
        // Retry only if we already know this program has unfinished work.
        if (pending) timer = setTimeout(() => { void checkJobs(true); }, 3000);
        return;
      }
      pending = [...imports.data, ...scoring.data].some(
        (job) => job.status === "pending" || job.status === "running",
      );
      // Include the last refresh when jobs finish, then stop polling.
      if (refreshData) setRefreshKey((previous) => previous + 1);
      if (pending) timer = setTimeout(() => { void checkJobs(true); }, 3000);
    }

    void checkJobs(checkVersion > 0);
    return () => { active = false; clearTimeout(timer); };
  }, [programId, checkVersion]);

  function refreshJobs() {
    setCheckVersion((previous) => previous + 1);
  }

  return { refreshKey, refreshJobs };
}
