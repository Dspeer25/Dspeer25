'use client';
import React, { useRef, useEffect, useState } from 'react';
import { fm, fd } from './shared';
import Logo from './Logo';

const teal = '#00d4a0';

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
                onClick={() => setExpanded(e => !e)}
                aria-label={expanded ? 'Collapse to sidebar' : 'Expand to half screen'}
                title={expanded ? 'Collapse to sidebar' : 'Expand to half screen'}
                style={{ padding: 8, color: teal, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6 }}
                onMouseEnter={e => { e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.color = teal; }}
              >
                {expanded ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 17 18 12 13 7" /><polyline points="6 17 11 12 6 7" /></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="11 17 6 12 11 7" /><polyline points="18 17 13 12 18 7" /></svg>
                )}
              </button>
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

