import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getServiceClient } from '@/lib/supabase';
import { getStripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) return NextResponse.json({ error: 'No signature' }, { status: 400 });

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET || '');
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const clerkUserId = session.metadata?.clerk_user_id;

    if (clerkUserId) {
      const supabase = getServiceClient();
      if (!supabase) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
      await supabase
        .from('users')
        .update({
          paid: true,
          stripe_customer_id: session.customer as string,
        })
        .eq('clerk_id', clerkUserId);
    }
  }

  return NextResponse.json({ received: true });
}
