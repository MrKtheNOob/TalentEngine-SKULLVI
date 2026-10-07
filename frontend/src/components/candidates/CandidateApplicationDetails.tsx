import { FileText, Mail, GraduationCap, Code, Briefcase, Calendar, Link as LinkIcon, Heart, ExternalLink } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { Application, NormalizedApplication } from "../../types/application";

function DetailField({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: ReactNode }) {
  return (
    <div className="grid gap-3 py-4 sm:grid-cols-[150px_minmax(0,1fr)]">
      <dt className="flex items-center gap-3 text-sm text-slate-500"><Icon size={18} aria-hidden="true" className="shrink-0" />{label}</dt>
      <dd className="min-w-0 break-words text-sm leading-6 text-slate-950">{children}</dd>
    </div>
  );
}

export default function CandidateApplicationDetails({ application, normalized }: { application: Application; normalized: NormalizedApplication | null }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
      <h2 className="mb-2 text-lg font-semibold">Détails de la candidature</h2>
      {!normalized && <p className="my-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-500">Informations extraites non disponibles.</p>}
      <dl className="divide-y divide-slate-200 border-t border-slate-200">
        <DetailField icon={FileText} label="CV">
          {application.cvUrl ? <a href={application.cvUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-blue-600 hover:underline">Ouvrir le CV fictif <ExternalLink size={14} aria-hidden="true" /></a> : "CV non fourni"}
          {application.cvUrl && <a href={application.cvUrl} download className="ml-4 text-blue-600 hover:underline">Télécharger</a>}
        </DetailField>
        <DetailField icon={Mail} label="Email">{application.candidate.email ?? "Non fourni"}</DetailField>
        <DetailField icon={GraduationCap} label="Formation">{normalized?.education ?? "Non fournie"}</DetailField>
        <DetailField icon={Code} label="Compétences">{normalized?.skills.length ? normalized.skills.join(", ") : "Non fournies"}</DetailField>
        <DetailField icon={Briefcase} label="Expérience">{normalized?.experience ?? "Non fournie"}</DetailField>
        <DetailField icon={LinkIcon} label="Portfolio">{normalized?.portfolioUrl ? <a href={normalized.portfolioUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Ouvrir le portfolio</a> : "Non fourni"}</DetailField>
        <DetailField icon={Calendar} label="Disponibilité">{normalized?.availability ?? "Non fournie"}</DetailField>
        {normalized?.motivation && <DetailField icon={Heart} label="Motivation">{normalized.motivation}</DetailField>}
      </dl>
    </section>
  );
}
