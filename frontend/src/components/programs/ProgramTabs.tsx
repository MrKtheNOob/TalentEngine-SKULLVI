export type ProgramTab = "candidates" | "configuration";

interface ProgramTabsProps {
  activeSection: ProgramTab;
  onSelect: (tab: ProgramTab) => void;
}

export default function ProgramTabs({ activeSection, onSelect }: ProgramTabsProps) {
  return (
      <section
        aria-label="Sections du programme"
        className="border-b border-slate-200"
      >
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled
            className="px-3 py-4 text-sm text-slate-400"
          >
            Vue d’ensemble
          </button>
          {(["candidates", "configuration"] as const).map((section) => (
            <button
              key={section}
              type="button"
              onClick={() => onSelect(section)}
              aria-pressed={activeSection === section}
              className={`border-b-2 px-3 py-4 text-sm font-medium ${activeSection === section ? "border-blue-600 text-blue-600" : "border-transparent text-slate-600 hover:text-blue-600"}`}
            >
              {section === "candidates" ? "Candidats" : "Configuration"}
            </button>
          ))}
        </div>
      </section>
  );
}
