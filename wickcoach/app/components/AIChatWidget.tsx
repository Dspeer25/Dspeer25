'use client';
import React, { useRef, useEffect, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { fm, fd } from './shared';
import Logo from './Logo';

const teal = '#00d4a0';
const red = '#ff4444';

interface ChatMessage { role: 'user' | 'assistant'; content: string }

interface AIChatWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  input: string;
  setInput: (s: string) => void;
  onSend: () => void;
  loading: boolean;
  welcomeMsg?: string | null;
}

// ── Markdown helpers for the coach renderer ──────────────────────
// The coach is told to emit only bold (**x**), dash bullets, headings,
// and pipe tables. Parsing lives here so the sidebar and the expanded
// workspace share one renderer.
const MONO = "'SF Mono', ui-monospace, monospace";

function mdParseRow(line: string): string[] {
  let s = line.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|')) s = s.slice(0, -1);
  return s.split('|').map(c => c.trim());
}

// A |---|:--:|---| separator row: every cell is only dashes/colons.
function mdIsDelimiterRow(line: string): boolean {
  const t = line.trim();
  if (!t.includes('-') || !t.includes('|')) return false;
  return mdParseRow(t).every(c => /^:?-+:?$/.test(c));
}

const mdLooksLikeRow = (line: string): boolean => line.includes('|') && line.trim().length > 0;

