"use client";

import { useState, useRef, useEffect } from "react";

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

// ─── CSV Parser (handles quoted fields) ──────────────────────────────────────
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

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
                : "bg-[#2d2f45] border-[#3d3f5e] text-slate-300 hover:border-indigo-500"
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

  // Auto-calculate R:R whenever initialRisk or amount changes
  useEffect(() => {
    const risk = parseFloat(form.initialRisk);
    const amt = parseFloat(form.amount);
    if (risk > 0 && amt > 0) {
      setForm((prev) => ({ ...prev, rrRatio: (amt / risk).toFixed(2) }));
    }
  }, [form.initialRisk, form.amount]);

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
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
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
              className="w-full bg-[#2d2f45] border border-[#3d3f5e] rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
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
            className="w-full bg-[#2d2f45] border border-[#3d3f5e] rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
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
                    : "bg-[#2d2f45] border-[#3d3f5e] text-slate-400 hover:border-slate-500"
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
            className="w-full bg-[#2d2f45] border border-[#3d3f5e] rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="text-xs text-slate-400 uppercase tracking-widest block mb-1.5">
            R:R <span className="text-indigo-400 normal-case">(auto)</span>
          </label>
          <input
            type="text"
            value={form.rrRatio}
            onChange={(e) => set("rrRatio", e.target.value)}
            placeholder="auto"
            className="w-full bg-[#2d2f45] border border-[#3d3f5e] rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
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
          className="w-full bg-[#2d2f45] border border-[#3d3f5e] rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
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

