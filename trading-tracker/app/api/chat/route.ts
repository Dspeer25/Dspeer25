import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { messages, tradesContext } = await req.json();

    const tradeCount = tradesContext
      ? tradesContext.split("\n").filter(Boolean).length
      : 0;

    const system = `You are a trading analysis assistant for this user's personal trading journal. \
You have access to their complete trade history (${tradeCount} trades) listed below. \
Answer questions directly and concisely. When relevant, reference specific trades by date, ticker, \
or P&L. Do not pad answers with disclaimers or preamble.

TRADE HISTORY:
${tradesContext ?? "No trades logged yet."}`;

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system,
      messages,
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    return NextResponse.json({ content: text });
  } catch (err) {
    console.error("[api/chat]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
