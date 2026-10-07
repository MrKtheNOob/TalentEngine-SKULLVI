import BackLink from "../BackLink";
import type { Program } from "../../types/program";

export default function ProgramDetailHeader({ program }: { program: Program }) {
  return (
      <header className="mb-4">
        <BackLink to="/app/programs" label="Retour aux programmes" />
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">
            {program.name}
          </h1>
        </div>
        <p className="mt-2 text-slate-500">
          {program.description}
        </p>
      </header>
  );
}
