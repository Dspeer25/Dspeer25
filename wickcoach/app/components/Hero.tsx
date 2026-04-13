'use client';
import React from 'react';

interface HeroProps {
  textVisible: boolean;
}

export default function Hero({ textVisible }: HeroProps) {
  return (
    <div style={{ width: '100%', height: '90vh', position: 'relative', overflow: 'hidden', marginBottom: 0, background: '#030305' }}>
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

