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
  const rows = [{ t: "NVDA", d: "Mar 14", s: "0DTE Call", pl: "+$870", w: true }, { t: "QQQ", d: "Mar 13", s: "0DTE Put", pl: "+$445", w: true }, { t: "TSLA", d: "Mar 12", s: "Call Scalp", pl: "-$210", w: false }, { t: "SPY", d: "Mar 11", s: "Put Debit", pl: "+$380", w: true }, { t: "AAPL", d: "Mar 10", s: "0DTE Call", pl: "-$155", w: false }];
  return (<div>
    <div style={{ display: "flex", padding: "10px 0", borderBottom: "1px solid #1a1b22", color: "#6b7280", fontFamily: fm, fontSize: 11 }}><span style={{ width: 70 }}>Date</span><span style={{ flex: 1 }}>Ticker</span><span style={{ flex: 1 }}>Strategy</span><span style={{ width: 80, textAlign: "right" }}>P/L</span><span style={{ width: 60, textAlign: "right" }}>Result</span></div>
    {rows.map((r, i) => (<div key={i} style={{ display: "flex", alignItems: "center", padding: "12px 0", borderBottom: i < 4 ? "1px solid #1a1b22" : "none", fontFamily: fm, fontSize: 13 }}><span style={{ width: 70, color: "#9ca3af" }}>{r.d}</span><span style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, color: "#fff", fontWeight: 700 }}><CLogo t={r.t} />{r.t}</span><span style={{ flex: 1, color: "#9ca3af" }}>{r.s}</span><span style={{ width: 80, textAlign: "right", color: r.w ? teal : "#ef4444", fontWeight: 700 }}>{r.pl}</span><span style={{ width: 60, textAlign: "right" }}><span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 4, background: r.w ? "rgba(0,212,160,0.1)" : "rgba(239,68,68,0.1)", color: r.w ? teal : "#ef4444" }}>{r.w ? "WIN" : "LOSS"}</span></span></div>))}
  </div>);
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

