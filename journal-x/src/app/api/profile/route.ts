import { auth } from '@clerk/nextjs/server';
import { getServiceClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getServiceClient();
  const { data } = await supabase.from('trader_profiles').select('*').eq('user_id', userId).single();

  return NextResponse.json(data || { onboardingComplete: false });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const supabase = getServiceClient();

  const { error } = await supabase.from('trader_profiles').upsert({
    user_id: userId,
    name: body.name,
    account_size: body.accountSize,
    trading_style: body.tradingStyle,
    experience: body.experience,
    markets: body.markets,
    max_risk_per_trade: body.maxRiskPerTrade,
    max_daily_loss: body.maxDailyLoss,
    personal_note: body.personalNote,
    onboarding_complete: body.onboardingComplete,
  }, { onConflict: 'user_id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Also update user_settings with risk limits
  await supabase.from('user_settings').upsert({
    user_id: userId,
    settings: {
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
      maxDailyLoss: body.maxDailyLoss || 500,
      maxRiskPerTrade: body.maxRiskPerTrade || 100,
      focusVideoUrl: '',
    },
  }, { onConflict: 'user_id' });

  return NextResponse.json({ success: true });
}
