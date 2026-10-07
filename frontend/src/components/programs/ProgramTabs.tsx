export type ProgramTab = "overview" | "candidates" | "configuration";

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
          {(["overview", "candidates", "configuration"] as const).map((section) => (
            <button
              key={section}
              type="button"
              onClick={() => onSelect(section)}
              aria-pressed={activeSection === section}
              className={`border-b-2 px-3 py-4 text-sm font-medium ${activeSection === section ? "border-blue-600 text-blue-600" : "border-transparent text-slate-600 hover:text-blue-600"}`}
            >
              {section === "overview" ? "Vue d’ensemble" : section === "candidates" ? "Candidats" : "Configuration"}
            </button>
          ))}
        </div>
      </section>
  );
}
