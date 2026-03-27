import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { messages } = await req.json();
  const supabase = getServiceClient();

  // Get trader context
  const [profileRes, tradesRes, settingsRes] = await Promise.all([
    supabase.from('trader_profiles').select('*').eq('user_id', userId).single(),
    supabase.from('trades').select('*').eq('user_id', userId).order('date', { ascending: false }).limit(50),
    supabase.from('user_settings').select('settings').eq('user_id', userId).single(),
  ]);

  const profile = profileRes.data;
  const trades = tradesRes.data || [];
  const settings = settingsRes.data?.settings;

  // Build context for AI
  const tradeStats = trades.length > 0 ? {
    totalTrades: trades.length,
    totalPnl: trades.reduce((s: number, t: { dollar_pnl: number }) => s + Number(t.dollar_pnl), 0),
    wins: trades.filter((t: { result: string }) => t.result === 'W').length,
    losses: trades.filter((t: { result: string }) => t.result === 'L').length,
    recentTrades: trades.slice(0, 10).map((t: { date: string; ticker: string; result: string; dollar_pnl: number; rr: number }) => ({
      date: t.date, ticker: t.ticker, result: t.result, pnl: t.dollar_pnl, rr: t.rr,
    })),
  } : null;

  const systemPrompt = `You are the Journal X AI trading coach. You are direct, honest, and accountability-focused.
You have a Mark Douglas influence — you understand that trading success comes from disciplined execution, not predictions.

KEY PRINCIPLES:
- Trading is a probability game. Process over outcomes.
- Losses are the cost of doing business when they follow the plan.
- Unplanned trades and rule violations are the real enemy.
- Consistency and discipline separate profitable traders from the rest.

TRADER PROFILE:
${profile ? `Name: ${profile.name}, Account: $${profile.account_size}, Style: ${profile.trading_style}, Experience: ${profile.experience}, Max Risk/Trade: $${profile.max_risk_per_trade}, Max Daily Loss: $${profile.max_daily_loss}, Their words: "${profile.personal_note}"` : 'No profile set up yet.'}

TRADING STATS:
${tradeStats ? `Total trades: ${tradeStats.totalTrades}, PnL: $${tradeStats.totalPnl.toFixed(2)}, Win rate: ${((tradeStats.wins / tradeStats.totalTrades) * 100).toFixed(1)}%, Recent trades: ${JSON.stringify(tradeStats.recentTrades)}` : 'No trades logged yet.'}

RULES:
- Be concise. Traders don't want essays.
- Reference their actual data when giving advice.
- If they broke a rule, call it out — but constructively.
- Push them toward discipline, not just motivation.
- When they ask about performance, use real numbers from their data.`;

  // Call Claude API
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ message: 'AI is not configured yet. Add your ANTHROPIC_API_KEY to environment variables.' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages.map((m: { role: string; content: string }) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    const data = await response.json();
    const aiMessage = data.content?.[0]?.text || 'I had trouble processing that.';
    return NextResponse.json({ message: aiMessage });
  } catch {
    return NextResponse.json({ message: 'AI service temporarily unavailable.' });
  }
}
