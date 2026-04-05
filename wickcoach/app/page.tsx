'use client';
import React, { useState, useEffect, useRef } from "react";
import { Lock, Eye, ShieldCheck } from "lucide-react";

const fm = "'DM Mono', monospace";
const fd = "'Chakra Petch', sans-serif";
const teal = "#00d4a0";

const Logo = ({ size = 16, showText = false }: { size?: number; showText?: boolean }) => (
  <div style={{ display: "flex", alignItems: "center", gap: size * 0.5 }}>
    <svg width={size} height={size * 1.2} viewBox="0 0 20 24" fill="none">
      <circle cx="8" cy="4" r="2.8" stroke="#7a7d88" strokeWidth="1.2" fill="none" />
      <line x1="8" y1="6.8" x2="8" y2="15" stroke="#7a7d88" strokeWidth="1.2" />
      <line x1="8" y1="9.5" x2="3" y2="13" stroke="#7a7d88" strokeWidth="1.2" />
      <line x1="8" y1="9.5" x2="14.5" y2="6" stroke="#7a7d88" strokeWidth="1.2" />
      <line x1="8" y1="15" x2="4.5" y2="21" stroke="#7a7d88" strokeWidth="1.2" />
      <line x1="8" y1="15" x2="11.5" y2="21" stroke="#7a7d88" strokeWidth="1.2" />
      <line x1="15.5" y1="2" x2="15.5" y2="12" stroke={teal} strokeWidth="0.8" />
      <rect x="13.5" y="4" width="4" height="5" rx="0.5" fill={teal} opacity="0.9" />
    </svg>
    {showText && (
      <span style={{ fontSize: size * 0.8, letterSpacing: "0.12em", fontWeight: 700, fontFamily: fd }}>
        <span style={{ color: "#d0d0d8" }}>WICK</span>
        <span style={{ color: teal }}>COACH</span>
      </span>
    )}
  </div>
);

function FAQ({ q, a, open, onClick }: { q: string; a: string; open: boolean; onClick: () => void }) {
  return (
    <div onClick={onClick} style={{ borderBottom: "1px solid #1a1a24", padding: "22px 0", cursor: "pointer" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 16, color: "#d0d0d8", fontFamily: fm, fontWeight: 500 }}>{q}</span>
        <span style={{ fontSize: 20, color: teal, transition: "transform 0.2s", transform: open ? "rotate(45deg)" : "none", lineHeight: 1 }}>+</span>
      </div>
      <div style={{ maxHeight: open ? 300 : 0, overflow: "hidden", transition: "max-height 0.4s ease" }}>
        <div style={{ fontSize: 15, color: "#9a9da8", lineHeight: 1.75, paddingTop: 14, fontFamily: fm }}>{a}</div>
      </div>
    </div>
  );
}

const tickerColors: Record<string, string> = { QQQ: "#7b3fe4", TSLA: "#cc0000", SPY: "#1a4a8a", NVDA: "#76b900", AAPL: "#555", META: "#0668E1", AMZN: "#ff9900" };

