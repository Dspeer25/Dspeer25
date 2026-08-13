'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Wallet, Crosshair, Activity, Layers, Info, AlertCircle, Plus, RotateCcw, Trash2 } from 'lucide-react';
import {
  fd, fm, teal, toLocalYMD,
  FUTURES_CONTRACTS, FUTURES_GROUP_ORDER,
  readCustomFutures, addCustomFuture, removeCustomFuture,
  futuresRiskPerContract, futuresTickDistance, futuresMaxContracts, futuresRTarget,
  isStopSideValid, isOnTick, roundToTick, tickDecimals, formatTickPrice,
  type FuturesContract, type TradeDirection,
} from './shared';
import { ToolPageShell } from './ToolsContent';

const RED         = '#ff4444';
const TEXT_BASE   = '#e0e0e0';
const TEXT_MUTED  = '#7a7d85';
// Per-page lighter label color — the project's #7a7d85 secondary was
// too dim against the new card surface for uppercase labels at small
// sizes. Used for card headers, field labels, the toggle inactive
// state, and the options chip + caveat. Position-cost / decorative
// prefixes stay on TEXT_MUTED so the hierarchy still reads.
const LABEL       = '#a0a3ab';
const BORDER      = 'rgba(255,255,255,0.10)';
const SURFACE_TOP = '#1f232d';
const SURFACE_BOT = '#181c26';

type Instrument = 'shares' | 'options' | 'futures';

const RTARGETS = [0.5, 1, 1.5, 2, 2.5, 3] as const;

// Sentinel <option> value that opens the custom-contract form instead of
// selecting a contract. Not a symbol, so it can never collide with one.
const ADD_CUSTOM_VALUE = '__add_custom__';

// Persisted default mode (Shares/Options/Futures) for the calculator. Mirrors
// the Log a Trade default-position-type pattern: read once via a lazy useState
// initializer on mount, written when the trader clicks "Set as default".
const PSC_DEFAULT_MODE_KEY = 'wickcoach_psc_default_mode';
// Persisted "Today's P/L so far" for Day Context. Stored as {value, date}
// so a stale (yesterday's) figure is discarded on mount — see hydration.
const PSC_DAY_PL_KEY = 'wickcoach_psc_day_pl';
// Last-selected futures contract, so a returning MES trader lands on MES.
const PSC_FUTURES_SYMBOL_KEY = 'wickcoach_psc_futures_symbol';
function readDefaultMode(): Instrument | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(PSC_DEFAULT_MODE_KEY);
    if (saved === 'shares' || saved === 'options' || saved === 'futures') return saved;
  } catch { /* ignore */ }
  return null;
}

function fmtD2(v: number): string {
  return '$' + v.toFixed(2).replace(/\B(?=(\d{3})+(?=\.))/g, ',');
}
function fmtPct(v: number): string {
  return v.toFixed(2) + '%';
}

const cardSurface: React.CSSProperties = {
  background: `linear-gradient(180deg, ${SURFACE_TOP} 0%, ${SURFACE_BOT} 100%)`,
  border: `1px solid ${BORDER}`,
  borderRadius: 16,
  boxShadow: '0 16px 40px -8px rgba(0,0,0,0.6), inset 0 1px 0 0 rgba(255,255,255,0.05)',
  position: 'relative',
  overflow: 'hidden',
};

const labelStyle: React.CSSProperties = {
  fontFamily: fd,
  fontSize: 13,
  textTransform: 'uppercase',
  letterSpacing: 1.2,
  color: LABEL,
  fontWeight: 600,
};

// Leg line items in the averaged-position summary — a small teal tag
// ("Original" / "Add 1") followed by that leg's size @ price.
const legLineStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  fontFamily: fm,
  fontSize: 14,
  color: TEXT_BASE,
};
const legTagStyle: React.CSSProperties = {
  fontFamily: fd,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: 1,
  textTransform: 'uppercase',
  color: teal,
  background: 'rgba(0,212,160,0.1)',
  padding: '3px 9px',
  borderRadius: 4,
  minWidth: 70,
  textAlign: 'center',
};

// Tiny keyboard-key chip used in the "Tab / Enter" hint above the cards.
const kbdStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '2px 7px',
  marginInline: 2,
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 4,
  fontFamily: fm,
  fontSize: 12,
  fontWeight: 600,
  color: TEXT_BASE,
  boxShadow: 'inset 0 -1px 0 rgba(0,0,0,0.3)',
};

// ─── Inputs ──────────────────────────────────────────────────────────

function NumInput({ value, onChange, prefix, suffix, decimals = 2, min = 0, inputRef, onEnter, allowEmpty = false, onLiveChange }: {
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  min?: number;
  inputRef?: React.Ref<HTMLInputElement>;
  onEnter?: () => void;
  // When true, a value of 0 renders as a blank field (and focus starts
  // empty) instead of showing "0" — used for the add-a-leg drafts so the
  // trader can just start typing. Left off for the always-populated inputs.
  allowEmpty?: boolean;
  // Fires on every keystroke (not just blur) with the parsed value — used
  // by the add row so the "new avg cost" preview updates live and the
  // confirm value can never be stale. Blank parses to 0.
  onLiveChange?: (v: number) => void;
}) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState('');

  const isEmpty = allowEmpty && value === 0;
  const formatted = decimals > 0
    ? value.toFixed(decimals).replace(/\B(?=(\d{3})+(?=\.))/g, ',')
    : value.toLocaleString();
  const display = focused ? draft : (isEmpty ? '' : formatted);

  return (
    <div style={{ position: 'relative' }}>
      {prefix && (
        <span style={{
          position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)',
          color: LABEL, fontFamily: fm, fontSize: 16, pointerEvents: 'none',
        }}>{prefix}</span>
      )}
      {suffix && (
        <span style={{
          position: 'absolute', right: 18, top: '50%', transform: 'translateY(-50%)',
          color: LABEL, fontFamily: fm, fontSize: 16, pointerEvents: 'none',
        }}>{suffix}</span>
      )}
      <input
        ref={inputRef}
        type="text"
        inputMode={decimals > 0 ? 'decimal' : 'numeric'}
        value={display}
        onFocus={() => { setFocused(true); setDraft(isEmpty ? '' : String(value)); }}
        onBlur={() => {
          setFocused(false);
          const stripped = draft.replace(/[^0-9.\-]/g, '');
          const n = parseFloat(stripped);
          if (!isNaN(n) && n >= min) onChange(n);
        }}
        onChange={e => {
          setDraft(e.target.value);
          if (onLiveChange) {
            const n = parseFloat(e.target.value.replace(/[^0-9.\-]/g, ''));
            onLiveChange(isNaN(n) ? 0 : n);
          }
        }}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            // Blur first so onBlur commits the current draft via onChange,
            // then fire onEnter so the parent (scroll-to-exit-targets, etc.)
            // sees the freshly-committed value.
            (e.currentTarget as HTMLInputElement).blur();
            onEnter?.();
          }
        }}
        style={{
          background: 'rgba(6,8,12,0.6)',
          border: `1px solid ${focused ? teal : 'rgba(255,255,255,0.04)'}`,
          borderRadius: 8,
          color: TEXT_BASE,
          fontFamily: fm,
          fontSize: 18,
          fontWeight: 500,
          padding: '14px 18px',
          paddingLeft: prefix ? 36 : 18,
          paddingRight: suffix ? 36 : 18,
          width: '100%',
          boxShadow: focused
            ? 'inset 0 2px 4px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,212,160,0.2)'
            : 'inset 0 2px 4px rgba(0,0,0,0.2)',
          outline: 'none',
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        }}
      />
    </div>
  );
}

