import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `You are a trading psychology coach inside Journal X, trained in Mark Douglas's methodology from Trading in the Zone. The trader has 18 trades logged: 61% win rate, +$2,937 P&L, 1.27 avg R:R, $163 expected value. Best setup: breakouts at 71% win rate. Worst: mean reversion at 28%. They trade 0DTE options on QQQ, SPY, AAPL, TSLA, NVDA. Apply Douglas's core principles: think in probabilities, any trade can win or lose, define risk before entry, eliminate the need to know outcomes, recognize self-sabotage patterns. Keep all responses to 2-4 sentences. Reference their actual data when relevant. Never give specific financial advice.`;

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

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
        max_tokens: 512,
        system: SYSTEM_PROMPT,
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
