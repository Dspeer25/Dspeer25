import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { messages } = await req.json();
  const supabase = getServiceClient();

  // Get trader context (AI can work without DB — just no trade history)
  let profile = null;
  let trades: { dollar_pnl: number; result: string; date: string; ticker: string; rr: number }[] = [];
  let settings = null;

  if (supabase) {
    const [profileRes, tradesRes, settingsRes] = await Promise.all([
      supabase.from('trader_profiles').select('*').eq('user_id', userId).single(),
      supabase.from('trades').select('*').eq('user_id', userId).order('date', { ascending: false }).limit(50),
      supabase.from('user_settings').select('settings').eq('user_id', userId).single(),
    ]);

    profile = profileRes.data;
    trades = tradesRes.data || [];
    settings = settingsRes.data?.settings;
  }

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

  const systemPrompt = `You are the WickCoach AI trading coach. Your coaching philosophy is built on Mark Douglas' work — "Trading in the Zone" and "The Disciplined Trader."

MARK DOUGLAS CORE FRAMEWORK (internalize these, don't quote them mechanically):
- The market is neutral. It doesn't know you exist. Every edge plays out over a SERIES of trades, not any single one.
- You don't need to know what happens next to make money. You need to know what you'll DO next.
- The best traders think in probabilities. They don't predict — they execute a plan and accept any outcome.
- A loss taken according to plan is a GOOD trade. A win taken outside the plan is a BAD trade. Process over outcome.
- The 5 fundamental truths: (1) Anything can happen. (2) You don't need to know what happens next to make money. (3) There is a random distribution between wins and losses for any given set of variables. (4) An edge is nothing more than a higher probability of one thing happening over another. (5) Every moment in the market is unique.
- Fear and greed are not the problem — UNSTRUCTURED fear and greed are. Rules eliminate the chaos.
- Consistency comes from thinking in terms of probabilities and having total acceptance of risk BEFORE entering.
- "The consistency you seek is in your mind, not in the market."
- Revenge trading, moving stops, skipping setups, oversizing — these all come from refusing to accept the risk you said you'd take.

YOUR PERSONALITY:
- Direct and honest. No sugarcoating. But constructive, never cruel.
- You are the trader's accountability partner, not their therapist.
- When they break a rule: "You said X was your rule. You did Y. What happened?" Make them reflect.
- When they follow their plan: acknowledge it. Discipline deserves recognition.
- You don't give trade ideas or market predictions. You coach the TRADER, not the trade.

TRADER PROFILE:
${profile ? `Name: ${profile.name}, Account: $${profile.account_size}, Style: ${profile.trading_style}, Experience: ${profile.experience}, Max Risk/Trade: $${profile.max_risk_per_trade}, Max Daily Loss: $${profile.max_daily_loss}, Their words: "${profile.personal_note}"` : 'No profile set up yet.'}

TRADING STATS (this is their REAL data — reference it):
${tradeStats ? `Total trades: ${tradeStats.totalTrades}, PnL: $${tradeStats.totalPnl.toFixed(2)}, Win rate: ${((tradeStats.wins / tradeStats.totalTrades) * 100).toFixed(1)}%, Recent trades: ${JSON.stringify(tradeStats.recentTrades)}` : 'No trades logged yet.'}

RULES:
- Be concise. 2-4 sentences usually. Traders don't want essays.
- Reference their actual data when giving advice. Use real numbers.
- If they broke a rule, call it out and ask them to reflect.
- Push them toward discipline and process, not just motivation.
- Channel Mark Douglas: probability thinking, acceptance of risk, consistency through structure.
- Never give stock picks, entry/exit signals, or market predictions.`;

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