function ReadOnlyField({ value, prefix, color = teal }: {
  value: string; prefix?: string; color?: string;
}) {
  return (
    <div style={{ position: 'relative' }}>
      {prefix && (
        <span style={{
          position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)',
          color: LABEL, fontFamily: fm, fontSize: 16, pointerEvents: 'none',
        }}>{prefix}</span>
      )}
      <div style={{
        padding: '15px 18px',
        paddingLeft: prefix ? 36 : 18,
        color,
        fontFamily: fm,
        fontSize: 18,
        fontWeight: 600,
      }}>
        {value}
      </div>
    </div>
  );
}

// Signed dollar input for "Today's P/L so far". Unlike NumInput this is
// nullable (empty string commits back to null = feature dormant) and
// accepts negatives. Styled to match NumInput exactly.
function DayPLInput({ value, onChange, inputRef, onEnter }: {
  value: number | null;
  onChange: (v: number | null) => void;
  inputRef?: React.Ref<HTMLInputElement>;
  onEnter?: () => void;
}) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState('');

  const formatted = value === null
    ? ''
    : value.toFixed(2).replace(/\B(?=(\d{3})+(?=\.))/g, ',');
  const display = focused ? draft : formatted;

  const commit = () => {
    setFocused(false);
    const stripped = draft.replace(/[^0-9.\-]/g, '');
    // Bare sign / dot / empty → clear to dormant.
    if (stripped === '' || stripped === '-' || stripped === '.' || stripped === '-.') {
      onChange(null);
      return;
    }
    const n = parseFloat(stripped);
    onChange(isNaN(n) ? null : n);
  };

  return (
    <div style={{ position: 'relative' }}>
      <span style={{
        position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)',
        color: LABEL, fontFamily: fm, fontSize: 16, pointerEvents: 'none',
      }}>$</span>
      <input
        ref={inputRef}
        type="text"
        inputMode="text"
        placeholder="—"
        value={display}
        onFocus={() => { setFocused(true); setDraft(value === null ? '' : String(value)); }}
        onBlur={commit}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            (e.currentTarget as HTMLInputElement).blur();
            onEnter?.();
          }
        }}
        style={{
          background: 'rgba(6,8,12,0.6)',
          border: `1px solid ${focused ? teal : 'rgba(255,255,255,0.04)'}`,
          borderRadius: 8,
          color: TEXT_BASE,
          fontFamily: fm,
          fontSize: 18,
          fontWeight: 500,
          padding: '14px 18px',
          paddingLeft: 36,
          width: '100%',
          boxShadow: focused
            ? 'inset 0 2px 4px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,212,160,0.2)'
            : 'inset 0 2px 4px rgba(0,0,0,0.2)',
          outline: 'none',
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        }}
      />
    </div>
  );
}

// Format a signed day total like "−$3,992" / "$2,742" — rounded to whole
// dollars, U+2212 minus ahead of the $, comma-grouped. Positive shows no
// sign; color (teal/red) carries the direction.
function fmtDayMoney(v: number): string {
  const abs = Math.abs(Math.round(v)).toLocaleString();
  return (v < 0 ? '−$' : '$') + abs;
}

// ─── Card / field primitives ─────────────────────────────────────────

