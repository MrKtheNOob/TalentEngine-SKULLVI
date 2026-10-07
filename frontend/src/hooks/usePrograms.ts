import { useSyncExternalStore } from "react";
import { mockPrograms } from "../data/programs";
import type { Program } from "../types/program";

// Small shared in-memory demo store; replace this access layer with the API later.
let programs: Program[] = [...mockPrograms];
const listeners = new Set<() => void>();
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
function getPrograms() { return programs; }

export function usePrograms() {
  const records = useSyncExternalStore(subscribe, getPrograms);

  function createProgram(attributes: { name: string; description: string }) {
    const program: Program = {
      ...attributes,
      id: Math.max(0, ...programs.map((item) => item.id)) + 1,
      status: "Active", candidates: 0, updatedAt: new Date().toISOString().slice(0, 10),
    };
    programs = [...programs, program];
    listeners.forEach((listener) => listener());
  }

  return {
    programs: records, createProgram,
    activeCount: records.filter((program) => program.status === "Active").length,
    closedCount: records.filter((program) => program.status === "Closed").length,
    candidateCount: records.reduce((total, program) => total + program.candidates, 0),
  };
}

export function useProgram(programId: string | undefined) {
  const records = useSyncExternalStore(subscribe, getPrograms);
  return records.find((program) => program.id === Number(programId));
}
