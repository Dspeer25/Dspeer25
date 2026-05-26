'use client';
import React, { useState } from 'react';
import { fm, teal } from './shared';
import { ToolPageShell } from './ToolsContent';

// ─── Hover tooltip ───────────────────────────────────────────────────

function WithTooltip({ children, text }: { children: React.ReactNode; text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      style={{
        position: 'relative',
        display: 'inline-block',
        cursor: 'help',
        borderBottom: '1px dotted rgba(122,125,133,0.45)',
        paddingBottom: 1,
      }}
    >
      {children}
      {show && (
        <span style={{
          position: 'absolute',
          bottom: 'calc(100% + 8px)',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#0e0f14',
          border: '1px solid #2a2c34',
          borderRadius: 6,
          padding: '8px 12px',
          fontFamily: fm,
          fontSize: 12,
          fontWeight: 400,
          color: '#e0e0e0',
          width: 'max-content',
          maxWidth: 280,
          lineHeight: 1.5,
          whiteSpace: 'normal',
          textAlign: 'left',
          textTransform: 'none',
          letterSpacing: 0,
          zIndex: 100,
          pointerEvents: 'none',
          boxShadow: '0 6px 20px rgba(0,0,0,0.6)',
        }}>
          {text}
        </span>
      )}
    </span>
  );
}

// Wrap each cell to add a thin separator border between columns.
function GridCell({ index, cols, children }: { index: number; cols: number; children: React.ReactNode }) {
  const isRightEdge = (index + 1) % cols === 0;
  const isLeftEdge  = index % cols === 0;
  return (
    <div style={{
      borderRight: isRightEdge ? 'none' : '1px solid rgba(40,42,50,0.7)',
      paddingLeft:  isLeftEdge  ? 0 : 16,
      paddingRight: isRightEdge ? 0 : 16,
    }}>
      {children}
    </div>
  );
}

// ─── Number input — typed text with formatted blur display ───────────

function NumberInput({
  label, value, onChange, tooltip,
  prefix = '', suffix = '', decimals = 0, min = 0,
}: {
  label: string; value: number; onChange: (v: number) => void;
  tooltip: string; prefix?: string; suffix?: string;
  decimals?: number; min?: number;
}) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState('');

  const formatted = decimals > 0
    ? value.toFixed(decimals).replace(/\B(?=(\d{3})+(?=\.))/g, ',')
    : value.toLocaleString();
  const display = focused ? draft : prefix + formatted + suffix;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{
        fontFamily: fm, fontSize: 13, color: '#9da0a8',
        textTransform: 'uppercase', letterSpacing: 0.5,
        textAlign: 'center',
      }}>
        <WithTooltip text={tooltip}>{label}</WithTooltip>
      </div>
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
          background: 'transparent',
          border: 'none',
          borderBottom: '1px solid #2a2c34',
          color: '#e0e0e0',
          fontFamily: fm,
          fontSize: 18,
          fontWeight: 500,
          outline: 'none',
          padding: '0 0 4px 0',
          width: '100%',
          textAlign: 'center',
        }}
      />
    </div>
  );
}

// ─── Read-only display ───────────────────────────────────────────────

function Readout({ label, value, color = '#e0e0e0', tooltip }: {
  label: string; value: string; color?: string; tooltip: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{
        fontFamily: fm, fontSize: 13, color: '#9da0a8',
        textTransform: 'uppercase', letterSpacing: 0.5,
        textAlign: 'center',
      }}>
        <WithTooltip text={tooltip}>{label}</WithTooltip>
      </div>
      <div style={{
        fontFamily: fm, fontSize: 18, fontWeight: 500, color,
        textAlign: 'center',
      }}>
        {value}
      </div>
    </div>
  );
}

// ─── Tooltip strings ─────────────────────────────────────────────────

const TT = {
  accountSize:   'Total cash available in your trading account.',
  riskPct:       'Maximum percent of your account you are willing to lose on any single trade.',
  maxRisk:       'Account size times your risk percentage. Your total dollar loss budget for any one trade.',
  numShares:     'How many shares of the stock you are buying.',
  sharesEntry:   'The price per share you are paying to enter the trade.',
  sharesStop:    'The price per share where you would exit a losing trade. For longs this should be below your entry.',
  sharesRisk:    'Total dollars at risk = shares × (entry − stop). Green when within your account risk limit, red when over.',
  sharesPct:     'What percent of your account this trade puts at risk. Compare to the percent you set above.',
  sharesCost:    'Cash deployed to enter the position = shares × entry price. Different from risk.',
  numContracts:  'How many derivative contracts you are buying.',
  contractEntry: 'Price per contract you pay to enter.',
  contractStop:  'Price per contract where you would exit a losing trade.',
  multiplier:    'Contract multiplier. 100 for standard equity options. Futures vary (e.g. 50 for ES, 20 for NQ).',
  contractRisk:  'Total dollars at risk = contracts × (entry − stop) × multiplier. Green when within your account risk limit, red when over.',
  contractPct:   'What percent of your account this trade puts at risk.',
  contractCost:  'Cash deployed = contracts × entry × multiplier.',
  exitTargets:   'Sell prices that would make you 1.5R, 2R, 2.5R, etc. of your initial risk. 1R = the dollar distance from entry to stop.',
};

