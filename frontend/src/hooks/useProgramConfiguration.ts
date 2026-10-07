import { useState } from "react";
import { mockConfigurations } from "../data/configurations";
import type { ProgramConfiguration } from "../types/configuration";

export function useProgramConfiguration(programId: number) {
  const [drafts, setDrafts] = useState<Record<number, ProgramConfiguration>>(() => structuredClone(mockConfigurations));
  const [savedConfigurations, setSavedConfigurations] = useState<Record<number, ProgramConfiguration>>(() => structuredClone(mockConfigurations));

  function updateConfiguration(configuration: ProgramConfiguration) {
    setDrafts((previous) => ({ ...previous, [configuration.programId]: configuration }));
  }

  function saveConfiguration(configuration: ProgramConfiguration) {
    setSavedConfigurations((previous) => ({ ...previous, [configuration.programId]: configuration }));
  }

  return { configuration: drafts[programId] ?? { programId, criteria: [] }, savedConfiguration: savedConfigurations[programId] ?? null, updateConfiguration, saveConfiguration };
}
