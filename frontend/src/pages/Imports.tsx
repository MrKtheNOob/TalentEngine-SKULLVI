import FileImportForm from "../components/imports/FileImportForm";
import ImportJobsPanel from "../components/imports/ImportJobsPanel";
import { useImports } from "../hooks/useImports";
import { usePrograms } from "../hooks/usePrograms";

export default function Imports() {
  const { programs, loading, error } = usePrograms();

  const imports = useImports();

  return (
    <>
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Imports</h1>
        <p className="mt-2 text-slate-500">Rassemblez vos candidatures à partir de vos exports CSV et JSON.</p>
      </header>
      <div className="space-y-6">
        <FileImportForm programs={programs} loading={loading} error={error} onImport={imports.createImport} />
        <ImportJobsPanel jobs={imports.jobs} scoringJobs={imports.scoringJobs} programs={programs} loading={imports.loading} error={imports.error} />
      </div>
    </>
  );
}
