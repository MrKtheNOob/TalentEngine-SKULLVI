import type { ProgramSortOrder } from "../../types/program";

interface ProgramsTableControlsProps {
  search: string;
  sortOrder: ProgramSortOrder;
  onSearchChange: (value: string) => void;
  onSortOrderChange: (value: ProgramSortOrder) => void;
}

const controlClassName =
  "rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600";

export default function ProgramsTableControls({
  search, sortOrder, onSearchChange, onSortOrderChange,
}: ProgramsTableControlsProps) {
  return (
        <div className="flex flex-wrap items-end gap-4 border-b border-slate-200 p-5">
          <label className="flex min-w-0 flex-1 basis-64 flex-col gap-2 text-sm font-medium text-slate-600">
            Rechercher
            <input
              type="search"
              placeholder="Rechercher un programme…"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              className={controlClassName}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
            Trier par
            <select value={sortOrder} onChange={(event) => onSortOrderChange(event.target.value as ProgramSortOrder)} className={controlClassName}>
              <option value="updated">Mise à jour récente</option>
              <option value="name">Nom (A–Z)</option>
              <option value="candidates">Nombre de candidats</option>
            </select>
          </label>
        </div>

  );
}
