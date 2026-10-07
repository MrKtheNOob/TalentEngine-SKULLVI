import { useEffect, useState } from "react";
import * as configurationService from "../services/configurationService";
import type { ProgramConfiguration } from "../types/configuration";
import type { Result } from "../types/result";

export function useProgramConfiguration(programId: number) {
  const [response, setResponse] = useState<{ programId: number; result: Result<ProgramConfiguration> }>();
  const [drafts, setDrafts] = useState<Record<number, ProgramConfiguration>>({});

  useEffect(() => {
    let active = true;
    if (Number.isSafeInteger(programId) && programId > 0) configurationService.getConfiguration(programId).then((result) => {
      if (!active) return;
      setResponse({ programId, result });
      if (!result.error) setDrafts((previous) => ({ ...previous, [programId]: result.data }));
    });
    return () => { active = false; };
  }, [programId]);

  function updateConfiguration(configuration: ProgramConfiguration) {
    setDrafts((previous) => ({ ...previous, [configuration.programId]: configuration }));
  }

  async function saveConfiguration(configuration: ProgramConfiguration): Promise<Result<ProgramConfiguration>> {
    const result = await configurationService.saveConfiguration(configuration);
    if (!result.error) {
      setResponse((previous) => previous?.programId === configuration.programId
        ? { programId: configuration.programId, result } : previous);
      updateConfiguration(result.data);
    }
    return result;
  }

  function rescoreApplications() {
    return configurationService.rescoreApplications(programId);
  }

  const current = response?.programId === programId ? response.result : undefined;
  return {
    configuration: drafts[programId] ?? { programId, criteria: [] },
    savedConfiguration: current?.data ?? null,
    loading: !current, error: current?.error ?? null,
    updateConfiguration, saveConfiguration, rescoreApplications,
  };
}
