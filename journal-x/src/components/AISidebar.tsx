'use client';

import React, { useState, useRef, useEffect } from 'react';

const M = "'DM Mono', monospace";

/* ── Stick figure SVG (teal) ── */
function StickIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="8" cy="4.5" r="2" stroke="#00d4a0" strokeWidth="1.2" fill="none" />
      <line x1="8" y1="6.5" x2="8" y2="13" stroke="#00d4a0" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="8" y1="9" x2="5" y2="12" stroke="#00d4a0" strokeWidth="1" strokeLinecap="round" />
      <line x1="8" y1="9" x2="14" y2="7.5" stroke="#00d4a0" strokeWidth="1" strokeLinecap="round" />
      <line x1="8" y1="13" x2="5.5" y2="18" stroke="#00d4a0" strokeWidth="1" strokeLinecap="round" />
      <line x1="8" y1="13" x2="10.5" y2="18" stroke="#00d4a0" strokeWidth="1" strokeLinecap="round" />
      <rect x="13" y="5" width="2.5" height="6" rx="0.5" fill="#00d4a0" opacity="0.7" />
      <line x1="14.25" y1="3.5" x2="14.25" y2="5" stroke="#00d4a0" strokeWidth="0.8" />
      <line x1="14.25" y1="11" x2="14.25" y2="13" stroke="#00d4a0" strokeWidth="0.8" />
    </svg>
  );
}

/* ── Pulsing dot ── */
function PulseDot({ size = 6 }: { size?: number }) {
  return (
    <>
      <style>{`
        @keyframes coachPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.4); }
        }
      `}</style>
      <span
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: '#00d4a0',
          display: 'inline-block',
          animation: 'coachPulse 2s ease-in-out infinite',
        }}
      />
    </>
  );
}