function PastTradesContent({ trades, setActiveTab }: { trades: Trade[]; setActiveTab: (tab: string) => void }) {
  const [search, setSearch] = useState('');
  const [stratFilter, setStratFilter] = useState('All');
  const [resultFilter, setResultFilter] = useState('All');
  const [dateRange, setDateRange] = useState('All Time');
  const [sortBy, setSortBy] = useState('Newest');
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

  // Stats
  const wins = filtered.filter(t => t.result === 'WIN');
  const losses = filtered.filter(t => t.result === 'LOSS');
  const totalPL = filtered.reduce((s, t) => s + t.pl, 0);
  const winRate = filtered.length > 0 ? Math.round((wins.length / filtered.length) * 100) : 0;
  const avgRR = filtered.length > 0 ? (filtered.reduce((s, t) => s + (parseFloat(t.riskReward) || 0), 0) / filtered.length).toFixed(1) : '—';
  const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + t.pl, 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + t.pl, 0) / losses.length) : 0;
  const expectedValue = filtered.length > 0 ? (winRate / 100) * avgWin - ((100 - winRate) / 100) * avgLoss : 0;

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

  const tickerLogos: Record<string, string> = {
    QQQ: 'https://logo.clearbit.com/invesco.com', NVDA: 'https://logo.clearbit.com/nvidia.com',
    AAPL: 'https://logo.clearbit.com/apple.com', TSLA: 'https://logo.clearbit.com/tesla.com',
    SPY: 'https://logo.clearbit.com/ssga.com', AMZN: 'https://logo.clearbit.com/amazon.com',
    META: 'https://logo.clearbit.com/meta.com', MSFT: 'https://logo.clearbit.com/microsoft.com',
    GOOGL: 'https://logo.clearbit.com/google.com', AMD: 'https://logo.clearbit.com/amd.com',
    GOOG: 'https://logo.clearbit.com/google.com', NFLX: 'https://logo.clearbit.com/netflix.com',
    BA: 'https://logo.clearbit.com/boeing.com', DIS: 'https://logo.clearbit.com/disney.com',
    JPM: 'https://logo.clearbit.com/jpmorganchase.com', V: 'https://logo.clearbit.com/visa.com',
    WMT: 'https://logo.clearbit.com/walmart.com', COIN: 'https://logo.clearbit.com/coinbase.com',
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

  return (
    <div style={{ position: 'relative', maxWidth: 1100, margin: '0 auto', padding: '32px 24px', minHeight: '80vh', background: 'linear-gradient(180deg, #0e0f14 0%, #0f1210 40%, #0e0f14 100%)' }}>
      {/* Background glows */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'radial-gradient(circle at 10% 0%, rgba(0,212,160,0.05) 0%, transparent 50%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'radial-gradient(circle at 90% 100%, rgba(0,212,160,0.03) 0%, transparent 50%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* ── STAT CARDS ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'TOTAL P/L', value: formatDollar(totalPL), color: totalPL >= 0 ? teal : '#ef4444', sub: <svg width="100%" height="32" viewBox="0 0 200 32" preserveAspectRatio="none" style={{ display: 'block', opacity: 0.5, marginTop: 4 }}><path d={sparkPoints.replace(/60/g, '200').replace(/24/g, '32') || 'M0,16 L200,16'} stroke={totalPL >= 0 ? teal : '#ef4444'} strokeWidth="2" fill="none" /></svg> },
            { label: 'WIN RATE', value: `${winRate}%`, color: '#fff', sub: <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}><svg width="40" height="40" viewBox="0 0 52 52"><circle cx="26" cy="26" r="20" fill="none" stroke="#1e1f2a" strokeWidth="4.5" /><circle cx="26" cy="26" r="20" fill="none" stroke={teal} strokeWidth="4.5" strokeDasharray={`${winRate * 1.257} 125.7`} strokeLinecap="round" transform="rotate(-90 26 26)" /></svg><span style={{ fontFamily: fm, fontSize: 13, color: '#8a8d98' }}>{wins.length}W / {losses.length}L</span></div> },
            { label: 'TOTAL TRADES', value: `${filtered.length}`, color: '#fff', sub: <div style={{ fontFamily: fm, fontSize: 13, color: '#8a8d98', marginTop: 4 }}>{wins.length} wins · {losses.length} losses</div> },
            { label: 'AVG R:R', value: avgRR, color: '#fff', sub: null },
            { label: 'EXPECTED VALUE', value: formatDollar(Math.round(expectedValue)), color: expectedValue >= 0 ? teal : '#ef4444', sub: <div style={{ fontFamily: fm, fontSize: 13, color: '#8a8d98', marginTop: 4 }}>per trade</div> },
          ].map(card => (
            <div key={card.label} style={{ background: '#131418', borderTop: '1px solid #1e1f2a', borderRight: '1px solid #1e1f2a', borderBottom: '1px solid #1e1f2a', borderLeft: '1px solid #1e1f2a', borderRadius: 14, padding: '22px 20px 18px', transition: 'all 0.3s ease' }} onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 40px rgba(0,212,160,0.08)'; e.currentTarget.style.borderColor = 'rgba(0,212,160,0.15)'; }} onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#1e1f2a'; }}>
              <div style={{ color: '#9ca3af', fontFamily: fm, fontSize: 14, letterSpacing: 1, marginBottom: 10, textTransform: 'uppercase' as const }}>{card.label}</div>
              <div style={{ color: card.color, fontFamily: fd, fontSize: 30, fontWeight: 700 }}>{card.value}</div>
              {card.sub}
            </div>
          ))}
        </div>

        {/* ── FILTER BAR ── */}
        <div style={{ background: '#13141a', borderRadius: 14, padding: '16px 20px', borderTop: '1px solid #1e1f2a', borderRight: '1px solid #1e1f2a', borderBottom: '1px solid #1e1f2a', borderLeft: '1px solid #1e1f2a', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search ticker..." style={{ ...selectBase, paddingLeft: 38, width: 180 }} />
            </div>

            {/* Strategy dropdown */}
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <select value={stratFilter} onChange={e => setStratFilter(e.target.value)} style={{ ...selectBase, paddingRight: 32, minWidth: 170 }}>
                {strategies.map(s => <option key={s} value={s}>{s === 'All' ? 'All Strategies' : s}</option>)}
                <option value="+ Add New">+ Add New</option>
              </select>
              <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: teal, fontSize: 10, pointerEvents: 'none' }}>▼</span>
            </div>
            {stratFilter !== 'All' && stratFilter !== '+ Add New' && (
              <span onClick={() => removeStrategy(stratFilter)} style={{ color: '#ef4444', fontSize: 12, cursor: 'pointer', fontFamily: fm }}>✕</span>
            )}

            {/* Separator */}
            <div style={{ width: 1, height: 28, background: '#1e1f2a' }} />

            {/* Result pills */}
            <div style={{ display: 'flex', gap: 6 }}>
              {['All', 'Wins', 'Losses', 'Break Even'].map(r => (
                <span key={r} onClick={() => setResultFilter(r)} style={pillBtn(resultFilter === r)}>{r}</span>
              ))}
            </div>

            {/* Separator */}
            <div style={{ width: 1, height: 28, background: '#1e1f2a' }} />

            {/* Date pills */}
            <div style={{ display: 'flex', gap: 6 }}>
              {['This Week', 'This Month', 'All Time'].map(d => (
                <span key={d} onClick={() => setDateRange(d)} style={pillBtn(dateRange === d)}>{d}</span>
              ))}
            </div>

            {/* Sort dropdown — pushed right */}
            <div style={{ position: 'relative', display: 'inline-block', marginLeft: 'auto' }}>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ ...selectBase, paddingRight: 32 }}>
                {['Newest', 'Oldest', 'Highest P/L', 'Lowest P/L', 'Ticker A-Z'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: teal, fontSize: 10, pointerEvents: 'none' }}>▼</span>
            </div>
          </div>
        </div>

        {/* ── TRADE LIST ── */}
        <div style={{ background: '#111218', borderTop: '1px solid #2a2b32', borderRight: '1px solid #2a2b32', borderBottom: '1px solid #2a2b32', borderLeft: '1px solid #2a2b32', borderRadius: 12, padding: 20, boxShadow: '0 0 40px rgba(0,212,160,0.03)' }}>
          {/* Section header */}
          <div style={{ marginBottom: 16 }}>
            <span style={{ fontFamily: fd, fontSize: 24, fontWeight: 700, color: teal }}>Trade History</span>
            <span style={{ fontFamily: fm, fontSize: 14, color: '#6b7280', marginLeft: 12 }}>{filtered.length} trade{filtered.length !== 1 ? 's' : ''}</span>
          </div>

          {filtered.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px' }}>
              <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                <rect x="12" y="32" width="7" height="14" rx="1.5" fill="#1e1f2a" />
                <rect x="24.5" y="20" width="7" height="26" rx="1.5" fill="#1e1f2a" />
                <rect x="37" y="26" width="7" height="20" rx="1.5" fill="#1e1f2a" />
                <line x1="15.5" y1="25" x2="15.5" y2="32" stroke="#1e1f2a" strokeWidth="1.5" />
                <line x1="28" y1="12" x2="28" y2="20" stroke="#1e1f2a" strokeWidth="1.5" />
                <line x1="40.5" y1="19" x2="40.5" y2="26" stroke="#1e1f2a" strokeWidth="1.5" />
              </svg>
              <div style={{ color: '#8a8d98', fontFamily: fm, fontSize: 16, marginTop: 20 }}>No trades logged yet</div>
              <span onClick={() => setActiveTab('Log a Trade')} style={{ color: teal, fontFamily: fm, fontSize: 14, cursor: 'pointer', marginTop: 10, fontWeight: 600 }}>Log your first trade &rarr;</span>
            </div>
          ) : (<>
            {/* Column headers */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr 1.4fr 1.2fr 1fr 0.8fr', padding: '14px 20px', borderBottom: '2px solid #2a2b32', marginBottom: 8 }}>
              {['Symbol', 'Date', 'Strategy', 'Direction', 'Entry / Exit', 'P/L', 'R:R', 'Result'].map(h => (
                <span key={h} style={{ color: '#9ca3af', fontFamily: fm, fontSize: 13, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 1.5, textAlign: 'center' }}>{h}</span>
              ))}
            </div>

            {/* Rows */}
            {filtered.map(t => {
              const logoUrl = tickerLogos[t.ticker] || `https://logo.clearbit.com/${t.ticker.toLowerCase()}.com`;
              return (
                <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr 1.4fr 1.2fr 1fr 0.8fr', padding: '16px 20px', borderBottom: '1px solid #1e1f2a', alignItems: 'center', fontFamily: fm, fontSize: 15, color: '#e8e8f0', transition: 'background 0.15s' }} onMouseEnter={e => { e.currentTarget.style.background = '#1c1d28'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                  {/* Symbol — logo + ticker + company */}
                  <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <img src={logoUrl} alt="" width={28} height={28} style={{ borderRadius: 6, background: '#1a1b22', objectFit: 'cover' as const, flexShrink: 0 }} onError={e => { const el = e.target as HTMLImageElement; el.style.display = 'none'; if (el.nextElementSibling) (el.nextElementSibling as HTMLElement).style.display = 'flex'; }} />
                    <span style={{ display: 'none', width: 28, height: 28, borderRadius: 6, background: '#1e1f2a', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{t.ticker[0]}</span>
                    <span>
                      <div style={{ fontWeight: 700, color: '#fff', fontSize: 15 }}>{t.ticker}</div>
                      <div style={{ color: '#6b7280', fontSize: 12, marginTop: 2 }}>{t.companyName || t.ticker}</div>
                    </span>
                  </span>

                  {/* Date + Time */}
                  <span style={{ textAlign: 'center' }}>
                    <div style={{ color: '#e8e8f0', fontSize: 15 }}>{formatDate(t.date)}</div>
                    <div style={{ color: '#8a8d98', fontSize: 12, marginTop: 2 }}>{formatTime(t.time)}</div>
                  </span>

                  {/* Strategy */}
                  <span style={{ textAlign: 'center', color: '#e8e8f0', fontSize: 15 }}>{t.strategy}</span>

                  {/* Direction */}
                  <span style={{ textAlign: 'center' }}>
                    <span style={{ display: 'inline-block', padding: '5px 14px', borderRadius: 6, fontSize: 13, fontWeight: 700, letterSpacing: 0.5, background: t.direction === 'LONG' ? 'rgba(0,212,160,0.1)' : 'rgba(239,68,68,0.1)', color: t.direction === 'LONG' ? teal : '#ef4444' }}>{t.direction}</span>
                  </span>

                  {/* Entry / Exit */}
                  <span style={{ textAlign: 'center', color: '#e8e8f0', fontSize: 15 }}>
                    <span>${t.entryPrice.toFixed(2)}</span>
                    <span style={{ color: '#4b5563', margin: '0 6px' }}>/</span>
                    <span>${t.exitPrice.toFixed(2)}</span>
                  </span>

                  {/* P/L */}
                  <span style={{ textAlign: 'center', color: t.pl >= 0 ? teal : '#ef4444', fontWeight: 700, fontSize: 16 }}>{formatDollar(t.pl)}</span>

                  {/* R:R */}
                  <span style={{ textAlign: 'center', whiteSpace: 'nowrap', color: '#e8e8f0', fontSize: 15 }}>{t.riskReward}</span>

                  {/* Result */}
                  <span style={{ textAlign: 'center' }}>
                    <span style={{ display: 'inline-block', padding: '5px 14px', borderRadius: 6, fontSize: 13, fontWeight: 700, background: t.result === 'WIN' ? 'rgba(0,212,160,0.12)' : 'rgba(239,68,68,0.12)', color: t.result === 'WIN' ? teal : '#ef4444' }}>{t.result}</span>
                  </span>
                </div>
              );
            })}
          </>)}
        </div>
      </div>
    </div>
  );
}

