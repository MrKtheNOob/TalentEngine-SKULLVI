import { LogOut, UserRound } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";

export default function SidebarUser() {
  const { user, loading, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  async function handleLogout() {
    setLoggingOut(true);
    setLogoutError(null);
    const result = await logout();
    if (result.error) {
      setLogoutError("Impossible de se déconnecter. Réessayez.");
      setLoggingOut(false);
    }
    // Clearing user makes ProtectedRoute redirect to /login automatically.
  }

  if (loading) {
    return <p role="status" className="text-sm text-slate-400">Chargement du compte…</p>;
  }

  if (!user) return null;

  return (
    <div className="space-y-3">
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-800 text-slate-300">
        <UserRound size={18} aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-white" title={user.username}>
          {user.username}
        </p>
        <p className="truncate text-xs text-slate-400" title={user.email}>
          {user.email}
        </p>
      </div>
    </div>
      <button
        type="button"
        onClick={handleLogout}
        disabled={loggingOut}
        className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-slate-300 transition-colors hover:bg-slate-800 hover:text-white disabled:cursor-wait disabled:opacity-50"
      >
        <LogOut size={16} className="shrink-0" aria-hidden="true" />
        {loggingOut ? "Déconnexion…" : "Se déconnecter"}
      </button>
      {logoutError && <p role="alert" className="text-xs text-red-300">{logoutError}</p>}
    </div>
  );
}
