import { auth } from '@clerk/nextjs/server';
import { getServiceClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const date = req.nextUrl.searchParams.get('date');
  if (!date) return NextResponse.json({ error: 'Date required' }, { status: 400 });

  const supabase = getServiceClient();
  const { data } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .single();

  return NextResponse.json(data || { date, observations: '', end_of_day_review: '', weekly_goals: [] });
}

export async function PUT(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const supabase = getServiceClient();

  const { error } = await supabase
    .from('journal_entries')
    .upsert({
      user_id: userId,
      date: body.date,
      observations: body.observations,
      end_of_day_review: body.endOfDayReview,
      weekly_goals: body.weeklyGoals,
    }, { onConflict: 'user_id,date' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
