'use client';
import React, { useState, useEffect, useRef } from 'react';

export default function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Only show once per session
    if (sessionStorage.getItem('wickcoach-splash-seen')) {
      setVisible(false);
      return;
    }
  }, []);

  const dismiss = () => {
    setFading(true);
    sessionStorage.setItem('wickcoach-splash-seen', 'true');
    setTimeout(() => setVisible(false), 800);
  };

  if (!visible) return null;

  return (
    <div
      onClick={dismiss}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: '#030305',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        opacity: fading ? 0 : 1,
        transition: 'opacity 0.8s ease-out',
      }}
    >
      <video
        ref={videoRef}
        src="/Wick_Video.mp4"
        autoPlay
        muted={false}
        playsInline
        onEnded={dismiss}
        style={{
          maxWidth: '300px',
          maxHeight: '300px',
          objectFit: 'contain',
        }}
      />
      <div style={{
        marginTop: '32px',
        fontFamily: 'Chakra Petch, sans-serif',
        fontSize: '32px',
        fontWeight: 700,
        letterSpacing: '0.2em',
        color: '#00d4a0',
        textTransform: 'uppercase',
        animation: 'fadeInUp 1s ease-out 1.5s both',
      }}>
        GET STARTED
      </div>
      <style>{`
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(16px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
