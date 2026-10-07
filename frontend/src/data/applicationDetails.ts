import type { ApplicationDetail } from "../types/application";
import { mockApplications } from "./applications";

// Synthetic assessments. The 50/50 contributions are fixtures, not a tier-conversion rule.
export const mockApplicationDetails: Record<number, ApplicationDetail> = Object.fromEntries(
  mockApplications.map((application) => {
    const experiencePoints = application.score === null ? 0 : Math.ceil(application.score / 2);
    return [application.id, {
      normalized: application.id === 1 ? {
        location: "Dakar, Sénégal",
        education: "Licence informatique — établissement fictif",
        skills: ["Python", "FastAPI", "PostgreSQL", "Git"],
        experience: "12 mois de projets personnels et contributions backend",
        portfolioUrl: null,
        availability: "Disponible immédiatement",
        motivation: null,
      } : null,
      source: "Import de démonstration",
      normalization: application.id === 1 ? "Extraction simulée — aucun LLM connecté" : "Données normalisées non disponibles dans cette fixture",
      evaluationSummary: application.score === null ? null : "Évaluation fictive de l’expérience pertinente et de la disponibilité. Les justifications doivent être vérifiées sur les documents soumis.",
      breakdown: application.score === null ? [] : [
        { criterionId: "experience", label: "Expérience pertinente", points: experiencePoints, maxPoints: 50, explanation: "Contribution fictive calculée pour la démonstration ; les règles déterministes restent à définir." },
        { criterionId: "availability", label: "Disponibilité", points: application.score - experiencePoints, maxPoints: 50, explanation: "Contribution fictive de disponibilité ; le score ne constitue pas une décision de sélection." },
      ],
    }];
  }),
);
