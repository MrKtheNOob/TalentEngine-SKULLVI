import ProgramCandidatesTab from "../components/programs/ProgramCandidatesTab";
import { useState } from "react";
import ProgramConfigurationForm from "../components/configuration/ProgramConfigurationForm";
import { useParams } from "react-router-dom";
import BackLink from "../components/BackLink";
import ProgramDetailHeader from "../components/programs/ProgramDetailHeader";
import ProgramTabs from "../components/programs/ProgramTabs";
import { useProgram } from "../hooks/usePrograms";
import { useProgramConfiguration } from "../hooks/useProgramConfiguration";

export default function ProgramDetail() {
  const [activeSection, setActiveSection] = useState<"candidates" | "configuration">("candidates");
  const { programId } = useParams();
  const program = useProgram(programId);
  const { configuration, savedConfiguration, updateConfiguration, saveConfiguration } = useProgramConfiguration(Number(programId));

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
        {activeSection === "candidates" ? (
          <ProgramCandidatesTab key={program.id} programId={program.id} configuration={savedConfiguration} />
        ) : (
          <ProgramConfigurationForm
            key={program.id}
            programId={program.id}
            configuration={configuration}
            onConfigurationChange={updateConfiguration}
            savedConfiguration={savedConfiguration}
            onSave={saveConfiguration}
          />
        )}
      </div>
    </>
  );
}
