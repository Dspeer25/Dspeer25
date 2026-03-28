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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  const apiKey = process.env.POLYGON_API_KEY;
  const upperTicker = ticker.toUpperCase();

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
