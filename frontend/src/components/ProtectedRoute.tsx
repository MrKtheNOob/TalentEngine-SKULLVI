import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function ProtectedRoute() {
  const { user, loading, error } = useAuth();

  if (loading) return <p>Vérification de la session…</p>;
  if (error) return <p>Impossible de vérifier la session.</p>;
  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
}