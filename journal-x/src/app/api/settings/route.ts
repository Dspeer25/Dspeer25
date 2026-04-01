import { auth } from '@clerk/nextjs/server';
import { getServiceClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const defaultSettings = {
  customFields: [
    { id: 'setup', label: 'Setup', type: 'select', options: ['Breakout', 'Pullback', 'Reversal', 'Momentum', 'Range'], description: 'The trade setup pattern' },
    { id: 'market_condition', label: 'Market Condition', type: 'select', options: ['Trending', 'Ranging', 'Volatile', 'Low Volume'], description: 'Overall market environment' },
    { id: 'confidence', label: 'Confidence', type: 'select', options: ['High', 'Medium', 'Low'], description: 'Pre-trade confidence level' },
  ],
  gradeDefinitions: [
    { grade: 'A', description: 'Perfect execution. Followed plan exactly.' },
    { grade: 'B', description: 'Good execution. Minor deviations.' },
    { grade: 'C', description: 'Average. Some rules broken.' },
    { grade: 'D', description: 'Poor execution. Major deviations.' },
    { grade: 'F', description: 'No plan followed. Revenge/impulse trade.' },
  ],
  maxDailyLoss: 500,
  focusVideoUrl: '',
};

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getServiceClient();
  if (!supabase) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  const { data } = await supabase.from('user_settings').select('settings').eq('user_id', userId).single();

  return NextResponse.json(data?.settings || defaultSettings);
}

export async function PUT(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const settings = await req.json();
  const supabase = getServiceClient();
  if (!supabase) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

  const { error } = await supabase
    .from('user_settings')
    .upsert({ user_id: userId, settings }, { onConflict: 'user_id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
