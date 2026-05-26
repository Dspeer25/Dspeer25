'use client';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer,
} from 'recharts';
import { fm, teal } from './shared';
import { ToolPageShell } from './ToolsContent';

// ─── Module-scope helpers ─────────────────────────────────────────────

// Mulberry32 — deterministic 32-bit PRNG. Same seed → same sequence,
// so the chart no longer flickers on every input change.
function mulberry32(seed: number) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Hash inputs into a deterministic 32-bit seed.
function hashInputs(...nums: number[]): number {
  let h = 0x811c9dc5;
  for (const n of nums) {
    const buf = new Float64Array([n]);
    const bytes = new Uint8Array(buf.buffer);
    for (let i = 0; i < bytes.length; i++) {
      h ^= bytes[i];
      h = Math.imul(h, 0x01000193);
    }
  }
  return h >>> 0;
}

function riskAmt(balance: number, frac: number, cap: number | null): number {
  const r = balance * frac;
  return cap !== null ? Math.min(r, cap) : r;
}

function simulate(
  start: number, tpw: number, win: number, rratio: number,
  frac: number, withdraw: number, cap: number | null, months: number,
  rng: () => number,
): number[] {
  let bal = start;
  const balances = [bal];
  const wrate = win / 100;
  const tpm = Math.round(tpw * 4.33);
  for (let m = 1; m <= months; m++) {
    for (let t = 0; t < tpm; t++) {
      const r = riskAmt(bal, frac, cap);
      bal += rng() < wrate ? r * rratio : -r;
      if (bal < 0) bal = 0;
    }
    bal -= withdraw;
    if (bal < 0) bal = 0;
    balances.push(bal);
  }
  return balances;
}

// Monte Carlo run count. 500 is enough to smooth out the average curve
// without making slider drags or chart pans feel sluggish.
const RUNS = 500;

// S&P 500 long-run nominal CAGR used for the comparison line. Applied as
// startBal * pow(SP500_ANNUAL_GROWTH, i / 12) so 1.08 means 8% per year,
// not per month.
const SP500_ANNUAL_GROWTH = 1.08;

function avgSims(
  start: number, tpw: number, win: number, rratio: number,
  frac: number, withdraw: number, cap: number | null, months: number,
  target: number, seed: number,
): { balances: number[]; monthHit: number | null } {
  const rng = mulberry32(seed);
  const sums = Array(months + 1).fill(0);
  for (let run = 0; run < RUNS; run++) {
    simulate(start, tpw, win, rratio, frac, withdraw, cap, months, rng)
      .forEach((b, i) => { sums[i] += b; });
  }
  const balances = sums.map(s => s / RUNS);
  const monthHit = balances.reduce(
    (found: number | null, b, i) =>
      found !== null ? found : (b >= target && i > 0 ? i : null),
    null,
  );
  return { balances, monthHit };
}

function fmtK(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `$${Math.round(v / 1000)}k`;
  return `$${Math.round(v)}`;
}

function fmtD(v: number): string {
  return '$' + Math.round(v).toLocaleString();
}

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