function CardHeader({ icon: Icon, title }: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; color?: string }>;
  title: string;
}) {
  return (
    <div style={{
      ...labelStyle,
      marginBottom: 20,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: `1px solid ${BORDER}`,
      paddingBottom: 12,
    }}>
      <span>{title}</span>
      <Icon size={14} strokeWidth={1.5} color="rgba(122,125,133,0.5)" />
    </div>
  );
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

// ─── Shares | Options | Futures toggle ───────────────────────────────

const INSTRUMENTS: { key: Instrument; label: string }[] = [
  { key: 'shares',  label: 'Shares' },
  { key: 'options', label: 'Options' },
  { key: 'futures', label: 'Futures' },
];

function InstrumentToggle({ value, onChange }: {
  value: Instrument; onChange: (v: Instrument) => void;
}) {
  const idx = Math.max(0, INSTRUMENTS.findIndex(o => o.key === value));
  return (
    <div style={{
      position: 'relative',
      display: 'inline-flex',
      background: 'rgba(6,8,12,0.6)',
      border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: 8,
      padding: 4,
    }}>
      {/* Sliding pill. The track is the container minus its 4px padding on
          each side, so each of the three segments is (100% - 8px) / 3. */}
      <div style={{
        position: 'absolute',
        top: 4,
        left: `calc(${idx} * (100% - 8px) / 3 + 4px)`,
        width: 'calc((100% - 8px) / 3)',
        bottom: 4,
        background: SURFACE_TOP,
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 6,
        boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
        transition: 'left 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.15)',
      }} />
      {INSTRUMENTS.map(opt => (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          style={{
            position: 'relative',
            zIndex: 1,
            width: 110,
            padding: '8px 0',
            fontFamily: fd,
            fontSize: 13,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 1.2,
            color: value === opt.key ? TEXT_BASE : LABEL,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            transition: 'color 0.2s ease',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ─── Futures: direction + contract controls ──────────────────────────

// LONG / SHORT as first-class buttons — futures traders short as often as
// they go long, so this is a primary input, not a secondary setting. Both
// states use teal when active; red stays reserved for losses and errors.
function DirectionToggle({ value, onChange }: {
  value: TradeDirection; onChange: (v: TradeDirection) => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      {(['LONG', 'SHORT'] as TradeDirection[]).map(dir => {
        const active = value === dir;
        return (
          <button
            key={dir}
            onClick={() => onChange(dir)}
            style={{
              flex: 1,
              background: active ? 'rgba(0,212,160,0.15)' : 'rgba(6,8,12,0.6)',
              border: active ? `1px solid ${teal}` : '1px solid rgba(255,255,255,0.04)',
              color: active ? teal : LABEL,
              borderRadius: 8,
              padding: '14px 0',
              fontFamily: fd,
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: 1.2,
              cursor: 'pointer',
              transition: 'background 0.15s ease, border-color 0.15s ease, color 0.15s ease',
            }}
          >
            {dir}
          </button>
        );
      })}
    </div>
  );
}

// Small inline "spec" chip shown beside the instrument toggle — the
// options 100x note and the live futures contract spec share it.
const specChipStyle: React.CSSProperties = {
  fontFamily: fm,
  fontSize: 13,
  color: LABEL,
  fontWeight: 500,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.04)',
  padding: '8px 12px',
  borderRadius: 6,
};

const selectStyle: React.CSSProperties = {
  background: 'rgba(6,8,12,0.6)',
  border: '1px solid rgba(255,255,255,0.04)',
  borderRadius: 8,
  color: TEXT_BASE,
  fontFamily: fm,
  fontSize: 18,
  fontWeight: 500,
  padding: '14px 18px',
  width: '100%',
  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)',
  outline: 'none',
  cursor: 'pointer',
};

// Contract dropdown, grouped by asset class with micros sitting directly
// under their parent. The trader's own contracts get a "Custom" group, and
// the last entry always opens the custom-contract form.
function ContractPicker({ contracts, value, onChange }: {
  contracts: FuturesContract[];
  value: string;
  onChange: (symbol: string) => void;
}) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={selectStyle}>
      {[...FUTURES_GROUP_ORDER, 'Custom' as const].map(group => {
        const inGroup = contracts.filter(c => c.group === group);
        if (inGroup.length === 0) return null;
        return (
          <optgroup key={group} label={group}>
            {inGroup.map(c => (
              <option key={c.symbol} value={c.symbol}>{c.symbol} — {c.name}</option>
            ))}
          </optgroup>
        );
      })}
      <option value={ADD_CUSTOM_VALUE}>+ Add custom contract...</option>
    </select>
  );
}

// ─── Main component ──────────────────────────────────────────────────

export function PositionSizeContent({ onBack }: { onBack: () => void }) {
  const [accountSize, setAccountSize] = useState(50000);
  const [riskPct, setRiskPct]         = useState(1);
  // Lazy initializer (not a useEffect) so the saved default mode is the
  // value on the very first render — no flash of the wrong toggle state.
  const [instrument, setInstrument]   = useState<Instrument>(() => readDefaultMode() ?? 'shares');
  // Mirror of the persisted default so the "Set as default" pill can show
  // its active ("Default ✓") state and re-render when it changes.
  const [defaultMode, setDefaultMode] = useState<Instrument | null>(() => readDefaultMode());
  const [entry, setEntry]             = useState(50);
  const [stop, setStop]               = useState(48);
  const [size, setSize]               = useState(250);
  const [hydrated, setHydrated]       = useState(false);
  // "Today's P/L so far" for Day Context. null = empty = feature dormant.
  const [dayPL, setDayPL]             = useState<number | null>(null);

  // ─── Futures state ───────────────────────────────────────────────
  // Contract and direction are futures-only. The contract symbol persists
  // (a returning MES trader lands on MES); direction is per-trade scratch
  // and always starts LONG.
  const [futSymbol, setFutSymbol]           = useState('ES');
  const [direction, setDirection]           = useState<TradeDirection>('LONG');
  const [customFutures, setCustomFutures]   = useState<FuturesContract[]>([]);
  // Custom-contract form, opened from the last entry in the dropdown. Held
  // as strings so tick sizes like 0.0000005 survive typing intact.
  const [showCustomForm, setShowCustomForm]   = useState(false);
  const [customName, setCustomName]           = useState('');
  const [customTickSize, setCustomTickSize]   = useState('');
  const [customTickValue, setCustomTickValue] = useState('');

  // ─── Averaging-in ("Add") state ──────────────────────────────────
  // Each add is a leg { contracts, price }. The running position is just
  // totalCost / totalContracts, re-averaged on every add. Not persisted —
  // adds are per-trade scratch, exactly like entry/stop/size.
  const [adds, setAdds]           = useState<{ contracts: number; price: number }[]>([]);
  const [showAddRow, setShowAddRow] = useState(false);
  const [addQty, setAddQty]       = useState(0);
  const [addPrice, setAddPrice]   = useState(0);
  // Refs mirror the add drafts so confirmAdd — fired synchronously by
  // Enter, right after NumInput's blur commits the value via onChange —
  // reads the just-committed value instead of stale state.
  const addQtyRef        = useRef(0);
  const addPriceRef      = useRef(0);
  const addQtyInputRef   = useRef<HTMLInputElement>(null);
  const addPriceInputRef = useRef<HTMLInputElement>(null);

  // Refs for keyboard-first focus management.
  //   accountInputRef → cursor lands here on first visit
  //   sizeInputRef    → cursor lands here on return visits (Account + Risk
  //                     are persisted, so skip past them straight to the
  //                     per-trade input)
  //   exitTargetsRef  → Enter from any input scrolls this card into view
  const accountInputRef = useRef<HTMLInputElement>(null);
  const sizeInputRef    = useRef<HTMLInputElement>(null);
  const exitTargetsRef  = useRef<HTMLElement>(null);

  // Hydrate Account + Risk from localStorage. The hydrated flag gates
  // the save effects below so the initial render's default values
  // never overwrite real saved data on mount (same race-avoidance
  // pattern as Overall Journal).
  useEffect(() => {
    let hadSaved = false;
    try {
      const savedAccount = localStorage.getItem('wickcoach_position_size_account');
      const savedRisk    = localStorage.getItem('wickcoach_position_size_risk_pct');
      if (savedAccount) {
        const n = parseFloat(savedAccount);
        if (!isNaN(n)) { setAccountSize(n); hadSaved = true; }
      }
      if (savedRisk) {
        const n = parseFloat(savedRisk);
        if (!isNaN(n)) { setRiskPct(n); hadSaved = true; }
      }
    } catch { /* ignore */ }

    // Day P/L: restore only if it was stored TODAY. A stored date != today
    // means it's yesterday's figure — discard it so a prior day's loss can
    // never silently carry into today's math.
    try {
      const rawDay = localStorage.getItem(PSC_DAY_PL_KEY);
      if (rawDay) {
        const parsed = JSON.parse(rawDay) as { value: number; date: string };
        if (parsed && typeof parsed.value === 'number' && parsed.date === toLocalYMD()) {
          setDayPL(parsed.value);
        } else {
          localStorage.removeItem(PSC_DAY_PL_KEY);
        }
      }
    } catch { try { localStorage.removeItem(PSC_DAY_PL_KEY); } catch { /* ignore */ } }

    // Futures: the trader's own contracts, then the last one they used.
    // The symbol is only restored if it still resolves against the merged
    // list, so deleting a custom contract can't strand the picker.
    const saved = readCustomFutures();
    setCustomFutures(saved);
    try {
      const savedSymbol = localStorage.getItem(PSC_FUTURES_SYMBOL_KEY);
      if (savedSymbol && [...FUTURES_CONTRACTS, ...saved].some(c => c.symbol === savedSymbol)) {
        setFutSymbol(savedSymbol);
      }
    } catch { /* ignore */ }

    setHydrated(true);

    // Focus after hydration so the input has rendered with the saved
    // value visible. Direct ref.focus() is more reliable than the
    // autoFocus prop here because focus needs to happen after the
    // async localStorage read finishes.
    requestAnimationFrame(() => {
      if (hadSaved) sizeInputRef.current?.focus();
      else          accountInputRef.current?.focus();
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem('wickcoach_position_size_account', String(accountSize)); } catch { /* ignore */ }
  }, [accountSize, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem('wickcoach_position_size_risk_pct', String(riskPct)); } catch { /* ignore */ }
  }, [riskPct, hydrated]);

  // Persist Day P/L stamped with today's date. Empty clears the key so it
  // doesn't linger; a value re-stamps today so mid-day tab switches keep it.
  useEffect(() => {
    if (!hydrated) return;
    try {
      if (dayPL === null) {
        localStorage.removeItem(PSC_DAY_PL_KEY);
      } else {
        localStorage.setItem(PSC_DAY_PL_KEY, JSON.stringify({ value: dayPL, date: toLocalYMD() }));
      }
    } catch { /* ignore */ }
  }, [dayPL, hydrated]);

  // Remember the last-used contract so it's pre-selected next visit.
  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(PSC_FUTURES_SYMBOL_KEY, futSymbol); } catch { /* ignore */ }
  }, [futSymbol, hydrated]);

  // Enter in any input commits the value (via blur in NumInput) then
  // calls this — smooth-scrolls the Exit Target Parameters card so
  // the R-level sell prices land at the top of the viewport.
  const scrollToExit = () => {
    exitTargetsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Persist the current Shares/Options selection as the default mode.
  const handleSetDefaultMode = () => {
    try { localStorage.setItem(PSC_DEFAULT_MODE_KEY, instrument); } catch { /* ignore */ }
    setDefaultMode(instrument);
  };

  // Open the inline add row with blank drafts, focus the quantity field.
  const openAddRow = () => {
    setAddQty(0);   addQtyRef.current = 0;
    setAddPrice(0); addPriceRef.current = 0;
    setShowAddRow(true);
    requestAnimationFrame(() => addQtyInputRef.current?.focus());
  };
  const cancelAdd = () => setShowAddRow(false);
  // Read the freshly-committed drafts from the refs (see note above) and
  // push a new leg. Ignore incomplete entries so Enter/Confirm on a blank
  // row is a no-op rather than adding a zero leg.
  const confirmAdd = () => {
    const q = addQtyRef.current;
    const p = addPriceRef.current;
    if (q > 0 && p > 0) {
      setAdds(prev => [...prev, { contracts: q, price: p }]);
      setShowAddRow(false);
    }
  };
  // Clear all adds — back to a plain single-entry calculator.
  const resetPosition = () => { setAdds([]); setShowAddRow(false); };

  // Picking the sentinel row opens the custom-contract form rather than
  // changing contract; any real symbol just selects it.
  const handleContractChange = (symbol: string) => {
    if (symbol === ADD_CUSTOM_VALUE) {
      setCustomName(''); setCustomTickSize(''); setCustomTickValue('');
      setShowCustomForm(true);
      return;
    }
    setFutSymbol(symbol);
  };

  const customTickSizeNum  = parseFloat(customTickSize);
  const customTickValueNum = parseFloat(customTickValue);
  const customValid = customName.trim().length > 0
    && isFinite(customTickSizeNum)  && customTickSizeNum  > 0
    && isFinite(customTickValueNum) && customTickValueNum > 0;
  // Always derived, never entered — a custom contract can't be saved with
  // a point value that disagrees with its own tick spec.
  const customPointValue = customValid ? customTickValueNum / customTickSizeNum : 0;

  const saveCustomContract = () => {
    if (!customValid) return;
    const next = addCustomFuture(customName, customTickSizeNum, customTickValueNum);
    setCustomFutures(next);
    const added = next[next.length - 1];
    if (added) setFutSymbol(added.symbol);
    setShowCustomForm(false);
  };

  const deleteCustomContract = (symbol: string) => {
    const next = removeCustomFuture(symbol);
    setCustomFutures(next);
    if (futSymbol === symbol) setFutSymbol(FUTURES_CONTRACTS[0].symbol);
  };

  const isFutures       = instrument === 'futures';
  const multiplier      = instrument === 'options' ? 100 : 1;
  const unitsWordPlural = instrument === 'shares' ? 'shares' : 'contracts';

  // Resolve the selected contract against built-ins + the trader's customs.
  // Falls back to the first built-in so futures mode always has a contract —
  // deleting a custom one can never blank out the calculator.
  const contractList = React.useMemo(
    () => [...FUTURES_CONTRACTS, ...customFutures],
    [customFutures],
  );
  const contract = React.useMemo(
    () => contractList.find(c => c.symbol === futSymbol) ?? FUTURES_CONTRACTS[0],
    [contractList, futSymbol],
  );

  // Position averaging — fold the original leg (size @ entry) and every
  // add into one averaged leg. effEntry/effSize then feed ALL downstream
  // math unchanged, so risk / cost / R-ladder behave identically whether
  // or not the trader has averaged in.
  const hasPosition    = adds.length > 0;
  const addContracts   = adds.reduce((s, a) => s + a.contracts, 0);
  const totalContracts = size + addContracts;
  const totalCostUnits = size * entry + adds.reduce((s, a) => s + a.contracts * a.price, 0);
  const avgCost        = totalContracts > 0 ? totalCostUnits / totalContracts : entry;
  const effEntry       = hasPosition ? avgCost : entry;
  const effSize        = hasPosition ? totalContracts : size;

  // Math — pure functions of inputs. Uses the effective (averaged) entry
  // and size; the stop stays live, so moving it recalcs everything.
  const maxRisk = accountSize * (riskPct / 100);

  // Signed distance from the effective entry to the stop, in points. A
  // SHORT profits as price falls, so its stop sits ABOVE entry — flipping
  // the sign here keeps one definition of "stop on the wrong side" across
  // all three modes.
  const priceRisk = isFutures && direction === 'SHORT' ? stop - effEntry : effEntry - stop;

  // Per-unit loss. Shares/options scale the raw point move by the contract
  // multiplier; futures convert it through the contract's tick spec, which
  // is why there is no x100 anywhere on the futures path.
  const riskPerContract = isFutures
    ? futuresRiskPerContract(effEntry, stop, contract.tickSize, contract.tickValue)
    : 0;
  const perUnitLoss  = isFutures ? riskPerContract : priceRisk * multiplier;
  const riskPerTrade = effSize * perUnitLoss;
  const pctOfAccount = accountSize > 0 ? (riskPerTrade / accountSize) * 100 : 0;
  // Futures put up margin, not cost — show notional exposure instead.
  const positionCost = isFutures
    ? effSize * effEntry * contract.pointValue
    : effSize * effEntry * multiplier;

  // Futures-only readouts: whole ticks to the stop, and the largest
  // position that still fits inside the risk budget.
  const stopPoints      = Math.abs(effEntry - stop);
  const tickDistance    = isFutures ? futuresTickDistance(effEntry, stop, contract.tickSize) : 0;
  const maxContracts    = isFutures ? futuresMaxContracts(maxRisk, riskPerContract) : 0;
  const maxContractRisk = maxContracts * riskPerContract;
  // Off-tick prices are snapped for DISPLAY only, with a quiet note. Never
  // an error — a trader pasting a fill shouldn't be blocked over an
  // increment they can't control.
  const entryOffTick = isFutures && !isOnTick(entry, contract.tickSize);
  const stopOffTick  = isFutures && !isOnTick(stop, contract.tickSize);
  const anyOffTick   = entryOffTick || stopOffTick;

  // Day Context — fold an existing intraday P/L into this trade's outcomes.
  // Always uses the live riskPerTrade above (so it reflects any Add legs),
  // never a stale copy. dayPL === null keeps the whole feature dormant.
  const dayActive       = dayPL !== null;
  const dayIfStopped    = dayActive ? (dayPL as number) - riskPerTrade : 0;
  const dayAt1_5R       = dayActive ? (dayPL as number) + 1.5 * riskPerTrade : 0;
  const dayAt2R         = dayActive ? (dayPL as number) + 2 * riskPerTrade : 0;
  const dayStoppedPct   = accountSize > 0 ? Math.abs(dayIfStopped / accountSize) * 100 : 0;

  // Live projection for the open add row — the average the position WOULD
  // have if the currently-typed quantity/price were confirmed on top of
  // the running position. Lets the trader see the new blended cost before
  // committing the leg.
  const previewTotal     = totalContracts + addQty;
  const previewCostUnits = totalCostUnits + addQty * addPrice;
  const previewAvg       = previewTotal > 0 ? previewCostUnits / previewTotal : entry;
  const previewReady     = addQty > 0 && addPrice > 0;

  // Two distinct alarm states.
  //   badStop:    stop ≥ entry — R math is undefined, block the readout.
  //   overBudget: size puts more $ at risk than the account allows — warn
  //               but keep everything visible so the trader can see how
  //               much they'd need to drop size to fit.
  const badStop = isFutures
    ? !isStopSideValid(direction, effEntry, stop)
    : priceRisk <= 0;
  const overBudget = !badStop && riskPerTrade > maxRisk;

  return (
    <ToolPageShell title="Position Size Calculator" onBack={onBack}>
      <div style={{
        maxWidth: 920,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}>

        {/* Keyboard hint — kept at LABEL color (#a0a3ab) / 13px so it
            satisfies the "no dim small gray" rule while still feeling
            like an unobtrusive shortcut hint. */}
        <div style={{
          fontFamily: fm,
          fontSize: 13,
          color: LABEL,
          textAlign: 'center',
          letterSpacing: 0.5,
          marginTop: -4,
        }}>
          <span style={{ ...kbdStyle }}>Tab</span> to move between fields  ·  <span style={{ ...kbdStyle }}>Enter</span> to jump to R levels
        </div>

        {/* ─── Card 1: Account Setup ──────────────────────────────── */}
        <section style={{ ...cardSurface, padding: 32 }}>
          <CardHeader icon={Wallet} title="Account Setup" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            <FieldGroup label="Account size">
              <NumInput
                value={accountSize}
                onChange={setAccountSize}
                prefix="$"
                inputRef={accountInputRef}
                onEnter={scrollToExit}
              />
            </FieldGroup>
            <FieldGroup label="Risk %">
              <NumInput
                value={riskPct}
                onChange={setRiskPct}
                suffix="%"
                onEnter={scrollToExit}
              />
            </FieldGroup>
            <FieldGroup label="Max risk">
              <ReadOnlyField value={fmtD2(maxRisk).slice(1)} prefix="$" />
            </FieldGroup>
          </div>

          {/* Day Context input — signed intraday P/L. Empty = dormant. */}
          <div style={{
            marginTop: 24,
            paddingTop: 24,
            borderTop: `1px solid ${BORDER}`,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 24,
            alignItems: 'end',
          }}>
            <FieldGroup label="Today's P/L so far">
              <DayPLInput value={dayPL} onChange={setDayPL} onEnter={scrollToExit} />
            </FieldGroup>
            <div style={{ gridColumn: 'span 2', paddingBottom: 15 }}>
              <span style={{ fontFamily: fm, fontSize: 13, color: LABEL, lineHeight: 1.5 }}>
                Optional. Enter your realized P/L so far today (negative for a loss) to
                see how this trade&rsquo;s outcomes move your daily total. Leave blank to
                ignore. Clears automatically at the start of a new day.
              </span>
            </div>
          </div>
        </section>

        {/* ─── Card 2: Trade Setup ────────────────────────────────── */}
        <section style={{ ...cardSurface, padding: 32 }}>
          <CardHeader icon={Crosshair} title="Trade Setup" />

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
            <InstrumentToggle value={instrument} onChange={setInstrument} />

            {/* "Set as default" pill — mirrors the Log a Trade default
                position-type control. Saves the live Shares/Options
                selection to localStorage; flips to "Default ✓" when the
                current selection already matches the saved default. */}
            <span
              onClick={handleSetDefaultMode}
              title={defaultMode === instrument
                ? 'This mode loads by default when you open the calculator'
                : 'Make this the default mode when you open the calculator'}
              style={{
                fontFamily: fm,
                fontSize: 11,
                letterSpacing: 0.5,
                cursor: 'pointer',
                userSelect: 'none',
                padding: '6px 12px',
                borderRadius: 999,
                color: teal,
                background: defaultMode === instrument ? 'rgba(0,212,160,0.15)' : 'transparent',
                border: defaultMode === instrument ? `1px solid ${teal}` : '1px solid rgba(0,212,160,0.35)',
              }}
            >
              {defaultMode === instrument ? 'Default ✓' : 'Set as default'}
            </span>

            {instrument === 'options' && (
              <div style={specChipStyle}>
                <Info size={14} color={LABEL} />
                1 contract = 100 shares
              </div>
            )}

            {/* Futures: the live spec of the selected contract, so the
                numbers below are always traceable to a tick value. */}
            {isFutures && (
              <div style={specChipStyle}>
                <Info size={14} color={LABEL} />
                {contract.symbol} · tick {contract.tickSize} = {fmtD2(contract.tickValue)} · {fmtD2(contract.pointValue)}/pt
              </div>
            )}

            {/* Add (average-in) — opens the inline add-a-leg row. Pushed
                to the right; hidden while the row is open so there's a
                single obvious action. */}
            {!showAddRow && (
              <button
                onClick={openAddRow}
                title="Average into this position: add contracts/shares at a new price to recompute your average cost, risk, and R levels"
                style={{
                  marginLeft: 'auto',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontFamily: fd,
                  fontSize: 13,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  color: teal,
                  background: 'rgba(0,212,160,0.1)',
                  border: '1px solid rgba(0,212,160,0.35)',
                  borderRadius: 8,
                  padding: '8px 18px',
                  cursor: 'pointer',
                }}
              >
                <Plus size={15} strokeWidth={2.2} color={teal} />
                Add
              </button>
            )}
          </div>

          {/* Futures: contract + direction. Both are primary inputs, so they
              sit above the size/entry/stop grid rather than beside it. */}
          {isFutures && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 24,
              marginBottom: 24,
              alignItems: 'end',
            }}>
              <FieldGroup label="Contract">
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <ContractPicker
                      contracts={contractList}
                      value={futSymbol}
                      onChange={handleContractChange}
                    />
                  </div>
                  {contract.group === 'Custom' && (
                    <button
                      onClick={() => deleteCustomContract(contract.symbol)}
                      title={`Delete the custom contract "${contract.name}"`}
                      aria-label={`Delete the custom contract ${contract.name}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 46,
                        height: 53,
                        flexShrink: 0,
                        background: 'transparent',
                        border: `1px solid ${BORDER}`,
                        borderRadius: 8,
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={16} color={RED} strokeWidth={1.8} />
                    </button>
                  )}
                </div>
              </FieldGroup>
              <FieldGroup label="Direction">
                <DirectionToggle value={direction} onChange={setDirection} />
              </FieldGroup>
            </div>
          )}

          {/* Custom contract form — name + tick size + tick value. Point
              value is shown live but always derived, never entered. */}
          {isFutures && showCustomForm && (
            <div style={{
              marginBottom: 24,
              padding: 20,
              background: 'rgba(6,8,12,0.45)',
              border: `1px solid ${BORDER}`,
              borderRadius: 12,
            }}>
              <div style={{ ...labelStyle, marginBottom: 16 }}>Add custom contract</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 16 }}>
                <FieldGroup label="Name">
                  <input
                    value={customName}
                    onChange={e => setCustomName(e.target.value)}
                    placeholder="e.g. Micro Palladium"
                    style={{ ...selectStyle, cursor: 'text' }}
                  />
                </FieldGroup>
                <FieldGroup label="Tick size">
                  <input
                    value={customTickSize}
                    onChange={e => setCustomTickSize(e.target.value)}
                    inputMode="decimal"
                    placeholder="0.25"
                    style={{ ...selectStyle, cursor: 'text' }}
                  />
                </FieldGroup>
                <FieldGroup label="Tick value">
                  <input
                    value={customTickValue}
                    onChange={e => setCustomTickValue(e.target.value)}
                    inputMode="decimal"
                    placeholder="12.50"
                    style={{ ...selectStyle, cursor: 'text' }}
                  />
                </FieldGroup>
              </div>
              <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: fm, fontSize: 14, color: LABEL }}>
                  Point value{' '}
                  <span style={{ color: customValid ? teal : TEXT_MUTED, fontWeight: 700 }}>
                    {customValid ? fmtD2(customPointValue) : '—'}
                  </span>
                  {' '}· derived from tick value / tick size
                </span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
                  <button
                    onClick={saveCustomContract}
                    disabled={!customValid}
                    style={{
                      fontFamily: fd, fontSize: 13, fontWeight: 700, textTransform: 'uppercase',
                      letterSpacing: 1,
                      color: customValid ? '#06120e' : TEXT_MUTED,
                      background: customValid ? teal : 'transparent',
                      border: `1px solid ${customValid ? teal : BORDER}`,
                      borderRadius: 8, padding: '13px 20px',
                      cursor: customValid ? 'pointer' : 'not-allowed',
                    }}
                  >
                    Save contract
                  </button>
                  <button
                    onClick={() => setShowCustomForm(false)}
                    style={{
                      fontFamily: fd, fontSize: 13, fontWeight: 700, textTransform: 'uppercase',
                      letterSpacing: 1, color: LABEL, background: 'transparent',
                      border: `1px solid ${BORDER}`, borderRadius: 8, padding: '13px 20px',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            <FieldGroup label={hasPosition ? `Original ${unitsWordPlural}` : `Number of ${unitsWordPlural}`}>
              <NumInput
                value={size}
                onChange={setSize}
                decimals={0}
                inputRef={sizeInputRef}
                onEnter={scrollToExit}
              />
            </FieldGroup>
            <FieldGroup label={hasPosition ? 'Original entry' : 'Entry price'}>
              <NumInput
                value={entry}
                onChange={setEntry}
                prefix={isFutures ? undefined : '$'}
                decimals={isFutures ? tickDecimals(contract.tickSize) : 2}
                onEnter={scrollToExit}
              />
            </FieldGroup>
            <FieldGroup label="Stop price">
              <NumInput
                value={stop}
                onChange={setStop}
                prefix={isFutures ? undefined : '$'}
                decimals={isFutures ? tickDecimals(contract.tickSize) : 2}
                onEnter={scrollToExit}
              />
            </FieldGroup>
          </div>

          {/* Live stop-distance line — points, whole ticks, and the dollar
              risk of a single contract. This is the number a futures trader
              sanity-checks before sizing, so it sits directly under the
              inputs that drive it. */}
          {isFutures && (
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontFamily: fm, fontSize: 15, color: LABEL }}>
                Stop distance{' '}
                {badStop ? (
                  <span style={{ color: RED, fontWeight: 600 }}>
                    stop is on the wrong side for {direction}
                  </span>
                ) : (
                  <>
                    <span style={{ color: teal, fontWeight: 700 }}>
                      {formatTickPrice(stopPoints, contract.tickSize)} pts
                    </span>
                    {' '}({tickDistance.toLocaleString()} tick{tickDistance === 1 ? '' : 's'})
                    {' · '}
                    <span style={{ color: teal, fontWeight: 700 }}>{fmtD2(riskPerContract)}</span>
                    {' per contract'}
                  </>
                )}
              </div>
              {anyOffTick && (
                <div style={{ fontFamily: fm, fontSize: 13, color: TEXT_MUTED }}>
                  Not on a {contract.tickSize} tick — shown snapped to
                  {entryOffTick && ` entry ${formatTickPrice(roundToTick(entry, contract.tickSize), contract.tickSize)}`}
                  {entryOffTick && stopOffTick && ','}
                  {stopOffTick && ` stop ${formatTickPrice(roundToTick(stop, contract.tickSize), contract.tickSize)}`}
                  . Your entered values are used as-is in the math.
                </div>
              )}
            </div>
          )}

          {/* Inline "add a leg" row — quantity + price, confirm/cancel.
              Enter on quantity advances to price; Enter on price confirms.
              Sits after the main grid so it slots naturally into the
              existing tab order rather than disrupting it. */}
          {showAddRow && (
            <div style={{ marginTop: 24, paddingTop: 24, borderTop: `1px solid ${BORDER}` }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr auto auto',
                gap: 16,
                alignItems: 'end',
              }}>
              <FieldGroup label="Quantity added">
                <NumInput
                  value={addQty}
                  decimals={0}
                  allowEmpty
                  onChange={v => { setAddQty(v); addQtyRef.current = v; }}
                  onLiveChange={v => { setAddQty(v); addQtyRef.current = v; }}
                  onEnter={() => addPriceInputRef.current?.focus()}
                  inputRef={addQtyInputRef}
                />
              </FieldGroup>
              <FieldGroup label="Price added at">
                <NumInput
                  value={addPrice}
                  prefix="$"
                  allowEmpty
                  onChange={v => { setAddPrice(v); addPriceRef.current = v; }}
                  onLiveChange={v => { setAddPrice(v); addPriceRef.current = v; }}
                  onEnter={confirmAdd}
                  inputRef={addPriceInputRef}
                />
              </FieldGroup>
              <button
                onClick={confirmAdd}
                style={{
                  fontFamily: fd, fontSize: 13, fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: 1, color: '#06120e', background: teal,
                  border: `1px solid ${teal}`, borderRadius: 8, padding: '15px 22px', cursor: 'pointer',
                }}
              >
                Confirm
              </button>
              <button
                onClick={cancelAdd}
                style={{
                  fontFamily: fd, fontSize: 13, fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: 1, color: LABEL, background: 'transparent',
                  border: `1px solid ${BORDER}`, borderRadius: 8, padding: '15px 22px', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              </div>

              {/* Live preview — the blended average this add WOULD produce
                  once confirmed, computed on top of the running position. */}
              {previewReady && (
                <div style={{ marginTop: 16, fontFamily: fm, fontSize: 15, color: LABEL }}>
                  New avg cost{' '}
                  <span style={{ color: teal, fontWeight: 700 }}>{previewAvg.toFixed(2)}</span>
                  {` · ${previewTotal.toLocaleString()} ${unitsWordPlural}`}
                </div>
              )}
            </div>
          )}

          {/* Position view — with at least one add, show the re-averaged
              cost prominently plus every leg as a line item. Editing the
              Original size/entry or adding again re-averages live. */}
          {hasPosition && (
            <div style={{ marginTop: 24, paddingTop: 24, borderTop: `1px solid ${BORDER}` }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={labelStyle}>Average cost</span>
                  <span style={{ fontFamily: fd, fontSize: 26, fontWeight: 700, color: teal, letterSpacing: 0.5 }}>
                    Avg cost {avgCost.toFixed(2)} · {totalContracts.toLocaleString()} {unitsWordPlural}
                  </span>
                </div>
                {/* Icon-only reset — the circular arrow carries the meaning,
                    so the label lives in the tooltip / aria-label instead. */}
                <button
                  onClick={resetPosition}
                  title="Reset to initial position"
                  aria-label="Reset to initial position"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 34,
                    height: 34,
                    flexShrink: 0,
                    background: 'transparent',
                    border: `1px solid ${BORDER}`,
                    borderRadius: 8,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  <RotateCcw size={16} color={teal} strokeWidth={2} />
                </button>
              </div>

              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={legLineStyle}>
                  <span style={legTagStyle}>Original</span>
                  <span>{size.toLocaleString()} {unitsWordPlural} @ {fmtD2(entry)}</span>
                </div>
                {adds.map((a, i) => (
                  <div key={i} style={legLineStyle}>
                    <span style={legTagStyle}>Add {i + 1}</span>
                    <span>{a.contracts.toLocaleString()} {unitsWordPlural} @ {fmtD2(a.price)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {instrument === 'options' && (
            <div style={{
              marginTop: 24,
              paddingTop: 20,
              borderTop: `1px solid ${BORDER}`,
            }}>
              <p style={{
                fontFamily: fm,
                fontSize: 13,
                color: LABEL,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                lineHeight: 1.55,
                margin: 0,
              }}>
                <Info size={15} color={LABEL} style={{ marginTop: 2, flexShrink: 0 }} />
                Stop is usually defined on the underlying — premium math here is an estimate.
              </p>
            </div>
          )}
        </section>

        {/* ─── Card 3: Risk Readout ───────────────────────────────── */}
        <section style={{
          ...cardSurface,
          padding: 32,
          ...((badStop || overBudget) ? {
            background: 'linear-gradient(180deg, #1d1418 0%, #181016 100%)',
            border: '1px solid rgba(255,68,68,0.35)',
          } : {}),
        }}>
          {(badStop || overBudget) && (
            <div style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: 4,
              background: RED,
              boxShadow: '0 0 20px rgba(255,68,68,0.5)',
            }} />
          )}

          {badStop ? (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <AlertCircle size={28} color={RED} strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{
                  fontFamily: fd,
                  fontSize: 22,
                  fontWeight: 600,
                  color: RED,
                  letterSpacing: 0.5,
                }}>
                  {isFutures
                    ? `Stop is on the wrong side for ${direction}`
                    : 'Stop price must be below entry'}
                </div>
                <div style={{
                  fontFamily: fm,
                  fontSize: 13,
                  color: TEXT_MUTED,
                  lineHeight: 1.5,
                  maxWidth: 580,
                }}>
                  {isFutures
                    ? (direction === 'LONG'
                        ? 'A LONG stops out below entry — set a stop lower than your entry price.'
                        : 'A SHORT stops out above entry — set a stop higher than your entry price.')
                    : 'For a long position, the stop must be lower than the entry. Adjust your inputs.'}
                </div>
              </div>
            </div>
          ) : (
            <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1.5fr 2fr',
              gap: 48,
              alignItems: 'center',
            }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                borderRight: `1px solid ${BORDER}`,
                paddingRight: 48,
              }}>
                <div style={{
                  ...labelStyle,
                  marginBottom: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}>
                  <Activity size={12} color="rgba(122,125,133,0.5)" />
                  Risk per trade
                </div>
                <div style={{
                  fontFamily: fd,
                  fontSize: 48,
                  fontWeight: 700,
                  letterSpacing: -1,
                  color: overBudget ? RED : teal,
                  lineHeight: 0.95,
                }}>
                  {fmtD2(riskPerTrade)}
                </div>
                <div style={{
                  marginTop: 10,
                  fontFamily: fm,
                  fontSize: 13,
                  fontWeight: 500,
                  color: overBudget ? RED : teal,
                  lineHeight: 1.5,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                }}>
                  {overBudget
                    ? `Above your ${fmtD2(maxRisk)} budget by ${fmtD2(riskPerTrade - maxRisk)}`
                    : 'Compliant'}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px 32px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={labelStyle}>% of account</span>
                  <span style={{ fontFamily: fm, fontSize: 26, color: overBudget ? RED : teal, fontWeight: 600 }}>
                    {fmtPct(pctOfAccount)}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {/* Futures put up margin rather than paying a cost, so the
                      same slot reports notional exposure instead. */}
                  <span style={labelStyle}>{isFutures ? 'Notional value' : 'Position cost'}</span>
                  <span style={{ fontFamily: fm, fontSize: 24, color: TEXT_BASE, fontWeight: 500 }}>
                    {fmtD2(positionCost)}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={labelStyle}>Stop distance</span>
                  <span style={{ fontFamily: fm, fontSize: 22, color: TEXT_BASE, fontWeight: 500 }}>
                    {isFutures
                      ? `${formatTickPrice(stopPoints, contract.tickSize)} pts`
                      : fmtD2(priceRisk)}
                  </span>
                </div>
              </div>
            </div>

            {/* Max contracts — the single most actionable number in futures
                mode, so it gets its own full-width band under the readout. */}
            {isFutures && (
              <div style={{
                marginTop: 28,
                paddingTop: 24,
                borderTop: `1px solid ${BORDER}`,
                display: 'flex',
                alignItems: 'baseline',
                gap: 14,
                flexWrap: 'wrap',
              }}>
                <span style={{ ...labelStyle, fontSize: 14 }}>Max contracts at this stop</span>
                {maxContracts > 0 ? (
                  <>
                    <span style={{
                      fontFamily: fd,
                      fontSize: 40,
                      fontWeight: 700,
                      color: teal,
                      letterSpacing: -0.5,
                      lineHeight: 1,
                    }}>
                      {maxContracts.toLocaleString()}
                    </span>
                    <span style={{ fontFamily: fm, fontSize: 16, color: LABEL }}>
                      ({fmtD2(maxContractRisk)} risk of your {fmtD2(maxRisk)} budget)
                    </span>
                  </>
                ) : (
                  <span style={{ fontFamily: fm, fontSize: 17, fontWeight: 600, color: RED }}>
                    None — a single contract risks {fmtD2(riskPerContract)}, more than your {fmtD2(maxRisk)} budget.
                  </span>
                )}
              </div>
            )}
            </>
          )}
        </section>

        {/* ─── Day Context ────────────────────────────────────────────
            Only when a P/L is entered and the risk math is valid. Each row
            folds this trade's outcome into the running day total; sign
            drives the color so "what turns the day green" reads instantly. */}
        {dayActive && !badStop && (
          <section style={{ ...cardSurface, padding: 32 }}>
            <div style={{
              ...labelStyle,
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: `1px solid ${BORDER}`,
              paddingBottom: 12,
            }}>
              <span>Day Context</span>
              <span style={{ fontFamily: fm, fontSize: 13, color: LABEL, textTransform: 'none', letterSpacing: 0.3 }}>
                Starting today at{' '}
                <span style={{ color: (dayPL as number) < 0 ? RED : teal, fontWeight: 600 }}>
                  {fmtDayMoney(dayPL as number)}
                </span>
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* a. If this trade stops out */}
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16 }}>
                <span style={{ fontFamily: fm, fontSize: 15, color: LABEL }}>Day total if stopped</span>
                <span style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <span style={{ fontFamily: fm, fontSize: 24, fontWeight: 700, color: dayIfStopped < 0 ? RED : teal }}>
                    {fmtDayMoney(dayIfStopped)}
                  </span>
                  <span style={{ fontFamily: fm, fontSize: 14, color: LABEL }}>
                    · {dayStoppedPct.toFixed(1)}% of account
                  </span>
                </span>
              </div>

              {/* b. If 1.5R hits */}
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16 }}>
                <span style={{ fontFamily: fm, fontSize: 15, color: LABEL }}>Day at 1.5R</span>
                <span style={{ fontFamily: fm, fontSize: 24, fontWeight: 700, color: dayAt1_5R < 0 ? RED : teal }}>
                  {fmtDayMoney(dayAt1_5R)}
                </span>
              </div>

              {/* c. If 2R hits */}
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16 }}>
                <span style={{ fontFamily: fm, fontSize: 15, color: LABEL }}>Day at 2R</span>
                <span style={{ fontFamily: fm, fontSize: 24, fontWeight: 700, color: dayAt2R < 0 ? RED : teal }}>
                  {fmtDayMoney(dayAt2R)}
                </span>
              </div>
            </div>
          </section>
        )}

        {/* ─── Card 4: Exit Target Ladder ─────────────────────────── */}
        <section ref={exitTargetsRef} style={cardSurface}>
          <div style={{
            ...labelStyle,
            margin: 32,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span>Exit Target Parameters</span>
            <Layers size={14} strokeWidth={1.5} color={TEXT_MUTED} />
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '100px 1fr 1fr',
            gap: 16,
            padding: '12px 32px',
            background: 'rgba(255,255,255,0.02)',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}>
            <div style={{ ...labelStyle, textAlign: 'left' }}>R level</div>
            <div style={{ ...labelStyle, textAlign: 'right' }}>{isFutures ? 'Target price' : 'Sell price'}</div>
            <div style={{ ...labelStyle, textAlign: 'right' }}>Gross profit</div>
          </div>

          <div>
            {RTARGETS.map((r, i) => {
              // Futures targets run up from entry on a LONG and down on a
              // SHORT, and always land on a valid tick.
              const sellPrice = badStop
                ? null
                : isFutures
                  ? futuresRTarget(effEntry, stop, direction, r, contract.tickSize)
                  : effEntry + r * priceRisk;
              const grossProfit = badStop ? null : r * riskPerTrade;
              const isLast = i === RTARGETS.length - 1;
              const isOneR = r === 1;
              return (
                <div key={r} style={{
                  position: 'relative',
                  display: 'grid',
                  gridTemplateColumns: '100px 1fr 1fr',
                  gap: 16,
                  alignItems: 'center',
                  padding: '16px 32px',
                  borderBottom: isLast ? 'none' : `1px solid ${BORDER}`,
                }}>
                  {isOneR && !badStop && (
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: 2,
                      background: 'rgba(0,212,160,0.2)',
                    }} />
                  )}
                  <div style={{
                    fontFamily: fd,
                    fontSize: 15,
                    fontWeight: 600,
                    color: teal,
                    background: 'rgba(0,212,160,0.1)',
                    padding: '2px 8px',
                    borderRadius: 4,
                    letterSpacing: 1,
                    width: 'fit-content',
                  }}>
                    {r}R
                  </div>
                  <div style={{
                    fontFamily: fm,
                    fontSize: 16,
                    color: TEXT_BASE,
                    textAlign: 'right',
                  }}>
                    {sellPrice !== null
                      ? (isFutures ? formatTickPrice(sellPrice, contract.tickSize) : fmtD2(sellPrice))
                      : '—'}
                  </div>
                  <div style={{
                    fontFamily: fm,
                    fontSize: 16,
                    color: grossProfit !== null && grossProfit > 0 ? teal : TEXT_MUTED,
                    fontWeight: 500,
                    textAlign: 'right',
                  }}>
                    {grossProfit !== null ? '+' + fmtD2(grossProfit) : '—'}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </div>
    </ToolPageShell>
  );
}
