'use client';
import React, { useState, useEffect } from 'react';

export default function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);
  const [glowOn, setGlowOn] = useState(false);
  const [ctaVisible, setCtaVisible] = useState(false);

  const dismiss = () => {
    if (fading) return;
    setFading(true);
    sessionStorage.setItem('wickcoach-splash-seen', 'true');
    setTimeout(() => setVisible(false), 800);
  };

  useEffect(() => {
    if (sessionStorage.getItem('wickcoach-splash-seen')) {
      setVisible(false);
      return;
    }
    const t1 = setTimeout(() => setGlowOn(true), 600);
    const t2 = setTimeout(() => setCtaVisible(true), 1400);
    const t3 = setTimeout(dismiss, 5000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!visible) return null;

  return (
    <>
      <style>{`
        @keyframes splashLimbDraw {
          0% { stroke-dasharray: 30; stroke-dashoffset: 30; opacity: 0; }
          100% { stroke-dasharray: 30; stroke-dashoffset: 0; opacity: 1; }
        }
        @keyframes splashHeadPop {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes splashCandleGlow {
          0%, 100% { filter: drop-shadow(0 0 8px rgba(0,212,160,0.4)); }
          50% { filter: drop-shadow(0 0 24px rgba(0,212,160,0.95)); }
        }
        @keyframes splashCandleFade {
          0% { opacity: 0; transform: translateY(4px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes splashCtaFade {
          0% { opacity: 0; transform: translateY(12px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div
        onClick={dismiss}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          background: '#0A0D14',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          opacity: fading ? 0 : 1,
          transition: 'opacity 0.8s ease-out',
        }}
      >
        {/* Animated WickCoach stick figure — scales up, limbs draw in, candle glows */}
        <svg
          width="180"
          height="216"
          viewBox="0 0 20 24"
          fill="none"
          style={{ overflow: 'visible' }}
        >
          {/* Head — pops in */}
          <circle
            cx="8"
            cy="4"
            r="2.8"
            stroke="#c8cdd6"
            strokeWidth="1.2"
            fill="none"
            style={{
              transformOrigin: '8px 4px',
              animation: 'splashHeadPop 0.5s ease-out forwards',
            }}
          />
          {/* Spine */}
          <line
            x1="8" y1="6.8" x2="8" y2="15"
            stroke="#c8cdd6"
            strokeWidth="1.2"
            strokeLinecap="round"
            style={{ animation: 'splashLimbDraw 0.4s ease-out 0.4s both' }}
          />
          {/* Left arm */}
          <line
            x1="8" y1="9.5" x2="3" y2="13"
            stroke="#c8cdd6"
            strokeWidth="1.2"
            strokeLinecap="round"
            style={{ animation: 'splashLimbDraw 0.4s ease-out 0.7s both' }}
          />
          {/* Right arm (holding candle) */}
          <line
            x1="8" y1="9.5" x2="14.5" y2="6"
            stroke="#c8cdd6"
            strokeWidth="1.2"
            strokeLinecap="round"
            style={{ animation: 'splashLimbDraw 0.4s ease-out 0.9s both' }}
          />
          {/* Left leg */}
          <line
            x1="8" y1="15" x2="4.5" y2="21"
            stroke="#c8cdd6"
            strokeWidth="1.2"
            strokeLinecap="round"
            style={{ animation: 'splashLimbDraw 0.4s ease-out 1.1s both' }}
          />
          {/* Right leg */}
          <line
            x1="8" y1="15" x2="11.5" y2="21"
            stroke="#c8cdd6"
            strokeWidth="1.2"
            strokeLinecap="round"
            style={{ animation: 'splashLimbDraw 0.4s ease-out 1.3s both' }}
          />
          {/* Candle wick + body — fades in, then pulsing glow kicks in */}
          <g
            style={{
              opacity: 0,
              animation: 'splashCandleFade 0.4s ease-out 1.2s forwards',
              transformOrigin: 'center',
            }}
          >
            <g style={{ animation: glowOn ? 'splashCandleGlow 1.6s ease-in-out infinite' : 'none' }}>
              <line x1="15.5" y1="2" x2="15.5" y2="12" stroke="#00d4a0" strokeWidth="0.8" strokeLinecap="round" />
              <rect x="13.5" y="4" width="4" height="5" rx="0.5" fill="#00d4a0" />
            </g>
          </g>
        </svg>

        {/* Wordmark */}
        <div
          style={{
            marginTop: 28,
            fontFamily: 'Chakra Petch, sans-serif',
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: '0.18em',
            opacity: ctaVisible ? 1 : 0,
            animation: ctaVisible ? 'splashCtaFade 0.6s ease-out forwards' : 'none',
          }}
        >
          <span style={{ color: '#ffffff' }}>WICK</span>
          <span style={{ color: '#00d4a0' }}>COACH</span>
        </div>

        {/* GET STARTED */}
        <div
          style={{
            marginTop: 24,
            fontFamily: 'Chakra Petch, sans-serif',
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: '0.3em',
            color: '#00d4a0',
            textTransform: 'uppercase',
            opacity: ctaVisible ? 1 : 0,
            animation: ctaVisible ? 'splashCtaFade 0.6s ease-out 0.25s both' : 'none',
          }}
        >
          GET STARTED
        </div>
      </div>
    </>
  );
}
