'use client';
import React from 'react';
import { fm, fd } from './shared';

const teal = '#00d4a0';
const red = '#ff4444';

interface HeroProps {
  textVisible: boolean;
}

// Candle definitions in left-to-right order per spec pattern:
// bull(35), bear(30), bull(55), bear(25), bull(45), bull(60), bear(38), bull(40), bear(28), bull(50)
const candles: { type: 'bull' | 'bear'; h: number }[] = [
  { type: 'bull', h: 35 },
  { type: 'bear', h: 30 },
  { type: 'bull', h: 55 },
  { type: 'bear', h: 25 },
  { type: 'bull', h: 45 },
  { type: 'bull', h: 60 },
  { type: 'bear', h: 38 },
  { type: 'bull', h: 40 },
  { type: 'bear', h: 28 },
  { type: 'bull', h: 50 },
];

interface Annotation {
  title: string;
  body: string;
  color: string;
  style: React.CSSProperties;
}

const annotations: Annotation[] = [
  {
    title: 'Impulse Drawdown',
    body: 'Revenge trading anomaly detected. 68% probability of forced closures within 15 mins.',
    color: '#ffffff',
    style: { top: '15%', right: '55%' },
  },
  {
    title: 'Momentum Ignition',
    body: 'Avg +1.4R expectancy gap when waiting 3+ minutes after opening range.',
    color: teal,
    style: { top: '45%', right: '5%' },
  },
  {
    title: 'Pattern Extraction',
    body: 'Micro-fractals isolated perfectly from noise.',
    color: '#ffffff',
    style: { bottom: '25%', left: '55%' },
  },
  {
    title: 'Behavioral Drift',
    body: 'Rule adherence drops 34% after consecutive wins.',
    color: red,
    style: { top: '15%', right: '5%' },
  },
];

// Reusable corner-bracket renderer (4 tiny L-shapes at each corner)
const CornerBrackets = ({ color = 'rgba(255,255,255,0.5)', size = 6 }: { color?: string; size?: number }) => (
  <>
    <span style={{ position: 'absolute', top: 0, left: 0, width: size, height: size, borderTop: `1px solid ${color}`, borderLeft: `1px solid ${color}`, pointerEvents: 'none' }} />
    <span style={{ position: 'absolute', top: 0, right: 0, width: size, height: size, borderTop: `1px solid ${color}`, borderRight: `1px solid ${color}`, pointerEvents: 'none' }} />
    <span style={{ position: 'absolute', bottom: 0, left: 0, width: size, height: size, borderBottom: `1px solid ${color}`, borderLeft: `1px solid ${color}`, pointerEvents: 'none' }} />
    <span style={{ position: 'absolute', bottom: 0, right: 0, width: size, height: size, borderBottom: `1px solid ${color}`, borderRight: `1px solid ${color}`, pointerEvents: 'none' }} />
  </>
);

