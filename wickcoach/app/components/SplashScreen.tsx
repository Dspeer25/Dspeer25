'use client';
import React, { useState, useEffect } from 'react';
import { fd, fm } from './shared';

const teal = '#39ff85';

export default function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);
  const [glowOn, setGlowOn] = useState(false);
  const [ctaVisible, setCtaVisible] = useState(false);

  // Decide on mount whether to show (once per session)
  useEffect(() => {
    try {
      const seen = sessionStorage.getItem('wickcoach-splash-seen');
      if (!seen) {
        setVisible(true);
        sessionStorage.setItem('wickcoach-splash-seen', '1');
      }
    } catch {
      setVisible(true);
    }
  }, []);

  // Sequencing timers — only run when visible
  useEffect(() => {
    if (!visible) return;
    const t1 = setTimeout(() => setGlowOn(true), 1500);
    const t2 = setTimeout(() => setCtaVisible(true), 2000);
    const t3 = setTimeout(() => dismiss(), 4000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const dismiss = () => {
    setFading(true);
    setTimeout(() => setVisible(false), 800);
  };

  if (!visible) return null;

  return (
    <>
      <style>{`
        @keyframes candleGlow {
          0%, 100% { filter: drop-shadow(0 0 8px rgba(57,255,133,0.3)); }
          50% { filter: drop-shadow(0 0 20px rgba(57,255,133,0.8)); }
        }
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(12px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div
        onClick={dismiss}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: '#030305',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          opacity: fading ? 0 : 1,
          transition: 'opacity 0.8s ease',
        }}
      >
        {/* Logo stick figure (80px) with optional glowing candle */}
        <svg
          width="80"
          height="96"
          viewBox="0 0 20 24"
          fill="none"
          style={{ marginBottom: 24 }}
        >
          <circle cx="8" cy="4" r="2.8" stroke="#7a7d88" strokeWidth="1.2" fill="none" />
          <line x1="8" y1="6.8" x2="8" y2="15" stroke="#7a7d88" strokeWidth="1.2" />
          <line x1="8" y1="9.5" x2="3" y2="13" stroke="#7a7d88" strokeWidth="1.2" />
          <line x1="8" y1="9.5" x2="14.5" y2="6" stroke="#7a7d88" strokeWidth="1.2" />
          <line x1="8" y1="15" x2="4.5" y2="21" stroke="#7a7d88" strokeWidth="1.2" />
          <line x1="8" y1="15" x2="11.5" y2="21" stroke="#7a7d88" strokeWidth="1.2" />
          {/* The candle — animates when glowOn */}
          <g style={{ animation: glowOn ? 'candleGlow 1.6s ease-in-out infinite' : 'none', transformOrigin: 'center' }}>
            <line x1="15.5" y1="2" x2="15.5" y2="12" stroke={teal} strokeWidth="0.8" />
            <rect x="13.5" y="4" width="4" height="5" rx="0.5" fill={teal} opacity="0.9" />
          </g>
        </svg>

        {/* WICKCOACH wordmark */}
        <div style={{ fontFamily: fd, fontSize: 28, fontWeight: 700, letterSpacing: '0.15em' }}>
          <span style={{ color: '#ffffff' }}>WICK</span>
          <span style={{ color: teal }}>COACH</span>
        </div>

        {/* Get Started — fades in at 2s */}
        <div
          style={{
            marginTop: 48,
            fontFamily: fm,
            fontSize: 11,
            color: teal,
            textTransform: 'uppercase',
            letterSpacing: '0.3em',
            opacity: ctaVisible ? 1 : 0,
            animation: ctaVisible ? 'fadeInUp 0.6s ease forwards' : 'none',
          }}
        >
          Get Started
        </div>
      </div>
    </>
  );
}
