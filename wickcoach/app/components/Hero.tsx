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
    </div>
  );
}
