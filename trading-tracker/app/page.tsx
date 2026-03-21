"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";

// ─── Constants ──────────────────────────────────────────────────────────────
const EVENTS = ["Color Change/Halt", "Bear 180", "Bull 180", "Clearing bar"] as const;
const LOCATIONS = ["Near", "Far"] as const;
const STATES = ["Wide", "Narrow", "Neutral"] as const;

type TradeFile = {
  id: string;
  name: string;
  folderPath: string;
  modifiedTime: string;
};

type SheetData = {
  sheetNames: string[];
  sheets: Record<string, { headers: string[]; rows: string[][] }>;
};

// ─── Pill selector ──────────────────────────────────────────────────────────
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
            onClick={() => onChange(opt)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
              value === opt
                ? "bg-indigo-600 border-indigo-500 text-white"
                : "bg-[#1a1d27] border-[#2e3147] text-slate-300 hover:border-indigo-500"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Entry Log Form ──────────────────────────────────────────────────────────
function EntryLogForm() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [ticker, setTicker] = useState("");
  const [event, setEvent] = useState<(typeof EVENTS)[number] | "">("");
  const [location, setLocation] = useState<(typeof LOCATIONS)[number] | "">("");
  const [state, setState] = useState<(typeof STATES)[number] | "">("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || !location || !state) {
      setErrorMsg("Please select Event, Location, and State.");
      return;
    }
    setStatus("saving");
    setErrorMsg("");
    try {
      const res = await fetch("/api/log-entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, ticker, event, location, state, notes }),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error ?? "Failed");
      }
      setStatus("saved");
      setTicker("");
      setEvent("");
      setLocation("");
      setState("");
      setNotes("");
      setTimeout(() => setStatus("idle"), 3000);
    } catch (err: any) {
      setErrorMsg(err.message);
      setStatus("error");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-slate-400 uppercase tracking-widest block mb-1.5">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-[#1a1d27] border border-[#2e3147] rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 uppercase tracking-widest block mb-1.5">Ticker</label>
          <input
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            placeholder="e.g. AAPL"
            className="w-full bg-[#1a1d27] border border-[#2e3147] rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 uppercase"
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
          className="w-full bg-[#1a1d27] border border-[#2e3147] rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
        />
      </div>

      {errorMsg && <p className="text-red-400 text-sm">{errorMsg}</p>}

      <button
        type="submit"
        disabled={status === "saving"}
        className="w-full py-2.5 rounded-lg font-semibold text-sm transition-all bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50"
      >
        {status === "saving" ? "Saving..." : status === "saved" ? "Saved!" : "Log Entry"}
      </button>
    </form>
  );
}

