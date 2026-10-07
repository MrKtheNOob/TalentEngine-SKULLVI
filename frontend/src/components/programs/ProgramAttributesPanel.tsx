import { useState, type SubmitEvent } from "react";
import { Pencil } from "lucide-react";
import Button from "../Button";
import type { Result } from "../../types/result";
import type { ProgramUpdate } from "../../types/program";
import type { Program } from "../../types/program";

interface Props {
  program: Program;
  onSave: (attributes: ProgramUpdate) => Promise<Result<Program>>;
}

export default function ProgramAttributesPanel({ program, onSave }: Props) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(program.name);
  const [description, setDescription] = useState(program.description);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function startEditing() {
    setName(program.name);
    setDescription(program.description);
    setError("");
    setSaved(false);
    setEditing(true);
  }

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Renseignez le nom du programme.");
      return;
    }
    setSaving(true);
    setError("");
    const result = await onSave({ name: name.trim(), description: description.trim() });
    setSaving(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    setEditing(false);
    setSaved(true);
  }

  const inputClass = "rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus-visible:outline-2 focus-visible:outline-blue-600";
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6">
      <header className="mb-5 flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-slate-950">Informations du programme</h2>
        {!editing && <button type="button" onClick={startEditing} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"><Pencil size={16} aria-hidden="true" />Modifier</button>}
      </header>
      {editing ? (
        <form onSubmit={submit} className="space-y-5">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">Nom<input autoFocus required disabled={saving} value={name} onChange={(event) => setName(event.target.value)} className={inputClass} /></label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">Description<textarea rows={4} disabled={saving} value={description} onChange={(event) => setDescription(event.target.value)} className={inputClass} /></label>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
            <button type="button" disabled={saving} onClick={() => setEditing(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Annuler</button>
            <Button type="submit" disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer"}</Button>
          </div>
        </form>
      ) : (
        <dl className="space-y-4">
          <div><dt className="text-sm text-slate-500">Nom</dt><dd className="mt-1 font-medium text-slate-950">{program.name}</dd></div>
          <div><dt className="text-sm text-slate-500">Description</dt><dd className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-600">{program.description || "Aucune description."}</dd></div>
        </dl>
      )}
      {saved && <p role="status" className="mt-4 text-sm text-emerald-700">Modifications enregistrées.</p>}
    </section>
  );
}