export default function WickCoachFull() {
  const [tabGlow, setTabGlow] = useState(false);
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("Log a Trade");
  const [view, setView] = useState<'home' | 'app'>('home');
  const [activeCategory, setActiveCategory] = useState(0);
  const [videoEnded, setVideoEnded] = useState(false);
  const [textVisible, setTextVisible] = useState(false);
  const [showClickHint, setShowClickHint] = useState(false);
  const [trades, setTrades] = useState<Trade[]>([]);
  const heroVideoRef = useRef<HTMLVideoElement>(null);

  // Load trades from localStorage on mount
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('wickcoach_trades');
      if (stored) setTrades(JSON.parse(stored));
    } catch {}
  }, []);

  React.useEffect(() => {
    if (heroVideoRef.current) heroVideoRef.current.playbackRate = 1.0;
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
        const calc = (parseFloat(exitPrice) - parseFloat(entryPrice)) * parseInt(contracts) * multiplier;
        setPl(calc.toFixed(2));
      }
    }, [entryPrice, exitPrice, contracts, plManualOverride, positionType]);

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
        <nav style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 40px 0", borderBottom: "1px solid #1a1b22", overflow: "visible" }}>
          <div onClick={() => setView('home')} style={{ marginBottom: 20, cursor: 'pointer' }}>
            <Logo size={34} showText />
          </div>
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
        {activeTab !== 'Log a Trade' && activeTab !== 'Past Trades' && (
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
            {/* Animated logo video */}
            <video ref={heroVideoRef} autoPlay muted playsInline src="/wickcoach-logo-anim.mp4" onEnded={() => setVideoEnded(true)} style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', height: 300, width: 'auto', objectFit: 'contain', opacity: textVisible ? 0.1 : 1, zIndex: 0, pointerEvents: 'none', transition: 'opacity 1s ease-out', mixBlendMode: 'lighten' as const, clipPath: 'inset(0 0 15% 0)' }} />
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
            <p style={{ color: '#6b7280', fontFamily: fm, fontSize: 13, marginTop: 12 }}>One-time payment. No subscription. No data collection.</p>
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
