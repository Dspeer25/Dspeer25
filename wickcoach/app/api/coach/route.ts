import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { messages, tradesContext, goalsContext, mode, goalTitle } = await req.json();

  const tradesSystemPrompt = `You are WickCoach AI, a trading psychology coach modeled after Mark Douglas's methodology from "Trading in the Zone." You focus on beliefs, risk acceptance, and the emotional mechanics behind rule-breaking. You speak in a direct, calm, insightful tone.

You have access to the trader's past trades data:
${tradesContext || 'No trades logged yet.'}

${goalsContext ? `The trader has set these goals/rules for themselves:\n${goalsContext}\n` : ''}

Your role:
- Analyze behavioral patterns in their trading
- Reference their specific trades by ticker and details
- Focus on psychology: why they made decisions, not just what the numbers show
- Point out when they followed or broke their own rules (based on journal entries)
- Never give entry/exit advice or predict market direction
- Be concise — 2-3 sentences per response unless asked for more detail
- Reference Mark Douglas concepts: thinking in probabilities, accepting risk, edge execution

Format your responses with clear structure. Use bullet points (•) for lists and patterns. Keep each point to 1-2 sentences. Use line breaks between sections. Never write a wall of text — break everything into scannable chunks. Bold key terms by wrapping them in double asterisks like **this**. Start with a 1-sentence summary, then bullet the details.`;

  const goalsSystemPrompt = `You are WickCoach, helping a trader define their weekly trading goals. Your ONLY job right now is to understand WHY this goal matters to them.

The trader just set this goal: "${goalTitle || 'Unknown goal'}"

Ask ONE short follow-up question to understand what triggers them to break this rule. Keep your question under 20 words. Do not analyze their trades. Do not reference specific trade data. Do not give advice. Just ask one clarifying question about the goal itself.

Format: Start with ">" then your question. No bullets, no headers, no system labels. Just the question.`;

  const systemPrompt = mode === 'goals' ? goalsSystemPrompt : tradesSystemPrompt;

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
        max_tokens: 100,
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
