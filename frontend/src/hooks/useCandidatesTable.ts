import { useState } from "react";
import type { Application, ProcessingStatus } from "../types/application";

export function useCandidatesTable(applications: Application[]) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ProcessingStatus | "all">("all");
  const [sortOrder, setSortOrder] = useState<"score" | "recent">("score");
  const rankedApplications = [...applications].sort((a, b) => (b.score ?? -1) - (a.score ?? -1) || a.id - b.id);
  const ranks = new Map(rankedApplications.filter((application) => application.score !== null).map((application, index) => [application.id, index + 1]));
  const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr");
  const query = normalize(search.trim());
  const visibleApplications = rankedApplications.filter((application) =>
    (status === "all" || application.status === status) && normalize(`${application.candidate.name} ${application.candidate.email ?? ""}`).includes(query),
  );
  if (sortOrder === "recent") visibleApplications.sort((a, b) => b.appliedAt.localeCompare(a.appliedAt) || a.id - b.id);
  return { search, setSearch, status, setStatus, sortOrder, setSortOrder, visibleApplications, ranks };
}
