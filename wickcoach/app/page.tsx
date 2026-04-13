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

  const tabs = ["Log a Trade", "Past Trades", "Trading Goals", "Analysis", "Trader Profile"];

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
        <NavBar view="app" tabs={tabs} activeTab={activeTab} onTabClick={setActiveTab} onLogoClick={() => setView('home')} profileTabGlow={profileTabGlow} traderProfileTabRef={traderProfileTabRef} />
        <div style={{ background: '#1a1c23', minHeight: 'calc(100vh - 140px)' }}>
          {activeTab === 'Log a Trade' && (
            <div style={{ maxWidth: 580, margin: '0 auto', padding: '40px 20px' }}>
              <LogATradeContent setActiveTab={setActiveTab} trades={trades} setTrades={setTrades} />
            </div>
          )}
          {activeTab === 'Past Trades' && <PastTradesContent trades={trades} setActiveTab={setActiveTab} />}
          {activeTab === 'Trading Goals' && <TradingGoalsContent trades={trades} onMessageSent={triggerFloatingPlusOne} />}
          {activeTab === 'Analysis' && <AnalysisContent />}
          {activeTab !== '' && activeTab !== 'Log a Trade' && activeTab !== 'Past Trades' && activeTab !== 'Trading Goals' && activeTab !== 'Analysis' && (
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
        <NavBar view="home" tabs={tabs} activeTab={activeTab} onTabClick={(t) => { setActiveTab(t); setView('app'); }} onLogoClick={() => {}} showClickHint={showClickHint} tabGlow={tabGlow} />

        <section style={{ position: 'relative', overflow: 'hidden', minHeight: '100vh', padding: '32px 20px 40px', background: 'transparent' }}>
          <div style={{ position: 'absolute', top: -200, right: -200, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,160,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -300, left: -200, width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,160,0.05) 0%, rgba(59,130,246,0.03) 50%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative' }}>
            <Hero textVisible={textVisible} />
            <CarouselNav activeCategory={activeCategory} onCategoryClick={setActiveCategory} textVisible={textVisible} />

            {/* iMac frame */}
            <div style={{ maxWidth: 1060, margin: '0 auto', padding: '0 20px' }}>
              <div style={{ background: 'linear-gradient(180deg, #38393f 0%, #2c2d33 4%, #232428 100%)', borderRadius: '18px 18px 2px 2px', padding: '10px 10px 28px 10px', position: 'relative', boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 20px 60px rgba(0,0,0,0.5), 0 0 100px rgba(0,0,0,0.3), inset 0 0 10px rgba(0,0,0,0.5)' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#0e0f14', border: '1px solid #3a3b45', margin: '2px auto 6px' }} />
                <div style={{ background: '#000000', borderRadius: 6, padding: 5, position: 'relative', border: '1px solid #3a3b45' }}>
                  <div className="carousel-card-scroll" onWheel={(e: React.WheelEvent) => e.stopPropagation()} style={{ background: '#0e0f14', borderRadius: 4, overflowX: 'hidden', overflowY: 'auto', height: 520, padding: 32 }}>
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
                <div style={{ height: 6 }} />
              </div>
              <div style={{ width: 100, height: 50, margin: '0 auto', background: 'linear-gradient(180deg, #222328 0%, #1a1b20 40%, #28292f 100%)', clipPath: 'polygon(15% 0%, 85% 0%, 100% 100%, 0% 100%)', position: 'relative' }}>
                <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 1, background: 'rgba(255,255,255,0.06)' }} />
              </div>
              <div style={{ width: 180, height: 10, margin: '0 auto', background: 'linear-gradient(180deg, #28292f 0%, #1c1d22 100%)', borderRadius: '0 0 50% 50% / 0 0 100% 100%', boxShadow: '0 2px 10px rgba(0,0,0,0.4)', position: 'relative' }}>
                <div style={{ position: 'absolute', left: '10%', right: '10%', top: 0, height: 1, background: 'rgba(255,255,255,0.08)' }} />
              </div>
              <div style={{ width: '50%', height: 20, margin: '4px auto 0', background: 'radial-gradient(ellipse, rgba(0,0,0,0.3) 0%, transparent 70%)', pointerEvents: 'none' }} />
              <div style={{ width: '40%', height: 30, margin: '-15px auto 0', background: 'radial-gradient(ellipse, rgba(0,212,160,0.04) 0%, transparent 70%)', filter: 'blur(8px)', pointerEvents: 'none' }} />
            </div>

            <div style={{ textAlign: 'center', marginTop: 48 }}>
              <button onClick={() => setView('app')} style={{ background: teal, color: '#0e0f14', fontFamily: fd, fontSize: 18, fontWeight: 700, padding: '16px 48px', borderRadius: 12, border: 'none', cursor: 'pointer', letterSpacing: 1, boxShadow: '0 0 30px rgba(0,212,160,0.2)' }}>Log Goals &rarr;</button>
              <p onMouseEnter={(e) => { (e.target as HTMLElement).style.color = '#00d4a0'; }} onMouseLeave={(e) => { (e.target as HTMLElement).style.color = '#6b7280'; }} style={{ color: '#6b7280', fontFamily: fm, fontSize: 12, marginTop: 8, cursor: 'pointer', textAlign: 'center' }}>or sign up to get started</p>
              <p style={{ color: '#6b7280', fontFamily: fm, fontSize: 14, marginTop: 12 }}>One-time payment. No subscription. No data collection.</p>
            </div>
          </div>
        </section>

        {/* Privacy + Data Upload */}
        <section style={{ padding: "100px 48px", maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: 34, fontWeight: 700, fontFamily: fd, lineHeight: 1.3, marginBottom: 20, color: "#e8e8f0" }}>We never see your data.<br />It&apos;s stored on your own computer.</h2>
          <p style={{ fontSize: 16, color: "#9a9da8", lineHeight: 1.7, fontFamily: fm, maxWidth: 520, margin: "0 auto 40px" }}>Upload your past trading data in any format &mdash; CSVs, broker statements, screenshots. The AI uses it to understand your trading history before you log a single trade.</p>
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

        {/* Pricing */}
        <section style={{ padding: "100px 48px", maxWidth: 750, margin: "0 auto" }}>
          <h2 style={{ fontSize: 36, fontWeight: 700, fontFamily: fd, marginBottom: 12, color: "#e8e8f0", textAlign: "center" }}>Choose your plan.</h2>
          <p style={{ fontSize: 15, color: "#6a6d78", fontFamily: fm, textAlign: "center", marginBottom: 50 }}>One-time payment with software updates included.</p>
          <div style={{ display: "flex", gap: 20 }}>
            <div className="price-card" style={{ flex: 1, background: "#13141a", border: "1px solid #1e1e28", borderRadius: 14, padding: 32, textAlign: "center" }}>
              <div style={{ fontSize: 14, color: "#9a9da8", fontFamily: fm, fontWeight: 600, marginBottom: 6 }}>ESSENTIAL</div>
              <div style={{ fontSize: 44, fontWeight: 800, color: "#e8e8f0", fontFamily: fd, marginBottom: 4 }}>$55</div>
              <div style={{ fontSize: 14, color: "#6a6d78", marginBottom: 24, fontFamily: fm }}>one-time</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 28, textAlign: "left" }}>
                {essentialFeatures.map(f => (<div key={f} style={{ fontSize: 14, color: "#b0b4c0", fontFamily: fm }}><span style={{ color: teal, marginRight: 10 }}>+</span>{f}</div>))}
              </div>
              <div style={{ fontSize: 12, color: "#5a5d68", fontFamily: fm, marginBottom: 16 }}>No AI coach included</div>
              <div style={{ background: "rgba(0,212,160,0.1)", color: teal, padding: "13px 28px", borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: fm, border: "1px solid rgba(0,212,160,0.2)" }}>Get Essential</div>
            </div>
            <div className="price-card" style={{ flex: 1, background: "#13141a", border: "2px solid rgba(0,212,160,0.3)", borderRadius: 14, padding: 32, textAlign: "center", position: "relative" }}>
              <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: teal, color: "#0a0a0f", fontSize: 11, fontWeight: 700, padding: "4px 16px", borderRadius: 20, fontFamily: fm }}>RECOMMENDED</div>
              <div style={{ fontSize: 14, color: teal, fontFamily: fm, fontWeight: 600, marginBottom: 6 }}>COMPLETE</div>
              <div style={{ fontSize: 44, fontWeight: 800, color: "#e8e8f0", fontFamily: fd, marginBottom: 4 }}>$99</div>
              <div style={{ fontSize: 14, color: "#6a6d78", marginBottom: 24, fontFamily: fm }}>one-time</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 28, textAlign: "left" }}>
                {completeFeatures.map(f => (<div key={f} style={{ fontSize: 14, color: "#b0b4c0", fontFamily: fm }}><span style={{ color: teal, marginRight: 10 }}>+</span>{f}</div>))}
              </div>
              <div style={{ background: teal, color: "#0a0a0f", padding: "13px 28px", borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: fm, boxShadow: "0 0 20px rgba(0,212,160,0.25)" }}>Get Complete</div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section style={{ padding: "100px 48px", maxWidth: 640, margin: "0 auto" }}>
          <h2 style={{ fontSize: 30, fontWeight: 700, fontFamily: fd, marginBottom: 40, color: "#e8e8f0" }}>Frequently Asked Questions</h2>
          {faqs.map((f, i) => (<FAQ key={i} q={f.q} a={f.a} open={openFAQ === i} onClick={() => setOpenFAQ(openFAQ === i ? null : i)} />))}
        </section>

        {/* Footer */}
        <footer style={{ background: "#0a0b10", borderTop: "1px solid #1a1b22", padding: "60px 48px 30px" }}>
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
          <div style={{ maxWidth: 1000, margin: "40px auto 0", borderTop: "1px solid #1a1b22", paddingTop: 20, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#3a3d48", fontFamily: fm }}>&copy; 2026 WickCoach. All rights reserved.</div>
          </div>
        </footer>
      </>)}
    </div>
  );
}
