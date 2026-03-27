import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// Clerk sends a webhook when a user is created
// This creates their record in Supabase
export async function POST(req: NextRequest) {
  const body = await req.json();

  if (body.type === 'user.created') {
    const { id, email_addresses } = body.data;
    const email = email_addresses?.[0]?.email_address || '';

    const supabase = getServiceClient();
    await supabase.from('users').upsert({
      clerk_id: id,
      email,
      paid: false,
    }, { onConflict: 'clerk_id' });
  }

  return NextResponse.json({ received: true });
}
