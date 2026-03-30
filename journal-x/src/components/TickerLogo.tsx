'use client';

import { useState } from 'react';

const M = "'DM Mono', monospace";

// Consistent color from ticker string
function tickerColor(t: string): string {
  let hash = 0;
  for (let i = 0; i < t.length; i++) hash = t.charCodeAt(i) + ((hash << 5) - hash);
  const colors = ['#e53e3e','#dd6b20','#d69e2e','#38a169','#319795','#3182ce','#805ad5','#d53f8c'];
  return colors[Math.abs(hash) % colors.length];
}

interface Props { ticker: string; size?: number; }

export default function TickerLogo({ ticker, size = 22 }: Props) {
  const [failed, setFailed] = useState(false);
  const t = ticker.toUpperCase();
  const c = tickerColor(t);

  // Tier 1: Polygon proxy (serves image bytes or redirects for ETFs)
  if (!failed) {
    return (
      <img
        src={`/api/tickers/logo/${encodeURIComponent(t)}`}
        width={size}
        height={size}
        style={{ borderRadius: 4, objectFit: 'cover', flexShrink: 0 }}
        onError={() => setFailed(true)}
        alt={t}
      />
    );
  }

  // Tier 2: Styled letter badge
  return (
    <div style={{
      width: size, height: size, borderRadius: 4,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: c + '33', border: `1px solid ${c}55`,
      color: '#fff', fontSize: 8, fontWeight: 600, fontFamily: M, flexShrink: 0,
    }}>
      {t[0]}
    </div>
  );
}
