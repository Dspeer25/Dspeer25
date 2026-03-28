'use client';

import { useState, useEffect } from 'react';

// Module-level cache — persists across renders within a session
const logoCache = new Map<string, string | null>();

interface TickerLogoProps {
  ticker: string;
  size?: number;
  className?: string;
}

export default function TickerLogo({ ticker, size = 22, className = '' }: TickerLogoProps) {
  const [logoUrl, setLogoUrl] = useState<string | null | undefined>(
    logoCache.has(ticker) ? logoCache.get(ticker) : undefined
  );

  useEffect(() => {
    if (logoCache.has(ticker)) {
      setLogoUrl(logoCache.get(ticker) ?? null);
      return;
    }

    let cancelled = false;

    fetch(`/api/tickers/logo/${encodeURIComponent(ticker)}`)
      .then(res => res.json())
      .then(data => {
        if (!cancelled) {
          const url = data.logoUrl ?? null;
          logoCache.set(ticker, url);
          setLogoUrl(url);
        }
      })
      .catch(() => {
        if (!cancelled) {
          logoCache.set(ticker, null);
          setLogoUrl(null);
        }
      });

    return () => { cancelled = true; };
  }, [ticker]);

  // Loading state
  if (logoUrl === undefined) {
    return (
      <div
        className={`rounded-full flex-shrink-0 animate-pulse ${className}`}
        style={{
          width: size,
          height: size,
          background: 'rgba(255,255,255,0.06)',
        }}
      />
    );
  }

  // Logo loaded successfully
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={ticker}
        className={`rounded-full object-cover flex-shrink-0 ${className}`}
        style={{ width: size, height: size }}
        onError={() => {
          logoCache.set(ticker, null);
          setLogoUrl(null);
        }}
      />
    );
  }

  // Fallback: colored letter circle (only when Polygon returned null)
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
