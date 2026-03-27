import { auth } from '@clerk/nextjs/server';
import { getServiceClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('trades')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from('trades')
    .insert({
      user_id: userId,
      date: body.date,
      ticker: body.ticker,
      time: body.time,
      trade_type: body.tradeType,
      direction: body.direction || 'Long',
      entry_price: body.entryPrice || 0,
      exit_price: body.exitPrice || 0,
      position_size: body.positionSize || 0,
      initial_risk: body.initialRisk,
      result: body.result,
      dollar_pnl: body.dollarPnl,
      rr: body.rr,
      notes: body.notes,
      starred: body.starred || false,
      grade: body.grade || '',
      custom_fields: body.customFields || {},
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from('trades')
    .update({
      date: body.date,
      ticker: body.ticker,
      time: body.time,
      trade_type: body.tradeType,
      direction: body.direction || 'Long',
      entry_price: body.entryPrice || 0,
      exit_price: body.exitPrice || 0,
      position_size: body.positionSize || 0,
      initial_risk: body.initialRisk,
      result: body.result,
      dollar_pnl: body.dollarPnl,
      rr: body.rr,
      notes: body.notes,
      starred: body.starred,
      grade: body.grade,
      custom_fields: body.customFields,
    })
    .eq('id', body.id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await req.json();
  const supabase = getServiceClient();

  const { error } = await supabase
    .from('trades')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
