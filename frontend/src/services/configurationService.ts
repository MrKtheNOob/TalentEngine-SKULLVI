import axios from "axios";
import { api } from "./api";
import type { ProgramConfiguration } from "../types/configuration";
import type { Result } from "../types/result";

export async function getConfiguration(programId: number): Promise<Result<ProgramConfiguration>> {
  try {
    const response = await api.get<ProgramConfiguration>(`/programs/${programId}/configuration`);
    return { data: response.data, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error : new Error("Impossible de charger la configuration.") };
  }
}

export async function saveConfiguration(configuration: ProgramConfiguration): Promise<Result<ProgramConfiguration>> {
  try {
    const response = await api.put<ProgramConfiguration>(`/programs/${configuration.programId}/configuration`, configuration);
    return { data: response.data, error: null };
  } catch (error) {
    if (axios.isAxiosError<{ detail?: string | { loc: (string | number)[]; msg: string }[] }>(error)) {
      const detail = error.response?.data.detail;
      if (typeof detail === "string") error.message = detail;
      else if (Array.isArray(detail)) error.message = detail.map((issue) => `${issue.loc.join(".")}: ${issue.msg}`).join("; ");
    }
    return { data: null, error: error instanceof Error ? error : new Error("Impossible d’enregistrer la configuration.") };
  }
}

export async function rescoreApplications(programId: number): Promise<Result<{ message: string }>> {
  try {
    const response = await api.post<{ message: string }>(`/programs/${programId}/configuration/rescore`);
    return { data: response.data, error: null };
  } catch (error) {
    if (axios.isAxiosError<{ detail?: string }>(error) && typeof error.response?.data.detail === "string") {
      error.message = error.response.data.detail;
    }
    return { data: null, error: error instanceof Error ? error : new Error("Impossible de relancer l’évaluation.") };
  }
}