const TBadge = ({ ticker }: { ticker: string }) => {
  const [srcIdx, setSrcIdx] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const sources = [
    `https://financialmodelingprep.com/image-stock/${ticker}.png`,
    `https://assets.parqet.com/logos/symbol/${ticker}?format=png`,
    `https://storage.googleapis.com/iex/api/logos/${ticker}.png`,
  ];
  const allFailed = srcIdx >= sources.length;
  return (
    <div style={{ width: 28, height: 28, borderRadius: 5, background: tickerColors[ticker] || "#2a2a34", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#fff", fontFamily: fm, flexShrink: 0, overflow: "hidden" }}>
      {!allFailed && (
        <img
          key={srcIdx}
          src={sources[srcIdx]}
          alt={ticker}
          width={20}
          height={20}
          style={{ objectFit: "contain", display: loaded ? "block" : "none" }}
          onLoad={() => setLoaded(true)}
          onError={() => { setLoaded(false); setSrcIdx(i => i + 1); }}
        />
      )}
      {(allFailed || !loaded) && <span style={{ fontSize: 9 }}>{ticker.slice(0, 4)}</span>}
    </div>
  );
};

const cDomains: Record<string, string> = { QQQ: "invesco.com", SPY: "ssga.com", AAPL: "apple.com", NVDA: "nvidia.com", TSLA: "tesla.com", AMZN: "amazon.com", META: "meta.com", MSFT: "microsoft.com", GOOG: "google.com" };
const CLogo = ({ t }: { t: string }) => <img src={`https://logo.clearbit.com/${cDomains[t]}?size=48`} alt={t} style={{ width: 20, height: 20, borderRadius: "50%", background: "#1a1b22", objectFit: "cover" as const }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />;

function MockLogATrade({ onAdvance }: { onAdvance: () => void }) {
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

  // Refs for cursor targeting
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

  // Move cursor to center of a ref element (relative to container)
  const moveTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (!ref.current || !containerRef.current) return;
    const c = containerRef.current.getBoundingClientRect();
    const el = ref.current.getBoundingClientRect();
    setCursorPos({ top: el.top - c.top + el.height / 2 - 4, left: el.left - c.left + 20 });
  };

  /* Animation: cursor LEADS every action. FAST timing.
     move cursor (0.3s) → 100ms land → action → 150ms pause → next */
  React.useEffect(() => {
    const tt: ReturnType<typeof setTimeout>[] = [];
    const q = (fn: () => void, ms: number) => { tt.push(setTimeout(fn, ms)); };
    const base = 300; // starts immediately on mount — component only renders when tab is active
    let t = base;

    // Show cursor
    q(() => setShowCursor(true), t);

    // Step 1: cursor → ticker, type NVDA
    q(() => moveTo(refTicker), t);
    t += 300 + 100; // travel + land
    q(() => setFocusField('ticker'), t);
    q(() => setTickerText('N'), t + 80);
    q(() => setTickerText('NV'), t + 160);
    q(() => setTickerText('NVD'), t + 240);
    q(() => setTickerText('NVDA'), t + 320);
    t += 400;
    q(() => { setS(1); setFocusField(''); }, t);
    t += 150;

    // Step 2: date auto-fills
    q(() => setS(2), t);
    t += 200;

    // Step 3: cursor → DERIVATIVES pill
    q(() => moveTo(refDeriv), t);
    t += 300 + 100;
    q(() => setS(3), t);
    t += 150;

    // Step 4: cursor → strategy dropdown, open it
    q(() => moveTo(refStrategy), t);
    t += 300 + 100;
    q(() => { setFocusField('strategy'); setDropdownOpen(true); }, t);
    t += 250;
    // cursor → 0DTE Call item
    q(() => moveTo(refStratItem), t);
    t += 250 + 100;
    q(() => { setS(4); setDropdownOpen(false); setFocusField(''); }, t);
    t += 150;

    // Step 5: cursor → LONG pill
    q(() => moveTo(refLong), t);
    t += 300 + 100;
    q(() => setS(5), t);
    t += 150;

    // Step 6: cursor → contracts, type 10
    q(() => moveTo(refContracts), t);
    t += 300 + 100;
    q(() => setFocusField('contracts'), t);
    q(() => setContractsText('1'), t + 80);
    q(() => setContractsText('10'), t + 160);
    t += 250;
    q(() => setFocusField(''), t);
    t += 150;

    // Shift left column up to reveal lower fields
    q(() => setLeftShift(80), t);
    t += 100;

    // Step 7: cursor → entry price, type $3.87
    q(() => moveTo(refEntry), t);
    t += 400 + 100; // slightly longer for column shift
    q(() => setFocusField('entry'), t);
    q(() => setEntryText('$'), t + 60);
    q(() => setEntryText('$3'), t + 120);
    q(() => setEntryText('$3.'), t + 180);
    q(() => setEntryText('$3.8'), t + 240);
    q(() => setEntryText('$3.87'), t + 300);
    t += 380;
    q(() => setFocusField(''), t);
    t += 150;

    // Step 8: cursor → exit price, type $4.26
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

    // Step 9: P/L + risk auto-calculate
    q(() => setS(9), t);
    t += 300;

    // Step 10: cursor → journal textarea (right column)
    q(() => moveTo(refJournal), t);
    t += 400 + 100; // cross-column travel
    q(() => { setFocusField('journal'); setS(10); }, t);
    for (let i = 0; i < journalFull.length; i++) {
      q(() => setJournalText(journalFull.slice(0, i + 1)), t + 50 + i * 25);
    }
    t += 50 + journalFull.length * 25 + 100;
    q(() => setFocusField(''), t);
    t += 150;

    // Step 11: cursor → screenshot area, file picker animation
    q(() => moveTo(refScreenshot), t);
    t += 300 + 100;
    q(() => setShowFilePicker(true), t); // show mock file picker
    t += 400;
    q(() => { setShowFilePicker(false); setShowScreenshot(true); setS(11); }, t); // pick file → image loads
    t += 300;

    // Step 12: cursor → Log Trade button
    q(() => moveTo(refBtn), t);
    t += 300 + 200; // travel + longer pause before click
    q(() => { setBtnScale(0.95); setBtnClicked(true); setFocusField('btn'); }, t);
    q(() => setBtnScale(1), t + 150);
    t += 500; // wait for click animation to complete

    // Step 13: advance carousel
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

    {/* Green cursor */}
    {showCursor && (
      <div style={{ position: 'absolute', top: cursorPos.top, left: cursorPos.left, zIndex: 20, transition: 'top 0.3s cubic-bezier(0.25,0.1,0.25,1), left 0.3s cubic-bezier(0.25,0.1,0.25,1)', pointerEvents: 'none' }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="#00d4a0" style={{ filter: 'drop-shadow(0 0 6px rgba(0,212,160,0.5))' }}>
          <path d="M0 0 L0 12 L4 8 L8 13 L10 11 L6 6 L11 6 Z" />
        </svg>
      </div>
    )}

    <div style={{ display: 'flex', gap: 16 }}>
      {/* ═══ LEFT COLUMN — Trade Details ═══ */}
      <div style={{ flex: '0 0 55%', transform: `translateY(-${leftShift}px)`, transition: 'transform 0.8s ease' }}>
        <div style={{ color: teal, fontFamily: fd, fontSize: 14, fontWeight: 700, letterSpacing: 2, marginBottom: 8 }}>TRADE DETAILS</div>

        {/* Ticker */}
        <div style={lab}>TICKER</div>
        <div ref={refTicker} style={{ ...inp, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, borderColor: focusField === 'ticker' ? teal : '#2a2b32', transition: 'border-color 0.3s' }}>
          {s >= 1 && <img src="https://logo.clearbit.com/nvidia.com" alt="" width={16} height={16} style={{ borderRadius: 3, opacity: s >= 1 ? 1 : 0, transition: 'opacity 0.2s' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
          <span>{tickerText}</span>
          {tickerText.length > 0 && s < 1 && <span style={{ color: teal, animation: 'blink 1s step-end infinite' }}>|</span>}
        </div>

        {/* Date */}
        <div style={lab}>DATE</div>
        <div style={{ ...inp, marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: s >= 2 ? 1 : 0.3, transition: 'opacity 0.2s' }}>
          <span>{s >= 2 ? '04/03/2026' : ''}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
        </div>

        {/* Position Type */}
        <div style={lab}>POSITION TYPE</div>
        <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
          <div style={{ flex: 1, padding: '4px 0', borderRadius: 4, fontSize: 11, fontFamily: fm, fontWeight: 700, textAlign: 'center', background: derivSelected ? '#1a1b22' : 'rgba(0,212,160,0.12)', border: derivSelected ? '1px solid #2a2b32' : '1px solid #00d4a0', color: derivSelected ? '#6b7280' : teal, transition: 'all 0.3s' }}>SHARES</div>
          <div ref={refDeriv} style={{ flex: 1, padding: '4px 0', borderRadius: 4, fontSize: 11, fontFamily: fm, fontWeight: 700, textAlign: 'center', background: derivSelected ? 'rgba(0,212,160,0.12)' : '#1a1b22', border: derivSelected ? '1px solid #00d4a0' : '1px solid #2a2b32', color: derivSelected ? teal : '#6b7280', transition: 'all 0.3s' }}>DERIVATIVES</div>
        </div>

        {/* Strategy Type */}
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

        {/* Direction */}
        <div style={lab}>DIRECTION</div>
        <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
          <div ref={refLong} style={{ flex: 1, padding: '4px 0', borderRadius: 4, fontSize: 11, fontFamily: fm, fontWeight: 700, textAlign: 'center', background: longSelected ? 'rgba(0,212,160,0.12)' : '#1a1b22', border: longSelected ? '1px solid #00d4a0' : '1px solid #2a2b32', color: longSelected ? teal : '#6b7280', transition: 'all 0.3s' }}>LONG</div>
          <div style={{ flex: 1, padding: '4px 0', borderRadius: 4, fontSize: 11, fontFamily: fm, fontWeight: 700, textAlign: 'center', background: '#1a1b22', border: '1px solid #2a2b32', color: '#6b7280' }}>SHORT</div>
        </div>

        {/* Contracts + P/L */}
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

        {/* Entry + Exit */}
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

        {/* Risk + Risk:Reward */}
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

      {/* ═══ RIGHT COLUMN — Journal + Screenshot ═══ */}
      <div style={{ flex: '0 0 42%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ color: teal, fontFamily: fd, fontSize: 12, fontWeight: 700, letterSpacing: 2, marginBottom: 4 }}>JOURNAL ENTRY</div>
        <div ref={refJournal} style={{ ...inp, minHeight: 80, lineHeight: 1.5, color: '#d1d5db', marginBottom: 8, borderColor: focusField === 'journal' ? teal : '#2a2b32', transition: 'border-color 0.3s' }}>
          {showJournal ? journalText : <span style={{ color: '#6b7280' }}>Share your brief approach on this trade for the WickCoach AI to analyze...</span>}
          {showJournal && journalText.length < journalFull.length && <span style={{ color: teal, animation: 'blink 1s step-end infinite' }}>|</span>}
        </div>

        <div style={{ color: teal, fontFamily: fd, fontSize: 12, fontWeight: 700, letterSpacing: 2, marginBottom: 4 }}>SCREENSHOT</div>
        <div ref={refScreenshot} style={{ border: '2px dashed #2a2b32', borderRadius: 6, minHeight: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginBottom: 8, overflow: 'hidden', position: 'relative' }}>
          {/* Mock file picker overlay */}
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

function MockPastTrades({ onAdvance }: { onAdvance?: () => void }) {
  React.useEffect(() => {
    if (!onAdvance) return;
    const t = setTimeout(onAdvance, 5000);
    return () => clearTimeout(t);
  }, [onAdvance]);
  const mockRows = [
    { ticker: 'AMZN', date: '3/29/26', time: '12:27 PM', strategy: 'Put Scalp', direction: 'SHORT', qty: 13, entry: '$8.56', exit: '$7.69', pl: '+$1,132.50', rr: '1 : 2.5', result: 'WIN', notes: 'Halt trade setup con...' },
    { ticker: 'NVDA', date: '3/29/26', time: '12:49 PM', strategy: 'Put Scalp', direction: 'LONG', qty: 14, entry: '$4.88', exit: '$5.65', pl: '+$1,082', rr: '1 : 2', result: 'WIN', notes: 'Power bar off VWAP p...' },
    { ticker: 'NFLX', date: '3/29/26', time: '9:23 AM', strategy: '0DTE Put', direction: 'SHORT', qty: 3, entry: '$8.13', exit: '$9.67', pl: '-$463', rr: '1 : 0.9', result: 'LOSS', notes: 'Color change on the ...' },
    { ticker: 'META', date: '3/29/26', time: '2:49 PM', strategy: '0DTE Call', direction: 'SHORT', qty: 8, entry: '$1.58', exit: '$0.01', pl: '+$1,276.50', rr: '1 : 2.3', result: 'WIN', notes: 'Halt trade setup con...' },
    { ticker: 'AMD', date: '3/26/26', time: '9:18 AM', strategy: '0DTE Put', direction: 'SHORT', qty: 6, entry: '$6.03', exit: '$6.03', pl: '+$0', rr: '1 : 0.0', result: 'BE', notes: 'Took the trade on th...' },
    { ticker: 'AMD', date: '3/26/26', time: '9:40 AM', strategy: '0DTE Put', direction: 'LONG', qty: 10, entry: '$6.26', exit: '$7.55', pl: '+$1,285.20', rr: '1 : 2.7', result: 'WIN', notes: 'Halt trade setup con...' },
    { ticker: 'GOOGL', date: '3/26/26', time: '3:50 PM', strategy: '0DTE Call', direction: 'LONG', qty: 14, entry: '$10.36', exit: '$9.96', pl: '-$554', rr: '1 : 0.5', result: 'LOSS', notes: 'Revenge traded after...' },
    { ticker: 'COIN', date: '3/26/26', time: '10:01 AM', strategy: '0DTE Call', direction: 'LONG', qty: 6, entry: '$9.81', exit: '$11.49', pl: '+$1,005.40', rr: '1 : 2.2', result: 'WIN', notes: 'Halt trade setup con...' },
  ];
  const eqCurvePath = 'M0,55 C20,52 40,48 60,42 C80,38 100,40 140,32 C180,36 220,28 260,22 C300,26 340,18 380,14 C420,18 460,12 500,8 C540,10 580,6 620,4 C650,5 680,3 700,2';
  const eqFillPath = eqCurvePath + ' L700,70 L0,70 Z';
  const cardBorder = { borderTop: `3px solid ${teal}`, borderRight: '1px solid #2a2b32', borderBottom: '1px solid #2a2b32', borderLeft: '1px solid #2a2b32' };
  return (
    <div style={{ padding: 0, overflow: 'hidden' }}>
      {/* ── HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontFamily: fd, fontSize: 14, fontWeight: 700, color: teal }}>Past Trades</span>
            <span style={{ fontSize: 6, fontFamily: fm, color: '#0e0f14', background: teal, padding: '1px 4px', borderRadius: 2, fontWeight: 700, letterSpacing: 0.5 }}>LIVE</span>
          </div>
          <div style={{ fontFamily: fm, fontSize: 7, color: '#6b7280', marginTop: 2 }}>Analyze, review, and backtest your historical executions.</div>
        </div>
        <span style={{ fontFamily: fm, fontSize: 7, color: '#c9cdd4', padding: '3px 8px', borderRadius: 4, border: '1px solid #2a2b32', background: '#111218', display: 'flex', alignItems: 'center', gap: 3 }}>
          <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
          Export CSV
        </span>
      </div>

      {/* ── STAT CARDS + HLA ── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 8, alignItems: 'stretch' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 5, flex: 1 }}>
          {/* Total P/L */}
          <div style={{ background: '#13141a', ...cardBorder, borderRadius: 6, padding: '5px 7px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ fontFamily: fm, fontSize: 7, color: '#8a8d98', textTransform: 'uppercase' as const, letterSpacing: 0.6 }}>Total P/L</div>
            <div style={{ fontFamily: fd, fontSize: 13, fontWeight: 700, color: teal, marginTop: 1 }}>+$58,571.70</div>
            <svg width="100%" height="10" viewBox="0 0 100 10" preserveAspectRatio="none" style={{ display: 'block', marginTop: 2 }}>
              <defs><linearGradient id="mockSparkFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={teal} stopOpacity="0.15" /><stop offset="100%" stopColor={teal} stopOpacity="0" /></linearGradient></defs>
              <path d="M0,8 C15,7 30,6 45,5 C60,4 75,3 100,2 L100,10 L0,10 Z" fill="url(#mockSparkFill)" />
              <path d="M0,8 C15,7 30,6 45,5 C60,4 75,3 100,2" fill="none" stroke={teal} strokeWidth="1" />
            </svg>
          </div>
          {/* Win Rate */}
          <div style={{ background: '#13141a', ...cardBorder, borderRadius: 6, padding: '5px 7px' }}>
            <div style={{ fontFamily: fm, fontSize: 7, color: '#8a8d98', textTransform: 'uppercase' as const, letterSpacing: 0.6 }}>Win Rate</div>
            <div style={{ fontFamily: fd, fontSize: 13, fontWeight: 700, color: '#fff', marginTop: 1 }}>46%</div>
            <div style={{ display: 'flex', gap: 4, marginTop: 2, fontFamily: fm, fontSize: 7 }}>
              <span style={{ color: teal }}>92W</span>
              <span style={{ color: '#ef4444' }}>80L</span>
              <span style={{ color: '#f59e0b' }}>28E</span>
            </div>
            <div style={{ display: 'flex', height: 2, borderRadius: 1, overflow: 'hidden', marginTop: 2, background: '#1e1f2a' }}>
              <div style={{ width: '46%', background: teal }} />
              <div style={{ width: '40%', background: '#ef4444' }} />
            </div>
          </div>
          {/* Total Trades */}
          <div style={{ background: '#13141a', ...cardBorder, borderRadius: 6, padding: '5px 7px' }}>
            <div style={{ fontFamily: fm, fontSize: 7, color: '#8a8d98', textTransform: 'uppercase' as const, letterSpacing: 0.6 }}>Total Trades</div>
            <div style={{ fontFamily: fd, fontSize: 13, fontWeight: 700, color: '#fff', marginTop: 1 }}>200</div>
          </div>
          {/* Avg R:R */}
          <div style={{ background: '#13141a', ...cardBorder, borderRadius: 6, padding: '5px 7px' }}>
            <div style={{ fontFamily: fm, fontSize: 7, color: '#8a8d98', textTransform: 'uppercase' as const, letterSpacing: 0.6 }}>Avg R:R</div>
            <div style={{ fontFamily: fd, fontSize: 13, fontWeight: 700, color: '#fff', marginTop: 1 }}>1 : 2.2</div>
          </div>
          {/* Expected Value */}
          <div style={{ background: '#13141a', ...cardBorder, borderRadius: 6, padding: '5px 7px' }}>
            <div style={{ fontFamily: fm, fontSize: 7, color: '#8a8d98', textTransform: 'uppercase' as const, letterSpacing: 0.6 }}>Expected Value</div>
            <div style={{ fontFamily: fd, fontSize: 13, fontWeight: 700, color: teal, marginTop: 1 }}>+$221.39</div>
            <div style={{ fontFamily: fm, fontSize: 7, color: '#8a8d98', marginTop: 1 }}>Per trade</div>
          </div>
        </div>
        {/* HIGH-LEVEL ANALYSIS icon */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, flexShrink: 0, paddingLeft: 4 }}>
          <div style={{ fontFamily: fm, fontSize: 7, color: teal, textTransform: 'uppercase' as const, letterSpacing: 1.5, textAlign: 'center', lineHeight: 1.2, fontWeight: 700 }}>HIGH-LEVEL<br/>ANALYSIS</div>
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: `1.5px solid #ffffff`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', boxShadow: '0 0 12px rgba(0,212,160,0.2)' }}>
            <svg width="14" height="24" viewBox="0 0 20 24" fill="none">
              <circle cx="8" cy="4" r="2.8" stroke={teal} strokeWidth="1.2" fill="none" />
              <line x1="8" y1="6.8" x2="8" y2="15" stroke={teal} strokeWidth="1.2" />
              <line x1="8" y1="9.5" x2="3" y2="13" stroke={teal} strokeWidth="1.2" />
              <line x1="8" y1="9.5" x2="14.5" y2="6" stroke={teal} strokeWidth="1.2" />
              <line x1="8" y1="15" x2="4.5" y2="21" stroke={teal} strokeWidth="1.2" />
              <line x1="8" y1="15" x2="11.5" y2="21" stroke={teal} strokeWidth="1.2" />
              <rect x="13.5" y="4" width="4" height="5" rx="0.5" fill={teal} opacity="0.9" />
              <line x1="15.5" y1="2" x2="15.5" y2="12" stroke={teal} strokeWidth="0.8" />
            </svg>
          </div>
        </div>
      </div>

      {/* ── EQUITY CURVE ── */}
      <div style={{ background: '#13141a', border: '1px solid #1e1f2a', borderRadius: 6, padding: '6px 8px', marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
            <span style={{ fontFamily: fd, fontSize: 9, fontWeight: 700, color: '#e8e8f0' }}>Equity Curve</span>
          </div>
          <div style={{ display: 'flex', gap: 2 }}>
            {['1D', '1W', '1M', '3M', 'YTD'].map(p => (
              <span key={p} style={{ fontFamily: fm, fontSize: 6, padding: '1px 4px', borderRadius: 3, background: p === 'YTD' ? 'rgba(0,212,160,0.12)' : 'transparent', color: p === 'YTD' ? teal : '#8a8d98', border: p === 'YTD' ? '1px solid rgba(0,212,160,0.3)' : '1px solid transparent', fontWeight: 600 }}>{p}</span>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex' }}>
          {/* Y-axis labels */}
          <div style={{ width: 30, flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingRight: 3, height: 55 }}>
            {['+$58.6k', '+$43.8k', '+$29.0k', '+$14.3k', '$-519'].map((l, i) => (
              <span key={i} style={{ fontFamily: fm, fontSize: 5, color: '#8a8d98', textAlign: 'right', lineHeight: 1 }}>{l}</span>
            ))}
          </div>
          {/* Chart */}
          <div style={{ flex: 1 }}>
            <svg width="100%" height="55" viewBox="0 0 700 70" preserveAspectRatio="none" style={{ display: 'block' }}>
              {[18, 35, 52].map(y => <line key={y} x1="0" y1={y} x2="700" y2={y} stroke="#1a1b22" strokeWidth="1" />)}
              <defs><linearGradient id="mockEqFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={teal} stopOpacity="0.12" /><stop offset="100%" stopColor={teal} stopOpacity="0" /></linearGradient></defs>
              <path d={eqFillPath} fill="url(#mockEqFill)" />
              <path d={eqCurvePath} fill="none" stroke={teal} strokeWidth="2" />
            </svg>
          </div>
        </div>
        {/* X-axis labels */}
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: 30, marginTop: 2 }}>
          {['Jan 1', 'Jan 25', 'Feb 15', 'Mar 8', 'Mar 29'].map(d => (
            <span key={d} style={{ fontFamily: fm, fontSize: 5, color: '#8a8d98' }}>{d}</span>
          ))}
        </div>
      </div>

      {/* ── FILTER BAR ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6, flexWrap: 'wrap' as const }}>
        {/* Search */}
        <div style={{ position: 'relative' }}>
          <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" style={{ position: 'absolute', left: 5, top: '50%', transform: 'translateY(-50%)' }}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <div style={{ fontFamily: fm, fontSize: 7, color: '#6b7280', background: '#0e0f14', border: '1px solid #2a2b32', borderRadius: 4, padding: '3px 6px 3px 15px', width: 90 }}>Search Ticker (e.g.</div>
        </div>
        {/* Strategy dropdown */}
        <div style={{ fontFamily: fm, fontSize: 7, color: '#c9cdd4', background: '#0e0f14', border: '1px solid #2a2b32', borderRadius: 4, padding: '3px 10px 3px 6px', display: 'flex', alignItems: 'center', gap: 3, position: 'relative' }}>
          <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
          Strategy: All
          <span style={{ color: teal, fontSize: 6, marginLeft: 2 }}>▼</span>
        </div>
        {/* Result pills */}
        <div style={{ display: 'flex', gap: 2, background: '#111218', borderRadius: 4, padding: 1, border: '1px solid #1e1f2a' }}>
          {([['All Trades', teal, true], ['Wins', teal, false], ['Losses', '#ef4444', false], ['Break Even', '#f59e0b', false]] as [string, string, boolean][]).map(([label, dotColor, active]) => (
            <span key={label} style={{ fontFamily: fm, fontSize: 6, fontWeight: 600, padding: '2px 5px', borderRadius: 3, display: 'flex', alignItems: 'center', gap: 2, background: active ? 'rgba(0,212,160,0.1)' : 'transparent', border: active ? '1px solid rgba(0,212,160,0.3)' : '1px solid transparent', color: active ? teal : '#6b7280' }}>
              <span style={{ width: 3, height: 3, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
              {label}
            </span>
          ))}
        </div>
        {/* Date range — pushed right */}
        <div style={{ display: 'flex', gap: 2, marginLeft: 'auto', alignItems: 'center' }}>
          <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
          <div style={{ fontFamily: fm, fontSize: 7, color: '#c9cdd4', background: '#0e0f14', border: '1px solid #2a2b32', borderRadius: 4, padding: '3px 10px 3px 6px', position: 'relative' }}>
            Last 30 Days
            <span style={{ color: teal, fontSize: 6, marginLeft: 3 }}>▼</span>
          </div>
        </div>
      </div>

      {/* ── TRADE TABLE ── */}
      <div style={{ background: '#111218', border: '1px solid #2a2b32', borderRadius: 6, overflow: 'hidden', boxShadow: '0 0 20px rgba(0,212,160,0.03)' }}>
        {/* Header row */}
        <div style={{ display: 'grid', gridTemplateColumns: '52px 48px 46px 56px 44px 24px 68px 62px 40px 32px 1fr', background: '#0e0f14', borderBottom: '2px solid #2a2b32' }}>
          {['ASSET', 'DATE', 'TIME', 'STRATEGY', 'DIRECTION', 'QTY', 'ENTRY/EXIT', 'NET P/L', 'R:R', 'IMAGE', 'NOTES'].map((h, hi) => (
            <span key={h} style={{ fontFamily: fm, fontSize: 6, color: '#9ca3af', textTransform: 'uppercase' as const, letterSpacing: 0.8, fontWeight: 600, padding: '5px 3px', borderRight: hi < 10 ? '1px solid #1e1f2a' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', whiteSpace: 'nowrap' as const }}>{h}</span>
          ))}
        </div>
        {/* Data rows */}
        {mockRows.map((r, i) => {
          const rowBg = i % 2 === 0 ? '#111218' : '#151620';
          const plColor = r.result === 'WIN' ? teal : r.result === 'LOSS' ? '#ef4444' : '#f59e0b';
          return (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '52px 48px 46px 56px 44px 24px 68px 62px 40px 32px 1fr', background: rowBg, borderBottom: '1px solid #2a2b32', alignItems: 'center', fontFamily: fm, fontSize: 7, color: '#e8e8f0' }}>
              {/* Asset */}
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, padding: '4px 2px', borderRight: '1px solid #1e1f2a', overflow: 'hidden' }}>
                <TBadge ticker={r.ticker} />
                <span style={{ fontWeight: 700, fontSize: 7 }}>{r.ticker}</span>
              </span>
              {/* Date */}
              <span style={{ color: '#c9cdd4', fontSize: 7, padding: '4px 2px', borderRight: '1px solid #1e1f2a', display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap' as const }}>{r.date}</span>
              {/* Time */}
              <span style={{ color: '#9ca3af', fontSize: 7, padding: '4px 2px', borderRight: '1px solid #1e1f2a', display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap' as const }}>{r.time}</span>
              {/* Strategy */}
              <span style={{ color: '#c9cdd4', fontSize: 7, padding: '4px 2px', borderRight: '1px solid #1e1f2a', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{r.strategy}</span>
              {/* Direction */}
              <span style={{ padding: '4px 2px', borderRight: '1px solid #1e1f2a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ padding: '1px 4px', borderRadius: 2, fontSize: 6, fontWeight: 700, background: r.direction === 'LONG' ? 'rgba(0,212,160,0.15)' : 'rgba(239,68,68,0.15)', color: r.direction === 'LONG' ? teal : '#ef4444' }}>{r.direction}</span>
              </span>
              {/* Qty */}
              <span style={{ fontSize: 7, padding: '4px 2px', borderRight: '1px solid #1e1f2a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{r.qty}</span>
              {/* Entry/Exit */}
              <span style={{ color: '#c9cdd4', fontSize: 6, padding: '4px 2px', borderRight: '1px solid #1e1f2a', display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap' as const, overflow: 'hidden' }}>{r.entry} → {r.exit}</span>
              {/* Net P/L */}
              <span style={{ color: plColor, fontWeight: 700, fontSize: 7, padding: '4px 2px', borderRight: '1px solid #1e1f2a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{r.pl}</span>
              {/* R:R */}
              <span style={{ color: '#c9cdd4', fontSize: 7, padding: '4px 2px', borderRight: '1px solid #1e1f2a', display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap' as const }}>{r.rr}</span>
              {/* Image */}
              <span style={{ color: '#3a3b42', fontSize: 7, padding: '4px 2px', borderRight: '1px solid #1e1f2a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>—</span>
              {/* Notes */}
              <span style={{ color: '#9ca3af', fontSize: 7, padding: '4px 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{r.notes}</span>
            </div>
          );
        })}
      </div>
      {/* Pagination */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '5px 0', marginTop: 3 }}>
        <span style={{ fontFamily: fm, fontSize: 7, color: teal, fontWeight: 600 }}>← Previous</span>
        <span style={{ fontFamily: fm, fontSize: 7, color: '#8a8d98' }}>Showing 1-8 of 200 trades</span>
        <span style={{ fontFamily: fm, fontSize: 7, color: teal, fontWeight: 600 }}>Next →</span>
      </div>
    </div>
  );
}


function MockTradingGoalsInner({ goalSet, onAdvance, frozen = true }: { goalSet: { week: string; goals: { text: string; status: string; statusText: string }[]; aiBullets: string; followUp: string }; onAdvance?: () => void; frozen?: boolean }) {
  const [displayedText, setDisplayedText] = useState('');
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [answer, setAnswer] = useState('');

  const fullText = goalSet.aiBullets;

  React.useEffect(() => {
    if (frozen) return;
    let i = 0;
    let typingTimer: ReturnType<typeof setInterval>;
    const delayTimer = setTimeout(() => {
      setIsTyping(true);
      typingTimer = setInterval(() => {
        if (i < fullText.length) {
          setDisplayedText(fullText.slice(0, i + 1));
          i++;
        } else {
          clearInterval(typingTimer);
          setIsTyping(false);
          setIsThinking(true);
          setTimeout(() => {
            setIsThinking(false);
            setShowFollowUp(true);
            if (onAdvance) setTimeout(onAdvance, 2000);
          }, 2000);
        }
      }, 18);
    }, 2000);
    return () => {
      clearTimeout(delayTimer);
      if (typingTimer) clearInterval(typingTimer);
    };
  }, [frozen, fullText]);

  const renderedBullets = displayedText.split('\n').filter(l => l.length > 0);
  const aiAnimating = !frozen && (isTyping || isThinking);

  const statusColors: Record<string, { fill: string; stroke: string; textColor: string }> = {
    complete: { fill: '#00d4a0', stroke: '#00d4a0', textColor: '#00d4a0' },
    progress: { fill: 'none', stroke: '#eab308', textColor: '#eab308' },
    missed: { fill: 'none', stroke: '#ef4444', textColor: '#ef4444' },
  };

  return (
    <div style={{ display: 'flex', gap: 20, padding: 0, height: '100%', overflow: 'hidden' }}>
      {/* LEFT COLUMN */}
      <div style={{ flex: '0 0 58%', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontFamily: fd, color: '#fff', fontSize: 20, fontWeight: 700 }}>Trader Stated Goals</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <span style={{ padding: '4px 14px', borderRadius: 6, fontSize: 11, fontFamily: fm, fontWeight: 700, background: 'rgba(0,212,160,0.15)', border: '1px solid #00d4a0', color: '#00d4a0' }}>Week</span>
            <span style={{ padding: '4px 14px', borderRadius: 6, fontSize: 11, fontFamily: fm, fontWeight: 700, background: '#1a1b22', border: '1px solid #1a1b22', color: '#6b7280' }}>Month</span>
          </div>
        </div>
        <div style={{ fontFamily: fm, color: '#ffffff', fontSize: 14, marginTop: 10, marginBottom: 18 }}>{goalSet.week}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {goalSet.goals.map((goal, gi) => {
            const sc = statusColors[goal.status] || statusColors.progress;
            return (
              <div key={gi} style={{ background: 'linear-gradient(135deg, rgba(0,212,160,0.04), rgba(0,212,160,0.01))', border: '1px solid rgba(0,212,160,0.15)', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <svg width="22" height="22" viewBox="0 0 22 22" style={{ flexShrink: 0, marginTop: 1 }}>
                  {goal.status === 'complete' ? (
                    <><circle cx="11" cy="11" r="10" fill={sc.fill} /><path d="M7 11l3 3 5-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" /></>
                  ) : (
                    <circle cx="11" cy="11" r="9.5" fill="none" stroke={sc.stroke} strokeWidth="2" />
                  )}
                </svg>
                <div>
                  <div style={{ fontFamily: fm, color: '#ffffff', fontSize: 13, fontWeight: 500 }}>{goal.text}</div>
                  <div style={{ fontFamily: fm, color: sc.textColor, fontSize: 11, marginTop: 4 }}>{goal.statusText}</div>
                </div>
              </div>
            );
          })}
        </div>
        {/* Scan line — only animates when NOT frozen */}
        {!frozen && <div style={{ position: 'absolute', left: 0, width: '100%', height: 2, background: 'linear-gradient(90deg, transparent, #00d4a0, transparent)', boxShadow: '0 0 20px rgba(0,212,160,0.4)', animation: 'goalScan 4s ease-in-out infinite', zIndex: 2, pointerEvents: 'none' }} />}
        {/* Sparkles — only render when NOT frozen */}
        {!frozen && [{l:'12%',t:'22%',d:'0s'},{l:'45%',t:'38%',d:'0.4s'},{l:'78%',t:'28%',d:'0.8s'},{l:'30%',t:'58%',d:'1.2s'},{l:'65%',t:'72%',d:'1.6s'},{l:'88%',t:'52%',d:'2s'}].map((s, i) => (
          <div key={i} style={{ position: 'absolute', left: s.l, top: s.t, width: 4, height: 4, borderRadius: '50%', background: '#00d4a0', animation: 'sparkle 2s ease-in-out infinite', animationDelay: s.d, pointerEvents: 'none' }} />
        ))}
      </div>
      {/* RIGHT COLUMN */}
      <div style={{ flex: '0 0 38%', transform: showFollowUp ? 'translateY(-120px)' : 'translateY(0)', transition: 'transform 0.8s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, animation: aiAnimating ? 'aiPulse 1.5s ease-in-out infinite' : 'none' }}>
          <Logo size={16} />
          <span style={{ fontFamily: fm, fontSize: 12, fontWeight: 700, color: '#00d4a0', letterSpacing: 1 }}>WickCoach AI</span>
        </div>
        <div style={{ background: '#1a1b22', border: '1px solid #232430', borderRadius: 10, padding: 16, marginTop: 12, minHeight: 120 }}>
          <div style={{ fontFamily: fm, color: '#d1d5db', fontSize: 13, lineHeight: '1.7', fontStyle: 'italic' }}>
            {renderedBullets.map((line, idx) => (
              <div key={idx} style={{ marginBottom: idx < renderedBullets.length - 1 ? 10 : 0 }}>
                {line.startsWith('\u2022') ? <><span style={{ color: '#00d4a0' }}>{'\u2022'}</span>{line.slice(1)}</> : line}
              </div>
            ))}
            {isTyping && <span style={{ animation: 'blink 1s step-end infinite', color: '#00d4a0' }}>|</span>}
          </div>
          {isThinking && (
            <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00d4a0', animation: 'thinkDot 1.2s ease-in-out infinite', animationDelay: '0s' }} />
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00d4a0', animation: 'thinkDot 1.2s ease-in-out infinite', animationDelay: '0.3s' }} />
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00d4a0', animation: 'thinkDot 1.2s ease-in-out infinite', animationDelay: '0.6s' }} />
            </div>
          )}
        </div>
        <div style={{ opacity: showFollowUp ? 1 : 0, transition: 'opacity 0.6s ease', pointerEvents: showFollowUp ? 'auto' : 'none' }}>
          <div style={{ background: 'rgba(0,212,160,0.05)', border: '1px solid rgba(0,212,160,0.2)', borderRadius: 8, padding: 10, marginTop: 10 }}>
            <div style={{ fontFamily: fm, fontSize: 10, fontWeight: 700, color: '#00d4a0', letterSpacing: 1, marginBottom: 8 }}>FOLLOW-UP</div>
            <div style={{ fontFamily: fm, color: '#c9cdd4', fontSize: 13, lineHeight: '1.6' }}>{goalSet.followUp}</div>
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') setAnswer(''); }}
              placeholder="Type your answer..."
              style={{ background: '#13141a', border: '1px solid #232430', borderRadius: 6, padding: '8px 10px', color: '#ffffff', fontSize: 13, fontFamily: fm, width: '100%', outline: 'none', marginTop: 10, boxSizing: 'border-box' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#00d4a0'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#232430'; }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function MockTradingGoals({ onAdvance, frozen = true }: { onAdvance?: () => void; frozen?: boolean }) {
  const goalSets = [
    {
      week: "Week of Mar 17 \u2013 Mar 21",
      goals: [
        { text: "Limit to 3 trades per day \u2014 no exceptions", status: "complete", statusText: "Completed \u2014 hit 5/5 days" },
        { text: "Wait 15 min after open before first entry", status: "progress", statusText: "In progress \u2014 hit 3/5 days" },
        { text: "Journal every trade within 10 minutes of closing", status: "missed", statusText: "Missed \u2014 0/5 days completed" },
      ],
      aiBullets: "\u2022 3-trade limit \u2014 Clear. I\u2019ll flag any 4th entry and pull up what you journaled before it.\n\n\u2022 15-min wait \u2014 Noted. I\u2019ll track your first entry time each day against this rule.\n\n\u2022 Journal within 10 min \u2014 I\u2019ll track the gap between your close and your entry timestamp.",
      followUp: "On the 15-minute rule \u2014 are you avoiding first-candle volatility, or giving yourself time to read the open before reacting? This changes what I watch for in your journal.",
    },
    {
      week: "Week of Mar 24 \u2013 Mar 28",
      goals: [
        { text: "No revenge trades \u2014 if I lose, I wait 30 min", status: "progress", statusText: "In progress \u2014 broke rule once on Wednesday" },
        { text: "Risk no more than 1.5% per trade", status: "complete", statusText: "Completed \u2014 stayed under on all 7 trades" },
        { text: "Review previous day\u2019s journal before trading", status: "complete", statusText: "Completed \u2014 5/5 days" },
      ],
      aiBullets: "\u2022 No revenge trades \u2014 This is your highest-leverage goal. I\u2019ll watch for multiple entries within 30 minutes of a loss.\n\n\u2022 1.5% risk cap \u2014 Clean. I\u2019ll compare your actual position sizes to this threshold every trade.\n\n\u2022 Morning journal review \u2014 I\u2019ll look for patterns in how your first trade changes on days you review vs days you skip.",
      followUp: "On the revenge trade rule \u2014 when you broke it Wednesday, what were you feeling right before the second entry? Understanding the trigger matters more than the rule itself.",
    },
    {
      week: "Week of Mar 31 \u2013 Apr 4",
      goals: [
        { text: "Only trade setups from my watchlist \u2014 no improvising", status: "missed", statusText: "Missed \u2014 3 off-watchlist trades this week" },
        { text: "Take profits at first target \u2014 no hoping for more", status: "progress", statusText: "In progress \u2014 held past target twice" },
        { text: "End trading by 2pm \u2014 no afternoon session", status: "complete", statusText: "Completed \u2014 shut down by 2pm every day" },
      ],
      aiBullets: "\u2022 Watchlist only \u2014 3 off-list trades is a pattern. I\u2019ll track which tickers pull you off your plan.\n\n\u2022 Take profits at target \u2014 Held past target twice. I\u2019ll check your journal for what you wrote in those moments.\n\n\u2022 Done by 2pm \u2014 Perfect compliance. Your afternoon discipline is strong.",
      followUp: "The 3 off-watchlist trades \u2014 were they all the same ticker or different ones? If it\u2019s the same name pulling you in, that\u2019s not a discipline issue, it\u2019s an obsession. Different problem, different fix.",
    },
  ];

  const [goalSetIndex, setGoalSetIndex] = useState(0);
  const [refreshHover, setRefreshHover] = useState(false);

  return (<div style={{ position: 'relative' }}>
    <style>{`
      @keyframes goalScan {
        0% { top: 5%; opacity: 0; }
        15% { opacity: 1; }
        85% { opacity: 1; }
        100% { top: 90%; opacity: 0; }
      }
      @keyframes blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0; }
      }
      @keyframes sparkle {
        0%, 100% { opacity: 0; transform: scale(0.5); }
        50% { opacity: 1; transform: scale(1.3); }
      }
      @keyframes aiPulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      @keyframes thinkDot {
        0%, 100% { opacity: 0.2; }
        50% { opacity: 1; }
      }
    `}</style>
    {/* Refresh button */}
    <div
      onClick={() => setGoalSetIndex(prev => (prev + 1) % goalSets.length)}
      onMouseEnter={() => setRefreshHover(true)}
      onMouseLeave={() => setRefreshHover(false)}
      style={{ position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: '50%', background: refreshHover ? 'rgba(0,212,160,0.2)' : 'rgba(0,212,160,0.1)', border: '1px solid rgba(0,212,160,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5, transition: 'background 0.2s' }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00d4a0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 4 23 10 17 10" />
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
      </svg>
    </div>
    <MockTradingGoalsInner key={goalSetIndex} goalSet={goalSets[goalSetIndex]} onAdvance={onAdvance} frozen={frozen} />
  </div>);
}

function MockAnalysis() {
  return (<div style={{ display: "flex", gap: 20 }}>
    <div style={{ flex: 1 }}>
      <div style={{ background: "#0e0f14", border: "1px solid #1a1b22", borderRadius: 10, padding: "14px", marginBottom: 10 }}><span style={{ color: "#9ca3af", fontFamily: fm, fontSize: 13 }}>Why do I keep losing on Fridays?</span></div>
      <div style={{ background: "rgba(0,212,160,0.04)", border: "1px solid rgba(0,212,160,0.1)", borderRadius: 10, padding: "14px", display: "flex", gap: 10 }}><Logo size={16} /><span style={{ color: "#b8d0c4", fontFamily: fm, fontSize: 13, lineHeight: 1.6 }}>Looking at your last 8 Friday trades, 6 were taken in the first 10 minutes. Your weekday entries average 25 minutes after open. Friday urgency is costing you &mdash; you&apos;re trading the week&apos;s emotions, not Friday&apos;s chart.</span></div>
    </div>
    <div style={{ width: 180, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ background: "#0e0f14", border: "1px solid #1a1b22", borderRadius: 10, padding: "16px", textAlign: "center" }}><div style={{ color: "#6b7280", fontFamily: fm, fontSize: 11, marginBottom: 6 }}>Friday Win Rate</div><div style={{ color: "#ef4444", fontFamily: fm, fontSize: 24, fontWeight: 800 }}>25%</div></div>
      <div style={{ background: "#0e0f14", border: "1px solid #1a1b22", borderRadius: 10, padding: "16px", textAlign: "center" }}><div style={{ color: "#6b7280", fontFamily: fm, fontSize: 11, marginBottom: 6 }}>Mon-Thu Win Rate</div><div style={{ color: teal, fontFamily: fm, fontSize: 24, fontWeight: 800 }}>64%</div></div>
    </div>
  </div>);
}

function MockTraderProfile() {
  const cx2 = 120, cy2 = 110, mR2 = 80;
  const sc = [93, 85, 90, 91, 78];
  const ang2 = sc.map((_, i) => (i * 2 * Math.PI) / 5 - Math.PI / 2);
  const pts = sc.map((s, i) => `${cx2 + mR2 * (s / 100) * Math.cos(ang2[i])},${cy2 + mR2 * (s / 100) * Math.sin(ang2[i])}`).join(" ");
  const ptsFull = [100,100,100,100,100].map((s, i) => `${cx2 + mR2 * (s / 100) * Math.cos(ang2[i])},${cy2 + mR2 * (s / 100) * Math.sin(ang2[i])}`).join(" ");
  return (<div style={{ textAlign: "center" }}>
    <svg width="240" height="240" viewBox="0 0 240 240"><polygon points={ptsFull} fill="none" stroke="#1a1b22" strokeWidth="1" /><polygon points={pts} fill="rgba(0,212,160,0.1)" stroke={teal} strokeWidth="2" /></svg>
    <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 16 }}>{[{ l: "142 trades", v: "logged" }, { l: "58%", v: "win rate" }, { l: "1.8", v: "avg R:R" }].map((s, i) => (<div key={i} style={{ background: "#0e0f14", border: "1px solid #1a1b22", borderRadius: 8, padding: "12px 20px", textAlign: "center" }}><div style={{ color: "#fff", fontFamily: fm, fontSize: 16, fontWeight: 700 }}>{s.l}</div><div style={{ color: "#6b7280", fontFamily: fm, fontSize: 11 }}>{s.v}</div></div>))}</div>
    <div style={{ color: "#6b7280", fontFamily: fm, fontSize: 12, marginTop: 14 }}>Trading since: Oct 2025</div>
  </div>);
}

function MockPositionSizer() {
  const is = { background: "#0e0f14", border: "1px solid #1a1b22", borderRadius: 8, padding: "10px 12px", color: "#fff", fontFamily: fm, fontSize: 13, width: "100%" };
  return (<div>
    <div style={{ display: "flex", gap: 12, marginBottom: 12 }}><div style={{ flex: 1 }}><div style={{ color: "#9ca3af", fontFamily: fm, fontSize: 11, marginBottom: 4 }}>Account Balance</div><div style={is}>$25,000</div></div><div style={{ flex: 1 }}><div style={{ color: "#9ca3af", fontFamily: fm, fontSize: 11, marginBottom: 4 }}>Risk per Trade</div><div style={is}>2%</div></div></div>
    <div style={{ display: "flex", gap: 12, marginBottom: 20 }}><div style={{ flex: 1 }}><div style={{ color: "#9ca3af", fontFamily: fm, fontSize: 11, marginBottom: 4 }}>Entry Price</div><div style={is}>$485.00</div></div><div style={{ flex: 1 }}><div style={{ color: "#9ca3af", fontFamily: fm, fontSize: 11, marginBottom: 4 }}>Stop Loss</div><div style={is}>$480.00</div></div></div>
    <div style={{ background: "rgba(0,212,160,0.06)", border: "1px solid rgba(0,212,160,0.15)", borderRadius: 10, padding: "20px", textAlign: "center" }}><div style={{ color: teal, fontFamily: fm, fontSize: 11, letterSpacing: 1, marginBottom: 8 }}>RESULT</div><div style={{ color: "#fff", fontFamily: fd, fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Position Size: 100 shares</div><div style={{ color: "#9ca3af", fontFamily: fm, fontSize: 14 }}>Risk Amount: $500</div></div>
  </div>);
}

function MockGrowthSimulator() {
  return (<div>
    <svg viewBox="0 0 400 200" style={{ width: "100%", height: 200 }}>
      <line x1="40" y1="180" x2="380" y2="180" stroke="#1a1b22" strokeWidth="1" />
      <line x1="40" y1="10" x2="40" y2="180" stroke="#1a1b22" strokeWidth="1" />
      <polyline points="40,170 80,155 120,140 160,130 200,110 240,95 280,75 320,55 360,30" fill="none" stroke={teal} strokeWidth="2.5" />
      <polyline points="40,170 80,165 120,162 160,158 200,155 240,150 280,148 320,144 360,140" fill="none" stroke="#6b7280" strokeWidth="1.5" strokeDasharray="4 4" />
      {["1","3","6","9","12"].map((m, i) => <text key={i} x={40 + i * 80} y={196} fill="#6b7280" fontSize="10" fontFamily={fm} textAnchor="middle">Mo {m}</text>)}
    </svg>
    <div style={{ display: "flex", gap: 12, marginTop: 16 }}>{[{ l: "$10,000", v: "Starting" }, { l: "$18,400", v: "Projected 12mo" }, { l: "5.2%", v: "Monthly Return" }].map((s, i) => (<div key={i} style={{ flex: 1, background: "#0e0f14", border: "1px solid #1a1b22", borderRadius: 8, padding: "12px", textAlign: "center" }}><div style={{ color: "#fff", fontFamily: fm, fontSize: 16, fontWeight: 700 }}>{s.l}</div><div style={{ color: "#6b7280", fontFamily: fm, fontSize: 11 }}>{s.v}</div></div>))}</div>
  </div>);
}

function MockTradeTimeline() {
  const days = ["Mon","Tue","Wed","Thu","Fri"];
  const weeks = [["+$340","-$220","+$180","","+$290"],["-$150","+$410","","+$180","-$95"],["+$510","","+$245","-$130","+$195"],["+$380","-$180","+$445","","+$355"]];
  return (<div>
    <div style={{ color: "#fff", fontFamily: fd, fontSize: 16, fontWeight: 700, marginBottom: 16 }}>March 2026 &mdash; 18 trades, 11 wins, $2,840 net</div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
      {days.map(d => <div key={d} style={{ textAlign: "center", color: "#6b7280", fontFamily: fm, fontSize: 10, paddingBottom: 4 }}>{d}</div>)}
      {weeks.flat().map((v, i) => { const isW = v.startsWith("+"); return <div key={i} style={{ background: v ? (isW ? "rgba(0,212,160,0.1)" : "rgba(239,68,68,0.1)") : "#0e0f14", border: `1px solid ${v ? (isW ? "rgba(0,212,160,0.2)" : "rgba(239,68,68,0.2)") : "#1a1b22"}`, borderRadius: 6, padding: "10px 4px", textAlign: "center", fontFamily: fm, fontSize: 11, fontWeight: 700, color: v ? (isW ? teal : "#ef4444") : "#2a2b35", minHeight: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>{v || "\u2014"}</div>; })}
    </div>
  </div>);
}


interface Trade {
  id: string;
  ticker: string;
  companyName: string;
  date: string;
  time: string;
  strategy: string;
  direction: 'LONG' | 'SHORT';
  contracts: number;
  entryPrice: number;
  exitPrice: number;
  pl: number;
  plPercent: number;
  riskAmount: number;
  riskReward: string;
  journal: string;
  screenshot?: string;
  aiScore?: number;
  result: 'WIN' | 'LOSS';
}

function formatDollar(n: number): string {
  const sign = n >= 0 ? '+' : '-';
  const abs = Math.abs(n);
  if (abs % 1 === 0) return sign + '$' + abs.toLocaleString();
  return sign + '$' + abs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function TickerLogoCell({ ticker, domain }: { ticker: string; domain: string }) {
  const [srcIdx, setSrcIdx] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const sources = [
    `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
    `https://icons.duckduckgo.com/ip3/${domain}.ico`,
    `https://logo.clearbit.com/${domain}`,
    `https://financialmodelingprep.com/image-stock/${ticker}.png`,
  ];
  const allFailed = srcIdx >= sources.length;
  const brandColors: Record<string, string> = { QQQ: '#7b3fe4', TSLA: '#cc0000', SPY: '#1a4a8a', NVDA: '#76b900', AAPL: '#555', META: '#0668E1', AMZN: '#ff9900', AMD: '#ed1c24', BA: '#0033a0', MSFT: '#00a4ef', GOOGL: '#4285f4', NFLX: '#e50914', DIS: '#0057a8', COIN: '#0052ff' };
  return (
    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, flexShrink: 0 }}>
      {!allFailed && (
        <img
          key={srcIdx}
          src={sources[srcIdx]}
          alt=""
          width={28}
          height={28}
          style={{ borderRadius: 6, objectFit: 'contain' as const, display: loaded ? 'block' : 'none' }}
          onLoad={() => setLoaded(true)}
          onError={() => { setLoaded(false); setSrcIdx(i => i + 1); }}
        />
      )}
      {(allFailed || !loaded) && (
        <span style={{ width: 28, height: 28, borderRadius: 6, background: brandColors[ticker] || '#2a2b32', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff' }}>{ticker.slice(0, 2)}</span>
      )}
    </span>
  );
}

function PastTradesContent({ trades, setActiveTab }: { trades: Trade[]; setActiveTab: (tab: string) => void }) {
  const [search, setSearch] = useState('');
  const [stratFilter, setStratFilter] = useState('All');
  const [resultFilter, setResultFilter] = useState('All');
  const [dateRange, setDateRange] = useState('All Time');
  const [sortBy, setSortBy] = useState('Newest');
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [colWidths, setColWidths] = useState<number[]>([70, 90, 70, 110, 80, 50, 130, 100, 80, 60, 180]);
  const [resizing, setResizing] = useState<{ col: number; startX: number; startW: number } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [eqHover, setEqHover] = useState<{ x: number; y: number; date: string; value: number } | null>(null);
  const [eqRange, setEqRange] = useState('YTD');
  const [notesTooltip, setNotesTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
  const [showAiSidebar, setShowAiSidebar] = useState(false);
  React.useEffect(() => { setCurrentPage(1); }, [search, stratFilter, resultFilter, dateRange, sortBy]);
  const [aiMessages, setAiMessages] = useState<{role: 'user'|'assistant', content: string}[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages, aiLoading]);

  React.useEffect(() => {
    if (!resizing) return;
    const onMove = (e: MouseEvent) => {
      const diff = e.clientX - resizing.startX;
      setColWidths(prev => {
        const next = [...prev];
        next[resizing.col] = Math.max(40, resizing.startW + diff);
        return next;
      });
    };
    const onUp = () => setResizing(null);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [resizing]);

  React.useEffect(() => {
    if (!expandedImage) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setExpandedImage(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [expandedImage]);

  async function sendToCoach() {
    if (!aiInput.trim() || aiLoading) return;
    const userMsg = aiInput.trim();
    setAiInput('');
    setAiMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setAiLoading(true);
    try {
      const tradesContext = trades.map(t =>
        `${t.ticker} ${t.strategy} ${t.direction} Entry:$${t.entryPrice} Exit:$${t.exitPrice} P/L:$${t.pl} R:R:${t.riskReward} Date:${t.date} Journal:"${t.journal}"`
      ).join('\n');
      const response = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...aiMessages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: userMsg }
          ],
          tradesContext
        })
      });
      const data = await response.json();
      setAiMessages(prev => [...prev, { role: 'assistant', content: data.reply || 'Unable to analyze right now.' }]);
    } catch {
      setAiMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Try again.' }]);
    }
    setAiLoading(false);
  }

  const [strategies, setStrategies] = useState<string[]>(() => {
    try { const s = localStorage.getItem('wickcoach_strategies'); if (s) return JSON.parse(s); } catch {}
    return ['All', '0DTE Call', '0DTE Put', 'Call Scalp', 'Put Scalp', 'Call Debit Spread', 'Put Debit Spread', 'Put Credit Spread', 'Call Credit Spread', 'Iron Condor'];
  });

  const removeStrategy = (strat: string) => {
    const updated = strategies.filter(s => s !== strat);
    setStrategies(updated);
    try { localStorage.setItem('wickcoach_strategies', JSON.stringify(updated)); } catch {}
    if (stratFilter === strat) setStratFilter('All');
  };

  // Filter + sort
  const filtered = trades.filter(t => {
    if (search && !t.ticker.toLowerCase().includes(search.toLowerCase())) return false;
    if (stratFilter !== 'All' && t.strategy !== stratFilter) return false;
    if (resultFilter === 'Wins' && t.result !== 'WIN') return false;
    if (resultFilter === 'Losses' && t.result !== 'LOSS') return false;
    if (resultFilter === 'Break Even' && t.pl !== 0) return false;
    if (dateRange === 'This Week') {
      const d = new Date(t.date); const now = new Date(); const weekAgo = new Date(now.getTime() - 7 * 86400000);
      if (d < weekAgo) return false;
    } else if (dateRange === 'This Month') {
      const d = new Date(t.date); const now = new Date();
      if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return false;
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === 'Newest') return new Date(b.date).getTime() - new Date(a.date).getTime();
    if (sortBy === 'Oldest') return new Date(a.date).getTime() - new Date(b.date).getTime();
    if (sortBy === 'Highest P/L') return b.pl - a.pl;
    if (sortBy === 'Lowest P/L') return a.pl - b.pl;
    if (sortBy === 'Ticker A-Z') return a.ticker.localeCompare(b.ticker);
    return 0;
  });

  // Stats — also respect equity curve time filter
  const statTrades = (() => {
    const now = new Date();
    let cutoff: Date;
    if (eqRange === '1D') cutoff = new Date(now.getTime() - 86400000);
    else if (eqRange === '1W') cutoff = new Date(now.getTime() - 7 * 86400000);
    else if (eqRange === '1M') cutoff = new Date(now.getTime() - 30 * 86400000);
    else if (eqRange === '3M') cutoff = new Date(now.getTime() - 90 * 86400000);
    else cutoff = new Date('2000-01-01');
    return filtered.filter(t => new Date(t.date) >= cutoff);
  })();
  const wins = statTrades.filter(t => t.result === 'WIN' && t.pl > 0);
  const losses = statTrades.filter(t => t.result === 'LOSS' || (t.result !== 'WIN' && t.pl < 0));
  const totalPL = statTrades.reduce((s, t) => s + t.pl, 0);
  const winRate = statTrades.length > 0 ? Math.round((wins.length / statTrades.length) * 100) : 0;
  const winRRValues = wins.map(t => parseFloat(t.riskReward.split(':')[1]) || 0);
  const avgRR = winRRValues.length > 0 ? (winRRValues.reduce((a, b) => a + b, 0) / winRRValues.length).toFixed(1) : '—';
  const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + t.pl, 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + t.pl, 0) / losses.length) : 0;
  const expectedValue = statTrades.length > 0 ? (winRate / 100) * avgWin - ((100 - winRate) / 100) * avgLoss : 0;

  // P/L sparkline points
  const sparkPoints = (() => {
    if (filtered.length === 0) return 'M0,12 L60,12';
    let running = 0;
    const vals = filtered.slice().reverse().map(t => { running += t.pl; return running; });
    const maxV = Math.max(...vals.map(Math.abs), 1);
    return vals.map((v, i) => {
      const x = (i / Math.max(vals.length - 1, 1)) * 60;
      const y = 12 - (v / maxV) * 10;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  })();

  const tickerDomains: Record<string, string> = {
    QQQ: 'invesco.com', SPY: 'ssga.com', AAPL: 'apple.com', NVDA: 'nvidia.com',
    TSLA: 'tesla.com', AMZN: 'amazon.com', META: 'meta.com', MSFT: 'microsoft.com',
    GOOGL: 'google.com', GOOG: 'google.com', AMD: 'amd.com', NFLX: 'netflix.com',
    BA: 'boeing.com', DIS: 'thewaltdisneycompany.com', JPM: 'jpmorganchase.com',
    V: 'visa.com', WMT: 'walmart.com', COIN: 'coinbase.com', PLTR: 'palantir.com',
    SOFI: 'sofi.com', CRM: 'salesforce.com', COST: 'costco.com', HD: 'homedepot.com',
    UNH: 'unitedhealthgroup.com',
  };

  const formatDate = (d: string) => {
    const dt = new Date(d);
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (t: string) => {
    if (!t) return '—';
    const parts = t.split(':');
    if (parts.length < 2) return t;
    let h = parseInt(parts[0]); const m = parts[1];
    const ampm = h >= 12 ? 'PM' : 'AM';
    if (h > 12) h -= 12; if (h === 0) h = 12;
    return `${h}:${m} ${ampm}`;
  };

  const selectBase: React.CSSProperties = { background: '#0e0f14', borderTop: '1px solid #2a2b32', borderRight: '1px solid #2a2b32', borderBottom: '1px solid #2a2b32', borderLeft: '1px solid #2a2b32', borderRadius: 8, padding: '10px 14px', color: '#c9cdd4', fontFamily: fm, fontSize: 14, outline: 'none', cursor: 'pointer', appearance: 'none' as const, WebkitAppearance: 'none' as const };

  const pillBtn = (active: boolean): React.CSSProperties => ({
    padding: '8px 16px', borderRadius: 8, fontSize: 14, fontFamily: fm, fontWeight: 600, cursor: 'pointer',
    background: active ? 'rgba(0,212,160,0.1)' : '#0e0f14',
    borderTop: active ? '1px solid #00d4a0' : '1px solid #2a2b32',
    borderRight: active ? '1px solid #00d4a0' : '1px solid #2a2b32',
    borderBottom: active ? '1px solid #00d4a0' : '1px solid #2a2b32',
    borderLeft: active ? '1px solid #00d4a0' : '1px solid #2a2b32',
    color: active ? teal : '#6b7280', transition: 'all 0.2s',
  });

  // Equity curve data — derived from FILTERED trades (respects all filters)
  const equityCurveAll = (() => {
    const sorted = filtered.slice().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let running = 0;
    return sorted.map(t => { running += t.pl; return { date: t.date, value: running }; });
  })();
  const equityCurve = (() => {
    if (equityCurveAll.length === 0) return [];
    const now = new Date();
    let cutoff: Date;
    if (eqRange === '1D') { cutoff = new Date(now.getTime() - 86400000); }
    else if (eqRange === '1W') { cutoff = new Date(now.getTime() - 7 * 86400000); }
    else if (eqRange === '1M') { cutoff = new Date(now.getTime() - 30 * 86400000); }
    else if (eqRange === '3M') { cutoff = new Date(now.getTime() - 90 * 86400000); }
    else { cutoff = new Date('2000-01-01'); }
    return equityCurveAll.filter(e => new Date(e.date) >= cutoff);
  })();
  const eqMin = equityCurve.length > 0 ? Math.min(...equityCurve.map(e => e.value)) : 0;
  const eqMaxVal = equityCurve.length > 0 ? Math.max(...equityCurve.map(e => e.value)) : 1;
  const eqRange2 = Math.max(eqMaxVal - eqMin, 1);
  const eqLine = equityCurve.length > 0
    ? equityCurve.map((e, i) => { const x = (i / Math.max(equityCurve.length - 1, 1)) * 700; const y = 10 + (1 - (e.value - eqMin) / eqRange2) * 100; return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`; }).join(' ')
    : 'M0,100 L700,100';
  const eqFill = equityCurve.length > 0 ? eqLine + ` L700,120 L0,120 Z` : 'M0,100 L700,100 L700,120 L0,120 Z';
  // Y-axis labels
  const eqYLabels = (() => {
    if (equityCurve.length === 0) return [];
    const steps = 4;
    const labels: { value: number; y: number }[] = [];
    for (let i = 0; i <= steps; i++) {
      const value = eqMaxVal - (i / steps) * eqRange2;
      const y = 10 + (i / steps) * 100;
      labels.push({ value: Math.round(value), y });
    }
    return labels;
  })();
  const breakEven = statTrades.filter(t => t.pl === 0);

  // Pagination
  const perPage = 8;
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(currentPage, totalPages);
  const pagedTrades = filtered.slice((safePage - 1) * perPage, safePage * perPage);

  // Welcome message for Fix 8
  const welcomeMsg = trades.length > 0 && aiMessages.length === 0 ? (() => {
    const wr = trades.length > 0 ? Math.round((trades.filter(t => t.result === 'WIN').length / trades.length) * 100) : 0;
    const best = trades.slice().sort((a, b) => b.pl - a.pl)[0];
    return `You have ${trades.length} trade${trades.length !== 1 ? 's' : ''} logged with a ${wr}% win rate. Your best performer was ${best?.ticker} (+$${best?.pl.toFixed(2)}). Want me to analyze your patterns?`;
  })() : null;

  const colHeaders = ['Asset', 'Date', 'Time', 'Strategy', 'Direction', 'Qty', 'Entry/Exit', 'Net P/L', 'R:R', 'Image', 'Notes'];

  function autoFitColumn(colIndex: number) {
    const headerLen = colHeaders[colIndex].length;
    let maxLen = headerLen;
    pagedTrades.forEach(t => {
      let cellText = '';
      switch (colIndex) {
        case 0: cellText = t.ticker; break;
        case 1: { const d = new Date(t.date); cellText = `${d.getMonth()+1}/${d.getDate()}/${d.getFullYear()}`; break; }
        case 2: cellText = formatTime(t.time); break;
        case 3: cellText = t.strategy; break;
        case 4: cellText = t.direction; break;
        case 5: cellText = String(t.contracts); break;
        case 6: cellText = '$' + t.entryPrice.toFixed(2) + ' → $' + t.exitPrice.toFixed(2); break;
        case 7: cellText = formatDollar(t.pl); break;
        case 8: cellText = t.riskReward.replace(/(\d+):(\d)/, '$1 : $2'); break;
        case 9: cellText = 'IMG'; break;
        case 10: cellText = t.journal || '—'; break;
      }
      if (cellText.length > maxLen) maxLen = cellText.length;
    });
    const newWidth = Math.min(300, Math.max(50, Math.round(maxLen * 9) + 40));
    setColWidths(prev => { const next = [...prev]; next[colIndex] = newWidth; return next; });
  }

  function formatAiText(text: string): React.ReactNode[] {
    const lines = text.split('\n');
    const nodes: React.ReactNode[] = [];
    lines.forEach((line, li) => {
      if (li > 0) nodes.push(<br key={`br-${li}`} />);
      const bulletMatch = line.match(/^•\s*(.*)/);
      const content = bulletMatch ? bulletMatch[1] : line;
      const parts = content.split(/\*\*(.*?)\*\*/g);
      const rendered = parts.map((part, pi) =>
        pi % 2 === 1 ? <span key={pi} style={{ color: teal, fontWeight: 700 }}>{part}</span> : part
      );
      if (bulletMatch) {
        nodes.push(<span key={`bullet-${li}`} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginTop: 4 }}><span style={{ color: teal, flexShrink: 0 }}>•</span><span>{rendered}</span></span>);
      } else {
        nodes.push(<span key={`line-${li}`}>{rendered}</span>);
      }
    });
    return nodes;
  }

  return (
    <div style={{ display: 'flex', minHeight: '80vh', background: 'linear-gradient(180deg, #0e0f14 0%, #0f1210 40%, #0e0f14 100%)' }}>
      {/* ── CENTER CONTENT ── */}
      <div style={{ flex: 1, padding: '24px 40px', overflow: 'auto', position: 'relative', maxWidth: showAiSidebar ? undefined : 1200, margin: showAiSidebar ? undefined : '0 auto' }}>
        {/* Page header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: fd, fontSize: 24, fontWeight: 700, color: teal }}>Past Trades</span>
              <span style={{ fontSize: 10, fontFamily: fm, color: '#0e0f14', background: teal, padding: '3px 8px', borderRadius: 4, fontWeight: 700, letterSpacing: 1 }}>LIVE</span>
            </div>
            <div style={{ fontFamily: fm, fontSize: 13, color: '#6b7280', marginTop: 4 }}>Analyze, review, and backtest your historical executions.</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <span style={{ fontFamily: fm, fontSize: 13, color: '#c9cdd4', padding: '8px 16px', borderRadius: 8, borderTop: '1px solid #2a2b32', borderRight: '1px solid #2a2b32', borderBottom: '1px solid #2a2b32', borderLeft: '1px solid #2a2b32', background: '#111218', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
              Export CSV
            </span>
          </div>
        </div>
        {/* ── STAT CARDS ── */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 16, alignItems: 'stretch' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, flex: 1 }}>
          {/* Total P/L */}
          <div style={{ background: '#13141a', borderTop: `3px solid ${teal}`, borderRight: '1px solid #2a2b32', borderBottom: '1px solid #2a2b32', borderLeft: '1px solid #2a2b32', borderRadius: 10, padding: '12px 16px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ color: '#8a8d98', fontFamily: fm, fontSize: 13, textTransform: 'uppercase' as const, letterSpacing: 1 }}>Total P/L</div>
            <div style={{ color: totalPL >= 0 ? teal : '#ef4444', fontFamily: fd, fontSize: 24, fontWeight: 700, marginTop: 4 }}>{formatDollar(totalPL)}</div>
            <svg width="100%" height="20" viewBox="0 0 200 20" preserveAspectRatio="none" style={{ display: 'block', marginTop: 6 }}>
              <defs><linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={totalPL >= 0 ? teal : '#ef4444'} stopOpacity="0.15" /><stop offset="100%" stopColor={totalPL >= 0 ? teal : '#ef4444'} stopOpacity="0" /></linearGradient></defs>
              <path d={(sparkPoints.replace(/60/g, '200').replace(/24/g, '20') || 'M0,10 L200,10') + ' L200,20 L0,20 Z'} fill="url(#sparkFill)" />
              <path d={sparkPoints.replace(/60/g, '200').replace(/24/g, '20') || 'M0,10 L200,10'} stroke={totalPL >= 0 ? teal : '#ef4444'} strokeWidth="1.5" fill="none" />
            </svg>
          </div>
          {/* Win Rate */}
          <div style={{ background: '#13141a', borderTop: `3px solid ${teal}`, borderRight: '1px solid #2a2b32', borderBottom: '1px solid #2a2b32', borderLeft: '1px solid #2a2b32', borderRadius: 10, padding: '12px 16px' }}>
            <div style={{ color: '#8a8d98', fontFamily: fm, fontSize: 13, textTransform: 'uppercase' as const, letterSpacing: 1 }}>Win Rate</div>
            <div style={{ color: '#fff', fontFamily: fd, fontSize: 24, fontWeight: 700, marginTop: 4 }}>{winRate}%</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 6, fontFamily: fm, fontSize: 13 }}>
              <span style={{ color: teal }}>{wins.length}W</span>
              <span style={{ color: '#ef4444' }}>{losses.length}L</span>
              {breakEven.length > 0 && <span style={{ color: '#f59e0b' }}>{breakEven.length}E</span>}
            </div>
            <div style={{ display: 'flex', height: 3, borderRadius: 2, overflow: 'hidden', marginTop: 4, background: '#1e1f2a' }}>
              {filtered.length > 0 && <div style={{ width: `${(wins.length / filtered.length) * 100}%`, background: teal }} />}
              {filtered.length > 0 && <div style={{ width: `${(losses.length / filtered.length) * 100}%`, background: '#ef4444' }} />}
            </div>
          </div>
          {/* Total Trades */}
          <div style={{ background: '#13141a', borderTop: `3px solid ${teal}`, borderRight: '1px solid #2a2b32', borderBottom: '1px solid #2a2b32', borderLeft: '1px solid #2a2b32', borderRadius: 10, padding: '12px 16px' }}>
            <div style={{ color: '#8a8d98', fontFamily: fm, fontSize: 13, textTransform: 'uppercase' as const, letterSpacing: 1 }}>Total Trades</div>
            <div style={{ color: '#fff', fontFamily: fd, fontSize: 24, fontWeight: 700, marginTop: 4 }}>{statTrades.length}</div>
          </div>
          {/* Avg R:R */}
          <div style={{ background: '#13141a', borderTop: `3px solid ${teal}`, borderRight: '1px solid #2a2b32', borderBottom: '1px solid #2a2b32', borderLeft: '1px solid #2a2b32', borderRadius: 10, padding: '12px 16px' }}>
            <div style={{ color: '#8a8d98', fontFamily: fm, fontSize: 13, textTransform: 'uppercase' as const, letterSpacing: 1 }}>Avg R:R</div>
            <div style={{ color: '#fff', fontFamily: fd, fontSize: 24, fontWeight: 700, marginTop: 4 }}><span>1</span><span style={{ margin: '0 6px' }}>:</span><span>{avgRR}</span></div>
          </div>
          {/* Expected Value */}
          <div style={{ background: '#13141a', borderTop: `3px solid ${teal}`, borderRight: '1px solid #2a2b32', borderBottom: '1px solid #2a2b32', borderLeft: '1px solid #2a2b32', borderRadius: 10, padding: '12px 16px' }}>
            <div style={{ color: '#8a8d98', fontFamily: fm, fontSize: 13, textTransform: 'uppercase' as const, letterSpacing: 1 }}>Expected Value</div>
            <div style={{ color: expectedValue >= 0 ? teal : '#ef4444', fontFamily: fd, fontSize: 24, fontWeight: 700, marginTop: 4 }}>{formatDollar(Math.round(expectedValue * 100) / 100)}</div>
            <div style={{ fontFamily: fm, fontSize: 13, color: '#8a8d98', marginTop: 4 }}>Per trade</div>
          </div>
        </div>
          {/* HIGH-LEVEL ANALYSIS — right of stat cards */}
          <div onClick={() => setShowAiSidebar(prev => !prev)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', flexShrink: 0 }}>
            <div style={{ fontFamily: fm, fontSize: 16, color: teal, textTransform: 'uppercase' as const, letterSpacing: 3, textAlign: 'center', lineHeight: 1.3, fontWeight: 700 }}>HIGH-LEVEL<br/>ANALYSIS</div>
            <div className="hla-icon-circle" style={{ width: 72, height: 72, borderRadius: '50%', border: `2px solid ${showAiSidebar ? teal : '#ffffff'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: showAiSidebar ? 'rgba(0,212,160,0.1)' : 'rgba(255,255,255,0.05)', boxShadow: showAiSidebar ? '0 0 20px rgba(0,212,160,0.4)' : '0 0 24px rgba(0,212,160,0.2)', transition: 'all 0.3s' }} onMouseEnter={e => { if (!showAiSidebar) e.currentTarget.style.boxShadow = '0 0 15px rgba(0,212,160,0.3)'; }} onMouseLeave={e => { if (!showAiSidebar) e.currentTarget.style.boxShadow = '0 0 24px rgba(0,212,160,0.2)'; }}>
              <svg width="32" height="56" viewBox="0 0 20 24" fill="none">
                <circle cx="8" cy="4" r="2.8" stroke={teal} strokeWidth="1.2" fill="none" />
                <line x1="8" y1="6.8" x2="8" y2="15" stroke={teal} strokeWidth="1.2" />
                <line x1="8" y1="9.5" x2="3" y2="13" stroke={teal} strokeWidth="1.2" />
                <line x1="8" y1="9.5" x2="14.5" y2="6" stroke={teal} strokeWidth="1.2" />
                <line x1="8" y1="15" x2="4.5" y2="21" stroke={teal} strokeWidth="1.2" />
                <line x1="8" y1="15" x2="11.5" y2="21" stroke={teal} strokeWidth="1.2" />
                <rect x="13.5" y="4" width="4" height="5" rx="0.5" fill={teal} opacity="0.9" />
                <line x1="15.5" y1="2" x2="15.5" y2="12" stroke={teal} strokeWidth="0.8" />
              </svg>
            </div>
          </div>
        </div>

        {/* ── EQUITY CURVE ── */}
        <div style={{ background: '#13141a', borderTop: '1px solid #1e1f2a', borderRight: '1px solid #1e1f2a', borderBottom: '1px solid #1e1f2a', borderLeft: '1px solid #1e1f2a', borderRadius: 10, padding: 14, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
              <span style={{ fontFamily: fd, fontSize: 15, fontWeight: 700, color: '#e8e8f0' }}>Equity Curve</span>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {['1D', '1W', '1M', '3M', 'YTD'].map(p => (
                <span key={p} onClick={() => setEqRange(p)} style={{ fontFamily: fm, fontSize: 13, padding: '4px 10px', borderRadius: 6, cursor: 'pointer', background: eqRange === p ? 'rgba(0,212,160,0.12)' : 'transparent', color: eqRange === p ? teal : '#8a8d98', borderTop: eqRange === p ? '1px solid rgba(0,212,160,0.3)' : '1px solid transparent', borderRight: eqRange === p ? '1px solid rgba(0,212,160,0.3)' : '1px solid transparent', borderBottom: eqRange === p ? '1px solid rgba(0,212,160,0.3)' : '1px solid transparent', borderLeft: eqRange === p ? '1px solid rgba(0,212,160,0.3)' : '1px solid transparent', fontWeight: 600 }}>{p}</span>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', position: 'relative' }}>
            {/* Y-axis labels */}
            <div style={{ width: 55, flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingRight: 6 }}>
              {eqYLabels.map((label, li) => (
                <span key={li} style={{ fontFamily: fm, fontSize: 12, color: '#8a8d98', textAlign: 'right', lineHeight: '1' }}>{label.value >= 0 ? '+' : ''}{label.value >= 1000 ? `$${(label.value / 1000).toFixed(1)}k` : `$${label.value}`}</span>
              ))}
            </div>
            {/* Chart */}
            <div style={{ flex: 1, position: 'relative' }}>
              <svg width="100%" height="120" viewBox="0 0 700 120" preserveAspectRatio="none" style={{ display: 'block' }}
                onMouseMove={e => {
                  if (equityCurve.length === 0) return;
                  const rect = (e.target as SVGElement).closest('svg')?.getBoundingClientRect();
                  if (!rect) return;
                  const relX = (e.clientX - rect.left) / rect.width;
                  const idx = Math.min(Math.max(Math.round(relX * (equityCurve.length - 1)), 0), equityCurve.length - 1);
                  const pt = equityCurve[idx];
                  const svgX = (idx / Math.max(equityCurve.length - 1, 1)) * 700;
                  const svgY = 10 + (1 - (pt.value - eqMin) / eqRange2) * 100;
                  setEqHover({ x: svgX, y: svgY, date: pt.date, value: pt.value });
                }}
                onMouseLeave={() => setEqHover(null)}
              >
                {[30, 60, 90].map(y => <line key={y} x1="0" y1={y} x2="700" y2={y} stroke="#1a1b22" strokeWidth="1" />)}
                <defs><linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={teal} stopOpacity="0.12" /><stop offset="100%" stopColor={teal} stopOpacity="0" /></linearGradient></defs>
                <path d={eqFill} fill="url(#eqGrad)" />
                <path d={eqLine} fill="none" stroke={teal} strokeWidth="2" />
                {eqHover && (<>
                  <line x1={eqHover.x} y1="0" x2={eqHover.x} y2="120" stroke="rgba(0,212,160,0.4)" strokeWidth="1" strokeDasharray="3,3" />
                  <circle cx={eqHover.x} cy={eqHover.y} r="4" fill={teal} stroke="#0e0f14" strokeWidth="2" />
                </>)}
              </svg>
              {/* Hover tooltip */}
              {eqHover && (
                <div style={{ position: 'absolute', left: `${(eqHover.x / 700) * 100}%`, top: -8, transform: 'translateX(-50%) translateY(-100%)', background: '#13141a', borderTop: '1px solid #2a2b32', borderRight: '1px solid #2a2b32', borderBottom: '1px solid #2a2b32', borderLeft: '1px solid #2a2b32', borderRadius: 6, padding: '6px 10px', fontFamily: fm, fontSize: 11, color: '#c9cdd4', whiteSpace: 'nowrap', zIndex: 10, pointerEvents: 'none' }}>
                  <div style={{ color: '#9ca3af' }}>{new Date(eqHover.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                  <div style={{ color: eqHover.value >= 0 ? teal : '#ef4444', fontWeight: 700 }}>{formatDollar(Math.round(eqHover.value))}</div>
                </div>
              )}
            </div>
          </div>
          {equityCurve.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, paddingLeft: 55 }}>
              {[0, Math.floor(equityCurve.length * 0.25), Math.floor(equityCurve.length * 0.5), Math.floor(equityCurve.length * 0.75), equityCurve.length - 1].filter((v, i, a) => a.indexOf(v) === i).map(idx => (
                <span key={idx} style={{ fontFamily: fm, fontSize: 13, color: '#8a8d98' }}>
                  {new Date(equityCurve[idx].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── FILTER BAR ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search Ticker (e.g. AAPL)" style={{ ...selectBase, paddingLeft: 38, width: 220 }} />
          </div>
          {/* Strategy dropdown */}
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
            <select value={stratFilter} onChange={e => setStratFilter(e.target.value)} style={{ ...selectBase, paddingLeft: 32, paddingRight: 32, minWidth: 170 }}>
              {strategies.map(s => <option key={s} value={s}>{s === 'All' ? 'Strategy: All' : `Strategy: ${s}`}</option>)}
              <option value="+ Add New">+ Add New</option>
            </select>
            <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: teal, fontSize: 12, pointerEvents: 'none' }}>▼</span>
          </div>
          {stratFilter !== 'All' && stratFilter !== '+ Add New' && (
            <span onClick={() => removeStrategy(stratFilter)} style={{ color: '#ef4444', fontSize: 12, cursor: 'pointer', fontFamily: fm }}>✕</span>
          )}
          {/* Result pills with colored dots */}
          <div style={{ display: 'flex', gap: 4, background: '#111218', borderRadius: 8, padding: 3, borderTop: '1px solid #1e1f2a', borderRight: '1px solid #1e1f2a', borderBottom: '1px solid #1e1f2a', borderLeft: '1px solid #1e1f2a' }}>
            {([['All', '#6b7280'], ['Wins', teal], ['Losses', '#ef4444'], ['Break Even', '#f59e0b']] as [string, string][]).map(([r, dotColor]) => (
              <span key={r} onClick={() => setResultFilter(r)} style={{ ...pillBtn(resultFilter === r), display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
                {r === 'All' ? 'All Trades' : r}
              </span>
            ))}
          </div>
          {/* Date range — pushed right */}
          <div style={{ display: 'flex', gap: 4, marginLeft: 'auto', alignItems: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" style={{ marginRight: 4 }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <select value={dateRange} onChange={e => setDateRange(e.target.value)} style={{ ...selectBase, paddingRight: 28, fontSize: 13 }}>
                {['This Week', 'This Month', 'All Time'].map(d => <option key={d} value={d}>{d === 'All Time' ? 'Last 30 Days' : d}</option>)}
              </select>
              <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: teal, fontSize: 12, pointerEvents: 'none' }}>▼</span>
            </div>
          </div>
        </div>

        {/* ── EXPANDED IMAGE MODAL ── */}
        {expandedImage && (
          <div onClick={() => setExpandedImage(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={expandedImage} alt="" style={{ maxWidth: '80vw', maxHeight: '80vh', objectFit: 'contain' as const, borderRadius: 8, borderTop: '1px solid #2a2b32', borderRight: '1px solid #2a2b32', borderBottom: '1px solid #2a2b32', borderLeft: '1px solid #2a2b32' }} />
          </div>
        )}

        {/* ── TRADE LIST ── */}
        <div style={{ background: '#111218', borderTop: '1px solid #2a2b32', borderRight: '1px solid #2a2b32', borderBottom: '1px solid #2a2b32', borderLeft: '1px solid #2a2b32', borderRadius: 10, overflow: 'hidden', boxShadow: '0 0 40px rgba(0,212,160,0.03)' }}>
          {/* Header row */}
          <div style={{ display: 'grid', gridTemplateColumns: colWidths.map(w => w + 'px').join(' '), background: '#0e0f14', borderBottom: '2px solid #2a2b32' }}>
            {colHeaders.map((h, hi) => (
              <span key={h} style={{ color: '#9ca3af', fontFamily: fm, fontSize: 13, textTransform: 'uppercase' as const, letterSpacing: 1.5, fontWeight: 600, position: 'relative', userSelect: resizing ? 'none' : 'auto', padding: '12px 8px', borderRight: hi < colHeaders.length - 1 ? '1px solid #1e1f2a' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {h}
                <span onMouseDown={e => { e.preventDefault(); setResizing({ col: hi, startX: e.clientX, startW: colWidths[hi] }); }} onDoubleClick={() => autoFitColumn(hi)} style={{ position: 'absolute', right: -4, top: 0, width: 8, height: '100%', cursor: 'col-resize', zIndex: 2, background: 'transparent' }} onMouseEnter={e => { e.currentTarget.style.borderRight = `3px solid ${teal}`; }} onMouseLeave={e => { if (!resizing || resizing.col !== hi) e.currentTarget.style.borderRight = 'none'; }} />
              </span>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px' }}>
              <div style={{ color: '#8a8d98', fontFamily: fm, fontSize: 16 }}>No trades logged yet</div>
              <span onClick={() => setActiveTab('Log a Trade')} style={{ color: teal, fontFamily: fm, fontSize: 14, cursor: 'pointer', marginTop: 10, fontWeight: 600 }}>Log your first trade &rarr;</span>
            </div>
          ) : (<>
            {pagedTrades.map((t, idx) => {
              const rowBg = idx % 2 === 0 ? '#111218' : '#151620';
              return (
                <div key={t.id} style={{ display: 'grid', gridTemplateColumns: colWidths.map(w => w + 'px').join(' '), background: rowBg, borderBottom: '1px solid #2a2b32', alignItems: 'center', fontFamily: fm, fontSize: 14, color: '#e8e8f0', transition: 'background 0.15s', cursor: 'pointer' }} onMouseEnter={e => { e.currentTarget.style.background = '#1c1d28'; }} onMouseLeave={e => { e.currentTarget.style.background = rowBg; }}>
                  {/* Asset */}
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, overflow: 'hidden', padding: '12px 6px', borderRight: '1px solid #1e1f2a', whiteSpace: 'nowrap' }}>
                    <TickerLogoCell ticker={t.ticker} domain={tickerDomains[t.ticker] || `${t.ticker.toLowerCase()}.com`} />
                    <span style={{ fontWeight: 700, color: '#ffffff', fontSize: 13 }}>{t.ticker}</span>
                  </span>
                  {/* Date */}
                  <span style={{ color: '#c9cdd4', fontSize: 13, whiteSpace: 'nowrap', padding: '12px 6px', borderRight: '1px solid #1e1f2a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{(() => { const d = new Date(t.date); return `${d.getMonth()+1}/${d.getDate()}/${String(d.getFullYear()).slice(2)}`; })()}</span>
                  {/* Time */}
                  <span style={{ color: '#9ca3af', fontSize: 13, whiteSpace: 'nowrap', padding: '12px 6px', borderRight: '1px solid #1e1f2a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{formatTime(t.time)}</span>
                  {/* Strategy */}
                  <span style={{ color: '#c9cdd4', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '12px 6px', borderRight: '1px solid #1e1f2a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t.strategy}</span>
                  {/* Direction */}
                  <span style={{ padding: '12px 6px', borderRight: '1px solid #1e1f2a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: 13, fontWeight: 700, background: t.direction === 'LONG' ? 'rgba(0,212,160,0.15)' : 'rgba(239,68,68,0.15)', color: t.direction === 'LONG' ? teal : '#ef4444' }}>{t.direction}</span>
                  </span>
                  {/* Qty */}
                  <span style={{ color: '#e8e8f0', fontSize: 14, padding: '12px 6px', borderRight: '1px solid #1e1f2a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t.contracts}</span>
                  {/* Entry / Exit */}
                  <span style={{ color: '#c9cdd4', fontSize: 13, whiteSpace: 'nowrap', padding: '12px 6px', borderRight: '1px solid #1e1f2a', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', textOverflow: 'ellipsis' }}>${t.entryPrice.toFixed(2)} → ${t.exitPrice.toFixed(2)}</span>
                  {/* Net P/L */}
                  <span style={{ color: t.pl >= 0 ? teal : '#ef4444', fontWeight: 700, fontSize: 15, padding: '12px 6px', borderRight: '1px solid #1e1f2a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{formatDollar(t.pl)}</span>
                  {/* R:R */}
                  <span style={{ color: '#c9cdd4', fontSize: 13, whiteSpace: 'nowrap', padding: '12px 6px', borderRight: '1px solid #1e1f2a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t.riskReward.replace(/(\d+):(\d)/, '$1 : $2')}</span>
                  {/* Image */}
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 6px', borderRight: '1px solid #1e1f2a' }}>
                    {t.screenshot ? (
                      <img src={t.screenshot} alt="" width={40} height={30} style={{ borderRadius: 4, objectFit: 'cover' as const, background: '#1a1b22', cursor: 'pointer' }} onClick={e => { e.stopPropagation(); setExpandedImage(t.screenshot!); }} />
                    ) : (
                      <span style={{ color: '#3a3b42', fontSize: 13 }}>—</span>
                    )}
                  </span>
                  {/* Notes */}
                  <div style={{ color: '#9ca3af', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '12px 8px', width: '100%', boxSizing: 'border-box', minWidth: 0, position: 'relative', cursor: 'default' }} onMouseEnter={e => { if (t.journal) { const rect = e.currentTarget.getBoundingClientRect(); setNotesTooltip({ text: t.journal, x: rect.left, y: rect.top }); } }} onMouseLeave={() => setNotesTooltip(null)}>{t.journal || '—'}</div>
                </div>
              );
            })}
          </>)}
        </div>
        {filtered.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, padding: '16px 0', marginTop: 8 }}>
            <span onClick={() => { if (safePage > 1) setCurrentPage(safePage - 1); }} style={{ fontFamily: fm, fontSize: 13, color: safePage > 1 ? teal : '#3a3b42', cursor: safePage > 1 ? 'pointer' : 'default', fontWeight: 600 }}>&larr; Previous</span>
            <span style={{ fontFamily: fm, fontSize: 13, color: '#8a8d98' }}>Showing {(safePage - 1) * perPage + 1}-{Math.min(safePage * perPage, filtered.length)} of {filtered.length} trades</span>
            <span onClick={() => { if (safePage < totalPages) setCurrentPage(safePage + 1); }} style={{ fontFamily: fm, fontSize: 13, color: safePage < totalPages ? teal : '#3a3b42', cursor: safePage < totalPages ? 'pointer' : 'default', fontWeight: 600 }}>Next &rarr;</span>
          </div>
        )}

        {/* Notes tooltip */}
        {notesTooltip && (
          <div style={{ position: 'fixed', left: Math.min(notesTooltip.x, window.innerWidth - 380), top: notesTooltip.y - 10, transform: 'translateY(-100%)', background: '#13141a', borderTop: '1px solid #2a2b32', borderRight: '1px solid #2a2b32', borderBottom: '1px solid #2a2b32', borderLeft: '1px solid #2a2b32', borderRadius: 8, padding: 12, maxWidth: 350, fontFamily: fm, fontSize: 13, color: '#c9cdd4', lineHeight: 1.6, zIndex: 50, whiteSpace: 'normal', pointerEvents: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
            {notesTooltip.text}
          </div>
        )}
      </div>

      {/* ── RIGHT SIDEBAR — WickCoach AI ── */}
      <div id="wickcoach-ai-sidebar" style={{ flex: '0 0 28%', minWidth: 280, maxWidth: 380, borderLeft: '1px solid #1a1b22', display: showAiSidebar ? 'flex' : 'none', flexDirection: 'column', background: '#0c0d12', position: 'sticky', top: 0, alignSelf: 'flex-start', maxHeight: '100vh', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '16px 16px 14px', borderBottom: '1px solid #1a1b22' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(0,212,160,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="20" viewBox="0 0 20 24" fill="none">
                <circle cx="8" cy="4" r="2.8" stroke="#7a7d88" strokeWidth="1.2" fill="none" />
                <line x1="8" y1="6.8" x2="8" y2="15" stroke="#7a7d88" strokeWidth="1.2" />
                <line x1="8" y1="9.5" x2="3" y2="13" stroke="#7a7d88" strokeWidth="1.2" />
                <line x1="8" y1="9.5" x2="14.5" y2="6" stroke="#7a7d88" strokeWidth="1.2" />
                <line x1="8" y1="15" x2="4.5" y2="21" stroke="#7a7d88" strokeWidth="1.2" />
                <line x1="8" y1="15" x2="11.5" y2="21" stroke="#7a7d88" strokeWidth="1.2" />
                <rect x="13.5" y="4" width="4" height="5" rx="0.5" fill={teal} opacity="0.9" />
                <line x1="15.5" y1="2" x2="15.5" y2="12" stroke={teal} strokeWidth="0.8" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: fd, fontSize: 16, fontWeight: 700, color: '#fff' }}>WickCoach AI</div>
              <div style={{ fontFamily: fm, fontSize: 10, color: '#6b7280', letterSpacing: 2, textTransform: 'uppercase' as const }}>TRADING CO-PILOT</div>
            </div>
            <span onClick={() => setShowAiSidebar(false)} style={{ color: '#6b7280', fontSize: 18, cursor: 'pointer', padding: '4px 8px', borderRadius: 6, lineHeight: 1, transition: 'color 0.2s' }} onMouseEnter={e => { e.currentTarget.style.color = '#fff'; }} onMouseLeave={e => { e.currentTarget.style.color = '#6b7280'; }}>✕</span>
          </div>
        </div>

        {/* Chat area */}
        <div style={{ flex: 1, padding: '12px', overflowY: 'auto' as const, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Welcome message or empty state */}
          {aiMessages.length === 0 && (
            welcomeMsg ? (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: teal, flexShrink: 0, marginTop: 6 }} />
                <div style={{ background: '#13141a', borderTop: '1px solid #1e1f2a', borderRight: '1px solid #1e1f2a', borderBottom: '1px solid #1e1f2a', borderLeft: '1px solid #1e1f2a', borderRadius: 10, padding: 12, maxWidth: '90%' }}>
                  <div style={{ fontFamily: fm, fontSize: 13, color: '#c9cdd4', lineHeight: 1.6 }}>{welcomeMsg}</div>
                </div>
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontFamily: fm, fontSize: 13, color: '#6b7280', fontStyle: 'italic', textAlign: 'center', padding: '0 20px', lineHeight: 1.6 }}>Ask about your trading patterns, psychology, or specific trades.</div>
              </div>
            )
          )}
          {/* Messages */}
          {aiMessages.map((msg, i) => (
            msg.role === 'assistant' ? (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: teal, flexShrink: 0, marginTop: 6 }} />
                <div style={{ background: '#13141a', borderTop: '1px solid #1e1f2a', borderRight: '1px solid #1e1f2a', borderBottom: '1px solid #1e1f2a', borderLeft: '1px solid #1e1f2a', borderRadius: 10, padding: 12, maxWidth: '90%' }}>
                  <div style={{ fontFamily: fm, fontSize: 13, color: '#c9cdd4', lineHeight: 1.6 }}>{formatAiText(msg.content)}</div>
                </div>
              </div>
            ) : (
              <div key={i} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ background: '#1a2520', borderTop: '1px solid rgba(0,212,160,0.2)', borderRight: '1px solid rgba(0,212,160,0.2)', borderBottom: '1px solid rgba(0,212,160,0.2)', borderLeft: '1px solid rgba(0,212,160,0.2)', borderRadius: 10, padding: 12, maxWidth: '85%' }}>
                  <div style={{ fontFamily: fm, fontSize: 13, color: '#fff', lineHeight: 1.6 }}>{msg.content}</div>
                </div>
              </div>
            )
          ))}
          {/* Loading indicator */}
          {aiLoading && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: teal, flexShrink: 0, marginTop: 6 }} />
              <div style={{ background: '#13141a', borderTop: '1px solid #1e1f2a', borderRight: '1px solid #1e1f2a', borderBottom: '1px solid #1e1f2a', borderLeft: '1px solid #1e1f2a', borderRadius: 10, padding: '12px 16px' }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[0, 1, 2].map(d => (
                    <span key={d} style={{ width: 6, height: 6, borderRadius: '50%', background: '#6b7280', animation: `dotPulse 1.2s ease-in-out ${d * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Chat input */}
        <div style={{ padding: '10px 12px', borderTop: '1px solid #1a1b22' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0e0f14', borderTop: '1px solid #2a2b32', borderRight: '1px solid #2a2b32', borderBottom: '1px solid #2a2b32', borderLeft: '1px solid #2a2b32', borderRadius: 10, padding: '10px 14px' }}>
            <input value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') sendToCoach(); }} placeholder="Ask WickCoach about your trades..." style={{ flex: 1, background: 'transparent', borderTop: 'none', borderRight: 'none', borderBottom: 'none', borderLeft: 'none', outline: 'none', color: '#c9cdd4', fontFamily: fm, fontSize: 13 }} />
            <div onClick={sendToCoach} style={{ width: 32, height: 32, borderRadius: '50%', background: teal, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, opacity: aiLoading ? 0.5 : 1 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0e0f14" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
            </div>
          </div>
        </div>
        <style>{`@keyframes dotPulse { 0%,80%,100% { opacity: 0.3; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1); } }`}</style>
      </div>
    </div>
  );
}

export default function WickCoachFull() {
  const [tabGlow, setTabGlow] = useState(false);
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("");
  const [view, setView] = useState<'home' | 'app'>('home');
  const [activeCategory, setActiveCategory] = useState(0);
  const [textVisible, setTextVisible] = useState(false);
  const [showClickHint, setShowClickHint] = useState(false);
  const [trades, setTrades] = useState<Trade[]>([]);
  const heroVideoRef = useRef<HTMLVideoElement>(null);

  // Load trades from localStorage on mount, fallback to fake-trades.json
  React.useEffect(() => {
    try {
      const dataVersion = 'v2';
      const storedVersion = localStorage.getItem('wickcoach_trades_version');
      const stored = localStorage.getItem('wickcoach_trades');
      const parsed = stored ? JSON.parse(stored) : [];
      if (parsed.length < 10 || storedVersion !== dataVersion) {
        fetch('/fake-trades.json')
          .then(r => r.json())
          .then(data => {
            setTrades(data);
            localStorage.setItem('wickcoach_trades', JSON.stringify(data));
            localStorage.setItem('wickcoach_trades_version', dataVersion);
          })
          .catch(() => setTrades(parsed));
      } else {
        setTrades(parsed);
      }
    } catch {}
  }, []);

  React.useEffect(() => {
    if (heroVideoRef.current) heroVideoRef.current.playbackRate = 1.0;
  }, []);

  React.useEffect(() => {
    const t = setTimeout(() => setTextVisible(true), 3500);
    return () => clearTimeout(t);
  }, []);

  // Show "click these" hint once when textVisible fires
  const hintShownRef = useRef(false);
  React.useEffect(() => {
    if (!textVisible || hintShownRef.current) return;
    hintShownRef.current = true;
    setShowClickHint(true);
    const t = setTimeout(() => setShowClickHint(false), 4000);
    return () => clearTimeout(t);
  }, [textVisible]);

  const handleCategoryClick = (index: number) => {
    setActiveCategory(index);
  };

  const tabs = ["Log a Trade", "Past Trades", "Trading Goals", "Analysis", "Trader Profile"];

  function LogATradeContent({ setActiveTab: setTab }: { setActiveTab: (tab: string) => void }) {
    const [ticker, setTicker] = useState('');
    const [tradeDate, setTradeDate] = useState(new Date().toISOString().split('T')[0]);
    const [positionType, setPositionType] = useState<'SHARES' | 'DERIVATIVES'>('DERIVATIVES');
    const [strategyType, setStrategyType] = useState('0DTE Call');
    const [strategyInputMode, setStrategyInputMode] = useState<'select' | 'text'>('select');
    const [customStrategy, setCustomStrategy] = useState('');
    const [direction, setDirection] = useState('LONG');
    const [contracts, setContracts] = useState('');
    const [entryPrice, setEntryPrice] = useState('');
    const [exitPrice, setExitPrice] = useState('');
    const [pl, setPl] = useState('');
    const [plManualOverride, setPlManualOverride] = useState(false);
    const [journal, setJournal] = useState('');
    const [screenshot, setScreenshot] = useState<string | null>(null);
    const [risk, setRisk] = useState('');
    const [riskReward, setRiskReward] = useState('\u2014');
    const [submitHover, setSubmitHover] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [uploadHover, setUploadHover] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [startTime] = useState(Date.now());
    const [elapsedTime, setElapsedTime] = useState(0);
    const [finalTime, setFinalTime] = useState(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    React.useEffect(() => {
      intervalRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [startTime]);

    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    React.useEffect(() => {
      if (!plManualOverride && entryPrice && exitPrice && contracts) {
        const multiplier = positionType === 'SHARES' ? 1 : 100;
        const diff = direction === 'SHORT'
          ? parseFloat(entryPrice) - parseFloat(exitPrice)
          : parseFloat(exitPrice) - parseFloat(entryPrice);
        const calc = diff * parseInt(contracts) * multiplier;
        setPl(calc.toFixed(2));
      }
    }, [entryPrice, exitPrice, contracts, plManualOverride, positionType, direction]);

    React.useEffect(() => {
      setPlManualOverride(false);
    }, [entryPrice, exitPrice, contracts]);

    React.useEffect(() => {
      const plNum = parseFloat(pl);
      const riskNum = parseFloat(risk);
      if (plNum > 0 && riskNum > 0) {
        const ratio = plNum / riskNum;
        setRiskReward(`1 : ${ratio.toFixed(1)}`);
      } else {
        setRiskReward('\u2014');
      }
    }, [pl, risk]);

    const resetForm = () => {
      setTicker(''); setTradeDate(new Date().toISOString().split('T')[0]);
      setPositionType('DERIVATIVES'); setStrategyType('0DTE Call');
      setStrategyInputMode('select'); setCustomStrategy('');
      setDirection('LONG'); setContracts(''); setEntryPrice('');
      setExitPrice(''); setPl(''); setPlManualOverride(false);
      setJournal(''); setScreenshot(null); setSubmitted(false);
      setRisk(''); setRiskReward('\u2014');
    };

    const inputStyle = {
      background: '#0e0f14',
      border: '1px solid #2a2b35',
      borderRadius: 8,
      padding: '12px 14px',
      color: '#ffffff',
      fontFamily: "'DM Mono', monospace",
      fontSize: 14,
      width: '100%',
      outline: 'none',
      boxSizing: 'border-box' as const,
    };

    const labelStyle = {
      color: '#c9cdd4',
      fontFamily: "'DM Mono', monospace",
      fontSize: 14,
      marginBottom: 6,
      display: 'block' as const,
    };

    const sectionLabelStyle = {
      color: '#00d4a0',
      fontFamily: "'DM Mono', monospace",
      fontSize: 18,
      fontWeight: 700,
      textTransform: 'uppercase' as const,
      letterSpacing: 2,
      marginBottom: 24,
      textDecoration: 'underline' as const,
      textUnderlineOffset: '6px',
      textDecorationColor: '#00d4a0',
    };

    const strategyOptions = [
      '0DTE Call', '0DTE Put', 'Call Scalp', 'Put Scalp',
      'Call Debit Spread', 'Put Debit Spread', 'Put Credit Spread',
      'Call Credit Spread', 'Iron Condor', 'Naked Put', 'Naked Call',
    ];

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => setScreenshot(ev.target?.result as string);
      reader.readAsDataURL(file);
    };

    const plNum = parseFloat(pl);
    const plColor = plNum > 0 ? '#00d4a0' : plNum < 0 ? '#ef4444' : '#ffffff';

    if (submitted) {
      return (
        <div style={{ textAlign: 'center', paddingTop: 80, paddingBottom: 80 }}>
          <div style={{ fontSize: 48, marginBottom: 16, color: '#00d4a0' }}>{"\u2713"}</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(0,212,160,0.1)', border: '1px solid rgba(0,212,160,0.2)', borderRadius: 20, padding: '8px 20px', marginBottom: 20 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00d4a0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: '#00d4a0', fontWeight: 700 }}>Logged in {formatTime(finalTime)}</span>
          </div>
          <h2 style={{ fontFamily: "'Chakra Petch', sans-serif", color: '#ffffff', fontSize: 28, fontWeight: 700, marginBottom: 12 }}>Trade Logged</h2>
          <p style={{ color: '#6b7280', fontFamily: "'DM Mono', monospace", fontSize: 14, lineHeight: '1.6', marginBottom: 32 }}>Your trade has been saved and is ready for AI analysis.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button onClick={() => setTab('Past Trades')} style={{ background: '#13141a', border: '1px solid #00d4a0', borderRadius: 8, padding: '12px 24px', color: '#00d4a0', fontFamily: "'DM Mono', monospace", fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>View in Past Trades</button>
            <button onClick={() => setTab('Analysis')} style={{ background: '#13141a', border: '1px solid #00d4a0', borderRadius: 8, padding: '12px 24px', color: '#00d4a0', fontFamily: "'DM Mono', monospace", fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>View in Analysis</button>
          </div>
          <p onClick={resetForm} style={{ color: '#6b7280', fontFamily: "'DM Mono', monospace", fontSize: 13, marginTop: 24, cursor: 'pointer' }}>+ Log another trade</p>
        </div>
      );
    }

    return (
      <>
        <div style={sectionLabelStyle}>TRADE DETAILS</div>

        <label style={labelStyle}>Ticker</label>
        <input style={inputStyle} placeholder="e.g. QQQ, SPY, TSLA" value={ticker} onChange={(e) => setTicker(e.target.value.toUpperCase())} />
        <div style={{ height: 16 }} />

        <label style={labelStyle}>Date</label>
        <input type="date" style={{ ...inputStyle, colorScheme: 'dark' }} value={tradeDate} onChange={(e) => setTradeDate(e.target.value)} />
        <div style={{ height: 16 }} />

        <label style={labelStyle}>Position Type</label>
        <div style={{ display: 'flex', gap: 10 }}>
          {(['SHARES', 'DERIVATIVES'] as const).map(pt => (
            <button key={pt} onClick={() => setPositionType(pt)} style={{ flex: 1, background: positionType === pt ? 'rgba(0,212,160,0.15)' : '#0e0f14', border: positionType === pt ? '1px solid #00d4a0' : '1px solid #2a2b35', color: positionType === pt ? '#00d4a0' : '#6b7280', borderRadius: 8, padding: '10px 0', fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 700, cursor: 'pointer', letterSpacing: 1 }}>{pt}</button>
          ))}
        </div>
        <div style={{ height: 16 }} />

        {positionType === 'DERIVATIVES' && (<>
          <label style={labelStyle}>Strategy Type</label>
          {strategyInputMode === 'select' ? (<>
            <select style={{ ...inputStyle, cursor: 'pointer' }} value={strategyType} onChange={(e) => setStrategyType(e.target.value)}>
              {strategyOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            <div onClick={() => setStrategyInputMode('text')} style={{ color: '#6b7280', fontFamily: "'DM Mono', monospace", fontSize: 11, cursor: 'pointer', marginTop: 6 }}>Or type your own</div>
          </>) : (<>
            <input style={inputStyle} placeholder="Type your strategy" value={customStrategy} onChange={(e) => setCustomStrategy(e.target.value)} />
            <div onClick={() => setStrategyInputMode('select')} style={{ color: '#6b7280', fontFamily: "'DM Mono', monospace", fontSize: 11, cursor: 'pointer', marginTop: 6 }}>Choose from list</div>
          </>)}
          <div style={{ height: 16 }} />
        </>)}

        <label style={labelStyle}>Direction</label>
        <div style={{ display: 'flex', gap: 10 }}>
          {['LONG', 'SHORT'].map(dir => (
            <button key={dir} onClick={() => setDirection(dir)} style={{ flex: 1, background: direction === dir ? 'rgba(0,212,160,0.15)' : '#0e0f14', border: direction === dir ? '1px solid #00d4a0' : '1px solid #2a2b35', color: direction === dir ? '#00d4a0' : '#6b7280', borderRadius: 8, padding: '10px 0', fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 700, cursor: 'pointer', letterSpacing: 1 }}>{dir}</button>
          ))}
        </div>
        <div style={{ height: 16 }} />

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>{positionType === 'SHARES' ? 'Shares' : 'Contracts'}</label>
            <input type="number" style={inputStyle} placeholder={positionType === 'SHARES' ? '# of shares' : '# of contracts'} min={1} value={contracts} onChange={(e) => setContracts(e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>P/L</label>
            <input type="number" step={0.01} style={{ ...inputStyle, color: plColor }} placeholder="Auto or manual" value={pl} onChange={(e) => { setPl(e.target.value); setPlManualOverride(true); }} />
          </div>
        </div>
        <div style={{ height: 16 }} />

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Entry Price</label>
            <input type="number" step={0.01} style={inputStyle} placeholder="$0.00" value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Exit Price</label>
            <input type="number" step={0.01} style={inputStyle} placeholder="$0.00" value={exitPrice} onChange={(e) => setExitPrice(e.target.value)} />
          </div>
        </div>

        <div style={{ height: 16 }} />

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Risk ($)</label>
            <input type="number" step={0.01} style={inputStyle} placeholder="$0.00" value={risk} onChange={(e) => setRisk(e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Risk : Reward</label>
            <input readOnly style={{ ...inputStyle, fontWeight: 700, color: riskReward === '\u2014' ? '#6b7280' : '#00d4a0', background: '#0a0b0f', cursor: 'default' }} value={riskReward} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 24, marginTop: 48 }}>
          <div style={{ flex: 1 }}>
            <div style={sectionLabelStyle}>JOURNAL ENTRY</div>
            <textarea style={{ ...inputStyle, minHeight: 200, resize: 'vertical', lineHeight: '1.7' }} placeholder="Share your brief approach on this trade for the WickCoach AI to analyze..." value={journal} onChange={(e) => setJournal(e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={sectionLabelStyle}>SCREENSHOT</div>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
            {!screenshot ? (
              <div onClick={() => fileInputRef.current?.click()} onMouseEnter={() => setUploadHover(true)} onMouseLeave={() => setUploadHover(false)} style={{ width: '100%', minHeight: 200, border: `2px dashed ${uploadHover ? '#00d4a0' : '#2a2b35'}`, borderRadius: 12, background: '#0e0f14', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', transition: 'border-color 0.2s' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                <span style={{ color: '#6b7280', fontFamily: "'DM Mono', monospace", fontSize: 13 }}>Drop an image here</span>
                <span style={{ color: '#00d4a0', fontFamily: "'DM Mono', monospace", fontSize: 12, cursor: 'pointer' }}>or click to browse</span>
              </div>
            ) : (
              <div style={{ position: 'relative', width: '100%', minHeight: 200, borderRadius: 12, overflow: 'hidden', border: '1px solid #2a2b35' }}>
                <img src={screenshot} alt="Screenshot" style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 8 }} />
                <div onClick={() => { setScreenshot(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.7)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>{"\u2715"}</div>
              </div>
            )}
          </div>
        </div>

        <button onClick={() => {
          setFinalTime(elapsedTime);
          if (intervalRef.current) clearInterval(intervalRef.current);
          // Build and save trade
          const entry = parseFloat(entryPrice) || 0;
          const exit = parseFloat(exitPrice) || 0;
          const qty = parseInt(contracts) || 0;
          const computedPl = plManualOverride ? parseFloat(pl) || 0 : (exit - entry) * qty * (positionType === 'DERIVATIVES' ? 100 : 1);
          const newTrade: Trade = {
            id: Date.now().toString(),
            ticker: ticker || 'UNKNOWN',
            companyName: ticker || 'Unknown',
            date: tradeDate,
            time: new Date().toLocaleTimeString(),
            strategy: positionType === 'DERIVATIVES' ? (strategyInputMode === 'select' ? strategyType : customStrategy || 'Custom') : 'Shares',
            direction: direction as 'LONG' | 'SHORT',
            contracts: qty,
            entryPrice: entry,
            exitPrice: exit,
            pl: computedPl,
            plPercent: entry > 0 ? ((exit - entry) / entry) * 100 : 0,
            riskAmount: parseFloat(risk) || 0,
            riskReward: riskReward,
            journal: journal,
            screenshot: screenshot || undefined,
            result: computedPl > 0 ? 'WIN' : computedPl < 0 ? 'LOSS' : 'WIN',
          };
          const updated = [...trades, newTrade];
          setTrades(updated);
          try { localStorage.setItem('wickcoach_trades', JSON.stringify(updated)); } catch {}
          setSubmitted(true);
        }} onMouseEnter={() => setSubmitHover(true)} onMouseLeave={() => setSubmitHover(false)} style={{ marginTop: 32, background: '#00d4a0', color: '#0e0f14', fontFamily: "'Chakra Petch', sans-serif", fontSize: 16, fontWeight: 700, padding: '14px 0', borderRadius: 10, border: 'none', cursor: 'pointer', width: '100%', letterSpacing: 1, filter: submitHover ? 'brightness(1.1)' : 'none' }}>Log Trade</button>

        <p style={{ color: '#4b5563', fontFamily: "'DM Mono', monospace", fontSize: 12, textAlign: 'center', marginTop: 12 }}>Your data stays on your device. Always.</p>
      </>
    );
  }

  const privacyCards = [
    { icon: <Eye size={22} color={teal} />, title: "Your trades stay yours", text: "All data stored locally in your browser. Nothing leaves your machine." },
    { icon: <Lock size={22} color={teal} />, title: "Upload any format", text: "CSVs, broker exports, screenshots \u2014 the AI reads it all and learns your history." },
    { icon: <ShieldCheck size={22} color={teal} />, title: "No tracking, no ads", text: "No analytics, no third-party sharing. Nothing." },
  ];

  const essentialFeatures = ["Trade logging", "Journal entries", "Past trades dashboard", "Equity curve", "Manual analytics"];
  const completeFeatures = ["Everything in Essential", "AI psychology coach", "Journal entry analysis", "Behavioral pattern detection", "Weekly goal tracking", "Mark Douglas methodology", "All future updates"];

  const faqs = [
    { q: "What is WickCoach?", a: "An AI trading journal that coaches your psychology by reading your trade logs AND your written journal entries." },
    { q: "How is the AI different?", a: "It reads what you wrote \u2014 your mindset, frustrations, confidence \u2014 and cross-references with results. It coaches behavior, not numbers." },
    { q: "Where is my data stored?", a: "Everything stays in your browser\u2019s local storage. We have zero access to it." },
    { q: "What\u2019s the difference between Essential and Complete?", a: "Essential gives you the trade log, journal, and dashboard. Complete adds the AI psychology coach that reads your entries, spots patterns, and holds you accountable." },
  ];

  return (
    <div style={{ background: "#0e0f14", color: "#d0d0d8", minHeight: "100vh", fontFamily: fm }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Chakra+Petch:wght@400;500;600;700&display=swap');
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1) } 50% { opacity: 0.3; transform: scale(1.3) } }
        @keyframes tabPulse { 0%, 100% { box-shadow: 0 0 6px rgba(0,212,160,0.1); border-color: rgba(0,212,160,0.12) } 50% { box-shadow: 0 0 24px rgba(0,212,160,0.45); border-color: rgba(0,212,160,0.4) } }
        * { box-sizing: border-box; margin: 0; padding: 0 }
        *::-webkit-scrollbar { display: none }
        * { -ms-overflow-style: none; scrollbar-width: none }
        .price-card { transition: box-shadow 0.3s ease, border-color 0.3s ease }
        .price-card:hover { box-shadow: 0 0 30px rgba(0,212,160,0.2); border-color: rgba(0,212,160,0.35) !important }
        ::selection { background: rgba(0,212,160,0.2); color: #fff }
      `}</style>

      {/* ═══ APP VIEW ═══ */}
      {view === 'app' && (<>
        <div style={{ padding: "12px 24px" }}>
          <span onClick={() => setView('home')} style={{ color: "#6b7280", fontFamily: fm, fontSize: 13, cursor: "pointer" }}>&larr; Back to home</span>
        </div>
        <nav style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 40px 0", borderBottom: "1px solid #1a1b22", overflow: "visible", position: 'relative' }}>
          <div onClick={() => setView('home')} style={{ marginBottom: 20, cursor: 'pointer' }}>
            <Logo size={34} showText />
          </div>
          <span style={{ position: 'absolute', top: 28, right: 40, color: teal, fontFamily: fm, fontSize: 14, cursor: 'pointer', fontWeight: 500 }}>Login</span>
          <div style={{ display: "flex", gap: 5, width: "100%", maxWidth: 920 }}>
            {tabs.map(t => (
              <span key={t} onClick={() => setActiveTab(t)} style={{ fontSize: 14, color: teal, letterSpacing: "0.04em", padding: "14px 16px 16px", cursor: "pointer", fontFamily: fm, borderRadius: "8px 8px 0 0", fontWeight: 600, background: activeTab === t ? "rgba(0,212,160,0.12)" : "rgba(0,212,160,0.05)", borderTop: activeTab === t ? `1px solid ${teal}` : "1px solid rgba(0,212,160,0.12)", borderRight: activeTab === t ? `1px solid ${teal}` : "1px solid rgba(0,212,160,0.12)", borderBottom: "none", borderLeft: activeTab === t ? `1px solid ${teal}` : "1px solid rgba(0,212,160,0.12)", flex: 1, textAlign: "center", lineHeight: 1.5 }}>{t}</span>
            ))}
          </div>
        </nav>
        {activeTab === 'Log a Trade' && (
          <div style={{ maxWidth: 580, margin: '0 auto', padding: '40px 20px' }}>
            <LogATradeContent setActiveTab={setActiveTab} />
          </div>
        )}
        {activeTab === 'Past Trades' && (
          <PastTradesContent trades={trades} setActiveTab={setActiveTab} />
        )}
        {activeTab !== '' && activeTab !== 'Log a Trade' && activeTab !== 'Past Trades' && (
          <div style={{ textAlign: 'center', paddingTop: 80 }}>
            <p style={{ color: '#4b5563', fontFamily: fm, fontSize: 16 }}>Coming soon</p>
          </div>
        )}
      </>)}

      {/* ═══ HOME VIEW ═══ */}
      {view === 'home' && (<>

      {/* ═══ NAV ═══ */}
      <nav style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 40px 0", borderBottom: "1px solid #1a1b22", overflow: "visible", position: 'relative' }}>
        <div style={{ marginBottom: 20 }}>
          <Logo size={34} showText />
        </div>
        <span style={{ position: 'absolute', top: 28, right: 40, color: teal, fontFamily: fm, fontSize: 14, cursor: 'pointer', fontWeight: 500 }}>Login</span>
        <div style={{ display: "flex", gap: 5, width: "100%", maxWidth: 920 }}>
          {tabs.map(t => (
            <span key={t} onClick={() => { setActiveTab(t); setView('app'); }} style={{ fontSize: 14, color: teal, letterSpacing: "0.04em", padding: "14px 16px 16px", cursor: "pointer", fontFamily: fm, borderRadius: "8px 8px 0 0", fontWeight: 600, background: "rgba(0,212,160,0.05)", borderTop: "1px solid rgba(0,212,160,0.12)", borderRight: "1px solid rgba(0,212,160,0.12)", borderBottom: "none", borderLeft: "1px solid rgba(0,212,160,0.12)", flex: 1, textAlign: "center", lineHeight: 1.5, animation: showClickHint ? "iconGlowPulse 1s ease-in-out 3" : tabGlow ? "tabPulse 1.4s ease infinite" : "none" }}>{t}</span>
          ))}
        </div>
        {/* "click these" hint below app tabs */}
        <div style={{ textAlign: 'center', marginTop: 8, height: 16 }}>
          <span style={{ fontFamily: fm, fontSize: 11, color: '#9ca3af', opacity: showClickHint ? 1 : 0, transition: 'opacity 0.5s ease' }}>click these ↑</span>
        </div>
        <style>{`@keyframes iconGlowPulse { 0%,100% { box-shadow: 0 0 0px rgba(0,212,160,0); } 50% { box-shadow: 0 0 12px rgba(0,212,160,0.4); } }`}</style>
      </nav>

      {/* ═══ FEATURE CAROUSEL ═══ */}
      <section style={{ position: 'relative', overflow: 'hidden', minHeight: '100vh', padding: '80px 20px 100px', background: '#0e0f14' }}>
        <div style={{ position: 'absolute', top: -200, right: -200, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,160,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -300, left: -200, width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,160,0.05) 0%, rgba(59,130,246,0.03) 50%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ textAlign: 'center', marginBottom: 60, position: 'relative' }}>
            {/* Hero animation video */}
            <video ref={heroVideoRef} autoPlay muted playsInline src="/wickcoach-logo-anim.mp4" style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', height: 300, width: 'auto', objectFit: 'contain' as const, opacity: textVisible ? 0.1 : 1, zIndex: 0, pointerEvents: 'none', transition: 'opacity 1s ease-out', mixBlendMode: 'lighten' as const, }} />
            {/* Heading */}
            <h1 style={{ position: 'relative', zIndex: 1, fontFamily: fd, color: '#ffffff', fontSize: 44, fontWeight: 700, lineHeight: 1.2, maxWidth: 800, margin: '0 auto 0', opacity: textVisible ? 1 : 0, filter: textVisible ? 'blur(0px)' : 'blur(8px)', transition: 'opacity 1s ease-in, filter 1s ease-in' }}>The trading journal that <span style={{ color: teal, textShadow: textVisible ? '0 0 20px rgba(0,212,160,0.3), 0 0 40px rgba(0,212,160,0.15)' : 'none', transition: 'text-shadow 1s ease-in 1s' }}>fixes your psychology</span></h1>
            {/* Subtitle */}
            <p style={{ position: 'relative', zIndex: 1, color: '#e5e7eb', fontFamily: fm, fontSize: 15, maxWidth: 600, margin: '0 auto', lineHeight: 1.7, marginTop: 24, opacity: textVisible ? 1 : 0, filter: textVisible ? 'blur(0px)' : 'blur(8px)', transition: 'opacity 1s ease-in, filter 1s ease-in' }}>AI-enhanced behavioral and trading pattern recognition</p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 28, marginBottom: 48 }}>
            {[
              { label: "Trading Goals", d: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12zM12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" },
              { label: "Log a Trade", d: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" },
              { label: "Past Trades", d: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 6v6l4 2" },
              { label: "Analysis", d: "M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7zM9 21h6" },
              { label: "Trader Profile", d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" },
              { label: "Position Sizer", d: "M4 2h16a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM8 6h8M8 10h8M8 14h4" },
              { label: "Growth Simulator", d: "M23 6l-9.5 9.5-5-5L1 18M17 6h6v6" },
              { label: "Trade Timeline", d: "M3 4h18a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM16 2v4M8 2v4M1 10h22" },
            ].map((cat, i) => {
              const isActive = activeCategory === i;
              return (
                <div key={i} onClick={() => handleCategoryClick(i)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <div style={{ width: 56, height: 56, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isActive ? 'linear-gradient(135deg, rgba(0,212,160,0.25), rgba(0,212,160,0.1))' : 'rgba(255,255,255,0.03)', border: isActive ? '1px solid rgba(0,212,160,0.5)' : '1px solid rgba(255,255,255,0.06)', boxShadow: isActive ? '0 0 20px rgba(0,212,160,0.4), 0 0 50px rgba(0,212,160,0.25), 0 0 100px rgba(0,212,160,0.12)' : 'none', transform: isActive ? 'scale(1.15)' : 'scale(1)', transition: 'all 0.3s ease', }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={isActive ? teal : '#6b7280'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={cat.d} /></svg>
                  </div>
                  <span style={{ fontFamily: fm, fontSize: 11, color: isActive ? teal : '#6b7280', textAlign: 'center', whiteSpace: 'nowrap' as const, transition: 'color 0.3s ease' }}>{cat.label}</span>
                </div>
              );
            })}
          </div>
          {/* iMac frame */}
          <div style={{ maxWidth: 1060, margin: '0 auto', padding: '0 20px' }}>
            {/* Monitor */}
            <div style={{ background: 'linear-gradient(180deg, #38393f 0%, #2c2d33 4%, #232428 100%)', borderRadius: '18px 18px 2px 2px', padding: '10px 10px 28px 10px', position: 'relative', boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 20px 60px rgba(0,0,0,0.5), 0 0 100px rgba(0,0,0,0.3), inset 0 0 10px rgba(0,0,0,0.5)' }}>
              {/* Camera dot */}
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#0e0f14', border: '1px solid #3a3b45', margin: '2px auto 6px' }} />
              {/* Screen bezel */}
              <div style={{ background: '#000000', borderRadius: 6, padding: 5, position: 'relative', border: '1px solid #3a3b45' }}>
                {/* Screen content */}
                <div style={{ background: '#0e0f14', borderRadius: 4, overflow: 'hidden', height: 440, padding: 32 }}>
                  {activeCategory === 0 && <MockTradingGoals onAdvance={() => setActiveCategory(1)} frozen={!textVisible} />}
                  {activeCategory === 1 && <MockLogATrade onAdvance={() => setActiveCategory(2)} />}
                  {activeCategory === 2 && <MockPastTrades onAdvance={() => setActiveCategory(0)} />}
                  {activeCategory === 3 && <MockAnalysis />}
                  {activeCategory === 4 && <MockTraderProfile />}
                  {activeCategory === 5 && <MockPositionSizer />}
                  {activeCategory === 6 && <MockGrowthSimulator />}
                  {activeCategory === 7 && <MockTradeTimeline />}
                </div>
              </div>
              {/* Chin with WickCoach logo */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg width="23" height="28" viewBox="0 0 20 24" fill="none">
                    <circle cx="8" cy="4" r="2.8" stroke="#7a7d88" strokeWidth="1.2" fill="none" />
                    <line x1="8" y1="6.8" x2="8" y2="15" stroke="#7a7d88" strokeWidth="1.2" />
                    <line x1="8" y1="9.5" x2="3" y2="13" stroke="#7a7d88" strokeWidth="1.2" />
                    <line x1="8" y1="9.5" x2="14.5" y2="6" stroke="#7a7d88" strokeWidth="1.2" />
                    <line x1="8" y1="15" x2="4.5" y2="21" stroke="#7a7d88" strokeWidth="1.2" />
                    <line x1="8" y1="15" x2="11.5" y2="21" stroke="#7a7d88" strokeWidth="1.2" />
                    <line x1="15.5" y1="2" x2="15.5" y2="12" stroke="#00d4a0" strokeWidth="0.8" />
                    <rect x="13.5" y="4" width="4" height="5" rx="0.5" fill="#00d4a0" opacity="0.9" />
                  </svg>
                  <span style={{ fontSize: 22, letterSpacing: '0.12em', fontWeight: 700, fontFamily: fd }}>
                    <span style={{ color: '#d0d0d8' }}>WICK</span>
                    <span style={{ color: '#00d4a0' }}>COACH</span>
                  </span>
                </div>
              </div>
            </div>
            {/* Stand neck */}
            <div style={{ width: 100, height: 50, margin: '0 auto', background: 'linear-gradient(180deg, #222328 0%, #1a1b20 40%, #28292f 100%)', clipPath: 'polygon(15% 0%, 85% 0%, 100% 100%, 0% 100%)', position: 'relative' }}>
              <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 1, background: 'rgba(255,255,255,0.06)' }} />
            </div>
            {/* Stand base */}
            <div style={{ width: 180, height: 10, margin: '0 auto', background: 'linear-gradient(180deg, #28292f 0%, #1c1d22 100%)', borderRadius: '0 0 50% 50% / 0 0 100% 100%', boxShadow: '0 2px 10px rgba(0,0,0,0.4)', position: 'relative' }}>
              <div style={{ position: 'absolute', left: '10%', right: '10%', top: 0, height: 1, background: 'rgba(255,255,255,0.08)' }} />
            </div>
            {/* Surface shadow */}
            <div style={{ width: '50%', height: 20, margin: '4px auto 0', background: 'radial-gradient(ellipse, rgba(0,0,0,0.3) 0%, transparent 70%)', pointerEvents: 'none' }} />
            {/* Teal glow reflection */}
            <div style={{ width: '40%', height: 30, margin: '-15px auto 0', background: 'radial-gradient(ellipse, rgba(0,212,160,0.04) 0%, transparent 70%)', filter: 'blur(8px)', pointerEvents: 'none' }} />
          </div>

          {/* CTA */}
          <div style={{ textAlign: 'center', marginTop: 48 }}>
            <button onClick={() => setView('app')} style={{ background: teal, color: '#0e0f14', fontFamily: fd, fontSize: 18, fontWeight: 700, padding: '16px 48px', borderRadius: 12, border: 'none', cursor: 'pointer', letterSpacing: 1, boxShadow: '0 0 30px rgba(0,212,160,0.2)' }}>Log Goals &rarr;</button>
            <p
              onMouseEnter={(e) => { (e.target as HTMLElement).style.color = '#00d4a0'; }}
              onMouseLeave={(e) => { (e.target as HTMLElement).style.color = '#6b7280'; }}
              style={{ color: '#6b7280', fontFamily: fm, fontSize: 12, marginTop: 8, cursor: 'pointer', textAlign: 'center' }}
            >or sign up to get started</p>
            <p style={{ color: '#6b7280', fontFamily: fm, fontSize: 14, marginTop: 12 }}>One-time payment. No subscription. No data collection.</p>
          </div>
        </div>
      </section>

      {/* ═══ PRIVACY + DATA UPLOAD ═══ */}
      <section style={{ padding: "100px 48px", maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
        <h2 style={{ fontSize: 34, fontWeight: 700, fontFamily: fd, lineHeight: 1.3, marginBottom: 20, color: "#e8e8f0" }}>
          We never see your data.<br />It&apos;s stored on your own computer.
        </h2>
        <p style={{ fontSize: 16, color: "#9a9da8", lineHeight: 1.7, fontFamily: fm, maxWidth: 520, margin: "0 auto 40px" }}>
          Upload your past trading data in any format &mdash; CSVs, broker statements, screenshots. The AI uses it to understand your trading history before you log a single trade.
        </p>
        <div style={{ display: "flex", gap: 20 }}>
          {privacyCards.map((c, i) => (
            <div key={i} style={{ flex: 1, background: "#13141a", border: "1px solid #1a1b22", borderRadius: 12, padding: "28px 24px", textAlign: "left" }}>
              <div style={{ marginBottom: 16 }}>{c.icon}</div>
              <div style={{ fontSize: 17, fontWeight: 600, color: "#d0d0d8", marginBottom: 10, fontFamily: fd }}>{c.title}</div>
              <div style={{ fontSize: 15, color: "#9a9da8", lineHeight: 1.7, fontFamily: fm }}>{c.text}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section style={{ padding: "100px 48px", maxWidth: 750, margin: "0 auto" }}>
        <h2 style={{ fontSize: 34, fontWeight: 700, fontFamily: fd, marginBottom: 12, color: "#e8e8f0", textAlign: "center" }}>Choose your plan.</h2>
        <p style={{ fontSize: 15, color: "#6a6d78", fontFamily: fm, textAlign: "center", marginBottom: 50 }}>One-time payment with software updates included.</p>
        <div style={{ display: "flex", gap: 20 }}>
          {/* Essential */}
          <div className="price-card" style={{ flex: 1, background: "#13141a", border: "1px solid #1e1e28", borderRadius: 14, padding: "36px 28px", textAlign: "center" }}>
            <div style={{ fontSize: 14, color: "#9a9da8", fontFamily: fm, fontWeight: 600, marginBottom: 6 }}>ESSENTIAL</div>
            <div style={{ fontSize: 44, fontWeight: 800, color: "#e8e8f0", fontFamily: fd, marginBottom: 4 }}>$35</div>
            <div style={{ fontSize: 14, color: "#6a6d78", marginBottom: 24, fontFamily: fm }}>one-time</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 28, textAlign: "left" }}>
              {essentialFeatures.map(f => (
                <div key={f} style={{ fontSize: 14, color: "#b0b4c0", fontFamily: fm }}>
                  <span style={{ color: teal, marginRight: 10 }}>+</span>{f}
                </div>
              ))}
            </div>
            <div style={{ fontSize: 12, color: "#5a5d68", fontFamily: fm, marginBottom: 16 }}>No AI coach included</div>
            <div style={{ background: "rgba(0,212,160,0.1)", color: teal, padding: "13px 28px", borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: fm, border: "1px solid rgba(0,212,160,0.2)" }}>Get Essential</div>
          </div>
          {/* Complete */}
          <div className="price-card" style={{ flex: 1, background: "#13141a", border: "2px solid rgba(0,212,160,0.3)", borderRadius: 14, padding: "36px 28px", textAlign: "center", position: "relative" }}>
            <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: teal, color: "#0a0a0f", fontSize: 11, fontWeight: 700, padding: "4px 16px", borderRadius: 20, fontFamily: fm }}>RECOMMENDED</div>
            <div style={{ fontSize: 14, color: teal, fontFamily: fm, fontWeight: 600, marginBottom: 6 }}>COMPLETE</div>
            <div style={{ fontSize: 44, fontWeight: 800, color: "#e8e8f0", fontFamily: fd, marginBottom: 4 }}>$99</div>
            <div style={{ fontSize: 14, color: "#6a6d78", marginBottom: 24, fontFamily: fm }}>one-time</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 28, textAlign: "left" }}>
              {completeFeatures.map(f => (
                <div key={f} style={{ fontSize: 14, color: "#b0b4c0", fontFamily: fm }}>
                  <span style={{ color: teal, marginRight: 10 }}>+</span>{f}
                </div>
              ))}
            </div>
            <div style={{ background: teal, color: "#0a0a0f", padding: "13px 28px", borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: fm, boxShadow: "0 0 20px rgba(0,212,160,0.25)" }}>Get Complete</div>
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section style={{ padding: "100px 48px", maxWidth: 640, margin: "0 auto" }}>
        <h2 style={{ fontSize: 30, fontWeight: 700, fontFamily: fd, marginBottom: 40, color: "#e8e8f0" }}>Frequently Asked Questions</h2>
        {faqs.map((f, i) => (
          <FAQ key={i} q={f.q} a={f.a} open={openFAQ === i} onClick={() => setOpenFAQ(openFAQ === i ? null : i)} />
        ))}
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer style={{ background: "#0a0b10", borderTop: "1px solid #1a1b22", padding: "60px 48px 30px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr", gap: 40 }}>
          <div>
            <Logo size={22} showText />
            <div style={{ fontSize: 14, color: "#6a6d78", lineHeight: 1.65, marginTop: 14, fontFamily: fm }}>The first AI trading journal that coaches your psychology.</div>
          </div>
          {[
            { t: "Product", l: ["Features", "Pricing", "Demo"] },
            { t: "Support", l: ["FAQ", "Contact", "Privacy", "Terms"] },
          ].map(c => (
            <div key={c.t}>
              <div style={{ fontSize: 12, color: "#9a9da8", letterSpacing: "0.08em", marginBottom: 16, fontWeight: 500, fontFamily: fm }}>{c.t}</div>
              {c.l.map(l => <div key={l} style={{ fontSize: 14, color: "#6a6d78", marginBottom: 10, cursor: "pointer", fontFamily: fm }}>{l}</div>)}
            </div>
          ))}
          <div>
            <div style={{ fontSize: 12, color: "#9a9da8", letterSpacing: "0.08em", marginBottom: 16, fontWeight: 500, fontFamily: fm }}>Connect</div>
            {["Twitter / X", "Discord", "Email"].map(l => <div key={l} style={{ fontSize: 14, color: "#6a6d78", marginBottom: 10, cursor: "pointer", fontFamily: fm }}>{l}</div>)}
            <div style={{ fontSize: 15, color: teal, marginTop: 20, fontWeight: 600, fontFamily: fm }}>From $35 one-time</div>
          </div>
        </div>
        <div style={{ maxWidth: 1000, margin: "40px auto 0", borderTop: "1px solid #1a1b22", paddingTop: 20, textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "#3a3d48", fontFamily: fm }}>&copy; 2026 WickCoach. All rights reserved.</div>
        </div>
      </footer>

      </>)}
    </div>
  );
}
