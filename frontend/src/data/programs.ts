import type { Program } from "../types/program";

export const mockPrograms: Program[] = [
  {
    id: 1,
    name: "Stage Développement Backend",
    description: "Programme de stage fictif pour la démonstration Talent Engine.",
    status: "Active",
    candidates: 46,
    updatedAt: "2024-06-01",
  },
  {
    id: 2,
    name: "Stage Développement Frontend",
    description: "Programme de stage fictif pour la démonstration Talent Engine.",
    status: "Active",
    candidates: 35,
    updatedAt: "2024-06-15",
  },
  {
    id: 3,
    name: "Stage UI/UX",
    description: "Programme de stage fictif pour la démonstration Talent Engine.",
    status: "Closed",
    candidates: 56,
    updatedAt: "2024-05-20",
  },
  {
    id: 4,
    name: "Stage Community Manager",
    description: "Programme de stage fictif pour la démonstration Talent Engine.",
    status: "Closed",
    candidates: 0,
    updatedAt: "2024-05-30",
  },
];
