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
      {/* Bottom gradient fade so hero blends into the content below */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 120, background: 'linear-gradient(to bottom, transparent, #0A0D14)', pointerEvents: 'none' }} />
    </div>
  );
}
