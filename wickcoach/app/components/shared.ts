export const fm = "'DM Mono', monospace";
export const fd = "'Chakra Petch', sans-serif";
export const teal = "#00d4a0";

export interface Trade {
  id: string;
  ticker: string;
  companyName: string;
  date: string;
  time: string;
  strategy: string;
  direction: 'LONG' | 'SHORT';
  contracts: number;
  entryPrice: number;
  exitPrice: number;
  pl: number;
  plPercent: number;
  riskAmount: number;
  riskReward: string;
  journal: string;
  screenshot?: string;
  aiScore?: number;
  result: 'WIN' | 'LOSS' | 'BREAKEVEN';
}

export function formatDollar(n: number): string {
  const sign = n >= 0 ? '+' : '-';
  const abs = Math.abs(n);
  if (abs % 1 === 0) return sign + '$' + abs.toLocaleString();
  return sign + '$' + abs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export interface Goal {
  id: string;
  title: string;
  context: string[];
  aiResponses: string[];
  contextComplete: boolean;
  actionItems: string[];
  createdAt: string;
  goalType: string;
}

export const GOAL_TYPES = ['Trade Management', 'Entry Criteria', 'Patience / Setup', 'Risk Management', 'Psychology', 'General'];

export const DEFAULT_GOALS: Goal[] = [
  { id: 'g1', title: 'LET TRADES BREATHE 3+ WHEN AT BREAK-EVEN', context: [], aiResponses: [], contextComplete: false, actionItems: [], createdAt: new Date().toISOString(), goalType: 'Trade Management' },
  { id: 'g2', title: '5M AND 13/15M CONFIRMATION BEHIND ALL TRADES', context: [], aiResponses: [], contextComplete: false, actionItems: [], createdAt: new Date().toISOString(), goalType: 'Entry Criteria' },
  { id: 'g3', title: 'AT OR NEAR 20MA, WILL WAIT FOR PULLBACK IF FAR', context: [], aiResponses: [], contextComplete: false, actionItems: [], createdAt: new Date().toISOString(), goalType: 'Patience / Setup' },
];

