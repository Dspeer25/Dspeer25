'use client';

import { useState } from 'react';
import { getTickerLogo } from '@/lib/demoData';

interface TickerLogoProps {
  ticker: string;
  size?: number;
  className?: string;
}

export default function TickerLogo({ ticker, size = 22, className = '' }: TickerLogoProps) {
  const [failed, setFailed] = useState(false);
  const logo = getTickerLogo(ticker);

  if (!logo || failed) {
    // Fallback: colored circle with first letter
    const colors = ['#30C48B', '#4A9EFF', '#FF6B35', '#a78bfa', '#f59e0b'];
    const colorIdx = ticker.charCodeAt(0) % colors.length;
    return (
      <div
        className={`rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 ${className}`}
        style={{
          width: size,
          height: size,
          fontSize: size * 0.4,
          background: `${colors[colorIdx]}33`,
          color: colors[colorIdx],
        }}
      >
        {ticker.charAt(0)}
      </div>
    );
  }

  return (
    <img
      src={logo}
      alt={ticker}
      className={`rounded-full object-cover flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
    />
  );
}
