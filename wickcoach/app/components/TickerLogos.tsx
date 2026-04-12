'use client';
import React, { useState } from "react";
import { fm, fd } from "./shared";

export const tickerColors: Record<string, string> = { QQQ: "#7b3fe4", TSLA: "#cc0000", SPY: "#1a4a8a", NVDA: "#76b900", AAPL: "#555", META: "#0668E1", AMZN: "#ff9900" };

export const TBadge = ({ ticker }: { ticker: string }) => {
  const [srcIdx, setSrcIdx] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const sources = [
    `https://financialmodelingprep.com/image-stock/${ticker}.png`,
    `https://assets.parqet.com/logos/symbol/${ticker}?format=png`,
    `https://storage.googleapis.com/iex/api/logos/${ticker}.png`,
  ];
  const allFailed = srcIdx >= sources.length;
  return (
    <div style={{ width: 28, height: 28, borderRadius: 5, background: tickerColors[ticker] || "#2a2a34", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#fff", fontFamily: fm, flexShrink: 0, overflow: "hidden" }}>
      {!allFailed && (
        <img
          key={srcIdx}
          src={sources[srcIdx]}
          alt={ticker}
          width={20}
          height={20}
          style={{ objectFit: "contain", display: loaded ? "block" : "none" }}
          onLoad={() => setLoaded(true)}
          onError={() => { setLoaded(false); setSrcIdx(i => i + 1); }}
        />
      )}
      {(allFailed || !loaded) && <span style={{ fontSize: 9 }}>{ticker.slice(0, 4)}</span>}
    </div>
  );
};

export const tickerDomains: Record<string, string> = {
  QQQ: 'invesco.com', SPY: 'spglobal.com', AAPL: 'apple.com', NVDA: 'nvidia.com',
  TSLA: 'tesla.com', AMZN: 'amazon.com', META: 'meta.com', MSFT: 'microsoft.com',
  GOOGL: 'google.com', GOOG: 'google.com', AMD: 'amd.com', NFLX: 'netflix.com',
  BA: 'boeing.com', DIS: 'disney.com', JPM: 'jpmorgan.com',
  V: 'visa.com', WMT: 'walmart.com', COIN: 'coinbase.com', PLTR: 'palantir.com',
  SOFI: 'sofi.com', CRM: 'salesforce.com', COST: 'costco.com', HD: 'homedepot.com',
  UNH: 'unitedhealthgroup.com',
};

export const cDomains = tickerDomains;

export const CLogo = ({ t }: { t: string }) => <img src={`https://www.google.com/s2/favicons?domain=${tickerDomains[t] || t.toLowerCase() + '.com'}&sz=64`} alt={t} style={{ width: 20, height: 20, borderRadius: "50%", background: "#1a1b22", objectFit: "cover" as const }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />;

export const tickerBgColors: Record<string, string> = { QQQ: '#7b3fe4', TSLA: '#cc0000', SPY: '#1a4a8a', NVDA: '#76b900', AAPL: '#555', META: '#0668E1', AMZN: '#ff9900', MSFT: '#00a4ef', GOOGL: '#4285f4', AMD: '#ed1c24', NFLX: '#e50914', BA: '#0039a6', DIS: '#113ccf', JPM: '#006cb7', V: '#1a1f71', WMT: '#0071dc', COIN: '#0052ff', GOOG: '#4285f4' };

export const TickerLogo = ({ ticker }: { ticker: string }) => {
  const [failed, setFailed] = useState(false);
  return (
    <div style={{ width: 24, height: 24, flexShrink: 0, position: 'relative' }}>
      {!failed && (
        <img
          src={`https://eodhd.com/img/logos/US/${ticker}.png`}
          alt={ticker}
          width={24}
          height={24}
          style={{ objectFit: 'cover', borderRadius: 6, display: 'block' }}
          onError={() => setFailed(true)}
        />
      )}
      {failed && (
        <div style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(0,212,160,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#00d4a0', fontFamily: fd }}>{ticker.charAt(0)}</span>
        </div>
      )}
    </div>
  );
};
