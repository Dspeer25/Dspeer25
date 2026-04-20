'use client';
import React, { useState, useEffect, useRef } from "react";
import { Lock, Eye, ShieldCheck } from "lucide-react";
import { fm, fd, teal, Trade } from "./components/shared";
import Logo from "./components/Logo";
import FAQ from "./components/FAQ";
import NavBar from "./components/NavBar";
import Hero from "./components/Hero";
import CarouselNav from "./components/CarouselNav";
import StockChartBackground from "./components/StockChartBackground";
import CarouselTradingGoals from "./components/CarouselTradingGoals";
import CarouselLogTrade from "./components/CarouselLogTrade";
import CarouselPastTrades from "./components/CarouselPastTrades";
import CarouselAnalysis from "./components/CarouselAnalysis";
import CarouselTraderProfile, { MockPositionSizer, MockGrowthSimulator, MockTradeTimeline } from "./components/CarouselTraderProfile";
import AnalysisContent from "./components/AnalysisHub";
import PastTradesContent from "./components/PastTradesContent";
import TradingGoalsContent from "./components/TradingGoalsContent";
import LogATradeContent from "./components/LogATradeContent";
import TraderProfileContent from "./components/TraderProfileContent";
import SplashScreen from "./components/SplashScreen";

export default function WickCoachFull() {
  const [tabGlow, setTabGlow] = useState(false);
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("");
  const [view, setView] = useState<'home' | 'app'>('home');
  const [activeCategory, setActiveCategory] = useState(0);
  const [textVisible, setTextVisible] = useState(false);
  const [showClickHint, setShowClickHint] = useState(false);
  const [trades, setTrades] = useState<Trade[]>([]);
  const traderProfileTabRef = useRef<HTMLSpanElement>(null);
  const [floatingPlusOnes, setFloatingPlusOnes] = useState<{ id: string; startX: number; startY: number; endX: number; endY: number; animated: boolean }[]>([]);
  const [profileTabGlow, setProfileTabGlow] = useState(false);
  const [showAllBrokers, setShowAllBrokers] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loginName, setLoginName] = useState('');
  const [loginEmail, setLoginEmail] = useState('');

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

  useEffect(() => {
    try {
      const dataVersion = 'v5';
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

  // Seed the trader profile with onboarding fields on first load. Preserve
  // any existing keys (goalContexts, totalExchanges, etc.) that other parts
  // of the app already write to the same localStorage entry.
  useEffect(() => {
    try {
      const onboardingDefaults = {
        instruments: '',
        strategy: '',
        experience: '',
        biggestStruggle: '',
        goodDayDescription: '',
        onboardingComplete: false,
        quantitativeTargets: [
          { id: 'target-rr', label: 'Target Risk:Reward', value: null, type: 'number'  },
          { id: 'target-wr', label: 'Target Win Rate',    value: null, type: 'percent' },
        ],
        customQuantTargets: [] as unknown[],
      };
      const raw = localStorage.getItem('wickcoach_trader_profile');
      const current = raw ? JSON.parse(raw) : {};
      let changed = false;
      const next = { ...current };
      for (const key of Object.keys(onboardingDefaults) as Array<keyof typeof onboardingDefaults>) {
        if (!(key in next)) {
          next[key] = onboardingDefaults[key];
          changed = true;
        }
      }
      if (changed) localStorage.setItem('wickcoach_trader_profile', JSON.stringify(next));
    } catch { /* ignore storage errors */ }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setTextVisible(true), 3500);
    return () => clearTimeout(t);
  }, []);

  const hintShownRef = useRef(false);
  useEffect(() => {
    if (!textVisible || hintShownRef.current) return;
    hintShownRef.current = true;
    setShowClickHint(true);
    const t = setTimeout(() => setShowClickHint(false), 4000);
    return () => clearTimeout(t);
  }, [textVisible]);

  const tabs = ["Log a Trade", "Past Trades", "Weekly Goals", "Analysis", "Trader Profile", "Tools"];

  const privacyCards = [
    { icon: <Eye size={22} color={teal} />, title: "Your trades stay yours", text: "All data stored locally in your browser. Nothing leaves your machine." },
    { icon: <Lock size={22} color={teal} />, title: "Upload any format", text: "CSVs, broker exports, screenshots \u2014 the AI reads it all and learns your history." },
    { icon: <ShieldCheck size={22} color={teal} />, title: "No tracking, no ads", text: "No analytics, no third-party sharing. Nothing." },
  ];

  const essentialFeatures = ["Trade logging", "Journal entries", "Past trades dashboard", "Equity curve", "Manual analytics"];
  const completeFeatures = ["Everything in Essential", "AI psychology coach (20/day)", "Journal entry analysis", "Behavioral pattern detection", "Weekly goal tracking", "Mark Douglas methodology", "All future updates"];
  const proFeatures = ["Everything in Complete", "100 AI interactions per day", "Priority AI response speed", "Advanced statistical analysis", "Deep pattern recognition", "Unlimited goal tracking", "Early access to new tools"];

  const faqs = [
    { q: "What is WickCoach?", a: "An AI trading journal that coaches your psychology by reading your trade logs AND your written journal entries." },
    { q: "How is the AI different?", a: "It reads what you wrote \u2014 your mindset, frustrations, confidence \u2014 and cross-references with results. It coaches behavior, not numbers." },
    { q: "Where is my data stored?", a: "Everything stays in your browser\u2019s local storage. We have zero access to it." },
    { q: "What\u2019s the difference between Essential and Complete?", a: "Essential gives you the trade log, journal, and dashboard. Complete adds the AI psychology coach that reads your entries, spots patterns, and holds you accountable." },
  ];

  return (
    <div style={{ background: "#0A0D14", color: "#d0d0d8", minHeight: "100vh", fontFamily: fm, position: 'relative' }}>
      {/* Subtle grid texture overlay — fades out past 80% of viewport */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none', zIndex: 0, maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0) 80%)', WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0) 80%)' }} />
      <SplashScreen />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Chakra+Petch:wght@400;500;600;700&display=swap');
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1) } 50% { opacity: 0.3; transform: scale(1.3) } }
        @keyframes tabPulse { 0%, 100% { box-shadow: 0 0 6px rgba(0,212,160,0.1); border-color: rgba(0,212,160,0.18) } 50% { box-shadow: 0 0 24px rgba(0,212,160,0.45); border-color: rgba(0,212,160,0.4) } }
        @keyframes hlaArrowBounce { 0%,100% { transform: translateX(-50%) translateY(0); } 50% { transform: translateX(-50%) translateY(8px); } }
        * { box-sizing: border-box; margin: 0; padding: 0 }
        *::-webkit-scrollbar { display: none }
        * { -ms-overflow-style: none; scrollbar-width: none }
        .price-card { transition: box-shadow 0.3s ease, border-color 0.3s ease }
        .price-card:hover { box-shadow: 0 0 30px rgba(0,212,160,0.2); border-color: rgba(0,212,160,0.35) !important }
        ::selection { background: rgba(0,212,160,0.2); color: #fff }
      `}</style>

      {/* ═══ APP VIEW ═══ */}
      {view === 'app' && (<>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <NavBar view="app" tabs={tabs} activeTab={activeTab} onTabClick={setActiveTab} onLogoClick={() => setView('home')} profileTabGlow={profileTabGlow} traderProfileTabRef={traderProfileTabRef} onLoginClick={() => setShowLogin(true)} />
        </div>
        <div style={{ backgroundImage: 'linear-gradient(to bottom, #181c26 0px, #151923 120px, #12151d 260px, #0A0D14 420px, #0A0D14 100%)', minHeight: 'calc(100vh - 140px)', position: 'relative', zIndex: 1 }}>
          {activeTab === 'Log a Trade' && (
            <div style={{ maxWidth: 580, margin: '0 auto', padding: '40px 20px' }}>
              <LogATradeContent setActiveTab={setActiveTab} trades={trades} setTrades={setTrades} />
            </div>
          )}
          {activeTab === 'Past Trades' && <PastTradesContent trades={trades} setTrades={setTrades} setActiveTab={setActiveTab} />}
          {activeTab === 'Weekly Goals' && <TradingGoalsContent trades={trades} onMessageSent={triggerFloatingPlusOne} />}
          {activeTab === 'Analysis' && <AnalysisContent trades={trades} />}
          {activeTab === 'Trader Profile' && <TraderProfileContent trades={trades} />}
          {activeTab === 'Tools' && (
            <div style={{ textAlign: 'center', paddingTop: 120, paddingBottom: 120 }}>
              <div style={{ fontFamily: fd, fontSize: 32, fontWeight: 700, color: '#fff', letterSpacing: '0.5px', marginBottom: 12 }}>Tools</div>
              <p style={{ color: '#aab0bd', fontFamily: fm, fontSize: 15, maxWidth: 520, margin: '0 auto 28px', lineHeight: 1.7 }}>
                Position sizer, scenario analysis, growth simulator, trade timeline and more — landing here soon.
              </p>
              <span style={{ display: 'inline-block', fontFamily: fm, fontSize: 12, color: teal, letterSpacing: 2, textTransform: 'uppercase', padding: '6px 14px', border: '1px solid rgba(0,212,160,0.4)', borderRadius: 999, background: 'rgba(0,212,160,0.06)' }}>Coming Soon</span>
            </div>
          )}
          {activeTab !== '' && activeTab !== 'Log a Trade' && activeTab !== 'Past Trades' && activeTab !== 'Weekly Goals' && activeTab !== 'Analysis' && activeTab !== 'Trader Profile' && activeTab !== 'Tools' && (
            <div style={{ textAlign: 'center', paddingTop: 80 }}><p style={{ color: '#4b5563', fontFamily: fm, fontSize: 16 }}>Coming soon</p></div>
          )}
        </div>
        {floatingPlusOnes.map(f => (
          <div key={f.id} style={{ position: 'fixed', left: f.startX, top: f.startY, transform: f.animated ? `translate(${f.endX - f.startX}px, ${f.endY - f.startY}px) scale(0.4)` : 'translate(0,0) scale(1)', opacity: f.animated ? 0 : 1, transition: 'all 1.5s cubic-bezier(0.25, 0.1, 0.25, 1)', zIndex: 9999, pointerEvents: 'none' as const, display: 'flex', flexDirection: 'column' as const, alignItems: 'center' }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: teal, fontFamily: fm, textShadow: '0 0 12px rgba(0,212,160,0.5)' }}>+1</span>
            <span style={{ fontSize: 9, color: '#6b7280', fontFamily: fm }}>Trader Profile</span>
          </div>
        ))}
      </>)}

      {/* ═══ HOME VIEW ═══ */}
      {view === 'home' && (<>
        <StockChartBackground />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <NavBar view="home" tabs={tabs} activeTab={activeTab} onTabClick={(t) => { setActiveTab(t); setView('app'); }} onLogoClick={() => {}} showClickHint={showClickHint} tabGlow={tabGlow} onLoginClick={() => setShowLogin(true)} />
        </div>

        {/* Hero */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Hero textVisible={textVisible} />
        </div>

        {/* BRING YOUR TRADES — split: API connect | OR | File upload */}
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28, padding: '40px 20px 40px', backgroundImage: 'linear-gradient(to bottom, transparent 0px, #0A0D14 60px)', marginTop: -60 }}>
          <div style={{ fontFamily: fd, fontSize: 18, letterSpacing: '0.2em', color: teal, textTransform: 'uppercase', fontWeight: 700, textShadow: '0 0 20px rgba(0,212,160,0.3)' }}>
            Bring Your Trades
          </div>

          <div style={{ display: 'flex', gap: 0, width: '100%', maxWidth: 900, alignItems: 'stretch' }}>

            {/* LEFT — Direct API connection */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 24px' }}>
              <div style={{ fontFamily: fd, fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Direct API Connection</div>
              <div style={{ fontFamily: fm, fontSize: 15, color: '#aab0bd', marginBottom: 24, textAlign: 'center' }}>Connect your brokerage account to automatically sync trades</div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, width: '100%', maxWidth: 360, marginBottom: 24 }}>
                {[
                  { name: 'THINKORSWIM', domain: 'thinkorswim.com' },
                  { name: 'INTERACTIVE BROKERS', domain: 'interactivebrokers.com' },
                  { name: 'TASTYTRADE', domain: 'tastytrade.com' },
                  { name: 'TRADESTATION', domain: 'tradestation.com' },
                  { name: 'E*TRADE', domain: 'etrade.com' },
                  { name: 'TRADIER', domain: 'tradier.com' },
                ].map(b => (
                  <div key={b.name} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    padding: '14px 14px', background: '#1f2430', border: '1px solid #2A3143',
                    borderRadius: 8, transition: 'border-color 0.2s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,212,160,0.5)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#2A3143'; }}
                  >
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${b.domain}&sz=64`}
                      alt="" width={28} height={28}
                      style={{ width: 28, height: 28, objectFit: 'contain', borderRadius: 4, background: '#fff', padding: 2, flexShrink: 0 }}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                    <span style={{ fontFamily: fm, fontSize: 13, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.05em', fontWeight: 600, textAlign: 'center' }}>{b.name}</span>
                  </div>
                ))}
              </div>

              <button style={{ background: teal, color: '#0A0D14', fontFamily: fd, fontSize: 15, fontWeight: 700, padding: '14px 36px', borderRadius: 10, border: 'none', cursor: 'pointer', boxShadow: '0 0 20px rgba(0,212,160,0.2)' }}>Connect Broker</button>
            </div>

            {/* CENTER — OR divider */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 20px', flexShrink: 0 }}>
              <div style={{ width: 1, flex: 1, background: 'linear-gradient(to bottom, transparent, #2A3143 30%, #2A3143 70%, transparent)' }} />
              <div style={{ fontFamily: fd, fontSize: 32, fontWeight: 700, color: teal, padding: '18px 0', letterSpacing: 3, textShadow: '0 0 18px rgba(0,212,160,0.6), 0 0 36px rgba(0,212,160,0.35)' }}>OR</div>
              <div style={{ width: 1, flex: 1, background: 'linear-gradient(to bottom, transparent, #2A3143 30%, #2A3143 70%, transparent)' }} />
            </div>

            {/* RIGHT — Upload trade history */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 24px' }}>
              <div style={{ fontFamily: fd, fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Upload Trade History</div>
              <div style={{ fontFamily: fm, fontSize: 15, color: '#aab0bd', marginBottom: 24, textAlign: 'center' }}>Export from any broker or platform and drop it here</div>

              {/* Upload zone */}
              <div style={{
                width: '100%', maxWidth: 340, border: '2px dashed #2A3143', borderRadius: 12,
                padding: '36px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 10, cursor: 'pointer', transition: 'border-color 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,212,160,0.5)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#2A3143'; }}
              >
                {/* Upload icon */}
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={teal} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <div style={{ fontFamily: fm, fontSize: 14, color: '#d0d0d8', textAlign: 'center' }}>Drag your trade history file here</div>
                <div style={{ fontFamily: fm, fontSize: 12, color: '#888' }}>or click to browse</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                  <span style={{ fontFamily: fm, fontSize: 11, color: teal, background: 'rgba(0,212,160,0.1)', padding: '3px 10px', borderRadius: 4, fontWeight: 600 }}>.csv</span>
                  <span style={{ fontFamily: fm, fontSize: 11, color: teal, background: 'rgba(0,212,160,0.1)', padding: '3px 10px', borderRadius: 4, fontWeight: 600 }}>.xlsx</span>
                </div>
              </div>

              <div style={{ fontFamily: fm, fontSize: 12, color: '#888', marginTop: 14, textAlign: 'center', maxWidth: 300, lineHeight: 1.5 }}>
                Webull, Robinhood, Fidelity, NinjaTrader, MetaTrader, and 20+ more
              </div>
            </div>
          </div>
        </div>

        {/* "See how this works" prompt — bridges the hero into the carousel */}
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '24px 20px 16px', background: 'transparent' }}>
          <div style={{ fontFamily: fd, fontSize: 18, fontWeight: 700, letterSpacing: '0.15em', color: '#00d4a0', textTransform: 'uppercase', textShadow: '0 0 20px rgba(0,212,160,0.4)' }}>
            See how this works
          </div>
          <svg width="22" height="28" viewBox="0 0 22 28" fill="none" style={{ animation: 'seeHowBounce 1.4s ease-in-out infinite' }}>
            <path d="M11 2 L11 22" stroke="#00d4a0" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M3 16 L11 25 L19 16" stroke="#00d4a0" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <style>{`@keyframes seeHowBounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(6px); } }`}</style>
        </div>

        <section style={{ position: 'relative', zIndex: 1, overflow: 'hidden', marginTop: 0, padding: '48px 20px 40px', background: 'transparent' }}>
          <div style={{ position: 'absolute', top: -200, right: -200, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,160,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -300, left: -200, width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,160,0.05) 0%, rgba(59,130,246,0.03) 50%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative' }}>
            <CarouselNav activeCategory={activeCategory} onCategoryClick={setActiveCategory} textVisible={textVisible} />

            {/* iMac monitor frame */}
            <div style={{ maxWidth: 1100, width: '90%', margin: '0 auto', position: 'relative' }}>
              {/* Top bezel + camera dot */}
              <div style={{ background: 'linear-gradient(to bottom, #4a5268, #363d4e)', borderRadius: '16px 16px 0 0', padding: '12px 0', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid #4a5268', borderBottom: 'none' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6b7280' }} />
              </div>
              {/* Screen area */}
              <div style={{ background: '#0A0D14', border: '1px solid #4a5268', borderTop: 'none', borderBottom: 'none', overflow: 'hidden' }}>
                <div className="carousel-card-scroll" onWheel={(e: React.WheelEvent) => e.stopPropagation()} style={{ background: 'transparent', overflowX: 'hidden', overflowY: 'auto', minHeight: 520, padding: 32 }}>
                  {activeCategory === 0 && <CarouselTradingGoals onAdvance={() => setActiveCategory(1)} frozen={!textVisible} />}
                  {activeCategory === 1 && <CarouselLogTrade onAdvance={() => setActiveCategory(2)} />}
                  {activeCategory === 2 && <CarouselPastTrades onAdvance={() => setActiveCategory(0)} />}
                  {activeCategory === 3 && <CarouselAnalysis />}
                  {activeCategory === 4 && <CarouselTraderProfile />}
                  {activeCategory === 5 && <MockPositionSizer />}
                  {activeCategory === 6 && <MockGrowthSimulator />}
                  {activeCategory === 7 && <MockTradeTimeline />}
                </div>
              </div>
              {/* Bottom chin with WickCoach logo */}
              <div style={{ background: 'linear-gradient(to bottom, #363d4e, #2c3240)', borderRadius: '0 0 16px 16px', padding: '14px 0', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid #4a5268', borderTop: 'none' }}>
                <Logo size={22} showText />
              </div>
              {/* Stand */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: 60, height: 40, background: 'linear-gradient(to bottom, #363d4e, #2c3240)', border: '1px solid #4a5268', borderTop: 'none' }} />
                <div style={{ width: 120, height: 8, background: '#4a5268', borderRadius: '0 0 4px 4px' }} />
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: 48 }}>
              <button onClick={() => setView('app')} style={{ background: teal, color: '#0e0f14', fontFamily: fd, fontSize: 20, fontWeight: 700, padding: '20px 80px', borderRadius: 14, border: 'none', cursor: 'pointer', letterSpacing: 1.5, boxShadow: '0 0 40px rgba(0,212,160,0.3)' }}>Sign Up</button>
              <p style={{ color: '#6b7280', fontFamily: fm, fontSize: 14, marginTop: 16 }}>One-time payment. No subscription. No data collection.</p>
            </div>
          </div>
        </section>

        {/* Privacy + Data Upload */}
        <section style={{ background: "transparent", position: 'relative', zIndex: 1 }}>
          <div style={{ padding: "100px 48px", maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
            <h2 style={{ fontSize: 34, fontWeight: 700, fontFamily: fd, lineHeight: 1.3, marginBottom: 20, color: "#e8e8f0" }}>We never see your data.<br />It&apos;s stored on your own computer.</h2>
            <p style={{ fontSize: 16, color: "#9a9da8", lineHeight: 1.7, fontFamily: fm, maxWidth: 520, margin: "0 auto 40px" }}>Upload your past trading data in any format &mdash; CSVs, broker statements, screenshots. The AI uses it to understand your trading history before you log a single trade.</p>
            <div style={{ display: "flex", gap: 20 }}>
              {privacyCards.map((c, i) => (
                <div key={i} style={{ flex: 1, background: "#141822", border: "1px solid #2A3143", borderRadius: 12, padding: "28px 24px", textAlign: "left" }}>
                  <div style={{ marginBottom: 16 }}>{c.icon}</div>
                  <div style={{ fontSize: 17, fontWeight: 600, color: "#d0d0d8", marginBottom: 10, fontFamily: fd }}>{c.title}</div>
                  <div style={{ fontSize: 15, color: "#9a9da8", lineHeight: 1.7, fontFamily: fm }}>{c.text}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section style={{ background: "transparent", padding: "100px 48px", position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <h2 style={{ fontSize: 36, fontWeight: 700, fontFamily: fd, marginBottom: 12, color: "#e8e8f0", textAlign: "center" }}>Choose your plan.</h2>
          <p style={{ fontSize: 15, color: "#6a6d78", fontFamily: fm, textAlign: "center", marginBottom: 50 }}>One-time payment with software updates included.</p>
          <div style={{ display: "flex", gap: 20, alignItems: "stretch" }}>
            <div className="price-card" style={{ flex: 1, background: "#141822", border: "1px solid #2A3143", borderRadius: 16, padding: 36, minHeight: 480, textAlign: "center", display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 14, color: "#9a9da8", fontFamily: fm, fontWeight: 600, marginBottom: 6 }}>ESSENTIAL</div>
              <div style={{ fontSize: 44, fontWeight: 800, color: "#e8e8f0", fontFamily: fd, marginBottom: 4 }}>$55</div>
              <div style={{ fontSize: 14, color: "#6a6d78", marginBottom: 24, fontFamily: fm }}>one-time</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 28, textAlign: "left" }}>
                {essentialFeatures.map(f => (<div key={f} style={{ fontSize: 14, color: "#b0b4c0", fontFamily: fm }}><span style={{ color: teal, marginRight: 10 }}>+</span>{f}</div>))}
              </div>
              <div style={{ fontSize: 12, color: "#5a5d68", fontFamily: fm, marginBottom: 16 }}>No AI coach included</div>
              <div style={{ marginTop: "auto", background: "rgba(0,212,160,0.1)", color: teal, padding: "13px 28px", borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: fm, border: "1px solid rgba(0,212,160,0.2)" }}>Get Essential</div>
            </div>
            <div className="price-card" style={{ flex: 1, background: "#141822", border: "2px solid rgba(0,212,160,0.3)", borderRadius: 16, padding: 36, minHeight: 480, textAlign: "center", position: "relative", display: "flex", flexDirection: "column" }}>
              <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: teal, color: "#0A0D14", fontSize: 11, fontWeight: 700, padding: "4px 16px", borderRadius: 20, fontFamily: fm }}>RECOMMENDED</div>
              <div style={{ fontSize: 14, color: teal, fontFamily: fm, fontWeight: 600, marginBottom: 6 }}>COMPLETE</div>
              <div style={{ fontSize: 44, fontWeight: 800, color: "#e8e8f0", fontFamily: fd, marginBottom: 4 }}>$99</div>
              <div style={{ fontSize: 14, color: "#6a6d78", marginBottom: 24, fontFamily: fm }}>one-time</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 28, textAlign: "left" }}>
                {completeFeatures.map(f => (<div key={f} style={{ fontSize: 14, color: "#b0b4c0", fontFamily: fm }}><span style={{ color: teal, marginRight: 10 }}>+</span>{f}</div>))}
              </div>
              <div style={{ marginTop: "auto", background: teal, color: "#0a0a0f", padding: "13px 28px", borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: fm, boxShadow: "0 0 20px rgba(0,212,160,0.25)" }}>Get Complete</div>
            </div>
            <div className="price-card" style={{ flex: 1, background: "#141822", border: "1px solid #2A3143", borderRadius: 16, padding: 36, minHeight: 480, textAlign: "center", position: "relative", display: "flex", flexDirection: "column" }}>
              <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "#ffffff", color: "#0A0D14", fontSize: 11, fontWeight: 700, padding: "4px 16px", borderRadius: 20, fontFamily: fm, letterSpacing: 1 }}>POWER USER</div>
              <div style={{ fontSize: 14, color: "#ffffff", fontFamily: fm, fontWeight: 600, marginBottom: 6 }}>PRO</div>
              <div style={{ fontSize: 44, fontWeight: 800, color: "#e8e8f0", fontFamily: fd, marginBottom: 4 }}>$149</div>
              <div style={{ fontSize: 14, color: "#6a6d78", marginBottom: 24, fontFamily: fm }}>one-time</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 28, textAlign: "left" }}>
                {proFeatures.map(f => (<div key={f} style={{ fontSize: 14, color: "#b0b4c0", fontFamily: fm }}><span style={{ color: "#ffffff", marginRight: 10 }}>+</span>{f}</div>))}
              </div>
              <div style={{ marginTop: "auto", background: "#ffffff", color: "#0a0a0f", padding: "13px 28px", borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: fm, boxShadow: "0 0 20px rgba(255,255,255,0.15)" }}>Get Pro</div>
            </div>
          </div>
          </div>
        </section>

        {/* FAQ */}
        <section style={{ background: "transparent", padding: "100px 48px", position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: 640, margin: "0 auto" }}>
            <h2 style={{ fontSize: 30, fontWeight: 700, fontFamily: fd, marginBottom: 40, color: "#e8e8f0" }}>Frequently Asked Questions</h2>
            {faqs.map((f, i) => (<FAQ key={i} q={f.q} a={f.a} open={openFAQ === i} onClick={() => setOpenFAQ(openFAQ === i ? null : i)} />))}
          </div>
        </section>

        {/* Footer — gradient-bridged into the body so there's no visible seam */}
        <footer style={{ backgroundImage: "linear-gradient(to bottom, rgba(10,13,20,0) 0px, #0a0b10 120px, #0a0b10 100%)", padding: "120px 48px 30px", position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: 1000, margin: "0 auto", display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr", gap: 40 }}>
            <div>
              <Logo size={22} showText />
              <div style={{ fontSize: 14, color: "#6a6d78", lineHeight: 1.65, marginTop: 14, fontFamily: fm }}>The first AI trading journal that coaches your psychology.</div>
            </div>
            {[{ t: "Product", l: ["Features", "Pricing", "Demo"] }, { t: "Support", l: ["FAQ", "Contact", "Privacy", "Terms"] }].map(c => (
              <div key={c.t}>
                <div style={{ fontSize: 12, color: "#9a9da8", letterSpacing: "0.08em", marginBottom: 16, fontWeight: 500, fontFamily: fm }}>{c.t}</div>
                {c.l.map(l => <div key={l} style={{ fontSize: 14, color: "#6a6d78", marginBottom: 10, cursor: "pointer", fontFamily: fm }}>{l}</div>)}
              </div>
            ))}
            <div>
              <div style={{ fontSize: 12, color: "#9a9da8", letterSpacing: "0.08em", marginBottom: 16, fontWeight: 500, fontFamily: fm }}>Connect</div>
              {["Twitter / X", "Discord", "Email"].map(l => <div key={l} style={{ fontSize: 14, color: "#6a6d78", marginBottom: 10, cursor: "pointer", fontFamily: fm }}>{l}</div>)}
              <div style={{ fontSize: 15, color: teal, marginTop: 20, fontWeight: 600, fontFamily: fm }}>From $55 one-time</div>
            </div>
          </div>
          <div style={{ maxWidth: 1000, margin: "40px auto 0", paddingTop: 20, textAlign: "center", backgroundImage: "linear-gradient(to right, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)", backgroundSize: "100% 1px", backgroundRepeat: "no-repeat", backgroundPosition: "top center" }}>
            <div style={{ fontSize: 11, color: "#3a3d48", fontFamily: fm }}>&copy; 2026 WickCoach. All rights reserved.</div>
          </div>
        </footer>
      </>)}

      {/* ═══ LOGIN MODAL ═══ */}
      {showLogin && (
        <>
          <div onClick={() => setShowLogin(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 60 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 61, background: '#141822', border: '1px solid #2A3143', borderRadius: 16, padding: '40px 36px', width: 380, maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            <div style={{ fontFamily: fd, fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 6, textAlign: 'center' }}>Welcome to WickCoach</div>
            <div style={{ fontFamily: fm, fontSize: 13, color: '#aab0bd', marginBottom: 24, textAlign: 'center' }}>Enter your details to get started</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontFamily: fm, fontSize: 12, color: '#888', letterSpacing: 1, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Name</label>
                <input value={loginName} onChange={e => setLoginName(e.target.value)} placeholder="Your name" style={{ width: '100%', background: '#0f1318', border: '1px solid #2A3143', borderRadius: 8, padding: '12px 14px', color: '#fff', fontFamily: fm, fontSize: 15, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontFamily: fm, fontSize: 12, color: '#888', letterSpacing: 1, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Email</label>
                <input value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="you@email.com" type="email" style={{ width: '100%', background: '#0f1318', border: '1px solid #2A3143', borderRadius: 8, padding: '12px 14px', color: '#fff', fontFamily: fm, fontSize: 15, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <button onClick={() => { setShowLogin(false); setView('app'); }} style={{ marginTop: 8, width: '100%', background: teal, color: '#0A0D14', fontFamily: fd, fontSize: 16, fontWeight: 700, padding: '14px 0', borderRadius: 10, border: 'none', cursor: 'pointer', boxShadow: '0 0 20px rgba(0,212,160,0.2)' }}>Continue</button>
            </div>
            <span onClick={() => setShowLogin(false)} style={{ position: 'absolute', top: 14, right: 18, color: '#555', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>×</span>
          </div>
        </>
      )}
    </div>
  );
}

