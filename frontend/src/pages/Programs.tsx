import { useState } from "react";
import Dialog from "../components/Dialog";
import CreateProgramForm from "../components/programs/CreateProgramForm";
import { Archive, Layers, Plus, Users } from "lucide-react";
import Button from "../components/Button";
import KPICard from "../components/KPICard";
import ProgramsTable from "../components/programs/ProgramsTable";
import { usePrograms } from "../hooks/usePrograms";

export default function Programs() {
  const [creationOpen, setCreationOpen] = useState(false);
  const { programs, activeCount, closedCount, candidateCount, createProgram } = usePrograms();
  const kpiData = [
    { icon: Layers, tone: "blue" as const, title: "Programmes actifs", count: activeCount },
    { icon: Archive, tone: "slate" as const, title: "Programmes fermés", count: closedCount },
    { icon: Users, tone: "emerald" as const, title: "Total des candidats", count: candidateCount },
  ];
  return (
    <>
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Programmes</h1>
          <p className="mt-2 text-slate-500">Gérez vos programmes et suivez les candidatures.</p>
        </div>
        <Button onClick={() => setCreationOpen(true)}>
          <Plus size={18} aria-hidden="true" className="mr-2" />
          Créer un programme
        </Button>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {kpiData.map((kpi) => (
          <KPICard key={kpi.title} title={kpi.title} count={kpi.count} icon={kpi.icon} tone={kpi.tone} />
        ))}
      </div>

      <ProgramsTable programs={programs} />
      {creationOpen && <Dialog title="Créer un programme" onClose={() => setCreationOpen(false)}>
        <CreateProgramForm onCancel={() => setCreationOpen(false)} onCreate={(attributes) => { createProgram(attributes); setCreationOpen(false); }} />
      </Dialog>}
    </>
  );
}
