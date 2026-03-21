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
  time: string;
  event: string;
  location: string;
  state: string;
  initialRisk: string;
  result: "W" | "L" | "";
  amount: string;
  rrRatio: string;
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
const BLANK: Omit<Entry, "id"> = {
  date: new Date().toISOString().split("T")[0],
  ticker: "",
  time: "",
  event: "",
  location: "",
  state: "",
  initialRisk: "",
  result: "",
  amount: "",
  rrRatio: "",
  notes: "",
};

function LogTab({ onSave }: { onSave: (e: Entry) => void }) {
  const [form, setForm] = useState({ ...BLANK });
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const set = (k: keyof typeof BLANK, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.event || !form.location || !form.state || !form.result) {
      setError("Select Event, Location, State, and W/L.");
      return;
    }
    setError("");
    onSave({ ...form, id: crypto.randomUUID() });
    setForm({ ...BLANK });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-xl">
      {/* Row 1: date / ticker / time */}
      <div className="grid grid-cols-3 gap-3">
        {(
          [
            ["Date", "date", "date"],
            ["Ticker", "ticker", "text"],
            ["Time", "time", "time"],
          ] as [string, keyof typeof BLANK, string][]
        ).map(([label, key, type]) => (
          <div key={key}>
            <label className="text-xs text-slate-400 uppercase tracking-widest block mb-1.5">
              {label}
            </label>
            <input
              type={type}
              value={form[key] as string}
              onChange={(e) =>
                set(key, key === "ticker" ? e.target.value.toUpperCase() : e.target.value)
              }
              className="w-full bg-[#222536] border border-[#2e3147] rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>
        ))}
      </div>

      <PillGroup
        label="Event"
        options={EVENTS}
        value={form.event as any}
        onChange={(v) => set("event", v)}
      />
      <PillGroup
        label="Location"
        options={LOCATIONS}
        value={form.location as any}
        onChange={(v) => set("location", v)}
      />
      <PillGroup
        label="State (20/200 MA)"
        options={STATES}
        value={form.state as any}
        onChange={(v) => set("state", v)}
      />

      {/* Row 2: initial risk / result / amount / R:R */}
      <div className="grid grid-cols-4 gap-3">
        <div>
          <label className="text-xs text-slate-400 uppercase tracking-widest block mb-1.5">
            Init. Risk $
          </label>
          <input
            type="number"
            value={form.initialRisk}
            onChange={(e) => set("initialRisk", e.target.value)}
            placeholder="100"
            className="w-full bg-[#222536] border border-[#2e3147] rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="text-xs text-slate-400 uppercase tracking-widest block mb-1.5">
            W / L
          </label>
          <div className="flex gap-2">
            {(["W", "L"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => set("result", r)}
                className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-all ${
                  form.result === r
                    ? r === "W"
                      ? "bg-emerald-600 border-emerald-500 text-white"
                      : "bg-red-600 border-red-500 text-white"
                    : "bg-[#222536] border-[#2e3147] text-slate-400 hover:border-slate-500"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-400 uppercase tracking-widest block mb-1.5">
            $ Amount
          </label>
          <input
            type="number"
            value={form.amount}
            onChange={(e) => set("amount", e.target.value)}
            placeholder="250"
            className="w-full bg-[#222536] border border-[#2e3147] rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="text-xs text-slate-400 uppercase tracking-widest block mb-1.5">
            R:R
          </label>
          <input
            type="text"
            value={form.rrRatio}
            onChange={(e) => set("rrRatio", e.target.value)}
            placeholder="1.5"
            className="w-full bg-[#222536] border border-[#2e3147] rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-slate-400 uppercase tracking-widest block mb-1.5">
          Notes
        </label>
        <textarea
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
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
const COLS: { key: keyof Entry; label: string }[] = [
  { key: "date", label: "Date" },
  { key: "ticker", label: "Ticker" },
  { key: "time", label: "Time" },
  { key: "event", label: "Event" },
  { key: "location", label: "Loc." },
  { key: "state", label: "State" },
  { key: "initialRisk", label: "Risk $" },
  { key: "result", label: "W/L" },
  { key: "amount", label: "$ P&L" },
  { key: "rrRatio", label: "R:R" },
  { key: "notes", label: "Notes" },
];

function EntriesTable({ entries }: { entries: Entry[] }) {
  const totalPnl = entries.reduce((sum, e) => {
    const amt = parseFloat(e.amount) || 0;
    return sum + (e.result === "L" ? -amt : amt);
  }, 0);

  if (entries.length === 0) {
    return <p className="text-slate-500 text-sm">No entries yet — log one on the Log tab.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-4 text-sm">
        <span className="text-slate-400">
          {entries.length} trade{entries.length !== 1 ? "s" : ""}
        </span>
        <span className={totalPnl >= 0 ? "text-emerald-400" : "text-red-400"}>
          Total: {totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(0)}
        </span>
        <span className="text-slate-400">
          Win rate:{" "}
          {Math.round(
            (entries.filter((e) => e.result === "W").length / entries.length) * 100
          )}
          %
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[#2e3147]">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#222536]">
              {COLS.map((c) => (
                <th
                  key={c.key}
                  className="px-3 py-2.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-[#2e3147] whitespace-nowrap"
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map((row) => (
              <tr
                key={row.id}
                className="border-b border-[#2e3147] hover:bg-[#1a1d27] transition-colors"
              >
                {COLS.map((c) => (
                  <td
                    key={c.key}
                    className={`px-3 py-2 whitespace-nowrap ${
                      c.key === "result"
                        ? row.result === "W"
                          ? "text-emerald-400 font-bold"
                          : "text-red-400 font-bold"
                        : c.key === "amount"
                        ? row.result === "W"
                          ? "text-emerald-400"
                          : "text-red-400"
                        : c.key === "notes"
                        ? "text-slate-400 max-w-xs truncate"
                        : "text-slate-300"
                    }`}
                  >
                    {c.key === "amount" && row.amount
                      ? `${row.result === "L" ? "-" : "+"}$${row.amount}`
                      : (row[c.key] as string)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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

  const parseCSV = (text: string) => {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 1) return { headers: [] as string[], rows: [] as CsvRow[] };
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
    if (!file.name.endsWith(".csv")) { setError("Please upload a .csv file."); return; }
    setError("");
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const { headers: hdrs, rows: dataRows } = parseCSV(ev.target?.result as string);
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
        <p className="text-slate-600 text-xs mt-1">Export from TradeStation, Excel, Google Sheets, etc.</p>
        <input ref={inputRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {rows.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-[#2e3147]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#222536]">
                {headers.map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-[#2e3147] whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-[#2e3147] hover:bg-[#1a1d27] transition-colors">
                  {headers.map((h) => (
                    <td key={h} className="px-3 py-2 text-slate-300 whitespace-nowrap">{row[h]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-slate-500 text-xs px-4 py-2">{rows.length} rows</p>
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
        {(
          [
            ["log", "Log Entry"],
            ["entries", "Entries"],
            ["csv", "Import CSV"],
          ] as const
        ).map(([t, label]) => (
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