// Tooltip explanations — collected here so the JSX stays readable.
const TT = {
  startBal:        'Cash in your trading account at the start of the simulation.',
  tradesPerWeek:   'How many trades you take in an average week. Multiplied by 4.33 to get the monthly count.',
  winRate:         'Percent of your trades that close in profit.',
  rr:              'Reward-to-risk ratio. 1.5 means winning trades make 1.5x the dollar amount you risked.',
  riskPct:         'Fraction of your account balance you risk on each trade.',
  riskCap:         'Hard ceiling on the dollar risk per trade. Once your % of balance would exceed this, the cap takes over and risk stops scaling with balance.',
  monthlyWithdraw: 'Money you pull out of the account each month for living expenses or savings.',
  target:          'The account size you are aiming for. Drives the "Month hit" stat and the red dashed line on the chart.',
  weeklyWithdraw:  'Monthly withdrawal divided by 4.33. Used to compute net weekly P/L.',
  grossWeekly:     'Expected weekly profit before withdrawals. Win rate x R:R x trades per week x dollar risk.',
  monthHit:        'First month the average simulated balance reaches your target, with the dollar risk cap enforced.',
  finalBal:        'Average simulated balance at the end of the selected horizon, with the dollar risk cap enforced.',
  totalWithdrawn:  'Cumulative withdrawals across the whole simulation horizon.',
  avgWin:          'Dollar profit on a typical winning trade at the starting balance. Equals risk x R:R.',
  avgLoss:         'Dollar loss on a typical losing trade. Equals the dollar risk amount.',
  netWeekly:       'Weekly P/L at the starting balance after subtracting weekly withdrawals.',
  legendCapped:    'The realistic curve. Risk grows with balance until your dollar cap is hit, then locks at the cap.',
  legendUncapped:  'Hypothetical curve assuming no dollar cap on risk — risk keeps scaling with balance forever. Shows what the cap is costing you.',
  legendTarget:    'Your target balance. The chart\'s red dashed line marks this level.',
  legendSP:        'Hypothetical growth of your starting balance invested in the S&P 500 at the long-run nominal CAGR (~8%).',
};

// ─── Slider + readout + target-input cells ───────────────────────────

function SimSlider({ label, value, min, max, step, display, onChange, tooltip }: {
  label: string; value: number; min: number; max: number; step: number;
  display: string; onChange: (v: number) => void; tooltip: string;
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
        fontFamily: fm, fontSize: 18, fontWeight: 500, color: '#e0e0e0',
        textAlign: 'center',
      }}>
        {display}
      </div>
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width: '100%', accentColor: teal, cursor: 'pointer' }}
      />
    </div>
  );
}

function SimReadout({ label, value, color = '#e0e0e0', tooltip }: {
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
      {/* Spacer to align baseline with slider rows */}
      <div style={{ height: 22 }} />
    </div>
  );
}

function TargetInput({ value, onChange, tooltip }: {
  value: number; onChange: (v: number) => void; tooltip: string;
}) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState(String(value));

  const display = focused ? draft : '$' + value.toLocaleString();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{
        fontFamily: fm, fontSize: 13, color: '#9da0a8',
        textTransform: 'uppercase', letterSpacing: 0.5,
        textAlign: 'center',
      }}>
        <WithTooltip text={tooltip}>Target balance</WithTooltip>
      </div>
      <input
        type="text"
        inputMode="numeric"
        value={display}
        onFocus={() => { setFocused(true); setDraft(String(value)); }}
        onBlur={() => {
          setFocused(false);
          const n = parseInt(draft.replace(/[^0-9]/g, ''), 10);
          if (!isNaN(n) && n > 0) onChange(n);
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
      {/* Spacer to align baseline with slider rows */}
      <div style={{ height: 18 }} />
    </div>
  );
}

// State carried during a chart drag — captured at mouse-down so each
// move event can compute domains relative to the drag's starting point.
interface DragState {
  zone: 'plot' | 'x-axis' | 'y-left' | 'y-right';
  startClientX: number;
  startClientY: number;
  plotW: number;
  plotH: number;
  startXDomain:      [number, number];
  startYLeftDomain:  [number, number];
  startYRightDomain: [number, number];
}

// Wrap each slider/readout cell to add a thin separator border between
// columns. Uses index + column count to figure out which cells are at
// the right edge and shouldn't carry the separator.
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

// ─── Main component ─────────────────────────────────────────────────

