import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  const apiKey = process.env.POLYGON_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ logoUrl: null, error: 'POLYGON_API_KEY not configured' });
  }

  try {
    const res = await fetch(
      `https://api.polygon.io/v3/reference/tickers/${encodeURIComponent(ticker.toUpperCase())}?apiKey=${apiKey}`,
      { next: { revalidate: 86400 } } // cache for 24h
    );

    if (!res.ok) {
      return NextResponse.json({ logoUrl: null });
    }

    const data = await res.json();
    const iconUrl: string | undefined = data?.results?.branding?.icon_url;

    if (!iconUrl) {
      return NextResponse.json({ logoUrl: null });
    }

    // Polygon branding URLs require the API key appended as a query param
    const authedUrl = iconUrl.includes('?')
      ? `${iconUrl}&apiKey=${apiKey}`
      : `${iconUrl}?apiKey=${apiKey}`;

    return NextResponse.json({ logoUrl: authedUrl });
  } catch {
    return NextResponse.json({ logoUrl: null });
  }
}
