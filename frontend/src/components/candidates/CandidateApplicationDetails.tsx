import { ExternalLink } from "lucide-react";
import type { Application } from "../../types/application";

const labels: Record<string, string> = {
  education: "Formation", skills: "Compétences", experience: "Expérience",
  availability: "Disponibilité", motivation: "Motivation", location: "Localisation",
};

function displayFact(value: unknown): string {
  if (value === null || value === undefined) return "Non fourni";
  if (Array.isArray(value)) return value.map(displayFact).join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export default function CandidateApplicationDetails({ application, normalized }: { application: Application; normalized: Record<string, unknown> | null }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
      <h2 className="mb-2 text-lg font-semibold">Détails de la candidature</h2>
      <dl className="divide-y divide-slate-200 border-t border-slate-200 text-sm">
        <div className="grid gap-2 py-4 sm:grid-cols-[130px_1fr]">
          <dt className="text-slate-500">CV</dt>
          <dd>{application.cvUrl ? <a href={application.cvUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-blue-600 hover:underline">Ouvrir le CV <ExternalLink size={14} aria-hidden="true" /></a> : "CV non fourni"}</dd>
        </div>
        <div className="grid gap-2 py-4 sm:grid-cols-[130px_1fr]"><dt className="text-slate-500">Email</dt><dd className="break-all">{application.email ?? "Non fourni"}</dd></div>
        <div className="grid gap-2 py-4 sm:grid-cols-[130px_1fr]">
          <dt className="text-slate-500">Portfolio</dt>
          <dd>{application.portfolioUrl ? <a href={application.portfolioUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Ouvrir le portfolio</a> : "Non fourni"}</dd>
        </div>
        {Object.entries(normalized ?? {}).map(([key, value]) => (
          <div key={key} className="grid gap-2 py-4 sm:grid-cols-[130px_1fr]">
            <dt className="break-words text-slate-500">{labels[key] ?? key.replaceAll("_", " ")}</dt>
            <dd className="min-w-0 whitespace-pre-wrap break-words leading-6">{displayFact(value)}</dd>
          </div>
        ))}
      </dl>
      {!normalized && <p className="mt-3 text-sm text-slate-500">Informations extraites non disponibles.</p>}
    </section>
  );
}
