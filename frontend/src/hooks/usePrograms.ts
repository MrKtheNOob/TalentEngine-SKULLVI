import { useEffect, useState } from "react";
import axios from "axios";
import * as programService from "../services/programService";
import type { Program, ProgramCreate, ProgramResponse, ProgramUpdate } from "../types/program";
import type { Result } from "../types/result";

export function toProgram(response: ProgramResponse): Program {
  return {
    id: response.id, name: response.name, description: response.description ?? "",
    candidates: response.candidates_count, updatedAt: response.updated_at,
  };
}

export function usePrograms(filters: programService.ProgramFilters = {}, refreshKey = 0) {
  const { search, sort } = filters;
  const key = JSON.stringify([search, sort, refreshKey]);
  const [response, setResponse] = useState<{ key: string; result: Result<Program[]> }>();

  useEffect(() => {
    let active = true;
    programService.getPrograms({ search, sort }).then((result) => {
      if (!active) return;
      setResponse({ key, result: result.error
        ? { data: null, error: result.error }
        : { data: result.data.map(toProgram), error: null } });
    });
    return () => { active = false; };
  }, [search, sort, key]);

  async function createProgram(attributes: ProgramCreate): Promise<Result<Program>> {
    const result = await programService.createProgram(attributes);
    if (result.error) return { data: null, error: result.error };
    const program = toProgram(result.data);
    setResponse((previous) => {
      if (previous && previous.key !== key) return previous;
      return { key, result: { data: [...(previous?.result.data ?? []), program], error: null } };
    });
    return { data: program, error: null };
  }

  const current = response?.key === key ? response.result : undefined;
  const programs = current?.data ?? [];
  return {
    programs, loading: !current, error: current?.error ?? null, createProgram,
    candidateCount: programs.reduce((total, program) => total + program.candidates, 0),
  };
}

export function useProgram(programId: string | undefined) {
  const id = Number(programId);
  const validId = Number.isSafeInteger(id) && id > 0;
  const [response, setResponse] = useState<{ id: number; result: Result<Program> }>();

  useEffect(() => {
    let active = true;
    if (validId) programService.getProgram(id).then((result) => {
      if (!active) return;
      setResponse({ id, result: result.error
        ? { data: null, error: result.error }
        : { data: toProgram(result.data), error: null } });
    });
    return () => { active = false; };
  }, [id, validId]);

  async function updateProgram(attributes: ProgramUpdate): Promise<Result<Program>> {
    const result = await programService.updateProgram(id, attributes);
    if (result.error) return { data: null, error: result.error };
    const updated = toProgram(result.data);
    setResponse((previous) => previous?.id === id
      ? { id, result: { data: updated, error: null } }
      : previous);
    return { data: updated, error: null };
  }

  const current = response?.id === id ? response.result : undefined;
  const error = current?.error ?? null;
  return {
    program: current?.data ?? undefined,
    loading: validId && !current, error, updateProgram,
    notFound: !validId || (axios.isAxiosError(error) && error.response?.status === 404),
  };
}
