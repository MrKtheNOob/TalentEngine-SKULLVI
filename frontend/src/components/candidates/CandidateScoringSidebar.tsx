import { Settings, Info } from "lucide-react";
import type { ProgramConfiguration } from "../../types/configuration";

const priorities = { low: "Faible", medium: "Moyenne", high: "Haute" };

export default function CandidateScoringSidebar({ configuration }: { configuration: ProgramConfiguration | null }) {
  return (
      <aside className="space-y-4">
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="flex items-center gap-2 font-semibold">
            <Settings size={20} className="text-blue-600" aria-hidden="true" />{" "}
            Configuration du scoring
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Priorités de la configuration sauvegardée.
          </p>
          <ul className="mt-4 divide-y divide-slate-200 text-sm">
            {configuration?.criteria.map((criterion) => (
              <li
                key={criterion.id}
                className="flex justify-between gap-3 py-3"
              >
                <span>{criterion.name}</span>
                <span className="text-blue-600">
                  {priorities[criterion.priority]}
                </span>
              </li>
            ))}
          </ul>
          {!configuration && (
            <p className="mt-4 text-sm text-slate-500">
              Aucune configuration sauvegardée.
            </p>
          )}
        </section>
        <div className="rounded-lg bg-blue-50 p-5 text-sm leading-6 text-slate-600">
          <Info size={20} className="mb-2 text-blue-600" aria-hidden="true" />
          Les candidatures sont classées par score. Un score absent est affiché
          « — ». Les données manquantes ou ambiguës nécessitent une vérification.
          Un score faible ne provoque aucun rejet : la sélection reste humaine.
        </div>
      </aside>  );
}
