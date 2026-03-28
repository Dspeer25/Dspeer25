import { NextRequest, NextResponse } from 'next/server';

// Ticker normalization — some tickers have alternate symbols in Polygon
const TICKER_ALIASES: Record<string, string> = {
  GOOG: 'GOOGL',
};

async function fetchPolygonLogo(ticker: string, apiKey: string): Promise<NextResponse | null> {
  const refRes = await fetch(
    `https://api.polygon.io/v3/reference/tickers/${encodeURIComponent(ticker)}?apiKey=${apiKey}`,
    { next: { revalidate: 86400 } }
  );

  if (!refRes.ok) return null;

  const data = await refRes.json();
  const iconUrl: string | undefined = data?.results?.branding?.icon_url;

  if (!iconUrl) return null;

  const authedUrl = iconUrl.includes('?')
    ? `${iconUrl}&apiKey=${apiKey}`
    : `${iconUrl}?apiKey=${apiKey}`;

  const imgRes = await fetch(authedUrl);

  if (!imgRes.ok) return null;

  const contentType = imgRes.headers.get('content-type') || 'image/png';
  const buffer = await imgRes.arrayBuffer();

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=604800, immutable',
    },
  });
}

// Hardcoded logos for ETFs, crypto, and tickers that Polygon doesn't cover
const STATIC_LOGOS: Record<string, string> = {
  SPY: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/State_Street_Global_Advisors_logo.svg/320px-State_Street_Global_Advisors_logo.svg.png',
  QQQ: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Invesco_Logo.svg/320px-Invesco_Logo.svg.png',
  GOOG: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/320px-Google_2015_logo.svg.png',
  GOOGL: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/320px-Google_2015_logo.svg.png',
  IWM: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/BlackRock_wordmark.svg/320px-BlackRock_wordmark.svg.png',
  GLD: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/SSGA_Logo.svg/320px-SSGA_Logo.svg.png',
  BTC: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
  ETH: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  const apiKey = process.env.POLYGON_API_KEY;
  const upperTicker = ticker.toUpperCase();

  // Redirect to static logo immediately for known ETFs/crypto — skip Polygon
  if (STATIC_LOGOS[upperTicker]) {
    return NextResponse.redirect(STATIC_LOGOS[upperTicker]);
  }

  if (!apiKey) {
    return NextResponse.json({ logoUrl: null });
  }

  try {
    // Try the ticker as-is first
    const result = await fetchPolygonLogo(upperTicker, apiKey);
    if (result) return result;

    // Try alias if one exists (e.g. GOOG → GOOGL)
    const alias = TICKER_ALIASES[upperTicker];
    if (alias) {
      const aliasResult = await fetchPolygonLogo(alias, apiKey);
      if (aliasResult) return aliasResult;
    }

    // No logo found
    return NextResponse.json({ logoUrl: null });
  } catch {
    return NextResponse.json({ logoUrl: null });
  }
}
