import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

export default function MainLayout() {
  return (
    <div className="flex h-dvh overflow-hidden bg-slate-50 text-slate-950">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-y-auto p-5 sm:p-8 lg:p-10">
        <div className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
