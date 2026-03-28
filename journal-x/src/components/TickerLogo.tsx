'use client';

import { useState } from 'react';

/* Static fallback logos for ETFs, indexes, and crypto that Polygon doesn't cover */
const ETF_LOGOS: Record<string, string> = {
  SPY: 'https://companieslogo.com/img/orig/SPY-d16c77f0.png',
  QQQ: 'https://companieslogo.com/img/orig/QQQ-3a6b7aca.png',
  IWM: 'https://companieslogo.com/img/orig/IWM.png',
  GLD: 'https://companieslogo.com/img/orig/GLD.png',
  DIA: 'https://companieslogo.com/img/orig/DIA.png',
  TLT: 'https://companieslogo.com/img/orig/TLT.png',
  VTI: 'https://companieslogo.com/img/orig/VTI.png',
  VOO: 'https://companieslogo.com/img/orig/VOO.png',
  XLF: 'https://companieslogo.com/img/orig/XLF.png',
  XLE: 'https://companieslogo.com/img/orig/XLE.png',
  XLK: 'https://companieslogo.com/img/orig/XLK.png',
  GOOG: 'https://companieslogo.com/img/orig/GOOGL-0ed88f7c.png',
  // Crypto
  BTC: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
  ETH: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
  SOL: 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
};

interface TickerLogoProps {
  ticker: string;
  size?: number;
  className?: string;
}

export default function TickerLogo({ ticker, size = 22, className = '' }: TickerLogoProps) {
  const [polygonFailed, setPolygonFailed] = useState(false);
  const [fallbackFailed, setFallbackFailed] = useState(false);

  const upperTicker = ticker.toUpperCase();
  const fallbackUrl = ETF_LOGOS[upperTicker];

  // Step 1: Try Polygon proxy
  if (!polygonFailed) {
    return (
      <img
        src={`/api/tickers/logo/${encodeURIComponent(ticker)}`}
        alt={ticker}
        className={`rounded-full object-cover flex-shrink-0 ${className}`}
        style={{ width: size, height: size }}
        onError={() => setPolygonFailed(true)}
      />
    );
  }

  // Step 2: Try static ETF/crypto fallback map
  if (fallbackUrl && !fallbackFailed) {
    return (
      <img
        src={fallbackUrl}
        alt={ticker}
        className={`rounded-full object-cover flex-shrink-0 ${className}`}
        style={{ width: size, height: size }}
        onError={() => setFallbackFailed(true)}
      />
    );
  }

  // Step 3: Colored letter circle
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
