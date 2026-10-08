import { Layers, Upload } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

export default function Sidebar() {
  const { pathname } = useLocation();
  const links = [
    { icon: Layers, label: "Programs", to: "/app/programs" },
    { icon: Upload, label: "Imports", to: "/app/imports" },
  ];

  return (
    <aside className="flex w-36 shrink-0 flex-col bg-slate-950 text-white sm:w-56 lg:w-64">
      <div className="px-4 py-8 text-lg font-semibold tracking-tight sm:px-6 sm:text-xl">
        Talent Engine
      </div>
      <nav aria-label="Main navigation" className="px-2 sm:px-3">
        <ul className="space-y-2">
          {links.map(({ icon: Icon, label, to }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 border-l-4 px-3 py-3 text-sm transition-colors sm:px-4 sm:text-base ${
                    isActive || (to === "/app/programs" && pathname === "/app")
                      ? "border-blue-600 bg-slate-800 font-medium text-white"
                      : "border-transparent text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`
                }
              >
                <Icon size={20} aria-hidden="true" className="shrink-0" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
