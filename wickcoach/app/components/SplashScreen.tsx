'use client';
import React, { useState, useEffect, useRef } from 'react';

export default function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const dismiss = () => {
    setFading(true);
    sessionStorage.setItem('wickcoach-splash-seen', 'true');
    setTimeout(() => setVisible(false), 800);
  };

  useEffect(() => {
    if (sessionStorage.getItem('wickcoach-splash-seen')) {
      setVisible(false);
      return;
    }
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    video.play().then(() => {
      try { video.muted = false; } catch { /* ignore */ }
    }).catch(() => dismiss());
    const t = setTimeout(dismiss, 8000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!visible) return null;

  return (
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
      <video
        ref={videoRef}
        src="/Wick_Video.mp4"
        muted
        playsInline
        preload="auto"
        onEnded={dismiss}
        style={{
          width: '300px',
          height: 'auto',
          objectFit: 'contain',
        }}
      />
      <div
        style={{
          marginTop: '32px',
          fontFamily: 'Chakra Petch, sans-serif',
          fontSize: '36px',
          fontWeight: 700,
          letterSpacing: '0.2em',
          color: '#00d4a0',
          textTransform: 'uppercase',
          animation: 'fadeInUp 1s ease-out 1.5s both',
        }}
      >
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
