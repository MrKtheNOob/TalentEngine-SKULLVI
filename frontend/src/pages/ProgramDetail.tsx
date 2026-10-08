import DataStatus from "../components/DataStatus";
import ProgramOverviewTab from "../components/programs/ProgramOverviewTab";
import type { ProgramTab } from "../components/programs/ProgramTabs";
import ProgramCandidatesTab from "../components/programs/ProgramCandidatesTab";
import { useState } from "react";
import ProgramConfigurationForm from "../components/configuration/ProgramConfigurationForm";
import { useParams } from "react-router-dom";
import BackLink from "../components/BackLink";
import ProgramDetailHeader from "../components/programs/ProgramDetailHeader";
import ProgramTabs from "../components/programs/ProgramTabs";
import { useProgramJobs } from "../hooks/useProgramJobs";
import { useProgram } from "../hooks/usePrograms";
import { useProgramConfiguration } from "../hooks/useProgramConfiguration";

export default function ProgramDetail() {
  const [activeSection, setActiveSection] = useState<ProgramTab>("overview");
  const { programId } = useParams();
  const { refreshKey, refreshJobs } = useProgramJobs(Number(programId));
  const { program, loading, error, notFound, updateProgram } = useProgram(programId, refreshKey);
  const { configuration, savedConfiguration, updateConfiguration, saveConfiguration, rescoreApplications, loading: configurationLoading, error: configurationError } = useProgramConfiguration(Number(programId));

  async function rescore() {
    const result = await rescoreApplications();
    if (!result.error) refreshJobs();
    return result;
  }

  if (loading || (error && !notFound)) return <DataStatus loading={loading} error={error} />;

  if (!program) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h1 className="text-2xl font-semibold">Programme introuvable</h1>
        <p className="mb-6 mt-2 text-slate-500">
          Aucun programme ne correspond à cet identifiant.
        </p>
        <BackLink to="/app/programs" label="Retour aux programmes" />
      </section>
    );
  }

  return (
    <>
      <ProgramDetailHeader program={program} />
      <ProgramTabs activeSection={activeSection} onSelect={setActiveSection} />
      <div className="mt-5">
        {activeSection === "overview" ? (
          <ProgramOverviewTab key={program.id} program={program} onSave={updateProgram} refreshKey={refreshKey} />
        ) : activeSection === "candidates" ? (
          <ProgramCandidatesTab key={program.id} programId={program.id} refreshKey={refreshKey} totalApplications={program.candidates} configuration={savedConfiguration} />
        ) : (
          <div>
          <DataStatus loading={configurationLoading} error={configurationError} />
          {!configurationLoading && !configurationError && <ProgramConfigurationForm
            key={program.id}
            programId={program.id}
            configuration={configuration}
            onConfigurationChange={updateConfiguration}
            savedConfiguration={savedConfiguration}
            onSave={saveConfiguration}
            onRescore={rescore}
          />}
          </div>
        )}
      </div>
    </>
  );
}