// ─── Sheets tab ──────────────────────────────────────────────────────────────
function SheetsTab() {
  const [data, setData] = useState<SheetData | null>(null);
  const [activeSheet, setActiveSheet] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/sheets")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          setError(d.error);
        } else {
          setData(d);
          setActiveSheet(d.sheetNames[0] ?? "");
        }
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="text-slate-400 text-sm p-4">Loading sheet data...</p>;
  if (error) return <p className="text-red-400 text-sm p-4">Error: {error}</p>;
  if (!data) return null;

  const current = data.sheets[activeSheet];

  return (
    <div className="space-y-4">
      {/* Sheet tabs */}
      <div className="flex gap-2 flex-wrap">
        {data.sheetNames.map((name) => (
          <button
            key={name}
            onClick={() => setActiveSheet(name)}
            className={`px-3 py-1 rounded text-sm font-medium transition-all ${
              activeSheet === name
                ? "bg-indigo-600 text-white"
                : "bg-[#1a1d27] text-slate-400 hover:text-slate-200 border border-[#2e3147]"
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      {/* Table */}
      {current && (
        <div className="overflow-x-auto rounded-lg border border-[#2e3147]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#1a1d27]">
                {current.headers.map((h, i) => (
                  <th
                    key={i}
                    className="px-4 py-2.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap border-b border-[#2e3147]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {current.rows.map((row, ri) => (
                <tr key={ri} className="border-b border-[#2e3147] hover:bg-[#1a1d27] transition-colors">
                  {current.headers.map((_, ci) => (
                    <td key={ci} className="px-4 py-2 text-slate-300 whitespace-nowrap">
                      {row[ci] ?? ""}
                    </td>
                  ))}
                </tr>
              ))}
              {current.rows.length === 0 && (
                <tr>
                  <td colSpan={current.headers.length} className="px-4 py-8 text-center text-slate-500">
                    No data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Journal Tab ─────────────────────────────────────────────────────────────
function JournalTab() {
  const [files, setFiles] = useState<TradeFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedFile, setSelectedFile] = useState<TradeFile | null>(null);
  const [docContent, setDocContent] = useState("");
  const [docLoading, setDocLoading] = useState(false);

  useEffect(() => {
    fetch("/api/drive")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setFiles(d.files ?? []);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  const openDoc = useCallback(async (file: TradeFile) => {
    setSelectedFile(file);
    setDocContent("");
    setDocLoading(true);
    try {
      const res = await fetch(`/api/drive/doc?id=${file.id}`);
      const d = await res.json();
      setDocContent(d.content ?? d.error ?? "");
    } catch (e: any) {
      setDocContent(e.message);
    }
    setDocLoading(false);
  }, []);

  if (loading) return <p className="text-slate-400 text-sm">Loading journal entries...</p>;
  if (error) return <p className="text-red-400 text-sm">Error: {error}</p>;

  // Group by folderPath
  const grouped: Record<string, TradeFile[]> = {};
  for (const f of files) {
    if (!grouped[f.folderPath]) grouped[f.folderPath] = [];
    grouped[f.folderPath].push(f);
  }

  return (
    <div className="flex gap-4 h-[600px]">
      {/* File list */}
      <div className="w-64 flex-shrink-0 overflow-y-auto space-y-4 pr-2">
        {Object.entries(grouped).map(([folder, docs]) => (
          <div key={folder}>
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-1.5 truncate">{folder}</p>
            <ul className="space-y-1">
              {docs.map((f) => (
                <li key={f.id}>
                  <button
                    onClick={() => openDoc(f)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all truncate ${
                      selectedFile?.id === f.id
                        ? "bg-indigo-600 text-white"
                        : "bg-[#1a1d27] text-slate-300 hover:bg-[#222536] border border-[#2e3147]"
                    }`}
                  >
                    {f.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {files.length === 0 && (
          <p className="text-slate-500 text-sm">No Google Docs found in the folder.</p>
        )}
      </div>

      {/* Doc viewer */}
      <div className="flex-1 overflow-y-auto bg-[#1a1d27] rounded-lg border border-[#2e3147] p-4">
        {!selectedFile && (
          <p className="text-slate-500 text-sm">Select a journal entry to read it.</p>
        )}
        {docLoading && <p className="text-slate-400 text-sm">Loading...</p>}
        {!docLoading && selectedFile && (
          <div>
            <h3 className="font-semibold text-slate-200 mb-3">{selectedFile.name}</h3>
            <pre className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed font-sans">
              {docContent}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function Home() {
  const { data: session, status } = useSession();
  const [tab, setTab] = useState<"log" | "sheets" | "journal">("log");

  if (status === "loading") {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-1 items-center justify-center flex-col gap-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-100 mb-2">Trading Tracker</h1>
          <p className="text-slate-400 text-sm">Sign in with Google to access your journal and trade log.</p>
        </div>
        <button
          onClick={() => signIn("google")}
          className="flex items-center gap-3 px-6 py-3 bg-white text-gray-800 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg"
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 max-w-5xl mx-auto w-full px-4 py-6 gap-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-100">Trading Tracker</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400">{session.user?.email}</span>
          <button
            onClick={() => signOut()}
            className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Tabs */}
      <nav className="flex gap-1 bg-[#1a1d27] p-1 rounded-lg w-fit">
        {(["log", "sheets", "journal"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-all ${
              tab === t ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {t === "log" ? "Log Entry" : t === "sheets" ? "Trade Sheet" : "Journal"}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="bg-[#1a1d27] rounded-xl border border-[#2e3147] p-6">
        {tab === "log" && <EntryLogForm />}
        {tab === "sheets" && <SheetsTab />}
        {tab === "journal" && <JournalTab />}
      </main>
    </div>
  );
}
