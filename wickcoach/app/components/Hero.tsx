'use client';
import React from 'react';

interface HeroProps {
  textVisible: boolean;
}

export default function Hero({ textVisible }: HeroProps) {
  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <iframe
        src="/hero.html"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block',
        }}
        title="WickCoach Hero"
      />
    </div>
  );
}
