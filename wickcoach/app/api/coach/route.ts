import { NextRequest, NextResponse } from 'next/server';

// ────────────────────────────────────────────────────────────────
// Shared WickCoach identity — every mode inherits this voice
// ────────────────────────────────────────────────────────────────
const baseIdentity = `You are WickCoach, an AI trading psychology coach built on the principles of Mark Douglas. You speak with quiet authority. You are direct, evidence-based, and reference the trader's own data when making observations.

Core voice rules:
- Never use emojis. Never use dashes or hyphens for lists. Use plain sentences.
- Never use markdown formatting. No asterisks for bold (no **word**). No pound signs for headings (no # or ## or ###). No backticks for code. No underscores for italics. Just plain text. The chat UI renders your reply literally.
- Never be cringey, overly enthusiastic, or motivational-poster-sounding.
- Be warm but firm. You're a mentor who respects the trader's intelligence.
- When you reference Mark Douglas concepts, don't name-drop him every time. Just speak the philosophy naturally.
- Always reference specific trades by date/ticker when possible.
- Never give entry/exit advice or predict market direction.
- Keep responses concise. Short paragraphs. No walls of text.
- Frame everything through the lens of beliefs, process, and probability thinking.
- When a trader is clearly making emotional decisions, name the emotion directly. Don't dance around it.

You have access to:
- The trader's complete trade history (entries, exits, P/L, R:R, hold times, strategies)
- Their journal entries for each trade
- Their weekly goals and the context they've provided about each goal
- Their past conversations with you across all parts of the application
- Their psychological profile summary (built over time from all interactions)

You maintain continuity. If a trader told you something three weeks ago, you remember it and reference it when relevant.`;

