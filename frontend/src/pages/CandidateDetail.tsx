import { useParams } from "react-router-dom";
import BackLink from "../components/BackLink";
import CandidateProfileHeader from "../components/candidates/CandidateProfileHeader";
import CandidateEvaluationSummary from "../components/candidates/CandidateEvaluationSummary";
import CandidateApplicationDetails from "../components/candidates/CandidateApplicationDetails";
import CandidateScoreBreakdown from "../components/candidates/CandidateScoreBreakdown";
import CandidateProcessingDetails from "../components/candidates/CandidateProcessingDetails";
import { useCandidateDetail } from "../hooks/useCandidateDetail";

export default function CandidateDetail() {
  const { programId, candidateId } = useParams();
  const { application, program, detail } = useCandidateDetail(
    programId,
    candidateId,
  );

  if (!application || !program || !detail) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h1 className="mb-4 text-2xl font-semibold">Candidature introuvable</h1>
        <BackLink to="/app/programs" label="Retour aux programmes" />
      </section>
    );
  }

  return (
    <>
      <CandidateProfileHeader
        application={application}
        program={program}
        normalized={detail.normalized}
      />
     
      <CandidateEvaluationSummary application={application} detail={detail} />
      <div className="mt-5 grid items-start gap-5 lg:grid-cols-2">
        <div className="space-y-5">
          <CandidateScoreBreakdown breakdown={detail.breakdown} />
          <CandidateProcessingDetails
            application={application}
            detail={detail}
          />
        </div>
        <CandidateApplicationDetails
          application={application}
          normalized={detail.normalized}
        />
      </div>
    </>
  );
}
