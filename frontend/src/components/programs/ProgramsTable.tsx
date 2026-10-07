import DataStatus from "../DataStatus";
import type { Program } from "../../types/program";
import { useProgramsTable } from "../../hooks/useProgramsTable";
import ProgramsTableControls from "./ProgramsTableControls";
import ProgramRow from "./ProgramRow";

interface ProgramsTableProps {
  programs: Program[];
}

export default function ProgramsTable({ programs }: ProgramsTableProps) {
  const { visiblePrograms, search, setSearch, sortOrder, setSortOrder, loading, error } = useProgramsTable(programs.length);

  return (
      <section aria-label="Liste des programmes" className="mt-8 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <ProgramsTableControls
          search={search}
          sortOrder={sortOrder}
          onSearchChange={setSearch}
          onSortOrderChange={setSortOrder}
        />

        <DataStatus loading={loading} error={error} />
        {!loading && !error && <>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <caption className="sr-only">Programmes, nombres de candidats et dates de mise à jour</caption>
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr>
                <th scope="col" className="px-6 py-4 font-medium">Nom</th>
                <th scope="col" className="px-6 py-4 text-right font-medium">Candidats</th>
                <th scope="col" className="px-6 py-4 font-medium">Dernière mise à jour</th>
                <th scope="col" className="px-6 py-4 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {visiblePrograms.map((program) => (
                <ProgramRow key={program.id} program={program} />
              ))}
              {visiblePrograms.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    Aucun programme ne correspond à votre recherche. Essayez un autre nom.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p aria-live="polite" className="border-t border-slate-200 px-6 py-3 text-sm text-slate-500">
          {visiblePrograms.length} sur {programs.length} programmes affichés
        </p>
        </>}
      </section>
  );
}
