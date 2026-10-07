import { useState } from "react";
import type {
  Program,
  ProgramSortOrder,
  ProgramStatusFilter,
} from "../types/program";

// Match accents as well as capitalization when searching French program names.
function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr");
}

export function useProgramsTable(programs: Program[]) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ProgramStatusFilter>("all");
  const [sortOrder, setSortOrder] = useState<ProgramSortOrder>("updated");

  const visiblePrograms = programs
    .filter(
      (program) =>
        (status === "all" || program.status === status) &&
        normalizeSearch(program.name).includes(normalizeSearch(search.trim())),
    )
    .sort((a, b) => {
      switch (sortOrder) {
        case "name":
          return a.name.localeCompare(b.name, "fr");
        case "candidates":
          return b.candidates - a.candidates || a.name.localeCompare(b.name, "fr");
        case "updated":
          return b.updatedAt.localeCompare(a.updatedAt) || a.name.localeCompare(b.name, "fr");
      }
    });

  return {
    visiblePrograms,
    search,
    setSearch,
    status,
    setStatus,
    sortOrder,
    setSortOrder,
  };
}
