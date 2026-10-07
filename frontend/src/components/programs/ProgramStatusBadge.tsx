import type { ProgramStatus } from "../../types/program";

const STATUS_LABELS = {
  Active: "Actif",
  Closed: "Fermé",
};
const STATUS_COLORS = {
  Active: "bg-emerald-100 text-emerald-700",
  Closed: "bg-slate-100 text-slate-600",
};
interface ProgramStatusBadgeProps {
  status: ProgramStatus;
}

export default function ProgramStatusBadge({ status }: ProgramStatusBadgeProps) {
  const colorClass = STATUS_COLORS[status];
  const label = STATUS_LABELS[status];

  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${colorClass}`}>
      <span aria-hidden="true" className="size-2 rounded-full bg-current" />
      {label}
    </span>
  );
}
