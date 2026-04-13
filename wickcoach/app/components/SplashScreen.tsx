'use client';
import React, { useState, useEffect, useRef } from 'react';

export default function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

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
    const video = videoRef.current;
    if (video) {
      video.muted = true;
      video.play().then(() => {
        try { video.muted = false; } catch(e) {}
      }).catch(() => dismiss());
    }
    const timer = setTimeout(dismiss, 8000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div onClick={dismiss} style={{ position: 'fixed', inset: 0, zIndex: 99999, background: '#0A0D14', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: fading ? 0 : 1, transition: 'opacity 0.8s ease-out' }}>
      <video ref={videoRef} src="/Wick_Video.mp4" playsInline onEnded={dismiss} style={{ maxWidth: '350px', maxHeight: '350px', objectFit: 'contain' }} />
      <div style={{ marginTop: '32px', fontFamily: 'Chakra Petch, sans-serif', fontSize: '36px', fontWeight: 700, letterSpacing: '0.2em', color: '#00d4a0', textTransform: 'uppercase' as const }}>GET STARTED</div>
    </div>
  );
}
