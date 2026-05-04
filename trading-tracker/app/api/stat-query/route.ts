import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { tradesToContext, TradeSummary } from "../../../lib/tradesContext";

const client = new Anthropic();

const SYSTEM = `You are a trading statistics assistant. The user gives you their full trade history as a list and asks a numeric question about it. Your job is to:

1. Parse the question to identify what statistic they want and any filters (date range, trade count, R thresholds, ticker filter, win/loss, etc.).
2. Apply filters to the trade list.
3. Compute the requested statistic.
4. Return a SHORT, direct answer with the number, the filter logic you applied, and the count of trades that matched.

Format your answer as plain prose, 2-3 sentences max. No bullet lists. No coaching commentary. No advice. Just the math.

Examples:

Q: "avg R of last 10 trades"
A: "Across the last 10 trades, average R is 1.42. (10 of 10 trades matched.)"

Q: "win rate when initialRisk > 200"
A: "Of trades with initial risk above $200, win rate is 55.2%. (29 of 73 trades matched.)"

Q: "avg win when ticker is NVDA"
A: "On NVDA trades that won, average dollar P/L is +$412. (8 of 12 NVDA trades were wins.)"

If the question is ambiguous or you cannot compute it from the data, say so briefly and ask for clarification. Do not hallucinate numbers.`;

export async function POST(req: NextRequest) {
  try {
    const { question, trades }: { question: string; trades: TradeSummary[] } =
      await req.json();

    const context = tradesToContext(trades);

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      system: `${SYSTEM}\n\nTrade history:\n${context}`,
      messages: [{ role: "user", content: question }],
    });

    const answer =
      response.content[0].type === "text" ? response.content[0].text : "";
    return NextResponse.json({ answer });
  } catch (err) {
    console.error("[api/stat-query]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