const RTARGETS = [1.5, 2, 2.5, 3, 3.5, 4] as const;

function fmtD2(v: number): string {
  return '$' + v.toFixed(2).replace(/\B(?=(\d{3})+(?=\.))/g, ',');
}

// ─── Section title for each calc panel ───────────────────────────────

function CalcPanelTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: fm,
      fontSize: 14,
      fontWeight: 600,
      color: '#e0e0e0',
      textTransform: 'uppercase',
      letterSpacing: 1.5,
      textAlign: 'center',
      paddingBottom: 14,
      borderBottom: '1px solid rgba(40,42,50,0.7)',
    }}>
      {children}
    </div>
  );
}

// ─── Risk display block ──────────────────────────────────────────────

function RiskDisplay({ totalRisk, pctOfAccount, positionCost, overBudget, riskTooltip, pctTooltip, costTooltip }: {
  totalRisk: number;
  pctOfAccount: number;
  positionCost: number;
  overBudget: boolean;
  riskTooltip: string;
  pctTooltip: string;
  costTooltip: string;
}) {
  const accent = overBudget ? '#ff4444' : teal;
  const rowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };
  const labelStyle: React.CSSProperties = {
    fontFamily: fm, fontSize: 13, color: '#9da0a8',
    textTransform: 'uppercase', letterSpacing: 0.5,
  };

  return (
    <div style={{
      marginTop: 28,
      background: '#13141a',
      border: `1px solid ${overBudget ? 'rgba(255,68,68,0.35)' : '#1a1b22'}`,
      borderRadius: 10,
      padding: '18px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
    }}>
      <div style={rowStyle}>
        <span style={labelStyle}>
          <WithTooltip text={riskTooltip}>Risk per trade</WithTooltip>
        </span>
        <span style={{ fontFamily: fm, fontSize: 22, fontWeight: 500, color: accent }}>
          {fmtD2(totalRisk)}
        </span>
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>
          <WithTooltip text={pctTooltip}>% of account</WithTooltip>
        </span>
        <span style={{ fontFamily: fm, fontSize: 18, fontWeight: 500, color: accent }}>
          {pctOfAccount.toFixed(2)}%
        </span>
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>
          <WithTooltip text={costTooltip}>Position cost</WithTooltip>
        </span>
        <span style={{ fontFamily: fm, fontSize: 18, fontWeight: 500, color: '#e0e0e0' }}>
          {fmtD2(positionCost)}
        </span>
      </div>
    </div>
  );
}

// ─── Exit targets (R-multiple sell prices) ───────────────────────────

