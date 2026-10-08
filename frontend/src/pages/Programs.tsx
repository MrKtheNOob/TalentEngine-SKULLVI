import { useState } from "react";
import DataStatus from "../components/DataStatus";
import Dialog from "../components/Dialog";
import CreateProgramForm from "../components/programs/CreateProgramForm";
import { Layers, Plus, Users } from "lucide-react";
import Button from "../components/Button";
import KPICard from "../components/KPICard";
import ProgramsTable from "../components/programs/ProgramsTable";
import { usePrograms } from "../hooks/usePrograms";

export default function Programs() {
  const [creationOpen, setCreationOpen] = useState(false);
  const { programs, candidateCount, createProgram, loading, error } = usePrograms();
  const kpiData = [
    { icon: Layers, tone: "blue" as const, title: "Programmes", count: programs.length },
    { icon: Users, tone: "emerald" as const, title: "Total des candidats", count: candidateCount },
  ];
  return (
    <>
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Programmes</h1>
          <p className="mt-2 text-slate-500">Gérez vos programmes et suivez les candidatures.</p>
        </div>
        <Button disabled={loading} onClick={() => setCreationOpen(true)}>
          <Plus size={18} aria-hidden="true" className="mr-2" />
          Créer un programme
        </Button>
      </header>

      <DataStatus loading={loading} error={error} />
      {!loading && !error && <>
      <div className="appearance-group grid grid-cols-1 gap-4 md:grid-cols-2">
        {kpiData.map((kpi) => (
          <KPICard key={kpi.title} title={kpi.title} count={kpi.count} icon={kpi.icon} tone={kpi.tone} />
        ))}
      </div>

      <ProgramsTable programs={programs} />
      </>}
      {creationOpen && <Dialog title="Créer un programme" onClose={() => setCreationOpen(false)}>
        <CreateProgramForm onCancel={() => setCreationOpen(false)} onCreate={async (attributes) => { const result = await createProgram(attributes); if (!result.error) setCreationOpen(false); return result; }} />
      </Dialog>}
    </>
  );
}
