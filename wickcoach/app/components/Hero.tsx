'use client';
import React from 'react';

interface HeroProps {
  textVisible: boolean;
}

export default function Hero({ textVisible }: HeroProps) {
  return (
    <div style={{ width: '100%', height: '80vh', position: 'relative', overflow: 'hidden', marginBottom: -2, paddingBottom: 0, background: '#0A0D14' }}>
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
      {/* Top gradient — blends nav (#181c26) into the hero content */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 200, background: 'linear-gradient(to bottom, #181c26 0%, rgba(24,28,38,0.6) 40%, transparent 100%)', pointerEvents: 'none', zIndex: 1 }} />
      {/* Bottom gradient — blends hero into the content below (#0A0D14) */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 200, background: 'linear-gradient(to bottom, transparent 0%, #0A0D14 100%)', pointerEvents: 'none', zIndex: 1 }} />
    </div>
  );
}
