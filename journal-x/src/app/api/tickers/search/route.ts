import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q');
  if (!query || query.length < 1) return NextResponse.json([]);

  const apiKey = process.env.POLYGON_API_KEY;
  if (!apiKey) return NextResponse.json([]);

  try {
    const res = await fetch(
      `https://api.polygon.io/v3/reference/tickers?search=${encodeURIComponent(query)}&active=true&limit=8&apiKey=${apiKey}`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return NextResponse.json([]);
    const data = await res.json();

    const results = await Promise.all(
      (data.results || []).map(async (t: { ticker: string; name: string; type: string; market: string }) => {
        let logoUrl = '';
        try {
          const detail = await fetch(
            `https://api.polygon.io/v3/reference/tickers/${t.ticker}?apiKey=${apiKey}`,
            { next: { revalidate: 86400 } }
          );
          if (detail.ok) {
            const d = await detail.json();
            logoUrl = d.results?.branding?.icon_url
              ? `${d.results.branding.icon_url}?apiKey=${apiKey}`
              : '';
          }
        } catch { /* skip logo */ }

        return {
          ticker: t.ticker,
          name: t.name,
          type: t.type,
          market: t.market,
          logo: logoUrl,
        };
      })
    );

    return NextResponse.json(results);
  } catch {
    return NextResponse.json([]);
  }
}
