import type { LucideIcon } from "lucide-react";

const ICON_TONES = {
  blue: "bg-blue-50 text-blue-600",
  amber: "bg-amber-100 text-amber-700",
  slate: "bg-slate-100 text-slate-600",
  emerald: "bg-emerald-100 text-emerald-700",
};

interface KPICardProps {
  title: string;
  count: number;
  icon?: LucideIcon;
  tone?: keyof typeof ICON_TONES;
}

export default function KPICard({ title, count, icon: Icon, tone = "blue" }: KPICardProps) {
  const iconColorClass = ICON_TONES[tone];

  return (
    <div className="flex items-center gap-5 rounded-lg border border-slate-200 bg-white p-6">
      {Icon && (
        <div className={`flex size-14 shrink-0 items-center justify-center rounded-lg ${iconColorClass}`}>
          <Icon size={28} strokeWidth={1.75} aria-hidden="true" />
        </div>
      )}
      <div>
        <h2 className="text-sm font-medium text-slate-500">{title}</h2>
        <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{count}</p>
      </div>
    </div>
  );
}
