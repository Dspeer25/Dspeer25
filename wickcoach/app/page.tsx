'use client';
import React, { useState, useEffect, useRef } from "react";
import { Lock, Eye, ShieldCheck } from "lucide-react";
import AnalysisContent from "./components/AnalysisHub";

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

const tickerDomains: Record<string, string> = {
  QQQ: 'invesco.com', SPY: 'spglobal.com', AAPL: 'apple.com', NVDA: 'nvidia.com',
  TSLA: 'tesla.com', AMZN: 'amazon.com', META: 'meta.com', MSFT: 'microsoft.com',
  GOOGL: 'google.com', GOOG: 'google.com', AMD: 'amd.com', NFLX: 'netflix.com',
  BA: 'boeing.com', DIS: 'disney.com', JPM: 'jpmorgan.com',
  V: 'visa.com', WMT: 'walmart.com', COIN: 'coinbase.com', PLTR: 'palantir.com',
  SOFI: 'sofi.com', CRM: 'salesforce.com', COST: 'costco.com', HD: 'homedepot.com',
  UNH: 'unitedhealthgroup.com',
};
const cDomains = tickerDomains;
const CLogo = ({ t }: { t: string }) => <img src={`https://www.google.com/s2/favicons?domain=${tickerDomains[t] || t.toLowerCase() + '.com'}&sz=64`} alt={t} style={{ width: 20, height: 20, borderRadius: "50%", background: "#1a1b22", objectFit: "cover" as const }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />;

const tickerBgColors: Record<string, string> = { QQQ: '#7b3fe4', TSLA: '#cc0000', SPY: '#1a4a8a', NVDA: '#76b900', AAPL: '#555', META: '#0668E1', AMZN: '#ff9900', MSFT: '#00a4ef', GOOGL: '#4285f4', AMD: '#ed1c24', NFLX: '#e50914', BA: '#0039a6', DIS: '#113ccf', JPM: '#006cb7', V: '#1a1f71', WMT: '#0071dc', COIN: '#0052ff', GOOG: '#4285f4' };

const TickerLogo = ({ ticker }: { ticker: string }) => {
  const [failed, setFailed] = useState(false);
  return (
    <div style={{ width: 24, height: 24, flexShrink: 0, position: 'relative' }}>
      {!failed && (
        <img
          src={`https://eodhd.com/img/logos/US/${ticker}.png`}
          alt={ticker}
          width={24}
          height={24}
          style={{ objectFit: 'cover', borderRadius: 6, display: 'block' }}
          onError={() => setFailed(true)}
        />
      )}
      {failed && (
        <div style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(0,212,160,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#00d4a0', fontFamily: fd }}>{ticker.charAt(0)}</span>
        </div>
      )}
    </div>
  );
};

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
          <div style={{ flex: 1, padding: '4px 0', borderRadius: 4, fontSize: 11, fontFamily: fm, fontWeight: 700, textAlign: 'center', background: derivSelected ? '#1a1b22' : 'rgba(0,212,160,0.18)', border: derivSelected ? '1px solid #2a2b32' : '1px solid #00d4a0', color: derivSelected ? '#6b7280' : teal, transition: 'all 0.3s' }}>SHARES</div>
          <div ref={refDeriv} style={{ flex: 1, padding: '4px 0', borderRadius: 4, fontSize: 11, fontFamily: fm, fontWeight: 700, textAlign: 'center', background: derivSelected ? 'rgba(0,212,160,0.18)' : '#1a1b22', border: derivSelected ? '1px solid #00d4a0' : '1px solid #2a2b32', color: derivSelected ? teal : '#6b7280', transition: 'all 0.3s' }}>DERIVATIVES</div>
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
          <div ref={refLong} style={{ flex: 1, padding: '4px 0', borderRadius: 4, fontSize: 11, fontFamily: fm, fontWeight: 700, textAlign: 'center', background: longSelected ? 'rgba(0,212,160,0.18)' : '#1a1b22', border: longSelected ? '1px solid #00d4a0' : '1px solid #2a2b32', color: longSelected ? teal : '#6b7280', transition: 'all 0.3s' }}>LONG</div>
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
  const trades = [
    { ticker: 'DIS', letter: 'D', color: '#1a5276', date: '3/29/26', time: '12:02 PM', strat: 'Call Scalp', dir: 'SHORT' as const, qty: 6, entry: '$5.97', exit: '$6.73', pl: '-$457', rr: '1:0.7', note: 'Saw the 2min color chang...', win: false },
    { ticker: 'NFLX', letter: 'N', color: '#b20710', date: '3/29/26', time: '10:21 AM', strat: '0DTE Put', dir: 'SHORT' as const, qty: 11, entry: '$8.05', exit: '$8.46', pl: '-$456', rr: '1:0.6', note: 'Ignored my own rule abou...', win: false },
    { ticker: 'AMD', letter: 'A', color: '#007a33', date: '3/26/26', time: '10:06 AM', strat: '0DTE Call', dir: 'LONG' as const, qty: 5, entry: '$7.29', exit: '$9.83', pl: '+$1,269', rr: '1:2.3', note: 'MA squeeze expanded beau...', win: true },
    { ticker: 'DIS', letter: 'D', color: '#1a5276', date: '3/26/26', time: '3:12 PM', strat: 'Call Debit Spread', dir: 'LONG' as const, qty: 9, entry: '$8.52', exit: '$9.85', pl: '+$1,201', rr: '1:2.2', note: 'MA squeeze expanded beau...', win: true },
    { ticker: 'GOOGL', letter: 'G', color: '#34a853', date: '3/26/26', time: '1:38 PM', strat: 'Put Debit Spread', dir: 'LONG' as const, qty: 2, entry: '$3.27', exit: '$7.73', pl: '+$892', rr: '1:1.8', note: 'The 2min 20 EMA was hold...', win: true },
  ];
  return (<div className="carousel-scroll" style={{ overflowY: 'auto', maxHeight: 520 }}>
    {/* Stat cards */}
    <div style={{ display: 'flex', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 16 }}>
      <div style={{ padding: '14px 18px', borderRight: '1px solid rgba(255,255,255,0.08)', flex: 1 }}>
        <div style={{ fontFamily: fm, fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 4 }}>TOTAL P/L</div>
        <div style={{ fontFamily: fd, fontSize: 22, fontWeight: 700, color: '#39ff85' }}>+$58,532</div>
      </div>
      <div style={{ padding: '14px 18px', borderRight: '1px solid rgba(255,255,255,0.08)', flex: 1 }}>
        <div style={{ fontFamily: fm, fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 4 }}>WIN RATE</div>
        <div style={{ fontFamily: fd, fontSize: 22, fontWeight: 700, color: '#fff' }}>46%</div>
        <div style={{ display: 'flex', height: 3, marginTop: 4, marginBottom: 3 }}><div style={{ width: '46%', background: '#39ff85' }} /><div style={{ width: '54%', background: '#ff4444' }} /></div>
        <div style={{ fontFamily: fm, fontSize: 8, color: 'rgba(255,255,255,0.3)' }}>92W 80L 28E</div>
      </div>
      <div style={{ padding: '14px 18px', borderRight: '1px solid rgba(255,255,255,0.08)', flex: 1 }}>
        <div style={{ fontFamily: fm, fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 4 }}>TOTAL TRADES</div>
        <div style={{ fontFamily: fd, fontSize: 22, fontWeight: 700, color: '#fff' }}>200</div>
      </div>
      <div style={{ padding: '14px 18px', borderRight: '1px solid rgba(255,255,255,0.08)', flex: 1 }}>
        <div style={{ fontFamily: fm, fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 4 }}>AVG R:R</div>
        <div style={{ fontFamily: fd, fontSize: 22, fontWeight: 700, color: '#fff' }}>1 : 2.2</div>
      </div>
      <div style={{ padding: '14px 18px', flex: 1 }}>
        <div style={{ fontFamily: fm, fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 4 }}>EXPECTED VALUE</div>
        <div style={{ fontFamily: fd, fontSize: 22, fontWeight: 700, color: '#39ff85' }}>+$222</div>
        <div style={{ fontFamily: fm, fontSize: 8, color: 'rgba(255,255,255,0.3)' }}>Per trade</div>
      </div>
    </div>
    {/* Equity Curve */}
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Logo size={12} /><span style={{ fontFamily: fd, fontSize: 14, color: '#fff', fontWeight: 700 }}>Equity Curve</span></div>
        <div style={{ display: 'flex', gap: 4 }}>{['1D','1W','1M','3M','YTD'].map(p => <span key={p} style={{ fontFamily: fm, fontSize: 9, padding: '3px 8px', color: p === 'YTD' ? '#000' : 'rgba(255,255,255,0.4)', background: p === 'YTD' ? '#39ff85' : 'transparent', cursor: 'pointer', letterSpacing: '0.05em' }}>{p}</span>)}</div>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: '8px 0', height: 100, position: 'relative' }}>
        <svg width="100%" height="100%" viewBox="0 0 500 100" preserveAspectRatio="none">
          <polygon points="20,88 60,82 100,75 140,78 180,60 220,55 260,48 300,52 340,38 380,30 420,25 460,18 480,12 480,100 20,100" fill="rgba(0,255,136,0.05)" />
          <polyline points="20,88 60,82 100,75 140,78 180,60 220,55 260,48 300,52 340,38 380,30 420,25 460,18 480,12" fill="none" stroke="#39ff85" strokeWidth="1.5" />
        </svg>
        <div style={{ position: 'absolute', left: 4, top: 4, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: 'calc(100% - 8px)' }}>{['+$58.5k','+$43.9k','+$29.2k','+$14.6k','$-64'].map(l => <span key={l} style={{ fontFamily: fm, fontSize: 8, color: 'rgba(255,255,255,0.25)' }}>{l}</span>)}</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 20px 0' }}>{['Jan 1','Jan 21','Feb 9','Mar 8','Mar 29'].map(l => <span key={l} style={{ fontFamily: fm, fontSize: 8, color: 'rgba(255,255,255,0.25)' }}>{l}</span>)}</div>
    </div>
    {/* Filter row */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' as const }}>
      <div style={{ fontFamily: fm, fontSize: 10, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '6px 12px' }}>🔍 Search Ticker...</div>
      <div style={{ fontFamily: fm, fontSize: 10, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '6px 12px' }}>▼ Strategy: All</div>
      <span style={{ fontFamily: fm, fontSize: 10, padding: '5px 12px', background: '#39ff85', color: '#000', fontWeight: 600 }}>● All Trades</span>
      <span style={{ fontFamily: fm, fontSize: 10, padding: '5px 12px', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>● Wins</span>
      <span style={{ fontFamily: fm, fontSize: 10, padding: '5px 12px', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>● Losses</span>
    </div>
    {/* Table header */}
    <div style={{ display: 'grid', gridTemplateColumns: '30px 44px 62px 58px 1fr 52px 28px 86px 66px 42px 1fr', gap: 4, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.08)', fontFamily: fm, fontSize: 9, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' as const }}>
      <span></span><span>TICKER</span><span>DATE</span><span>TIME</span><span>STRATEGY</span><span>DIR</span><span>QTY</span><span>ENTRY/EXIT</span><span>NET P/L</span><span>R:R</span><span>NOTES</span>
    </div>
    {/* Trade rows */}
    {trades.map((r, i) => (
      <div key={i} style={{ display: 'grid', gridTemplateColumns: '30px 44px 62px 58px 1fr 52px 28px 86px 66px 42px 1fr', gap: 4, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontFamily: fm, fontSize: 10, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 22, height: 22, borderRadius: 4, background: r.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff', fontFamily: fm, flexShrink: 0 }}>{r.letter}</div>
        </div>
        <span style={{ color: '#fff', fontWeight: 700 }}>{r.ticker}</span>
        <span style={{ color: 'rgba(255,255,255,0.5)' }}>{r.date}</span>
        <span style={{ color: 'rgba(255,255,255,0.4)' }}>{r.time}</span>
        <span style={{ color: 'rgba(255,255,255,0.6)' }}>{r.strat}</span>
        <span style={{ background: r.dir === 'LONG' ? 'rgba(0,255,136,0.15)' : 'rgba(255,68,68,0.15)', color: r.dir === 'LONG' ? '#39ff85' : '#ff4444', fontFamily: fm, fontSize: 9, padding: '2px 8px', textAlign: 'center' }}>{r.dir}</span>
        <span style={{ color: 'rgba(255,255,255,0.5)' }}>{r.qty}</span>
        <span style={{ color: 'rgba(255,255,255,0.5)' }}>{r.entry}→{r.exit}</span>
        <span style={{ color: r.win ? '#39ff85' : '#ff4444', fontWeight: 700 }}>{r.pl}</span>
        <span style={{ color: 'rgba(255,255,255,0.5)' }}>{r.rr}</span>
        <span style={{ color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{r.note}</span>
      </div>
    ))}
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

  const goalTexts = [
    'LET TRADES BREATHE 3+ WHEN AT BREAK-EVEN',
    '5M AND 13/15M CONFIRMATION BEHIND ALL TRADES',
    'AT OR NEAR 20MA, WILL WAIT FOR PULLBACK IF FAR',
  ];
  const goalTypes = ['Patience / Setup', 'General', 'General'];

  return (
    <div style={{ display: 'flex', gap: 24, padding: 0, height: '100%', overflow: 'hidden' }}>
      {/* LEFT COLUMN — Goals List */}
      <div style={{ flex: '0 0 58%', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontFamily: fd, color: '#fff', fontSize: 22, fontWeight: 700 }}>Weekly Goals</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#39ff85' }} />
            <span style={{ fontFamily: fm, fontSize: 11, color: '#39ff85' }}>3 Active Rules</span>
          </div>
        </div>
        <div style={{ fontFamily: fm, color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 18 }}>Active behavioral and technical parameters for the current week.</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {goalTexts.map((text, gi) => (
            <div key={gi} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px solid #39ff85', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontFamily: fd, fontSize: 14, color: '#39ff85' }}>{gi + 1}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: fm, fontSize: 13, fontWeight: 700, color: '#fff', textTransform: 'uppercase' as const, letterSpacing: '0.02em', marginBottom: 6 }}>{text}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ background: '#39ff85', color: '#000', fontFamily: fm, fontSize: 9, fontWeight: 700, padding: '2px 6px', textTransform: 'uppercase' as const }}>TYPE</span>
                  <span style={{ fontFamily: fm, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{goalTypes[gi]}</span>
                </div>
              </div>
              <div style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, cursor: 'pointer' }}>
                <Logo size={10} />
                <span style={{ fontFamily: fm, fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>click to give context</span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, border: '1px dashed rgba(255,255,255,0.1)', padding: 12, textAlign: 'center' }}>
          <span style={{ fontFamily: fm, fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>+ INITIALIZE NEW PARAMETER</span>
        </div>
        {/* Scan line */}
        {!frozen && <div style={{ position: 'absolute', left: 0, width: '100%', height: 2, background: 'linear-gradient(90deg, transparent, #00d4a0, transparent)', boxShadow: '0 0 20px rgba(0,212,160,0.4)', animation: 'goalScan 4s ease-in-out infinite', zIndex: 2, pointerEvents: 'none' }} />}
      </div>
      {/* RIGHT COLUMN — WickCoach AI */}
      <div style={{ flex: '0 0 38%', transform: showFollowUp ? 'translateY(-120px)' : 'translateY(0)', transition: 'transform 0.8s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, animation: aiAnimating ? 'aiPulse 1.5s ease-in-out infinite' : 'none' }}>
          <Logo size={16} />
          <span style={{ fontFamily: fd, fontSize: 14, fontWeight: 700, color: '#39ff85' }}>WickCoach AI</span>
        </div>
        <div style={{ background: 'rgba(0,255,136,0.04)', border: '1px solid rgba(57,255,133,0.15)', borderRadius: 0, padding: 20, marginTop: 12, minHeight: 140 }}>
          <div style={{ fontFamily: fm, color: 'rgba(255,255,255,0.7)', fontSize: 12, lineHeight: 1.7 }}>
            {renderedBullets.map((line, idx) => (
              <div key={idx} style={{ marginBottom: idx < renderedBullets.length - 1 ? 10 : 0 }}>
                {line.startsWith('\u2022') ? <><span style={{ color: '#39ff85' }}>{'\u2022'}</span>{line.slice(1)}</> : line}
              </div>
            ))}
            {isTyping && <span style={{ animation: 'blink 1s step-end infinite', color: '#39ff85' }}>|</span>}
          </div>
          {isThinking && (
            <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#39ff85', animation: 'thinkDot 1.2s ease-in-out infinite', animationDelay: '0s' }} />
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#39ff85', animation: 'thinkDot 1.2s ease-in-out infinite', animationDelay: '0.3s' }} />
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#39ff85', animation: 'thinkDot 1.2s ease-in-out infinite', animationDelay: '0.6s' }} />
            </div>
          )}
        </div>
        {/* Pagination dots */}
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 12 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#39ff85' }} />
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
        </div>
        <div style={{ opacity: showFollowUp ? 1 : 0, transition: 'opacity 0.6s ease', pointerEvents: showFollowUp ? 'auto' : 'none' }}>
          <div style={{ background: 'rgba(0,255,136,0.04)', border: '1px solid rgba(57,255,133,0.15)', padding: 14, marginTop: 10 }}>
            <div style={{ fontFamily: fm, fontSize: 10, fontWeight: 700, color: '#39ff85', letterSpacing: 1, marginBottom: 8 }}>FOLLOW-UP</div>
            <div style={{ fontFamily: fm, color: 'rgba(255,255,255,0.7)', fontSize: 11, lineHeight: 1.6 }}>{goalSet.followUp}</div>
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') setAnswer(''); }}
              placeholder="Type your answer..."
              style={{ background: '#13141a', border: '1px solid rgba(255,255,255,0.08)', padding: '8px 10px', color: '#ffffff', fontSize: 11, fontFamily: fm, width: '100%', outline: 'none', marginTop: 10, boxSizing: 'border-box' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#39ff85'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
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
      .carousel-scroll::-webkit-scrollbar { width: 4px; }
      .carousel-scroll::-webkit-scrollbar-track { background: transparent; }
      .carousel-scroll::-webkit-scrollbar-thumb { background: rgba(57,255,133,0.3); border-radius: 2px; }
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
  const strategies = [
    { name: '0DTE Call', trades: 60, wr: '46.7%', avg: '+$325.84', total: '+$19,550', r: '+0.7R' },
    { name: '0DTE Put', trades: 54, wr: '42.6%', avg: '+$247.07', total: '+$13,341', r: '+0.5R' },
    { name: 'Call Debit', trades: 18, wr: '61.1%', avg: '+$493.94', total: '+$8,891', r: '+1.0R' },
    { name: 'Put Debit', trades: 19, wr: '52.6%', avg: '+$355.96', total: '+$6,763', r: '+0.7R' },
    { name: 'Call Scalp', trades: 16, wr: '56.3%', avg: '+$396.17', total: '+$6,339', r: '+0.8R' },
    { name: 'Put Scalp', trades: 8, wr: '50.0%', avg: '+$487.08', total: '+$3,897', r: '+1.0R' },
  ];
  const tickers = [
    { t: 'V', c: '#1a1f71', trades: 14, wr: '78.6%', pl: '+$10,391' },
    { t: 'META', c: '#0668E1', trades: 9, wr: '77.8%', pl: '+$6,288' },
    { t: 'NVDA', c: '#76b900', trades: 14, wr: '50.0%', pl: '+$6,129' },
    { t: 'AMD', c: '#007a33', trades: 11, wr: '54.5%', pl: '+$5,929' },
    { t: 'BA', c: '#1a6dff', trades: 9, wr: '66.7%', pl: '+$5,018' },
    { t: 'MSFT', c: '#737373', trades: 17, wr: '47.1%', pl: '+$5,805' },
  ];
  return (<div style={{ overflow: 'hidden' }}>
    {/* Header */}
    <div style={{ marginBottom: 4 }}>
      <div style={{ fontFamily: fd, fontSize: 28, fontWeight: 700, color: '#fff' }}>Analysis</div>
      <div style={{ fontFamily: fm, fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>Behavioral pattern recognition across your trade history.</div>
      <div style={{ fontFamily: fm, fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>200 executions analyzed</div>
    </div>
    {/* 4 Stat Cards */}
    <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
      <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '16px' }}>
        <div style={{ fontFamily: fm, fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 6 }}>TOTAL TRADES</div>
        <div style={{ fontFamily: fd, fontSize: 32, fontWeight: 700, color: '#fff', lineHeight: 1 }}>200</div>
        <div style={{ fontFamily: fm, fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Win Rate: 46.0%</div>
        <div style={{ display: 'flex', height: 3, marginTop: 6 }}><div style={{ width: '46%', background: '#39ff85' }} /><div style={{ width: '54%', background: '#ff4444' }} /></div>
      </div>
      <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '16px' }}>
        <div style={{ fontFamily: fm, fontSize: 10, color: '#39ff85', textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 6 }}>PROCESS</div>
        <div style={{ fontFamily: fd, fontSize: 32, fontWeight: 700, color: '#fff', lineHeight: 1 }}>137</div>
        <div style={{ fontFamily: fm, fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Win Rate: 61.3%</div>
        <div style={{ fontFamily: fm, fontSize: 10, color: '#39ff85', marginTop: 4 }}>+150.9R total</div>
      </div>
      <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '16px' }}>
        <div style={{ fontFamily: fm, fontSize: 10, color: '#ff4444', textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 6 }}>IMPULSE</div>
        <div style={{ fontFamily: fd, fontSize: 32, fontWeight: 700, color: '#fff', lineHeight: 1 }}>63</div>
        <div style={{ fontFamily: fm, fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Win Rate: 12.7%</div>
        <div style={{ fontFamily: fm, fontSize: 10, color: '#ff4444', marginTop: 4 }}>-31.3R total</div>
      </div>
      <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '16px' }}>
        <div style={{ fontFamily: fm, fontSize: 10, color: '#39ff85', textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 4 }}>WHAT IF?</div>
        <div style={{ fontFamily: fm, fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Your P/L if you only took process trades</div>
        <div style={{ fontFamily: fm, fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Actual P/L: +$58,532</div>
        <div style={{ fontFamily: fd, fontSize: 28, fontWeight: 700, color: '#39ff85', lineHeight: 1, marginTop: 4 }}>+$74,792</div>
        <div style={{ fontFamily: fm, fontSize: 10, color: '#ff4444', marginTop: 4 }}>Indiscipline cost you $16,260</div>
      </div>
    </div>
    {/* Strategy Breakdown + Ticker Performance */}
    <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
      <div style={{ flex: '0 0 58%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '16px' }}>
        <div style={{ fontFamily: fd, fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 2 }}>Strategy breakdown</div>
        <div style={{ fontFamily: fm, fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>Performance by setup type</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 50px 55px 70px 80px 45px', gap: 4, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.08)', fontFamily: fm, fontSize: 9, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' as const }}>
          <span>STRATEGY</span><span>TRADES</span><span>WIN RATE</span><span>AVG P/L</span><span>TOTAL P/L</span><span>AVG R</span>
        </div>
        {strategies.map((s, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 50px 55px 70px 80px 45px', gap: 4, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', borderLeft: '2px solid #39ff85', paddingLeft: 8, fontFamily: fm, fontSize: 11, alignItems: 'center' }}>
            <span style={{ color: '#fff' }}>{s.name}</span>
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>{s.trades}</span>
            <span style={{ color: '#39ff85' }}>{s.wr}</span>
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>{s.avg}</span>
            <span style={{ color: '#39ff85' }}>{s.total}</span>
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>{s.r}</span>
          </div>
        ))}
        <div style={{ fontFamily: fm, fontSize: 10, color: '#39ff85', marginTop: 8, cursor: 'pointer' }}>Show all ↓</div>
      </div>
      <div style={{ flex: '0 0 38%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '16px' }}>
        <div style={{ fontFamily: fd, fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 2 }}>Ticker performance</div>
        <div style={{ fontFamily: fm, fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>P/L by asset</div>
        {tickers.map((tk, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ width: 24, height: 24, borderRadius: 4, background: tk.c, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff', fontFamily: fm, flexShrink: 0 }}>{tk.t[0]}</div>
            <div style={{ flex: 1 }}>
              <span style={{ fontFamily: fm, fontSize: 11, fontWeight: 700, color: '#fff' }}>{tk.t}</span>
              <span style={{ fontFamily: fm, fontSize: 10, color: 'rgba(255,255,255,0.4)', marginLeft: 8 }}>{tk.trades} trades · {tk.wr} win</span>
            </div>
            <span style={{ fontFamily: fm, fontSize: 11, color: '#39ff85', fontWeight: 700 }}>{tk.pl}</span>
          </div>
        ))}
        <div style={{ fontFamily: fm, fontSize: 10, color: '#39ff85', marginTop: 8, cursor: 'pointer' }}>Show all ↓</div>
      </div>
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
  result: 'WIN' | 'LOSS' | 'BREAKEVEN';
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
  const [sortBy, setSortBy] = useState('date-desc');
  const [colWidths, setColWidths] = useState<number[]>([80, 95, 75, 120, 80, 55, 140, 105, 80, 200]);
  const [aiOpen, setAiOpen] = useState(false);
  const [resizing, setResizing] = useState<{ col: number; startX: number; startW: number } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [eqHover, setEqHover] = useState<{ x: number; y: number; date: string; value: number } | null>(null);
  const [eqRange, setEqRange] = useState('YTD');
  const [notesTooltip, setNotesTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
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
    if (!aiOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setAiOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [aiOpen]);

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
    return ['All', '0DTE Call', '0DTE Put', 'Call Scalp', 'Put Scalp', 'Call Debit Spread', 'Put Debit Spread', 'Put Credit Spread', 'Call Credit Spread', 'Iron Condor', 'Shares Long Swing', 'Shares Momentum', 'Shares Breakout'];
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
    } else if (dateRange === '10 Days') {
      const d = new Date(t.date); const now = new Date(); const cutoff = new Date(now.getTime() - 10 * 86400000);
      if (d < cutoff) return false;
    } else if (dateRange === '15 Days') {
      const d = new Date(t.date); const now = new Date(); const cutoff = new Date(now.getTime() - 15 * 86400000);
      if (d < cutoff) return false;
    } else if (dateRange === 'This Month') {
      const d = new Date(t.date); const now = new Date();
      if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return false;
    }
    return true;
  }).sort((a, b) => {
    const [field, dir] = sortBy.split('-');
    const asc = dir === 'asc' ? 1 : -1;
    if (field === 'date') return asc * (new Date(a.date).getTime() - new Date(b.date).getTime());
    if (field === 'direction') return asc * a.direction.localeCompare(b.direction);
    if (field === 'qty') return asc * (a.contracts - b.contracts);
    if (field === 'pl') return asc * (a.pl - b.pl);
    if (field === 'rr') {
      const aRR = parseFloat(a.riskReward.split(':')[1]) || 0;
      const bRR = parseFloat(b.riskReward.split(':')[1]) || 0;
      return asc * (aRR - bRR);
    }
    if (field === 'ticker') return asc * a.ticker.localeCompare(b.ticker);
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

  // Equity curve data — respects calendar dropdown filter
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
  const perPage = 20;
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(currentPage, totalPages);
  const pagedTrades = filtered.slice((safePage - 1) * perPage, safePage * perPage);

  // Welcome message for Fix 8
  const welcomeMsg = trades.length > 0 && aiMessages.length === 0 ? (() => {
    const wr = trades.length > 0 ? Math.round((trades.filter(t => t.result === 'WIN').length / trades.length) * 100) : 0;
    const best = trades.slice().sort((a, b) => b.pl - a.pl)[0];
    return `You have ${trades.length} trade${trades.length !== 1 ? 's' : ''} logged with a ${wr}% win rate. Your best performer was ${best?.ticker} (+$${best?.pl.toFixed(2)}). Want me to analyze your patterns?`;
  })() : null;

  const colHeaders = ['Asset', 'Date', 'Time', 'Strategy', 'Direction', 'Qty', 'Entry/Exit', 'Net P/L', 'R:R', 'Notes'];
  const sortableMap: Record<string, string> = { 'Date': 'date', 'Direction': 'direction', 'Qty': 'qty', 'Net P/L': 'pl', 'R:R': 'rr', 'Asset': 'ticker' };
  function toggleSort(field: string) {
    if (sortBy === field + '-desc') setSortBy(field + '-asc');
    else if (sortBy === field + '-asc') setSortBy('date-desc');
    else setSortBy(field + '-desc');
  }

  function autoFitColumn(colIndex: number) {
    const targetWidth = colWidths[colIndex];
    setColWidths(prev => prev.map(() => targetWidth));
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
    <div style={{ minHeight: '80vh', background: '#1a1c23', position: 'relative' }}>
      {/* ── MAIN CONTENT — FULL WIDTH CENTERED ── */}
      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '24px 40px', position: 'relative' }}>
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
            <span onClick={() => setAiOpen(!aiOpen)} style={{ fontFamily: fm, fontSize: 13, color: teal, padding: '8px 16px', borderRadius: 8, borderTop: `1px solid rgba(0,212,160,0.3)`, borderRight: `1px solid rgba(0,212,160,0.3)`, borderBottom: `1px solid rgba(0,212,160,0.3)`, borderLeft: `1px solid rgba(0,212,160,0.3)`, background: 'rgba(0,212,160,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
              <svg width="14" height="17" viewBox="0 0 20 24" fill="none"><circle cx="8" cy="4" r="2.8" stroke={teal} strokeWidth="1.2" fill="none" /><line x1="8" y1="6.8" x2="8" y2="15" stroke={teal} strokeWidth="1.2" /><rect x="13.5" y="4" width="4" height="5" rx="0.5" fill={teal} opacity="0.9" /><line x1="15.5" y1="2" x2="15.5" y2="12" stroke={teal} strokeWidth="0.8" /></svg>
              AI Coach
            </span>
            <span style={{ fontFamily: fm, fontSize: 13, color: '#c9cdd4', padding: '8px 16px', borderRadius: 8, borderTop: '1px solid #2a2b32', borderRight: '1px solid #2a2b32', borderBottom: '1px solid #2a2b32', borderLeft: '1px solid #2a2b32', background: '#111218', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
              Export CSV
            </span>
          </div>
        </div>
        {/* ── STAT CARDS ── */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'stretch' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, flex: 1 }}>
          {/* Total P/L */}
          <div style={{ background: '#13141a', borderTop: `3px solid ${teal}`, borderRight: '1px solid #2a2b32', borderBottom: '1px solid #2a2b32', borderLeft: '1px solid #2a2b32', borderRadius: 10, padding: '12px 16px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ color: '#6b7280', fontFamily: fm, fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: 1 }}>Total P/L</div>
            <div style={{ color: totalPL >= 0 ? teal : '#ef4444', fontFamily: fd, fontSize: 24, fontWeight: 700, marginTop: 4 }}>{formatDollar(totalPL)}</div>
            <svg width="100%" height="20" viewBox="0 0 200 20" preserveAspectRatio="none" style={{ display: 'block', marginTop: 6 }}>
              <defs><linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={totalPL >= 0 ? teal : '#ef4444'} stopOpacity="0.15" /><stop offset="100%" stopColor={totalPL >= 0 ? teal : '#ef4444'} stopOpacity="0" /></linearGradient></defs>
              <path d={(sparkPoints.replace(/60/g, '200').replace(/24/g, '20') || 'M0,10 L200,10') + ' L200,20 L0,20 Z'} fill="url(#sparkFill)" />
              <path d={sparkPoints.replace(/60/g, '200').replace(/24/g, '20') || 'M0,10 L200,10'} stroke={totalPL >= 0 ? teal : '#ef4444'} strokeWidth="1.5" fill="none" />
            </svg>
          </div>
          {/* Win Rate */}
          <div style={{ background: '#13141a', borderTop: `3px solid ${teal}`, borderRight: '1px solid #2a2b32', borderBottom: '1px solid #2a2b32', borderLeft: '1px solid #2a2b32', borderRadius: 10, padding: '12px 16px' }}>
            <div style={{ color: '#6b7280', fontFamily: fm, fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: 1 }}>Win Rate</div>
            <div style={{ color: '#fff', fontFamily: fd, fontSize: 24, fontWeight: 700, marginTop: 4 }}>{winRate}%</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 6, fontFamily: fm, fontSize: 11 }}>
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
            <div style={{ color: '#6b7280', fontFamily: fm, fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: 1 }}>Total Trades</div>
            <div style={{ color: '#fff', fontFamily: fd, fontSize: 24, fontWeight: 700, marginTop: 4 }}>{statTrades.length}</div>
          </div>
          {/* Avg R:R */}
          <div style={{ background: '#13141a', borderTop: `3px solid ${teal}`, borderRight: '1px solid #2a2b32', borderBottom: '1px solid #2a2b32', borderLeft: '1px solid #2a2b32', borderRadius: 10, padding: '12px 16px' }}>
            <div style={{ color: '#6b7280', fontFamily: fm, fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: 1 }}>Avg R:R</div>
            <div style={{ color: '#fff', fontFamily: fd, fontSize: 24, fontWeight: 700, marginTop: 4 }}><span>1</span><span style={{ margin: '0 6px' }}>:</span><span>{avgRR}</span></div>
          </div>
          {/* Expected Value */}
          <div style={{ background: '#13141a', borderTop: `3px solid ${teal}`, borderRight: '1px solid #2a2b32', borderBottom: '1px solid #2a2b32', borderLeft: '1px solid #2a2b32', borderRadius: 10, padding: '12px 16px' }}>
            <div style={{ color: '#6b7280', fontFamily: fm, fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: 1 }}>Expected Value</div>
            <div style={{ color: expectedValue >= 0 ? teal : '#ef4444', fontFamily: fd, fontSize: 24, fontWeight: 700, marginTop: 4 }}>{formatDollar(Math.round(expectedValue * 100) / 100)}</div>
            <div style={{ fontFamily: fm, fontSize: 11, color: '#6b7280', marginTop: 4 }}>Per trade</div>
          </div>
        </div>
          {/* WickCoach icon — HIGH-LEVEL ANALYSIS (right of Expected Value) */}
          <div onClick={() => setAiOpen(!aiOpen)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', flexShrink: 0, width: 80 }}>
            <div style={{ fontFamily: fm, fontSize: 10, color: teal, textTransform: 'uppercase' as const, letterSpacing: 2, textAlign: 'center', lineHeight: 1.3, fontWeight: 600 }}>HIGH-LEVEL ANALYSIS</div>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(0,212,160,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(0,212,160,0.2)', transition: 'all 0.3s', borderTop: `1px solid rgba(0,212,160,0.3)`, borderRight: `1px solid rgba(0,212,160,0.3)`, borderBottom: `1px solid rgba(0,212,160,0.3)`, borderLeft: `1px solid rgba(0,212,160,0.3)` }}>
              <svg width="20" height="24" viewBox="0 0 20 24" fill="none">
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
                <span key={p} onClick={() => setEqRange(p)} style={{ fontFamily: fm, fontSize: 11, padding: '4px 10px', borderRadius: 6, cursor: 'pointer', background: eqRange === p ? 'rgba(0,212,160,0.18)' : 'transparent', color: eqRange === p ? teal : '#6b7280', borderTop: eqRange === p ? '1px solid rgba(0,212,160,0.3)' : '1px solid transparent', borderRight: eqRange === p ? '1px solid rgba(0,212,160,0.3)' : '1px solid transparent', borderBottom: eqRange === p ? '1px solid rgba(0,212,160,0.3)' : '1px solid transparent', borderLeft: eqRange === p ? '1px solid rgba(0,212,160,0.3)' : '1px solid transparent', fontWeight: 600 }}>{p}</span>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', position: 'relative' }}>
            {/* Y-axis labels */}
            <div style={{ width: 65, flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingRight: 6 }}>
              {eqYLabels.map((label, li) => (
                <span key={li} style={{ fontFamily: fm, fontSize: 13, color: '#9ca3af', textAlign: 'right', lineHeight: '1', fontWeight: 600 }}>{label.value >= 0 ? '+' : ''}{label.value >= 1000 ? `$${(label.value / 1000).toFixed(1)}k` : `$${label.value}`}</span>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, paddingLeft: 65 }}>
              {[0, Math.floor(equityCurve.length * 0.25), Math.floor(equityCurve.length * 0.5), Math.floor(equityCurve.length * 0.75), equityCurve.length - 1].filter((v, i, a) => a.indexOf(v) === i).map(idx => (
                <span key={idx} style={{ fontFamily: fm, fontSize: 11, color: '#6b7280' }}>
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
            <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: teal, fontSize: 10, pointerEvents: 'none' }}>▼</span>
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
          {/* Sort reset */}
          {sortBy !== 'date-desc' && (
            <span onClick={() => setSortBy('date-desc')} title="Reset sort to default" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 8, cursor: 'pointer', background: '#0e0f14', borderTop: '1px solid #2a2b32', borderRight: '1px solid #2a2b32', borderBottom: '1px solid #2a2b32', borderLeft: '1px solid #2a2b32', marginLeft: 4 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={teal} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
            </span>
          )}
          {/* Date range — pushed right */}
          <div style={{ display: 'flex', gap: 4, marginLeft: 'auto', alignItems: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" style={{ marginRight: 4 }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <select value={dateRange} onChange={e => setDateRange(e.target.value)} style={{ ...selectBase, paddingRight: 28, fontSize: 13 }}>
                {['This Week', '10 Days', '15 Days', 'This Month', 'All Time'].map(d => <option key={d} value={d}>{d === 'All Time' ? 'All Time' : d}</option>)}
              </select>
              <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: teal, fontSize: 10, pointerEvents: 'none' }}>▼</span>
            </div>
          </div>
        </div>

        {/* ── TRADE LIST ── */}
        <div style={{ background: '#111218', borderTop: '1px solid #2a2b32', borderRight: '1px solid #2a2b32', borderBottom: '1px solid #2a2b32', borderLeft: '1px solid #2a2b32', borderRadius: 10, overflow: 'hidden', boxShadow: '0 0 40px rgba(0,212,160,0.03)' }}>
          {/* Header row */}
          <div style={{ display: 'grid', gridTemplateColumns: colWidths.map(w => w + 'px').join(' '), background: '#0e0f14', borderBottom: '2px solid #2a2b32' }}>
            {colHeaders.map((h, hi) => {
              const sortField = sortableMap[h];
              const isActive = sortField && sortBy.startsWith(sortField + '-');
              const isAsc = sortBy === sortField + '-asc';
              return (
                <span key={h} onClick={() => { if (sortField) toggleSort(sortField); }} style={{ color: isActive ? teal : '#9ca3af', fontFamily: fm, fontSize: 12, textTransform: 'uppercase' as const, letterSpacing: 1.5, fontWeight: 600, position: 'relative', userSelect: resizing ? 'none' : 'auto', padding: '12px 8px', borderRight: hi < colHeaders.length - 1 ? '1px solid #1e1f2a' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', whiteSpace: 'nowrap', cursor: sortField ? 'pointer' : 'default', gap: 4 }}>
                  {h}
                  {sortField && (
                    <span style={{ display: 'inline-flex', flexDirection: 'column', lineHeight: 0, fontSize: 8, marginLeft: 2 }}>
                      <span style={{ color: isActive && isAsc ? teal : '#3a3b42' }}>&#9650;</span>
                      <span style={{ color: isActive && !isAsc ? teal : '#3a3b42' }}>&#9660;</span>
                    </span>
                  )}
                  <span onMouseDown={e => { e.preventDefault(); e.stopPropagation(); setResizing({ col: hi, startX: e.clientX, startW: colWidths[hi] }); }} onDoubleClick={e => { e.stopPropagation(); autoFitColumn(hi); }} style={{ position: 'absolute', right: -4, top: 0, width: 8, height: '100%', cursor: 'col-resize', zIndex: 2, background: 'transparent' }} onMouseEnter={e => { e.currentTarget.style.borderRight = `3px solid ${teal}`; }} onMouseLeave={e => { if (!resizing || resizing.col !== hi) e.currentTarget.style.borderRight = 'none'; }} />
                </span>
              );
            })}
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
                    <TickerLogo ticker={t.ticker} />
                    <span style={{ fontWeight: 700, color: '#ffffff', fontSize: 13 }}>{t.ticker}</span>
                  </span>
                  {/* Date */}
                  <span style={{ color: '#c9cdd4', fontSize: 13, whiteSpace: 'nowrap', padding: '12px 6px', borderRight: '1px solid #1e1f2a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{(() => { const d = new Date(t.date); return `${d.getMonth()+1}/${d.getDate()}/${String(d.getFullYear()).slice(2)}`; })()}</span>
                  {/* Time */}
                  <span style={{ color: '#9ca3af', fontSize: 12, whiteSpace: 'nowrap', padding: '12px 6px', borderRight: '1px solid #1e1f2a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{formatTime(t.time)}</span>
                  {/* Strategy */}
                  <span style={{ color: '#c9cdd4', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '12px 6px', borderRight: '1px solid #1e1f2a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t.strategy}</span>
                  {/* Direction */}
                  <span style={{ padding: '12px 6px', borderRight: '1px solid #1e1f2a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, background: t.direction === 'LONG' ? 'rgba(0,212,160,0.15)' : 'rgba(239,68,68,0.15)', color: t.direction === 'LONG' ? teal : '#ef4444' }}>{t.direction}</span>
                  </span>
                  {/* Qty */}
                  <span style={{ color: '#e8e8f0', fontSize: 14, padding: '12px 6px', borderRight: '1px solid #1e1f2a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t.contracts}</span>
                  {/* Entry / Exit */}
                  <span style={{ color: '#c9cdd4', fontSize: 13, whiteSpace: 'nowrap', padding: '12px 6px', borderRight: '1px solid #1e1f2a', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', textOverflow: 'ellipsis' }}>${t.entryPrice.toFixed(2)} → ${t.exitPrice.toFixed(2)}</span>
                  {/* Net P/L */}
                  <span style={{ color: t.pl >= 0 ? teal : '#ef4444', fontWeight: 700, fontSize: 15, padding: '12px 6px', borderRight: '1px solid #1e1f2a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{formatDollar(t.pl)}</span>
                  {/* R:R */}
                  <span style={{ color: t.result === 'BREAKEVEN' || t.pl === 0 ? '#f59e0b' : '#c9cdd4', fontSize: 13, whiteSpace: 'nowrap', padding: '12px 6px', borderRight: '1px solid #1e1f2a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t.result === 'BREAKEVEN' || t.pl === 0 ? '0.0' : t.riskReward.replace(/(\d+):(\d)/, '$1 : $2')}</span>
                  {/* Notes */}
                  <div style={{ color: '#9ca3af', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '12px 8px', width: '100%', boxSizing: 'border-box', minWidth: 0, position: 'relative', cursor: 'default' }} onMouseEnter={e => { if (t.journal) { const rect = e.currentTarget.getBoundingClientRect(); setNotesTooltip({ text: t.journal, x: rect.left, y: rect.top }); } }} onMouseLeave={() => setNotesTooltip(null)}>{t.journal || '—'}</div>
                </div>
              );
            })}
          </>)}
        </div>
        {filtered.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, padding: '16px 0', marginTop: 8 }}>
            <span onClick={() => { if (safePage > 1) setCurrentPage(safePage - 1); }} style={{ fontFamily: fm, fontSize: 13, color: safePage > 1 ? teal : '#3a3b42', cursor: safePage > 1 ? 'pointer' : 'default', fontWeight: 600 }}>&larr; Previous</span>
            <span style={{ fontFamily: fm, fontSize: 13, color: '#6b7280' }}>Showing {(safePage - 1) * perPage + 1}-{Math.min(safePage * perPage, filtered.length)} of {filtered.length} trades</span>
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

      {/* ── FLOATING AI PANEL — GLASSMORPHISM ── */}
      {aiOpen && (
        <div style={{ position: 'fixed', bottom: 88, right: 24, width: 380, maxHeight: 520, borderRadius: 16, display: 'flex', flexDirection: 'column', zIndex: 1000, overflow: 'hidden', background: 'rgba(14,15,20,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderTop: '1px solid rgba(0,212,160,0.2)', borderRight: '1px solid rgba(0,212,160,0.2)', borderBottom: '1px solid rgba(0,212,160,0.2)', borderLeft: '1px solid rgba(0,212,160,0.2)', boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 60px rgba(0,212,160,0.08)', backgroundImage: 'radial-gradient(rgba(0,212,160,0.18) 1px, transparent 1px)', backgroundSize: '4px 4px' }}>
          {/* Header */}
          <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(0,212,160,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="14" height="17" viewBox="0 0 20 24" fill="none">
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
              <div>
                <div style={{ fontFamily: fd, fontSize: 15, fontWeight: 700, color: '#fff' }}>WickCoach AI</div>
                <div style={{ fontFamily: fm, fontSize: 9, color: '#6b7280', letterSpacing: 2, textTransform: 'uppercase' as const }}>TRADING CO-PILOT</div>
              </div>
            </div>
          </div>

          {/* Chat area */}
          <div style={{ flex: 1, padding: '10px 12px', overflowY: 'auto' as const, display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 360 }}>
            {aiMessages.length === 0 && (
              welcomeMsg ? (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: teal, flexShrink: 0, marginTop: 6 }} />
                  <div style={{ background: 'rgba(19,20,26,0.7)', borderTop: '1px solid rgba(255,255,255,0.06)', borderRight: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', borderLeft: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: 10, maxWidth: '90%' }}>
                    <div style={{ fontFamily: fm, fontSize: 12, color: '#c9cdd4', lineHeight: 1.6 }}>{welcomeMsg}</div>
                  </div>
                </div>
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                  <div style={{ fontFamily: fm, fontSize: 12, color: '#6b7280', fontStyle: 'italic', textAlign: 'center', lineHeight: 1.6 }}>Ask about your trading patterns, psychology, or specific trades.</div>
                </div>
              )
            )}
            {aiMessages.map((msg, i) => (
              msg.role === 'assistant' ? (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: teal, flexShrink: 0, marginTop: 6 }} />
                  <div style={{ background: 'rgba(19,20,26,0.7)', borderTop: '1px solid rgba(255,255,255,0.06)', borderRight: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', borderLeft: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: 10, maxWidth: '90%' }}>
                    <div style={{ fontFamily: fm, fontSize: 12, color: '#c9cdd4', lineHeight: 1.6 }}>{formatAiText(msg.content)}</div>
                  </div>
                </div>
              ) : (
                <div key={i} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ background: 'rgba(0,212,160,0.08)', borderTop: '1px solid rgba(0,212,160,0.15)', borderRight: '1px solid rgba(0,212,160,0.15)', borderBottom: '1px solid rgba(0,212,160,0.15)', borderLeft: '1px solid rgba(0,212,160,0.15)', borderRadius: 10, padding: 10, maxWidth: '85%' }}>
                    <div style={{ fontFamily: fm, fontSize: 12, color: '#fff', lineHeight: 1.6 }}>{msg.content}</div>
                  </div>
                </div>
              )
            ))}
            {aiLoading && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: teal, flexShrink: 0, marginTop: 6 }} />
                <div style={{ background: 'rgba(19,20,26,0.7)', borderTop: '1px solid rgba(255,255,255,0.06)', borderRight: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', borderLeft: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '10px 14px' }}>
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
          <div style={{ padding: '8px 12px 10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(14,15,20,0.6)', borderTop: '1px solid rgba(255,255,255,0.08)', borderRight: '1px solid rgba(255,255,255,0.08)', borderBottom: '1px solid rgba(255,255,255,0.08)', borderLeft: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '8px 12px' }}>
              <input value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') sendToCoach(); }} placeholder="Ask WickCoach..." style={{ flex: 1, background: 'transparent', borderTop: 'none', borderRight: 'none', borderBottom: 'none', borderLeft: 'none', outline: 'none', color: '#c9cdd4', fontFamily: fm, fontSize: 13 }} />
              <div onClick={sendToCoach} style={{ width: 30, height: 30, borderRadius: '50%', background: teal, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, opacity: aiLoading ? 0.5 : 1 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0e0f14" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
              </div>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes dotPulse { 0%,80%,100% { opacity: 0.3; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1); } }`}</style>
    </div>
  );
}

// ═══ TRADING GOALS TAB ═══
interface Goal {
  id: string;
  title: string;
  context: string[];
  aiResponses: string[];
  contextComplete: boolean;
  actionItems: string[];
  createdAt: string;
  goalType: string;
}

const GOAL_TYPES = ['Trade Management', 'Entry Criteria', 'Patience / Setup', 'Risk Management', 'Psychology', 'General'];

const DEFAULT_GOALS: Goal[] = [
  { id: 'g1', title: 'LET TRADES BREATHE 3+ WHEN AT BREAK-EVEN', context: [], aiResponses: [], contextComplete: false, actionItems: [], createdAt: new Date().toISOString(), goalType: 'Trade Management' },
  { id: 'g2', title: '5M AND 13/15M CONFIRMATION BEHIND ALL TRADES', context: [], aiResponses: [], contextComplete: false, actionItems: [], createdAt: new Date().toISOString(), goalType: 'Entry Criteria' },
  { id: 'g3', title: 'AT OR NEAR 20MA, WILL WAIT FOR PULLBACK IF FAR', context: [], aiResponses: [], contextComplete: false, actionItems: [], createdAt: new Date().toISOString(), goalType: 'Patience / Setup' },
];

const MiniStickFigure = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size * 1.2} viewBox="0 0 20 24" fill="none">
    <circle cx="8" cy="4" r="2.8" stroke="#7a7d88" strokeWidth="1.2" fill="none" />
    <line x1="8" y1="6.8" x2="8" y2="15" stroke="#7a7d88" strokeWidth="1.2" />
    <line x1="8" y1="9.5" x2="3" y2="13" stroke="#7a7d88" strokeWidth="1.2" />
    <line x1="8" y1="9.5" x2="14.5" y2="6" stroke="#7a7d88" strokeWidth="1.2" />
    <line x1="8" y1="15" x2="4.5" y2="21" stroke="#7a7d88" strokeWidth="1.2" />
    <line x1="8" y1="15" x2="11.5" y2="21" stroke="#7a7d88" strokeWidth="1.2" />
    <line x1="15.5" y1="2" x2="15.5" y2="12" stroke="#00d4a0" strokeWidth="0.8" />
    <rect x="13.5" y="4" width="4" height="5" rx="0.5" fill="#00d4a0" opacity="0.9" />
  </svg>
);

function TradingGoalsContent({ trades, onMessageSent }: { trades: Trade[]; onMessageSent?: (inputRect: DOMRect) => void }) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [activeView, setActiveView] = useState<'weekly' | 'monthly' | 'behavioral'>('weekly');
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);
  const [contextInputs, setContextInputs] = useState<Record<string, string>>({});
  const [loadingGoalId, setLoadingGoalId] = useState<string | null>(null);
  const [hoveredGoalId, setHoveredGoalId] = useState<string | null>(null);
  const [hoveredContextBtn, setHoveredContextBtn] = useState<string | null>(null);
  const [loggingGoalId, setLoggingGoalId] = useState<string | null>(null);
  const [hoveredAddBtn, setHoveredAddBtn] = useState(false);
  const chatEndRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  void trades;

  useEffect(() => {
    const saved = localStorage.getItem('wickcoach_goals');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0 && 'context' in parsed[0]) {
          setGoals(parsed.map((g: Goal) => ({ ...g, actionItems: g.actionItems || [], goalType: g.goalType || 'General' })));
        } else {
          setGoals(DEFAULT_GOALS);
          localStorage.setItem('wickcoach_goals', JSON.stringify(DEFAULT_GOALS));
        }
      } catch {
        setGoals(DEFAULT_GOALS);
        localStorage.setItem('wickcoach_goals', JSON.stringify(DEFAULT_GOALS));
      }
    } else {
      setGoals(DEFAULT_GOALS);
      localStorage.setItem('wickcoach_goals', JSON.stringify(DEFAULT_GOALS));
    }
  }, []);

  useEffect(() => {
    if (goals.length > 0) localStorage.setItem('wickcoach_goals', JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    if (expandedGoalId) {
      chatEndRefs.current[expandedGoalId]?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [goals, expandedGoalId, loadingGoalId]);

  const addNewGoal = () => {
    const newGoal: Goal = {
      id: `g${Date.now()}`,
      title: '',
      context: [],
      aiResponses: [],
      contextComplete: false,
      actionItems: [],
      createdAt: new Date().toISOString(),
      goalType: 'General',
    };
    setGoals(prev => [...prev, newGoal]);
  };

  const updateGoalTitle = (id: string, title: string) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, title } : g));
  };

  const cycleGoalType = (id: string) => {
    setGoals(prev => prev.map(g => {
      if (g.id !== id) return g;
      const currentIdx = GOAL_TYPES.indexOf(g.goalType);
      const nextIdx = (currentIdx + 1) % GOAL_TYPES.length;
      return { ...g, goalType: GOAL_TYPES[nextIdx] };
    }));
  };

  const deleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
    if (expandedGoalId === id) setExpandedGoalId(null);
  };

  const clearGoalContext = (id: string) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, context: [], aiResponses: [], contextComplete: false, actionItems: [] } : g));
  };

  const handleTextareaGrow = (e: React.ChangeEvent<HTMLTextAreaElement>, goalId: string) => {
    setContextInputs(prev => ({ ...prev, [goalId]: e.target.value }));
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  const sendGoalContext = async (goalId: string) => {
    const input = contextInputs[goalId]?.trim();
    if (!input || loadingGoalId) return;

    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const updatedContext = [...goal.context, input];
    setGoals(prev => prev.map(g => g.id === goalId ? { ...g, context: updatedContext } : g));
    setContextInputs(prev => ({ ...prev, [goalId]: '' }));
    setLoadingGoalId(goalId);

    const textareaEl = textareaRefs.current[goalId];
    if (textareaEl && onMessageSent) {
      onMessageSent(textareaEl.getBoundingClientRect());
    }

    const messages: { role: string; content: string }[] = [];
    for (let i = 0; i < updatedContext.length; i++) {
      messages.push({ role: 'user', content: updatedContext[i] });
      if (goal.aiResponses[i]) messages.push({ role: 'assistant', content: goal.aiResponses[i] });
    }

    const goalsContext = updatedContext.join(' | ');
    const exchangeNumber = updatedContext.length;

    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, goalsContext, mode: 'goals', goalTitle: goal.title, exchangeNumber })
      });
      const data = await res.json();
      const aiReply: string = data.reply;
      const readyToLog = exchangeNumber >= 5 || (exchangeNumber >= 3 && !aiReply.includes('?'));
      setGoals(prev => {
        const next = prev.map(g => g.id === goalId ? { ...g, context: updatedContext, aiResponses: [...g.aiResponses, aiReply] } : g);
        const profileData = JSON.parse(localStorage.getItem('wickcoach_trader_profile') || '{"goalContexts":[],"totalExchanges":0}');
        profileData.goalContexts = next.filter(g => g.context.length > 0).map(g => ({
          goalTitle: g.title,
          exchanges: g.context.map((c, i) => ({ user: c, ai: g.aiResponses[i] || '' })),
          actionItems: g.actionItems || [],
          complete: g.contextComplete
        }));
        profileData.totalExchanges = profileData.goalContexts.reduce((sum: number, g: { exchanges: unknown[] }) => sum + g.exchanges.length, 0);
        profileData.lastUpdated = new Date().toISOString();
        localStorage.setItem('wickcoach_trader_profile', JSON.stringify(profileData));
        return next;
      });
      void readyToLog;
    } catch {
      setGoals(prev => prev.map(g => g.id === goalId ? { ...g, context: updatedContext, aiResponses: [...g.aiResponses, 'Failed to connect to WickCoach.'] } : g));
    }
    setLoadingGoalId(null);
  };

  const handleLogAndExit = async (goalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    setLoggingGoalId(goalId);

    let thread = '';
    for (let i = 0; i < goal.context.length; i++) {
      thread += `User: ${goal.context[i]}\n`;
      if (goal.aiResponses[i]) thread += `WickCoach: ${goal.aiResponses[i]}\n`;
    }

    const actionPrompt = `Based on this conversation about the trader's goal "${goal.title}":\n\n${thread}\nGenerate exactly 3 concrete action items the trader must DO this week. Each must:\n- Start with a verb (Track, Record, Stop, Wait, Write, Measure, etc.)\n- Be specific enough to verify at end of week (yes/no, did I do it?)\n- Be under 10 words\n\nFormat:\n1. [action]\n2. [action]\n3. [action]\n\nNothing else. No intro. No explanation. Just 3 actionable items.`;

    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: actionPrompt }], mode: 'trades' })
      });
      const data = await res.json();
      const reply: string = data.reply || '';
      const items = reply.split('\n').map((line: string) => line.replace(/^\d+\.\s*/, '').trim()).filter((line: string) => line.length > 0).slice(0, 3);
      setGoals(prev => prev.map(g => g.id === goalId ? { ...g, contextComplete: true, actionItems: items } : g));
    } catch {
      setGoals(prev => prev.map(g => g.id === goalId ? { ...g, contextComplete: true, actionItems: [] } : g));
    }

    setLoggingGoalId(null);
    setExpandedGoalId(null);
  };

  const isReadyToLog = (g: Goal) => {
    const exchanges = g.context.length;
    if (exchanges >= 5) return true;
    if (exchanges >= 3 && g.aiResponses.length > 0) {
      const lastReply = g.aiResponses[g.aiResponses.length - 1];
      return !lastReply.includes('?');
    }
    return false;
  };

  const getProgressPercent = (g: Goal) => Math.min(g.context.length * 20, 100);

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 140px)', fontFamily: fm, background: '#1a1c23' }}>
      {/* ═══ LEFT SIDEBAR ═══ */}
      <div style={{ width: 220, background: '#0e0f14', borderRight: '1px solid #1e1f2a', padding: '28px 20px', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ fontFamily: fm, fontSize: 12, color: '#666', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6 }}>Navigation</div>
        <div style={{ fontFamily: fm, fontSize: 13, color: teal, textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700, marginBottom: 16 }}>Goals Hierarchy</div>
        <div style={{ height: 1, background: '#2a2b32', marginBottom: 20 }} />

        {(['weekly', 'monthly', 'behavioral'] as const).map(v => {
          const isActive = activeView === v;
          const label = v === 'weekly' ? 'Weekly Goals' : v === 'monthly' ? 'Monthly Goals' : 'Behavioral';
          return (
            <div
              key={v}
              onClick={() => setActiveView(v)}
              style={{
                padding: '12px 14px',
                marginBottom: 4,
                borderRadius: 6,
                cursor: 'pointer',
                background: isActive ? '#1a1c23' : 'transparent',
                borderLeft: isActive ? `3px solid ${teal}` : '3px solid transparent',
                color: isActive ? '#ffffff' : '#6b7280',
                fontSize: 14,
                fontFamily: fm,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 0.15s ease',
              }}
            >
              <span>{label}</span>
              {isActive && <span style={{ color: teal, fontSize: 12 }}>›</span>}
            </div>
          );
        })}
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      <div style={{ flex: 1, padding: '40px 36px 32px', overflowY: 'auto' }}>
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <h2 style={{ fontFamily: fd, fontSize: 28, color: '#ffffff', fontWeight: 700, margin: 0, letterSpacing: '0.02em' }}>
              {activeView === 'weekly' ? 'Weekly Goals' : activeView === 'monthly' ? 'Monthly Goals' : 'Behavioral'}
            </h2>
            <p style={{ fontFamily: fm, fontSize: 14, color: '#888', margin: '8px 0 0' }}>
              Active behavioral and technical parameters for the current week.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginTop: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: teal }} />
            <span style={{ fontFamily: fm, fontSize: 13, color: teal }}>{goals.length} Active Rule{goals.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* ═══ GOAL CARDS ═══ */}
        {goals.map((g, idx) => {
          const isExpanded = expandedGoalId === g.id;
          return (
            <div key={g.id} style={{
              background: '#0e0f14',
              border: isExpanded ? '1px solid rgba(0,212,160,0.35)' : '1px solid #1e1f2a',
              borderRadius: 12,
              padding: '24px 28px',
              marginBottom: 16,
              boxShadow: isExpanded ? '0 0 15px rgba(0,212,160,0.18), 0 0 30px rgba(0,212,160,0.06)' : 'none',
              transition: 'all 0.3s ease',
            }}>
              {/* Top row: number + title area + context button + delete */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {/* Green numbered circle */}
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  border: `2px solid ${teal}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: teal, fontFamily: fm, lineHeight: 1 }}>{idx + 1}</span>
                </div>

                {/* Title + TYPE tag */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <input
                    value={g.title}
                    onChange={e => updateGoalTitle(g.id, e.target.value.toUpperCase())}
                    placeholder="TYPE YOUR GOAL HERE..."
                    onMouseEnter={() => setHoveredGoalId(g.id)}
                    onMouseLeave={() => setHoveredGoalId(null)}
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: hoveredGoalId === g.id ? '1px dashed #2a2b32' : '1px solid transparent',
                      outline: 'none',
                      color: '#ffffff',
                      fontFamily: fd,
                      fontSize: 16,
                      fontWeight: 700,
                      letterSpacing: 1,
                      cursor: 'text',
                      padding: '2px 0',
                      textTransform: 'uppercase',
                      transition: 'border-color 0.15s ease',
                    }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                    <span
                      onClick={() => cycleGoalType(g.id)}
                      style={{
                        fontFamily: fm,
                        fontSize: 11,
                        fontWeight: 700,
                        color: teal,
                        background: 'rgba(0,212,160,0.18)',
                        padding: '2px 8px',
                        borderRadius: 4,
                        letterSpacing: 1,
                        cursor: 'pointer',
                        userSelect: 'none',
                      }}
                    >TYPE</span>
                    <span style={{ fontFamily: fm, fontSize: 13, color: '#888' }}>{g.goalType}</span>
                  </div>

                  {/* Action items below type tag */}
                  {g.contextComplete && g.actionItems.length > 0 && !isExpanded && (
                    <div style={{ marginTop: 10 }}>
                      {g.actionItems.map((item, i) => (
                        <div key={i} style={{ fontFamily: fm, fontSize: 14, color: teal, lineHeight: 1.7, marginBottom: 2 }}>
                          ↳ {item}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Context button area */}
                <div
                  onClick={() => setExpandedGoalId(isExpanded ? null : g.id)}
                  onMouseEnter={() => setHoveredContextBtn(g.id)}
                  onMouseLeave={() => setHoveredContextBtn(null)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    cursor: 'pointer',
                    flexShrink: 0,
                    padding: '10px 16px',
                    borderRadius: 8,
                    border: '1px solid #2a2b32',
                    background: hoveredContextBtn === g.id ? 'rgba(0,212,160,0.06)' : '#13141a',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <MiniStickFigure size={28} />
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{
                      fontSize: 12,
                      color: g.contextComplete ? teal : (hoveredContextBtn === g.id ? teal : '#9ca3af'),
                      fontFamily: fm,
                      whiteSpace: 'nowrap',
                      transition: 'color 0.15s ease',
                    }}>
                      {g.contextComplete ? 'context provided ✓' : 'click to give context'}
                    </span>
                    {g.contextComplete && (
                      <span
                        onClick={e => { e.stopPropagation(); setExpandedGoalId(isExpanded ? null : g.id); }}
                        style={{ fontSize: 10, color: hoveredContextBtn === g.id ? teal : '#6b7280', cursor: 'pointer', fontFamily: fm, marginTop: 2, transition: 'color 0.15s ease' }}
                      >view / edit</span>
                    )}
                  </div>
                </div>

                {/* Delete button */}
                <span
                  onClick={() => deleteGoal(g.id)}
                  style={{ fontSize: 16, color: '#3a3d48', cursor: 'pointer', lineHeight: 1, flexShrink: 0, marginLeft: 4, padding: '4px' }}
                  title="Delete goal"
                >✕</span>
              </div>

              {/* ═══ Expanded Chat Area ═══ */}
              {isExpanded && (
                <div style={{ display: 'flex', gap: 16, marginTop: 20 }}>
                  <div style={{ flex: 2 }} />
                  <div style={{
                    flex: 1,
                    background: '#0a0b0f',
                    border: '1px solid #1e1f2a',
                    borderRadius: 8,
                    padding: 14,
                    minHeight: 450,
                    maxHeight: 500,
                    display: 'flex',
                    flexDirection: 'column',
                  }}>
                    {/* Progress bar */}
                    <div style={{ height: 3, background: '#1a1b22', borderRadius: 2, marginBottom: 10, overflow: 'hidden', flexShrink: 0 }}>
                      <div style={{ width: `${getProgressPercent(g)}%`, height: '100%', background: teal, borderRadius: 2, transition: 'width 0.5s ease' }} />
                    </div>
                    {g.contextComplete && (
                      <div style={{ fontSize: 11, color: teal, fontFamily: fm, marginBottom: 8, fontWeight: 600, flexShrink: 0 }}>Context provided ✓</div>
                    )}

                    {/* iMessage-style chat thread */}
                    <div style={{ flex: 1, overflowY: 'auto', marginBottom: 8, minHeight: 300, backgroundImage: 'radial-gradient(rgba(0,212,160,0.18) 1px, transparent 1px)', backgroundSize: '4px 4px' }}>
                      {g.context.map((msg, i) => (
                        <div key={i}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                            <div style={{ maxWidth: '80%', fontFamily: fm, fontSize: 14, color: '#e8e8f0', lineHeight: 1.6, background: '#2a2b32', borderRadius: '16px 16px 4px 16px', padding: '12px 16px' }}>{msg}</div>
                          </div>
                          {g.aiResponses[i] && (
                            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 8 }}>
                              <div style={{ maxWidth: '80%', fontFamily: fm, fontSize: 14, color: teal, lineHeight: 1.6, background: 'rgba(0,212,160,0.1)', border: '1px solid rgba(0,212,160,0.2)', borderRadius: '16px 16px 16px 4px', padding: '12px 16px' }}>
                                {g.aiResponses[i].split('\n').filter((ln: string) => ln.trim()).map((ln: string, li: number) => {
                                  const isBullet = /^[•\-\d]/.test(ln.trim());
                                  return <div key={li} style={{ marginBottom: 8, paddingLeft: isBullet ? 16 : 0 }}>{ln.trim()}</div>;
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      {loadingGoalId === g.id && (
                        <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 8 }}>
                          <div style={{ fontFamily: fm, fontSize: 14, color: teal, background: 'rgba(0,212,160,0.1)', border: '1px solid rgba(0,212,160,0.2)', borderRadius: '16px 16px 16px 4px', padding: '12px 16px' }}>
                            <span style={{ animation: 'blink 1s step-end infinite' }}>...</span>
                          </div>
                        </div>
                      )}
                      <div ref={el => { chatEndRefs.current[g.id] = el; }} />
                    </div>

                    {/* Textarea input */}
                    {!g.contextComplete && (
                      <div style={{ flexShrink: 0 }}>
                        <textarea
                          ref={el => { textareaRefs.current[g.id] = el; }}
                          value={contextInputs[g.id] || ''}
                          onChange={e => handleTextareaGrow(e, g.id)}
                          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendGoalContext(g.id); } }}
                          placeholder={isReadyToLog(g) ? 'Add more context or click Log & Exit...' : 'Tell WickCoach why this matters...'}
                          rows={1}
                          style={{ width: '100%', background: '#0e0f14', border: '1px solid rgba(0,212,160,0.3)', borderRadius: 8, padding: '12px 16px', color: '#ffffff', fontFamily: fm, fontSize: 15, outline: 'none', boxSizing: 'border-box', minHeight: 44, maxHeight: 120, caretColor: teal, boxShadow: 'inset 0 0 20px rgba(0,212,160,0.03)', resize: 'none', overflow: 'hidden', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}
                        />
                      </div>
                    )}

                    {/* Log & Exit button */}
                    {!g.contextComplete && isReadyToLog(g) && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8, flexShrink: 0 }}>
                        <div
                          onClick={() => !loggingGoalId && handleLogAndExit(g.id)}
                          style={{ background: loggingGoalId === g.id ? '#1a1b22' : teal, color: loggingGoalId === g.id ? '#4a4d58' : '#0e0f14', fontFamily: fm, fontSize: 12, fontWeight: 700, padding: '8px 20px', borderRadius: 6, cursor: loggingGoalId === g.id ? 'default' : 'pointer' }}
                        >
                          {loggingGoalId === g.id ? 'Logging...' : 'Log & Exit'}
                        </div>
                      </div>
                    )}

                    {/* Clear context */}
                    {g.contextComplete && (
                      <div style={{ flexShrink: 0, marginTop: 4 }}>
                        <span onClick={() => clearGoalContext(g.id)} style={{ fontSize: 10, color: '#ef4444', cursor: 'pointer', fontFamily: fm }}>clear context</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* ═══ Add New Goal Button ═══ */}
        <div
          onClick={addNewGoal}
          onMouseEnter={() => setHoveredAddBtn(true)}
          onMouseLeave={() => setHoveredAddBtn(false)}
          style={{
            border: `1px dashed ${hoveredAddBtn ? teal : '#2a2b32'}`,
            borderRadius: 12,
            padding: '22px 20px',
            textAlign: 'center',
            cursor: 'pointer',
            marginTop: 8,
            transition: 'all 0.15s ease',
          }}
        >
          <span style={{
            fontSize: 14,
            color: hoveredAddBtn ? teal : '#666',
            fontFamily: fm,
            letterSpacing: 2,
            textTransform: 'uppercase',
            transition: 'color 0.15s ease',
          }}>+ Initialize New Parameter</span>
        </div>
      </div>
      <style>{`@keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }`}</style>
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
  const traderProfileTabRef = useRef<HTMLSpanElement>(null);
  const [floatingPlusOnes, setFloatingPlusOnes] = useState<{ id: string; startX: number; startY: number; endX: number; endY: number; animated: boolean }[]>([]);
  const [profileTabGlow, setProfileTabGlow] = useState(false);

  const triggerFloatingPlusOne = (inputRect: DOMRect) => {
    const tabEl = traderProfileTabRef.current;
    if (!tabEl) return;
    const tabRect = tabEl.getBoundingClientRect();
    const startX = inputRect.left + inputRect.width / 2 - 20;
    const startY = inputRect.top - 10;
    const endX = tabRect.left + tabRect.width / 2 - 20;
    const endY = tabRect.top + tabRect.height / 2 - 10;
    const id = `fp_${Date.now()}_${Math.random()}`;
    setFloatingPlusOnes(prev => [...prev, { id, startX, startY, endX, endY, animated: false }]);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setFloatingPlusOnes(prev => prev.map(f => f.id === id ? { ...f, animated: true } : f));
      });
    });
    setTimeout(() => { setProfileTabGlow(true); }, 1300);
    setTimeout(() => { setProfileTabGlow(false); }, 2100);
    setTimeout(() => { setFloatingPlusOnes(prev => prev.filter(f => f.id !== id)); }, 1600);
  };

  // Load trades from localStorage on mount, fallback to fake-trades.json
  React.useEffect(() => {
    try {
      const dataVersion = 'v4';
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
        @keyframes tabPulse { 0%, 100% { box-shadow: 0 0 6px rgba(0,212,160,0.1); border-color: rgba(0,212,160,0.18) } 50% { box-shadow: 0 0 24px rgba(0,212,160,0.45); border-color: rgba(0,212,160,0.4) } }
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
              <span ref={t === 'Trader Profile' ? traderProfileTabRef : undefined} key={t} onClick={() => setActiveTab(t)} style={{ fontSize: 14, color: teal, letterSpacing: "0.04em", padding: "14px 16px 16px", cursor: "pointer", fontFamily: fm, borderRadius: "8px 8px 0 0", fontWeight: 600, background: activeTab === t ? "rgba(0,212,160,0.18)" : "rgba(0,212,160,0.05)", borderTop: activeTab === t ? `1px solid ${teal}` : "1px solid rgba(0,212,160,0.18)", borderRight: activeTab === t ? `1px solid ${teal}` : "1px solid rgba(0,212,160,0.18)", borderBottom: "none", borderLeft: activeTab === t ? `1px solid ${teal}` : "1px solid rgba(0,212,160,0.18)", flex: 1, textAlign: "center", lineHeight: 1.5, boxShadow: t === 'Trader Profile' && profileTabGlow ? '0 0 15px rgba(0,212,160,0.4)' : 'none', transition: 'box-shadow 0.3s ease' }}>{t}</span>
            ))}
          </div>
        </nav>
        <div style={{ background: '#1a1c23', minHeight: 'calc(100vh - 140px)' }}>
        {activeTab === 'Log a Trade' && (
          <div style={{ maxWidth: 580, margin: '0 auto', padding: '40px 20px' }}>
            <LogATradeContent setActiveTab={setActiveTab} />
          </div>
        )}
        {activeTab === 'Past Trades' && (
          <PastTradesContent trades={trades} setActiveTab={setActiveTab} />
        )}
        {activeTab === 'Trading Goals' && (
          <TradingGoalsContent trades={trades} onMessageSent={triggerFloatingPlusOne} />
        )}
        {activeTab === 'Analysis' && (
          <AnalysisContent />
        )}
        {activeTab !== '' && activeTab !== 'Log a Trade' && activeTab !== 'Past Trades' && activeTab !== 'Trading Goals' && activeTab !== 'Analysis' && (
          <div style={{ textAlign: 'center', paddingTop: 80 }}>
            <p style={{ color: '#4b5563', fontFamily: fm, fontSize: 16 }}>Coming soon</p>
          </div>
        )}
        </div>
        {/* Floating +1 animations */}
        {floatingPlusOnes.map(f => (
          <div key={f.id} style={{ position: 'fixed', left: f.startX, top: f.startY, transform: f.animated ? `translate(${f.endX - f.startX}px, ${f.endY - f.startY}px) scale(0.4)` : 'translate(0,0) scale(1)', opacity: f.animated ? 0 : 1, transition: 'all 1.5s cubic-bezier(0.25, 0.1, 0.25, 1)', zIndex: 9999, pointerEvents: 'none' as const, display: 'flex', flexDirection: 'column' as const, alignItems: 'center' }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: teal, fontFamily: fm, textShadow: '0 0 12px rgba(0,212,160,0.5)' }}>+1</span>
            <span style={{ fontSize: 9, color: '#6b7280', fontFamily: fm }}>Trader Profile</span>
          </div>
        ))}
      </>)}

      {/* ═══ HOME VIEW ═══ */}
      {view === 'home' && (<>

      {/* ═══ BACKGROUND CHART WATERMARK ═══ */}
      <div style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', zIndex: 0, pointerEvents: 'none', opacity: 0.045 }}>
        <svg viewBox="0 0 1400 800" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
          <text x="700" y="450" textAnchor="middle" style={{ fontFamily: fd, fontSize: 140, fontWeight: 700, fill: 'rgba(255,255,255,0.4)' }} transform="rotate(-12, 700, 450)">WickCoach · 1D</text>
          {/* Consolidation (1-8) */}
          <line x1="80" y1="380" x2="80" y2="440" stroke="rgba(255,255,255,0.5)" strokeWidth="1"/><rect x="74" y="395" width="12" height="30" fill="rgba(255,255,255,0.4)"/>
          <line x1="128" y1="370" x2="128" y2="445" stroke="rgba(0,255,136,0.5)" strokeWidth="1"/><rect x="122" y="385" width="12" height="35" fill="rgba(0,255,136,0.3)"/>
          <line x1="176" y1="375" x2="176" y2="450" stroke="rgba(255,255,255,0.5)" strokeWidth="1"/><rect x="170" y="390" width="12" height="38" fill="rgba(255,255,255,0.4)"/>
          <line x1="224" y1="365" x2="224" y2="435" stroke="rgba(0,255,136,0.5)" strokeWidth="1"/><rect x="218" y="380" width="12" height="32" fill="rgba(0,255,136,0.3)"/>
          <line x1="272" y1="372" x2="272" y2="448" stroke="rgba(255,255,255,0.5)" strokeWidth="1"/><rect x="266" y="388" width="12" height="40" fill="rgba(255,255,255,0.4)"/>
          <line x1="320" y1="360" x2="320" y2="440" stroke="rgba(0,255,136,0.5)" strokeWidth="1"/><rect x="314" y="375" width="12" height="38" fill="rgba(0,255,136,0.3)"/>
          <line x1="368" y1="355" x2="368" y2="430" stroke="rgba(255,255,255,0.5)" strokeWidth="1"/><rect x="362" y="368" width="12" height="42" fill="rgba(255,255,255,0.4)"/>
          <line x1="416" y1="350" x2="416" y2="425" stroke="rgba(0,255,136,0.5)" strokeWidth="1"/><rect x="410" y="362" width="12" height="36" fill="rgba(0,255,136,0.3)"/>
          {/* Breakout (9-16) */}
          <line x1="468" y1="310" x2="468" y2="420" stroke="rgba(0,255,136,0.5)" strokeWidth="1"/><rect x="462" y="325" width="12" height="75" fill="rgba(0,255,136,0.3)"/>
          <line x1="516" y1="270" x2="516" y2="400" stroke="rgba(0,255,136,0.5)" strokeWidth="1"/><rect x="510" y="285" width="12" height="90" fill="rgba(0,255,136,0.3)"/>
          <line x1="564" y1="240" x2="564" y2="380" stroke="rgba(0,255,136,0.5)" strokeWidth="1"/><rect x="558" y="255" width="12" height="100" fill="rgba(0,255,136,0.3)"/>
          <line x1="612" y1="210" x2="612" y2="360" stroke="rgba(0,255,136,0.5)" strokeWidth="1"/><rect x="606" y="225" width="14" height="110" fill="rgba(0,255,136,0.3)"/>
          <line x1="660" y1="190" x2="660" y2="340" stroke="rgba(0,255,136,0.5)" strokeWidth="1"/><rect x="654" y="205" width="14" height="115" fill="rgba(0,255,136,0.3)"/>
          <line x1="708" y1="175" x2="708" y2="320" stroke="rgba(0,255,136,0.5)" strokeWidth="1"/><rect x="702" y="190" width="14" height="105" fill="rgba(0,255,136,0.3)"/>
          <line x1="756" y1="160" x2="756" y2="300" stroke="rgba(0,255,136,0.5)" strokeWidth="1"/><rect x="750" y="175" width="14" height="100" fill="rgba(0,255,136,0.3)"/>
          <line x1="804" y1="150" x2="804" y2="290" stroke="rgba(0,255,136,0.5)" strokeWidth="1"/><rect x="798" y="165" width="14" height="98" fill="rgba(0,255,136,0.3)"/>
          {/* Pullback (17-21) */}
          <line x1="852" y1="165" x2="852" y2="310" stroke="rgba(255,255,255,0.5)" strokeWidth="1"/><rect x="846" y="185" width="14" height="95" fill="rgba(255,255,255,0.4)"/>
          <line x1="900" y1="195" x2="900" y2="330" stroke="rgba(255,255,255,0.5)" strokeWidth="1"/><rect x="894" y="215" width="14" height="85" fill="rgba(255,255,255,0.4)"/>
          <line x1="948" y1="220" x2="948" y2="340" stroke="rgba(255,255,255,0.5)" strokeWidth="1"/><rect x="942" y="235" width="14" height="75" fill="rgba(255,255,255,0.4)"/>
          <line x1="996" y1="230" x2="996" y2="345" stroke="rgba(255,255,255,0.5)" strokeWidth="1"/><rect x="990" y="242" width="14" height="70" fill="rgba(255,255,255,0.4)"/>
          <line x1="1044" y1="240" x2="1044" y2="350" stroke="rgba(0,255,136,0.5)" strokeWidth="1"/><rect x="1038" y="252" width="14" height="65" fill="rgba(0,255,136,0.3)"/>
          {/* Recovery (22-28) */}
          <line x1="1092" y1="210" x2="1092" y2="340" stroke="rgba(0,255,136,0.5)" strokeWidth="1"/><rect x="1086" y="225" width="14" height="85" fill="rgba(0,255,136,0.3)"/>
          <line x1="1140" y1="185" x2="1140" y2="320" stroke="rgba(0,255,136,0.5)" strokeWidth="1"/><rect x="1134" y="200" width="14" height="90" fill="rgba(0,255,136,0.3)"/>
          <line x1="1188" y1="165" x2="1188" y2="305" stroke="rgba(0,255,136,0.5)" strokeWidth="1"/><rect x="1182" y="178" width="14" height="95" fill="rgba(0,255,136,0.3)"/>
          <line x1="1236" y1="148" x2="1236" y2="290" stroke="rgba(0,255,136,0.5)" strokeWidth="1"/><rect x="1230" y="162" width="14" height="100" fill="rgba(0,255,136,0.3)"/>
          <line x1="1284" y1="135" x2="1284" y2="275" stroke="rgba(0,255,136,0.5)" strokeWidth="1"/><rect x="1278" y="148" width="14" height="98" fill="rgba(0,255,136,0.3)"/>
          <line x1="1332" y1="120" x2="1332" y2="260" stroke="rgba(0,255,136,0.5)" strokeWidth="1"/><rect x="1326" y="135" width="14" height="100" fill="rgba(0,255,136,0.3)"/>
          <line x1="1380" y1="105" x2="1380" y2="250" stroke="rgba(0,255,136,0.5)" strokeWidth="1"/><rect x="1374" y="118" width="14" height="105" fill="rgba(0,255,136,0.3)"/>
          {/* 20 SMA */}
          <path d="M 80 410 C 150 405, 250 395, 350 385 C 420 378, 470 355, 540 320 C 600 290, 650 260, 720 235 C 780 215, 820 205, 860 230 C 900 250, 940 270, 980 280 C 1020 275, 1060 260, 1100 240 C 1150 220, 1200 195, 1260 175 C 1300 160, 1350 145, 1380 135" fill="none" stroke="rgba(57,255,133,0.4)" strokeWidth="1.5" strokeLinecap="round"/>
          {/* 200 SMA */}
          <path d="M 80 430 C 200 425, 350 415, 500 395 C 600 380, 700 360, 800 340 C 900 325, 1000 315, 1100 300 C 1200 288, 1300 275, 1380 265" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>

      {/* ═══ NAV ═══ */}
      <nav style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 40px 0", borderBottom: "1px solid #1a1b22", overflow: "visible", position: 'relative' }}>
        <div style={{ marginBottom: 20 }}>
          <Logo size={34} showText />
        </div>
        <span style={{ position: 'absolute', top: 28, right: 40, color: teal, fontFamily: fm, fontSize: 14, cursor: 'pointer', fontWeight: 500 }}>Login</span>
        <div style={{ display: "flex", gap: 5, width: "100%", maxWidth: 920 }}>
          {tabs.map(t => (
            <span key={t} onClick={() => { setActiveTab(t); setView('app'); }} style={{ fontSize: 14, color: teal, letterSpacing: "0.04em", padding: "14px 16px 16px", cursor: "pointer", fontFamily: fm, borderRadius: "8px 8px 0 0", fontWeight: 600, background: "rgba(0,212,160,0.05)", borderTop: "1px solid rgba(0,212,160,0.18)", borderRight: "1px solid rgba(0,212,160,0.18)", borderBottom: "none", borderLeft: "1px solid rgba(0,212,160,0.18)", flex: 1, textAlign: "center", lineHeight: 1.5, animation: showClickHint ? "iconGlowPulse 1s ease-in-out 3" : tabGlow ? "tabPulse 1.4s ease infinite" : "none" }}>{t}</span>
          ))}
        </div>
        {/* "click these" hint below app tabs */}
        <div style={{ textAlign: 'center', marginTop: 8, height: 16 }}>
          <span style={{ fontFamily: fm, fontSize: 11, color: '#9ca3af', opacity: showClickHint ? 1 : 0, transition: 'opacity 0.5s ease' }}>click these ↑</span>
        </div>
        <style>{`@keyframes iconGlowPulse { 0%,100% { box-shadow: 0 0 0px rgba(0,212,160,0); } 50% { box-shadow: 0 0 12px rgba(0,212,160,0.4); } }`}</style>
      </nav>

      {/* ═══ FEATURE CAROUSEL ═══ */}
      <section style={{ position: 'relative', overflow: 'hidden', minHeight: '100vh', padding: '32px 20px 40px', background: '#0e0f14' }}>
        <div style={{ position: 'absolute', top: -200, right: -200, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,160,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -300, left: -200, width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,160,0.05) 0%, rgba(59,130,246,0.03) 50%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ textAlign: 'center', marginBottom: 32, position: 'relative' }}>
            {/* Hero animation video */}
            <video ref={heroVideoRef} autoPlay muted playsInline src="/wickcoach-logo-anim.mp4" style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', height: 300, width: 'auto', objectFit: 'contain' as const, opacity: textVisible ? 0.1 : 1, zIndex: 0, pointerEvents: 'none', transition: 'opacity 1s ease-out', mixBlendMode: 'lighten' as const, }} />
            {/* Heading */}
            <h1 style={{ position: 'relative', zIndex: 1, fontFamily: fd, color: '#ffffff', fontSize: 44, fontWeight: 700, lineHeight: 1.2, maxWidth: 800, margin: '0 auto 0', opacity: textVisible ? 1 : 0, filter: textVisible ? 'blur(0px)' : 'blur(8px)', transition: 'opacity 1s ease-in, filter 1s ease-in' }}>The trading journal that <span style={{ color: teal, textShadow: textVisible ? '0 0 20px rgba(0,212,160,0.3), 0 0 40px rgba(0,212,160,0.15)' : 'none', transition: 'text-shadow 1s ease-in 1s' }}>fixes your psychology</span></h1>
            {/* Subtitle */}
            <p style={{ position: 'relative', zIndex: 1, color: '#e5e7eb', fontFamily: fm, fontSize: 15, maxWidth: 600, margin: '0 auto', lineHeight: 1.7, marginTop: 24, opacity: textVisible ? 1 : 0, filter: textVisible ? 'blur(0px)' : 'blur(8px)', transition: 'opacity 1s ease-in, filter 1s ease-in' }}>AI-enhanced behavioral and trading pattern recognition</p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 28, marginBottom: 24 }}>
            {[
              { label: "Trading Goals", d: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12zM12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" },
              { label: "Log a Trade", d: "M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" },
              { label: "Past Trades", d: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 6v6l4 2" },
              { label: "Analysis", d: "M18 20V10M12 20V4M6 20v-6" },
              { label: "Trader Profile", d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" },
              { label: "Position Sizer", d: "M4 2h16a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM8 6h8M8 10h8M8 14h4" },
              { label: "Growth Simulator", d: "M23 6l-9.5 9.5-5-5L1 18M17 6h6v6" },
              { label: "Trade Timeline", d: "M3 4h18a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM16 2v4M8 2v4M1 10h22" },
            ].map((cat, i) => {
              const isActive = activeCategory === i;
              return (
                <div key={i} onClick={() => handleCategoryClick(i)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <div style={{ width: 56, height: 56, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isActive ? 'linear-gradient(135deg, rgba(0,212,160,0.25), rgba(0,212,160,0.1))' : 'rgba(255,255,255,0.03)', border: isActive ? '1px solid rgba(0,212,160,0.5)' : '1px solid rgba(255,255,255,0.06)', boxShadow: isActive ? '0 0 20px rgba(0,212,160,0.4), 0 0 50px rgba(0,212,160,0.25), 0 0 100px rgba(0,212,160,0.18)' : 'none', transform: isActive ? 'scale(1.15)' : 'scale(1)', transition: 'all 0.3s ease', }}>
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
                <div style={{ background: '#0e0f14', borderRadius: 4, overflow: 'hidden', height: 520, padding: 32 }}>
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
              {/* Chin */}
              <div style={{ height: 6 }} />
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
