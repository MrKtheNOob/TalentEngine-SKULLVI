import type { Application } from "../types/application";

// Fictional examples, including precomputed demo evaluations. No LLM is connected.
export const mockApplications: Application[] = [
  { id: 1, programId: 1, name: "Awa Ndiaye", email: "awa.ndiaye@example.com", score: 89, status: "ready", appliedAt: "2026-10-01", cvUrl: "/demo/awa-ndiaye-cv.txt", portfolioUrl: null, warnings: [] },
  { id: 2, programId: 1, name: "Moussa Diop", email: "moussa.diop@example.com", score: 84, status: "needs_review", appliedAt: "2026-10-02", cvUrl: null, portfolioUrl: null, warnings: ["Disponibilité à confirmer", "CV non fourni"] },
  { id: 3, programId: 1, name: "Fatou Fall", email: "fatou.fall@example.com", score: null, status: "processing", appliedAt: "2026-10-03", cvUrl: null, portfolioUrl: null, warnings: [] },
  { id: 4, programId: 1, name: "Ali Sow", email: "ali.sow@example.com", score: 22, status: "ready", appliedAt: "2026-10-02", cvUrl: null, portfolioUrl: null, warnings: [] },
  { id: 5, programId: 1, name: "Khady Ba", email: null, score: 68, status: "needs_review", appliedAt: "2026-10-04", cvUrl: null, portfolioUrl: null, warnings: ["Email non fourni", "CV non fourni"] },
  { id: 6, programId: 1, name: "Ibrahima Ba", email: "ibrahima.ba@example.com", score: null, status: "failed", appliedAt: "2026-10-05", cvUrl: null, portfolioUrl: null, warnings: ["Échec de l’extraction du document"] },
  { id: 7, programId: 2, name: "Ndeye Diallo", email: "ndeye.diallo@example.com", score: 81, status: "ready", appliedAt: "2026-10-01", cvUrl: null, portfolioUrl: null, warnings: ["CV non fourni"] },
  { id: 8, programId: 3, name: "Serigne Diop", email: "serigne.diop@example.com", score: null, status: "received", appliedAt: "2026-10-05", cvUrl: null, portfolioUrl: null, warnings: [] },
];
