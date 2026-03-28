'use client';

import { useState } from 'react';

/* Static fallback logos for ETFs, indexes, and crypto that Polygon doesn't cover */
const ETF_LOGOS: Record<string, string> = {
  SPY: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/SSGA_Logo.svg/320px-SSGA_Logo.svg.png',
  QQQ: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Invesco_Logo.svg/320px-Invesco_Logo.svg.png',
  IWM: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/BlackRock_wordmark.svg/320px-BlackRock_wordmark.svg.png',
  DIA: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/SSGA_Logo.svg/320px-SSGA_Logo.svg.png',
  GLD: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/SSGA_Logo.svg/320px-SSGA_Logo.svg.png',
  SLV: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/BlackRock_wordmark.svg/320px-BlackRock_wordmark.svg.png',
  TLT: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/BlackRock_wordmark.svg/320px-BlackRock_wordmark.svg.png',
  XLF: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/SSGA_Logo.svg/320px-SSGA_Logo.svg.png',
  XLE: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/SSGA_Logo.svg/320px-SSGA_Logo.svg.png',
  XLK: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/SSGA_Logo.svg/320px-SSGA_Logo.svg.png',
  VTI: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Vanguard_Logo.svg/320px-Vanguard_Logo.svg.png',
  VOO: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Vanguard_Logo.svg/320px-Vanguard_Logo.svg.png',
  ARKK: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/ARK_Invest_logo.svg/320px-ARK_Invest_logo.svg.png',
  EEM: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/BlackRock_wordmark.svg/320px-BlackRock_wordmark.svg.png',
  HYG: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/BlackRock_wordmark.svg/320px-BlackRock_wordmark.svg.png',
  USO: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/SSGA_Logo.svg/320px-SSGA_Logo.svg.png',
  // Crypto
  BTC: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Bitcoin.svg/120px-Bitcoin.svg.png',
  ETH: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Ethereum-icon-purple.svg/120px-Ethereum-icon-purple.svg.png',
  SOL: 'https://upload.wikimedia.org/wikipedia/en/b/b9/Solana_logo.png',
  DOGE: 'https://upload.wikimedia.org/wikipedia/en/d/d0/Dogecoin_Logo.png',
  ADA: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Cardano-rgb_Icon-White.svg/120px-Cardano-rgb_Icon-White.svg.png',
  XRP: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Ripple_logo.svg/120px-Ripple_logo.svg.png',
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
