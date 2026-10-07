import { mockApplications } from "../data/applications";

export function useProgramApplications(programId: number) {
  return mockApplications.filter((application) => application.programId === programId);
}
