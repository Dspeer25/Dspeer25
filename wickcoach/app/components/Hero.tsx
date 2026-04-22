'use client';
import React from 'react';

interface HeroProps {
  textVisible: boolean;
}

export default function Hero({ textVisible }: HeroProps) {
  return (
    <div style={{
      width: '100%',
      height: '80vh',
      position: 'relative',
      overflow: 'hidden',
      marginBottom: 0,
      paddingBottom: 0,
      // Match the nav bg so there's zero seam at the top edge
      background: 'linear-gradient(to bottom, #181c26 0%, #0f1218 30%, #0A0D14 60%)',
    }}>
      <iframe
        src="/hero.html"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block',
          pointerEvents: 'none',
        }}
        title="WickCoach Hero"
      />
      {/* Top fade — matches nav color, dissolves into iframe content */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: 220,
        background: 'linear-gradient(to bottom, #181c26 0%, rgba(24,28,38,0.8) 30%, rgba(24,28,38,0.3) 60%, transparent 100%)',
        pointerEvents: 'none',
        zIndex: 2,
      }} />
      {/* Bottom fade — dissolves into the page bg below */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: 250,
        background: 'linear-gradient(to bottom, transparent 0%, rgba(10,13,20,0.5) 40%, #0A0D14 100%)',
        pointerEvents: 'none',
        zIndex: 2,
      }} />
    </div>
  );
}
