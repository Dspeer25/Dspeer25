'use client';

import { useState, useRef } from 'react';

const M = "'DM Mono', monospace";
const SZ = 28;
const BR = 6;

// Tier 1: hardcoded badges for common ETFs/crypto/indexes
const KNOWN: Record<string, { bg: string; text: string; color?: string }> = {
  SPY:  { bg: '#1a2a4a', text: 'SPY' },
  QQQ:  { bg: '#3a1a4a', text: 'QQQ' },
  IWM:  { bg: '#4a2a1a', text: 'IWM' },
  DIA:  { bg: '#1a2a4a', text: 'DIA' },
  VIX:  { bg: '#4a1a1a', text: 'VIX' },
  GLD:  { bg: '#3a3018', text: 'GLD', color: '#c9a84c' },
  SLV:  { bg: '#2a2a2a', text: 'SLV', color: '#e0e0e8' },
  USO:  { bg: '#1a3a1a', text: 'USO' },
  BTC:  { bg: '#3a2510', text: '\u20BF', color: '#f7931a' },
  ETH:  { bg: '#1e2040', text: 'ETH', color: '#627eea' },
  SOL:  { bg: '#2a1a3a', text: 'SOL' },
  DOGE: { bg: '#3a3518', text: 'DOGE', color: '#c2a633' },
  SQQQ: { bg: '#3a1a4a', text: 'SQQQ' },
  TQQQ: { bg: '#3a1a4a', text: 'TQQQ' },
  TLT:  { bg: '#1a2a4a', text: 'TLT' },
  VXX:  { bg: '#4a1a1a', text: 'VXX' },
};

// Tier 3 fallback colors
const FALLBACK_BG = ['#1a3a2a','#1a1a3a','#2a1a1a','#2a2a1a','#1a2a2a','#2a1a2a'];

// Cache Polygon results across renders
const logoCache: Record<string, string | null> = {};

interface Props { ticker: string; size?: number; }

export default function TickerLogo({ ticker, size = SZ }: Props) {
  const [imgFailed, setImgFailed] = useState(false);
  const [polygonUrl, setPolygonUrl] = useState<string | null>(null);
  const [polygonDone, setPolygonDone] = useState(false);
  const fetched = useRef(false);
  const t = ticker.toUpperCase();

  // Tier 1: known badge
  const known = KNOWN[t];
  if (known) {
    return (
      <div style={{
        width: size, height: size, borderRadius: BR,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: known.bg, color: known.color || '#fff',
        fontSize: 9, fontWeight: 700, fontFamily: M, flexShrink: 0,
        letterSpacing: '0.03em',
      }}>
        {known.text}
      </div>
    );
  }

  // Tier 2: Polygon API
  if (!fetched.current && !polygonDone) {
    fetched.current = true;
    if (logoCache[t] !== undefined) {
      // Already cached
      if (logoCache[t]) {
        setPolygonUrl(logoCache[t]);
      }
      setPolygonDone(true);
    } else {
      fetch(`/api/tickers/logo/${encodeURIComponent(t)}`)
        .then(res => {
          const ct = res.headers.get('content-type') || '';
          if (ct.startsWith('image/')) {
            // Proxy returned image bytes — use the route URL directly
            logoCache[t] = `/api/tickers/logo/${encodeURIComponent(t)}`;
            setPolygonUrl(logoCache[t]);
          } else {
            logoCache[t] = null;
          }
          setPolygonDone(true);
        })
        .catch(() => {
          logoCache[t] = null;
          setPolygonDone(true);
        });
    }
  }

  // Show Polygon image if we have it and it hasn't errored
  if (polygonUrl && !imgFailed) {
    return (
      <img
        src={polygonUrl}
        width={size}
        height={size}
        style={{ borderRadius: BR, objectFit: 'cover', flexShrink: 0 }}
        onError={() => setImgFailed(true)}
        alt={t}
      />
    );
  }

  // Tier 3: letter badge with consistent color
  const bg = FALLBACK_BG[t.charCodeAt(0) % FALLBACK_BG.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: BR,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: bg, color: '#e0e0e8',
      fontSize: 9, fontWeight: 700, fontFamily: M, flexShrink: 0,
    }}>
      {t[0]}
    </div>
  );
}
