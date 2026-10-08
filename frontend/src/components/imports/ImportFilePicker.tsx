import { FileJson, FileSpreadsheet, UploadCloud, X } from "lucide-react";
import { useId, useRef } from "react";

type Props = {
  file: File | null;
  error: string | null;
  onSelect: (files: File[]) => void;
  onRemove: () => void;
};

export default function ImportFilePicker({ file, error, onSelect, onRemove }: Props) {
  const inputId = useId();
  const errorId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const FileIcon = file?.name.toLowerCase().endsWith(".csv") ? FileSpreadsheet : FileJson;

  return (
    <div>
      <label
        htmlFor={inputId}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          onSelect(Array.from(event.dataTransfer.files));
        }}
        className="group flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center transition-colors hover:border-blue-500 hover:bg-blue-50 focus-within:border-blue-600 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-blue-600 sm:py-14"
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept=".csv,.json,text/csv,application/json"
          aria-describedby={error ? errorId : undefined}
          aria-invalid={Boolean(error)}
          className="sr-only"
          onChange={(event) => {
            const files = Array.from(event.currentTarget.files ?? []);
            if (files.length > 0) onSelect(files);
            event.currentTarget.value = "";
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              inputRef.current?.click();
            }
          }}
        />
        <span className="mb-4 rounded-xl bg-blue-100 p-3 text-blue-600">
          <UploadCloud size={28} aria-hidden="true" />
        </span>
        <span className="font-medium text-slate-950">Glissez votre fichier ici</span>
        <span className="mt-2 text-sm text-slate-500">
          ou <span className="font-medium text-blue-600">choisissez un fichier</span> sur votre ordinateur
        </span>
        <span className="mt-5 text-xs text-slate-500">CSV ou JSON · Un fichier à la fois</span>
      </label>

      {error && <p id={errorId} role="alert" className="mt-3 text-sm text-red-600">{error}</p>}

      {file && (
        <div role="status" className="mt-4 flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4">
          <FileIcon size={22} aria-hidden="true" className="shrink-0 text-blue-600" />
          <div className="min-w-0 flex-1">
            <p className="break-all text-sm font-medium">{file.name}</p>
            <p className="mt-1 text-xs text-slate-500">
              {new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(file.size / 1024)} Ko · Prêt à être envoyé
            </p>
          </div>
          <button
            type="button"
            onClick={onRemove}
            aria-label="Retirer le fichier sélectionné"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
