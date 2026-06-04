'use client';
import React, { useState } from 'react';
import { Wallet, Crosshair, Activity, Layers, Info, AlertCircle } from 'lucide-react';
import { fd, fm, teal } from './shared';
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

type Instrument = 'shares' | 'options';

const RTARGETS = [0.5, 1, 1.5, 2, 2.5, 3] as const;

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

// ─── Inputs ──────────────────────────────────────────────────────────

function NumInput({ value, onChange, prefix, suffix, decimals = 2, min = 0 }: {
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  min?: number;
}) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState('');

  const formatted = decimals > 0
    ? value.toFixed(decimals).replace(/\B(?=(\d{3})+(?=\.))/g, ',')
    : value.toLocaleString();
  const display = focused ? draft : formatted;

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
        type="text"
        inputMode={decimals > 0 ? 'decimal' : 'numeric'}
        value={display}
        onFocus={() => { setFocused(true); setDraft(String(value)); }}
        onBlur={() => {
          setFocused(false);
          const stripped = draft.replace(/[^0-9.\-]/g, '');
          const n = parseFloat(stripped);
          if (!isNaN(n) && n >= min) onChange(n);
        }}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur(); }}
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

// ─── Shares | Options toggle ─────────────────────────────────────────

function InstrumentToggle({ value, onChange }: {
  value: Instrument; onChange: (v: Instrument) => void;
}) {
  return (
    <div style={{
      position: 'relative',
      display: 'inline-flex',
      background: 'rgba(6,8,12,0.6)',
      border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: 8,
      padding: 4,
    }}>
      <div style={{
        position: 'absolute',
        top: 4,
        left: value === 'shares' ? 4 : 'calc(50% + 0px)',
        width: 'calc(50% - 4px)',
        bottom: 4,
        background: SURFACE_TOP,
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 6,
        boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
        transition: 'left 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.15)',
      }} />
      {(['shares', 'options'] as Instrument[]).map(opt => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
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
            color: value === opt ? TEXT_BASE : LABEL,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            transition: 'color 0.2s ease',
          }}
        >
          {opt === 'shares' ? 'Shares' : 'Options'}
        </button>
      ))}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────

export function PositionSizeContent({ onBack }: { onBack: () => void }) {
  const [accountSize, setAccountSize] = useState(50000);
  const [riskPct, setRiskPct]         = useState(1);
  const [instrument, setInstrument]   = useState<Instrument>('shares');
  const [entry, setEntry]             = useState(50);
  const [stop, setStop]               = useState(48);
  const [size, setSize]               = useState(250);

  const multiplier      = instrument === 'options' ? 100 : 1;
  const unitsWordPlural = instrument === 'options' ? 'contracts' : 'shares';

  // Math — pure functions of inputs.
  const maxRisk      = accountSize * (riskPct / 100);
  const priceRisk    = entry - stop;
  const perUnitLoss  = priceRisk * multiplier;
  const riskPerTrade = size * perUnitLoss;
  const pctOfAccount = accountSize > 0 ? (riskPerTrade / accountSize) * 100 : 0;
  const positionCost = size * entry * multiplier;

  // Two distinct alarm states.
  //   badStop:    stop ≥ entry — R math is undefined, block the readout.
  //   overBudget: size puts more $ at risk than the account allows — warn
  //               but keep everything visible so the trader can see how
  //               much they'd need to drop size to fit.
  const badStop    = priceRisk <= 0;
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

        {/* ─── Card 1: Account Setup ──────────────────────────────── */}
        <section style={{ ...cardSurface, padding: 32 }}>
          <CardHeader icon={Wallet} title="Account Setup" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            <FieldGroup label="Account size">
              <NumInput value={accountSize} onChange={setAccountSize} prefix="$" />
            </FieldGroup>
            <FieldGroup label="Risk %">
              <NumInput value={riskPct} onChange={setRiskPct} suffix="%" />
            </FieldGroup>
            <FieldGroup label="Max risk">
              <ReadOnlyField value={fmtD2(maxRisk).slice(1)} prefix="$" />
            </FieldGroup>
          </div>
        </section>

        {/* ─── Card 2: Trade Setup ────────────────────────────────── */}
        <section style={{ ...cardSurface, padding: 32 }}>
          <CardHeader icon={Crosshair} title="Trade Setup" />

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
            <InstrumentToggle value={instrument} onChange={setInstrument} />
            {instrument === 'options' && (
              <div style={{
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
              }}>
                <Info size={14} color={LABEL} />
                1 contract = 100 shares
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            <FieldGroup label={`Number of ${unitsWordPlural}`}>
              <NumInput value={size} onChange={setSize} decimals={0} />
            </FieldGroup>
            <FieldGroup label="Entry price">
              <NumInput value={entry} onChange={setEntry} prefix="$" />
            </FieldGroup>
            <FieldGroup label="Stop price">
              <NumInput value={stop} onChange={setStop} prefix="$" />
            </FieldGroup>
          </div>

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
                  Stop price must be below entry
                </div>
                <div style={{
                  fontFamily: fm,
                  fontSize: 13,
                  color: TEXT_MUTED,
                  lineHeight: 1.5,
                  maxWidth: 580,
                }}>
                  For a long position, the stop must be lower than the entry. Adjust your inputs.
                </div>
              </div>
            </div>
          ) : (
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
                  <span style={labelStyle}>Position cost</span>
                  <span style={{ fontFamily: fm, fontSize: 24, color: TEXT_BASE, fontWeight: 500 }}>
                    {fmtD2(positionCost)}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={labelStyle}>Stop distance</span>
                  <span style={{ fontFamily: fm, fontSize: 22, color: TEXT_BASE, fontWeight: 500 }}>
                    {fmtD2(priceRisk)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ─── Card 4: Exit Target Ladder ─────────────────────────── */}
        <section style={cardSurface}>
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
            <div style={{ ...labelStyle, textAlign: 'right' }}>Sell price</div>
            <div style={{ ...labelStyle, textAlign: 'right' }}>Gross profit</div>
          </div>

          <div>
            {RTARGETS.map((r, i) => {
              const sellPrice  = badStop ? null : entry + r * priceRisk;
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
                    {sellPrice !== null ? fmtD2(sellPrice) : '—'}
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
