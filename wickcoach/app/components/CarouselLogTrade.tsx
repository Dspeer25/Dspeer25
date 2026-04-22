'use client';
import React, { useState, useRef } from "react";
import { fm, fd, teal } from "./shared";

export default function CarouselLogTrade({ onAdvance }: { onAdvance: () => void }) {
  const [s, setS] = useState(0);
  const [tickerText, setTickerText] = useState('');
  const [contractsText, setContractsText] = useState('');
  const [entryText, setEntryText] = useState('');
  const [exitText, setExitText] = useState('');
  const [journalText, setJournalText] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [btnScale, setBtnScale] = useState(1);
  const [cursorPos, setCursorPos] = useState({ top: -20, left: -20 });
  const [showCursor, setShowCursor] = useState(false);
  const [focusField, setFocusField] = useState('');
  const [showScreenshot, setShowScreenshot] = useState(false);
  const [showFilePicker, setShowFilePicker] = useState(false);
  const [btnClicked, setBtnClicked] = useState(false);
  const [leftShift, setLeftShift] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const refTicker = useRef<HTMLDivElement>(null);
  const refDeriv = useRef<HTMLDivElement>(null);
  const refStrategy = useRef<HTMLDivElement>(null);
  const refStratItem = useRef<HTMLDivElement>(null);
  const refLong = useRef<HTMLDivElement>(null);
  const refContracts = useRef<HTMLDivElement>(null);
  const refEntry = useRef<HTMLDivElement>(null);
  const refExit = useRef<HTMLDivElement>(null);
  const refJournal = useRef<HTMLDivElement>(null);
  const refScreenshot = useRef<HTMLDivElement>(null);
  const refBtn = useRef<HTMLDivElement>(null);

  const inp: React.CSSProperties = { background: '#1a1b22', border: '1px solid #2a2b32', borderRadius: 4, padding: '6px 8px', color: '#fff', fontFamily: fm, fontSize: 12, width: '100%', boxSizing: 'border-box' };
  const lab: React.CSSProperties = { color: '#9ca3af', fontFamily: fm, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 };
  const journalFull = "VWAP reclaim at 10:15. Clean setup, followed rules.";
  const strategies = ['0DTE Call', '0DTE Put', 'Call Scalp', 'Put Scalp', 'Call Debit Spread', 'Put Debit Spread', 'Put Credit Spread', 'Call Credit Spread', 'Iron Condor', 'Naked Put', 'Naked Call'];

  const moveTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (!ref.current || !containerRef.current) return;
    const c = containerRef.current.getBoundingClientRect();
    const el = ref.current.getBoundingClientRect();
    setCursorPos({ top: el.top - c.top + el.height / 2 - 4, left: el.left - c.left + 20 });
  };

  React.useEffect(() => {
    const tt: ReturnType<typeof setTimeout>[] = [];
    const q = (fn: () => void, ms: number) => { tt.push(setTimeout(fn, ms)); };
    const base = 300;
    let t = base;

    q(() => setShowCursor(true), t);

    q(() => moveTo(refTicker), t);
    t += 300 + 100;
    q(() => setFocusField('ticker'), t);
    q(() => setTickerText('N'), t + 80);
    q(() => setTickerText('NV'), t + 160);
    q(() => setTickerText('NVD'), t + 240);
    q(() => setTickerText('NVDA'), t + 320);
    t += 400;
    q(() => { setS(1); setFocusField(''); }, t);
    t += 150;

    q(() => setS(2), t);
    t += 200;

    q(() => moveTo(refDeriv), t);
    t += 300 + 100;
    q(() => setS(3), t);
    t += 150;

    q(() => moveTo(refStrategy), t);
    t += 300 + 100;
    q(() => { setFocusField('strategy'); setDropdownOpen(true); }, t);
    t += 250;
    q(() => moveTo(refStratItem), t);
    t += 250 + 100;
    q(() => { setS(4); setDropdownOpen(false); setFocusField(''); }, t);
    t += 150;

    q(() => moveTo(refLong), t);
    t += 300 + 100;
    q(() => setS(5), t);
    t += 150;

    q(() => moveTo(refContracts), t);
    t += 300 + 100;
    q(() => setFocusField('contracts'), t);
    q(() => setContractsText('1'), t + 80);
    q(() => setContractsText('10'), t + 160);
    t += 250;
    q(() => setFocusField(''), t);
    t += 150;

    q(() => setLeftShift(80), t);
    t += 100;

    q(() => moveTo(refEntry), t);
    t += 400 + 100;
    q(() => setFocusField('entry'), t);
    q(() => setEntryText('$'), t + 60);
    q(() => setEntryText('$3'), t + 120);
    q(() => setEntryText('$3.'), t + 180);
    q(() => setEntryText('$3.8'), t + 240);
    q(() => setEntryText('$3.87'), t + 300);
    t += 380;
    q(() => setFocusField(''), t);
    t += 150;

    q(() => moveTo(refExit), t);
    t += 300 + 100;
    q(() => setFocusField('exit'), t);
    q(() => setExitText('$'), t + 60);
    q(() => setExitText('$4'), t + 120);
    q(() => setExitText('$4.'), t + 180);
    q(() => setExitText('$4.2'), t + 240);
    q(() => setExitText('$4.26'), t + 300);
    t += 380;
    q(() => setFocusField(''), t);
    t += 150;

    q(() => setS(9), t);
    t += 300;

    q(() => moveTo(refJournal), t);
    t += 400 + 100;
    q(() => { setFocusField('journal'); setS(10); }, t);
    for (let i = 0; i < journalFull.length; i++) {
      q(() => setJournalText(journalFull.slice(0, i + 1)), t + 50 + i * 25);
    }
    t += 50 + journalFull.length * 25 + 100;
    q(() => setFocusField(''), t);
    t += 150;

    q(() => moveTo(refScreenshot), t);
    t += 300 + 100;
    q(() => setShowFilePicker(true), t);
    t += 400;
    q(() => { setShowFilePicker(false); setShowScreenshot(true); setS(11); }, t);
    t += 300;

    q(() => moveTo(refBtn), t);
    t += 300 + 200;
    q(() => { setBtnScale(0.95); setBtnClicked(true); setFocusField('btn'); }, t);
    q(() => setBtnScale(1), t + 150);
    t += 500;

    q(() => { setShowCursor(false); onAdvance(); }, t);

    return () => tt.forEach(clearTimeout);
  }, [onAdvance, journalFull]);

  const derivSelected = s >= 3;
  const longSelected = s >= 5;
  const showPL = s >= 9;
  const showJournal = s >= 10;

  return (<div ref={containerRef} style={{ position: 'relative', overflow: 'hidden', height: '100%' }}>
    <style>{`
      @keyframes blink { 0%,100% { opacity:1 } 50% { opacity:0 } }
      @keyframes btnRipple { 0% { transform:translate(-50%,-50%) scale(0.5); opacity:0.6 } 100% { transform:translate(-50%,-50%) scale(2.5); opacity:0 } }
      @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
    `}</style>

    {showCursor && (
      <div style={{ position: 'absolute', top: cursorPos.top, left: cursorPos.left, zIndex: 20, transition: 'top 0.3s cubic-bezier(0.25,0.1,0.25,1), left 0.3s cubic-bezier(0.25,0.1,0.25,1)', pointerEvents: 'none' }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="#00d4a0" style={{ filter: 'drop-shadow(0 0 6px rgba(0,212,160,0.5))' }}>
          <path d="M0 0 L0 12 L4 8 L8 13 L10 11 L6 6 L11 6 Z" />
        </svg>
      </div>
    )}

    <div style={{ display: 'flex', gap: 16 }}>
      <div style={{ flex: '0 0 55%', transform: `translateY(-${leftShift}px)`, transition: 'transform 0.8s ease' }}>
        <div style={{ color: teal, fontFamily: fd, fontSize: 14, fontWeight: 700, letterSpacing: 2, marginBottom: 8 }}>TRADE DETAILS</div>

        <div style={lab}>TICKER</div>
        <div ref={refTicker} style={{ ...inp, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, borderColor: focusField === 'ticker' ? teal : '#2a2b32', transition: 'border-color 0.3s' }}>
          {s >= 1 && <img src="https://logo.clearbit.com/nvidia.com" alt="" width={16} height={16} style={{ borderRadius: 3, opacity: s >= 1 ? 1 : 0, transition: 'opacity 0.2s' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
          <span>{tickerText}</span>
          {tickerText.length > 0 && s < 1 && <span style={{ color: teal, animation: 'blink 1s step-end infinite' }}>|</span>}
        </div>

        <div style={lab}>DATE</div>
        <div style={{ ...inp, marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: s >= 2 ? 1 : 0.3, transition: 'opacity 0.2s' }}>
          <span>{s >= 2 ? '04/03/2026' : ''}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
        </div>

        <div style={lab}>POSITION TYPE</div>
        <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
          <div style={{ flex: 1, padding: '4px 0', borderRadius: 4, fontSize: 11, fontFamily: fm, fontWeight: 700, textAlign: 'center', background: derivSelected ? '#1a1b22' : 'rgba(0,212,160,0.18)', border: derivSelected ? '1px solid #2a2b32' : '1px solid #00d4a0', color: derivSelected ? '#6b7280' : teal, transition: 'all 0.3s' }}>SHARES</div>
          <div ref={refDeriv} style={{ flex: 1, padding: '4px 0', borderRadius: 4, fontSize: 11, fontFamily: fm, fontWeight: 700, textAlign: 'center', background: derivSelected ? 'rgba(0,212,160,0.18)' : '#1a1b22', border: derivSelected ? '1px solid #00d4a0' : '1px solid #2a2b32', color: derivSelected ? teal : '#6b7280', transition: 'all 0.3s' }}>DERIVATIVES</div>
        </div>

        <div style={lab}>STRATEGY TYPE</div>
        <div style={{ position: 'relative', marginBottom: 6 }}>
          <div ref={refStrategy} style={{ ...inp, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderColor: focusField === 'strategy' ? teal : '#2a2b32', transition: 'border-color 0.3s' }}>
            <span>{s >= 4 ? '0DTE Call' : ''}</span>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#6b7280" strokeWidth="1.5"><path d="M2 4 L5 7 L8 4" /></svg>
          </div>
          {dropdownOpen && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#1a1b22', border: '1px solid #2a2b32', borderRadius: 4, zIndex: 10, maxHeight: 120, overflowY: 'auto', marginTop: 2 }}>
              {strategies.map((st, i) => (
                <div key={i} ref={i === 0 ? refStratItem : undefined} style={{ padding: '4px 8px', fontSize: 11, fontFamily: fm, color: i === 0 ? teal : '#d1d5db', background: i === 0 ? 'rgba(0,212,160,0.1)' : 'transparent', cursor: 'pointer' }}>{st}</div>
              ))}
            </div>
          )}
        </div>

        <div style={lab}>DIRECTION</div>
        <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
          <div ref={refLong} style={{ flex: 1, padding: '4px 0', borderRadius: 4, fontSize: 11, fontFamily: fm, fontWeight: 700, textAlign: 'center', background: longSelected ? 'rgba(0,212,160,0.18)' : '#1a1b22', border: longSelected ? '1px solid #00d4a0' : '1px solid #2a2b32', color: longSelected ? teal : '#6b7280', transition: 'all 0.3s' }}>LONG</div>
          <div style={{ flex: 1, padding: '4px 0', borderRadius: 4, fontSize: 11, fontFamily: fm, fontWeight: 700, textAlign: 'center', background: '#1a1b22', border: '1px solid #2a2b32', color: '#6b7280' }}>SHORT</div>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
          <div style={{ flex: 1 }}>
            <div style={lab}>CONTRACTS</div>
            <div ref={refContracts} style={{ ...inp, borderColor: focusField === 'contracts' ? teal : '#2a2b32', transition: 'border-color 0.3s' }}>
              {contractsText}
              {focusField === 'contracts' && <span style={{ color: teal, animation: 'blink 1s step-end infinite' }}>|</span>}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={lab}>P/L</div>
            <div style={{ ...inp, color: teal, fontWeight: 700, transform: showPL ? 'scale(1)' : 'scale(0.8)', opacity: showPL ? 1 : 0.3, transition: 'transform 0.3s, opacity 0.3s' }}>{showPL ? '+$390.00' : ''}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
          <div style={{ flex: 1 }}>
            <div style={lab}>ENTRY PRICE</div>
            <div ref={refEntry} style={{ ...inp, borderColor: focusField === 'entry' ? teal : '#2a2b32', transition: 'border-color 0.3s' }}>
              {entryText}
              {focusField === 'entry' && <span style={{ color: teal, animation: 'blink 1s step-end infinite' }}>|</span>}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={lab}>EXIT PRICE</div>
            <div ref={refExit} style={{ ...inp, borderColor: focusField === 'exit' ? teal : '#2a2b32', transition: 'border-color 0.3s' }}>
              {exitText}
              {focusField === 'exit' && <span style={{ color: teal, animation: 'blink 1s step-end infinite' }}>|</span>}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ flex: 1 }}>
            <div style={lab}>RISK ($)</div>
            <div style={{ ...inp, opacity: showPL ? 1 : 0.3, transition: 'opacity 0.3s' }}>{showPL ? '$150' : ''}</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={lab}>RISK : REWARD</div>
            <div style={{ ...inp, color: teal, fontWeight: 700, opacity: showPL ? 1 : 0.3, transition: 'opacity 0.3s' }}>{showPL ? '1 : 2.6' : ''}</div>
          </div>
        </div>
      </div>

      <div style={{ flex: '0 0 42%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ color: teal, fontFamily: fd, fontSize: 12, fontWeight: 700, letterSpacing: 2, marginBottom: 4 }}>JOURNAL ENTRY</div>
        <div ref={refJournal} style={{ ...inp, minHeight: 80, lineHeight: 1.5, color: '#d1d5db', marginBottom: 8, borderColor: focusField === 'journal' ? teal : '#2a2b32', transition: 'border-color 0.3s' }}>
          {showJournal ? journalText : <span style={{ color: '#6b7280' }}>Share your brief approach on this trade for the WickCoach AI to analyze...</span>}
          {showJournal && journalText.length < journalFull.length && <span style={{ color: teal, animation: 'blink 1s step-end infinite' }}>|</span>}
        </div>

        <div style={{ color: teal, fontFamily: fd, fontSize: 12, fontWeight: 700, letterSpacing: 2, marginBottom: 4 }}>SCREENSHOT</div>
        <div ref={refScreenshot} style={{ border: '2px dashed #2a2b32', borderRadius: 6, minHeight: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginBottom: 8, overflow: 'hidden', position: 'relative' }}>
          {showFilePicker && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ background: '#1a1b22', border: '1px solid #2a2b32', borderRadius: 6, padding: '8px 12px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
                <div style={{ color: '#6b7280', fontFamily: fm, fontSize: 9, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Select file</div>
                <div style={{ background: 'rgba(0,212,160,0.1)', border: '1px solid rgba(0,212,160,0.3)', borderRadius: 4, padding: '4px 10px', color: teal, fontFamily: fm, fontSize: 11, fontWeight: 600 }}>NVDA_2min_chart.png</div>
              </div>
            </div>
          )}
          {!showScreenshot ? (<>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
            <span style={{ color: '#9ca3af', fontFamily: fm, fontSize: 11, marginTop: 4 }}>Drop an image here</span>
          </>) : (
            <div style={{ width: '100%', opacity: 1, animation: 'fadeIn 0.3s ease' }}>
              <svg width="100%" height="100" viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg" style={{ background: '#0e0f14', borderRadius: 6, display: 'block' }}>
                <rect width="400" height="200" fill="#0e0f14" rx="6"/>
                <text x="12" y="16" fill="#6b7280" fontFamily="monospace" fontSize="10">NVDA 2min</text>
                <line x1="30" y1="35" x2="385" y2="35" stroke="#1a1b22" strokeWidth="0.5"/>
                <line x1="30" y1="65" x2="385" y2="65" stroke="#1a1b22" strokeWidth="0.5"/>
                <line x1="30" y1="95" x2="385" y2="95" stroke="#1a1b22" strokeWidth="0.5"/>
                <line x1="30" y1="125" x2="385" y2="125" stroke="#1a1b22" strokeWidth="0.5"/>
                <line x1="30" y1="155" x2="385" y2="155" stroke="#1a1b22" strokeWidth="0.5"/>
                <line x1="30" y1="185" x2="385" y2="185" stroke="#1a1b22" strokeWidth="0.5"/>
                <rect x="195" y="30" width="100" height="100" fill="#00d4a0" opacity="0.06" rx="2"/>
                <rect x="195" y="130" width="100" height="55" fill="#ef4444" opacity="0.08" rx="2"/>
                <line x1="195" y1="130" x2="295" y2="130" stroke="#00d4a0" strokeWidth="0.8" strokeDasharray="3,3" opacity="0.5"/>
                <line x1="195" y1="55" x2="295" y2="55" stroke="#00d4a0" strokeWidth="0.8" strokeDasharray="3,3" opacity="0.5"/>
                <line x1="195" y1="168" x2="295" y2="168" stroke="#ef4444" strokeWidth="0.8" strokeDasharray="3,3" opacity="0.5"/>
                <line x1="42" y1="80" x2="42" y2="148" stroke="#ef4444" strokeWidth="1"/><rect x="38" y="90" width="8" height="38" fill="#ef4444" rx="1"/>
                <line x1="60" y1="100" x2="60" y2="165" stroke="#ef4444" strokeWidth="1"/><rect x="56" y="110" width="8" height="40" fill="#ef4444" rx="1"/>
                <line x1="78" y1="125" x2="78" y2="178" stroke="#ef4444" strokeWidth="1"/><rect x="74" y="138" width="8" height="30" fill="#ef4444" rx="1"/>
                <line x1="96" y1="140" x2="96" y2="188" stroke="#ef4444" strokeWidth="1"/><rect x="92" y="148" width="8" height="35" fill="#ef4444" rx="1"/>
                <line x1="114" y1="155" x2="114" y2="192" stroke="#00d4a0" strokeWidth="1"/><rect x="110" y="165" width="8" height="10" fill="#00d4a0" rx="1"/>
                <line x1="132" y1="148" x2="132" y2="178" stroke="#00d4a0" strokeWidth="1"/><rect x="128" y="152" width="8" height="18" fill="#00d4a0" rx="1"/>
                <line x1="150" y1="130" x2="150" y2="165" stroke="#00d4a0" strokeWidth="1"/><rect x="146" y="135" width="8" height="22" fill="#00d4a0" rx="1"/>
                <line x1="168" y1="125" x2="168" y2="155" stroke="#ef4444" strokeWidth="1"/><rect x="164" y="130" width="8" height="18" fill="#ef4444" rx="1"/>
                <line x1="186" y1="118" x2="186" y2="148" stroke="#00d4a0" strokeWidth="1"/><rect x="182" y="122" width="8" height="18" fill="#00d4a0" rx="1"/>
                <line x1="208" y1="105" x2="208" y2="142" stroke="#00d4a0" strokeWidth="1"/><rect x="204" y="108" width="8" height="28" fill="#00d4a0" rx="1"/>
                <line x1="226" y1="88" x2="226" y2="120" stroke="#00d4a0" strokeWidth="1"/><rect x="222" y="92" width="8" height="20" fill="#00d4a0" rx="1"/>
                <line x1="244" y1="82" x2="244" y2="108" stroke="#ef4444" strokeWidth="1"/><rect x="240" y="88" width="8" height="14" fill="#ef4444" rx="1"/>
                <line x1="262" y1="65" x2="262" y2="95" stroke="#00d4a0" strokeWidth="1"/><rect x="258" y="68" width="8" height="20" fill="#00d4a0" rx="1"/>
                <line x1="280" y1="50" x2="280" y2="78" stroke="#00d4a0" strokeWidth="1"/><rect x="276" y="52" width="8" height="20" fill="#00d4a0" rx="1"/>
                <line x1="302" y1="55" x2="302" y2="88" stroke="#ef4444" strokeWidth="1"/><rect x="298" y="60" width="8" height="20" fill="#ef4444" rx="1"/>
                <line x1="320" y1="50" x2="320" y2="78" stroke="#00d4a0" strokeWidth="1"/><rect x="316" y="54" width="8" height="16" fill="#00d4a0" rx="1"/>
                <line x1="338" y1="55" x2="338" y2="82" stroke="#ef4444" strokeWidth="1"/><rect x="334" y="60" width="8" height="16" fill="#ef4444" rx="1"/>
                <line x1="356" y1="48" x2="356" y2="72" stroke="#00d4a0" strokeWidth="1"/><rect x="352" y="50" width="8" height="15" fill="#00d4a0" rx="1"/>
                <path d="M42,115 Q60,130 78,152 Q96,168 114,172 Q132,160 150,145 Q168,138 186,128 Q208,115 226,100 Q244,92 262,78 Q280,62 302,65 Q320,60 338,62 Q356,58 370,60" fill="none" stroke="#3b82f6" strokeWidth="1.2" opacity="0.7"/>
                <path d="M42,120 Q60,132 78,148 Q96,162 114,168 Q132,162 150,152 Q168,145 186,138 Q208,125 226,112 Q244,102 262,90 Q280,78 302,75 Q320,72 338,70 Q356,68 370,68" fill="none" stroke="#f59e0b" strokeWidth="1.2" opacity="0.5"/>
                <path d="M42,118 Q60,128 78,148 Q96,165 114,170 Q132,162 150,148 Q168,140 186,132 Q208,120 226,106 Q244,96 262,84 Q280,70 302,70 Q320,66 338,66 Q356,62 370,64" fill="none" stroke="#a78bfa" strokeWidth="1" opacity="0.5" strokeDasharray="4,3"/>
                <line x1="12" y1="196" x2="22" y2="196" stroke="#3b82f6" strokeWidth="1.2"/>
                <text x="25" y="198" fill="#6b7280" fontFamily="monospace" fontSize="7">20 EMA</text>
                <line x1="68" y1="196" x2="78" y2="196" stroke="#f59e0b" strokeWidth="1.2"/>
                <text x="81" y="198" fill="#6b7280" fontFamily="monospace" fontSize="7">50 SMA</text>
                <line x1="125" y1="196" x2="135" y2="196" stroke="#a78bfa" strokeWidth="1" strokeDasharray="4,3"/>
                <text x="138" y="198" fill="#6b7280" fontFamily="monospace" fontSize="7">VWAP</text>
              </svg>
            </div>
          )}
        </div>

        <div ref={refBtn} style={{ marginTop: 'auto', position: 'relative' }}>
          <div style={{ background: teal, color: '#0e0f14', fontFamily: fd, fontWeight: 700, padding: '8px 0', borderRadius: 6, textAlign: 'center', fontSize: 12, transform: `scale(${btnScale})`, transition: 'transform 0.15s', position: 'relative', overflow: 'hidden', borderColor: focusField === 'btn' ? '#fff' : 'transparent' }}>
            Log Trade
            {btnClicked && <div style={{ position: 'absolute', top: '50%', left: '50%', width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.3)', animation: 'btnRipple 0.5s ease-out forwards', pointerEvents: 'none' }} />}
          </div>
        </div>
      </div>
    </div>
  </div>);
}

