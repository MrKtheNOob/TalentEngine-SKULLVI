import type { Application } from "../../types/application";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import ApplicationBadge from "./ApplicationBadge";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "medium",
  timeZone: "UTC",
});

export default function CandidateRow({
  application,
  rank,
}: {
  application: Application;
  rank: number | undefined;
}) {
  const { candidate } = application;
  const initials = candidate.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");
  const appliedDate = dateFormatter.format(new Date(application.appliedAt));

  return (
    <tr className="hover:bg-slate-50">
      <td className="px-2 py-4 text-center">
        <span className="inline-flex size-8 items-center justify-center rounded-lg bg-slate-100 font-medium text-slate-600">
          {rank ?? "—"}
        </span>
      </td>
      <td className="px-2 py-4 text-left">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="hidden size-10 shrink-0 min-[1600px]:flex items-center justify-center rounded-full bg-blue-50 text-blue-600"
          >
            {initials}
          </span>
          <div className="min-w-0">
            <p className="font-medium">{candidate.name}</p>
            <p className="mt-1 break-all text-xs text-slate-500">
              {candidate.email ?? "Email non fourni"}
            </p>
            {(application.warnings?.length ?? 0) > 0 && (
              <ul className="mt-2 space-y-1 text-xs text-amber-700">
                {application.warnings?.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </td>
      <td className="px-2 py-4 text-center font-medium tabular-nums">
        {application.score ?? "—"}
      </td>
      <td className="px-2 py-4 text-center">
        <ApplicationBadge value={application.status} />
      </td>
      <td className="px-2 py-4 text-center text-xs text-slate-500">
        <time dateTime={application.appliedAt}>{appliedDate}</time>
      </td>
      <td className="px-2 py-4 text-center">
        <Link
          to={`/app/programs/${application.programId}/candidates/${candidate.id}?applicationId=${application.id}`}
          aria-label={`Voir le profil de ${candidate.name}`}
          className="inline-flex items-center gap-1 rounded-lg bg-blue-50 p-2 text-xs font-medium text-blue-600 hover:bg-blue-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          <span className="sr-only">Voir le profil</span>
          <Search size={16} aria-hidden="true" />
        </Link>
      </td>
    </tr>
  );
}
