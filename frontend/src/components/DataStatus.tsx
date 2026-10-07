export default function DataStatus({ loading, error }: { loading: boolean; error: Error | null }) {
  if (loading) return <p role="status" className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">Chargement…</p>;
  if (error) return <p role="alert" className="rounded-lg border border-red-100 bg-red-50 p-6 text-sm text-red-600">Impossible de charger les données. {error.message}</p>;
  return null;
}
