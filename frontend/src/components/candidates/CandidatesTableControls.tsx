import type { ProcessingStatus } from "../../types/application";
import { processingLabels } from "../../data/applicationLabels";

interface CandidatesTableControlsProps {
  search: string;
  status: ProcessingStatus | "all";
  sortOrder: "score" | "recent";
  onSearchChange: (value: string) => void;
  onStatusChange: (value: ProcessingStatus | "all") => void;
  onSortOrderChange: (value: "score" | "recent") => void;
}

const controlClass =
  "min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus-visible:outline-2 focus-visible:outline-blue-600";
export default function CandidatesTableControls({ search, status, sortOrder, onSearchChange, onStatusChange, onSortOrderChange }: CandidatesTableControlsProps) {
  return (
        <div className="flex flex-wrap gap-3 border-b border-slate-200 p-4">
          <label className="flex min-w-0 flex-1 basis-48 flex-col gap-2 text-xs text-slate-600">
            Rechercher
            <input
              type="search"
              placeholder="Nom ou email…"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              className={controlClass}
            />
          </label>
          <label className="flex flex-col gap-2 text-xs text-slate-600">
            Statut
            <select
              value={status}
              onChange={(event) =>
                onStatusChange(event.target.value as ProcessingStatus | "all")
              }
              className={controlClass}
            >
              <option value="all">Tous les statuts</option>
              {Object.entries(processingLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-xs text-slate-600">
            Trier par
            <select
              value={sortOrder}
              onChange={(event) =>
                onSortOrderChange(event.target.value as "score" | "recent")
              }
              className={controlClass}
            >
              <option value="score">Score décroissant</option>
              <option value="recent">Date récente</option>
            </select>
          </label>
        </div>
  );
}
