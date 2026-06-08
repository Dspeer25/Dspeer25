'use client';
import React, { useState, useEffect } from 'react';
import { Plus, X, TrendingUp, TrendingDown } from 'lucide-react';
import { fd, fm, teal } from './shared';
import { ToolPageShell } from './ToolsContent';

// ─── Tokens ──────────────────────────────────────────────────────────

const RED         = '#ff4444';
const TEXT_BASE   = '#e0e0e0';
const LABEL       = '#a0a3ab';
const BORDER      = 'rgba(255,255,255,0.10)';
const SURFACE_TOP = '#1f232d';
const SURFACE_BOT = '#181c26';

// ─── Storage ─────────────────────────────────────────────────────────

const STORAGE_KEY = 'wickcoach_watching';

interface WatchRow {
  id: string;
  ticker: string;
  time: string;
  reason: string;
}
interface WatchingState {
  longs: WatchRow[];
  shorts: WatchRow[];
}

function makeRow(): WatchRow {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ticker: '',
    time: '',
    reason: '',
  };
}

// Seed with 3 empty rows per side on first ever visit. After that the
// user's actual state (which can have any row count) is restored.
const DEFAULT_STATE: WatchingState = {
  longs:  [makeRow(), makeRow(), makeRow()],
  shorts: [makeRow(), makeRow(), makeRow()],
};

function loadWatching(): WatchingState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_STATE;
  }
}

function saveWatching(s: WatchingState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch { /* quota — ignore */ }
}

