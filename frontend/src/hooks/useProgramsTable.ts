import { useState } from "react";
import type { ProgramSortOrder } from "../types/program";
import { usePrograms } from "./usePrograms";

export function useProgramsTable(refreshKey: number) {
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<ProgramSortOrder>("updated");
  const { programs, loading, error } = usePrograms({ search, sort: sortOrder }, refreshKey);
  return { visiblePrograms: programs, loading, error, search, setSearch, sortOrder, setSortOrder };
}
