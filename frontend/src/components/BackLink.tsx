import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

interface BackLinkProps {
  to: string;
  label: string;
}

export default function BackLink({ to, label }: BackLinkProps) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-2 rounded text-sm font-medium text-blue-600 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
    >
      <ArrowLeft size={16} aria-hidden="true" />
      {label}
    </Link>
  );
}
