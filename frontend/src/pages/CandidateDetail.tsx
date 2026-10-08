import { useParams } from "react-router-dom";
import DataStatus from "../components/DataStatus";
import BackLink from "../components/BackLink";
import CandidateProfileHeader from "../components/candidates/CandidateProfileHeader";
import CandidateEvaluationSummary from "../components/candidates/CandidateEvaluationSummary";
import CandidateApplicationDetails from "../components/candidates/CandidateApplicationDetails";
import CandidateScoreBreakdown from "../components/candidates/CandidateScoreBreakdown";
import CandidateProcessingDetails from "../components/candidates/CandidateProcessingDetails";
import { useApplicationDetail } from "../hooks/useApplicationDetail";

export default function CandidateDetail() {
  const { programId, applicationId } = useParams();
  const { application, program, processing, loading, error } = useApplicationDetail(programId, applicationId);
  if (loading || error) return <DataStatus loading={loading} error={error} />;
  if (!application || !program || !processing) return <section className="rounded-lg border border-slate-200 bg-white p-6">
    <h1 className="mb-4 text-2xl font-semibold">Candidature introuvable</h1>
    <BackLink to="/app/programs" label="Retour aux programmes" />
  </section>;
  const metadata = processing.normalization_metadata;
  const detail = {
    normalized: null,
    source: metadata?.source ?? "Non disponible",
    normalization: metadata?.confidence !== undefined ? `Confiance de l’extraction : ${Math.round(metadata.confidence * 100)} %` : "Informations de traitement non disponibles",
    evaluationSummary: application.score !== null ? "Moyenne pondérée des scores par critère. La décision finale reste humaine." : null,
    breakdown: (processing.score_breakdown ?? []).map((criterion) => ({
      criterionId: criterion.criterion_id, label: `${criterion.name} · poids ${criterion.weight}`,
      points: criterion.score, maxPoints: 100, explanation: criterion.reason,
    })),
  };

  return (
    <>
      <CandidateProfileHeader application={application} program={program} normalized={processing.normalized_data} />
      <CandidateEvaluationSummary application={application} detail={detail} />
      <div className="appearance-group mt-5 grid items-start gap-5 lg:grid-cols-2">
        <div className="appearance-group space-y-5">
          <CandidateScoreBreakdown breakdown={detail.breakdown} />
          <CandidateProcessingDetails application={application} detail={detail} normalized={processing.normalized_data} />
        </div>
        <CandidateApplicationDetails application={application} normalized={processing.normalized_data} />
      </div>
    </>
  );
}
