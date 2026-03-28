'use client';

const LOCAL_LOGOS = new Set(['AAPL','TSLA','NVDA','META','MSFT','AMZN','GOOGL','GOOG','AMD']);
const ETF_TICKERS = new Set(['SPY','QQQ','IWM','GLD','TLT','VXX','DIA','SQQQ','TQQQ']);

interface Props { ticker: string; size?: number; }

export default function TickerLogo({ ticker, size = 22 }: Props) {
  const t = ticker.toUpperCase();

  if (LOCAL_LOGOS.has(t)) {
    return (
      <img
        src={`/logos/${t === 'GOOG' ? 'GOOGL' : t}.png`}
        width={size}
        height={size}
        style={{ borderRadius: '50%', objectFit: 'cover' }}
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        alt={t}
      />
    );
  }

  if (ETF_TICKERS.has(t)) {
    return (
      <div style={{
        width: size, height: size, borderRadius: 4,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(48,196,139,0.4)',
        color: '#30C48B', fontSize: 7, fontWeight: 700, letterSpacing: '0.05em'
      }}>
        {t.slice(0,3)}
      </div>
    );
  }

  const colors = ['#e53e3e','#dd6b20','#38a169','#3182ce','#805ad5','#d53f8c'];
  const color = colors[t.charCodeAt(0) % colors.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: color + '33', border: `1px solid ${color}66`,
      color, fontSize: size * 0.4, fontWeight: 700
    }}>
      {t[0]}
    </div>
  );
}