export default function Hero({ textVisible }: HeroProps) {
  const opacity = textVisible ? 1 : 0;

  return (
    <>
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          @keyframes heroPulseGlow {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
        }
      `}</style>

      <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden', background: '#030305' }}>

        {/* ═══ BACKGROUND LAYER — just the candles ═══ */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>

          {/* Monolithic candlestick cluster — pushed right */}
          <div
            style={{
              position: 'absolute',
              bottom: '15vh',
              left: 0,
              width: '100%',
              display: 'flex',
              justifyContent: 'flex-end',
              paddingRight: '10%',
              alignItems: 'flex-end',
              gap: '2vw',
              zIndex: 2,
              pointerEvents: 'none',
              boxSizing: 'border-box',
            }}
          >
            {candles.map((c, i) => {
              const isBull = c.type === 'bull';
              const color = isBull ? teal : red;
              const rgbaMid = isBull ? 'rgba(0,212,160,0.4)' : 'rgba(255,68,68,0.4)';
              const rgbaLight = isBull ? 'rgba(0,212,160,0.05)' : 'rgba(255,68,68,0.05)';
              const rgbaHeavy = isBull ? 'rgba(0,212,160,0.25)' : 'rgba(255,68,68,0.25)';
              const rgbaGlow = isBull ? 'rgba(0,212,160,0.35)' : 'rgba(255,68,68,0.35)';
              const rgbaInset = isBull ? 'rgba(0,212,160,0.2)' : 'rgba(255,68,68,0.2)';
              return (
                <div
                  key={i}
                  style={{
                    position: 'relative',
                    width: '4vw',
                    maxWidth: 60,
                    minWidth: 20,
                    height: `${c.h}vh`,
                    borderTop: `3px solid ${color}`,
                    borderLeft: `1px solid ${rgbaMid}`,
                    borderRight: `1px solid ${rgbaMid}`,
                    borderBottom: 'none',
                    background: `linear-gradient(to top, ${rgbaLight} 0%, ${rgbaHeavy} 100%)`,
                    boxShadow: `0 -15px 40px ${rgbaGlow}, inset 0 10px 30px ${rgbaInset}`,
                  }}
                >
                  {/* Wick */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '-50%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 2,
                      height: '150%',
                      background: 'linear-gradient(to top, rgba(255,255,255,0.6), transparent)',
                      zIndex: -1,
                    }}
                  />
                </div>
              );
            })}
          </div>

        </div>

        {/* ═══ ANNOTATION LABELS ═══ */}
        {annotations.map((a, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              zIndex: 20,
              maxWidth: 220,
              opacity: textVisible ? 0.85 : 0,
              transition: 'opacity 0.9s ease',
              transitionDelay: `${0.4 + i * 0.15}s`,
              ...a.style,
            }}
          >
            <div style={{ width: 30, height: 1, background: 'rgba(255,255,255,0.2)', marginBottom: 6 }} />
            <div style={{ fontFamily: fm, fontSize: 11, color: a.color, textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 600, marginBottom: 6 }}>
              {a.title}
            </div>
            <div style={{ fontFamily: fm, fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>
              {a.body}
            </div>
          </div>
        ))}

        {/* ═══ HERO CONTENT ═══ */}
        <div
          style={{
            position: 'relative',
            zIndex: 20,
            maxWidth: 800,
            padding: '0 8%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            minHeight: 'calc(100vh - 80px)',
            opacity,
            transition: 'opacity 1s ease',
          }}
        >
          {/* Eyebrow */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32, opacity: 0.8 }}>
            <span style={{ width: 48, height: 1, background: teal }} />
            <span style={{ fontFamily: fm, fontSize: 11, color: teal, textTransform: 'uppercase', letterSpacing: '0.3em', fontWeight: 600 }}>
              Engineered for Mastery
            </span>
          </div>

          {/* Headline */}
          <h1
            style={{
              fontFamily: fd,
              fontSize: 'clamp(52px, 6vw, 76px)',
              fontWeight: 600,
              color: '#ffffff',
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              marginBottom: 32,
              maxWidth: 700,
            }}
          >
            The Trading Journal That
            <br />
            <span style={{ color: teal }}>
              Fixes Your Psychology.
            </span>
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontFamily: fm,
              fontSize: 'clamp(15px, 1.2vw, 20px)',
              color: 'rgba(200,200,200,0.8)',
              maxWidth: 540,
              lineHeight: 1.7,
              marginBottom: 48,
            }}
          >
            AI-enhanced behavioral and trading pattern recognition. We analyze the data hidden in your drawdowns to reconstruct your discipline.
          </p>

          {/* CTA buttons */}
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <button
              style={{
                background: '#ffffff',
                color: '#000000',
                fontFamily: fm,
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                fontWeight: 600,
                padding: '16px 32px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = teal; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#ffffff'; }}
            >
              Start Journaling
            </button>

            <button
              style={{
                position: 'relative',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#ffffff',
                fontFamily: fm,
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                fontWeight: 600,
                padding: '16px 32px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                transition: 'background 0.3s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <CornerBrackets />
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="6,4 20,12 6,20" /></svg>
              Watch Demo
            </button>
          </div>
        </div>

        {/* ═══ BOTTOM BAR ═══ */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            padding: 32,
            zIndex: 30,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: 24,
            flexWrap: 'wrap',
            boxSizing: 'border-box',
            opacity,
            transition: 'opacity 1s ease 0.3s',
          }}
        >
          {/* Left — integrations */}
          <div>
            <div style={{ fontFamily: fm, fontSize: 11, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.2em', marginBottom: 12 }}>
              Integrated with leading APIs
            </div>
            <div style={{ display: 'flex', gap: 24, fontFamily: fm, fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em' }}>
              <span>BINANCE</span>
              <span>NINJATRADER</span>
              <span>TRADINGVIEW</span>
            </div>
          </div>

          {/* Right — stat cards */}
          <div
            style={{
              position: 'relative',
              background: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.1)',
              padding: 20,
              display: 'flex',
              gap: 32,
              alignItems: 'center',
            }}
          >
            <CornerBrackets />

            <div>
              <div style={{ fontFamily: fd, fontSize: 24, color: '#ffffff', fontWeight: 700, lineHeight: 1 }}>+42%</div>
              <div style={{ fontFamily: fm, fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 6 }}>
                Avg. Expectancy Increase
              </div>
            </div>

            <div style={{ width: 1, alignSelf: 'stretch', background: 'rgba(255,255,255,0.1)' }} />

            <div>
              <div style={{ fontFamily: fd, fontSize: 24, color: '#ffffff', fontWeight: 700, lineHeight: 1 }}>1.2M+</div>
              <div style={{ fontFamily: fm, fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 6 }}>
                Executions Analyzed
              </div>
            </div>

            <div style={{ width: 1, alignSelf: 'stretch', background: 'rgba(255,255,255,0.1)' }} />

            <div>
              <div style={{ fontFamily: fd, fontSize: 24, color: '#ffffff', fontWeight: 700, lineHeight: 1 }}>-68%</div>
              <div style={{ fontFamily: fm, fontSize: 11, color: red, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 6 }}>
                Reduction in Revenge Trades
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
