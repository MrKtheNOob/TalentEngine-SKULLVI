import { ArrowUpFromLine, Info } from "lucide-react";
import { useId, useState, type SubmitEvent } from "react";
import type { Program } from "../../types/program";
import type { ImportJob } from "../../types/job";
import type { Result } from "../../types/result";
import Button from "../Button";
import DataStatus from "../DataStatus";
import ImportFilePicker from "./ImportFilePicker";

type Props = {
  programs: Program[];
  loading: boolean;
  error: Error | null;
  onImport: (programId: number, file: File, autoScore: boolean) => Promise<Result<ImportJob>>;
};

export default function FileImportForm({ programs, loading, error, onImport }: Props) {
  const programInputId = useId();
  const [programId, setProgramId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const [autoScore, setAutoScore] = useState(true);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file || !programId) return;
    setPending(true);
    setUploadError(null);
    setMessage("");
    const result = await onImport(Number(programId), file, autoScore);
    setPending(false);
    if (result.error) setUploadError(result.error.message);
    else {
      setFile(null);
      setMessage(`Import #${result.data.id} reçu : ${result.data.total} candidature(s) à traiter.`);
    }
  }

  function selectFile(files: File[]) {
    setFile(null);
    const selected = files[0];
    if (files.length !== 1) {
      setFileError("Choisissez un seul fichier CSV ou JSON.");
      return;
    }
    if (!/\.(csv|json)$/i.test(selected.name)) {
      setFileError("Format non pris en charge. Choisissez un fichier .csv ou .json.");
      return;
    }
    if (selected.size === 0) {
      setFileError("Ce fichier est vide. Choisissez un fichier contenant des candidatures.");
      return;
    }
    setFileError(null);
    setFile(selected);
  }

  return (
    <section aria-labelledby="file-import-title" className="rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-6 py-5">
        <h2 id="file-import-title" className="text-lg font-semibold">Importer des candidatures</h2>
        <p className="mt-1 text-sm text-slate-500">Choisissez le programme destinataire, puis un export de votre formulaire.</p>
      </div>

      <form className="space-y-6 p-6" onSubmit={submit}>
        <fieldset disabled={pending} className="space-y-6">
        <div>
          <label htmlFor={programInputId} className="mb-2 block text-sm font-medium">Programme destinataire</label>
          <select
            id={programInputId}
            value={programId}
            onChange={(event) => setProgramId(event.target.value)}
            disabled={loading || Boolean(error) || programs.length === 0}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm focus:border-blue-600 focus:outline-blue-600 disabled:bg-slate-50 disabled:text-slate-500"
          >
            <option value="">Sélectionnez un programme</option>
            {programs.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}
          </select>
          {(loading || error) && <div className="mt-3"><DataStatus loading={loading} error={error} /></div>}
          {!loading && !error && programs.length === 0 && (
            <p className="mt-2 text-sm text-slate-500">Créez un programme avant d’importer ses candidatures.</p>
          )}
        </div>

        <ImportFilePicker
          file={file}
          error={fileError}
          onSelect={selectFile}
          onRemove={() => { setFile(null); setFileError(null); }}
        />

        <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
          <p className="font-medium text-slate-950">Quel fichier préparer ?</p>
          <p className="mt-1">Un CSV UTF-8 séparé par des virgules avec une candidature par ligne, ou un JSON contenant une liste de candidatures. Incluez les réponses du formulaire et les liens vers les CV lorsqu’ils sont disponibles. Maximum : 10 Mo et 1 000 candidatures.</p>
        </div>

        <label className="flex items-start gap-3 text-sm text-slate-600">
          <input type="checkbox" checked={autoScore} onChange={(event) => setAutoScore(event.target.checked)} className="mt-1 size-4 accent-blue-600" />
          Évaluer automatiquement les candidatures après leur import si le programme possède des critères. Cette opération utilise le LLM.
        </label>
        </fieldset>
        <div className="flex items-start gap-2 rounded-lg bg-blue-50 p-4 text-sm text-blue-700">
          <Info size={18} aria-hidden="true" className="mt-0.5 shrink-0" />
          <p>Les candidatures apparaissent progressivement dans le programme. Un problème sur une ligne ne bloque pas les autres.</p>
        </div>
        {uploadError && <p role="alert" className="text-sm text-red-600">{uploadError}</p>}
        {message && <p role="status" className="text-sm text-emerald-700">{message}</p>}
        <div className="flex justify-end border-t border-slate-200 pt-5">
          <Button type="submit" disabled={pending || !file || !programId || loading || Boolean(error)}>
            <ArrowUpFromLine size={18} aria-hidden="true" className="mr-2" />
            {pending ? "Envoi…" : "Lancer l’import"}
          </Button>
        </div>
      </form>
    </section>
  );
}
