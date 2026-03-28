'use client';

import { useState } from 'react';

interface TickerLogoProps {
  ticker: string;
  size?: number;
  className?: string;
}

export default function TickerLogo({ ticker, size = 22, className = '' }: TickerLogoProps) {
  const [failed, setFailed] = useState(false);

  // Use our proxy route directly as the image src
  // The route fetches from Polygon server-side and returns the image bytes
  if (!failed) {
    return (
      <img
        src={`/api/tickers/logo/${encodeURIComponent(ticker)}`}
        alt={ticker}
        className={`rounded-full object-cover flex-shrink-0 ${className}`}
        style={{ width: size, height: size }}
        onError={() => setFailed(true)}
      />
    );
  }

  // Fallback: colored letter circle (only when Polygon has no logo)
  const colors = ['#30C48B', '#4A9EFF', '#FF6B35', '#a78bfa', '#f59e0b'];
  const colorIdx = ticker.charCodeAt(0) % colors.length;
  return (
    <div
      className={`rounded-full flex items-center justify-center font-bold flex-shrink-0 ${className}`}
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
