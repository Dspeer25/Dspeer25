import { NextResponse } from 'next/server';
import { GUMROAD_PRODUCT_ID } from '../../../components/shared';

// Server-side proxy for Gumroad license verification. The browser can't
// call api.gumroad.com directly (no CORS headers), so the Position Calc Pro
// lock screen and its background re-verify POST here instead. No Gumroad
// secret is required for verification — only product_id + license_key — so
// nothing sensitive ships to the client either way.
//
// Request body: { license_key: string, increment?: boolean }
//   increment=true  → activation (lock-screen submit); consumes one "use".
//   increment=false → background re-verify; must NOT consume a use, or every
//                      app load would burn an activation toward the limit.
//
// Normalized response: { status, uses? } where status is one of:
//   'valid'    — active license
//   'invalid'  — no such license for this product
//   'limit'    — activation limit reached (too many devices)
//   'refunded' — purchase refunded / disputed / chargebacked
//   'disabled' — purchase disabled
//   'error'    — couldn't reach or parse Gumroad (inconclusive)
export async function POST(req: Request) {
  let licenseKey = '';
  let increment = false;
  try {
    const body = await req.json();
    licenseKey = (body?.license_key ?? '').toString().trim();
    increment = body?.increment === true;
  } catch {
    /* fall through to invalid */
  }

  if (!licenseKey) {
    return NextResponse.json({ status: 'invalid' });
  }

  try {
    const gumroad = await fetch('https://api.gumroad.com/v2/licenses/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        product_id: GUMROAD_PRODUCT_ID,
        license_key: licenseKey,
        increment_uses_count: increment ? 'true' : 'false',
      }),
    });

    const data = await gumroad.json().catch(() => null);
    if (!data) return NextResponse.json({ status: 'error' });

    if (data.success) {
      const purchase = data.purchase ?? {};
      // Revoked states take priority — a refunded buyer must lose access.
      if (purchase.refunded || purchase.chargebacked || purchase.disputed) {
        return NextResponse.json({ status: 'refunded' });
      }
      if (purchase.disabled) {
        return NextResponse.json({ status: 'disabled' });
      }
      return NextResponse.json({ status: 'valid', uses: data.uses ?? null });
    }

    // success === false: separate "activation limit reached" from a plain
    // bad/unknown key, using the message (and uses count when present).
    const message = (data.message ?? '').toString().toLowerCase();
    if (message.includes('limit') || message.includes('maximum') || message.includes('activation')) {
      return NextResponse.json({ status: 'limit', uses: data.uses ?? null });
    }
    return NextResponse.json({ status: 'invalid', uses: data.uses ?? null });
  } catch {
    // Network / upstream failure — inconclusive. The client keeps a stored
    // license working offline rather than locking out a paying user.
    return NextResponse.json({ status: 'error' });
  }
}
