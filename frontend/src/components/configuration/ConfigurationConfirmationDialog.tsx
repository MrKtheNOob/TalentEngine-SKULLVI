import Dialog from "../Dialog";
import Button from "../Button";

interface Props {
  mode: "save" | "rescore";
  pending: boolean;
  onClose: () => void;
  onConfirm: (rescore: boolean) => void;
}

export default function ConfigurationConfirmationDialog({ mode, pending, onClose, onConfirm }: Props) {
  return (
    <Dialog title={mode === "save" ? "Enregistrer la configuration" : "Réévaluer les candidatures"} onClose={() => { if (!pending) onClose(); }}>
      <p className="text-sm leading-6 text-slate-600">
        {mode === "save" ? "Les nouveaux critères s’appliqueront à toutes les candidatures du programme. Voulez-vous les réévaluer après l’enregistrement ?" : "Voulez-vous réévaluer toutes les candidatures avec la configuration enregistrée ?"}
      </p>
      <p className="mt-3 rounded-lg bg-amber-100 p-3 text-sm text-amber-700">La réévaluation utilisera le LLM et pourra entraîner un coût. Le moteur de scoring n’est pas encore disponible ; aucune réévaluation ne peut être lancée pour le moment.</p>
      <footer className="mt-6 flex flex-wrap justify-end gap-3">
        <button type="button" disabled={pending} onClick={onClose} className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 disabled:opacity-50">Annuler</button>
        {mode === "save" && <button type="button" disabled={pending} onClick={() => onConfirm(false)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 disabled:opacity-50">Enregistrer seulement</button>}
        <Button disabled={pending} onClick={() => onConfirm(true)}>{pending ? "Traitement…" : mode === "save" ? "Enregistrer et réévaluer" : "Réévaluer"}</Button>
      </footer>
    </Dialog>
  );
}
