'use client';
import React, { useRef, useEffect } from "react";
import { fm, fd, teal } from "./shared";

interface HeroProps {
  textVisible: boolean;
}

export default function Hero({ textVisible }: HeroProps) {
  const heroVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (heroVideoRef.current) heroVideoRef.current.playbackRate = 1.0;
  }, []);

  return (
    <div style={{ textAlign: 'center', marginBottom: 32, position: 'relative', overflow: 'hidden' }}>
      {/* Hero animation video */}
      <video ref={heroVideoRef} autoPlay muted playsInline src="/wickcoach-logo-anim.mp4" style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', height: 300, width: 'auto', objectFit: 'contain' as const, opacity: textVisible ? 0 : 1, zIndex: 0, pointerEvents: 'none', transition: 'opacity 1s ease-out', mixBlendMode: 'lighten' as const, clipPath: 'inset(0 0 22% 0)', }} />
      {/* Heading */}
      <h1 style={{ position: 'relative', zIndex: 1, fontFamily: fd, color: '#ffffff', fontSize: 44, fontWeight: 700, lineHeight: 1.2, maxWidth: 800, margin: '0 auto 0', opacity: textVisible ? 1 : 0, filter: textVisible ? 'blur(0px)' : 'blur(8px)', transition: 'opacity 1s ease-in, filter 1s ease-in' }}>The trading journal that <span style={{ color: teal, textShadow: textVisible ? '0 0 20px rgba(0,212,160,0.3), 0 0 40px rgba(0,212,160,0.15)' : 'none', transition: 'text-shadow 1s ease-in 1s' }}>fixes your psychology</span></h1>
      {/* Subtitle */}
      <p style={{ position: 'relative', zIndex: 1, color: '#e5e7eb', fontFamily: fm, fontSize: 15, maxWidth: 600, margin: '0 auto', lineHeight: 1.7, marginTop: 24, opacity: textVisible ? 1 : 0, filter: textVisible ? 'blur(0px)' : 'blur(8px)', transition: 'opacity 1s ease-in, filter 1s ease-in' }}>AI-enhanced behavioral and trading pattern recognition</p>
    </div>
  );
}
