"use client";

import { useState, useRef } from "react";

// ─── Constants ───────────────────────────────────────────────────────────────
const EVENTS = ["Color Change/Halt", "Bear 180", "Bull 180", "Clearing bar"] as const;
const LOCATIONS = ["Near", "Far"] as const;
const STATES = ["Wide", "Narrow", "Neutral"] as const;

type Entry = {
  id: string;
  date: string;
  ticker: string;
  event: string;
  location: string;
  state: string;
  notes: string;
};

type CsvRow = Record<string, string>;

// ─── Pill selector ────────────────────────────────────────────────────────────
function PillGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly T[];
  value: T | "";
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <p className="text-xs text-slate-400 mb-1.5 uppercase tracking-widest">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
              value === opt
                ? "bg-indigo-600 border-indigo-500 text-white"
                : "bg-[#222536] border-[#2e3147] text-slate-300 hover:border-indigo-500"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Log Entry Tab ────────────────────────────────────────────────────────────
function LogTab({
  onSave,
}: {
  onSave: (e: Entry) => void;
}) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [ticker, setTicker] = useState("");
  const [event, setEvent] = useState<(typeof EVENTS)[number] | "">("");
  const [location, setLocation] = useState<(typeof LOCATIONS)[number] | "">("");
  const [state, setState] = useState<(typeof STATES)[number] | "">("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || !location || !state) {
      setError("Select Event, Location, and State.");
      return;
    }
    setError("");
    onSave({
      id: crypto.randomUUID(),
      date,
      ticker,
      event,
      location,
      state,
      notes,
    });
    setTicker("");
    setEvent("");
    setLocation("");
    setState("");
    setNotes("");
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-slate-400 uppercase tracking-widest block mb-1.5">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-[#222536] border border-[#2e3147] rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 uppercase tracking-widest block mb-1.5">Ticker</label>
          <input
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            placeholder="e.g. AAPL"
            className="w-full bg-[#222536] border border-[#2e3147] rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      <PillGroup label="Event" options={EVENTS} value={event} onChange={setEvent} />
      <PillGroup label="Location" options={LOCATIONS} value={location} onChange={setLocation} />
      <PillGroup label="State (20/200 MA)" options={STATES} value={state} onChange={setState} />

      <div>
        <label className="text-xs text-slate-400 uppercase tracking-widest block mb-1.5">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Optional notes..."
          className="w-full bg-[#222536] border border-[#2e3147] rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
        />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        type="submit"
        className="px-6 py-2.5 rounded-lg font-semibold text-sm bg-indigo-600 hover:bg-indigo-500 transition-colors"
      >
        {saved ? "Saved!" : "Log Entry"}
      </button>
    </form>
  );
}

// ─── Entries Table ────────────────────────────────────────────────────────────
function EntriesTable({ entries }: { entries: Entry[] }) {
  if (entries.length === 0) {
    return <p className="text-slate-500 text-sm">No entries yet. Log one on the Log tab.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-[#2e3147]">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#222536]">
            {["Date", "Ticker", "Event", "Location", "State", "Notes"].map((h) => (
              <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-[#2e3147] whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {entries.map((row) => (
            <tr key={row.id} className="border-b border-[#2e3147] hover:bg-[#1a1d27] transition-colors">
              <td className="px-4 py-2 text-slate-300 whitespace-nowrap">{row.date}</td>
              <td className="px-4 py-2 font-mono text-slate-200 whitespace-nowrap">{row.ticker}</td>
              <td className="px-4 py-2 text-slate-300 whitespace-nowrap">{row.event}</td>
              <td className="px-4 py-2 text-slate-300 whitespace-nowrap">{row.location}</td>
              <td className="px-4 py-2 text-slate-300 whitespace-nowrap">{row.state}</td>
              <td className="px-4 py-2 text-slate-400 max-w-xs truncate">{row.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── CSV Tab ──────────────────────────────────────────────────────────────────
function CsvTab() {
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const parseCSV = (text: string): { headers: string[]; rows: CsvRow[] } => {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 1) return { headers: [], rows: [] };
    const hdrs = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
    const dataRows = lines.slice(1).map((line) => {
      const vals = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
      const obj: CsvRow = {};
      hdrs.forEach((h, i) => { obj[h] = vals[i] ?? ""; });
      return obj;
    });
    return { headers: hdrs, rows: dataRows };
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".csv")) {
      setError("Please upload a .csv file.");
      return;
    }
    setError("");
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { headers: hdrs, rows: dataRows } = parseCSV(text);
      setHeaders(hdrs);
      setRows(dataRows);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4">
      <div
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-[#2e3147] rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition-colors"
      >
        <p className="text-slate-400 text-sm">
          {fileName ? `Loaded: ${fileName}` : "Click to upload a CSV file"}
        </p>
        <p className="text-slate-600 text-xs mt-1">Exported from TradeStation, Google Sheets, etc.</p>
        <input ref={inputRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {rows.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-[#2e3147]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#222536]">
                {headers.map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-[#2e3147] whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-[#2e3147] hover:bg-[#1a1d27] transition-colors">
                  {headers.map((h) => (
                    <td key={h} className="px-4 py-2 text-slate-300 whitespace-nowrap">{row[h]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-slate-500 text-xs px-4 py-2">{rows.length} rows loaded</p>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Home() {
  const [tab, setTab] = useState<"log" | "entries" | "csv">("log");
  const [entries, setEntries] = useState<Entry[]>([]);

  return (
    <div className="flex flex-col flex-1 max-w-5xl mx-auto w-full px-4 py-6 gap-6">
      <header>
        <h1 className="text-xl font-bold text-slate-100">Trading Tracker</h1>
        <p className="text-slate-500 text-sm">Log entries · View trades · Import CSV</p>
      </header>

      <nav className="flex gap-1 bg-[#1a1d27] p-1 rounded-lg w-fit">
        {([["log", "Log Entry"], ["entries", "Entries"], ["csv", "Import CSV"]] as const).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              tab === t ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      <main className="bg-[#1a1d27] rounded-xl border border-[#2e3147] p-6">
        {tab === "log" && <LogTab onSave={(e) => setEntries((prev) => [e, ...prev])} />}
        {tab === "entries" && <EntriesTable entries={entries} />}
        {tab === "csv" && <CsvTab />}
      </main>
    </div>
  );
}
