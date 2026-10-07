import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import type { ScoringCriterion } from "../../types/configuration";
import ScoreTierSelect from "./ScoreTierSelect";

const inputClass = "min-w-0 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-blue-600";
const addClass = "mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100";

interface CriterionValuesEditorProps {
  criterion: ScoringCriterion;
  onChange: (criterion: ScoringCriterion) => void;
}

export default function CriterionValuesEditor({ criterion, onChange }: CriterionValuesEditorProps) {
  const [newOption, setNewOption] = useState("");

  function addPreferredOption() {
    const label = newOption.trim();
    if (!label || criterion.options.some((option) => option.label.toLocaleLowerCase("fr") === label.toLocaleLowerCase("fr"))) return;
    onChange({ ...criterion, options: [...criterion.options, { id: crypto.randomUUID(), label, scoreTier: "high" }] });
    setNewOption("");
  }

  function renderRanges() {
    return criterion.ranges.map((range, index) => (
      <div key={range.id} className="grid items-center gap-2 sm:grid-cols-[1fr_auto_1fr_1fr_auto]">
        <input type="number" step="any" required aria-label={`Plage ${index + 1} : minimum inclus`} value={range.min ?? ""} onChange={(event) => onChange({ ...criterion, ranges: criterion.ranges.map((item) => item.id === range.id ? { ...item, min: event.target.value === "" ? null : Number(event.target.value) } : item) })} className={inputClass} />
        <span className="text-sm text-slate-500">à</span>
        <input type="number" step="any" aria-label={`Plage ${index + 1} : maximum exclu, vide pour sans limite`} placeholder="Sans limite" value={range.max ?? ""} onChange={(event) => onChange({ ...criterion, ranges: criterion.ranges.map((item) => item.id === range.id ? { ...item, max: event.target.value === "" ? null : Number(event.target.value) } : item) })} className={inputClass} />
        <ScoreTierSelect value={range.scoreTier} label={`Score de la plage ${index + 1}`} onChange={(scoreTier) => onChange({ ...criterion, ranges: criterion.ranges.map((item) => item.id === range.id ? { ...item, scoreTier } : item) })} />
        <button type="button" aria-label={`Supprimer la plage ${index + 1}`} onClick={() => onChange({ ...criterion, ranges: criterion.ranges.filter((item) => item.id !== range.id) })} className="rounded p-2 text-red-600 hover:bg-red-100"><Trash2 size={16} aria-hidden="true" /></button>
      </div>
    ));
  }

  function renderSelectOptions() {
    return criterion.options.map((option, index) => (
      <div key={option.id} className="grid items-center gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
        <input required aria-label={`Option ${index + 1}`} placeholder="Ex. Disponible immédiatement" value={option.label} onChange={(event) => onChange({ ...criterion, options: criterion.options.map((item) => item.id === option.id ? { ...item, label: event.target.value } : item) })} className={inputClass} />
        <ScoreTierSelect value={option.scoreTier} label={`Score de l’option ${index + 1}`} onChange={(scoreTier) => onChange({ ...criterion, options: criterion.options.map((item) => item.id === option.id ? { ...item, scoreTier } : item) })} />
        <button type="button" aria-label={`Supprimer l’option ${index + 1}`} onClick={() => onChange({ ...criterion, options: criterion.options.filter((item) => item.id !== option.id) })} className="rounded p-2 text-red-600 hover:bg-red-100"><Trash2 size={16} aria-hidden="true" /></button>
      </div>
    ));
  }

  switch (criterion.type) {
  case "number": {
    return (
      <section className="mt-4 space-y-3" aria-label="Plages de score">
        <h3 className="text-sm font-semibold">Plages de score</h3>
        <label className="block text-sm text-slate-600">Unité <input value={criterion.unit} placeholder="Ex. mois" onChange={(event) => onChange({ ...criterion, unit: event.target.value })} className={`${inputClass} mt-2`} /></label>
        <p className="text-xs text-slate-500">Minimum inclus, maximum exclu. Laissez le maximum vide pour une plage sans limite.</p>
        {renderRanges()}
        <button type="button" className={addClass} onClick={() => onChange({ ...criterion, ranges: [...criterion.ranges, { id: crypto.randomUUID(), min: null, max: null, scoreTier: "medium" }] })}><Plus size={16} aria-hidden="true" /> Ajouter une plage</button>
      </section>
    );
  }

  case "select": {
    return (
      <section className="mt-4 space-y-3" aria-label="Options de score">
        <h3 className="text-sm font-semibold">Options et niveaux de score</h3>
        {renderSelectOptions()}
        <button type="button" className={addClass} onClick={() => onChange({ ...criterion, options: [...criterion.options, { id: crypto.randomUUID(), label: "", scoreTier: "medium" }] })}><Plus size={16} aria-hidden="true" /> Ajouter une option</button>
      </section>
    );
  }

  case "multiselect": {
    return (
      <section className="mt-4" aria-label="Options préférées">
        <h3 className="text-sm font-semibold">Options préférées</h3>
        <p className="mt-1 text-xs text-slate-500">Ajoutez les compétences ou valeurs recherchées.</p>
        <div className="mt-3 flex flex-wrap gap-2 rounded-lg border border-slate-200 p-3">
          {criterion.options.map((option) => (
            <span key={option.id} className="inline-flex items-center gap-2 rounded bg-blue-50 px-2 py-1 text-sm text-blue-600">{option.label}<button type="button" aria-label={`Retirer ${option.label}`} onClick={() => onChange({ ...criterion, options: criterion.options.filter((item) => item.id !== option.id) })}><X size={14} aria-hidden="true" /></button></span>
          ))}
          <input aria-label="Nouvelle option préférée" placeholder="Ex. Python" value={newOption} onChange={(event) => setNewOption(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addPreferredOption(); } }} className="min-w-0 flex-1 rounded px-2 py-1 text-sm focus-visible:outline-2 focus-visible:outline-blue-600" />
          <button type="button" onClick={addPreferredOption} className="rounded px-2 text-sm font-medium text-blue-600">Ajouter</button>
        </div>
      </section>
    );
  }

  case "text":
    return null;
  }
}
