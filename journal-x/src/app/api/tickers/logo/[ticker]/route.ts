import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  const apiKey = process.env.POLYGON_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ logoUrl: null });
  }

  try {
    // Step 1: Get the branding icon URL from Polygon reference data
    const refRes = await fetch(
      `https://api.polygon.io/v3/reference/tickers/${encodeURIComponent(ticker.toUpperCase())}?apiKey=${apiKey}`,
      { next: { revalidate: 86400 } }
    );

    if (!refRes.ok) {
      return NextResponse.json({ logoUrl: null });
    }

    const data = await refRes.json();
    const iconUrl: string | undefined = data?.results?.branding?.icon_url;

    if (!iconUrl) {
      return NextResponse.json({ logoUrl: null });
    }

    // Step 2: Fetch the actual image server-side and proxy it back
    const authedUrl = iconUrl.includes('?')
      ? `${iconUrl}&apiKey=${apiKey}`
      : `${iconUrl}?apiKey=${apiKey}`;

    const imgRes = await fetch(authedUrl);

    if (!imgRes.ok) {
      return NextResponse.json({ logoUrl: null });
    }

    const contentType = imgRes.headers.get('content-type') || 'image/png';
    const buffer = await imgRes.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=604800, immutable',
      },
    });
  } catch {
    return NextResponse.json({ logoUrl: null });
  }
}