function ExitTargets({ entry, priceRisk, label }: { entry: number; priceRisk: number; label: string }) {
  return (
    <div style={{ marginTop: 28 }}>
      <div style={{
        fontFamily: fm, fontSize: 13, color: '#9da0a8',
        textTransform: 'uppercase', letterSpacing: 0.5,
        marginBottom: 12,
      }}>
        <WithTooltip text={TT.exitTargets}>{label}</WithTooltip>
      </div>
      <div style={{ display: 'grid', gap: 6 }}>
        {RTARGETS.map(r => {
          const exit = entry + r * priceRisk;
          return (
            <div key={r} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#13141a',
              border: '1px solid #1a1b22',
              borderRadius: 8,
              padding: '10px 16px',
            }}>
              <span style={{
                fontFamily: fm, fontSize: 13, fontWeight: 500, color: teal,
                letterSpacing: 0.5,
              }}>
                {r}R
              </span>
              <span style={{
                fontFamily: fm, fontSize: 16, fontWeight: 500, color: '#e0e0e0',
              }}>
                {fmtD2(exit)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────

export function PositionSizeContent({ onBack }: { onBack: () => void }) {
  // Top section
  const [accountSize, setAccountSize] = useState(50000);
  const [riskPct, setRiskPct]         = useState(1);

  // Shares calculator
  const [numShares, setNumShares]     = useState(100);
  const [sharesEntry, setSharesEntry] = useState(50);
  const [sharesStop, setSharesStop]   = useState(48);

  // Derivatives calculator
  const [numContracts, setNumContracts]   = useState(5);
  const [contractEntry, setContractEntry] = useState(1.5);
  const [contractStop, setContractStop]   = useState(1);
  const [multiplier, setMultiplier]       = useState(100);

  // Top-row math
  const maxRisk = accountSize * (riskPct / 100);

  // Shares math
  const sharesPriceRisk     = Math.max(0, sharesEntry - sharesStop);
  const sharesTotalRisk     = numShares * sharesPriceRisk;
  const sharesPositionCost  = numShares * sharesEntry;
  const sharesPctOfAccount  = accountSize > 0 ? (sharesTotalRisk / accountSize) * 100 : 0;
  const sharesOverBudget    = sharesTotalRisk > maxRisk;

  // Derivatives math
  const contractPriceRisk      = Math.max(0, contractEntry - contractStop);
  const contractTotalRisk      = numContracts * contractPriceRisk * multiplier;
  const contractPositionCost   = numContracts * contractEntry * multiplier;
  const contractPctOfAccount   = accountSize > 0 ? (contractTotalRisk / accountSize) * 100 : 0;
  const contractOverBudget     = contractTotalRisk > maxRisk;

  return (
    <ToolPageShell title="Position Size Calculator" onBack={onBack}>
      {/* Top row: account inputs + derived max risk */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '28px 0',
      }}>
        {[
          <NumberInput key="acct" label="Account size" value={accountSize}
            onChange={setAccountSize} prefix="$" tooltip={TT.accountSize} />,
          <NumberInput key="risk" label="Risk per trade (%)" value={riskPct}
            onChange={setRiskPct} suffix="%" decimals={2} tooltip={TT.riskPct} />,
          <Readout key="max" label="Max risk per trade"
            value={fmtD2(maxRisk)} tooltip={TT.maxRisk} />,
        ].map((cell, i) => <GridCell key={i} index={i} cols={3}>{cell}</GridCell>)}
      </div>

      {/* Shares (left) + Derivatives (right) */}
      <div style={{
        marginTop: 36,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 0,
      }}>
        {/* SHARES */}
        <div style={{ paddingRight: 28, borderRight: '1px solid rgba(40,42,50,0.7)' }}>
          <CalcPanelTitle>Shares</CalcPanelTitle>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 22, marginTop: 24 }}>
            <NumberInput label="Number of shares" value={numShares}
              onChange={setNumShares} tooltip={TT.numShares} />
            <NumberInput label="Entry price" value={sharesEntry}
              onChange={setSharesEntry} prefix="$" decimals={2} tooltip={TT.sharesEntry} />
            <NumberInput label="Stop price" value={sharesStop}
              onChange={setSharesStop} prefix="$" decimals={2} tooltip={TT.sharesStop} />
          </div>

          <RiskDisplay
            totalRisk={sharesTotalRisk}
            pctOfAccount={sharesPctOfAccount}
            positionCost={sharesPositionCost}
            overBudget={sharesOverBudget}
            riskTooltip={TT.sharesRisk}
            pctTooltip={TT.sharesPct}
            costTooltip={TT.sharesCost}
          />

          <ExitTargets
            entry={sharesEntry}
            priceRisk={sharesPriceRisk}
            label="Exit targets (sell price)"
          />
        </div>

        {/* DERIVATIVES */}
        <div style={{ paddingLeft: 28 }}>
          <CalcPanelTitle>Derivatives</CalcPanelTitle>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 22, marginTop: 24 }}>
            <NumberInput label="Number of contracts" value={numContracts}
              onChange={setNumContracts} tooltip={TT.numContracts} />
            <NumberInput label="Entry premium" value={contractEntry}
              onChange={setContractEntry} prefix="$" decimals={2} tooltip={TT.contractEntry} />
            <NumberInput label="Stop premium" value={contractStop}
              onChange={setContractStop} prefix="$" decimals={2} tooltip={TT.contractStop} />
            <NumberInput label="Multiplier" value={multiplier}
              onChange={setMultiplier} tooltip={TT.multiplier} />
          </div>

          <RiskDisplay
            totalRisk={contractTotalRisk}
            pctOfAccount={contractPctOfAccount}
            positionCost={contractPositionCost}
            overBudget={contractOverBudget}
            riskTooltip={TT.contractRisk}
            pctTooltip={TT.contractPct}
            costTooltip={TT.contractCost}
          />

          <ExitTargets
            entry={contractEntry}
            priceRisk={contractPriceRisk}
            label="Exit targets (sell premium)"
          />
        </div>
      </div>
    </ToolPageShell>
  );
}
