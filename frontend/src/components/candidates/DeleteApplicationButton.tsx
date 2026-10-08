import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";
import Dialog from "../Dialog";
import { useDeleteApplication } from "../../hooks/useDeleteApplication";

type Props = { programId: number; applicationId: number; name: string };

export default function DeleteApplicationButton({ programId, applicationId, name }: Props) {
  const [open, setOpen] = useState(false);
  const { remove, deleting, error } = useDeleteApplication(programId, applicationId);
  const navigate = useNavigate();

  async function confirm() {
    const result = await remove();
    // Return only after the API confirms deletion; keep the dialog open on error.
    if (!result.error) navigate(`/app/programs/${programId}`);
  }

  return (<>
    <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-red-600">
      <Trash2 size={16} aria-hidden="true" /> Supprimer la candidature
    </button>
    {open && <Dialog title="Supprimer la candidature ?" onClose={() => { if (!deleting) setOpen(false); }}>
      <p className="text-sm text-slate-600">Voulez-vous supprimer la candidature de <strong>{name}</strong> ? Ses données et ses évaluations seront supprimées définitivement. Le programme restera inchangé.</p>
      {error && <p role="alert" className="mt-4 text-sm text-red-600">{error.message}</p>}
      <footer className="mt-6 flex justify-end gap-3">
        <button type="button" autoFocus disabled={deleting} onClick={() => setOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50">Annuler</button>
        <button type="button" disabled={deleting} onClick={() => void confirm()} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-red-600 disabled:opacity-50">{deleting ? "Suppression…" : "Supprimer"}</button>
      </footer>
    </Dialog>}
  </>);
}
