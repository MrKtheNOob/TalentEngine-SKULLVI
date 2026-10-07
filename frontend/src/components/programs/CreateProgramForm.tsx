import { useState, type SubmitEvent } from "react";
import Button from "../Button";

interface CreateProgramFormProps {
  onCreate: (attributes: { name: string; description: string }) => void;
  onCancel: () => void;
}

export default function CreateProgramForm({ onCreate, onCancel }: CreateProgramFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const attributes = { name: name.trim(), description: description.trim() };
    if (!attributes.name || !attributes.description) {
      setError("Renseignez le nom et la description.");
      return;
    }
    onCreate(attributes);
  }

  const inputClass = "rounded-lg border border-slate-200 px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-blue-600";
  return (
    <form onSubmit={submit} className="space-y-5">
      <p className="text-sm text-slate-500">Création locale de démonstration : programme actif, sans configuration initiale. Les données seront perdues au rechargement.</p>
      <label className="flex flex-col gap-2 text-sm font-medium">Nom<input autoFocus required value={name} onChange={(event) => setName(event.target.value)} className={inputClass} /></label>
      <label className="flex flex-col gap-2 text-sm font-medium">Description<textarea required rows={4} value={description} onChange={(event) => setDescription(event.target.value)} className={inputClass} /></label>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <footer className="flex justify-end gap-3 border-t border-slate-200 pt-4"><button type="button" onClick={onCancel} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Annuler</button><Button type="submit">Créer le programme</Button></footer>
    </form>
  );
}