export function GrowthSimulatorContent({ onBack }: { onBack: () => void }) {
  const [startBal, setStartBal]               = useState(50000);
  const [tradesPerWeek, setTradesPerWeek]     = useState(10);
  const [winRate, setWinRate]                 = useState(55);
  const [rr, setRr]                           = useState(1.5);
  const [riskPct, setRiskPct]                 = useState(1);
  const [riskCap, setRiskCap]                 = useState(650);
  const [monthlyWithdraw, setMonthlyWithdraw] = useState(4000);
  const [target, setTarget]                   = useState(100000);
  const [chartMonths, setChartMonths]         = useState(24);

  const riskFrac = riskPct / 100;
  const wr       = winRate / 100;

  // Snapshot derived math at starting balance
  const r              = riskAmt(startBal, riskFrac, riskCap);
  const avgWin         = r * rr;
  const avgLoss        = r;
  const expectDollar   = wr * avgWin - (1 - wr) * avgLoss;
  const expectR        = wr * rr - (1 - wr);
  const grossMonthly   = expectDollar * tradesPerWeek * 4.33;
  const weeklyWithdraw = monthlyWithdraw / 4.33;
  const grossWeekly    = expectDollar * tradesPerWeek;
  const netWeekly      = grossWeekly - weeklyWithdraw;
  const capKicksBal    = riskCap / riskFrac;

  // Simulation state, debounced & deterministic
  const [cappedSim, setCappedSim]     = useState<{ balances: number[]; monthHit: number | null }>({ balances: [], monthHit: null });
  const [uncappedSim, setUncappedSim] = useState<{ balances: number[]; monthHit: number | null }>({ balances: [], monthHit: null });
  const simTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (simTimer.current) clearTimeout(simTimer.current);
    simTimer.current = setTimeout(() => {
      const seed = hashInputs(
        startBal, tradesPerWeek, winRate, rr, riskFrac,
        monthlyWithdraw, riskCap, target, chartMonths,
      );
      const c = avgSims(startBal, tradesPerWeek, winRate, rr, riskFrac, monthlyWithdraw, riskCap, chartMonths, target, seed);
      const u = avgSims(startBal, tradesPerWeek, winRate, rr, riskFrac, monthlyWithdraw, null,    chartMonths, target, seed);
      setCappedSim(c);
      setUncappedSim(u);
    }, 150);
    return () => { if (simTimer.current) clearTimeout(simTimer.current); };
  }, [startBal, tradesPerWeek, winRate, rr, riskFrac, monthlyWithdraw, riskCap, target, chartMonths]);

  const chartData = useMemo(() => {
    const months = Math.min(cappedSim.balances.length, uncappedSim.balances.length);
    const showSP = chartMonths >= 60;
    return Array.from({ length: months }, (_, i) => ({
      month: i,
      capped:   cappedSim.balances[i],
      uncapped: uncappedSim.balances[i],
      sp: showSP ? startBal * Math.pow(SP500_ANNUAL_GROWTH, i / 12) : undefined,
    }));
  }, [cappedSim, uncappedSim, chartMonths, startBal]);

  const finalBal       = cappedSim.balances[cappedSim.balances.length - 1] ?? 0;
  const totalWithdrawn = chartMonths * monthlyWithdraw;

  // ─── Chart zoom + pan via drag ──────────────────────────────────
  // null domain → recharts auto-scales. Once the user drags, we
  // commit to explicit domains and feed them to the axes.
  const [xDomain, setXDomain]           = useState<[number, number] | null>(null);
  const [yLeftDomain, setYLeftDomain]   = useState<[number, number] | null>(null);
  const [yRightDomain, setYRightDomain] = useState<[number, number] | null>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);

  // Auto-domain accessors used as the snapshot when a drag starts and
  // the user hadn't yet zoomed.
  const autoXDomain = (): [number, number] => [0, chartMonths];
  const autoYLeftDomain = (): [number, number] => {
    const max = Math.max(...(cappedSim.balances.length ? cappedSim.balances : [0]), target) * 1.12;
    return [0, max];
  };
  const autoYRightDomain = (): [number, number] => {
    const max = Math.max(...(uncappedSim.balances.length ? uncappedSim.balances : [0]), target) * 1.12;
    return [0, max];
  };

  // Window-level mouse listeners so drag continues even if the cursor
  // leaves the chart container. Refs (dragRef) keep the closure stable
  // — no need to depend on state values that would re-bind listeners.
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const dx = e.clientX - drag.startClientX;
      const dy = e.clientY - drag.startClientY;
      if (drag.zone === 'plot') {
        // Pan both axes — the chart follows the cursor (grab gesture).
        const xRange  = drag.startXDomain[1] - drag.startXDomain[0];
        const yLRange = drag.startYLeftDomain[1] - drag.startYLeftDomain[0];
        const yRRange = drag.startYRightDomain[1] - drag.startYRightDomain[0];
        const xShift  = -dx * (xRange  / drag.plotW);
        const yLShift =  dy * (yLRange / drag.plotH);
        const yRShift =  dy * (yRRange / drag.plotH);
        setXDomain(     [drag.startXDomain[0]      + xShift,  drag.startXDomain[1]      + xShift]);
        setYLeftDomain( [drag.startYLeftDomain[0]  + yLShift, drag.startYLeftDomain[1]  + yLShift]);
        setYRightDomain([drag.startYRightDomain[0] + yRShift, drag.startYRightDomain[1] + yRShift]);
      } else if (drag.zone === 'x-axis') {
        // Drag right on x-axis → zoom in x (shrink visible range).
        const factor = Math.max(0.1, 1 - dx / drag.plotW);
        const center = (drag.startXDomain[0] + drag.startXDomain[1]) / 2;
        const newRange = (drag.startXDomain[1] - drag.startXDomain[0]) * factor;
        setXDomain([center - newRange / 2, center + newRange / 2]);
      } else if (drag.zone === 'y-left') {
        // Drag up on y-axis → zoom in y.
        const factor = Math.max(0.1, 1 + dy / drag.plotH);
        const center = (drag.startYLeftDomain[0] + drag.startYLeftDomain[1]) / 2;
        const newRange = (drag.startYLeftDomain[1] - drag.startYLeftDomain[0]) * factor;
        setYLeftDomain([Math.max(0, center - newRange / 2), center + newRange / 2]);
      } else if (drag.zone === 'y-right') {
        const factor = Math.max(0.1, 1 + dy / drag.plotH);
        const center = (drag.startYRightDomain[0] + drag.startYRightDomain[1]) / 2;
        const newRange = (drag.startYRightDomain[1] - drag.startYRightDomain[0]) * factor;
        setYRightDomain([Math.max(0, center - newRange / 2), center + newRange / 2]);
      }
    };
    const onUp = () => { dragRef.current = null; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  // Reset zoom when the user picks a new simulation horizon —
  // otherwise the previous zoom would clip an unrelated time range.
  useEffect(() => {
    setXDomain(null);
    setYLeftDomain(null);
    setYRightDomain(null);
  }, [chartMonths]);

  const onChartMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !chartContainerRef.current) return;
    const rect = chartContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // Approximate Recharts plot area boundaries (recharts default
    // YAxis width = 60, XAxis height = 30, our top margin = 12,
    // outer container padding = 14).
    const padding = 14;
    const yAxisW = 60;
    const xAxisH = 30;
    const plotLeft   = padding + yAxisW;
    const plotRight  = rect.width  - padding - yAxisW;
    const plotTop    = padding + 12;
    const plotBottom = rect.height - padding - xAxisH;
    let zone: DragState['zone'];
    if (y > plotBottom)      zone = 'x-axis';
    else if (x < plotLeft)   zone = 'y-left';
    else if (x > plotRight)  zone = 'y-right';
    else                      zone = 'plot';
    dragRef.current = {
      zone,
      startClientX: e.clientX,
      startClientY: e.clientY,
      plotW: plotRight - plotLeft,
      plotH: plotBottom - plotTop,
      startXDomain:      xDomain      ?? autoXDomain(),
      startYLeftDomain:  yLeftDomain  ?? autoYLeftDomain(),
      startYRightDomain: yRightDomain ?? autoYRightDomain(),
    };
    e.preventDefault();
  };

  const onChartDoubleClick = () => {
    setXDomain(null);
    setYLeftDomain(null);
    setYRightDomain(null);
  };

  const xTicks = useMemo(() => {
    const interval = chartMonths <= 12 ? 2 : chartMonths <= 24 ? 4 : chartMonths <= 36 ? 6 : 12;
    const ticks: number[] = [];
    for (let i = 0; i <= chartMonths; i += interval) ticks.push(i);
    return ticks;
  }, [chartMonths]);

  return (
    <ToolPageShell title="Growth Simulator" onBack={onBack}>
      {/* Sliders + auto displays — gap-0 column so the separator borders sit cleanly between cells */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '28px 0',
      }}>
        {[
          <SimSlider key="0" label="Starting balance"   value={startBal}        min={10000} max={100000} step={1000}
            display={fmtD(startBal)} onChange={setStartBal} tooltip={TT.startBal} />,
          <SimSlider key="1" label="Trades per week"    value={tradesPerWeek}   min={1}     max={30}     step={1}
            display={String(tradesPerWeek)} onChange={setTradesPerWeek} tooltip={TT.tradesPerWeek} />,
          <SimSlider key="2" label="Win rate (%)"       value={winRate}         min={0.01}  max={75}     step={0.01}
            display={winRate.toFixed(2) + '%'} onChange={setWinRate} tooltip={TT.winRate} />,
          <SimSlider key="3" label="Avg R:R ratio"      value={rr}              min={0.01}  max={4}      step={0.01}
            display={rr.toFixed(2)} onChange={setRr} tooltip={TT.rr} />,
          <SimSlider key="4" label="Risk per trade (%)" value={riskPct}         min={0.001} max={3}      step={0.001}
            display={riskPct.toFixed(3) + '%'} onChange={setRiskPct} tooltip={TT.riskPct} />,
          <SimSlider key="5" label="Risk cap ($)"       value={riskCap}         min={1}     max={2000}   step={1}
            display={fmtD(riskCap)} onChange={setRiskCap} tooltip={TT.riskCap} />,
          <SimSlider key="6" label="Monthly withdrawal" value={monthlyWithdraw} min={0}     max={8000}   step={1}
            display={fmtD(monthlyWithdraw)} onChange={setMonthlyWithdraw} tooltip={TT.monthlyWithdraw} />,
          <TargetInput key="7" value={target} onChange={setTarget} tooltip={TT.target} />,
          <SimReadout key="8" label="Weekly withdrawal (auto)"
            value={`≈ ${fmtD(weeklyWithdraw)} / week`} color="#9da0a8" tooltip={TT.weeklyWithdraw} />,
          <SimReadout key="9" label="Est. Gross P/L (week)"
            value={(grossWeekly >= 0 ? '+' : '') + fmtD(grossWeekly)}
            color={grossWeekly >= 0 ? teal : '#ff4444'} tooltip={TT.grossWeekly} />,
        ].map((cell, i) => (
          <GridCell key={i} index={i} cols={5}>{cell}</GridCell>
        ))}
      </div>

      {/* Cap info */}
      <div style={{
        marginTop: 20,
        fontFamily: fm, fontSize: 14, color: '#9da0a8',
      }}>
        Risk scales until {fmtD(capKicksBal)} — then locks at {fmtD(riskCap)} per trade.
      </div>

      {/* Stat cards */}
      <div style={{
        marginTop: 24,
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: 14,
      }}>
        {[
          {
            label: `Month hit ${fmtK(target)}\n(capped)`,
            main: cappedSim.monthHit !== null ? `Mo ${cappedSim.monthHit}` : '—',
            sub: null,
            color: '#e0e0e0',
            tooltip: TT.monthHit,
          },
          {
            label: `Balance at ${chartMonths}mo\n(capped)`,
            main: fmtD(finalBal),
            sub: null,
            color: '#e0e0e0',
            tooltip: TT.finalBal,
          },
          {
            label: 'Total withdrawn',
            main: fmtD(totalWithdrawn),
            sub: `over ${chartMonths} months`,
            color: '#e0e0e0',
            tooltip: TT.totalWithdrawn,
          },
          {
            label: 'Avg win / trade',
            main: fmtD(avgWin),
            sub: `Expect: ${fmtD(expectDollar)}/trade`,
            color: '#e0e0e0',
            tooltip: TT.avgWin,
          },
          {
            label: 'Avg loss / trade',
            main: fmtD(avgLoss),
            sub: `+${expectR.toFixed(3)}R expectancy`,
            color: '#e0e0e0',
            tooltip: TT.avgLoss,
          },
          {
            label: 'Net weekly (start bal)',
            main: fmtD(netWeekly),
            sub: `Gross mo: ${fmtD(grossMonthly)}`,
            color: netWeekly >= 0 ? teal : '#ff4444',
            tooltip: TT.netWeekly,
          },
        ].map((c, i) => (
          <div key={i} style={{
            background: '#13141a',
            border: '1px solid #1a1b22',
            borderRadius: 10,
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}>
            <div style={{
              fontFamily: fm, fontSize: 12, color: '#9da0a8',
              lineHeight: 1.35, whiteSpace: 'pre-line',
              textTransform: 'uppercase', letterSpacing: 0.5,
            }}>
              <WithTooltip text={c.tooltip}>{c.label}</WithTooltip>
            </div>
            <div style={{
              fontFamily: fm, fontSize: 19, fontWeight: 500, color: c.color,
            }}>
              {c.main}
            </div>
            {c.sub && (
              <div style={{ fontFamily: fm, fontSize: 12, color: '#888' }}>
                {c.sub}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Range toggle */}
      <div style={{ marginTop: 28, display: 'flex', gap: 8 }}>
        {[
          { months: 12, label: '1 Year' },
          { months: 24, label: '2 Years' },
          { months: 36, label: '3 Years' },
          { months: 60, label: '5 Years' },
        ].map(opt => {
          const active = chartMonths === opt.months;
          return (
            <button
              key={opt.months}
              onClick={() => setChartMonths(opt.months)}
              style={{
                fontFamily: fm,
                fontSize: 13,
                fontWeight: 500,
                padding: '8px 18px',
                borderRadius: 6,
                background: active ? '#1a1b22' : 'transparent',
                border: `1px solid ${active ? teal : '#1a1b22'}`,
                color: active ? '#e0e0e0' : '#9da0a8',
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                transition: 'border-color 0.15s ease, background 0.15s ease, color 0.15s ease',
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{
        marginTop: 16,
        display: 'flex', gap: 24, flexWrap: 'wrap',
        fontFamily: fm, fontSize: 13, color: '#9da0a8',
      }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 14, height: 14, borderRadius: 2, background: teal, display: 'inline-block', flexShrink: 0 }} />
          <WithTooltip text={TT.legendCapped}>Capped (left axis)</WithTooltip>
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 14, height: 14, borderRadius: 2, background: '#4a9eff', display: 'inline-block', flexShrink: 0 }} />
          <WithTooltip text={TT.legendUncapped}>No cap (right axis)</WithTooltip>
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 14, height: 14, borderRadius: 2, background: '#ff4444', display: 'inline-block', flexShrink: 0 }} />
          <WithTooltip text={TT.legendTarget}>{fmtK(target)} target</WithTooltip>
        </span>
        {chartMonths >= 60 && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 14, height: 14, borderRadius: 2, background: '#f59e0b', display: 'inline-block', flexShrink: 0 }} />
            <WithTooltip text={TT.legendSP}>S&amp;P 500 @ 8%/yr</WithTooltip>
          </span>
        )}
      </div>

      {/* Chart — drag to pan/zoom, double-click to reset */}
      <div
        ref={chartContainerRef}
        onMouseDown={onChartMouseDown}
        onDoubleClick={onChartDoubleClick}
        style={{
          position: 'relative',
          marginTop: 16,
          height: 420,
          border: '1px solid #1a1b22',
          borderRadius: 12,
          background: '#13141a',
          padding: 14,
          userSelect: 'none',
          cursor: 'grab',
        }}
      >
        {/* Drag affordance icons — non-interactive hints that the axes are draggable */}
        <div style={{
          position: 'absolute', left: 2, top: '50%', transform: 'translateY(-50%)',
          color: '#666', pointerEvents: 'none', zIndex: 2,
        }} aria-hidden>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none"
               stroke="currentColor" strokeWidth={1.75}
               strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v18M8 7l4-4 4 4M8 17l4 4 4-4" />
          </svg>
        </div>
        <div style={{
          position: 'absolute', right: 2, top: '50%', transform: 'translateY(-50%)',
          color: '#666', pointerEvents: 'none', zIndex: 2,
        }} aria-hidden>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none"
               stroke="currentColor" strokeWidth={1.75}
               strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v18M8 7l4-4 4 4M8 17l4 4 4-4" />
          </svg>
        </div>
        <div style={{
          position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)',
          color: '#666', pointerEvents: 'none', zIndex: 2,
        }} aria-hidden>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none"
               stroke="currentColor" strokeWidth={1.75}
               strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12h18M7 8l-4 4 4 4M17 8l4 4-4 4" />
          </svg>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 12, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid stroke="rgba(26,27,34,0.4)" vertical={false} />
            <XAxis
              dataKey="month"
              type="number"
              domain={xDomain ?? autoXDomain()}
              allowDataOverflow
              ticks={xTicks}
              stroke="#1a1b22"
              tick={{ fill: '#888', fontSize: 12, fontFamily: fm }}
              tickFormatter={(m: number) => m === 0 ? 'Start' : `Mo ${m}`}
            />
            <YAxis
              yAxisId="left"
              domain={yLeftDomain ?? autoYLeftDomain()}
              allowDataOverflow
              stroke="#1a1b22"
              tick={{ fill: teal, fontSize: 12, fontFamily: fm }}
              tickFormatter={fmtK}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={yRightDomain ?? autoYRightDomain()}
              allowDataOverflow
              stroke="#1a1b22"
              tick={{ fill: '#4a9eff', fontSize: 12, fontFamily: fm }}
              tickFormatter={fmtK}
            />
            <Tooltip
              contentStyle={{
                background: '#0e0f14',
                border: '1px solid #2a2c34',
                borderRadius: 6,
                fontFamily: fm,
                fontSize: 13,
              }}
              labelStyle={{ color: '#9da0a8' }}
              itemStyle={{ color: '#e0e0e0' }}
              labelFormatter={(m: number) => m === 0 ? 'Start' : `Month ${m}`}
              formatter={(v: number) => fmtD(v)}
            />
            <ReferenceLine
              yAxisId="left"
              y={target}
              stroke="#ff4444"
              strokeOpacity={0.5}
              strokeDasharray="6 4"
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="capped"
              name="Capped"
              stroke={teal}
              strokeWidth={2.5}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="uncapped"
              name="No cap"
              stroke="#4a9eff"
              strokeWidth={2}
              strokeDasharray="8 4"
              dot={false}
              isAnimationActive={false}
            />
            {chartMonths >= 60 && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="sp"
                name="S&P 500"
                stroke="#f59e0b"
                strokeWidth={1.5}
                strokeDasharray="6 4"
                dot={false}
                isAnimationActive={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Chart drag hint */}
      <div style={{
        marginTop: 10,
        fontFamily: fm, fontSize: 12, color: '#888',
        textAlign: 'center',
      }}>
        Drag inside chart to pan · drag x-axis to zoom time · drag y-axis to zoom balance · double-click to reset
      </div>
    </ToolPageShell>
  );
}