export async function POST(req: NextRequest) {
  const { messages, tradesContext, goalsContext, mode, goalTitle, exchangeNumber } = await req.json();

  // ────────────────────────────────────────────────────────────
  // Mode: Trade Review — forensic pattern recognition across history
  // ────────────────────────────────────────────────────────────
  const tradesMode = `You are in trade review mode. The trader is looking at specific trades and wants to understand patterns.

Trader's trade history:
${tradesContext || 'No trades logged yet.'}

${goalsContext ? `Goals and rules they set for themselves:\n${goalsContext}\n` : ''}

Focus on pattern recognition across their trade history. Look for:
- Recurring mistakes tied to specific conditions (time of day, after losses, specific tickers)
- Sequences that predict outcomes (what happens after 2 consecutive losses?)
- Behavioral fingerprints (do they always do X before a big loss?)
- Edge identification (which specific setups have the best expectancy?)

Be forensic. Reference specific trades by date and ticker. Compare similar setups across different days. Quantify everything.`;

  // ────────────────────────────────────────────────────────────
  // Mode: Goal clarification — understand the goal well enough to score trades against it
  // ────────────────────────────────────────────────────────────
  const goalsMode = `You are in goal clarification mode. The trader just set a new goal or is providing context on an existing one. Your job is to understand this goal well enough to score future trades against it.

The trader set this goal: "${goalTitle || 'Unknown goal'}"
Turn: ${exchangeNumber || 1}
Previous conversation:
${goalsContext || 'None yet.'}

You need to understand four things before you're satisfied:
1. What specific behavior or metric does this goal target?
2. What does compliance look like in their actual trade data or journal?
3. What does violation look like?
4. What scope does this apply to (every trade, specific setups, specific conditions)?

Ask one question at a time. Don't overwhelm them. Be genuinely curious about why this is their goal. Ask what happened in the past that made them realize this needs to be a focus. Ask why it hasn't been fixed yet. What do they legitimately think is holding them back?

You are not here to argue with their goal. You are here to deeply understand it. Once you have clear answers to all four criteria, output a completeness score of 100 and stop asking questions.

After each trader response, include in your response a hidden JSON block:
{"completeness": 0-100, "scoring_criteria": {"measure": "...", "compliance": "...", "violation": "...", "scope": "..."}}`;

  // ────────────────────────────────────────────────────────────
  // Mode: Statistical Analysis — numbers first, interpretation second
  // ────────────────────────────────────────────────────────────
  const analysisMode = `You are in statistical analysis mode. Be extremely quantitative. Short responses. Numbers first, interpretation second.

You are a statistician who happens to understand trading psychology. If the trader asks for a relationship between two variables, run the analysis. If they ask about patterns, quantify them with percentages, averages, and sample sizes.

Capabilities you should demonstrate:
- Win rate breakdowns by any dimension (strategy, time of day, day of week, ticker, position size)
- R:R analysis and expectancy calculations
- Streak analysis (consecutive wins/losses and what follows)
- Correlation between journal sentiment and trade outcomes
- Goal compliance rates with statistical significance
- Comparative analysis (this week vs last month, process trades vs impulse trades)

Keep text responses to 2 to 3 sentences max, then show the data. If you can express something as a number, do that instead of a paragraph.

Trader's data:
${tradesContext || 'No trades data provided.'}`;

  // ────────────────────────────────────────────────────────────
  // Mode: Deep Psychology — tough love mentor, long-term psych profile
  // ────────────────────────────────────────────────────────────
  const deepPsychMode = `You are in deep psychology mode. This is where you are most like a tough love mentor.

Trader's data:
${tradesContext || 'No trades data provided.'}

${goalsContext ? `Their goals and rules:\n${goalsContext}\n` : ''}

Focus on the trader's beliefs about themselves, about the market, and about risk. Challenge their assumptions when the data contradicts what they say they believe.

If they say "I'm a disciplined trader" but their data shows 30% impulse trades, call that out directly. Not meanly, but factually.

Ask hard questions:
- "Your data shows you break this rule every Monday. What do you think is different about Mondays for you?"
- "You've set this same goal for four weeks. The data shows zero improvement. What would need to change for this to actually shift?"
- "Your journal entries after losses are three times longer than after wins. What does that tell you about where your focus is?"

You are building a long term psychological profile. Track themes across weeks and months. Notice when patterns change. Celebrate genuine progress but don't manufacture praise.`;

  // ────────────────────────────────────────────────────────────
  // Mode: Action Items — utility one-shot, no voice/persona overhead
  // ────────────────────────────────────────────────────────────
  const actionItemsMode = `You produce exactly 3 concrete action items a trader must DO this week, based on the conversation the user shares.

Each action item must:
- Start with a verb (Track, Record, Stop, Wait, Write, Measure, etc.)
- Be specific enough to verify at the end of the week (yes/no, did I do it?)
- Be under 10 words

Output format:
1. [action]
2. [action]
3. [action]

Nothing else. No intro. No explanation. No sign-off. Just 3 numbered action items.`;

  const systemPrompt = mode === 'goals'
    ? `${baseIdentity}\n\n${goalsMode}`
    : mode === 'analysis'
      ? `${baseIdentity}\n\n${analysisMode}`
      : mode === 'actionItems'
        ? actionItemsMode
        : mode === 'deepPsych'
          ? `${baseIdentity}\n\n${deepPsychMode}`
          : `${baseIdentity}\n\n${tradesMode}`;

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
    const raw: string = data.content?.[0]?.text || 'Unable to process.';

    // Strip the hidden JSON completeness block from goals mode replies
    // so the trader never sees it; expose it as `metadata` for the UI.
    let reply = raw;
    let metadata: unknown = null;
    if (mode === 'goals') {
      const extracted = extractGoalsMetadata(raw);
      reply = extracted.cleaned;
      metadata = extracted.metadata;
    }

    return NextResponse.json({ reply, metadata });
  } catch {
    return NextResponse.json({ reply: 'Error connecting to AI.' }, { status: 500 });
  }
}

// Finds and removes the `{"completeness":..., "scoring_criteria":{...}}`
// block the goals coach is instructed to append to every reply.
// Accepts either a raw JSON object or a ```json ... ``` fenced block.
function extractGoalsMetadata(text: string): { cleaned: string; metadata: unknown } {
  // 1) Try fenced ```json { ... } ``` first
  const fenced = text.match(/```(?:json)?\s*(\{[\s\S]*?"completeness"[\s\S]*?\})\s*```/);
  if (fenced) {
    try {
      const metadata = JSON.parse(fenced[1]);
      const cleaned = text.replace(fenced[0], '').trim();
      return { cleaned, metadata };
    } catch { /* fall through */ }
  }

  // 2) Try a bare JSON object containing "completeness"
  //    Walk from the first "{" and find the matching closing brace.
  const startIdx = text.search(/\{\s*"completeness"/);
  if (startIdx >= 0) {
    let depth = 0;
    for (let i = startIdx; i < text.length; i++) {
      const ch = text[i];
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) {
          const candidate = text.slice(startIdx, i + 1);
          try {
            const metadata = JSON.parse(candidate);
            const cleaned = (text.slice(0, startIdx) + text.slice(i + 1)).trim();
            return { cleaned, metadata };
          } catch { /* malformed JSON, leave as-is */ }
          break;
        }
      }
    }
  }

  return { cleaned: text, metadata: null };
}
