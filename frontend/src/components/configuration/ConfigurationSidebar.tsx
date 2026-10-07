import { FileText, ListChecks, Lightbulb } from "lucide-react";
import type { ProgramConfiguration } from "../../types/configuration";

const priorityColors = { low: "bg-slate-100 text-slate-600", medium: "bg-amber-100 text-amber-700", high: "bg-blue-50 text-blue-600" };

const priorityLabels = { low: "Faible", medium: "Moyenne", high: "Haute" };

interface ConfigurationSidebarProps {
  configuration: ProgramConfiguration;
  savedConfiguration: ProgramConfiguration | null;
}

export default function ConfigurationSidebar({ configuration, savedConfiguration }: ConfigurationSidebarProps) {
  const { criteria } = configuration;
  return (
      <aside className="min-w-0 space-y-5">
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="flex items-center gap-2 font-semibold"><FileText size={20} aria-hidden="true" className="text-blue-600" /> Résumé des critères</h2>
          <p className="mt-3 text-sm text-slate-500">{criteria.length} critères dans le formulaire</p>
          <ul className="mt-4 divide-y divide-slate-200 text-sm">
            {criteria.map((criterion, index) => <li key={criterion.id} className="flex justify-between gap-3 py-3"><span>{criterion.name || `Critère ${index + 1}`}</span><span className={`rounded px-2 py-1 ${priorityColors[criterion.priority]}`}>{priorityLabels[criterion.priority]}</span></li>)}
          </ul>
        </section>
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="flex items-center gap-2 font-semibold"><ListChecks size={20} aria-hidden="true" className="text-emerald-700" /> Vérifications avant sauvegarde</h2>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            <li>Au moins un critère, avec un nom distinct.</li>
            <li>Plages numériques valides et sans chevauchement.</li>
            <li>Options renseignées et distinctes pour les sélections.</li>
            <li>Consignes d’évaluation pour les critères textuels.</li>
          </ul>
        </section>
        <section className="rounded-lg border border-slate-200 bg-blue-50 p-5">
          <h2 className="flex items-center gap-2 font-semibold"><Lightbulb size={20} aria-hidden="true" className="text-amber-700" /> Conseils</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">La priorité indique l’importance du critère. Le niveau de score décrit la qualité d’une réponse ou d’une plage de valeurs. Gardez quelques critères clairs et pertinents pour le programme.</p>
        </section>
        {savedConfiguration && <details className="rounded-lg border border-slate-200 bg-white p-5"><summary className="cursor-pointer text-sm font-medium">JSON de la dernière sauvegarde locale</summary><pre className="mt-4 overflow-x-auto text-xs text-slate-600">{JSON.stringify(savedConfiguration, null, 2)}</pre></details>}
      </aside>  );
}
