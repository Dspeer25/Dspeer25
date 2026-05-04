export type TradeSummary = {
  date: string;
  ticker: string;
  time: string;
  tradeType: string;
  event: string;
  location: string;
  state: string;
  initialRisk: string;
  result: "W" | "L" | "BE" | "";
  amount: string;
  rrRatio: string;
  notes: string;
};

export function tradesToContext(trades: TradeSummary[]): string {
  if (trades.length === 0) return "No trades logged yet.";
  return trades
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => {
      const sign = e.result === "W" ? "+" : e.result === "L" ? "-" : "";
      const pnl = e.amount ? `${sign}$${e.amount}` : "—";
      const rr = e.rrRatio && e.rrRatio !== "0" ? ` | ${e.rrRatio}R` : "";
      const note = e.notes ? ` | "${e.notes.slice(0, 120)}"` : "";
      return `${e.date} ${e.time} | ${e.ticker} | ${e.tradeType} | ${e.event} | ${e.location}/${e.state} | Risk $${e.initialRisk} | ${e.result || "?"} | ${pnl}${rr}${note}`;
    })
    .join("\n");
}
