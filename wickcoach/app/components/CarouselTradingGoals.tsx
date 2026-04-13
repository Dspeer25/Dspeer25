'use client';
import React, { useState } from "react";
import { fm, fd, teal } from "./shared";
import Logo from "./Logo";

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
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00d4a0' }} />
            <span style={{ fontFamily: fm, fontSize: 11, color: '#00d4a0' }}>3 Active Rules</span>
          </div>
        </div>
        <div style={{ fontFamily: fm, color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 18 }}>Active behavioral and technical parameters for the current week.</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {goalTexts.map((text, gi) => (
            <div key={gi} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px solid #00d4a0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontFamily: fd, fontSize: 14, color: '#00d4a0' }}>{gi + 1}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: fm, fontSize: 13, fontWeight: 700, color: '#fff', textTransform: 'uppercase' as const, letterSpacing: '0.02em', marginBottom: 6 }}>{text}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ background: '#00d4a0', color: '#000', fontFamily: fm, fontSize: 9, fontWeight: 700, padding: '2px 6px', textTransform: 'uppercase' as const }}>TYPE</span>
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
          <span style={{ fontFamily: fd, fontSize: 14, fontWeight: 700, color: '#00d4a0' }}>WickCoach AI</span>
        </div>
        <div style={{ background: 'rgba(0,255,136,0.04)', border: '1px solid rgba(0,212,160,0.15)', borderRadius: 0, padding: 20, marginTop: 12, minHeight: 140 }}>
          <div style={{ fontFamily: fm, color: 'rgba(255,255,255,0.7)', fontSize: 12, lineHeight: 1.7 }}>
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
        {/* Pagination dots */}
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 12 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00d4a0' }} />
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
        </div>
        <div style={{ opacity: showFollowUp ? 1 : 0, transition: 'opacity 0.6s ease', pointerEvents: showFollowUp ? 'auto' : 'none' }}>
          <div style={{ background: 'rgba(0,255,136,0.04)', border: '1px solid rgba(0,212,160,0.15)', padding: 14, marginTop: 10 }}>
            <div style={{ fontFamily: fm, fontSize: 10, fontWeight: 700, color: '#00d4a0', letterSpacing: 1, marginBottom: 8 }}>FOLLOW-UP</div>
            <div style={{ fontFamily: fm, color: 'rgba(255,255,255,0.7)', fontSize: 11, lineHeight: 1.6 }}>{goalSet.followUp}</div>
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') setAnswer(''); }}
              placeholder="Type your answer..."
              style={{ background: '#13141a', border: '1px solid rgba(255,255,255,0.08)', padding: '8px 10px', color: '#ffffff', fontSize: 11, fontFamily: fm, width: '100%', outline: 'none', marginTop: 10, boxSizing: 'border-box' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#00d4a0'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CarouselTradingGoals({ onAdvance, frozen = true }: { onAdvance?: () => void; frozen?: boolean }) {
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
      .carousel-card-scroll::-webkit-scrollbar { display: block !important; width: 4px; }
      .carousel-card-scroll::-webkit-scrollbar-track { background: transparent; }
      .carousel-card-scroll::-webkit-scrollbar-thumb { background: rgba(0,212,160,0.25); border-radius: 2px; }
      .carousel-card-scroll { scrollbar-width: thin !important; scrollbar-color: rgba(0,212,160,0.25) transparent; }
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
