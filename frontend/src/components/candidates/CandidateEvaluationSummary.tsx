import { Trophy } from "lucide-react";
import type { Application, ApplicationDetail } from "../../types/application";

interface CandidateEvaluationSummaryProps {
  application: Application;
  detail?: ApplicationDetail;
}

export default function CandidateEvaluationSummary({ application, detail }: CandidateEvaluationSummaryProps) {
  return (
      <div className="grid gap-5">
        <section className="rounded-lg border border-slate-200 bg-white p-6"><div className="flex items-start gap-4"><span className="rounded-lg bg-blue-50 p-3 text-blue-600"><Trophy size={28} aria-hidden="true" /></span><div><h2 className="text-sm text-slate-500">Score global</h2><p className="mt-2 text-3xl font-semibold">{application.score === null ? "Non évalué" : `${application.score} / 100`}</p></div></div><p className="mt-4 text-sm leading-6 text-slate-500">{detail?.evaluationSummary ?? (application.status === "failed" ? "L’évaluation a échoué. Consultez les détails du traitement." : application.score === null ? "Le score sera disponible après le traitement de la candidature." : "Les explications de l’évaluation ne sont pas encore disponibles.")}</p></section>
      </div>
  );
}
