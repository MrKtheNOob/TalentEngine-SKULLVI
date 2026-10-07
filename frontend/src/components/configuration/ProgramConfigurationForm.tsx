import ConfigurationSidebar from "./ConfigurationSidebar";
import { useState, type SubmitEvent } from "react";
import { Plus } from "lucide-react";
import Button from "../Button";
import CriterionCard from "./CriterionCard";
import type { ProgramConfiguration, ScoringCriterion } from "../../types/configuration";

interface ProgramConfigurationFormProps {
  programId: number;
  configuration: ProgramConfiguration;
  onConfigurationChange: (configuration: ProgramConfiguration) => void;
  savedConfiguration: ProgramConfiguration | null;
  onSave: (configuration: ProgramConfiguration) => void;
}

export default function ProgramConfigurationForm({ programId, configuration, onConfigurationChange, savedConfiguration, onSave }: ProgramConfigurationFormProps) {
  const { criteria } = configuration;
  const [errors, setErrors] = useState<string[]>([]);
  const [savedMessage, setSavedMessage] = useState("");

  function updateCriteria(nextCriteria: ScoringCriterion[]) {
    onConfigurationChange({ ...configuration, criteria: nextCriteria });
    setErrors([]);
    setSavedMessage("");
  }

  function addCriterion() {
    updateCriteria([...criteria, {
      id: crypto.randomUUID(), name: "", type: "text", priority: "medium", guidance: "", options: [], ranges: [], unit: "",
    }]);
  }

  function saveConfiguration(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanedCriteria = criteria.map((criterion) => ({
      ...criterion,
      name: criterion.name.trim(),
      guidance: criterion.guidance.trim(),
      options: criterion.options.map((option) => ({ ...option, label: option.label.trim() })),
      unit: criterion.unit.trim(),
    }));
    const validationErrors: string[] = [];
    if (cleanedCriteria.length === 0) validationErrors.push("Ajoutez au moins un critère.");
    const names = new Set<string>();
    cleanedCriteria.forEach((criterion, index) => {
      const name = criterion.name.toLocaleLowerCase("fr");
      if (!name) validationErrors.push(`Critère ${index + 1} : indiquez un nom.`);
      else if (names.has(name)) validationErrors.push(`Critère ${index + 1} : ce nom est déjà utilisé.`);
      names.add(name);
      if (criterion.type === "text" && !criterion.guidance) validationErrors.push(`Critère ${index + 1} : précisez les consignes d’évaluation.`);
      const hasOptions = criterion.type === "select" || criterion.type === "multiselect";
      if (hasOptions && criterion.options.length === 0) validationErrors.push(`Critère ${index + 1} : ajoutez au moins une option.`);
      const uniqueOptions = new Set(criterion.options.map((option) => option.label.toLocaleLowerCase("fr")));
      if (criterion.options.some((option) => !option.label)) validationErrors.push(`Critère ${index + 1} : renseignez chaque option.`);
      if (criterion.type === "number") {
        if (criterion.ranges.length === 0) validationErrors.push(`Critère ${index + 1} : ajoutez une plage.`);
        const sortedRanges = [...criterion.ranges].sort((a, b) => (a.min ?? 0) - (b.min ?? 0));
        sortedRanges.forEach((range, rangeIndex) => {
          if (range.min === null || !Number.isFinite(range.min) || (range.max !== null && (!Number.isFinite(range.max) || range.max <= range.min))) validationErrors.push(`Critère ${index + 1}, plage ${rangeIndex + 1} : bornes invalides.`);
          const previous = sortedRanges[rangeIndex - 1];
          if (previous && (previous.max === null || (range.min !== null && range.min < previous.max))) validationErrors.push(`Critère ${index + 1} : les plages se chevauchent.`);
        });
      }
      if (uniqueOptions.size !== criterion.options.length) validationErrors.push(`Critère ${index + 1} : les options doivent être distinctes.`);
    });
    setErrors(validationErrors);
    if (validationErrors.length > 0) return;
    const cleanedConfiguration = { programId, criteria: cleanedCriteria };
    onSave(cleanedConfiguration);
    onConfigurationChange(cleanedConfiguration);
    setSavedMessage("Configuration enregistrée en mémoire pour cette démonstration. Elle sera perdue au rechargement.");
  }

  return (
    <form onSubmit={saveConfiguration} className="grid items-start gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <section className="min-w-0 rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">Configuration du programme</h2>
        <p className="mb-5 mt-2 text-sm leading-6 text-slate-500">Définissez les critères et leur priorité pour l’évaluation des candidatures.</p>
        
        <h3 className="mb-4 font-semibold">Critères de scoring</h3>
        <div className="space-y-4">
          {criteria.map((criterion, index) => (
            <CriterionCard key={criterion.id} criterion={criterion} index={index}
              onChange={(updated) => updateCriteria(criteria.map((item) => item.id === updated.id ? updated : item))}
              onRemove={() => updateCriteria(criteria.filter((item) => item.id !== criterion.id))} />
          ))}
          {criteria.length === 0 && <p className="rounded-lg bg-slate-50 p-5 text-sm text-slate-500">Aucun critère configuré. Ajoutez votre premier critère.</p>}
        </div>
        {errors.length > 0 && <ul role="alert" className="mt-4 space-y-1 rounded-lg bg-red-100 p-4 text-sm text-red-600">{errors.map((error) => <li key={error}>{error}</li>)}</ul>}
        <p role="status" className="mt-4 text-sm text-emerald-700">{savedMessage}</p>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5">
          <button type="button" onClick={addCriterion} className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100">
            <Plus size={16} aria-hidden="true" /> Ajouter un critère
          </button>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => { if (savedConfiguration) onConfigurationChange(structuredClone(savedConfiguration)); setErrors([]); setSavedMessage(""); }} className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">Annuler les modifications</button>
            <Button type="submit">Enregistrer</Button>
          </div>
        </div>
      </section>
      <ConfigurationSidebar configuration={configuration} savedConfiguration={savedConfiguration} />
    </form>
  );
}
