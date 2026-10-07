import type { ProcessingStatus } from "../types/application";

export const processingLabels: Record<ProcessingStatus, string> = {
  received: "Reçu", processing: "En traitement", ready: "Prêt", needs_review: "À vérifier", failed: "Échec",
};
