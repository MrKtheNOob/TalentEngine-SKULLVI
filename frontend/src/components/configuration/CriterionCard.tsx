import CriterionValuesEditor from "./CriterionValuesEditor";
import { Trash2 } from "lucide-react";
import type { CriterionType, PriorityTier, ScoringCriterion } from "../../types/configuration";

const inputClass = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-blue-600";
const labelClass = "flex flex-col gap-2 text-sm font-medium text-slate-600";

interface CriterionCardProps {
  criterion: ScoringCriterion;
  index: number;
  onChange: (criterion: ScoringCriterion) => void;
  onRemove: () => void;
}

export default function CriterionCard({ criterion, index, onChange, onRemove }: CriterionCardProps) {

  return (
    <fieldset className="min-w-0 rounded-lg border border-slate-200 p-4">
      <legend className="px-1 text-sm font-semibold">Critère {index + 1}</legend>
      <div className="mb-3 flex justify-end">
        <button type="button" onClick={onRemove} aria-label={`Supprimer le critère ${index + 1}`} className="rounded p-2 text-red-600 hover:bg-red-100 focus-visible:outline-2 focus-visible:outline-blue-600">
          <Trash2 size={16} aria-hidden="true" />
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className={labelClass}>
          Nom du critère
          <input required value={criterion.name} onChange={(event) => onChange({ ...criterion, name: event.target.value })} className={inputClass} />
        </label>
        <label className={labelClass}>
          Type
          <select value={criterion.type} onChange={(event) => onChange({ ...criterion, type: event.target.value as CriterionType, options: [], ranges: [], unit: "" })} className={inputClass}>
            <option value="number">Nombre</option>
            <option value="text">Texte</option>
            <option value="select">Sélection unique</option>
            <option value="multiselect">Sélection multiple</option>
          </select>
        </label>
        <label className={labelClass}>
          Priorité
          <select value={criterion.priority} onChange={(event) => onChange({ ...criterion, priority: event.target.value as PriorityTier })} className={inputClass}>
            <option value="low">Faible</option>
            <option value="medium">Moyenne</option>
            <option value="high">Haute</option>
          </select>
        </label>
      </div>
      <CriterionValuesEditor key={criterion.type} criterion={criterion} onChange={onChange} />
      {criterion.type === "text" && <label className={`${labelClass} mt-4`}>
        Consignes d’évaluation
        <textarea rows={3} value={criterion.guidance} onChange={(event) => onChange({ ...criterion, guidance: event.target.value })} placeholder="Précisez ce qui doit être évalué et ce qui constitue un bon résultat." className={inputClass} />
      </label>}
    </fieldset>
  );
}
