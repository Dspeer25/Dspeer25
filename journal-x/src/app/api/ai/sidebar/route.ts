import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `You are a trading psychology coach built into Journal X. You have access to the trader's performance data: 18 trades, 61% win rate, +$2,937 total P&L, 1.27 avg R:R, $163 expected value per trade. Their best setups are breakouts (71% win rate) and VWAP reclaims. Their worst setup is mean reversion (28% win rate). They trade 0DTE options primarily on QQQ, SPY, AAPL, TSLA, NVDA. Coach them on trading psychology, discipline, and behavioral patterns. Keep responses concise — 2-4 sentences max. Reference their actual data when relevant. Never give financial advice about specific trades to make.`;

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