/* ── Typing indicator ── */
function TypingDots() {
  return (
    <>
      <style>{`
        @keyframes dotBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.3; }
          40% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
      <div style={{ display: 'flex', gap: 4, padding: '10px 12px' }}>
        {[0, 1, 2].map(i => (
          <span
            key={i}
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: '#00d4a0',
              display: 'inline-block',
              animation: `dotBounce 1.2s ease-in-out ${i * 0.15}s infinite`,
            }}
          />
        ))}
      </div>
    </>
  );
}

type Message = { role: 'user' | 'assistant'; content: string };

export default function AISidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        "Hello. I've reviewed your last 18 trades. Your breakout setups are performing well at 71% win rate. Your biggest leak is mean reversion trades — consider removing them from your playbook.",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: 'user', content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/sidebar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updated.map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'AI service temporarily unavailable.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* ── COLLAPSED: edge trigger button ── */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            right: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 50,
            background: '#0a0a0a',
            border: '0.5px solid rgba(0,212,160,0.3)',
            borderRight: 'none',
            borderRadius: '8px 0 0 8px',
            padding: '12px 8px',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <PulseDot size={6} />
          <StickIcon size={24} />
        </button>
      )}

      {/* ── EXPANDED: full panel ── */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            right: 0,
            top: 0,
            height: '100vh',
            width: '320px',
            zIndex: 50,
            background: '#0a0a0a',
            borderLeft: '0.5px solid #1e1e1e',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* ── Section 1: Coach header ── */}
          <div style={{ padding: '20px 16px 16px', borderBottom: '0.5px solid #1a1a1a', position: 'relative' }}>
            {/* Close button */}
            <button
              onClick={() => setIsOpen(false)}
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                background: 'none',
                border: 'none',
                color: '#555',
                fontSize: 20,
                cursor: 'pointer',
                lineHeight: 1,
                padding: 0,
              }}
            >
              ×
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <StickIcon size={28} />
              <span
                style={{
                  fontFamily: M,
                  fontSize: 11,
                  color: '#00d4a0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  fontWeight: 500,
                }}
              >
                AI COACH — LIVE
              </span>
              <PulseDot size={6} />
            </div>
            <div style={{ fontFamily: M, fontSize: 10, color: '#333', marginTop: 6 }}>
              Powered by Claude
            </div>
          </div>

          {/* ── Section 2: Quick stats ── */}
          <div style={{ padding: '14px 16px', borderBottom: '0.5px solid #1a1a1a' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: 'WIN RATE', value: '61%', color: '#00d4a0' },
                { label: 'TOTAL P&L', value: '+$2,937', color: '#00d4a0' },
                { label: 'AVG R:R', value: '1.27', color: '#aaa' },
                { label: 'EXP. VALUE', value: '+$163', color: '#00d4a0' },
              ].map(s => (
                <div
                  key={s.label}
                  style={{
                    background: '#111',
                    border: '0.5px solid #1e1e1e',
                    borderRadius: 6,
                    padding: '8px 10px',
                  }}
                >
                  <div
                    style={{
                      fontFamily: M,
                      fontSize: 9,
                      color: '#444',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {s.label}
                  </div>
                  <div
                    style={{
                      fontFamily: M,
                      fontSize: 15,
                      fontWeight: 600,
                      color: s.color,
                      marginTop: 2,
                    }}
                  >
                    {s.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Section 3: Latest insight ── */}
          <div style={{ padding: '14px 16px', borderBottom: '0.5px solid #1a1a1a' }}>
            <div
              style={{
                fontFamily: M,
                fontSize: 10,
                color: '#333',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 8,
              }}
            >
              LATEST INSIGHT
            </div>
            <div
              style={{
                background: '#0c1812',
                border: '0.5px solid rgba(0,212,160,0.15)',
                borderRadius: 6,
                padding: '10px 12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <StickIcon size={14} />
                <span style={{ fontFamily: M, fontSize: 10, color: '#00d4a0' }}>Coach</span>
              </div>
              <div
                style={{
                  fontFamily: M,
                  fontSize: 12,
                  color: '#5a7a68',
                  lineHeight: 1.6,
                }}
              >
                You&apos;ve exited early on 4 of your last 6 winners. This has cost an estimated $240
                in unrealized gains this month.
              </div>
            </div>
          </div>

          {/* ── Section 4: Chat interface ── */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div
              style={{
                fontFamily: M,
                fontSize: 10,
                color: '#333',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                padding: '14px 16px 8px',
              }}
            >
              ASK YOUR COACH
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '0 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              {messages.map((msg, i) =>
                msg.role === 'assistant' ? (
                  <div key={i} style={{ alignSelf: 'flex-start', maxWidth: '90%' }}>
                    <div
                      style={{
                        background: '#0c1812',
                        border: '0.5px solid rgba(0,212,160,0.1)',
                        borderRadius: '6px 6px 6px 0',
                        padding: '10px 12px',
                        fontFamily: M,
                        fontSize: 12,
                        color: '#5a7a68',
                        lineHeight: 1.6,
                      }}
                    >
                      {msg.content}
                    </div>
                    <div style={{ fontFamily: M, fontSize: 10, color: '#333', marginTop: 4 }}>
                      {i === 0 ? 'Just now' : ''}
                    </div>
                  </div>
                ) : (
                  <div key={i} style={{ alignSelf: 'flex-end', maxWidth: '90%' }}>
                    <div
                      style={{
                        background: '#1a1a1a',
                        borderRadius: '6px 6px 0 6px',
                        padding: '10px 12px',
                        fontFamily: M,
                        fontSize: 12,
                        color: '#aaa',
                        lineHeight: 1.6,
                      }}
                    >
                      {msg.content}
                    </div>
                  </div>
                )
              )}
              {loading && (
                <div style={{ alignSelf: 'flex-start' }}>
                  <div
                    style={{
                      background: '#0c1812',
                      border: '0.5px solid rgba(0,212,160,0.1)',
                      borderRadius: '6px 6px 6px 0',
                    }}
                  >
                    <TypingDots />
                  </div>
                </div>
              )}
            </div>

            {/* Input area */}
            <div
              style={{
                padding: '12px 16px',
                borderTop: '0.5px solid #1a1a1a',
                display: 'flex',
                gap: 8,
              }}
            >
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask your coach..."
                style={{
                  flex: 1,
                  background: '#111',
                  border: '0.5px solid #1e1e1e',
                  borderRadius: 6,
                  padding: '10px 12px',
                  fontFamily: M,
                  fontSize: 12,
                  color: '#aaa',
                  outline: 'none',
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = 'rgba(0,212,160,0.4)';
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = '#1e1e1e';
                }}
              />
              <button
                onClick={sendMessage}
                disabled={loading}
                style={{
                  background: 'rgba(0,212,160,0.1)',
                  border: '0.5px solid rgba(0,212,160,0.3)',
                  borderRadius: 6,
                  padding: '10px 14px',
                  fontFamily: M,
                  fontSize: 12,
                  color: '#00d4a0',
                  cursor: loading ? 'default' : 'pointer',
                  opacity: loading ? 0.5 : 1,
                }}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
