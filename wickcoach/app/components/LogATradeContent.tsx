'use client'
import React, { useState, useRef } from "react"
import { Trade, toLocalYMD, parseLocalDate, getGoalsForWeek, getCurrentWeekStart, readClassifications, writeClassifications } from "./shared"

interface LogATradeContentProps {
  setActiveTab: (tab: string) => void;
  trades: Trade[];
  setTrades: React.Dispatch<React.SetStateAction<Trade[]>>;
  editingTrade?: Trade | null;
  onFinishEdit?: () => void;
}

export default function LogATradeContent({ setActiveTab: setTab, trades, setTrades, editingTrade = null, onFinishEdit }: LogATradeContentProps) {
    const [ticker, setTicker] = useState('');
    const [tradeDate, setTradeDate] = useState(toLocalYMD());
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
    const [validationErrors, setValidationErrors] = useState<{ risk?: string }>({});
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [startTime] = useState(Date.now());
    const [elapsedTime, setElapsedTime] = useState(0);
    const [finalTime, setFinalTime] = useState(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Prefill the form whenever the parent hands us a trade to edit.
    // Also clears any prior validation error state.
    React.useEffect(() => {
      if (!editingTrade) return;
      setTicker(editingTrade.ticker || '');
      setTradeDate(editingTrade.date || toLocalYMD());
      // Strategy inference — anything stored as "Shares" routes to the
      // SHARES position type, otherwise treat as derivatives.
      const isShares = editingTrade.strategy === 'Shares';
      setPositionType(isShares ? 'SHARES' : 'DERIVATIVES');
      setStrategyInputMode('text');
      setStrategyType('0DTE Call');
      setCustomStrategy(isShares ? '' : (editingTrade.strategy || ''));
      setDirection(editingTrade.direction || 'LONG');
      setContracts(String(editingTrade.contracts ?? ''));
      setEntryPrice(String(editingTrade.entryPrice ?? ''));
      setExitPrice(String(editingTrade.exitPrice ?? ''));
      setPl(String(editingTrade.pl ?? ''));
      setPlManualOverride(true);
      setJournal(editingTrade.journal || '');
      setScreenshot(editingTrade.screenshot || null);
      setRisk(editingTrade.riskAmount !== undefined ? String(editingTrade.riskAmount) : '');
      setRiskReward(editingTrade.riskReward || '\u2014');
      setValidationErrors({});
    }, [editingTrade]);

    // Current weekly goals — passive reminder shown beneath the journal
    // textarea. Recomputed each render so edits to the goals list are
    // reflected without needing a separate subscription.
    const currentGoals = getGoalsForWeek(getCurrentWeekStart());

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
        // Risk 0 (or unset / loss) → use em-dash. Downstream R:R
        // parsing already handles the em-dash case gracefully.
        setRiskReward('\u2014');
      }
    }, [pl, risk]);

    // Clear a "required" error as soon as the user types something.
    React.useEffect(() => {
      if (validationErrors.risk && risk !== '') {
        setValidationErrors(prev => ({ ...prev, risk: undefined }));
      }
    }, [risk, validationErrors.risk]);

    const resetForm = () => {
      setTicker(''); setTradeDate(toLocalYMD());
      setPositionType('DERIVATIVES'); setStrategyType('0DTE Call');
      setStrategyInputMode('select'); setCustomStrategy('');
      setDirection('LONG'); setContracts(''); setEntryPrice('');
      setExitPrice(''); setPl(''); setPlManualOverride(false);
      setJournal(''); setScreenshot(null); setSubmitted(false);
      setRisk(''); setRiskReward('\u2014');
    };

    const inputStyle = {
      background: '#1A1F2B',
      border: '1px solid #2A3143',
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
            <button onClick={() => setTab('Past Trades')} style={{ background: '#141822', border: '1px solid #00d4a0', borderRadius: 8, padding: '12px 24px', color: '#00d4a0', fontFamily: "'DM Mono', monospace", fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>View in Past Trades</button>
            <button onClick={() => setTab('Analysis')} style={{ background: '#141822', border: '1px solid #00d4a0', borderRadius: 8, padding: '12px 24px', color: '#00d4a0', fontFamily: "'DM Mono', monospace", fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>View in Analysis</button>
          </div>
          <p onClick={resetForm} style={{ color: '#6b7280', fontFamily: "'DM Mono', monospace", fontSize: 13, marginTop: 24, cursor: 'pointer' }}>+ Log another trade</p>
        </div>
      );
    }

    return (
      <>
        {editingTrade && (
          <div style={{
            padding: '10px 14px',
            marginBottom: 14,
            background: 'rgba(0,212,160,0.08)',
            border: '1px solid #00d4a0',
            borderRadius: 6,
            fontFamily: "'DM Mono', monospace",
            fontSize: 12,
            color: '#00d4a0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span>
              Editing trade from {parseLocalDate(editingTrade.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} &middot; {editingTrade.ticker}
            </span>
            <span
              onClick={() => { if (onFinishEdit) onFinishEdit(); }}
              style={{ cursor: 'pointer', color: '#7a7d85', fontSize: 11 }}
            >
              Cancel edit
            </span>
          </div>
        )}
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
            <button key={pt} onClick={() => setPositionType(pt)} style={{ flex: 1, background: positionType === pt ? 'rgba(0,212,160,0.15)' : '#0e0f14', border: positionType === pt ? '1px solid #00d4a0' : '1px solid #2A3143', color: positionType === pt ? '#00d4a0' : '#6b7280', borderRadius: 8, padding: '10px 0', fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 700, cursor: 'pointer', letterSpacing: 1 }}>{pt}</button>
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
            <button key={dir} onClick={() => setDirection(dir)} style={{ flex: 1, background: direction === dir ? 'rgba(0,212,160,0.15)' : '#0e0f14', border: direction === dir ? '1px solid #00d4a0' : '1px solid #2A3143', color: direction === dir ? '#00d4a0' : '#6b7280', borderRadius: 8, padding: '10px 0', fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 700, cursor: 'pointer', letterSpacing: 1 }}>{dir}</button>
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
            <label style={labelStyle}>Risk ($) <span style={{ color: '#ff4444' }}>*</span></label>
            <input
              type="number"
              step={0.01}
              style={{ ...inputStyle, borderColor: validationErrors.risk ? '#ff4444' : '#2A3143' }}
              placeholder="$0.00"
              value={risk}
              onChange={(e) => setRisk(e.target.value)}
            />
            {validationErrors.risk && (
              <div style={{ color: '#ff4444', fontSize: 11, fontFamily: "'DM Mono', monospace", marginTop: 4 }}>
                {validationErrors.risk}
              </div>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Risk : Reward</label>
            <input readOnly style={{ ...inputStyle, fontWeight: 700, color: riskReward === '\u2014' ? '#6b7280' : '#00d4a0', background: '#1A1F2B', cursor: 'default' }} value={riskReward} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 24, marginTop: 48 }}>
          <div style={{ flex: 1 }}>
            <div style={sectionLabelStyle}>JOURNAL ENTRY</div>
            <textarea style={{ ...inputStyle, minHeight: 200, resize: 'vertical', lineHeight: '1.7' }} placeholder="Share your brief approach on this trade for the WickCoach AI to analyze..." value={journal} onChange={(e) => setJournal(e.target.value)} />
            {currentGoals.length > 0 && (
              <div style={{
                marginTop: 6,
                padding: '6px 10px',
                background: '#13141a',
                borderLeft: '2px solid #00d4a0',
                borderRadius: '0 4px 4px 0',
                fontFamily: "'DM Mono', monospace",
                fontSize: 11,
                color: '#7a7d85',
                lineHeight: 1.4,
              }}>
                <span style={{ color: '#00d4a0', marginRight: 6 }}>Current weekly goals:</span>
                {currentGoals.map((g, i) => (
                  <span key={g.id}>{g.title}{i < currentGoals.length - 1 ? ' \u00b7 ' : ''}</span>
                ))}
              </div>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={sectionLabelStyle}>SCREENSHOT</div>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
            {!screenshot ? (
              <div onClick={() => fileInputRef.current?.click()} onMouseEnter={() => setUploadHover(true)} onMouseLeave={() => setUploadHover(false)} style={{ width: '100%', minHeight: 200, border: `2px dashed ${uploadHover ? '#00d4a0' : '#2A3143'}`, borderRadius: 12, background: '#1A1F2B', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', transition: 'border-color 0.2s' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                <span style={{ color: '#6b7280', fontFamily: "'DM Mono', monospace", fontSize: 13 }}>Drop an image here</span>
                <span style={{ color: '#00d4a0', fontFamily: "'DM Mono', monospace", fontSize: 12, cursor: 'pointer' }}>or click to browse</span>
              </div>
            ) : (
              <div style={{ position: 'relative', width: '100%', minHeight: 200, borderRadius: 12, overflow: 'hidden', border: '1px solid #2A3143' }}>
                <img src={screenshot} alt="Screenshot" style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 8 }} />
                <div onClick={() => { setScreenshot(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.7)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>{"\u2715"}</div>
              </div>
            )}
          </div>
        </div>

        <button onClick={() => {
          // Risk is required. Empty string blocks save; "0" is valid
          // (produces em-dash R:R downstream).
          if (risk.trim() === '') {
            setValidationErrors({ risk: 'Risk amount is required.' });
            return;
          }
          setFinalTime(elapsedTime);
          if (intervalRef.current) clearInterval(intervalRef.current);
          // Build and save trade
          const entry = parseFloat(entryPrice) || 0;
          const exit = parseFloat(exitPrice) || 0;
          const qty = parseInt(contracts) || 0;
          const computedPl = plManualOverride ? parseFloat(pl) || 0 : (exit - entry) * qty * (positionType === 'DERIVATIVES' ? 100 : 1);
          const riskNum = parseFloat(risk) || 0;
          // When risk is 0 we skip R:R calculation entirely (em-dash).
          const savedRiskReward = riskNum > 0 ? riskReward : '\u2014';
          const baseTrade: Omit<Trade, 'id'> = {
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
            riskAmount: riskNum,
            riskReward: savedRiskReward,
            journal: journal,
            screenshot: screenshot || undefined,
            result: computedPl > 0 ? 'WIN' : computedPl < 0 ? 'LOSS' : 'BREAKEVEN',
          };
          let updated: Trade[];
          if (editingTrade) {
            // In-place replace — preserve the original id.
            updated = trades.map(t => t.id === editingTrade.id ? { ...baseTrade, id: editingTrade.id } : t);
            // Stale classification must be dropped so the next Analysis
            // mount re-scores this trade against the new journal text.
            const cache = readClassifications();
            if (cache[editingTrade.id]) {
              delete cache[editingTrade.id];
              writeClassifications(cache);
            }
          } else {
            updated = [...trades, { ...baseTrade, id: Date.now().toString() }];
          }
          setTrades(updated);
          try { localStorage.setItem('wickcoach_trades', JSON.stringify(updated)); } catch {}
          if (editingTrade && onFinishEdit) onFinishEdit();
          setSubmitted(true);
        }} onMouseEnter={() => setSubmitHover(true)} onMouseLeave={() => setSubmitHover(false)} style={{ marginTop: 32, background: '#00d4a0', color: '#0A0D14', fontFamily: "'Chakra Petch', sans-serif", fontSize: 16, fontWeight: 700, padding: '16px 0', borderRadius: 12, border: 'none', cursor: 'pointer', width: '100%', letterSpacing: 1, filter: submitHover ? 'brightness(1.1)' : 'none' }}>{editingTrade ? 'Save Changes' : 'Log Trade'}</button>

        <p style={{ color: '#4b5563', fontFamily: "'DM Mono', monospace", fontSize: 12, textAlign: 'center', marginTop: 12 }}>Your data stays on your device. Always.</p>
      </>
    );
  }

