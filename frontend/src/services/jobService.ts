import axios from "axios";
import { api } from "./api";
import type { ImportJob, ScoringJob } from "../types/job";
import type { Result } from "../types/result";

export async function createImport(programId: number, file: File, autoScore: boolean): Promise<Result<ImportJob>> {
  const body = new FormData();
  body.append("program_id", String(programId));
  body.append("file", file);
  body.append("auto_score", String(autoScore));
  try {
    const response = await api.post<ImportJob>("/jobs/imports", body);
    return { data: response.data, error: null };
  } catch (error) {
    if (axios.isAxiosError<{ detail?: string }>(error) && typeof error.response?.data.detail === "string") {
      error.message = error.response.data.detail;
    }
    return { data: null, error: error instanceof Error ? error : new Error("Impossible d’envoyer le fichier.") };
  }
}

export async function getImports(programId?: number): Promise<Result<ImportJob[]>> {
  try {
    const response = await api.get<ImportJob[]>("/jobs/imports", { params: { program_id: programId } });
    return { data: response.data, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error : new Error("Impossible de charger les imports.") };
  }
}

export async function getScoringJobs(programId?: number): Promise<Result<ScoringJob[]>> {
  try {
    const response = await api.get<ScoringJob[]>("/jobs/scoring", { params: { program_id: programId } });
    return { data: response.data, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error : new Error("Impossible de charger les évaluations.") };
  }
}
