"use client";

import { useState, useRef, useEffect } from "react";
import { getData, setData } from "../lib/supabase";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Legend } from "recharts";

// ─── Constants ───────────────────────────────────────────────────────────────
const EVENTS = ["Color Change/Halt", "Bear 180", "Bull 180", "Clearing bar", "No event"] as const;
const LOCATIONS = ["Near", "Far", "At"] as const;
const STATES = ["Wide", "Narrow", "Neutral"] as const;

type Entry = {
  id: string;
  date: string;        // stored YYYY-MM-DD
  ticker: string;
  time: string;        // stored H:MM or HH:MM, no AM/PM
  tradeType: string;   // "Day" | "Swing"
  event: string;
  location: string;
  state: string;
  initialRisk: string;
  result: "W" | "L" | "BE" | "";
  amount: string;      // always stored as positive
  rrRatio: string;
  notes: string;
  flagged?: boolean;
};

type CsvRow = Record<string, string>;

type Goal = { text: string; checked: boolean };
type Folder = { id: string; name: string; collapsed: boolean };
type Journal = {
  id: string;
  folderId?: string;
  date: string;
  goals: [Goal, Goal, Goal];
  marketOn: boolean;
  observations: string;
  grade?: string;
  review?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function localDateStr(): string {
  const n = new Date();
  const y = n.getFullYear();
  const m = String(n.getMonth() + 1).padStart(2, "0");
  const d = String(n.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function fmtDate(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${parseInt(m)}/${parseInt(d)}/${y}`;
}

// Auto-insert colon before last 2 digits: "930" → "9:30", "1430" → "14:30"
function autoColon(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 4);
  if (d.length < 3) return d;
  return d.slice(0, d.length - 2) + ":" + d.slice(-2);
}

// ─── CSV Parser ───────────────────────────────────────────────────────────────
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim()); current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

// ─── Pill selector ────────────────────────────────────────────────────────────
function PillGroup<T extends string>({
  label, options, value, onChange,
}: {
  label: string; options: readonly T[]; value: T | ""; onChange: (v: T) => void;
}) {
  return (
    <div>
      <p className="text-xs text-slate-400 mb-1.5 uppercase tracking-widest">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button key={opt} type="button" onClick={() => onChange(opt)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
              value === opt
                ? "bg-indigo-600 border-indigo-500 text-white"
                : "bg-[#2d2f45] border-[#3d3f5e] text-slate-300 hover:border-indigo-500"
            }`}>
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Log Entry Tab ────────────────────────────────────────────────────────────
const BLANK: Omit<Entry, "id"> = {
  date: localDateStr(),
  ticker: "",
  time: "",
  tradeType: "Day",
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

  useEffect(() => {
    const risk = parseFloat(form.initialRisk);
    const amt = Math.abs(parseFloat(form.amount));
    if (risk > 0 && amt > 0) {
      setForm((prev) => ({ ...prev, rrRatio: (amt / risk).toFixed(2) }));
    }
  }, [form.initialRisk, form.amount]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.event || !form.location || !form.state || !form.result) {
      setError("Select Event, Location, State, and W/L/BE.");
      return;
    }
    setError("");
    const absAmount = Math.abs(parseFloat(form.amount) || 0).toString();
    onSave({ ...form, amount: absAmount, id: crypto.randomUUID() });
    setForm({ ...BLANK });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      {/* Row 1: Date / Ticker / Time */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-slate-400 uppercase tracking-widest block mb-1.5">Date</label>
          <input type="date" value={form.date}
            onChange={(e) => set("date", e.target.value)}
            className="w-full bg-[#2d2f45] border border-[#3d3f5e] rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500" />
        </div>
        <div>
          <label className="text-xs text-slate-400 uppercase tracking-widest block mb-1.5">Ticker</label>
          <input type="text" value={form.ticker} placeholder="AAPL"
            onChange={(e) => set("ticker", e.target.value.toUpperCase())}
            className="w-full bg-[#2d2f45] border border-[#3d3f5e] rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500" />
        </div>
        <div>
          <label className="text-xs text-slate-400 uppercase tracking-widest block mb-1.5">Time</label>
          <input type="text" value={form.time} placeholder="9:30"
            onChange={(e) => set("time", autoColon(e.target.value))}
            className="w-full bg-[#2d2f45] border border-[#3d3f5e] rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500" />
        </div>
      </div>

      {/* Day / Swing toggle */}
      <div>
        <p className="text-xs text-slate-400 mb-1.5 uppercase tracking-widest">Trade Type</p>
        <div className="flex gap-2">
          {(["Day", "Swing"] as const).map((t) => (
            <button key={t} type="button" onClick={() => set("tradeType", t)}
              className={`px-5 py-1.5 rounded-full text-sm font-medium border transition-all ${
                form.tradeType === t
                  ? "bg-indigo-600 border-indigo-500 text-white"
                  : "bg-[#2d2f45] border-[#3d3f5e] text-slate-300 hover:border-indigo-500"
              }`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <PillGroup label="Event" options={EVENTS} value={form.event as any} onChange={(v) => set("event", v)} />
      <PillGroup label="Location" options={LOCATIONS} value={form.location as any} onChange={(v) => set("location", v)} />
      <PillGroup label="State (20/200 MA)" options={STATES} value={form.state as any} onChange={(v) => set("state", v)} />

      {/* Init Risk / W-L-BE / Amount / R:R */}
      <div className="grid grid-cols-4 gap-3">
        <div>
          <label className="text-xs text-slate-400 uppercase tracking-widest block mb-1.5">Init. Risk $</label>
          <input type="number" value={form.initialRisk} placeholder="100"
            onChange={(e) => set("initialRisk", e.target.value)}
            className="w-full bg-[#2d2f45] border border-[#3d3f5e] rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500" />
        </div>

        <div>
          <label className="text-xs text-slate-400 uppercase tracking-widest block mb-1.5">Result</label>
          <div className="flex gap-1">
            {(["W", "L", "BE"] as const).map((r) => (
              <button key={r} type="button" onClick={() => set("result", r)}
                className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-all ${
                  form.result === r
                    ? r === "W"
                      ? "bg-emerald-600 border-emerald-500 text-white"
                      : r === "L"
                      ? "bg-red-600 border-red-500 text-white"
                      : "bg-amber-500 border-amber-400 text-white"
                    : "bg-[#2d2f45] border-[#3d3f5e] text-slate-400 hover:border-slate-500"
                }`}>
                {r}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-400 uppercase tracking-widest block mb-1.5">$ Amount</label>
          <input type="number" value={form.amount} placeholder="250"
            onChange={(e) => set("amount", e.target.value)}
            className="w-full bg-[#2d2f45] border border-[#3d3f5e] rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500" />
        </div>

        <div>
          <label className="text-xs text-slate-400 uppercase tracking-widest block mb-1.5">
            R:R <span className="text-indigo-400 normal-case">(auto)</span>
          </label>
          <input type="text" value={form.rrRatio} placeholder="auto"
            onChange={(e) => set("rrRatio", e.target.value)}
            className="w-full bg-[#2d2f45] border border-[#3d3f5e] rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500" />
        </div>
      </div>

      <div>
        <label className="text-xs text-slate-400 uppercase tracking-widest block mb-1.5">Notes</label>
        <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)}
          rows={3} placeholder="Optional notes..."
          className="w-full bg-[#2d2f45] border border-[#3d3f5e] rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none" />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button type="submit"
        className="px-6 py-2.5 rounded-lg font-semibold text-sm bg-indigo-600 hover:bg-indigo-500 transition-colors">
        {saved ? "Saved!" : "Log Entry"}
      </button>
    </form>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────
function EditModal({ entry, onSave, onClose }: { entry: Entry; onSave: (e: Entry) => void; onClose: () => void }) {
  const [form, setForm] = useState({ ...entry });
  const [error, setError] = useState("");

  const set = (k: keyof Entry, v: string) => setForm((prev) => ({ ...prev, [k]: v }));

  useEffect(() => {
    const risk = parseFloat(form.initialRisk);
    const amt = Math.abs(parseFloat(form.amount));
    if (risk > 0 && amt > 0) {
      setForm((prev) => ({ ...prev, rrRatio: (amt / risk).toFixed(2) }));
    }
  }, [form.initialRisk, form.amount]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.event || !form.location || !form.state || !form.result) {
      setError("Select Event, Location, State, and W/L/BE.");
      return;
    }
    const absAmount = Math.abs(parseFloat(form.amount) || 0).toString();
    onSave({ ...form, amount: absAmount });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div className="bg-[#1e2035] border border-[#3d3f5e] rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-slate-100">Edit Entry</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-xl leading-none">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-widest block mb-1.5">Date</label>
              <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)}
                className="w-full bg-[#2d2f45] border border-[#3d3f5e] rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-widest block mb-1.5">Ticker</label>
              <input type="text" value={form.ticker} onChange={(e) => set("ticker", e.target.value.toUpperCase())}
                className="w-full bg-[#2d2f45] border border-[#3d3f5e] rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-widest block mb-1.5">Time</label>
              <input type="text" value={form.time} onChange={(e) => set("time", autoColon(e.target.value))}
                className="w-full bg-[#2d2f45] border border-[#3d3f5e] rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500" />
            </div>
          </div>

          <div>
            <p className="text-xs text-slate-400 mb-1.5 uppercase tracking-widest">Trade Type</p>
            <div className="flex gap-2">
              {(["Day", "Swing"] as const).map((t) => (
                <button key={t} type="button" onClick={() => set("tradeType", t)}
                  className={`px-5 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    form.tradeType === t ? "bg-indigo-600 border-indigo-500 text-white" : "bg-[#2d2f45] border-[#3d3f5e] text-slate-300 hover:border-indigo-500"
                  }`}>{t}</button>
              ))}
            </div>
          </div>

          <PillGroup label="Event" options={EVENTS} value={form.event as any} onChange={(v) => set("event", v)} />
          <PillGroup label="Location" options={LOCATIONS} value={form.location as any} onChange={(v) => set("location", v)} />
          <PillGroup label="State (20/200 MA)" options={STATES} value={form.state as any} onChange={(v) => set("state", v)} />

          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-widest block mb-1.5">Init. Risk $</label>
              <input type="number" value={form.initialRisk} onChange={(e) => set("initialRisk", e.target.value)}
                className="w-full bg-[#2d2f45] border border-[#3d3f5e] rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-widest block mb-1.5">Result</label>
              <div className="flex gap-1">
                {(["W", "L", "BE"] as const).map((r) => (
                  <button key={r} type="button" onClick={() => set("result", r)}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-all ${
                      form.result === r
                        ? r === "W" ? "bg-emerald-600 border-emerald-500 text-white"
                          : r === "L" ? "bg-red-600 border-red-500 text-white"
                          : "bg-amber-500 border-amber-400 text-white"
                        : "bg-[#2d2f45] border-[#3d3f5e] text-slate-400 hover:border-slate-500"
                    }`}>{r}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-widest block mb-1.5">$ Amount</label>
              <input type="number" value={form.amount} onChange={(e) => set("amount", e.target.value)}
                className="w-full bg-[#2d2f45] border border-[#3d3f5e] rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-widest block mb-1.5">R:R (auto)</label>
              <input type="text" value={form.rrRatio} onChange={(e) => set("rrRatio", e.target.value)}
                className="w-full bg-[#2d2f45] border border-[#3d3f5e] rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500" />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 uppercase tracking-widest block mb-1.5">Notes</label>
            <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3}
              className="w-full bg-[#2d2f45] border border-[#3d3f5e] rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 resize-none" />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="submit" className="px-6 py-2.5 rounded-lg font-semibold text-sm bg-indigo-600 hover:bg-indigo-500 transition-colors">
              Save Changes
            </button>
            <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-lg font-semibold text-sm bg-[#2d2f45] border border-[#3d3f5e] text-slate-300 hover:text-white transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Date Range ───────────────────────────────────────────────────────────────
function getDateRange(filter: "day" | "week" | "month" | "ytd"): [Date, Date] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  if (filter === "day") return [today, end];

  if (filter === "week") {
    const day = today.getDay();
    const daysToMon = day === 0 ? 6 : day - 1;
    const start = new Date(today);
    start.setDate(today.getDate() - daysToMon);
    return [start, end];
  }

  if (filter === "month") {
    return [new Date(today.getFullYear(), today.getMonth(), 1), end];
  }

  return [new Date(today.getFullYear(), 0, 1), end];
}

// ─── Select style helper ──────────────────────────────────────────────────────
const selectCls =
  "bg-[#2d2f45] border border-[#3d3f5e] rounded-lg px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer";

// ─── Entries Table ────────────────────────────────────────────────────────────
const COLS: { key: keyof Entry; label: string }[] = [
  { key: "date",        label: "Date"   },
  { key: "ticker",      label: "Ticker" },
  { key: "time",        label: "Time"   },
  { key: "tradeType",   label: "Type"   },
  { key: "event",       label: "Event"  },
  { key: "location",    label: "Loc."   },
  { key: "state",       label: "State"  },
  { key: "initialRisk", label: "Risk $" },
  { key: "result",      label: "W/L"    },
  { key: "amount",      label: "$ P&L"  },
  { key: "rrRatio",     label: "R:R"    },
  { key: "notes",       label: "Notes"  },
];

function EntriesTable({ entries, onDelete, onUpdate, onAddToLeaderboard }: {
  entries: Entry[];
  onDelete: (id: string) => void;
  onUpdate: (e: Entry) => void;
  onAddToLeaderboard?: (id: string) => void;
}) {
  const [rangeFilter, setRangeFilter] = useState<"day" | "week" | "month" | "ytd">("month");
  const [filterTicker,   setFilterTicker]   = useState("");
  const [filterEvent,    setFilterEvent]    = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterState,    setFilterState]    = useState("");
  const [filterResult,   setFilterResult]   = useState("");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [editEntry, setEditEntry] = useState<Entry | null>(null);
  const [lockedDismissed, setLockedDismissed] = useState(false);

  // Daily risk lock
  const todayStr = localDateStr();
  const todayPnl = entries.reduce((sum, e) => {
    if (e.date !== todayStr) return sum;
    const amt = Math.abs(parseFloat(e.amount) || 0);
    return sum + (e.result === "L" ? -amt : e.result === "BE" ? 0 : amt);
  }, 0);
  const isLocked = todayPnl <= -700 && !lockedDismissed;

  if (entries.length === 0) {
    return <p className="text-slate-500 text-sm">No entries yet — log one on the Log tab.</p>;
  }

  const [rangeStart, rangeEnd] = getDateRange(rangeFilter);

  const displayed = entries.filter((e) => {
    const d = new Date(e.date + "T00:00:00");
    if (d < rangeStart || d >= rangeEnd) return false;
    if (filterTicker && !e.ticker.toLowerCase().includes(filterTicker.toLowerCase())) return false;
    if (filterEvent && e.event !== filterEvent) return false;
    if (filterLocation && e.location !== filterLocation) return false;
    if (filterState && e.state !== filterState) return false;
    if (filterResult && e.result !== filterResult) return false;
    return true;
  });

  const totalPnl = displayed.reduce((sum, e) => {
    const amt = Math.abs(parseFloat(e.amount) || 0);
    return sum + (e.result === "L" ? -amt : e.result === "BE" ? 0 : amt);
  }, 0);

  const wins   = displayed.filter((e) => e.result === "W");
  const losses = displayed.filter((e) => e.result === "L");
  const decided = wins.length + losses.length;
  const winRate = decided > 0 ? Math.round((wins.length / decided) * 100) : 0;

  const avgRR = (() => {
    const valid = displayed.filter((e) => parseFloat(e.rrRatio) > 0);
    if (valid.length === 0) return "—";
    return (valid.reduce((s, e) => s + (parseFloat(e.rrRatio) || 0), 0) / valid.length).toFixed(2);
  })();

  const avgWin = wins.length > 0
    ? (wins.reduce((s, e) => s + Math.abs(parseFloat(e.amount) || 0), 0) / wins.length).toFixed(0)
    : "—";

  const avgLoss = losses.length > 0
    ? (losses.reduce((s, e) => s + Math.abs(parseFloat(e.amount) || 0), 0) / losses.length).toFixed(0)
    : "—";

  return (
    <div className="space-y-4">
      {/* ── Daily risk lock overlay ── */}
      {isLocked && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90">
          <button onClick={() => setLockedDismissed(true)}
            className="absolute top-6 right-8 text-slate-400 hover:text-white text-3xl leading-none transition-colors">✕</button>
          <p className="text-[10rem] font-black text-red-500 tracking-widest leading-none animate-pulse select-none">LOCKED</p>
          <p className="text-red-400 text-2xl font-bold mt-4">Daily loss limit of $700 reached</p>
          <p className="text-slate-400 text-base mt-2">Today&apos;s P&amp;L: <span className="text-red-400 font-semibold">${todayPnl.toFixed(0)}</span></p>
        </div>
      )}
      {/* ── Range filter buttons at TOP ── */}
      <div className="flex items-center gap-2 flex-wrap">
        {(["day", "week", "month", "ytd"] as const).map((r) => (
          <button key={r} onClick={() => setRangeFilter(r)}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              rangeFilter === r
                ? "bg-indigo-600 text-white"
                : "bg-[#2d2f45] border border-[#3d3f5e] text-slate-400 hover:text-slate-200"
            }`}>
            {r.toUpperCase()}
          </button>
        ))}
        <span className="text-slate-500 text-xs ml-1">
          {displayed.length} trade{displayed.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Filter dropdowns ── */}
      <div className="flex flex-wrap gap-2 items-center">
        <input
          type="text"
          placeholder="Filter ticker..."
          value={filterTicker}
          onChange={(e) => setFilterTicker(e.target.value)}
          className="bg-[#2d2f45] border border-[#3d3f5e] rounded-lg px-2 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-32"
        />
        <select value={filterEvent} onChange={(e) => setFilterEvent(e.target.value)} className={selectCls}>
          <option value="">All Events</option>
          {EVENTS.map((ev) => <option key={ev} value={ev}>{ev}</option>)}
        </select>
        <select value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)} className={selectCls}>
          <option value="">All Loc.</option>
          {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
        <select value={filterState} onChange={(e) => setFilterState(e.target.value)} className={selectCls}>
          <option value="">All States</option>
          {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterResult} onChange={(e) => setFilterResult(e.target.value)} className={selectCls}>
          <option value="">All Results</option>
          <option value="W">W</option>
          <option value="L">L</option>
          <option value="BE">BE</option>
        </select>
        {(filterTicker || filterEvent || filterLocation || filterState || filterResult) && (
          <button onClick={() => { setFilterTicker(""); setFilterEvent(""); setFilterLocation(""); setFilterState(""); setFilterResult(""); }}
            className="text-xs text-slate-500 hover:text-slate-300 underline">
            Clear filters
          </button>
        )}
      </div>

      {/* ── Stats row ── */}
      <div className="flex flex-wrap gap-4 text-sm">
        <span className={totalPnl >= 0 ? "text-emerald-400 font-semibold" : "text-red-400 font-semibold"}>
          Total P&L: {totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(0)}
        </span>
        <span className="text-slate-400">Win rate: {winRate}%</span>
        <span className="text-slate-400">Avg R:R: {avgRR}</span>
        <span className="text-emerald-400">Avg Win: {avgWin !== "—" ? `+$${avgWin}` : "—"}</span>
        <span className="text-red-400">Avg Loss: {avgLoss !== "—" ? `-$${avgLoss}` : "—"}</span>
      </div>

      {/* ── Table ── */}
      <div className="overflow-x-auto rounded-lg border border-[#3d3f5e]">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#2d2f45]">
              {COLS.map((c) => (
                <th key={c.key}
                  className="px-3 py-2.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-[#3d3f5e] whitespace-nowrap">
                  {c.label}
                </th>
              ))}
              <th className="px-3 py-2.5 border-b border-[#3d3f5e] w-8" />
            </tr>
          </thead>
          <tbody>
            {displayed.map((row) => (
              <tr key={row.id} className={`border-b border-[#3d3f5e] transition-colors ${row.flagged ? "bg-amber-950/30 hover:bg-amber-950/50" : "hover:bg-[#252740]"}`}>
                {COLS.map((c) => {
                  let display: string = row[c.key] as string;
                  if (c.key === "date") display = fmtDate(row.date);
                  if (c.key === "amount" && row.amount) {
                    const abs = Math.abs(parseFloat(row.amount) || 0).toFixed(0);
                    display = row.result === "L" ? `-$${abs}` : row.result === "BE" ? `$${abs}` : `+$${abs}`;
                  }
                  const cls =
                    c.key === "result"
                      ? row.result === "W"
                        ? "text-emerald-400 font-bold"
                        : row.result === "BE"
                        ? "text-amber-400 font-bold"
                        : "text-red-400 font-bold"
                      : c.key === "amount"
                      ? row.result === "W"
                        ? "text-emerald-400"
                        : row.result === "BE"
                        ? "text-amber-400"
                        : "text-red-400"
                      : c.key === "notes"
                      ? "text-slate-400 max-w-xs truncate"
                      : "text-slate-300";

                  return (
                    <td key={c.key} className={`px-3 py-2 whitespace-nowrap ${cls}`}>
                      {display}
                    </td>
                  );
                })}
                {/* Flag/star cell */}
                <td className="px-1 py-2">
                  <button
                    onClick={() => onUpdate({ ...row, flagged: !row.flagged })}
                    className={`text-lg leading-none transition-colors ${row.flagged ? "text-amber-400" : "text-slate-700 hover:text-amber-400"}`}
                    title={row.flagged ? "Unflag" : "Flag"}
                  >★</button>
                </td>
                {/* Three-dot menu cell */}
                <td className="px-2 py-2 relative">
                  <button
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === row.id ? null : row.id); }}
                    className="text-slate-500 hover:text-slate-200 px-1 py-0.5 rounded transition-colors text-base leading-none font-bold"
                  >
                    ···
                  </button>
                  {menuOpen === row.id && (
                    <>
                      {/* backdrop to close on outside click */}
                      <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                      <div className="absolute right-0 top-7 z-20 bg-[#1e2035] border border-[#3d3f5e] rounded-lg shadow-xl overflow-hidden w-28">
                        <button
                          onClick={() => { setEditEntry(row); setMenuOpen(null); }}
                          className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-indigo-600 transition-colors"
                        >
                          Edit
                        </button>
                        {onAddToLeaderboard && (
                          <button
                            onClick={() => { onAddToLeaderboard(row.id); setMenuOpen(null); }}
                            className="w-full text-left px-4 py-2 text-sm text-indigo-300 hover:bg-indigo-600 hover:text-white transition-colors"
                          >
                            Add to Leaderboard
                          </button>
                        )}
                        <button
                          onClick={() => { onDelete(row.id); setMenuOpen(null); }}
                          className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-600 hover:text-white transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {displayed.length === 0 && (
          <p className="text-slate-500 text-sm text-center py-6">No trades match the current filters.</p>
        )}
      </div>

      {/* Edit modal */}
      {editEntry && (
        <EditModal
          entry={editEntry}
          onSave={onUpdate}
          onClose={() => setEditEntry(null)}
        />
      )}
    </div>
  );
}

// ─── Journal Sheet ────────────────────────────────────────────────────────────
function JournalSheet({ journal, onChange, onBack, onMarketChange }: {
  journal: Journal;
  onChange: (j: Journal) => void;
  onBack: () => void;
  onMarketChange?: (on: boolean) => void;
}) {
  const set = <K extends keyof Journal>(k: K, v: Journal[K]) => {
    onChange({ ...journal, [k]: v });
    if (k === "marketOn") onMarketChange?.(v as boolean);
  };

  const toggleGoal = (i: number) => {
    const goals = journal.goals.map((g, idx) =>
      idx === i ? { ...g, checked: !g.checked } : g
    ) as [Goal, Goal, Goal];
    set("goals", goals);
  };

  const setGoalText = (i: number, text: string) => {
    const goals = journal.goals.map((g, idx) =>
      idx === i ? { ...g, text } : g
    ) as [Goal, Goal, Goal];
    set("goals", goals);
  };

  // ── Calculator state ──
  const [calcDisplay, setCalcDisplay] = useState("0");
  const [prevVal, setPrevVal] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitNext, setWaitNext] = useState(false);
  const calcInputRef = useRef<HTMLInputElement>(null);

  // Options exit-price panel state
  // entry is captured (normalized to $) when "−" is first pressed
  // contracts + riskTotal are captured when "×" resolves
  const [tradeEntry,          setTradeEntry]          = useState<number | null>(null);
  const [tradeEntryIsDecimal, setTradeEntryIsDecimal] = useState(true);
  const [tradeContracts,      setTradeContracts]      = useState<number | null>(null);
  const [tradeRiskTotal,      setTradeRiskTotal]      = useState<number | null>(null);

  // Normalize an option price: whole numbers ≥10 are treated as cents (279 → 2.79)
  const normOptPrice = (str: string): number => {
    const v = parseFloat(str);
    return (!str.includes(".") && v >= 10) ? v / 100 : v;
  };

  // Exit price for a given R multiple:
  //   profit_dollars  = riskTotal × r × (isDecimal ? 100 : 1)
  //   exit            = entry + profit_dollars / contracts / 100
  const exitForR = (r: number): string | null => {
    if (tradeEntry === null || tradeContracts === null || tradeRiskTotal === null || tradeContracts === 0) return null;
    const profitDollars    = tradeRiskTotal * r * (tradeEntryIsDecimal ? 100 : 1);
    const profitPerContract = profitDollars / tradeContracts;
    return (tradeEntry + profitPerContract / 100).toFixed(2);
  };

  const calcNum = (n: string) => {
    if (waitNext) { setCalcDisplay(n); setWaitNext(false); }
    else setCalcDisplay(calcDisplay === "0" ? n : calcDisplay + n);
  };
  const calcDot = () => { if (!calcDisplay.includes(".")) setCalcDisplay(calcDisplay + "."); };
  const doCalcResult = (a: number, b: number, op: string) => {
    if (op === "+") return a + b;
    if (op === "−") return a - b;
    if (op === "×") return a * b;
    if (op === "÷") return b !== 0 ? a / b : 0;
    return b;
  };
  const calcOp = (op: string) => {
    const cur = parseFloat(calcDisplay);
    // Capture entry when the user first presses "−" (no pending value yet)
    if (op === "−" && prevVal === null) {
      setTradeEntry(normOptPrice(calcDisplay));
      setTradeEntryIsDecimal(calcDisplay.includes("."));
    }
    // Dividing = backing out a contract size; reset so next × re-triggers the panel
    if (op === "÷") {
      setTradeContracts(null);
      setTradeRiskTotal(null);
    }
    if (prevVal !== null && operator && !waitNext) {
      const res = doCalcResult(prevVal, cur, operator);
      if (operator === "×") { setTradeContracts(cur); setTradeRiskTotal(res); }
      setCalcDisplay(String(res)); setPrevVal(res);
    } else { setPrevVal(cur); }
    setOperator(op); setWaitNext(true);
  };
  const calcEquals = () => {
    if (prevVal === null || !operator) return;
    const b = parseFloat(calcDisplay);
    const res = doCalcResult(prevVal, b, operator);
    if (operator === "×") { setTradeContracts(b); setTradeRiskTotal(res); }
    setCalcDisplay(String(parseFloat(res.toFixed(10))));
    setPrevVal(null); setOperator(null); setWaitNext(true);
  };
  const calcClear = () => {
    setCalcDisplay("0"); setPrevVal(null); setOperator(null); setWaitNext(false);
    setTradeEntry(null); setTradeEntryIsDecimal(true);
    setTradeContracts(null); setTradeRiskTotal(null);
  };
  const calcBack = () => setCalcDisplay(calcDisplay.length > 1 ? calcDisplay.slice(0, -1) : "0");
  const calcMultiply = (factor: number) => {
    const val = parseFloat(calcDisplay) || 0;
    setCalcDisplay(String(parseFloat((val * factor).toFixed(10))));
    setWaitNext(true);
  };

  // Keyboard support — skip if user is typing in any input/textarea/contenteditable
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t !== calcInputRef.current && (["INPUT","TEXTAREA"].includes(t.tagName) || t.contentEditable === "true")) return;
      if (e.key >= "0" && e.key <= "9") { e.preventDefault(); calcNum(e.key); }
      else if (e.key === ".") { e.preventDefault(); calcDot(); }
      else if (e.key === "+") { e.preventDefault(); calcOp("+"); }
      else if (e.key === "-") { e.preventDefault(); calcOp("−"); }
      else if (e.key === "*") { e.preventDefault(); calcOp("×"); }
      else if (e.key === "/") { e.preventDefault(); calcOp("÷"); }
      else if (e.key === "Enter") { e.preventDefault(); calcEquals(); }
      else if (e.key === "Backspace") { e.preventDefault(); calcBack(); }
      else if (e.key === "Escape") { e.preventDefault(); calcClear(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [calcDisplay, prevVal, operator, waitNext]);

  // ── Rich text editor ──
  const editorRef = useRef<HTMLDivElement>(null);
  const editorInitId = useRef<string | null>(null);
  useEffect(() => {
    if (editorRef.current && editorInitId.current !== journal.id) {
      editorRef.current.innerHTML = journal.observations || "";
      editorInitId.current = journal.id;
    }
  }, [journal.id]);

  const reviewRef = useRef<HTMLDivElement>(null);
  const reviewInitId = useRef<string | null>(null);
  useEffect(() => {
    if (reviewRef.current && reviewInitId.current !== journal.id) {
      reviewRef.current.innerHTML = journal.review || "";
      reviewInitId.current = journal.id;
    }
  }, [journal.id]);
  const execCmd = (cmd: string, val?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
  };
  const execReviewCmd = (cmd: string, val?: string) => {
    reviewRef.current?.focus();
    document.execCommand(cmd, false, val);
  };

  const btnCls = "flex items-center justify-center rounded-lg text-sm font-semibold h-10 transition-all cursor-pointer select-none";
  const rBtnCls = "flex items-center justify-center rounded-lg text-xs font-bold h-10 bg-violet-900/60 hover:bg-violet-700 text-violet-200 transition-all cursor-pointer select-none";

  return (
    <div className="space-y-4">
      {/* Back */}
      <button onClick={onBack} className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1">
        ← All Journals
      </button>

      {/* Play to Win header */}
      <h2 className="text-2xl font-extrabold tracking-tight text-white">
        Play to <span className="text-indigo-400">Win</span>
      </h2>

      {/* Market toggle */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-slate-300">Market</span>
        <button type="button" onClick={() => set("marketOn", !journal.marketOn)}
          className={`relative inline-flex items-center w-14 h-7 rounded-full transition-colors duration-200 ${journal.marketOn ? "bg-emerald-500" : "bg-slate-600"}`}>
          <span className={`absolute w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${journal.marketOn ? "translate-x-8" : "translate-x-1"}`} />
        </button>
        <span className={`text-sm font-semibold ${journal.marketOn ? "text-emerald-400" : "text-slate-500"}`}>
          {journal.marketOn ? "ON — Make the next right decision" : "OFF"}
        </span>
      </div>

      {/* Calculator + R-target panel */}
      <div className="flex justify-center gap-3 items-start">
        <div className="bg-[#1e2035] border border-[#3d3f5e] rounded-xl p-4 w-72">
          <input
            ref={calcInputRef}
            type="text"
            value={calcDisplay}
            onChange={(e) => { const c = e.target.value.replace(/[^0-9.]/g, ""); setCalcDisplay(c || "0"); }}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); calcEquals(); }
            }}
            className="w-full bg-[#2d2f45] border border-[#3d3f5e] rounded-lg px-3 py-2 text-right text-xl font-mono text-slate-100 mb-3 focus:outline-none focus:border-indigo-500"
          />
          {/* R multiplier buttons */}
          <div className="grid grid-cols-3 gap-1 mb-2">
            {([["2R", 2], ["2.5R", 2.5], ["3R", 3]] as const).map(([label, factor]) => (
              <button key={label} onClick={() => calcMultiply(factor)} className={rBtnCls}>{label}</button>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-1">
            {[
              { label: "C",  action: calcClear,         cls: "bg-red-900/60 hover:bg-red-700 text-red-300 col-span-2" },
              { label: "⌫",  action: calcBack,          cls: "bg-[#2d2f45] hover:bg-[#3d3f5e] text-slate-300" },
              { label: "÷",  action: () => calcOp("÷"), cls: "bg-indigo-900/60 hover:bg-indigo-700 text-indigo-300" },
              { label: "7",  action: () => calcNum("7"), cls: "bg-[#2d2f45] hover:bg-[#3d3f5e] text-slate-200" },
              { label: "8",  action: () => calcNum("8"), cls: "bg-[#2d2f45] hover:bg-[#3d3f5e] text-slate-200" },
              { label: "9",  action: () => calcNum("9"), cls: "bg-[#2d2f45] hover:bg-[#3d3f5e] text-slate-200" },
              { label: "×",  action: () => calcOp("×"), cls: "bg-indigo-900/60 hover:bg-indigo-700 text-indigo-300" },
              { label: "4",  action: () => calcNum("4"), cls: "bg-[#2d2f45] hover:bg-[#3d3f5e] text-slate-200" },
              { label: "5",  action: () => calcNum("5"), cls: "bg-[#2d2f45] hover:bg-[#3d3f5e] text-slate-200" },
              { label: "6",  action: () => calcNum("6"), cls: "bg-[#2d2f45] hover:bg-[#3d3f5e] text-slate-200" },
              { label: "−",  action: () => calcOp("−"), cls: "bg-indigo-900/60 hover:bg-indigo-700 text-indigo-300" },
              { label: "1",  action: () => calcNum("1"), cls: "bg-[#2d2f45] hover:bg-[#3d3f5e] text-slate-200" },
              { label: "2",  action: () => calcNum("2"), cls: "bg-[#2d2f45] hover:bg-[#3d3f5e] text-slate-200" },
              { label: "3",  action: () => calcNum("3"), cls: "bg-[#2d2f45] hover:bg-[#3d3f5e] text-slate-200" },
              { label: "+",  action: () => calcOp("+"), cls: "bg-indigo-900/60 hover:bg-indigo-700 text-indigo-300" },
              { label: "0",  action: () => calcNum("0"), cls: "bg-[#2d2f45] hover:bg-[#3d3f5e] text-slate-200 col-span-2" },
              { label: ".",  action: calcDot,            cls: "bg-[#2d2f45] hover:bg-[#3d3f5e] text-slate-200" },
              { label: "=",  action: calcEquals,         cls: "bg-indigo-600 hover:bg-indigo-500 text-white" },
            ].map((btn, i) => (
              <button key={i} onClick={btn.action} className={`${btnCls} ${btn.cls}`}>{btn.label}</button>
            ))}
          </div>
        </div>

        {/* R-target panel */}
        <div className="bg-[#1e2035] border border-[#3d3f5e] rounded-xl p-4 w-48 flex-shrink-0 space-y-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Target Exit Price</p>
          {tradeEntry !== null && tradeContracts !== null && tradeRiskTotal !== null ? (
            <div className="space-y-2">
              <p className="text-xs text-slate-600 text-center font-mono leading-relaxed">
                entry {tradeEntry.toFixed(2)}<br/>{tradeContracts} contracts
              </p>
              {([["2R", 2], ["2.5R", 2.5], ["3R", 3]] as const).map(([label, r]) => {
                const exit = exitForR(r);
                return (
                  <div key={label} className="bg-[#252740] rounded-lg px-3 py-2.5 flex items-center justify-between">
                    <span className="text-xs font-bold text-violet-300">{label}</span>
                    <span className="text-sm font-mono font-bold text-emerald-300">
                      {exit ?? "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-slate-600 text-xs text-center py-4 leading-relaxed">
              entry − stop<br/>× contracts<br/>to see exit prices
            </p>
          )}
        </div>
      </div>

      {/* Date */}
      <div>
        <label className="text-xs text-slate-400 uppercase tracking-widest block mb-1">Date</label>
        <input
          type="text"
          value={journal.date}
          onChange={(e) => set("date", e.target.value)}
          placeholder="e.g. March 24, 2026"
          className="text-2xl font-bold bg-transparent border-b border-[#3d3f5e] text-slate-100 focus:outline-none focus:border-indigo-500 pb-1 w-full placeholder-slate-700"
        />
      </div>

      {/* Weekly Goals */}
      <div className="space-y-2">
        <h3 className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Weekly Goals</h3>
        {journal.goals.map((goal, i) => (
          <div key={i} className="flex items-center gap-3">
            <button type="button" onClick={() => toggleGoal(i)}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                goal.checked ? "bg-emerald-500 border-emerald-500" : "bg-transparent border-[#3d3f5e] hover:border-indigo-400"
              }`}>
              {goal.checked && <span className="text-white text-xs leading-none">✓</span>}
            </button>
            <input
              type="text"
              value={goal.text}
              onChange={(e) => setGoalText(i, e.target.value)}
              placeholder={`Goal ${i + 1}...`}
              className={`flex-1 bg-transparent border-b border-[#3d3f5e] text-sm focus:outline-none focus:border-indigo-500 pb-1 placeholder-slate-600 transition-all ${
                goal.checked ? "line-through text-slate-500" : "text-slate-200"
              }`}
            />
          </div>
        ))}
      </div>

      {/* Observations and Actions — rich text */}
      <div className="space-y-0">
        <h3 className="text-sm font-semibold text-slate-200 mb-1">Observations and Actions</h3>
        {/* Toolbar */}
        <div className="flex flex-wrap gap-1 p-2 bg-[#2d2f45] border border-b-0 border-[#3d3f5e] rounded-t-xl">
          <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd("bold"); }}
            className="px-2 py-1 rounded text-xs font-bold text-slate-200 hover:bg-[#3d3f5e] transition-colors">B</button>
          <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd("italic"); }}
            className="px-2 py-1 rounded text-xs italic text-slate-200 hover:bg-[#3d3f5e] transition-colors">I</button>
          <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd("underline"); }}
            className="px-2 py-1 rounded text-xs underline text-slate-200 hover:bg-[#3d3f5e] transition-colors">U</button>
          <div className="w-px bg-[#3d3f5e] mx-1" />
          <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd("justifyLeft"); }}
            className="px-2 py-1 rounded text-xs text-slate-200 hover:bg-[#3d3f5e] transition-colors" title="Align left">≡←</button>
          <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd("justifyCenter"); }}
            className="px-2 py-1 rounded text-xs text-slate-200 hover:bg-[#3d3f5e] transition-colors" title="Center">≡</button>
          <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd("justifyRight"); }}
            className="px-2 py-1 rounded text-xs text-slate-200 hover:bg-[#3d3f5e] transition-colors" title="Align right">→≡</button>
          <div className="w-px bg-[#3d3f5e] mx-1" />
          {["#f87171","#34d399","#60a5fa","#fbbf24","#e879f9","#ffffff"].map((color) => (
            <button key={color} type="button" onMouseDown={(e) => { e.preventDefault(); execCmd("foreColor", color); }}
              className="w-5 h-5 rounded-full border border-[#3d3f5e] flex-shrink-0"
              style={{ backgroundColor: color }} />
          ))}
          <div className="w-px bg-[#3d3f5e] mx-1" />
          <select defaultValue="" onMouseDown={(e) => e.stopPropagation()}
            onChange={(e) => { execCmd("fontSize", e.target.value); e.target.value = ""; }}
            className="bg-[#1e2035] border border-[#3d3f5e] rounded text-xs text-slate-300 px-1 focus:outline-none cursor-pointer">
            <option value="" disabled>Size</option>
            <option value="1">XS</option>
            <option value="2">S</option>
            <option value="3">M</option>
            <option value="4">L</option>
            <option value="5">XL</option>
            <option value="6">2XL</option>
          </select>
        </div>
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={() => { if (editorRef.current) set("observations", editorRef.current.innerHTML); }}
          data-placeholder="Type your observations, thoughts, and planned actions here..."
          className="w-full bg-[#1e2035] border border-[#3d3f5e] rounded-b-xl p-4 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 min-h-64 leading-relaxed empty:before:content-[attr(data-placeholder)] empty:before:text-slate-600"
        />
      </div>

      {/* End of Day Review */}
      <div className="space-y-4 border-t border-[#3d3f5e] pt-6">
        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-widest">End of Day Review</h3>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex flex-col gap-2">
            <span className="text-xs text-slate-400 uppercase tracking-widest">Grade</span>
            <div className="flex gap-2">
              {(["A","B","C","D","F"] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => set("grade", journal.grade === g ? "" : g)}
                  className={`w-10 h-10 rounded-lg font-bold text-sm transition-all ${
                    journal.grade === g
                      ? g === "A" ? "bg-emerald-500 text-white"
                      : g === "B" ? "bg-sky-500 text-white"
                      : g === "C" ? "bg-yellow-500 text-black"
                      : g === "D" ? "bg-orange-500 text-white"
                      : "bg-red-600 text-white"
                      : "bg-[#2d2f45] text-slate-400 hover:text-slate-200 border border-[#3d3f5e]"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 bg-[#1e2035] rounded-xl border border-[#3d3f5e] p-3 text-xs text-slate-400 space-y-1">
            <div><span className="text-emerald-400 font-semibold">A</span> — Perfect execution, Management, Size</div>
            <div><span className="text-sky-400 font-semibold">B</span> — Great execution, management, size, some small fixes</div>
            <div><span className="text-yellow-400 font-semibold">C</span> — Acceptable execution, needs review</div>
            <div><span className="text-orange-400 font-semibold">D</span> — Poor execution, needs review</div>
            <div><span className="text-red-400 font-semibold">F</span> — Poor execution on trades outside of strategy</div>
          </div>
        </div>
        <div className="space-y-0">
          <h3 className="text-sm font-semibold text-slate-200 mb-1">Review Notes</h3>
          <div className="flex flex-wrap gap-1 p-2 bg-[#2d2f45] border border-b-0 border-[#3d3f5e] rounded-t-xl">
            <button type="button" onMouseDown={(e) => { e.preventDefault(); execReviewCmd("bold"); }}
              className="px-2 py-1 rounded text-xs font-bold text-slate-200 hover:bg-[#3d3f5e] transition-colors">B</button>
            <button type="button" onMouseDown={(e) => { e.preventDefault(); execReviewCmd("italic"); }}
              className="px-2 py-1 rounded text-xs italic text-slate-200 hover:bg-[#3d3f5e] transition-colors">I</button>
            <button type="button" onMouseDown={(e) => { e.preventDefault(); execReviewCmd("underline"); }}
              className="px-2 py-1 rounded text-xs underline text-slate-200 hover:bg-[#3d3f5e] transition-colors">U</button>
            <div className="w-px bg-[#3d3f5e] mx-1" />
            <button type="button" onMouseDown={(e) => { e.preventDefault(); execReviewCmd("justifyLeft"); }}
              className="px-2 py-1 rounded text-xs text-slate-200 hover:bg-[#3d3f5e] transition-colors" title="Align left">≡←</button>
            <button type="button" onMouseDown={(e) => { e.preventDefault(); execReviewCmd("justifyCenter"); }}
              className="px-2 py-1 rounded text-xs text-slate-200 hover:bg-[#3d3f5e] transition-colors" title="Center">≡</button>
            <button type="button" onMouseDown={(e) => { e.preventDefault(); execReviewCmd("justifyRight"); }}
              className="px-2 py-1 rounded text-xs text-slate-200 hover:bg-[#3d3f5e] transition-colors" title="Align right">→≡</button>
            <div className="w-px bg-[#3d3f5e] mx-1" />
            {["#f87171","#34d399","#60a5fa","#fbbf24","#e879f9","#ffffff"].map((color) => (
              <button key={color} type="button" onMouseDown={(e) => { e.preventDefault(); execReviewCmd("foreColor", color); }}
                className="w-5 h-5 rounded-full border border-[#3d3f5e] flex-shrink-0"
                style={{ backgroundColor: color }} />
            ))}
            <div className="w-px bg-[#3d3f5e] mx-1" />
            <select defaultValue="" onMouseDown={(e) => e.stopPropagation()}
              onChange={(e) => { execReviewCmd("fontSize", e.target.value); e.target.value = ""; }}
              className="bg-[#1e2035] border border-[#3d3f5e] rounded text-xs text-slate-300 px-1 focus:outline-none cursor-pointer">
              <option value="" disabled>Size</option>
              <option value="1">XS</option>
              <option value="2">S</option>
              <option value="3">M</option>
              <option value="4">L</option>
              <option value="5">XL</option>
              <option value="6">2XL</option>
            </select>
          </div>
          <div
            ref={reviewRef}
            contentEditable
            suppressContentEditableWarning
            onInput={() => { if (reviewRef.current) set("review", reviewRef.current.innerHTML); }}
            data-placeholder="Notes on your grade, what went well, what to improve..."
            className="w-full bg-[#1e2035] border border-[#3d3f5e] rounded-b-xl p-4 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 min-h-32 leading-relaxed empty:before:content-[attr(data-placeholder)] empty:before:text-slate-600"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Folder Icon ──────────────────────────────────────────────────────────────
function FolderIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="text-sky-400 flex-shrink-0">
      <path d="M2 6a2 2 0 012-2h4l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
    </svg>
  );
}

// ─── Daily Journal Tab ────────────────────────────────────────────────────────
function DailyJournalTab({ onMarketChange }: { onMarketChange?: (on: boolean) => void }) {
  // Start empty — loaded via useEffect to avoid SSR/hydration wiping localStorage
  const [journals, setJournals] = useState<Journal[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  // Guard: don't let save effects run until the initial load has completed.
  // Without this, the save effects fire on mount with [] and wipe localStorage
  // before the load effect can restore data (fatal in React 18 StrictMode).
  const [loaded, setLoaded] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const newFolderInputRef = useRef<HTMLInputElement>(null);

  // Load from Supabase once on mount
  useEffect(() => {
    Promise.all([
      getData<Journal[]>("trading-journals"),
      getData<Folder[]>("trading-journal-folders"),
    ]).then(([js, fs]) => {
      if (js) setJournals(js);
      if (fs) setFolders(fs);
      setLoaded(true);
    });
  }, []);

  // Save — only after initial load to prevent wiping stored data on mount
  useEffect(() => {
    if (!loaded || journals.length === 0) return;
    setData("trading-journals", journals);
  }, [journals, loaded]);

  useEffect(() => {
    if (!loaded) return;
    setData("trading-journal-folders", folders);
  }, [folders, loaded]);

  // Market glow is only reset by the toggle itself, not by navigation

  useEffect(() => {
    if (creatingFolder) newFolderInputRef.current?.focus();
  }, [creatingFolder]);

  const makeJournal = (folderId?: string): Journal => ({
    id: crypto.randomUUID(),
    folderId,
    date: new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
    goals: [{ text: "", checked: false }, { text: "", checked: false }, { text: "", checked: false }],
    marketOn: false,
    observations: "",
  });

  const createJournal = (folderId?: string) => {
    const j = makeJournal(folderId);
    setJournals((prev) => [j, ...prev]);
    setOpenId(j.id);
  };

  const confirmFolder = () => {
    const name = newFolderName.trim();
    if (!name) { setCreatingFolder(false); setNewFolderName(""); return; }
    setFolders((prev) => [{ id: crypto.randomUUID(), name, collapsed: false }, ...prev]);
    setCreatingFolder(false); setNewFolderName("");
  };

  const toggleFolder = (id: string) =>
    setFolders((prev) => prev.map((f) => f.id === id ? { ...f, collapsed: !f.collapsed } : f));

  const deleteFolder = (id: string) => {
    setFolders((prev) => prev.filter((f) => f.id !== id));
    setJournals((prev) => prev.map((j) => j.folderId === id ? { ...j, folderId: undefined } : j));
  };

  const updateJournal = (updated: Journal) =>
    setJournals((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));

  const deleteJournal = (id: string) => {
    setJournals((prev) => prev.filter((j) => j.id !== id));
    if (openId === id) setOpenId(null);
  };

  const open = journals.find((j) => j.id === openId);
  if (open) {
    return (
      <JournalSheet
        journal={open}
        onChange={updateJournal}
        onBack={() => setOpenId(null)}
        onMarketChange={onMarketChange}
      />
    );
  }

  const stripHtml = (html: string) => html.replace(/<[^>]*>/g, "");
  const unfiled = journals.filter((j) => !j.folderId);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-2xl font-extrabold tracking-tight text-white">
          Play to <span className="text-indigo-400">Win</span>
        </h2>
        <div className="flex gap-2">
          <button onClick={() => setCreatingFolder(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2d2f45] border border-[#3d3f5e] hover:border-sky-400 text-slate-300 text-sm font-semibold transition-colors">
            <FolderIcon /> New Folder
          </button>
          <button onClick={() => createJournal()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors">
            <span className="text-lg leading-none">+</span> New Journal
          </button>
        </div>
      </div>

      {creatingFolder && (
        <div className="flex items-center gap-2 bg-[#1e2035] border border-sky-500 rounded-xl px-4 py-3">
          <FolderIcon />
          <input ref={newFolderInputRef} type="text" value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") confirmFolder();
              if (e.key === "Escape") { setCreatingFolder(false); setNewFolderName(""); }
            }}
            placeholder="Folder name (e.g. Week of March 17)..."
            className="flex-1 bg-transparent text-slate-100 text-sm focus:outline-none placeholder-slate-600" />
          <button onClick={confirmFolder}
            className="px-3 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors">Create</button>
          <button onClick={() => { setCreatingFolder(false); setNewFolderName(""); }}
            className="text-slate-500 hover:text-slate-300 text-xs transition-colors">Cancel</button>
        </div>
      )}

      {folders.length === 0 && journals.length === 0 && !creatingFolder && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="text-5xl text-slate-700">📓</div>
          <p className="text-slate-500 text-sm text-center">
            No journals yet.<br />Hit <strong className="text-slate-400">+ New Journal</strong> to start, or <strong className="text-slate-400">New Folder</strong> to organize by week.
          </p>
        </div>
      )}

      {unfiled.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Unfiled</p>
          {unfiled.map((j) => (
            <div key={j.id}
              className="flex items-center justify-between bg-[#1e2035] border border-[#3d3f5e] rounded-xl px-5 py-4 cursor-pointer hover:border-indigo-500 transition-all group"
              onClick={() => setOpenId(j.id)}>
              <div>
                <p className="text-slate-100 font-semibold text-sm">{j.date || "Untitled"}</p>
                <p className="text-slate-500 text-xs mt-0.5">
                  {j.goals.filter((g) => g.checked).length}/3 goals ·{" "}
                  {j.observations ? `${stripHtml(j.observations).slice(0, 60)}${stripHtml(j.observations).length > 60 ? "…" : ""}` : "No notes yet"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-slate-500 text-xs group-hover:text-indigo-400 transition-colors">Open →</span>
                <button onClick={(e) => { e.stopPropagation(); deleteJournal(j.id); }}
                  className="text-slate-600 hover:text-red-400 text-xs transition-colors px-1">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {folders.map((folder) => {
        const folderJournals = journals.filter((j) => j.folderId === folder.id);
        return (
          <div key={folder.id} className="border border-[#3d3f5e] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-[#2d2f45] cursor-pointer select-none"
              onClick={() => toggleFolder(folder.id)}>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-xs transition-transform duration-150"
                  style={{ display: "inline-block", transform: folder.collapsed ? "rotate(-90deg)" : "rotate(0deg)" }}>▾</span>
                <FolderIcon />
                <span className="text-sm font-semibold text-slate-200">{folder.name}</span>
                <span className="text-xs text-slate-500">{folderJournals.length} journal{folderJournals.length !== 1 ? "s" : ""}</span>
                {folderJournals.filter((j) => j.grade).map((j) => (
                  <span key={j.id} className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${
                    j.grade === "A" ? "bg-emerald-500/20 text-emerald-400" :
                    j.grade === "B" ? "bg-sky-500/20 text-sky-400" :
                    j.grade === "C" ? "bg-yellow-500/20 text-yellow-400" :
                    j.grade === "D" ? "bg-orange-500/20 text-orange-400" :
                    "bg-red-600/20 text-red-400"
                  }`}>{j.grade}</span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={(e) => { e.stopPropagation(); createJournal(folder.id); }}
                  className="flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white text-xs font-semibold transition-colors">
                  + Add Journal
                </button>
                <button onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id); }}
                  className="text-slate-600 hover:text-red-400 text-xs transition-colors px-1">✕</button>
              </div>
            </div>
            {!folder.collapsed && (
              <div className="p-3 space-y-2 bg-[#1a1c30]">
                {folderJournals.length === 0 ? (
                  <p className="text-slate-600 text-xs text-center py-3">
                    No journals yet — hit <strong className="text-slate-500">+ Add Journal</strong> above.
                  </p>
                ) : (
                  folderJournals.map((j) => (
                    <div key={j.id}
                      className="flex items-center justify-between bg-[#1e2035] border border-[#3d3f5e] rounded-xl px-5 py-4 cursor-pointer hover:border-indigo-500 transition-all group"
                      onClick={() => setOpenId(j.id)}>
                      <div>
                        <p className="text-slate-100 font-semibold text-sm">{j.date || "Untitled"}</p>
                        <p className="text-slate-500 text-xs mt-0.5">
                          {j.goals.filter((g) => g.checked).length}/3 goals ·{" "}
                          {j.observations ? `${stripHtml(j.observations).slice(0, 60)}${stripHtml(j.observations).length > 60 ? "…" : ""}` : "No notes yet"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {j.grade && (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                            j.grade === "A" ? "bg-emerald-500/20 text-emerald-400" :
                            j.grade === "B" ? "bg-sky-500/20 text-sky-400" :
                            j.grade === "C" ? "bg-yellow-500/20 text-yellow-400" :
                            j.grade === "D" ? "bg-orange-500/20 text-orange-400" :
                            "bg-red-600/20 text-red-400"
                          }`}>{j.grade}</span>
                        )}
                        <span className="text-slate-500 text-xs group-hover:text-indigo-400 transition-colors">Open →</span>
                        <button onClick={(e) => { e.stopPropagation(); deleteJournal(j.id); }}
                          className="text-slate-600 hover:text-red-400 text-xs transition-colors px-1">✕</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}
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
      hdrs.forEach((h, i) => { obj[h || `col_${i}`] = vals[i] ?? ""; });
      return obj;
    });
    const seen: Record<string, number> = {};
    const deduped = hdrs.map((h) => {
      const base = h || "col";
      if (seen[base] === undefined) { seen[base] = 0; return base; }
      seen[base]++;
      return `${base}_${seen[base]}`;
    });
    return { headers: deduped, rows: dataRows };
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
    e.target.value = "";
  };

  return (
    <div className="space-y-4">
      <div onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-[#3d3f5e] rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition-colors">
        <p className="text-slate-400 text-sm">
          {fileName ? `Loaded: ${fileName}` : "Click to upload a CSV file"}
        </p>
        <p className="text-slate-600 text-xs mt-1">Export from TradeStation, Excel, Google Sheets, etc.</p>
        <input ref={inputRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {rows.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-[#3d3f5e]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#2d2f45]">
                {headers.map((h, i) => (
                  <th key={`th-${i}`}
                    className="px-3 py-2.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-[#3d3f5e] whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={`row-${ri}`} className="border-b border-[#3d3f5e] hover:bg-[#252740] transition-colors">
                  {headers.map((h, ci) => (
                    <td key={`td-${ri}-${ci}`} className="px-3 py-2 text-slate-300 whitespace-nowrap">
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

// ─── Leaderboard ──────────────────────────────────────────────────────────────
type LeaderboardEntry = { id: string; entry: Entry; screenshot?: string; addedAt: string };

function LeaderboardTab({ entries, pendingId, onPendingClear }: { entries: Entry[]; pendingId?: string | null; onPendingClear?: () => void }) {
  const [board, setBoard] = useState<LeaderboardEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [screenshot, setScreenshot] = useState<string | undefined>(undefined);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getData<LeaderboardEntry[]>("trading-leaderboard").then((v) => {
      if (v) setBoard(v);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (pendingId) { setAddingId(pendingId); onPendingClear?.(); }
  }, [pendingId]);
  useEffect(() => {
    if (!loaded) return;
    setData("trading-leaderboard", board);
  }, [board, loaded]);

  const pendingEntry = entries.find((e) => e.id === addingId);

  const confirmAdd = () => {
    if (!pendingEntry) return;
    setBoard((prev) => [{ id: crypto.randomUUID(), entry: pendingEntry, screenshot, addedAt: new Date().toISOString() }, ...prev]);
    setAddingId(null); setScreenshot(undefined);
  };

  const wins   = board.filter((b) => b.entry.result === "W");
  const losses = board.filter((b) => b.entry.result === "L");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-bold text-white">Trade Leaderboard</h2>
        <div className="flex gap-4 text-sm">
          <span className="text-emerald-400 font-semibold">W: {wins.length}</span>
          <span className="text-red-400 font-semibold">L: {losses.length}</span>
        </div>
      </div>

      {addingId && pendingEntry && (
        <div className="bg-[#1e2035] border border-indigo-500 rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-slate-200">
            Add <span className="text-indigo-400">{pendingEntry.ticker || "trade"}</span> ({fmtDate(pendingEntry.date)}) to leaderboard?
          </p>
          <div>
            <p className="text-xs text-slate-400 mb-1">Screenshot (optional)</p>
            <button onClick={() => fileRef.current?.click()}
              className="px-3 py-1.5 rounded-lg bg-[#2d2f45] border border-[#3d3f5e] text-xs text-slate-300 hover:border-indigo-400 transition-colors">
              {screenshot ? "Change image" : "Upload image"}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
              const f = e.target.files?.[0]; if (!f) return;
              const r = new FileReader();
              r.onload = (ev) => setScreenshot(ev.target?.result as string);
              r.readAsDataURL(f);
            }} />
            {screenshot && <img src={screenshot} alt="preview" className="mt-2 rounded-lg max-h-32 border border-[#3d3f5e]" />}
          </div>
          <div className="flex gap-2">
            <button onClick={confirmAdd} className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors">Add</button>
            <button onClick={() => { setAddingId(null); setScreenshot(undefined); }}
              className="px-4 py-1.5 rounded-lg bg-[#2d2f45] border border-[#3d3f5e] text-slate-300 text-sm transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {board.length === 0 ? (
        <p className="text-slate-500 text-sm py-6 text-center">
          No leaderboard entries yet — use ··· on any trade in Entries tab to add one.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#3d3f5e]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#2d2f45]">
                {["Date","Ticker","Type","Event","W/L","$ P&L","R:R","Screenshot",""].map((h,i) => (
                  <th key={i} className="px-3 py-2.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-[#3d3f5e] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {board.map((b) => {
                const e = b.entry;
                const abs = Math.abs(parseFloat(e.amount)||0).toFixed(0);
                const pnl = e.result==="L" ? `-$${abs}` : `+$${abs}`;
                return (
                  <tr key={b.id} className="border-b border-[#3d3f5e] hover:bg-[#252740] transition-colors">
                    <td className="px-3 py-2 text-slate-300 whitespace-nowrap">{fmtDate(e.date)}</td>
                    <td className="px-3 py-2 text-slate-300 whitespace-nowrap font-semibold">{e.ticker}</td>
                    <td className="px-3 py-2 text-slate-300 whitespace-nowrap">{e.tradeType}</td>
                    <td className="px-3 py-2 text-slate-300 whitespace-nowrap">{e.event}</td>
                    <td className={`px-3 py-2 font-bold whitespace-nowrap ${e.result==="W"?"text-emerald-400":e.result==="L"?"text-red-400":"text-amber-400"}`}>{e.result}</td>
                    <td className={`px-3 py-2 whitespace-nowrap ${e.result==="W"?"text-emerald-400":e.result==="L"?"text-red-400":"text-amber-400"}`}>{pnl}</td>
                    <td className="px-3 py-2 text-slate-300 whitespace-nowrap">{e.rrRatio||"—"}</td>
                    <td className="px-3 py-2">
                      {b.screenshot
                        ? <img src={b.screenshot} alt="screenshot" className="h-8 rounded border border-[#3d3f5e] cursor-pointer" onClick={() => window.open(b.screenshot,"_blank")} />
                        : <span className="text-slate-600 text-xs">—</span>}
                    </td>
                    <td className="px-2 py-2">
                      <button onClick={() => setBoard((prev) => prev.filter((x) => x.id !== b.id))}
                        className="text-slate-600 hover:text-red-400 text-xs transition-colors px-1">✕</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Focus Tracks ─────────────────────────────────────────────────────────────
type FocusTrack = { id: string; videoId: string; title: string; addedAt: string };

function extractYouTubeId(input: string): string | null {
  const m = input.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

function FocusTracksTab() {
  const [tracks, setTracks] = useState<FocusTrack[]>([]);
  const [loaded, setLoaded]  = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getData<FocusTrack[]>("trading-focus-tracks").then((v) => {
      if (v) setTracks(v);
      setLoaded(true);
    });
  }, []);
  useEffect(() => {
    if (!loaded) return;
    setData("trading-focus-tracks", tracks);
  }, [tracks, loaded]);

  const addTrack = async () => {
    const vid = extractYouTubeId(urlInput.trim());
    if (!vid) { setError("Invalid YouTube URL"); return; }
    if (tracks.some((t) => t.videoId === vid)) { setError("Already in playlist"); return; }
    setError("");
    let title = "Untitled";
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 5000);
      const res = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${vid}`, { signal: ctrl.signal });
      clearTimeout(timer);
      const data = await res.json();
      if (data.title) title = data.title;
    } catch {}
    const track: FocusTrack = { id: crypto.randomUUID(), videoId: vid, title, addedAt: new Date().toISOString() };
    setTracks((prev) => [...prev, track]);
    if (!currentId) setCurrentId(vid);
    setUrlInput("");
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white">Focus Tracks</h2>
      <div className="flex gap-2">
        <input type="text" value={urlInput} onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTrack()}
          placeholder="Paste YouTube URL..."
          className="flex-1 bg-[#2d2f45] border border-[#3d3f5e] rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500" />
        <button onClick={addTrack} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors">Add</button>
      </div>
      {error && <p className="text-red-400 text-xs">{error}</p>}

      <div className="flex gap-4 flex-col lg:flex-row">
        {currentId && (
          <div className="flex-1 min-w-0">
            <iframe
              key={currentId}
              src={`https://www.youtube-nocookie.com/embed/${currentId}?autoplay=1`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full rounded-xl border border-[#3d3f5e]"
              style={{ aspectRatio: "16/9" }}
            />
          </div>
        )}
        {tracks.length > 0 && (
          <div className="w-full lg:w-72 flex-shrink-0 space-y-2">
            <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Playlist</p>
            {tracks.map((t) => (
              <div key={t.id}
                onClick={() => setCurrentId(t.videoId)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${t.videoId === currentId ? "bg-indigo-600/30 border border-indigo-500" : "bg-[#1e2035] border border-[#3d3f5e] hover:border-indigo-400"}`}>
                <div className="w-8 h-8 flex-shrink-0 rounded overflow-hidden bg-[#2d2f45]">
                  <img src={`https://img.youtube.com/vi/${t.videoId}/default.jpg`} alt="" className="w-full h-full object-cover" />
                </div>
                <p className="text-xs text-slate-200 flex-1 min-w-0 truncate">{t.title}</p>
                <button onClick={(e) => { e.stopPropagation(); setTracks((prev) => prev.filter((x) => x.id !== t.id)); if (currentId === t.videoId) setCurrentId(tracks.find((x)=>x.id!==t.id)?.videoId??null); }}
                  className="text-slate-600 hover:text-red-400 text-xs transition-colors flex-shrink-0">✕</button>
              </div>
            ))}
          </div>
        )}
        {tracks.length === 0 && (
          <p className="text-slate-500 text-sm">Add a YouTube URL above to build your focus playlist.</p>
        )}
      </div>
    </div>
  );
}

// ─── Visual Analysis Tab ──────────────────────────────────────────────────────
function VisualAnalysisTab({ entries }: { entries: Entry[] }) {
  const pnlData = (() => {
    const byDate: Record<string, number> = {};
    entries.forEach((e) => {
      if (!e.date || !e.result) return;
      const amt = parseFloat(e.amount) || 0;
      const signed = e.result === "W" ? amt : e.result === "L" ? -amt : 0;
      byDate[e.date] = (byDate[e.date] || 0) + signed;
    });
    let cum = 0;
    return Object.keys(byDate).sort().map((date) => {
      cum += byDate[date];
      return { date: fmtDate(date), pnl: parseFloat(cum.toFixed(2)) };
    });
  })();

  const resultCounts = [
    { name: "Win", value: entries.filter((e) => e.result === "W").length, fill: "#34d399" },
    { name: "Loss", value: entries.filter((e) => e.result === "L").length, fill: "#f87171" },
    { name: "BE", value: entries.filter((e) => e.result === "BE").length, fill: "#94a3b8" },
  ].filter((r) => r.value > 0);

  const byEvent: Record<string, number[]> = {};
  entries.forEach((e) => {
    if (!e.event || !e.result) return;
    const amt = parseFloat(e.amount) || 0;
    const signed = e.result === "W" ? amt : e.result === "L" ? -amt : 0;
    if (!byEvent[e.event]) byEvent[e.event] = [];
    byEvent[e.event].push(signed);
  });
  const eventData = Object.entries(byEvent).map(([event, vals]) => ({
    event: event.length > 14 ? event.slice(0, 14) + "…" : event,
    avg: parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)),
  }));

  const byLocation: Record<string, number[]> = {};
  entries.forEach((e) => {
    if (!e.location || !e.result) return;
    const amt = parseFloat(e.amount) || 0;
    const signed = e.result === "W" ? amt : e.result === "L" ? -amt : 0;
    if (!byLocation[e.location]) byLocation[e.location] = [];
    byLocation[e.location].push(signed);
  });
  const locationData = Object.entries(byLocation).map(([location, vals]) => ({
    location,
    avg: parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)),
  }));

  const totalPnl = entries.reduce((sum, e) => {
    const amt = parseFloat(e.amount) || 0;
    return sum + (e.result === "W" ? amt : e.result === "L" ? -amt : 0);
  }, 0);
  const traded = entries.filter((e) => e.result === "W" || e.result === "L" || e.result === "BE").length;
  const winRate = traded > 0 ? (entries.filter((e) => e.result === "W").length / traded) * 100 : 0;
  const rrs = entries.map((e) => parseFloat(e.rrRatio)).filter(Boolean);
  const avgRR = rrs.length ? (rrs.reduce((a, b) => a + b, 0) / rrs.length).toFixed(2) : "—";

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <p className="text-lg font-medium">No trade data yet</p>
        <p className="text-sm mt-1">Log entries to see your visual analysis</p>
      </div>
    );
  }

  const tooltipStyle = { background: "#1e2035", border: "1px solid #3d3f5e", borderRadius: 8 };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Visual Analysis</h2>
        <p className="text-slate-400 text-sm">Performance overview from your logged entries</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Trades", value: entries.length.toString(), color: "text-white" },
          { label: "Win Rate", value: `${winRate.toFixed(1)}%`, color: winRate >= 50 ? "text-emerald-400" : "text-red-400" },
          { label: "Total P&L", value: `${totalPnl >= 0 ? "+$" : "-$"}${Math.abs(totalPnl).toFixed(2)}`, color: totalPnl >= 0 ? "text-emerald-400" : "text-red-400" },
          { label: "Avg R:R", value: avgRR, color: "text-sky-400" },
        ].map((s) => (
          <div key={s.label} className="bg-[#1e2035] rounded-xl border border-[#3d3f5e] p-4">
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {pnlData.length > 1 && (
        <div className="bg-[#1e2035] rounded-xl border border-[#3d3f5e] p-4">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Cumulative P&L</h3>
          <div className="w-full overflow-x-auto">
            <LineChart width={620} height={220} data={pnlData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d2f45" />
              <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={(v: number) => `$${v}`} />
              <Tooltip formatter={(v: number) => [`$${v}`, "P&L"]} contentStyle={tooltipStyle} />
              <ReferenceLine y={0} stroke="#3d3f5e" />
              <Line type="monotone" dataKey="pnl" stroke="#6366f1" strokeWidth={2} dot={false} />
            </LineChart>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-[#1e2035] rounded-xl border border-[#3d3f5e] p-4">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Result Breakdown</h3>
          <PieChart width={260} height={200}>
            <Pie data={resultCounts} cx={130} cy={90} innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
              {resultCounts.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
            <Legend />
          </PieChart>
        </div>

        {eventData.length > 0 && (
          <div className="bg-[#1e2035] rounded-xl border border-[#3d3f5e] p-4">
            <h3 className="text-sm font-semibold text-slate-200 mb-4">Avg P&L by Event</h3>
            <BarChart width={260} height={200} data={eventData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d2f45" />
              <XAxis dataKey="event" tick={{ fill: "#64748b", fontSize: 10 }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={(v: number) => `$${v}`} />
              <Tooltip formatter={(v: number) => [`$${v}`, "Avg P&L"]} contentStyle={tooltipStyle} />
              <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
                {eventData.map((entry, i) => <Cell key={i} fill={entry.avg >= 0 ? "#34d399" : "#f87171"} />)}
              </Bar>
            </BarChart>
          </div>
        )}
      </div>

      {locationData.length > 0 && (
        <div className="bg-[#1e2035] rounded-xl border border-[#3d3f5e] p-4">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Avg P&L by Entry Location</h3>
          <BarChart width={400} height={200} data={locationData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d2f45" />
            <XAxis dataKey="location" tick={{ fill: "#64748b", fontSize: 12 }} />
            <YAxis tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={(v: number) => `$${v}`} />
            <Tooltip formatter={(v: number) => [`$${v}`, "Avg P&L"]} contentStyle={tooltipStyle} />
            <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
              {locationData.map((entry, i) => <Cell key={i} fill={entry.avg >= 0 ? "#34d399" : "#f87171"} />)}
            </Bar>
          </BarChart>
        </div>
      )}
    </div>
  );
}

// ─── Growth Simulator ─────────────────────────────────────────────────────────
function SimSlider({ label, value, min, max, step, display, onChange }: {
  label: string; value: number; min: number; max: number; step: number;
  display: string; onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-slate-400 uppercase tracking-wide">{label}</span>
      <span className="text-lg font-semibold text-white">{display}</span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full accent-indigo-500 cursor-pointer" />
    </div>
  );
}

function GrowthSimulatorTab() {
  const [startBal, setStartBal]           = useState(50000);
  const [tradesPerWeek, setTradesPerWeek] = useState(10);
  const [winRate, setWinRate]             = useState(55);
  const [rr, setRr]                       = useState(1.5);
  const [riskPct, setRiskPct]             = useState(1);
  const [riskCap, setRiskCap]             = useState(650);
  const [monthlyWithdraw, setMonthlyWithdraw] = useState(4000);
  const [chartMonths, setChartMonths]     = useState(24);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const riskFrac = riskPct / 100;
  const wr       = winRate / 100;

  function riskAmt(balance: number, frac: number, cap: number | null) {
    const r = balance * frac;
    return cap !== null ? Math.min(r, cap) : r;
  }

  function simulate(
    start: number, tpw: number, win: number, rratio: number,
    frac: number, withdraw: number, cap: number | null, months: number
  ) {
    let bal = start;
    const balances = [bal];
    const wrate = win / 100;
    const tpm = Math.round(tpw * 4.33);
    for (let m = 1; m <= months; m++) {
      for (let t = 0; t < tpm; t++) {
        const r = riskAmt(bal, frac, cap);
        bal += Math.random() < wrate ? r * rratio : -r;
        if (bal < 0) bal = 0;
      }
      bal -= withdraw;
      if (bal < 0) bal = 0;
      balances.push(bal);
    }
    return balances;
  }

  function avgSims(
    start: number, tpw: number, win: number, rratio: number,
    frac: number, withdraw: number, cap: number | null, months: number
  ) {
    const RUNS = 40;
    const sums = Array(months + 1).fill(0);
    for (let run = 0; run < RUNS; run++) {
      simulate(start, tpw, win, rratio, frac, withdraw, cap, months)
        .forEach((b, i) => { sums[i] += b; });
    }
    const balances = sums.map(s => s / RUNS);
    const monthHit = balances.reduce(
      (found: number | null, b, i) =>
        found !== null ? found : (b >= 100000 && i > 0 ? i : null),
      null
    );
    return { balances, monthHit };
  }

  // Derived math (snapshot at starting balance)
  const r            = riskAmt(startBal, riskFrac, riskCap);
  const avgWin       = r * rr;
  const avgLoss      = r;
  const expectDollar = wr * avgWin - (1 - wr) * avgLoss;
  const expectR      = wr * rr - (1 - wr);
  const grossMonthly = expectDollar * tradesPerWeek * 4.33;
  const weeklyWithdraw = monthlyWithdraw / 4.33;
  const netWeekly    = expectDollar * tradesPerWeek - weeklyWithdraw;
  const capKicksBal  = riskCap / riskFrac;

  // Simulation state
  const [cappedSim, setCappedSim]     = useState<{ balances: number[]; monthHit: number | null }>({ balances: [], monthHit: null });
  const [uncappedSim, setUncappedSim] = useState<{ balances: number[]; monthHit: number | null }>({ balances: [], monthHit: null });

  useEffect(() => {
    if (simTimer.current) clearTimeout(simTimer.current);
    simTimer.current = setTimeout(() => {
      const c = avgSims(startBal, tradesPerWeek, winRate, rr, riskFrac, monthlyWithdraw, riskCap, chartMonths);
      const u = avgSims(startBal, tradesPerWeek, winRate, rr, riskFrac, monthlyWithdraw, null, chartMonths);
      setCappedSim(c);
      setUncappedSim(u);
    }, 150);
    return () => { if (simTimer.current) clearTimeout(simTimer.current); };
  }, [startBal, tradesPerWeek, winRate, rr, riskFrac, monthlyWithdraw, riskCap, chartMonths]);

  // Draw canvas chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || cappedSim.balances.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width  = rect.width  * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const W = rect.width;
    const H = rect.height;

    const ml = 72, mr = 78, mt = 16, mb = 36;
    const cW = W - ml - mr;
    const cH = H - mt - mb;
    const months = cappedSim.balances.length - 1;

    const cappedMax   = Math.max(...cappedSim.balances,   100000) * 1.12;
    const uncappedMax = Math.max(...uncappedSim.balances, 100000) * 1.12;

    const spData = chartMonths >= 60
      ? Array.from({ length: months + 1 }, (_, i) => startBal * Math.pow(1.08, i / 12))
      : null;

    const xc  = (i: number) => ml + (i / months) * cW;
    const yL  = (v: number) => mt + cH - (v / cappedMax)   * cH;
    const yR  = (v: number) => mt + cH - (v / uncappedMax) * cH;

    // Clear
    ctx.clearRect(0, 0, W, H);

    // Grid
    const ySteps = 5;
    for (let i = 0; i <= ySteps; i++) {
      const y = mt + (i / ySteps) * cH;
      ctx.strokeStyle = "#2d2f45";
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(ml, y); ctx.lineTo(W - mr, y); ctx.stroke();
    }

    // Left axis labels (green / capped)
    ctx.fillStyle   = "#34d399";
    ctx.font        = "11px system-ui, sans-serif";
    ctx.textAlign   = "right";
    ctx.textBaseline = "middle";
    for (let i = 0; i <= ySteps; i++) {
      const v = ((ySteps - i) / ySteps) * cappedMax;
      ctx.fillText(fmtK(v), ml - 6, mt + (i / ySteps) * cH);
    }

    // Right axis labels (blue / uncapped)
    ctx.fillStyle  = "#60a5fa";
    ctx.textAlign  = "left";
    for (let i = 0; i <= ySteps; i++) {
      const v = ((ySteps - i) / ySteps) * uncappedMax;
      ctx.fillText(fmtK(v), W - mr + 6, mt + (i / ySteps) * cH);
    }

    // X axis labels
    ctx.fillStyle    = "#64748b";
    ctx.textAlign    = "center";
    ctx.textBaseline = "alphabetic";
    const step = months <= 24 ? 5 : 10;
    for (let i = 0; i <= months; i += step) {
      ctx.fillText(i === 0 ? "Start" : `Mo ${i}`, xc(i), H - 6);
    }

    // $100k red dashed
    ctx.strokeStyle = "#ef4444"; ctx.lineWidth = 1.5; ctx.setLineDash([6, 4]);
    ctx.beginPath(); ctx.moveTo(ml, yL(100000)); ctx.lineTo(W - mr, yL(100000)); ctx.stroke();

    // S&P amber dashed
    if (spData) {
      ctx.strokeStyle = "#f59e0b"; ctx.lineWidth = 1.5; ctx.setLineDash([6, 4]);
      ctx.beginPath();
      spData.forEach((v, i) => i === 0 ? ctx.moveTo(xc(i), yL(v)) : ctx.lineTo(xc(i), yL(v)));
      ctx.stroke();
    }

    // Uncapped blue dashed
    ctx.strokeStyle = "#60a5fa"; ctx.lineWidth = 2; ctx.setLineDash([8, 4]);
    ctx.beginPath();
    uncappedSim.balances.forEach((v, i) => i === 0 ? ctx.moveTo(xc(i), yR(v)) : ctx.lineTo(xc(i), yR(v)));
    ctx.stroke();

    // Capped green fill + line
    ctx.setLineDash([]);
    ctx.beginPath();
    cappedSim.balances.forEach((v, i) => i === 0 ? ctx.moveTo(xc(i), yL(v)) : ctx.lineTo(xc(i), yL(v)));
    ctx.lineTo(xc(months), mt + cH); ctx.lineTo(xc(0), mt + cH); ctx.closePath();
    ctx.fillStyle = "rgba(52,211,153,0.12)"; ctx.fill();

    ctx.strokeStyle = "#34d399"; ctx.lineWidth = 2.5; ctx.setLineDash([]);
    ctx.beginPath();
    cappedSim.balances.forEach((v, i) => i === 0 ? ctx.moveTo(xc(i), yL(v)) : ctx.lineTo(xc(i), yL(v)));
    ctx.stroke();

  }, [cappedSim, uncappedSim, chartMonths, startBal]);

  function fmtK(v: number) {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000)     return `$${Math.round(v / 1000)}k`;
    return `$${Math.round(v)}`;
  }
  function fmtD(v: number) { return "$" + Math.round(v).toLocaleString(); }

  const bal15 = cappedSim.balances[15] ?? 0;
  const totalWithdrawn = chartMonths * monthlyWithdraw;

  return (
    <div className="space-y-5">
      {/* Sliders */}
      <div className="grid grid-cols-4 gap-x-6 gap-y-4">
        <SimSlider label="Starting balance" value={startBal} min={10000} max={100000} step={1000}
          display={fmtD(startBal)} onChange={setStartBal} />
        <SimSlider label="Trades per week" value={tradesPerWeek} min={1} max={30} step={1}
          display={String(tradesPerWeek)} onChange={setTradesPerWeek} />
        <SimSlider label="Win rate (%)" value={winRate} min={0.01} max={75} step={0.01}
          display={winRate.toFixed(2) + "%"} onChange={setWinRate} />
        <SimSlider label="Avg R:R ratio" value={rr} min={0.01} max={4} step={0.01}
          display={rr.toFixed(2)} onChange={setRr} />
        <SimSlider label="Risk per trade (%)" value={riskPct} min={0.001} max={3} step={0.001}
          display={riskPct.toFixed(3) + "%"} onChange={setRiskPct} />
        <SimSlider label="Risk cap ($)" value={riskCap} min={1} max={2000} step={1}
          display={fmtD(riskCap)} onChange={setRiskCap} />
        <SimSlider label="Monthly withdrawal" value={monthlyWithdraw} min={0} max={8000} step={1}
          display={fmtD(monthlyWithdraw)} onChange={setMonthlyWithdraw} />
        <div className="flex flex-col gap-1">
          <span className="text-xs text-slate-400 uppercase tracking-wide">Weekly withdrawal (auto)</span>
          <span className="text-lg font-semibold text-slate-500">≈ {fmtD(weeklyWithdraw)} / week</span>
          <div className="w-full h-[18px]" />
        </div>
        <div className="flex flex-col gap-1">
          {(() => {
            const grossWeekly = expectDollar * tradesPerWeek;
            const color = grossWeekly >= 0 ? "text-emerald-400" : "text-red-400";
            return <>
              <span className="text-xs text-slate-400 uppercase tracking-wide">Est. Gross P/L (week)</span>
              <span className={`text-lg font-semibold ${color}`}>{grossWeekly >= 0 ? "+" : ""}{fmtD(grossWeekly)}</span>
              <div className="w-full h-[18px]" />
            </>;
          })()}
        </div>
      </div>

      {/* Cap info */}
      <p className="text-xs text-slate-400">
        Risk scales until {fmtD(capKicksBal)} — then locks at {fmtD(riskCap)} per trade.
      </p>

      {/* Metric cards */}
      <div className="grid grid-cols-6 gap-3">
        {[
          {
            label: "Month hit $100k\n(capped)",
            main: cappedSim.monthHit !== null ? `Mo ${cappedSim.monthHit}` : "—",
            sub: null,
          },
          {
            label: "Balance at 15mo\n(capped)",
            main: fmtD(bal15),
            sub: null,
          },
          {
            label: "Total withdrawn",
            main: fmtD(totalWithdrawn),
            sub: `over ${chartMonths} months`,
          },
          {
            label: "Avg win / trade",
            main: fmtD(avgWin),
            sub: `Expect: ${fmtD(expectDollar)}/trade`,
          },
          {
            label: "Avg loss / trade",
            main: fmtD(avgLoss),
            sub: `+${expectR.toFixed(3)}R expectancy`,
          },
          {
            label: "Net weekly (start bal)",
            main: fmtD(netWeekly),
            sub: `Gross mo: ${fmtD(grossMonthly)}`,
            highlight: netWeekly >= 0 ? "green" : "red",
          },
        ].map((card, i) => (
          <div key={i} className="bg-[#1e2035] rounded-lg p-3 border border-[#3d3f5e] flex flex-col gap-1">
            <span className="text-xs text-slate-400 leading-tight whitespace-pre-line">{card.label}</span>
            <span className={`text-xl font-bold ${
              card.highlight === "green" ? "text-emerald-400" :
              card.highlight === "red"   ? "text-red-400" :
              "text-white"
            }`}>{card.main}</span>
            {card.sub && <span className="text-xs text-slate-500">{card.sub}</span>}
          </div>
        ))}
      </div>

      {/* Chart toggle */}
      <div className="flex items-center gap-2">
        {([24, 60] as const).map(m => (
          <button key={m} onClick={() => setChartMonths(m)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium border transition-all ${
              chartMonths === m
                ? "bg-[#2d2f45] border-slate-500 text-white"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}>
            {m === 24 ? "2 Years" : "5 Years"}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="flex gap-5 text-xs text-slate-400 -mt-2">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-400 inline-block" />Capped (left axis)</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-sky-400 inline-block" />No cap (right axis)</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-500 inline-block" />$100k target</span>
        {chartMonths >= 60 && <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-amber-400 inline-block" />S&P 500 @ 8%/yr</span>}
      </div>

      {/* Chart */}
      <div className="w-full rounded-xl overflow-hidden border border-[#3d3f5e]" style={{ height: 380 }}>
        <canvas ref={canvasRef} className="w-full h-full" style={{ display: "block" }} />
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Home() {
  const [tab, setTab] = useState<"log" | "entries" | "csv" | "journal" | "leaderboard" | "focus" | "visual" | "simulator">("log");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [entriesLoaded, setEntriesLoaded] = useState(false);
  const [journalMarketOn, setJournalMarketOn] = useState(false);
  const [focusMounted, setFocusMounted] = useState(false);

  useEffect(() => {
    getData<Entry[]>("trading-entries").then((v) => {
      if (v) setEntries(v);
      setEntriesLoaded(true);
    });
  }, []);
  useEffect(() => {
    if (!entriesLoaded) return;
    setData("trading-entries", entries);
  }, [entries, entriesLoaded]);

  useEffect(() => { if (tab === "focus") setFocusMounted(true); }, [tab]);

  // Expose addToLeaderboard via ref so EntriesTable can call it
  const [leaderboardPending, setLeaderboardPending] = useState<string | null>(null);

  return (
    <div className="flex flex-col flex-1 w-full px-6 py-6 gap-6">
      <header className="flex items-center gap-3">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <line x1="6"  y1="3"  x2="6"  y2="7"  stroke="#34d399" strokeWidth="1.5" strokeLinecap="round"/>
          <rect x="3.5" y="7"  width="5" height="10" rx="1" fill="#34d399"/>
          <line x1="6"  y1="17" x2="6"  y2="22" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="16" y1="2"  x2="16" y2="8"  stroke="#f87171" strokeWidth="1.5" strokeLinecap="round"/>
          <rect x="13.5" y="8" width="5" height="13" rx="1" fill="#f87171"/>
          <line x1="16" y1="21" x2="16" y2="27" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="26" y1="5"  x2="26" y2="10" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round"/>
          <rect x="23.5" y="10" width="5" height="9"  rx="1" fill="#34d399"/>
          <line x1="26" y1="19" x2="26" y2="25" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Trading <span className="text-indigo-400">Tracker</span>
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Log entries · View trades · Import CSV</p>
        </div>
      </header>

      <nav className="flex flex-wrap gap-1 bg-[#252740] p-1 rounded-lg w-fit">
        {([
          ["log",         "Log Entry"       ],
          ["entries",     "Entries"         ],
          ["csv",         "Import CSV"      ],
          ["journal",     "Daily Journal"   ],
          ["leaderboard", "Leaderboard"     ],
          ["focus",       "Focus Tracks"    ],
          ["visual",      "Visual Analysis"  ],
          ["simulator",   "Growth Simulator" ],
        ] as const).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              tab === t ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
            }`}>
            {label}
          </button>
        ))}
      </nav>

      <main className={`bg-[#252740] rounded-xl border p-6 flex-1 transition-all duration-300 ${journalMarketOn ? "border-[#00ff88] shadow-[0_0_24px_rgba(0,255,136,0.35)]" : "border-[#3d3f5e]"}`}>
        {tab === "log"     && <LogTab onSave={(e) => setEntries((prev) => [e, ...prev])} />}
        {tab === "entries" && (
          <EntriesTable
            entries={entries}
            onDelete={(id) => setEntries((prev) => prev.filter((e) => e.id !== id))}
            onUpdate={(updated) => setEntries((prev) => prev.map((e) => e.id === updated.id ? updated : e))}
            onAddToLeaderboard={(id) => { setLeaderboardPending(id); setTab("leaderboard"); }}
          />
        )}
        {tab === "csv"     && <CsvTab />}
        {tab === "journal" && <DailyJournalTab onMarketChange={setJournalMarketOn} />}
        {tab === "leaderboard" && <LeaderboardTab entries={entries} pendingId={leaderboardPending} onPendingClear={() => setLeaderboardPending(null)} />}
        {focusMounted && (
          <div style={{ display: tab === "focus" ? "block" : "none" }}>
            <FocusTracksTab />
          </div>
        )}
        {tab === "visual"     && <VisualAnalysisTab entries={entries} />}
        {tab === "simulator"  && <GrowthSimulatorTab />}
      </main>
    </div>
  );
}
