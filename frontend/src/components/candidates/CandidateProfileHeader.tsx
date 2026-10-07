import { Link } from "react-router-dom";
import { Mail, MapPin } from "lucide-react";
import BackLink from "../BackLink";
import type { Application, NormalizedApplication } from "../../types/application";
import type { Program } from "../../types/program";

interface CandidateProfileHeaderProps {
  application: Application;
  program: Program;
  normalized: NormalizedApplication | null;
}

export default function CandidateProfileHeader({ application, program, normalized }: CandidateProfileHeaderProps) {
  const { candidate } = application;
  const initials = candidate.name.split(" ").map((part) => part[0]).slice(0, 2).join("");
  return (<>
      <nav aria-label="Fil d’Ariane" className="mb-6 flex flex-wrap gap-2 text-sm text-slate-500"><Link to="/app/programs" className="hover:text-blue-600">Programmes</Link><span aria-hidden="true">/</span><Link to={`/app/programs/${program.id}`} className="hover:text-blue-600">{program.name}</Link><span aria-hidden="true">/</span><span>Profil candidat</span></nav>
      <header className="flex flex-wrap items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <span aria-hidden="true" className="flex size-20 shrink-0 items-center justify-center rounded-full bg-violet-100 text-2xl font-medium text-violet-600">{initials}</span>
          <div><div className="flex flex-wrap items-center gap-3"><h1 className="text-3xl font-semibold tracking-tight">{candidate.name}</h1></div>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-500"><span className="flex items-center gap-2 break-all"><Mail size={16} aria-hidden="true" />{candidate.email ?? "Email non fourni"}</span>{normalized?.location && <span className="flex items-center gap-2"><MapPin size={16} aria-hidden="true" />{normalized.location}</span>}</div>
          </div>
        </div>
        <BackLink to={`/app/programs/${program.id}`} label="Retour au programme" />
      </header>
  </>);
}
