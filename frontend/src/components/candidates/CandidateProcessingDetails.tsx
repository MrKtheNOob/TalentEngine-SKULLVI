import type { Application, ApplicationDetail } from "../../types/application";
import ApplicationBadge from "./ApplicationBadge";

export default function CandidateProcessingDetails({ application, detail }: { application: Application; detail: ApplicationDetail }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
      <h2 className="text-lg font-semibold">Extraction et traitement</h2>
      <dl className="mt-4 divide-y divide-slate-200 text-sm">
        <div className="grid gap-2 py-3 sm:grid-cols-[130px_1fr]"><dt className="text-slate-500">Source</dt><dd>{detail.source}</dd></div>
        <div className="grid gap-2 py-3 sm:grid-cols-[130px_1fr]"><dt className="text-slate-500">Normalisation</dt><dd>{detail.normalization}</dd></div>
        <div className="grid gap-2 py-3 sm:grid-cols-[130px_1fr]"><dt className="text-slate-500">Statut</dt><dd><ApplicationBadge value={application.status} /></dd></div>
      </dl>
      {application.warnings.length > 0 && <div className="mt-4 rounded-lg bg-amber-100 p-4 text-sm text-amber-700"><h3 className="font-medium">Points à vérifier</h3><ul className="mt-2 space-y-2">{application.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></div>}
    </section>
  );
}