// "H:MM AM/PM" in local time. Used to autofill a freshly-added row.
function currentTimeLabel(): string {
  const d = new Date();
  let h = d.getHours();
  const min = String(d.getMinutes()).padStart(2, '0');
  const ap = h >= 12 ? 'PM' : 'AM';
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${min} ${ap}`;
}

// ─── Shared style chunks ─────────────────────────────────────────────

const cardSurface: React.CSSProperties = {
  background: `linear-gradient(180deg, ${SURFACE_TOP} 0%, ${SURFACE_BOT} 100%)`,
  border: `1px solid ${BORDER}`,
  borderRadius: 12,
  boxShadow: '0 8px 20px -6px rgba(0,0,0,0.5), inset 0 1px 0 0 rgba(255,255,255,0.05)',
};

const labelStyle: React.CSSProperties = {
  fontFamily: fd,
  fontSize: 13,
  textTransform: 'uppercase',
  letterSpacing: 1.2,
  color: LABEL,
  fontWeight: 600,
};

const inputBaseStyle: React.CSSProperties = {
  background: 'rgba(6,8,12,0.6)',
  border: '1px solid rgba(255,255,255,0.04)',
  borderRadius: 6,
  color: TEXT_BASE,
  fontFamily: fm,
  fontSize: 14,
  padding: '10px 12px',
  outline: 'none',
  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)',
  transition: 'border-color 0.2s ease',
  width: '100%',
  boxSizing: 'border-box',
};

// ─── Row ─────────────────────────────────────────────────────────────

function Row({ row, accent, onChange, onDelete }: {
  row: WatchRow;
  accent: string;
  onChange: (patch: Partial<WatchRow>) => void;
  onDelete: () => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...cardSurface,
        position: 'relative',
        padding: '14px 36px 14px 22px',
        display: 'grid',
        gridTemplateColumns: '110px 130px 1fr',
        gap: 14,
        alignItems: 'center',
      }}
    >
      {/* Left accent bar — green for long, red for short */}
      <div style={{
        position: 'absolute',
        left: 0, top: 8, bottom: 8,
        width: 3,
        background: accent,
        borderRadius: 2,
      }} />

      <input
        value={row.ticker}
        onChange={(e) => onChange({ ticker: e.target.value.toUpperCase().slice(0, 8) })}
        placeholder="TICKER"
        style={{
          ...inputBaseStyle,
          fontFamily: fd,
          fontWeight: 600,
          letterSpacing: 1,
          textAlign: 'center',
        }}
      />

      <input
        value={row.time}
        onChange={(e) => onChange({ time: e.target.value })}
        placeholder="time"
        style={{ ...inputBaseStyle, textAlign: 'center' }}
      />

      <input
        value={row.reason}
        onChange={(e) => onChange({ reason: e.target.value })}
        placeholder="reason for watching"
        style={inputBaseStyle}
      />

      {/* Delete affordance — hidden until hover so resting state is clean */}
      <button
        onClick={onDelete}
        title="Remove row"
        aria-label="Remove row"
        style={{
          position: 'absolute',
          right: 10, top: '50%',
          transform: 'translateY(-50%)',
          background: 'transparent',
          border: 'none',
          color: hover ? RED : 'transparent',
          cursor: 'pointer',
          transition: 'color 0.2s ease',
          padding: 4,
          borderRadius: 4,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
}

// ─── Section (Watching Long / Watching Short) ────────────────────────

function Section({ title, icon: Icon, accent, rows, onChangeRow, onDeleteRow, onAddRow }: {
  title: string;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  accent: string;
  rows: WatchRow[];
  onChangeRow: (id: string, patch: Partial<WatchRow>) => void;
  onDeleteRow: (id: string) => void;
  onAddRow: () => void;
}) {
  return (
    <div>
      <div style={{
        ...labelStyle,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        color: accent,
        marginBottom: 14,
      }}>
        <Icon size={16} color={accent} strokeWidth={2} />
        {title}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {rows.map(r => (
          <Row
            key={r.id}
            row={r}
            accent={accent}
            onChange={(patch) => onChangeRow(r.id, patch)}
            onDelete={() => onDeleteRow(r.id)}
          />
        ))}
      </div>

      <button
        onClick={onAddRow}
        style={{
          marginTop: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 16px',
          background: 'transparent',
          border: `1px dashed ${accent}55`,
          borderRadius: 8,
          color: accent,
          fontFamily: fd,
          fontSize: 12,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: 1.2,
          cursor: 'pointer',
          width: '100%',
          justifyContent: 'center',
          transition: 'background 0.2s ease, border-color 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = `${accent}10`;
          e.currentTarget.style.borderColor = accent;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.borderColor = `${accent}55`;
        }}
      >
        <Plus size={14} />
        Add row
      </button>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────

export function WatchingContent({ onBack }: { onBack: () => void }) {
  const [state, setState] = useState<WatchingState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);

  // Same hydration pattern as Overall Journal — without the hydrated
  // gate, the save effect fires on mount with the default seed and
  // overwrites real saved state before load completes.
  useEffect(() => {
    setState(loadWatching());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveWatching(state);
  }, [state, hydrated]);

  const update = (side: 'longs' | 'shorts', id: string, patch: Partial<WatchRow>) => {
    setState(s => ({
      ...s,
      [side]: s[side].map(r => r.id === id ? { ...r, ...patch } : r),
    }));
  };

  const remove = (side: 'longs' | 'shorts', id: string) => {
    setState(s => ({
      ...s,
      [side]: s[side].filter(r => r.id !== id),
    }));
  };

  const add = (side: 'longs' | 'shorts') => {
    setState(s => ({
      ...s,
      [side]: [...s[side], { ...makeRow(), time: currentTimeLabel() }],
    }));
  };

  return (
    <ToolPageShell title="Watching" onBack={onBack}>
      <div style={{
        maxWidth: 820,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 36,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: fm, fontSize: 15, color: LABEL, lineHeight: 1.55 }}>
            Pre-market and post-market observations. Stocks you&apos;re watching long up top, watching short below.
          </div>
        </div>

        <Section
          title="Watching Long"
          icon={TrendingUp}
          accent={teal}
          rows={state.longs}
          onChangeRow={(id, patch) => update('longs', id, patch)}
          onDeleteRow={(id) => remove('longs', id)}
          onAddRow={() => add('longs')}
        />

        <Section
          title="Watching Short"
          icon={TrendingDown}
          accent={RED}
          rows={state.shorts}
          onChangeRow={(id, patch) => update('shorts', id, patch)}
          onDeleteRow={(id) => remove('shorts', id)}
          onAddRow={() => add('shorts')}
        />
      </div>
    </ToolPageShell>
  );
}
