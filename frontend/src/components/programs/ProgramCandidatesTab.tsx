import type { Application } from "../../types/application";
import DataStatus from "../DataStatus";
import CandidatesTableControls from "../candidates/CandidatesTableControls";
import CandidateScoringSidebar from "../candidates/CandidateScoringSidebar";
import type { ProgramConfiguration } from "../../types/configuration";
import { useCandidatesTable } from "../../hooks/useCandidatesTable";
import CandidateRow from "../candidates/CandidateRow";

type CandidateApplicationsTableProps = {
  visibleApplications: Application[];
  totalApplications: number;
};

function CandidateApplicationsTable({
  visibleApplications,
  totalApplications,
}: CandidateApplicationsTableProps) {
  const columnLabels = ["Rang", "Candidat", "Score", "Statut", "Date", "Action"];

  return (
    <div className="overflow-x-auto">
      <table className="w-full table-fixed text-left text-xs">
        <caption className="sr-only">
          Classement des candidatures du programme
        </caption>
        <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-600">
          <tr>
            {columnLabels.map((label) => (
              <th
                key={label}
                scope="col"
                className={`px-1 py-4 font-medium ${label === "Candidat" ? "w-[30%] text-left" : label === "Rang" || label === "Score" || label === "Action" ? "w-[8%] text-center" : "text-center"}`}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {visibleApplications.length > 0 ? (
            visibleApplications.map((application) => (
              <CandidateRow
                key={application.id}
                application={application}
                rank={application.rank ?? undefined}
              />
            ))
          ) : (
            <tr>
              <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                {totalApplications === 0
                  ? "Aucune candidature pour ce programme."
                  : "Aucun candidat ne correspond à ces filtres."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

interface ProgramCandidatesTabProps {
  programId: number;
  refreshKey: number;
  configuration: ProgramConfiguration | null;
  totalApplications: number;
}

export default function ProgramCandidatesTab({
  programId,
  refreshKey,
  configuration,
  totalApplications,
}: ProgramCandidatesTabProps) {
  const {
    search,
    setSearch,
    status,
    setStatus,
    sortOrder,
    setSortOrder,
    visibleApplications,
    loading,
    error,
  } = useCandidatesTable(programId, refreshKey);
  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_220px] 2xl:grid-cols-[minmax(0,1fr)_260px]">
      <section
        aria-label="Candidats du programme"
        className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white"
      >
        <CandidatesTableControls
          search={search}
          status={status}
          sortOrder={sortOrder}
          onSearchChange={setSearch}
          onStatusChange={setStatus}
          onSortOrderChange={setSortOrder}
        />
        <DataStatus loading={loading} error={error} />
        {!loading && !error && <>
        <CandidateApplicationsTable
          visibleApplications={visibleApplications}
          totalApplications={totalApplications}
        />
        <p
          aria-live="polite"
          className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500"
        >
          {visibleApplications.length} sur {totalApplications} candidatures
          affichées
        </p>
        </>}
      </section>
      <CandidateScoringSidebar configuration={configuration} />
    </div>
  );
}
