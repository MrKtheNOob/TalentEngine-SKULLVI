import { AlertTriangle, Clock, FileWarning, Users } from "lucide-react";
import DataStatus from "../DataStatus";
import type { Result } from "../../types/result";
import type { ProgramUpdate } from "../../types/program";
import type { Program } from "../../types/program";
import { useProgramOverview } from "../../hooks/useProgramOverview";
import KPICard from "../KPICard";
import ProgramAttributesPanel from "./ProgramAttributesPanel";

export default function ProgramOverviewTab({ program, onSave }: { program: Program; onSave: (attributes: ProgramUpdate) => Promise<Result<Program>> }) {
  const { counts, loading, error } = useProgramOverview(program.id);
  return (
    <div className="space-y-6">
      <ProgramAttributesPanel program={program} onSave={onSave} />
      <DataStatus loading={loading} error={error} />
      {!loading && !error && counts && <section aria-label="Progression des candidatures">
        <h2 className="mb-4 text-lg font-semibold text-slate-950">Progression des candidatures</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KPICard title="Total des candidatures" count={counts.total} icon={Users} />
          <KPICard title="À examiner" count={counts.review} icon={AlertTriangle} tone="amber" />
          <KPICard title="En attente ou en traitement" count={counts.processing} icon={Clock} tone="slate" />
          <KPICard title="Échecs du traitement" count={counts.failed} icon={FileWarning} tone="amber" />
        </div>
        {counts.total === 0 && <p className="mt-4 text-sm text-slate-500">Aucune candidature pour ce programme.</p>}
      </section>}
    </div>
  );
}
