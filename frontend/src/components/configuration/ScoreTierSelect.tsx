import type { PriorityTier } from "../../types/configuration";

const colors = {
  low: "bg-red-100 text-red-600",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-emerald-100 text-emerald-700",
};

interface ScoreTierSelectProps {
  value: PriorityTier;
  label: string;
  onChange: (value: PriorityTier) => void;
}

export default function ScoreTierSelect({ value, label, onChange }: ScoreTierSelectProps) {
  return (
    <select aria-label={label} value={value} onChange={(event) => onChange(event.target.value as PriorityTier)} className={`rounded-lg border border-slate-200 px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-blue-600 ${colors[value]}`}>
      <option value="low">Score faible</option>
      <option value="medium">Score moyen</option>
      <option value="high">Score élevé</option>
    </select>
  );
}
