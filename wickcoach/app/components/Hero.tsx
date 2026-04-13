'use client';
import React, { useState } from 'react';
import { fm, fd, teal } from './shared';

interface HeroProps {
  textVisible: boolean;
}

export default function Hero({ textVisible }: HeroProps) {
  const [showBrokers, setShowBrokers] = useState(false);

  const candles = [
    { type: 'bull', height: '35vh' },
    { type: 'bear', height: '22vh' },
    { type: 'bull', height: '50vh' },
    { type: 'bull', height: '42vh' },
    { type: 'bear', height: '18vh' },
    { type: 'bull', height: '58vh' },
    { type: 'bull', height: '48vh' },
    { type: 'bear', height: '28vh' },
    { type: 'bull', height: '52vh' },
    { type: 'bear', height: '20vh' },
    { type: 'bull', height: '45vh' },
    { type: 'bull', height: '55vh' },
    { type: 'bear', height: '25vh' },
    { type: 'bull', height: '40vh' },
  ];

  const annotations = [
    { title: 'IMPULSE DRAWDOWN', body: 'Revenge trading anomaly detected. 68% probability of forced closures within 15 mins of this wick.', top: '18%', left: '55%', color: teal },
    { title: 'PATTERN EXTRACTION', body: 'Micro-fractals isolated perfectly from market noise.', top: '40%', right: '8%', color: '#fff' },
    { title: 'MOMENTUM IGNITION', body: 'Avg +1.4R expectancy gap when waiting 3+ minutes after opening range.', top: '55%', right: '5%', color: teal },
  ];

  return (
    <>
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          @keyframes candleBreathe {
            0%, 100% { transform: scaleY(1); }
            50% { transform: scaleY(1.025); }
          }
          @keyframes candleBreatheAlt {
            0%, 100% { transform: scaleY(1.02); }
            50% { transform: scaleY(0.975); }
          }
          @keyframes pulseGlow {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
        }
        .nav-glass {
          background: rgba(3, 3, 5, 0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
      `}</style>

      <div style={{
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        background: 'linear-gradient(to bottom, #1a1c23 0%, #0d0e12 10%, #030305 35%)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>

        {/* Ethereal Glow */}
        <div style={{
          position: 'absolute',
          top: '45%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90vw',
          height: '70vw',
          background: 'radial-gradient(ellipse at center, rgba(0,212,160,0.2) 0%, rgba(255,68,68,0.08) 40%, transparent 75%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
          zIndex: 0,
          animation: 'pulseGlow 8s infinite alternate ease-in-out',
        }} />

        {/* Perspective Grid Floor */}
        <div style={{
          position: 'absolute',
          bottom: '-20vh',
          left: '-50vw',
          width: '200vw',
          height: '80vh',
          backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to top, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          transform: 'rotateX(75deg)',
          transformOrigin: 'center top',
          WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 90%)',
          maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 90%)',
          pointerEvents: 'none',
          zIndex: 0,
        }} />

        {/* Candle Cluster */}
        <div style={{
          position: 'absolute',
          bottom: '12vh',
          left: 0,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-end',
          gap: '1.8vw',
          zIndex: 2,
          pointerEvents: 'none',
          maxWidth: '1200px',
          margin: '0 auto',
          right: 0,
          paddingLeft: '30%',
        }}>
          {candles.map((c, i) => (
            <div key={i} style={{
              position: 'relative',
              width: '3.5vw',
              maxWidth: '50px',
              minWidth: '18px',
              height: c.height,
              borderTop: `3px solid ${c.type === 'bull' ? teal : '#ff4444'}`,
              borderLeft: `1px solid ${c.type === 'bull' ? 'rgba(0,212,160,0.4)' : 'rgba(255,68,68,0.4)'}`,
              borderRight: `1px solid ${c.type === 'bull' ? 'rgba(0,212,160,0.4)' : 'rgba(255,68,68,0.4)'}`,
              background: c.type === 'bull'
                ? 'linear-gradient(to top, rgba(0,212,160,0.05) 0%, rgba(0,212,160,0.25) 100%)'
                : 'linear-gradient(to top, rgba(255,68,68,0.05) 0%, rgba(255,68,68,0.25) 100%)',
              boxShadow: c.type === 'bull'
                ? '0 -15px 40px rgba(0,212,160,0.3), inset 0 10px 30px rgba(0,212,160,0.15)'
                : '0 -15px 40px rgba(255,68,68,0.3), inset 0 10px 30px rgba(255,68,68,0.15)',
              animation: i % 2 === 0
                ? `candleBreathe ${4 + (i * 0.3)}s ease-in-out infinite`
                : `candleBreatheAlt ${4.5 + (i * 0.25)}s ease-in-out infinite`,
              animationDelay: `${i * 0.2}s`,
              transformOrigin: 'center bottom',
            }}>
              {/* Wick */}
              <div style={{
                position: 'absolute',
                top: '-45%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '2px',
                height: '140%',
                background: `linear-gradient(to top, ${c.type === 'bull' ? 'rgba(0,212,160,0.5)' : 'rgba(255,68,68,0.5)'}, transparent)`,
                zIndex: -1,
              }} />
            </div>
          ))}

          {/* Moving Average Line */}
          <svg style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 3 }} viewBox="0 0 1000 500" preserveAspectRatio="none">
            <path d="M 0 400 C 80 390, 150 370, 220 340 C 290 310, 350 270, 420 240 C 490 215, 550 195, 620 185 C 690 180, 740 200, 800 220 C 850 235, 900 210, 950 190 C 980 180, 1000 170, 1000 165" fill="none" stroke="rgba(0,212,160,0.35)" strokeWidth="2" strokeLinecap="round" />
            <path d="M 0 420 C 120 415, 250 405, 380 385 C 480 370, 580 345, 680 325 C 780 310, 880 295, 1000 280" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>

        {/* Vignette */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% 50%, transparent 40%, rgba(3,3,5,0.6) 100%)',
          zIndex: 5,
          pointerEvents: 'none',
        }} />

        {/* Annotation Labels */}
        {annotations.map((a, i) => (
          <div key={i} style={{
            position: 'absolute',
            top: a.top,
            left: a.left,
            right: a.right,
            maxWidth: '180px',
            zIndex: 20,
            pointerEvents: 'none',
          }}>
            <div style={{ width: '20px', height: '1px', background: 'rgba(255,255,255,0.2)', marginBottom: '8px' }} />
            <div style={{ fontFamily: fd, fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: a.color, marginBottom: '6px', fontWeight: 500 }}>{a.title}</div>
            <p style={{ fontFamily: fd, fontSize: '10px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.6, margin: 0 }}>{a.body}</p>
          </div>
        ))}

        {/* Silhouette Figure */}
        <div style={{ position: 'absolute', bottom: '5vh', left: '50%', transform: 'translateX(-50%)', zIndex: 10, opacity: 0.8 }}>
          <svg width="30" height="70" viewBox="0 0 24 54" fill="#050505" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 9C14.2091 9 16 7.20914 16 5C16 2.79086 14.2091 1 12 1C9.79086 1 8 2.79086 8 5C8 7.20914 9.79086 9 12 9Z" fill="#000" stroke="#111" strokeWidth="0.5"/>
            <path d="M15.5 12C14.5 10.5 13 10 12 10C11 10 9.5 10.5 8.5 12C7 14 6 18 6 22L7 30H10V52C10 52.8 10.4 53 11 53C11.6 53 12 52.8 12 52V35H12.5V52C12.5 52.8 12.9 53 13.5 53C14.1 53 14.5 52.8 14.5 52V30H17.5L18.5 22C18.5 18 17.5 14 15.5 12Z" fill="#000" stroke="#111" strokeWidth="0.5"/>
          </svg>
        </div>

        {/* Hero Content */}
        <main style={{
          flexGrow: 1,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 20,
          padding: '120px 8% 80px',
          pointerEvents: 'none',
        }}>
          <div style={{ maxWidth: '680px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', pointerEvents: 'auto' }}>

            {/* Eyebrow */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px', opacity: 0.8 }}>
              <div style={{ width: '48px', height: '1px', background: teal }} />
              <div style={{ fontFamily: fd, fontSize: '10px', letterSpacing: '0.3em', textTransform: 'uppercase', color: teal }}>Engineered For Mastery</div>
            </div>

            {/* Headline */}
            <h1 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 'clamp(48px, 5.5vw, 80px)', lineHeight: 1.05, letterSpacing: '-0.02em', color: '#fff', margin: '0 0 32px 0' }}>
              The Trading Journal That
              <span style={{ display: 'block', color: teal, marginTop: '8px' }}>Fixes Your Psychology.</span>
            </h1>

            {/* Subtitle */}
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 300, fontSize: 'clamp(16px, 1.2vw, 20px)', color: 'rgba(200,200,200,0.8)', maxWidth: '540px', marginBottom: '48px', lineHeight: 1.7 }}>
              AI-enhanced behavioral and trading pattern recognition. We analyze the data hidden in your drawdowns to reconstruct your discipline.
            </p>

            {/* CTA */}
            <button style={{
              padding: '16px 48px',
              background: teal,
              color: '#000',
              fontFamily: fd,
              fontSize: '12px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              border: 'none',
              cursor: 'pointer',
            }}>
              Sign Up
            </button>
          </div>
        </main>

        {/* Bottom Bar */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          padding: '32px',
          zIndex: 30,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          pointerEvents: 'none',
        }}>
          {/* Left: Brokers */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', pointerEvents: 'auto' }}>
            <p style={{ fontFamily: fd, fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', margin: 0 }}>Connects With All Brokers</p>
            <div style={{ fontFamily: fd, fontSize: '10px', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.25)', display: 'flex', gap: '24px' }}>
              <span>BINANCE</span>
              <span>NINJATRADER</span>
              <span>TRADINGVIEW</span>
            </div>
            <div
              onClick={() => setShowBrokers(!showBrokers)}
              style={{ fontFamily: fd, fontSize: '10px', color: teal, cursor: 'pointer', marginTop: '4px' }}
            >
              {showBrokers ? 'Hide brokers ▲' : 'View all brokers ▼'}
            </div>
            {showBrokers && (
              <div style={{ fontFamily: fd, fontSize: '10px', color: 'rgba(255,255,255,0.25)', display: 'flex', gap: '16px', flexWrap: 'wrap', maxWidth: '400px', marginTop: '4px' }}>
                <span>THINKORSWIM</span><span>INTERACTIVE BROKERS</span><span>SCHWAB</span><span>WEBULL</span><span>TASTYTRADE</span><span>E*TRADE</span><span>FIDELITY</span>
              </div>
            )}
          </div>

          {/* Right: Stat Cards */}
          <div style={{
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.1)',
            padding: '20px',
            display: 'flex',
            gap: '32px',
            position: 'relative',
            pointerEvents: 'auto',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '24px', color: '#fff' }}>+42%</span>
              <span style={{ fontFamily: fd, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>Avg. Expectancy<br/>Increase</span>
            </div>
            <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '24px', color: '#fff' }}>1.2M+</span>
              <span style={{ fontFamily: fd, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>Executions<br/>Analyzed</span>
            </div>
            <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '24px', color: '#fff' }}>-68%</span>
              <span style={{ fontFamily: fd, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#ff4444', marginTop: '4px' }}>Reduction in<br/>Revenge Trades</span>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
