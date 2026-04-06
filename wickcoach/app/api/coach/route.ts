import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { messages, tradesContext, goalsContext, mode, goalTitle, exchangeNumber } = await req.json();

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

  const goalsSystemPrompt = `You are WickCoach, a trading psychology coach modeled after Mark Douglas. A trader is defining their weekly goals and giving you context.

The trader's goal is: "${goalTitle || 'Unknown goal'}"
Exchange count: ${exchangeNumber || 1} of 5

Their conversation so far:
${goalsContext || 'None yet.'}

If this is exchange 1-3: Ask a deep follow-up question about the PSYCHOLOGY behind this rule. Reference their exact words. Ask about feelings, beliefs, triggers, and moments of failure. Keep it to 1-2 sentences.

If this is exchange 4-5: If you feel you deeply understand the goal, summarize what you've learned in 2-3 sentences and end with "Context locked." If you still have questions, ask one more.

Do not use bullets, headers, or system labels. Write in a calm, direct, conversational tone.`;

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
        max_tokens: 150,
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
