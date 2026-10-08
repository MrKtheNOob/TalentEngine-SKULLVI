import { ListChecks } from "lucide-react";
import { Link } from "react-router-dom";
import type { ImportJob, JobStatus, ScoringJob } from "../../types/job";
import type { Program } from "../../types/program";
import DataStatus from "../DataStatus";

const labels: Record<JobStatus, string> = {
  pending: "En attente", running: "En cours", completed: "Terminé", failed: "Échec",
};
const tones: Record<JobStatus, string> = {
  pending: "bg-slate-100 text-slate-600", running: "bg-blue-50 text-blue-600",
  completed: "bg-emerald-100 text-emerald-700", failed: "bg-red-100 text-red-600",
};

function JobBadge({ status }: { status: JobStatus }) {
  return <span className={`rounded-full px-3 py-1 text-xs font-medium ${tones[status]}`}>{labels[status]}</span>;
}

function ImportJobCard({ job, programName }: { job: ImportJob; programName: string }) {
  return (
    <article className="py-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="break-all text-sm font-medium">{job.filename} <span className="text-slate-400">#{job.id}</span></h3>
          <Link to={`/app/programs/${job.program_id}`} className="mt-1 inline-block text-sm text-blue-600 hover:underline">{programName}</Link>
        </div>
        <JobBadge status={job.status} />
      </div>
      <progress max={job.total} value={job.processed} aria-label={`Progression de l’import ${job.id}`} className="mt-4 h-2 w-full [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-slate-100 [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-blue-600 [&::-moz-progress-bar]:bg-blue-600" />
      <p className="mt-2 text-xs text-slate-500">{job.processed} / {job.total} traitées · {job.successful} importées · {job.failed} en échec</p>
      {job.error && <p className="mt-3 text-sm text-red-600">{job.error}</p>}
      {job.row_errors.length > 0 && <details className="mt-3 text-sm text-amber-700">
        <summary className="cursor-pointer">Voir les lignes en échec</summary>
        <ul className="mt-2 space-y-2">{job.row_errors.map((failure) => <li key={failure.row}>Candidature {failure.row} : {failure.error}</li>)}</ul>
      </details>}
    </article>
  );
}

type Props = { jobs: ImportJob[]; scoringJobs: ScoringJob[]; programs: Program[]; loading: boolean; error: Error | null };

export default function ImportJobsPanel({ jobs, scoringJobs, programs, loading, error }: Props) {
  return (
    <section aria-labelledby="import-jobs-title" className="rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-6 py-5">
        <h2 id="import-jobs-title" className="text-lg font-semibold">Suivi des traitements</h2>
        <p className="mt-1 text-sm text-slate-500">Progression actualisée toutes les trois secondes pendant les traitements.</p>
      </div>
      <div className="px-6 py-2">
        <DataStatus loading={loading} error={error} />
        {!loading && !error && jobs.length === 0 && scoringJobs.length === 0 && <div className="flex flex-col items-center py-10 text-center">
          <ListChecks size={28} aria-hidden="true" className="mb-3 text-slate-400" />
          <p className="text-sm text-slate-500">Aucun traitement pour le moment. Commencez par importer un fichier.</p>
        </div>}
        <div className="divide-y divide-slate-200">{jobs.map((job) => <ImportJobCard key={job.id} job={job} programName={programs.find((program) => program.id === job.program_id)?.name ?? `Programme #${job.program_id}`} />)}</div>
        {scoringJobs.length > 0 && <div className="border-t border-slate-200 py-5">
          <h3 className="mb-3 text-sm font-semibold">Évaluations</h3>
          <ul className="space-y-3">{scoringJobs.map((job) => <li key={job.id} className="rounded-lg bg-slate-50 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Link to={`/app/programs/${job.program_id}/applications/${job.application_id}`} className="text-sm text-blue-600 hover:underline">Candidature #{job.application_id} · Évaluation #{job.id}</Link>
              <JobBadge status={job.status} />
            </div>
            {job.error && <p className="mt-2 text-sm text-red-600">{job.error}</p>}
          </li>)}</ul>
        </div>}
      </div>
    </section>
  );
}
