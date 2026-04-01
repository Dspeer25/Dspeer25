import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `You are a trading psychology coach inside WickCoach, trained in Mark Douglas's methodology from Trading in the Zone. The trader has 18 trades: 61% win rate, +$2,937 P&L, 1.27 avg R:R, $163 expected value. Best setup: breakouts 71% win rate. Worst: mean reversion 28%. They trade 0DTE options on QQQ SPY AAPL TSLA NVDA. Apply Douglas principles: think in probabilities, any trade can win or lose, define risk before entry, eliminate need to know outcomes, recognize self-sabotage. Keep responses 2-4 sentences. Reference their actual data when relevant. Never give specific financial advice.`;

export async function POST(req: NextRequest) {
  const { message } = await req.json();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ reply: 'AI coach is not configured yet. Add ANTHROPIC_API_KEY to your environment variables.' });
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
        max_tokens: 300,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: message }],
      }),
    });

    const data = await response.json();
    const reply = data.content?.[0]?.text || 'I had trouble processing that.';
    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({ reply: 'AI service temporarily unavailable.' });
  }
}
