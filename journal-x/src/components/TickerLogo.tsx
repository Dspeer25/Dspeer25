'use client';

import { useState } from 'react';

/* Static fallback logos for ETFs, indexes, and crypto that Polygon doesn't cover */
const ETF_LOGOS: Record<string, string> = {
  SPY: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/State_Street_Global_Advisors_logo.svg/320px-State_Street_Global_Advisors_logo.svg.png',
  QQQ: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Invesco_Logo.svg/320px-Invesco_Logo.svg.png',
  GOOG: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/320px-Google_2015_logo.svg.png',
  GOOGL: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/320px-Google_2015_logo.svg.png',
  IWM: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/BlackRock_wordmark.svg/320px-BlackRock_wordmark.svg.png',
  GLD: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/SSGA_Logo.svg/320px-SSGA_Logo.svg.png',
  DIA: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/State_Street_Global_Advisors_logo.svg/320px-State_Street_Global_Advisors_logo.svg.png',
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