// Numeric value of a cell like "-1,103", "$200", "1.5R", "2.3%" — or
// null when the cell is non-numeric text.
function mdNumericCell(s: string): number | null {
  const cleaned = s.replace(/[$,%\s]/g, '').replace(/r$/i, '');
  if (cleaned === '' || cleaned === '-' || cleaned === '+') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

// Inline: **bold** → teal bold, `code` → stripped.
function renderInline(content: string, keyBase: string): React.ReactNode[] {
  const cleaned = content.replace(/`([^`]+)`/g, '$1');
  return cleaned.split(/\*\*(.*?)\*\*/g).map((part, pi) =>
    pi % 2 === 1
      ? <span key={`${keyBase}-b${pi}`} style={{ color: teal, fontWeight: 700 }}>{part}</span>
      : <React.Fragment key={`${keyBase}-t${pi}`}>{part}</React.Fragment>
  );
}

// A markdown table → styled <table>: teal header, row borders, mono
// right-aligned numeric cells (red negative, teal positive).
function renderTable(header: string[], rows: string[][], key: number): React.ReactNode {
  return (
    <div key={`tbl-${key}`} style={{ overflowX: 'auto', margin: '10px 0', borderRadius: 8, border: '1px solid #1F2E25', background: '#141822' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', fontFamily: fm, fontSize: 13 }}>
        <thead>
          <tr>
            {header.map((h, hi) => (
              <th key={hi} style={{ textAlign: 'left', color: teal, fontWeight: 700, padding: '9px 12px', borderBottom: '1px solid rgba(0,212,160,0.35)', whiteSpace: 'nowrap', letterSpacing: 0.3 }}>{renderInline(h, `th-${key}-${hi}`)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {header.map((_, ci) => {
                const cell = row[ci] ?? '';
                const n = mdNumericCell(cell);
                const isNum = n !== null;
                const color = !isNum ? '#e0e0e0' : n < 0 ? '#ff4444' : n > 0 ? teal : '#e0e0e0';
                return (
                  <td key={ci} style={{ padding: '8px 12px', borderTop: ri === 0 ? 'none' : '1px solid rgba(255,255,255,0.05)', color, textAlign: isNum ? 'right' : 'left', fontFamily: isNum ? MONO : fm, whiteSpace: 'nowrap' }}>{renderInline(cell, `td-${key}-${ri}-${ci}`)}</td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Chart blocks for the coach renderer ──────────────────────────
// The coach may emit a fenced ```chart block whose body is JSON:
//   { "type": "bar"|"line"|"pie", "title": str, "valueFormat":
//     "currency"|"percent"|"r"|"number", "data": [{label, value}] }
// We parse it out and render with recharts. Malformed JSON or a bad
// shape yields null so the surrounding message still renders.
type ChartType = 'bar' | 'line' | 'pie';
type ChartValueFormat = 'currency' | 'percent' | 'r' | 'number';
interface ChartSpec {
  type: ChartType;
  title?: string;
  valueFormat: ChartValueFormat;
  data: { label: string; value: number }[];
}

function parseChartSpec(raw: string): ChartSpec | null {
  let obj: unknown;
  try {
    obj = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!obj || typeof obj !== 'object') return null;
  const o = obj as Record<string, unknown>;
  const type = o.type;
  if (type !== 'bar' && type !== 'line' && type !== 'pie') return null;
  if (!Array.isArray(o.data)) return null;
  const data = (o.data as unknown[])
    .map(d => (d && typeof d === 'object' ? (d as Record<string, unknown>) : null))
    .filter((d): d is Record<string, unknown> => d !== null)
    .filter(d => typeof d.label === 'string' && typeof d.value === 'number' && Number.isFinite(d.value))
    .map(d => ({ label: d.label as string, value: d.value as number }));
  if (data.length === 0) return null;
  const vf = o.valueFormat;
  const valueFormat: ChartValueFormat =
    vf === 'currency' || vf === 'percent' || vf === 'r' || vf === 'number' ? vf : 'number';
  return { type, title: typeof o.title === 'string' ? o.title : undefined, valueFormat, data };
}

function fmtChartValue(v: number, valueFormat: ChartValueFormat): string {
  switch (valueFormat) {
    case 'currency':
      return (v < 0 ? '-$' : '$') + Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    case 'percent':
      return v.toFixed(1) + '%';
    case 'r':
      return v.toFixed(2) + 'R';
    default:
      return v.toLocaleString('en-US');
  }
}

// Pie slices: teal for positive, red for negative, stepped opacity so
// adjacent same-sign slices stay distinguishable.
function sliceColor(value: number, i: number): string {
  const base = value < 0 ? '255,68,68' : '0,212,160';
  const op = Math.max(0.4, 1 - i * 0.13);
  return `rgba(${base},${op})`;
}

const TICK = '#a0a3ab';

function ChartTooltip(props: { active?: boolean; payload?: { value: number }[]; label?: string; valueFormat?: ChartValueFormat }) {
  const { active, payload, label, valueFormat = 'number' } = props;
  if (!active || !payload || payload.length === 0) return null;
  const v = payload[0].value;
  return (
    <div style={{ background: '#0A0E0C', border: '1px solid #1F2E25', borderRadius: 8, padding: '6px 10px', fontFamily: MONO, fontSize: 12 }}>
      {label != null && <div style={{ color: TICK, marginBottom: 2 }}>{label}</div>}
      <div style={{ color: v < 0 ? red : teal, fontWeight: 700 }}>{fmtChartValue(v, valueFormat)}</div>
    </div>
  );
}

const lineDot = (props: { cx?: number; cy?: number; payload?: { value: number }; index?: number }): React.ReactElement<SVGElement> => {
  const { cx, cy, payload, index } = props;
  if (cx == null || cy == null || !payload) return <g key={index} />;
  const c = payload.value < 0 ? red : teal;
  return <circle key={index} cx={cx} cy={cy} r={3} fill={c} stroke={c} />;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderPieLabel = (p: any): React.ReactElement => {
  const RAD = Math.PI / 180;
  const r = p.outerRadius + 16;
  const x = p.cx + r * Math.cos(-p.midAngle * RAD);
  const y = p.cy + r * Math.sin(-p.midAngle * RAD);
  return (
    <text x={x} y={y} fill={TICK} fontSize={11} fontFamily={MONO} textAnchor={x > p.cx ? 'start' : 'end'} dominantBaseline="central">
      {p.name}
    </text>
  );
};

function renderChart(spec: ChartSpec, key: number): React.ReactNode {
  const { type, title, valueFormat, data } = spec;
  const tickStyle = { fill: TICK, fontSize: 11, fontFamily: MONO };
  let chart: React.ReactElement;
  if (type === 'pie') {
    chart = (
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={78} label={renderPieLabel} labelLine={{ stroke: '#1F2E25' }}>
          {data.map((d, i) => <Cell key={i} fill={sliceColor(d.value, i)} stroke="#0A0E0C" />)}
        </Pie>
        <Tooltip content={<ChartTooltip valueFormat={valueFormat} />} />
      </PieChart>
    );
  } else if (type === 'line') {
    chart = (
      <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis dataKey="label" tick={tickStyle} tickLine={false} axisLine={{ stroke: '#1F2E25' }} />
        <YAxis tick={tickStyle} tickLine={false} axisLine={false} width={56} tickFormatter={(v: number) => fmtChartValue(v, valueFormat)} />
        <Tooltip content={<ChartTooltip valueFormat={valueFormat} />} cursor={{ stroke: 'rgba(0,212,160,0.2)' }} />
        <Line type="monotone" dataKey="value" stroke={teal} strokeWidth={2} dot={lineDot} activeDot={{ r: 4, fill: teal }} />
      </LineChart>
    );
  } else {
    chart = (
      <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis dataKey="label" tick={tickStyle} tickLine={false} axisLine={{ stroke: '#1F2E25' }} />
        <YAxis tick={tickStyle} tickLine={false} axisLine={false} width={56} tickFormatter={(v: number) => fmtChartValue(v, valueFormat)} />
        <Tooltip content={<ChartTooltip valueFormat={valueFormat} />} cursor={{ fill: 'rgba(0,212,160,0.06)' }} />
        <Bar dataKey="value" radius={[3, 3, 0, 0]}>
          {data.map((d, i) => <Cell key={i} fill={d.value < 0 ? red : teal} />)}
        </Bar>
      </BarChart>
    );
  }
  return (
    <div key={`chart-${key}`} style={{ margin: '12px 0', borderRadius: 10, border: '1px solid #1F2E25', background: '#101512', padding: '14px 14px 10px' }}>
      {title && <div style={{ fontFamily: fd, fontSize: 13, fontWeight: 600, color: '#e0e0e0', marginBottom: 10, letterSpacing: 0.3 }}>{title}</div>}
      <ResponsiveContainer width="100%" height={220}>
        {chart}
      </ResponsiveContainer>
    </div>
  );
}

export default function AIChatWidget({ isOpen, onClose, messages, input, setInput, onSend, loading, welcomeMsg }: AIChatWidgetProps) {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); }
  };

  const handleGrow = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  // Block-based renderer so markdown tables can sit between text lines.
  // Inline bold/headings/bullets and tables are handled by the shared
  // helpers above. Anything else renders as plain text on its own line.
  const formatAiText = (text: string): React.ReactNode[] => {
    const lines = text.split('\n');
    const nodes: React.ReactNode[] = [];
    let i = 0;
    let key = 0;
    while (i < lines.length) {
      const line = lines[i];

      // Fenced code block. ```chart bodies parse to a recharts chart;
      // any other fence renders its inner lines as plain text. The
      // fence markers themselves are never shown. Handles both the
      // conventional multi-line fence and a fully inline one-liner
      // (```chart {json} ```) in case the model emits it that way.
      const trimmed = line.trim();
      if (trimmed.startsWith('```')) {
        const afterTicks = trimmed.slice(3);
        const lang = (afterTicks.match(/^(\w*)/)?.[1] ?? '').toLowerCase();
        const rest = afterTicks.slice(lang.length);
        const body: string[] = [];
        const inlineClose = rest.indexOf('```');
        if (inlineClose !== -1) {
          body.push(rest.slice(0, inlineClose));
          i++;
        } else {
          if (rest.trim() !== '') body.push(rest);
          i++;
          while (i < lines.length && !lines[i].trim().startsWith('```')) {
            body.push(lines[i]);
            i++;
          }
          if (i < lines.length) i++; // consume closing fence
        }
        if (lang === 'chart') {
          const spec = parseChartSpec(body.join('\n'));
          if (spec) nodes.push(renderChart(spec, key++));
          // Malformed → render nothing for this block.
        } else {
          // Non-chart fence: show its contents as plain lines.
          body.forEach((b, bi) => nodes.push(<div key={`fc-${key++}-${bi}`}>{renderInline(b, `fc-${i}-${bi}`)}</div>));
        }
        continue;
      }

      // Table: a row immediately followed by a |---|---| delimiter
      if (mdLooksLikeRow(line) && i + 1 < lines.length && mdIsDelimiterRow(lines[i + 1])) {
        const header = mdParseRow(line);
        i += 2;
        const rows: string[][] = [];
        while (i < lines.length && mdLooksLikeRow(lines[i]) && !mdIsDelimiterRow(lines[i])) {
          rows.push(mdParseRow(lines[i]));
          i++;
        }
        nodes.push(renderTable(header, rows, key++));
        continue;
      }

      // Blank line → paragraph spacing
      if (line.trim() === '') {
        nodes.push(<div key={`sp-${key++}`} style={{ height: 6 }} />);
        i++;
        continue;
      }

      // Heading → bold white line
      const headingMatch = line.match(/^#{1,6}\s+(.*)$/);
      if (headingMatch) {
        nodes.push(<div key={`hd-${key++}`} style={{ fontWeight: 700, color: '#fff', marginTop: 4 }}>{renderInline(headingMatch[1], `hd-${i}`)}</div>);
        i++;
        continue;
      }

      // Bullet (•, -, *) — but not the ** that opens bold
      const bulletMatch = !line.startsWith('**') ? line.match(/^\s*(?:•|-|\*)\s+(.*)$/) : null;
      if (bulletMatch) {
        nodes.push(
          <div key={`bl-${key++}`} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 4 }}>
            <span style={{ color: teal, flexShrink: 0 }}>•</span>
            <span>{renderInline(bulletMatch[1], `bl-${i}`)}</span>
          </div>
        );
        i++;
        continue;
      }

      // Plain line
      nodes.push(<div key={`ln-${key++}`}>{renderInline(line, `ln-${i}`)}</div>);
      i++;
    }
    return nodes;
  };

  // Render messages
  const hasMessages = messages.length > 0;

  return (
    <>
      <style>{`
        @keyframes aiWidgetDotPulse { 0%,80%,100% { opacity: 0.3; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1); } }
        @keyframes aiWidgetOnlinePulse {
          0% { box-shadow: 0 0 0 0 rgba(0,212,160,0.6); }
          70% { box-shadow: 0 0 0 6px rgba(0,212,160,0); }
          100% { box-shadow: 0 0 0 0 rgba(0,212,160,0); }
        }
        .aiWidgetScroll::-webkit-scrollbar { width: 6px; }
        .aiWidgetScroll::-webkit-scrollbar-track { background: transparent; }
        .aiWidgetScroll::-webkit-scrollbar-thumb { background: rgba(0,212,160,0.15); border-radius: 3px; }
        .aiWidgetScroll { scrollbar-width: thin; scrollbar-color: rgba(0,212,160,0.15) transparent; }
        .aiCoachInput::placeholder { color: rgba(129,155,141,0.75); opacity: 1; }
      `}</style>

      {/* Backdrop — dims deeper in expanded workspace mode */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: expanded ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.3)', zIndex: 40, transition: 'background 0.28s ease' }}
      />
      {/* Widget — docked to right side; expands to half-screen workspace */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100vh',
          width: expanded ? '50vw' : 440,
          maxWidth: expanded ? '50vw' : '90vw',
          minWidth: expanded ? 540 : undefined,
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          background: '#0A0E0C',
          borderRadius: '28px 0 0 28px',
          overflow: 'hidden',
          boxShadow: '-10px 0 30px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,212,160,0.1)',
          transition: 'width 0.28s cubic-bezier(0.4, 0, 0.2, 1), max-width 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Ambient glow */}
          <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '80%', height: 128, background: teal, borderRadius: '50%', filter: 'blur(100px)', opacity: 0.15, pointerEvents: 'none' }} />

          {/* Expand/collapse handle — vertically centered on the left border
              (the edge facing the app), so it's an obvious click target. */}
          <button
            onClick={() => setExpanded(e => !e)}
            aria-label={expanded ? 'Collapse to sidebar' : 'Expand to half screen'}
            title={expanded ? 'Collapse to sidebar' : 'Expand to half screen'}
            style={{
              position: 'absolute',
              left: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 30,
              width: 30,
              height: 72,
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(10,14,12,0.92)',
              border: '1px solid #1F2E25',
              borderLeft: 'none',
              borderRadius: '0 14px 14px 0',
              color: teal,
              cursor: 'pointer',
              boxShadow: '2px 0 10px rgba(0,0,0,0.35)',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(0,212,160,0.12)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = teal; e.currentTarget.style.background = 'rgba(10,14,12,0.92)'; }}
          >
            {expanded ? (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 17 18 12 13 7" /><polyline points="6 17 11 12 6 7" /></svg>
            ) : (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="11 17 6 12 11 7" /><polyline points="18 17 13 12 18 7" /></svg>
            )}
          </button>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #1F2E25', background: 'rgba(10,14,12,0.8)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', zIndex: 20, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* AI avatar */}
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(0,212,160,0.2), #0A0E0C)',
                  border: '1px solid rgba(0,212,160,0.3)',
                  boxShadow: '0 0 15px rgba(0,212,160,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Logo size={20} />
                </div>
                {/* Online dot */}
                <div style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: '50%', background: teal, border: '2px solid #0A0E0C', animation: 'aiWidgetOnlinePulse 1.8s ease-out infinite' }} />
              </div>
              <div>
                <div style={{ fontFamily: fd, fontSize: 15, fontWeight: 600, color: '#fff' }}>WickCoach AI</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: teal, animation: 'aiWidgetDotPulse 1.4s ease-in-out infinite' }} />
                  <span style={{ fontFamily: fm, fontSize: 11, color: teal }}>Analyzing Patterns</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button
                aria-label="More"
                style={{ padding: 8, color: 'rgba(129,155,141,1)', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6 }}
                onMouseEnter={e => { e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(129,155,141,1)'; }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></svg>
              </button>
              <button
                onClick={onClose}
                aria-label="Close"
                style={{ padding: 8, color: 'rgba(129,155,141,1)', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6 }}
                onMouseEnter={e => { e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(129,155,141,1)'; }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
          </div>

          {/* Chat messages area */}
          <div
            className="aiWidgetScroll"
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              backgroundImage: `repeating-linear-gradient(0deg, rgba(0,212,160,0.03) 0px, rgba(0,212,160,0.03) 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, rgba(0,212,160,0.03) 0px, rgba(0,212,160,0.03) 1px, transparent 1px, transparent 40px)`,
            }}
          >
            {!hasMessages && welcomeMsg && (
              <div style={{ alignSelf: 'flex-start', maxWidth: expanded ? '94%' : '85%', background: '#151C18', border: '1px solid #1F2E25', color: 'rgba(229,231,235,1)', borderRadius: '20px 20px 20px 4px', padding: '12px 16px', fontSize: 14, lineHeight: 1.6, fontFamily: fm }}>
                {formatAiText(welcomeMsg)}
              </div>
            )}

            {!hasMessages && !welcomeMsg && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, padding: 20 }}>
                <div style={{ fontFamily: fm, fontSize: 13, color: 'rgba(129,155,141,1)', fontStyle: 'italic', textAlign: 'center', lineHeight: 1.6 }}>Ask about your trading patterns, psychology, or specific trades.</div>
              </div>
            )}

            {messages.map((msg, i) => (
              msg.role === 'assistant' ? (
                <div key={i} style={{ alignSelf: 'flex-start', maxWidth: expanded ? '94%' : '85%', background: '#151C18', border: '1px solid #1F2E25', color: 'rgba(229,231,235,1)', borderRadius: '20px 20px 20px 4px', padding: '12px 16px', fontSize: 14, lineHeight: 1.6, fontFamily: fm }}>
                  {formatAiText(msg.content)}
                </div>
              ) : (
                <div key={i} style={{ alignSelf: 'flex-end', maxWidth: '85%', background: 'linear-gradient(135deg, #00d4a0, #00d4a0)', color: '#fff', borderRadius: '20px 20px 4px 20px', padding: '12px 16px', fontSize: 14, lineHeight: 1.6, fontWeight: 500, fontFamily: fm }}>
                  {msg.content}
                </div>
              )
            ))}

            {loading && (
              <div style={{ alignSelf: 'flex-start', background: '#151C18', border: '1px solid #1F2E25', borderRadius: '20px 20px 20px 4px', padding: '12px 16px' }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[0, 1, 2].map(d => (
                    <span key={d} style={{ width: 6, height: 6, borderRadius: '50%', background: teal, animation: `aiWidgetDotPulse 1.2s ease-in-out ${d * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input area */}
          <div style={{ padding: 16, borderTop: '1px solid #1F2E25', flexShrink: 0 }}>
            {/* Quick action chips */}
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
              {['Show similar trades', "Log as 'Rule Break'"].map(chip => (
                <button
                  key={chip}
                  onClick={() => setInput(chip)}
                  style={{ flexShrink: 0, padding: '6px 12px', borderRadius: 16, background: '#151C18', border: '1px solid #1F2E25', fontFamily: fm, fontSize: 12, color: 'rgba(209,213,219,1)', cursor: 'pointer', whiteSpace: 'nowrap' }}
                >{chip}</button>
              ))}
            </div>

            {/* Input container */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, background: '#101512', border: '1px solid #1F2E25', borderRadius: 24, padding: '6px 6px 6px 12px', marginTop: 12 }}>
              <button
                aria-label="Attach"
                style={{ padding: 8, color: 'rgba(129,155,141,1)', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              </button>
              <textarea
                ref={textareaRef}
                className="aiCoachInput"
                value={input}
                onChange={handleGrow}
                onKeyDown={handleKey}
                placeholder="Ask about your trades, make tables or charts, dig into a pattern..."
                rows={1}
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: fm, fontSize: 14, color: '#fff', resize: 'none', minHeight: 44, maxHeight: 120, padding: '10px 0', lineHeight: 1.5 }}
              />
              <button
                onClick={onSend}
                disabled={loading || !input.trim()}
                aria-label="Send"
                style={{ width: 40, height: 40, borderRadius: '50%', background: teal, color: '#042F20', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', opacity: loading || !input.trim() ? 0.5 : 1, flexShrink: 0 }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
              </button>
            </div>

            {/* Disclaimer */}
            <div style={{ fontFamily: fm, fontSize: 11, color: 'rgba(129,155,141,0.6)', textAlign: 'center', marginTop: 10 }}>
              AI Coach can make mistakes. Verify executing rules.
            </div>
          </div>
      </div>
    </>
  );
}

