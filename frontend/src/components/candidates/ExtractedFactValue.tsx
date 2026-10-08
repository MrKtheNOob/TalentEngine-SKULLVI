import { factLabel } from "./applicationFacts";

export default function ExtractedFactValue({ value, badges = false }: { value: unknown; badges?: boolean }) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-slate-500">Non fourni</span>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-slate-500">Non fourni</span>;
    if (badges && value.every((item) => typeof item === "string")) {
      return <ul className="flex flex-wrap gap-2">{value.map((item, index) => (
        <li key={index} className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">{item}</li>
      ))}</ul>;
    }
    return <ul className="space-y-3">{value.map((item, index) => (
      <li key={index} className="border-l-2 border-slate-200 pl-3"><ExtractedFactValue value={item} /></li>
    ))}</ul>;
  }

  if (typeof value === "object") {
    const entries = Object.entries(value);
    if (entries.length === 0) return <span className="text-slate-500">Non fourni</span>;
    // Facts are flexible JSON in the API. Render their structure as labeled text
    // without guessing a summary or discarding information from older imports.
    return <dl className="space-y-2">{entries.map(([key, item]) => (
      <div key={key}>
        <dt className="text-xs font-medium text-slate-500">{factLabel(key)}</dt>
        <dd className="mt-0.5"><ExtractedFactValue value={item} /></dd>
      </div>
    ))}</dl>;
  }

  if (typeof value === "boolean") return <span>{value ? "Oui" : "Non"}</span>;
  return <span className="whitespace-pre-wrap break-words">{String(value)}</span>;
}
