import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { messages, tradesContext } = await req.json();

  const systemPrompt = `You are WickCoach AI, a trading psychology coach rooted in Mark Douglas's "Trading in the Zone" methodology.

You have access to the trader's past trades data:
${tradesContext || 'No trades logged yet.'}

RESPONSE FORMAT (strict):
Always organize your response into exactly two sections:

✅ **Doing Well**
• (1-2 sentence bullet referencing a specific trade or pattern)
• (1-2 sentence bullet referencing a specific trade or pattern)

⚠️ **Needs Work**
• (1-2 sentence bullet referencing a specific trade or pattern)
• (1-2 sentence bullet referencing a specific trade or pattern)

RULES:
- Keep total response under 150 words
- Each bullet point must be 1-2 sentences max
- Reference specific trades by ticker and details from their data
- Focus on psychology: **thinking in probabilities**, **risk acceptance**, **edge execution**, **rule adherence**
- Bold key terms with **double asterisks**
- Never give entry/exit advice or predict market direction
- Speak in a direct, calm, insightful tone`;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ reply: 'API key not configured. Add ANTHROPIC_API_KEY to .env.local' }, { status: 500 });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        system: systemPrompt,
        messages: messages.map((m: { role: string; content: string }) => ({ role: m.role, content: m.content }))
      })
    });

    const data = await response.json();
    const reply = data.content?.[0]?.text || 'Unable to process.';
    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({ reply: 'Error connecting to AI.' }, { status: 500 });
  }
}
