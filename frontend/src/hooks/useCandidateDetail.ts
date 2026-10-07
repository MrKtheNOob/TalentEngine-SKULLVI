import { mockApplications } from "../data/applications";
import { mockApplicationDetails } from "../data/applicationDetails";
import { useProgram } from "./usePrograms";

export function useCandidateDetail(programId: string | undefined, candidateId: string | undefined) {
  const program = useProgram(programId);
  const application = mockApplications.find((item) => item.programId === Number(programId) && item.candidate.id === Number(candidateId));
  const detail = application ? mockApplicationDetails[application.id] : undefined;
  return { program, application, detail };
}
