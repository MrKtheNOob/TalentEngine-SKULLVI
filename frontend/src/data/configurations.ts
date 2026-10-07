import type { ProgramConfiguration } from "../types/configuration";
import { mockPrograms } from "./programs";

// Fictional demo configurations, not production defaults or SKULLVI policy.
export const mockConfigurations: Record<number, ProgramConfiguration> = Object.fromEntries(
  mockPrograms.map((program) => [program.id, {
    programId: program.id,
    criteria: [
      {
        id: "experience", name: "Expérience pertinente", type: "number", priority: "high", guidance: "", options: [], unit: "mois",
        ranges: [
          { id: "experience-low", min: 0, max: 3, scoreTier: "low" },
          { id: "experience-medium", min: 3, max: 12, scoreTier: "medium" },
          { id: "experience-high", min: 12, max: null, scoreTier: "high" },
        ],
      },
      {
        id: "availability", name: "Disponibilité", type: "select", priority: "medium", guidance: "", unit: "", ranges: [],
        options: [
          { id: "immediate", label: "Disponible immédiatement", scoreTier: "high" },
          { id: "soon", label: "Disponible dans 1 à 3 mois", scoreTier: "medium" },
          { id: "later", label: "Disponible après 3 mois", scoreTier: "low" },
        ],
      },
    ],
  }]),
);