// ─── Date helpers ─────────────────────────────────────────────────────────────
function getDateRange(filter: "day" | "week" | "month" | "ytd"): [Date, Date] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  if (filter === "day") return [today, end];

  if (filter === "week") {
    const day = today.getDay(); // 0=Sun
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - day);
    return [startOfWeek, end];
  }

  if (filter === "month") {
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return [startOfMonth, end];
  }

  // ytd
  const startOfYear = new Date(today.getFullYear(), 0, 1);
  return [startOfYear, end];
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
  const [rangeFilter, setRangeFilter] = useState<"day" | "week" | "month" | "ytd">("month");

  if (entries.length === 0) {
    return <p className="text-slate-500 text-sm">No entries yet — log one on the Log tab.</p>;
  }

  const totalPnl = entries.reduce((sum, e) => {
    const amt = parseFloat(e.amount) || 0;
    return sum + (e.result === "L" ? -amt : amt);
  }, 0);

  const wins = entries.filter((e) => e.result === "W");
  const losses = entries.filter((e) => e.result === "L");
  const winRate = Math.round((wins.length / entries.length) * 100);

  const avgRR =
    entries.filter((e) => parseFloat(e.rrRatio) > 0).length > 0
      ? (
          entries.reduce((s, e) => s + (parseFloat(e.rrRatio) || 0), 0) /
          entries.filter((e) => parseFloat(e.rrRatio) > 0).length
        ).toFixed(2)
      : "—";

  const avgWin =
    wins.length > 0
      ? (wins.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0) / wins.length).toFixed(0)
      : "—";

  const avgLoss =
    losses.length > 0
      ? (losses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0) / losses.length).toFixed(0)
      : "—";

  // Filtered entries for the range summary row
  const [rangeStart, rangeEnd] = getDateRange(rangeFilter);
  const rangeEntries = entries.filter((e) => {
    const d = new Date(e.date + "T00:00:00");
    return d >= rangeStart && d < rangeEnd;
  });

  const rangeWins = rangeEntries.filter((e) => e.result === "W").length;
  const rangeLosses = rangeEntries.filter((e) => e.result === "L").length;
  const rangePnl = rangeEntries.reduce((sum, e) => {
    const amt = parseFloat(e.amount) || 0;
    return sum + (e.result === "L" ? -amt : amt);
  }, 0);

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="flex flex-wrap gap-4 text-sm">
        <span className="text-slate-400">
          {entries.length} trade{entries.length !== 1 ? "s" : ""}
        </span>
        <span className={totalPnl >= 0 ? "text-emerald-400" : "text-red-400"}>
          Total: {totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(0)}
        </span>
        <span className="text-slate-400">Win rate: {winRate}%</span>
        <span className="text-slate-400">Avg R:R: {avgRR}</span>
        <span className="text-emerald-400">Avg Win: {avgWin !== "—" ? `+$${avgWin}` : "—"}</span>
        <span className="text-red-400">Avg Loss: {avgLoss !== "—" ? `-$${avgLoss}` : "—"}</span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[#3d3f5e]">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#2d2f45]">
              {COLS.map((c) => (
                <th
                  key={c.key}
                  className="px-3 py-2.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-[#3d3f5e] whitespace-nowrap"
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
                className="border-b border-[#3d3f5e] hover:bg-[#252740] transition-colors"
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
          {/* Range summary footer */}
          <tfoot>
            <tr className="bg-[#252740] border-t-2 border-indigo-600/40">
              <td colSpan={COLS.length} className="px-3 py-2">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex gap-1">
                    {(["day", "week", "month", "ytd"] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => setRangeFilter(r)}
                        className={`px-2 py-0.5 rounded text-xs font-medium transition-all ${
                          rangeFilter === r
                            ? "bg-indigo-600 text-white"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {r.toUpperCase()}
                      </button>
                    ))}
                  </div>
                  <span className="text-slate-400 text-xs">
                    {rangeEntries.length} trades
                  </span>
                  <span className="text-emerald-400 text-xs">{rangeWins}W</span>
                  <span className="text-red-400 text-xs">{rangeLosses}L</span>
                  <span className={`text-xs font-semibold ${rangePnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    P&L: {rangePnl >= 0 ? "+" : ""}${rangePnl.toFixed(0)}
                  </span>
                </div>
              </td>
            </tr>
          </tfoot>
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
    const hdrs = parseCSVLine(lines[0]);
    const dataRows = lines.slice(1).map((line) => {
      const vals = parseCSVLine(line);
      const obj: CsvRow = {};
      hdrs.forEach((h, i) => {
        // Use index-suffixed key internally if header is blank
        const key = h || `col_${i}`;
        obj[key] = vals[i] ?? "";
      });
      return obj;
    });
    // Deduplicate headers for display (add suffix if duplicate)
    const seen: Record<string, number> = {};
    const deduped = hdrs.map((h) => {
      const base = h || "col";
      if (seen[base] === undefined) {
        seen[base] = 0;
        return base;
      }
      seen[base]++;
      return `${base}_${seen[base]}`;
    });
    return { headers: deduped, rows: dataRows };
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
      const { headers: hdrs, rows: dataRows } = parseCSV(ev.target?.result as string);
      setHeaders(hdrs);
      setRows(dataRows);
    };
    reader.readAsText(file);
    // Reset input so same file can be re-uploaded
    e.target.value = "";
  };

  return (
    <div className="space-y-4">
      <div
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-[#3d3f5e] rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition-colors"
      >
        <p className="text-slate-400 text-sm">
          {fileName ? `Loaded: ${fileName}` : "Click to upload a CSV file"}
        </p>
        <p className="text-slate-600 text-xs mt-1">
          Export from TradeStation, Excel, Google Sheets, etc.
        </p>
        <input ref={inputRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {rows.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-[#3d3f5e]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#2d2f45]">
                {headers.map((h, i) => (
                  <th
                    key={`th-${i}`}
                    className="px-3 py-2.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-[#3d3f5e] whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIdx) => (
                <tr
                  key={`row-${rowIdx}`}
                  className="border-b border-[#3d3f5e] hover:bg-[#252740] transition-colors"
                >
                  {headers.map((h, colIdx) => (
                    <td key={`td-${rowIdx}-${colIdx}`} className="px-3 py-2 text-slate-300 whitespace-nowrap">
                      {row[h] ?? ""}
                    </td>
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
    <div className="flex flex-col flex-1 w-full px-6 py-6 gap-6">
      <header>
        <h1 className="text-xl font-bold text-slate-100">Trading Tracker</h1>
        <p className="text-slate-500 text-sm">Log entries · View trades · Import CSV</p>
      </header>

      <nav className="flex gap-1 bg-[#252740] p-1 rounded-lg w-fit">
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

      <main className="bg-[#252740] rounded-xl border border-[#3d3f5e] p-6 flex-1">
        {tab === "log" && <LogTab onSave={(e) => setEntries((prev) => [e, ...prev])} />}
        {tab === "entries" && <EntriesTable entries={entries} />}
        {tab === "csv" && <CsvTab />}
      </main>
    </div>
  );
}
