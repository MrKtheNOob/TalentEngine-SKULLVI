import type { Program } from "../../types/program";
import { Link } from "react-router-dom";
import ProgramStatusBadge from "./ProgramStatusBadge";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
interface ProgramRowProps {
  program: Program;
}

export default function ProgramRow({ program }: ProgramRowProps) {
  const updatedDate = dateFormatter.format(new Date(program.updatedAt));

  return (
    <tr className="transition-colors hover:bg-slate-50">
      <td className="px-6 py-6 font-medium text-slate-950">{program.name}</td>
      <td className="px-6 py-6">
        <ProgramStatusBadge status={program.status} />
      </td>
      <td className="px-6 py-6 text-right tabular-nums text-slate-600">
        {program.candidates}
      </td>
      <td className="whitespace-nowrap px-6 py-6 text-slate-500">
        <time dateTime={program.updatedAt}>{updatedDate}</time>
      </td>
      <td className="px-6 py-6 text-right">
        <Link
          to={`/app/programs/${program.id}`}
          aria-label={`Voir le programme : ${program.name}`}
          className="inline-flex whitespace-nowrap rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          Voir le programme
        </Link>
      </td>
    </tr>
  );
}
