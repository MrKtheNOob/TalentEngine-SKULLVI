import { useState } from "react";
import type { ProcessingStatus } from "../types/application";
import { useProgramApplications } from "./useProgramApplications";

export function useCandidatesTable(programId: number, refreshKey = 0) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ProcessingStatus | "all">("all");
  const [sortOrder, setSortOrder] = useState<"score" | "recent">("score");
  const { applications, loading, error } = useProgramApplications(programId, { search, status, sort: sortOrder }, refreshKey);
  return { search, setSearch, status, setStatus, sortOrder, setSortOrder, visibleApplications: applications, loading, error };
}
