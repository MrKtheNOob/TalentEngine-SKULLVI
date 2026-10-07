import { processingLabels } from "../../data/applicationLabels";
import type { ProcessingStatus } from "../../types/application";

const labels = processingLabels;
const colors = {
  received: "bg-slate-100 text-slate-600", processing: "bg-blue-50 text-blue-600",
  ready: "bg-emerald-100 text-emerald-700", needs_review: "bg-amber-100 text-amber-700",
  failed: "bg-red-100 text-red-600",
};

export default function ApplicationBadge({ value }: { value: ProcessingStatus }) {
  return <span className={`inline-flex items-center gap-1  rounded-full px-1.5 py-1 text-xs font-medium ${colors[value]}`}><span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-current" />{labels[value]}</span>;
}
