import type { CriterionAssessment } from "../../types/application";

export default function CandidateScoreBreakdown({ breakdown }: { breakdown: CriterionAssessment[] }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
      <h2 className="text-lg font-semibold">Détail du score</h2>
      <p className="mt-2 text-xs text-slate-500">Contributions des critères au score global.</p>
      <div className="mt-4 divide-y divide-slate-200">
        {breakdown.map((criterion) => (
          <div key={criterion.criterionId} className="py-4">
            <div className="mb-3 flex justify-between gap-4 text-sm"><h3 className="font-medium">{criterion.label}</h3><span className="shrink-0 tabular-nums">{criterion.points} / {criterion.maxPoints}</span></div>
            <progress value={criterion.points} max={criterion.maxPoints} aria-label={`Score : ${criterion.label}`} className="h-2 w-full overflow-hidden rounded-full [&::-webkit-progress-bar]:bg-slate-100 [&::-webkit-progress-value]:bg-blue-600 [&::-moz-progress-bar]:bg-blue-600" />
            <p className="mt-2 text-sm leading-6 text-slate-500">{criterion.explanation}</p>
          </div>
        ))}
        {breakdown.length === 0 && <p className="py-5 text-sm text-slate-500">Aucune évaluation disponible.</p>}
      </div>
    </section>
  );
}
