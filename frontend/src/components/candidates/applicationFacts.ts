// These facts have a fixed place in the application details panel.
// Other program-specific facts belong in the extraction panel.
export const applicationDetailFields = {
  education: "Formation",
  skills: "Compétences",
  experience: "Expérience",
  availability: "Disponibilité",
  motivation: "Motivation",
} as const;

const factLabels: Record<string, string> = {
  ...applicationDetailFields,
  location: "Localisation", projects: "Projets", languages: "Langues",
  degree: "Diplôme", diploma: "Diplôme", institution: "Établissement",
  school: "Établissement", university: "Université", field: "Domaine",
  field_of_study: "Domaine d’études", year: "Année", graduation_year: "Année d’obtention",
  start_date: "Début", end_date: "Fin", start: "Début", end: "Fin", duration: "Durée",
  title: "Intitulé", role: "Poste", position: "Poste", company: "Entreprise",
  employer: "Employeur", organization: "Organisation", description: "Description",
  summary: "Résumé", responsibilities: "Responsabilités", achievements: "Réalisations",
  name: "Nom", level: "Niveau", years: "Années", years_of_experience: "Années d’expérience",
  technologies: "Technologies", technical: "Techniques", soft_skills: "Compétences relationnelles",
};

export function factLabel(key: string): string {
  return factLabels[key] ?? key.replaceAll("_", " ").replace(/([a-z])([A-Z])/g, "$1 $2");
}
